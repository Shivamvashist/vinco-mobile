package expo.modules.vigil

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.media.AudioManager
import android.os.Build
import android.os.Handler
import android.os.Looper

/** Events for JavaScript (`onFocusEvent`). Set while the module is alive. */
object VigilEvents {
  @Volatile var listener: ((type: String, packageName: String?) -> Unit)? = null

  fun emit(type: String, packageName: String?) {
    try {
      listener?.invoke(type, packageName)
    } catch (_: Exception) {
      // JavaScript gone: the guard never depends on it.
    }
  }
}

/**
 * The focus guard at work, driven by the accessibility service: it hears which app is in front and
 * acts as the session's guard says. Everything runs on the main thread.
 *
 * - Custos: an alert when an app outside the focus opens, the floating timer while outside Vinco,
 *   and a "back to the line" card every 3 minutes spent outside the focus.
 * - Imperium: an app outside the focus gets 3 minutes (a countdown bubble), then the user is sent
 *   back to Vinco and the app rests for 3 minutes.
 * - Silentium: anything outside the focus (home screen and recents included) sends the user back
 *   to Vinco at once, and the notification shade is closed.
 */
class VigilGuard(private val service: AccessibilityService) {
  private val handler = Handler(Looper.getMainLooper())
  private val store = VigilStore(service)
  private val overlay = VigilOverlay(service)
  private val returner = VigilReturner(service, handler, ::currentVerdict)
  private var session: VigilSession? = null
  private var system: VigilSystemApps? = null
  private var current: String? = null
  private var verdict = VigilVerdict.VINCO
  private var lastAlerted: String? = null
  private var outsideSince = 0L

  private val stopAtEnd = Runnable { reload() }
  private val tick = object : Runnable {
    override fun run() {
      onTick()
      // Past the end, onTick has stopped the guard: no more ticks until the next focus.
      if (session != null) handler.postDelayed(this, TICK_MS)
    }
  }

  /** Reads the session from the store (after a start, an end, a reboot or the service connecting). */
  fun reload() {
    handler.removeCallbacks(stopAtEnd)
    handler.removeCallbacks(tick)
    val active = store.activeSession()
    if (active == null) {
      stop()
      return
    }
    val changed = active.startedAt != session?.startedAt || active.guard != session?.guard
    session = active
    if (changed || system == null) {
      system = VigilSystemApps.of(service)
      lastAlerted = null
      outsideSince = 0L
    }
    val untilEnd = (active.endsAt - System.currentTimeMillis()).coerceAtLeast(0L)
    handler.postDelayed(stopAtEnd, untilEnd + 50L)
    handler.post(tick)
    current?.let { onForeground(it, null) }
  }

  fun stop() {
    handler.removeCallbacks(stopAtEnd)
    handler.removeCallbacks(tick)
    returner.cancel()
    session = null
    lastAlerted = null
    outsideSince = 0L
    overlay.hideAll()
  }

  /** A window came to the front. `className` is null when re-checking the app already there. */
  fun onWindow(packageName: String, className: String?) {
    val active = activeOrStop() ?: run {
      if (packageName != VigilApps.SYSTEM_UI) current = packageName
      return
    }
    val sys = system ?: return
    // A call ringing or under way: the guard steps aside completely until it ends.
    if (inCall()) return
    val next = VigilPolicy.classify(packageName, className, active.guard, active.allowedPackages, sys)
    when (next) {
      VigilVerdict.IGNORED -> return
      VigilVerdict.SHADE -> {
        closeShade()
        VigilEvents.emit("appBlocked", packageName)
        return
      }
      else -> {
        current = packageName
        onForeground(packageName, next)
      }
    }
  }

  private fun onForeground(packageName: String, known: VigilVerdict?) {
    val active = session ?: return
    val sys = system ?: return
    val next = known ?: VigilPolicy.classify(packageName, null, active.guard, active.allowedPackages, sys)
    if (next == VigilVerdict.IGNORED || next == VigilVerdict.SHADE) return
    verdict = next
    if (verdict != VigilVerdict.OUTSIDE) {
      outsideSince = 0L
      lastAlerted = null
    }
    when (active.guard) {
      VigilGuardLevel.CUSTOS -> onCustos(packageName, active)
      VigilGuardLevel.IMPERIUM -> onImperium(packageName, active)
      VigilGuardLevel.SILENTIUM -> {
        overlay.hideAll()
        if (verdict == VigilVerdict.OUTSIDE && returner.backToVinco(goHome = false, packageName = packageName)) {
          VigilEvents.emit("appBlocked", packageName)
        }
      }
    }
  }

