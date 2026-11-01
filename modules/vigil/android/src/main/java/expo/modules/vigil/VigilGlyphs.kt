package expo.modules.vigil

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.view.View
import androidx.core.graphics.PathParser

/**
 * The laurel, Vinco's mark for wins: the same line icon as the app (`laurel` in
 * src/components/Icon.tsx, a 24 by 24 grid, 1.8 stroke, round caps). Decorative.
 */
@SuppressLint("ViewConstructor")
class VigilLaurel(context: Context, color: Int) : View(context) {
  private val source: Path? = try {
    PathParser.createPathFromPathData(LAUREL)
  } catch (_: Exception) {
    null
  }
  private val scaled = Path()
  private val matrix = Matrix()
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    style = Paint.Style.STROKE
    strokeCap = Paint.Cap.ROUND
    strokeJoin = Paint.Join.ROUND
    this.color = color
  }

  init {
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
  }

  fun setColor(color: Int) {
    if (paint.color == color) return
    paint.color = color
    invalidate()
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    val path = source ?: return
    val size = minOf(w, h).toFloat()
    matrix.setScale(size / GRID, size / GRID)
    matrix.postTranslate((w - size) / 2f, (h - size) / 2f)
    scaled.reset()
    path.transform(matrix, scaled)
    paint.strokeWidth = size / GRID * STROKE
  }

  override fun onDraw(canvas: Canvas) {
    if (source != null) canvas.drawPath(scaled, paint)
  }

  private companion object {
    const val GRID = 24f
    const val STROKE = 1.8f
    const val LAUREL =
      "M12 21V10M12 21c-4 0-7-4-7-9M12 21c4 0 7-4 7-9M5 12c2 0 3-1 3-3M19 12c-2 0-3-1-3-3M7 7c1 0 2-1 2-2M17 7c-1 0-2-1-2-2"
  }
}

/**
 * A thin ring: the track in the hairline colour, the time left as an arc from the top, round caps.
 * `fraction` is the share of the session still to run (1 at the start, 0 at the end).
 */
@SuppressLint("ViewConstructor")
class VigilRing(context: Context, track: Int, progress: Int, strokePx: Float) : View(context) {
  private val bounds = RectF()
  private val trackPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    style = Paint.Style.STROKE
    strokeWidth = strokePx
    color = track
  }
  private val arcPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    style = Paint.Style.STROKE
    strokeWidth = strokePx
    strokeCap = Paint.Cap.ROUND
    color = progress
  }
  private var fraction = 1f

  init {
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
  }

  fun setFraction(value: Float) {
    val next = value.coerceIn(0f, 1f)
    if (next == fraction) return
    fraction = next
    invalidate()
  }

  fun setProgressColor(color: Int) {
    if (arcPaint.color == color) return
    arcPaint.color = color
    invalidate()
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    val inset = trackPaint.strokeWidth / 2f
    val size = minOf(w, h).toFloat()
    val left = (w - size) / 2f
    val top = (h - size) / 2f
    bounds.set(left + inset, top + inset, left + size - inset, top + size - inset)
  }

  override fun onDraw(canvas: Canvas) {
    canvas.drawOval(bounds, trackPaint)
    if (fraction > 0f) canvas.drawArc(bounds, -90f, 360f * fraction, false, arcPaint)
  }
}
