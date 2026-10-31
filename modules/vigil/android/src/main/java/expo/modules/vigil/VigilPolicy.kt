package expo.modules.vigil

/** What the app now in front means for the focus. */
enum class VigilVerdict {
  /** Vinco itself. */
  VINCO,
  /** A companion, the dialer, calls, emergency or a system dialog. */
  ALLOWED,
  /** The home screen under Custos or Imperium. */
  HOME,
  /** A window that never counts as an app in front: the keyboard, the status bar under the lighter guards. */
  IGNORED,
  /** Silentium: the notification shade (or another system bar window). */
  SHADE,
  /** Outside the focus. */
  OUTSIDE
}

/** Imperium: where an app outside the focus stands now. */
sealed class VigilAppWindow {
  /** First opening (or the last turn and its rest are over): the 3 minutes start now. */
  data object Fresh : VigilAppWindow()

  /** Inside its 3 minutes, which end at `endsAt`. */
  data class Open(val endsAt: Long) : VigilAppWindow()

  /** Its 3 minutes are used: resting until `until`. */
  data class Resting(val until: Long) : VigilAppWindow()
}

/** The rules, kept free of Android calls. */
object VigilPolicy {
  const val NUDGE_EVERY_MS = 3 * 60_000L
  const val APP_SESSION_MS = 3 * 60_000L
  const val APP_COOLDOWN_MS = 3 * 60_000L
  /** A focus can never be longer than this from the moment it is started (3 hours and a margin). */
  const val MAX_FOCUS_MS = 181 * 60_000L
  /** Relaunching Vinco again sooner than this is skipped, so the guard never loops. */
  const val RELAUNCH_DEBOUNCE_MS = 400L

  fun classify(
    packageName: String,
    className: String?,
    guard: VigilGuardLevel,
    allowed: Set<String>,
    system: VigilSystemApps
  ): VigilVerdict {
    if (packageName == system.own) return VigilVerdict.VINCO
    if (packageName in system.keyboards) return VigilVerdict.IGNORED
    if (packageName == VigilApps.SYSTEM_UI) return classifySystemUi(className, guard)
    if (packageName in system.alwaysAllowed || packageName in allowed) return VigilVerdict.ALLOWED
    if (packageName in system.launchers) {
      return if (guard == VigilGuardLevel.SILENTIUM) VigilVerdict.OUTSIDE else VigilVerdict.HOME
    }
    return VigilVerdict.OUTSIDE
  }

  /**
   * The status bar, the shade, the lock screen and the power menu all belong to the system UI.
   * Only Silentium acts on it: recents go back to Vinco, the shade is closed, and the power menu
   * (where emergency calls live on many phones) is always left alone.
   */
  private fun classifySystemUi(className: String?, guard: VigilGuardLevel): VigilVerdict {
    if (guard != VigilGuardLevel.SILENTIUM) return VigilVerdict.IGNORED
    val name = className.orEmpty()
    if (name.contains("GlobalActions", ignoreCase = true) || name.contains("Keyguard", ignoreCase = true)) {
      return VigilVerdict.IGNORED
    }
    if (name.contains("Recents", ignoreCase = true)) return VigilVerdict.OUTSIDE
    return VigilVerdict.SHADE
  }

  /** Imperium: an app's turn, from the moment its last 3 minutes end (null when it has none). */
  fun appWindow(turnEndsAt: Long?, now: Long): VigilAppWindow = when {
    turnEndsAt == null -> VigilAppWindow.Fresh
    now < turnEndsAt -> VigilAppWindow.Open(turnEndsAt)
    now < turnEndsAt + APP_COOLDOWN_MS -> VigilAppWindow.Resting(turnEndsAt + APP_COOLDOWN_MS)
    else -> VigilAppWindow.Fresh
  }

  /** Drops turns whose rest is over, so the store stays small. */
  fun prune(windows: MutableMap<String, Long>, now: Long) {
    windows.entries.removeAll { now >= it.value + APP_COOLDOWN_MS }
  }

  /** The end a focus may have, never more than 3 hours (and a margin) from `now`. */
  fun clampEnd(endsAt: Long, now: Long): Long = minOf(endsAt, now + MAX_FOCUS_MS)

  /** "m:ss" under an hour, "h:mm" from an hour. Counts whole seconds up, so 0:00 shows only at the end. */
  fun formatLeft(ms: Long): String {
    val total = ((ms.coerceAtLeast(0L) + 999L) / 1000L)
    val hours = total / 3600
    val minutes = (total % 3600) / 60
    val seconds = total % 60
    return if (hours > 0) {
      "$hours:${minutes.toString().padStart(2, '0')}"
    } else {
      "$minutes:${seconds.toString().padStart(2, '0')}"
    }
  }
}
