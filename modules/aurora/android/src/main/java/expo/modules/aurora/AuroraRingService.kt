package expo.modules.aurora

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.VibrationAttributes
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat

/** Called on the main thread when Aurora starts ringing, if the app is running. */
object AuroraEvents {
  @Volatile var onRing: (() -> Unit)? = null
}

/**
 * The ringing itself, as a foreground service so Android keeps it alive: the alarm sound looping
 * on the alarm stream at full volume (the user's level comes back when it stops, AuroraVolume),
 * vibration, and the full-screen notification. It stops when the app calls
 * stopRinging (after the mission, a sick day or an alarm pass) or by itself after 10 minutes, so
 * the phone never rings forever.
 */
class AuroraRingService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var player: MediaPlayer? = null
  private var ringtone: Ringtone? = null
  private var vibrator: Vibrator? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private var isActive = false
  private val timeout = Runnable { stopRinging(timedOut = true) }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> stopRinging(timedOut = false)
      else -> startRinging()
    }
    return START_NOT_STICKY
  }

  private fun startRinging() {
    val notification = AuroraNotifications.buildRinging(this)
    val type =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK else 0
    ServiceCompat.startForeground(this, AuroraNotifications.RING_ID, notification, type)
    if (isActive) return
    isActive = true
    instance = this
    AuroraStore(this).ringingSince = System.currentTimeMillis()
    acquireWakeLock()
    AuroraVolume.raise(this)
    playSound()
    vibrate()
    handler.removeCallbacks(timeout)
    handler.postDelayed(timeout, MAX_RING_MS)
    AuroraLockScreen.sync(true)
    handler.post { AuroraEvents.onRing?.invoke() }
  }

  private fun stopRinging(timedOut: Boolean) {
    isActive = false
    handler.removeCallbacks(timeout)
    releaseSound()
    AuroraVolume.restore(this)
    vibrator?.cancel()
    vibrator = null
    wakeLock?.let { if (it.isHeld) it.release() }
    wakeLock = null
    AuroraStore(this).ringingSince = 0L
    AuroraLockScreen.sync(false)
    ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
    AuroraNotifications.cancelAll(this)
    if (timedOut) AuroraNotifications.showTimedOut(this)
    if (instance === this) instance = null
    stopSelf()
  }

  override fun onDestroy() {
    handler.removeCallbacks(timeout)
    releaseSound()
    AuroraVolume.restore(this)
    vibrator?.cancel()
    wakeLock?.let { if (it.isHeld) it.release() }
    if (instance === this) instance = null
    super.onDestroy()
  }

  private fun acquireWakeLock() {
    val power = getSystemService(Context.POWER_SERVICE) as PowerManager
    wakeLock = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "vinco:aurora").apply {
      acquire(MAX_RING_MS + 5_000L)
    }
  }

  private fun playSound() {
    val attributes = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_ALARM)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build()
    val uri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_ALARM)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
    try {
      player = MediaPlayer().apply {
        setAudioAttributes(attributes)
        setDataSource(this@AuroraRingService, uri)
        isLooping = true
        prepare()
        start()
      }
    } catch (error: Exception) {
      Log.w(TAG, "MediaPlayer failed, trying the ringtone player.", error)
      releaseSound()
      ringtone = RingtoneManager.getRingtone(this, uri)?.apply {
        audioAttributes = attributes
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) isLooping = true
        play()
      }
    }
  }

  private fun releaseSound() {
    player?.let {
      try {
        if (it.isPlaying) it.stop()
      } catch (_: IllegalStateException) {
        // Already stopped.
      }
      it.release()
    }
    player = null
    ringtone?.stop()
    ringtone = null
  }

  private fun vibrate() {
    val device = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }
    if (!device.hasVibrator()) return
    val pattern = longArrayOf(0L, 800L, 600L)
    // Marked as an alarm, so Do Not Disturb's alarm rule lets it through and the mission's short
    // taps of haptic feedback don't cancel it.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      device.vibrate(
        VibrationEffect.createWaveform(pattern, 1),
        VibrationAttributes.createForUsage(VibrationAttributes.USAGE_ALARM)
      )
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val attributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build()
      @Suppress("DEPRECATION")
      device.vibrate(VibrationEffect.createWaveform(pattern, 1), attributes)
    } else {
      @Suppress("DEPRECATION")
      device.vibrate(pattern, 1)
    }
    vibrator = device
  }

  companion object {
    private const val TAG = "VincoAurora"
    private const val ACTION_START = "expo.modules.aurora.START_RINGING"
    private const val ACTION_STOP = "expo.modules.aurora.STOP_RINGING"

    /** The safety stop: Aurora never rings longer than this. */
    const val MAX_RING_MS = 10L * 60L * 1000L

    @Volatile private var instance: AuroraRingService? = null

    fun start(context: Context) {
      val intent = Intent(context, AuroraRingService::class.java).setAction(ACTION_START)
      ContextCompat.startForegroundService(context, intent)
    }

    /**
     * Stops the buzz only, once the mission is under way: the phone is in the user's hand, the
     * sound keeps ringing, and the mission's own haptics (one per step or swing) can be felt.
     */
    fun stopVibrating() {
      val running = instance ?: return
      running.handler.post {
        running.vibrator?.cancel()
        running.vibrator = null
      }
    }

    /** Stops the ringing. Works whether or not the service is still alive. */
    fun stop(context: Context) {
      val running = instance
      if (running != null) {
        running.handler.post { running.stopRinging(timedOut = false) }
        return
      }
      AuroraStore(context).ringingSince = 0L
      AuroraVolume.restore(context)
      AuroraLockScreen.sync(false)
      AuroraNotifications.cancelAll(context)
    }
  }
}
