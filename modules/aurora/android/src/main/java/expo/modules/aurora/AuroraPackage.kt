package expo.modules.aurora

import android.app.Activity
import android.content.Context
import android.os.Bundle
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener

/**
 * Hooks into the app's main activity, so that when Aurora rings the activity shows over the lock
 * screen before React Native has even started (the full-screen intent may cold-start the app).
 */
class AuroraPackage : Package {
  override fun createReactActivityLifecycleListeners(
    activityContext: Context?
  ): List<ReactActivityLifecycleListener> = listOf(
    object : ReactActivityLifecycleListener {
      override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
        AuroraLockScreen.track(activity)
        AuroraLockScreen.apply(activity, AuroraStore(activity).isRinging())
      }

      override fun onResume(activity: Activity) {
        AuroraLockScreen.track(activity)
        AuroraLockScreen.apply(activity, AuroraStore(activity).isRinging())
      }

      override fun onDestroy(activity: Activity) {
        AuroraLockScreen.untrack(activity)
      }
    }
  )
}
