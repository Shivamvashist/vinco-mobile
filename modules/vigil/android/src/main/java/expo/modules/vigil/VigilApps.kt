package expo.modules.vigil

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.telecom.TelecomManager
import android.util.Base64
import android.view.inputmethod.InputMethodManager
import java.io.ByteArrayOutputStream
import java.text.Collator

/** One app the user can pick as a companion ("Comites"). */
data class VigilApp(val packageName: String, val label: String, val icon: String?) {
  fun toMap(): Map<String, Any?> = mapOf("packageName" to packageName, "label" to label, "icon" to icon)
}

/**
 * The apps on the phone, as far as the Vigil needs to know them. Package visibility comes from the
 * `<queries>` intents in the manifest (launcher apps, the home screen, keyboards), never from
 * QUERY_ALL_PACKAGES.
 */
object VigilApps {
  private const val ICON_PX = 96

  /**
   * Allowed in every guard, whatever the list says: calls (the in-call screen and the telecom
   * service), the emergency dialer and emergency tools, the system's own dialogs and the
   * permission pages. The phone must never become a trap.
   */
  private val ALWAYS_ALLOWED = setOf(
    "android",
    "com.android.server.telecom",
    "com.android.phone",
    "com.android.dialer",
    "com.google.android.dialer",
    "com.android.incallui",
    "com.samsung.android.incallui",
    "com.samsung.android.dialer",
    "com.android.emergency",
    "com.google.android.apps.safetyhub",
    "com.android.permissioncontroller",
    "com.google.android.permissioncontroller"
  )

  const val SYSTEM_UI = "com.android.systemui"

  /** Every app with a launcher icon, sorted by label, without Vinco itself. Slow: call off the main thread. */
  fun listLaunchable(context: Context): List<VigilApp> {
    val pm = context.packageManager
    val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    val seen = mutableSetOf<String>()
    val apps = mutableListOf<VigilApp>()
    for (info in pm.queryIntentActivities(intent, 0)) {
      val pkg = info.activityInfo?.packageName ?: continue
      if (pkg == context.packageName || !seen.add(pkg)) continue
      val label = try {
        info.loadLabel(pm).toString()
      } catch (_: Exception) {
        pkg
      }
      val icon = try {
        iconDataUri(info.loadIcon(pm))
      } catch (_: Exception) {
        null
      }
      apps.add(VigilApp(pkg, label.ifBlank { pkg }, icon))
    }
    val collator = Collator.getInstance().apply { strength = Collator.PRIMARY }
    return apps.sortedWith { a, b -> collator.compare(a.label, b.label) }
  }

  fun dialerPackage(context: Context): String? = try {
    (context.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager)?.defaultDialerPackage
  } catch (_: Exception) {
    null
  }

  /** The always-allowed apps on this phone: Vinco, the dialer, calls and emergency, system dialogs. */
  fun alwaysAllowed(context: Context): Set<String> {
    val result = ALWAYS_ALLOWED.toMutableSet()
    result.add(context.packageName)
    dialerPackage(context)?.let(result::add)
    return result
  }

  /** The home screen apps. Allowed under Custos and Imperium; Silentium sends them back to Vinco. */
  fun launchers(context: Context): Set<String> = try {
    val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
    context.packageManager
      .queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY)
      .mapNotNull { it.activityInfo?.packageName }
      .filter { it != context.packageName && it != "com.android.settings" }
      .toSet()
  } catch (_: Exception) {
    emptySet()
  }

  /** The keyboards. Their windows never count as an app in front, so typing always works. */
  fun keyboards(context: Context): Set<String> = try {
    (context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager)
      ?.enabledInputMethodList
      ?.map { it.packageName }
      ?.toSet()
      ?: emptySet()
  } catch (_: Exception) {
    emptySet()
  }

  /** A launcher icon as a 96 px PNG data URI. */
  private fun iconDataUri(drawable: Drawable): String {
    val bitmap = Bitmap.createBitmap(ICON_PX, ICON_PX, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    drawable.setBounds(0, 0, ICON_PX, ICON_PX)
    drawable.draw(canvas)
    val out = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
    bitmap.recycle()
    return "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
  }
}

/** The system apps the guard treats specially, gathered once per focus. */
data class VigilSystemApps(
  val own: String,
  val alwaysAllowed: Set<String>,
  val launchers: Set<String>,
  val keyboards: Set<String>
) {
  companion object {
    fun of(context: Context) = VigilSystemApps(
      own = context.packageName,
      alwaysAllowed = VigilApps.alwaysAllowed(context),
      launchers = VigilApps.launchers(context),
      keyboards = VigilApps.keyboards(context)
    )
  }
}
