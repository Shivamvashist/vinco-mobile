package expo.modules.aurora

import android.content.Context
import android.media.AudioManager
import android.util.Log

/**
 * Aurora rings at full alarm volume, then gives the user's own level back.
 *
 * raise() saves the alarm stream's level (in AuroraStore, so a ring cut short by Android killing
 * the app is still put right on the next start or stop) and sets it to the maximum. restore()
 * puts the saved level back. The alarm stream needs no permission; some phones still refuse the
 * change (a Do Not Disturb policy, a work profile, a maker's own rule), so every call is guarded
 * and a refusal only means Aurora rings at the user's level.
 */
object AuroraVolume {
  private const val TAG = "VincoAurora"
  private const val STREAM = AudioManager.STREAM_ALARM

  fun raise(context: Context) {
    val audio = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
    val store = AuroraStore(context)
    try {
      val max = audio.getStreamMaxVolume(STREAM)
      val current = audio.getStreamVolume(STREAM)
      // A level saved by a ring that never finished is the user's real one: keep it.
      if (store.savedAlarmVolume < 0) store.savedAlarmVolume = current
      if (current < max) audio.setStreamVolume(STREAM, max, 0)
    } catch (error: Exception) {
      Log.w(TAG, "The phone refused to raise the alarm volume.", error)
    }
  }

  fun restore(context: Context) {
    val audio = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
    val store = AuroraStore(context)
    val saved = store.savedAlarmVolume
    if (saved < 0) return
    try {
      val max = audio.getStreamMaxVolume(STREAM)
      audio.setStreamVolume(STREAM, saved.coerceIn(0, max), 0)
    } catch (error: Exception) {
      Log.w(TAG, "The phone refused to restore the alarm volume.", error)
    } finally {
      store.savedAlarmVolume = -1
    }
  }
}
