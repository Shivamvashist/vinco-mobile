package expo.modules.vigil

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.SystemClock
import android.provider.Settings
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/** What `startFocus` receives from JavaScript. Times are epoch milliseconds. */
class FocusConfig : Record {
  @Field val guard: String = ""
  @Field val startedAt: Double = 0.0
  @Field val endsAt: Double = 0.0
  @Field val allowedPackages: List<String> = emptyList()

  /** Overlay words (VigilCopy keys). Missing keys keep the defaults. */
  @Field val copy: Map<String, String> = emptyMap()

  /** The active palette's colour roles for the overlays (VigilPalette keys). Missing ones keep Basalt. */
  @Field val colors: Map<String, String> = emptyMap()

  /** "dark" or "light": the scheme those colours belong to. */
  @Field val scheme: String = "dark"
}

/** What `setWakeWatch` receives: the "Are you up?" prompt (VigilWake). Minutes from local midnight. */
class WakeWatchConfig : Record {
  @Field val enabled: Boolean = false
  @Field val fromMinutes: Int = 180
  @Field val untilMinutes: Int = 720
  @Field val awakeDay: String? = null
  @Field val title: String = ""
  @Field val body: String = ""
  @Field val channelName: String = ""
}

class InvalidFocusGuardException(guard: String) :
  CodedException("ERR_VIGIL_GUARD", "Unknown focus guard: $guard", null)

/**
 * The Vigil, for JavaScript (src/features/guard/bridge.ts). Android only. Focus guards and the reel
 * counter. Both run in VigilService, so they carry on without JavaScript.
 */
class VigilModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("VincoVigil")

    Events("onFocusEvent", "onReel")

    OnCreate {
      VigilEvents.listener = { type, packageName ->
        sendEvent("onFocusEvent", mapOf("type" to type, "packageName" to packageName))
      }
      VigilReelEvents.listener = { count, day -> sendEvent("onReel", mapOf("count" to count, "day" to day)) }
    }

    OnDestroy {
      VigilEvents.listener = null
      VigilReelEvents.listener = null
    }

    AsyncFunction("getPermissions") {
      mapOf(
        "accessibility" to VigilService.isEnabled(context),
        "overlay" to VigilOverlay.canDrawOverlays(context)
      )
    }

    AsyncFunction("openPermissionSettings") { permission: String ->
      when (permission) {
        "accessibility" -> openSettings(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        "overlay" -> openSettings(
          Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))
        )
        else -> Unit
      }
    }

    // Async functions run off the main thread, so drawing every icon never blocks the UI.
    AsyncFunction("listLaunchableApps") { VigilApps.listLaunchable(context).map { it.toMap() } }

    AsyncFunction("getDialerPackage") { VigilApps.dialerPackage(context) }

    // Opens an app from the focus dock (a Comes or the Phone app). False when it can't be opened.
    AsyncFunction("launchApp") { packageName: String ->
      val intent = context.packageManager.getLaunchIntentForPackage(packageName)
      if (intent == null) {
        false
      } else {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
          context.startActivity(intent)
          true
        } catch (_: Exception) {
          false
        }
      }
    }

    AsyncFunction("startFocus") { config: FocusConfig ->
      val guard = VigilGuardLevel.of(config.guard) ?: throw InvalidFocusGuardException(config.guard)
      val now = System.currentTimeMillis()
      val endsAt = VigilPolicy.clampEnd(config.endsAt.toLong(), now)
      val store = VigilStore(context)
      if (endsAt <= now) {
        // Already over: nothing to guard.
        store.clear()
      } else {
        store.save(
          VigilSession(
            guard = guard,
            startedAt = config.startedAt.toLong(),
            endsAt = endsAt,
            allowedPackages = config.allowedPackages.filter { it.isNotBlank() }.toSet(),
            copy = VigilCopy.from(config.copy),
            palette = VigilPalette.from(config.colors, config.scheme),
            elapsedEndsAt = SystemClock.elapsedRealtime() + (endsAt - now),
            bootCount = VigilStore.bootCount(context)
          )
        )
      }
      VigilService.refresh()
    }

    AsyncFunction("endFocus") {
      VigilStore(context).clear()
      VigilService.refresh()
    }

    AsyncFunction("setWakeWatch") { config: WakeWatchConfig ->
      VigilWake.save(
        context,
        WakeWatch(
          enabled = config.enabled,
          fromMinutes = config.fromMinutes,
          untilMinutes = config.untilMinutes,
          awakeDay = config.awakeDay,
          title = config.title,
          body = config.body,
          channelName = config.channelName
        )
      )
    }

    // The reel counter (VigilReels): its settings, today's count and the kept days.
    AsyncFunction("configure") { config: ReelWatchConfig ->
      VigilReelStore.saveConfig(context, config.toConfig())
      VigilService.refreshReels()
    }

    AsyncFunction("getTodayCount") { VigilReelStore.todayCount(context) }

    AsyncFunction("getReelDays") { reelDaysForJs(VigilReelStore.days(context)) }
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