  private fun onCustos(packageName: String, active: VigilSession) {
    if (verdict == VigilVerdict.VINCO) {
      overlay.hideAll()
      return
    }
    showTimerBubble(active)
    if (verdict == VigilVerdict.OUTSIDE) {
      if (outsideSince == 0L) outsideSince = System.currentTimeMillis()
      if (lastAlerted != packageName) {
        lastAlerted = packageName
        overlay.showCard(active.copy.alertTitle, active.copy.alertBody, null, ALERT_MS, null)
        VigilEvents.emit("nudge", packageName)
      }
    }
  }

  private fun onImperium(packageName: String, active: VigilSession) {
    if (verdict != VigilVerdict.OUTSIDE) {
      // The card (a cooldown notice) hides on its own; the countdown belongs to the app just left.
      overlay.hideBubble()
      return
    }
    val now = System.currentTimeMillis()
    val windows = store.readAppWindows()
    VigilPolicy.prune(windows, now)
    when (val window = VigilPolicy.appWindow(windows[packageName], now)) {
      is VigilAppWindow.Resting -> {
        returner.backToVinco(goHome = true, packageName = packageName)
        overlay.hideBubble()
        overlay.showCard(
          active.copy.alertTitle,
          "${active.copy.cooldown} ${VigilPolicy.formatLeft(window.until - now)}",
          null,
          NOTICE_MS,
          null
        )
        VigilEvents.emit("appBlocked", packageName)
      }
      is VigilAppWindow.Open -> showCountdown(window.endsAt - now, active)
      VigilAppWindow.Fresh -> {
        windows[packageName] = now + VigilPolicy.APP_SESSION_MS
        store.saveAppWindows(windows)
        overlay.showCard(active.copy.alertTitle, active.copy.alertBody, null, ALERT_MS, null)
        showCountdown(VigilPolicy.APP_SESSION_MS, active)
      }
    }
  }

  private fun onTick() {
    val active = activeOrStop() ?: return
    val packageName = current ?: return
    if (inCall()) return
    val now = System.currentTimeMillis()
    when (active.guard) {
      VigilGuardLevel.CUSTOS -> {
        if (verdict == VigilVerdict.VINCO) return
        showTimerBubble(active)
        if (verdict == VigilVerdict.OUTSIDE && outsideSince > 0L && now - outsideSince >= VigilPolicy.NUDGE_EVERY_MS) {
          outsideSince = now
          overlay.showCard(active.copy.nudgeTitle, active.copy.nudgeBody, active.copy.openVinco, NUDGE_MS) {
            returner.backToVinco(goHome = false, packageName = null)
          }
          VigilEvents.emit("nudge", packageName)
        }
      }
      VigilGuardLevel.IMPERIUM -> {
        if (verdict != VigilVerdict.OUTSIDE) return
        val endsAt = store.readAppWindows()[packageName] ?: return
        if (now >= endsAt) {
          overlay.hideAll()
          returner.backToVinco(goHome = true, packageName = packageName)
          VigilEvents.emit("appClosed", packageName)
          // Closed once: the next window event says where the user is now.
          current = null
        } else {
          showCountdown(endsAt - now, active)
        }
      }
      VigilGuardLevel.SILENTIUM -> Unit
    }
  }

  private fun showTimerBubble(active: VigilSession) {
    val left = VigilPolicy.formatLeft(active.endsAt - System.currentTimeMillis())
    overlay.showBubble(left, urgent = false) { returner.backToVinco(goHome = false, packageName = null) }
  }

  private fun showCountdown(leftMs: Long, active: VigilSession) {
    val text = "${active.copy.closingIn} ${VigilPolicy.formatLeft(leftMs)}"
    overlay.showBubble(text, urgent = true) { returner.backToVinco(goHome = false, packageName = null) }
  }

  private fun closeShade() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_DISMISS_NOTIFICATION_SHADE)
    } else {
      service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK)
    }
  }

  /** The session if it still runs. The hard stop: past its end it is cleared and everything lifts. */
  private fun activeOrStop(): VigilSession? {
    val active = session ?: return null
    if (store.isOver(active)) {
      store.clear()
      stop()
      return null
    }
    return active
  }

  private fun inCall(): Boolean {
    val audio = service.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return false
    return when (audio.mode) {
      AudioManager.MODE_RINGTONE, AudioManager.MODE_IN_CALL, AudioManager.MODE_IN_COMMUNICATION -> true
      else -> false
    }
  }

  /** For the returner's follow-up tries: never pull Vinco over a call ringing or under way. */
  private fun currentVerdict(): VigilVerdict =
    if (session == null || inCall()) VigilVerdict.VINCO else verdict

  companion object {
    private const val TICK_MS = 1000L
    private const val ALERT_MS = 3500L
    private const val NOTICE_MS = 3000L
    private const val NUDGE_MS = 15_000L
  }
}
