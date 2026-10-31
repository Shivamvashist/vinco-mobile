package expo.modules.vigil

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.Handler
import android.os.SystemClock

/**
 * Brings Vinco back to the front. Debounced (never twice within 400 ms) so the guard can't loop,
 * and checked once more shortly after: if the app outside the focus is still in front (the launch
 * was swallowed), it tries again, at most a few times.
 */
class VigilReturner(
  private val service: AccessibilityService,
  private val handler: Handler,
  private val verdictNow: () -> VigilVerdict
) {
  private var lastLaunchAt = 0L
  private var retriesLeft = 0
  private val followUp = Runnable {
    if (retriesLeft > 0 && verdictNow() == VigilVerdict.OUTSIDE) {
      retriesLeft -= 1
      launch(goHome = false)
      scheduleFollowUp()
    }
  }

  /** Returns true when a launch was made now (false when debounced). */
  fun backToVinco(goHome: Boolean, packageName: String?): Boolean {
    val now = SystemClock.elapsedRealtime()
    if (now - lastLaunchAt < VigilPolicy.RELAUNCH_DEBOUNCE_MS) return false
    lastLaunchAt = now
    launch(goHome)
    if (packageName != null) {
      retriesLeft = MAX_RETRIES
      scheduleFollowUp()
    }
    return true
  }

  fun cancel() {
    handler.removeCallbacks(followUp)
    retriesLeft = 0
  }

  private fun scheduleFollowUp() {
    handler.removeCallbacks(followUp)
    handler.postDelayed(followUp, FOLLOW_UP_MS)
  }

  private fun launch(goHome: Boolean) {
    lastLaunchAt = SystemClock.elapsedRealtime()
    if (goHome) service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_HOME)
    val intent = service.packageManager.getLaunchIntentForPackage(service.packageName) ?: return
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
    try {
      service.startActivity(intent)
    } catch (_: Exception) {
      // Blocked by the system: the follow-up tries again.
    }
  }

  companion object {
    private const val FOLLOW_UP_MS = 900L
    private const val MAX_RETRIES = 3
  }
}
