package expo.modules.aurora

import android.app.Activity
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.WindowManager
import java.lang.ref.WeakReference

/**
 * Lets the app's screen show over the lock screen and wake the display, only while Aurora rings.
 * The rest of the time the app stays behind the lock (selfies and records are private).
 * The activity is tracked by AuroraPackage's lifecycle listener.
 */
object AuroraLockScreen {
  private var activityRef: WeakReference<Activity>? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  fun track(activity: Activity) {
    activityRef = WeakReference(activity)
  }

  fun untrack(activity: Activity) {
    if (activityRef?.get() === activity) activityRef = null
  }

  /** Matches the flags to the ringing state. Safe from any thread. */
  fun sync(isRinging: Boolean) {
    val activity = activityRef?.get() ?: return
    mainHandler.post { apply(activity, isRinging) }
  }

  fun apply(activity: Activity, isRinging: Boolean) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      activity.setShowWhenLocked(isRinging)
      activity.setTurnScreenOn(isRinging)
    } else {
      @Suppress("DEPRECATION")
      val flags = WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
      if (isRinging) activity.window.addFlags(flags) else activity.window.clearFlags(flags)
    }
    if (isRinging) activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    else activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  }
}
