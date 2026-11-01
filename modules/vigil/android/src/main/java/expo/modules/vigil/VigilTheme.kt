package expo.modules.vigil

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.util.TypedValue
import androidx.core.content.res.ResourcesCompat
import org.json.JSONObject

/**
 * The overlays' colours: the roles of the palette active in Vinco when the focus began, sent by
 * the app (src/features/guard/overlayTheme.ts). Anything missing or unreadable keeps Basalt, the
 * default dark palette, so the windows always look like Vinco.
 */
data class VigilPalette(
  val dark: Boolean = true,
  val background: Int = Color.parseColor("#1D1A17"),
  val surface: Int = Color.parseColor("#26221E"),
  val surfaceRaised: Int = Color.parseColor("#2E2924"),
  val border: Int = Color.parseColor("#3B352E"),
  val borderStrong: Int = Color.parseColor("#5A5249"),
  val text: Int = Color.parseColor("#ECE5D8"),
  val textMuted: Int = Color.parseColor("#A99F90"),
  val textFaint: Int = Color.parseColor("#5E574E"),
  val accent: Int = Color.parseColor("#D2AC55"),
  val onAccent: Int = Color.parseColor("#1D1A17"),
  val danger: Int = Color.parseColor("#D0697D"),
  val scrim: Int = Color.argb(153, 10, 9, 8)
) {
  fun toJson(): JSONObject = JSONObject()
    .put("dark", dark)
    .put("background", background)
    .put("surface", surface)
    .put("surfaceRaised", surfaceRaised)
    .put("border", border)
    .put("borderStrong", borderStrong)
    .put("text", text)
    .put("textMuted", textMuted)
    .put("textFaint", textFaint)
    .put("accent", accent)
    .put("onAccent", onAccent)
    .put("danger", danger)
    .put("scrim", scrim)

  /** A colour with its alpha scaled (0 to 1), for tints of a role. */
  fun alpha(color: Int, fraction: Float): Int =
    Color.argb((Color.alpha(color) * fraction.coerceIn(0f, 1f)).toInt(), Color.red(color), Color.green(color), Color.blue(color))

  companion object {
    /** From the start config: role name to CSS colour (`#RRGGBB`, `#AARRGGBB` or `rgba(r,g,b,a)`). */
    fun from(values: Map<String, String>, scheme: String?): VigilPalette {
      val base = VigilPalette()
      fun pick(key: String, fallback: Int) = values[key]?.let(::parseColor) ?: fallback
      return VigilPalette(
        dark = scheme != "light",
        background = pick("background", base.background),
        surface = pick("surface", base.surface),
        surfaceRaised = pick("surfaceRaised", base.surfaceRaised),
        border = pick("border", base.border),
        borderStrong = pick("borderStrong", base.borderStrong),
        text = pick("text", base.text),
        textMuted = pick("textMuted", base.textMuted),
        textFaint = pick("textFaint", base.textFaint),
        accent = pick("accent", base.accent),
        onAccent = pick("onAccent", base.onAccent),
        danger = pick("danger", base.danger),
        scrim = pick("scrim", base.scrim)
      )
    }

    fun fromJson(json: JSONObject?): VigilPalette {
      if (json == null) return VigilPalette()
      val base = VigilPalette()
      fun pick(key: String, fallback: Int) = if (json.has(key)) json.optInt(key, fallback) else fallback
      return VigilPalette(
        dark = json.optBoolean("dark", true),
        background = pick("background", base.background),
        surface = pick("surface", base.surface),
        surfaceRaised = pick("surfaceRaised", base.surfaceRaised),
        border = pick("border", base.border),
        borderStrong = pick("borderStrong", base.borderStrong),
        text = pick("text", base.text),
        textMuted = pick("textMuted", base.textMuted),
        textFaint = pick("textFaint", base.textFaint),
        accent = pick("accent", base.accent),
        onAccent = pick("onAccent", base.onAccent),
        danger = pick("danger", base.danger),
        scrim = pick("scrim", base.scrim)
      )
    }

    /** `#RGB`, `#RRGGBB`, `#AARRGGBB` or `rgba(r, g, b, a)`; null when unreadable. */
    fun parseColor(raw: String): Int? {
      val value = raw.trim()
      if (value.startsWith("#")) {
        val hex = if (value.length == 4) "#" + value.drop(1).map { "$it$it" }.joinToString("") else value
        return try {
          Color.parseColor(hex)
        } catch (_: Exception) {
          null
        }
      }
      val match = RGBA.matchEntire(value) ?: return null
      val parts = match.groupValues[1].split(',').map { it.trim() }
      if (parts.size !in 3..4) return null
      val channels = parts.take(3).map { it.toFloatOrNull()?.toInt()?.coerceIn(0, 255) ?: return null }
      val alpha = parts.getOrNull(3)?.toFloatOrNull()?.coerceIn(0f, 1f) ?: 1f
      return Color.argb((alpha * 255).toInt(), channels[0], channels[1], channels[2])
    }

    private val RGBA = Regex("""rgba?\((.*)\)""", RegexOption.IGNORE_CASE)
  }
}

/**
 * Type and sizes for the overlays. Marcellus (display) and Figtree (body) ship inside the module
 * (`res/font`), because Expo loads the app's fonts at runtime from the JavaScript bundle, which the
 * guard service can't reach (it runs even when JavaScript never started). If a font can't be read,
 * the system's medium sans takes its place.
 *
 * Text follows the phone's font size, capped at 1.3 times, so the cards never clip.
 */
object VigilType {
  const val MAX_FONT_SCALE = 1.3f

  private var display: Typeface? = null
  private var medium: Typeface? = null
  private var semiBold: Typeface? = null

  fun display(context: Context): Typeface =
    display ?: load(context, R.font.vigil_marcellus, Typeface.create("serif", Typeface.NORMAL)).also { display = it }

  fun medium(context: Context): Typeface =
    medium ?: load(context, R.font.vigil_figtree_medium, Typeface.create("sans-serif", Typeface.NORMAL)).also { medium = it }

  fun semiBold(context: Context): Typeface =
    semiBold ?: load(context, R.font.vigil_figtree_semibold, Typeface.create("sans-serif-medium", Typeface.NORMAL))
      .also { semiBold = it }

  fun dp(context: Context, value: Float): Float =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value, context.resources.displayMetrics)

  fun dp(context: Context, value: Int): Int = dp(context, value.toFloat()).toInt()

  /** Scaled pixels with the phone's font scale capped at MAX_FONT_SCALE. */
  fun sp(context: Context, value: Float): Float {
    val scale = context.resources.configuration.fontScale.coerceIn(0.85f, MAX_FONT_SCALE)
    return value * context.resources.displayMetrics.density * scale
  }

  private fun load(context: Context, id: Int, fallback: Typeface): Typeface = try {
    ResourcesCompat.getFont(context, id) ?: fallback
  } catch (_: Exception) {
    fallback
  }
}
