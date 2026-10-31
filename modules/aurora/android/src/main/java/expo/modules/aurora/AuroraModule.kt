package expo.modules.aurora

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/** The repeat rule and the notification text, sent with every schedule. */
class SchedulePlan : Record {
  /** Minutes after midnight, or -1 for a one-off ring (the dev test). */
  @Field val minutes: Int = -1

  /** Bit 0 = Monday ... bit 6 = Sunday. */
  @Field val daysMask: Int = 0

  @Field val channelName: String = "Aurora alarm"
  @Field val title: String = "Aurora"
  @Field val body: String = "Time to rise. Open Vinco to stop the alarm."
  @Field val action: String = "Stop"
  @Field val timedOutTitle: String = "Aurora stopped"
  @Field val timedOutBody: String = "It rang for 10 minutes."
}

/**
 * Vinco's alarm, for JavaScript (src/features/aurora/bridge.ts). Android only.
 * Exact alarms, the ring service, lock-screen display and the permission pages.
 */
class AuroraModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("VincoAurora")

    Events("onRing")

    OnCreate {
      AuroraEvents.onRing = { sendEvent("onRing", mapOf("at" to System.currentTimeMillis().toDouble())) }
    }

    OnDestroy {
      AuroraEvents.onRing = null
    }

    AsyncFunction("canScheduleExact") { AuroraScheduler.canScheduleExact(context) }

    AsyncFunction("openExactAlarmSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        openSettings(
          Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${context.packageName}"))
        )
      }
    }

    AsyncFunction("canUseFullScreenIntent") { AuroraNotifications.canUseFullScreenIntent(context) }

    AsyncFunction("openFullScreenIntentSettings") {
      openSettings(AuroraNotifications.fullScreenSettingsIntent(context))
    }

    AsyncFunction("areNotificationsEnabled") { AuroraNotifications.areEnabled(context) }

    AsyncFunction("openNotificationSettings") {
      openSettings(AuroraNotifications.notificationSettingsIntent(context))
    }

    AsyncFunction("schedule") { epochMillis: Double, plan: SchedulePlan ->
      val store = AuroraStore(context)
      store.labels = AuroraLabels(
        channelName = plan.channelName,
        title = plan.title,
        body = plan.body,
        action = plan.action,
        timedOutTitle = plan.timedOutTitle,
        timedOutBody = plan.timedOutBody
      )
      store.repeatMinutes = plan.minutes
      store.repeatDays = plan.daysMask
      AuroraNotifications.ensureChannel(context)
      AuroraScheduler.schedule(context, epochMillis.toLong())
    }

    AsyncFunction("cancel") { AuroraScheduler.cancel(context) }

    AsyncFunction("getNextRing") {
      val next = AuroraStore(context).nextRingAt
      if (next > System.currentTimeMillis()) next.toDouble() else null
    }

    AsyncFunction("isRinging") { AuroraStore(context).isRinging() }

    AsyncFunction("stopRinging") { AuroraRingService.stop(context) }
  }

  private fun openSettings(intent: Intent) {
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      context.startActivity(intent)
    } catch (_: Exception) {
      // Some phones lack the page: fall back to the app's own settings page.
      context.startActivity(
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}"))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      )
    }
  }
}
