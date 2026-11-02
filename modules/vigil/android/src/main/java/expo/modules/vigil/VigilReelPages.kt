package expo.modules.vigil

import kotlin.math.abs
import kotlin.math.roundToInt

/** The page covering the pager's centre: its identity, id, place in the list (if told) and share of the pager. */
data class VigilPageSample(val identity: Int, val viewId: String?, val rowIndex: Int?, val fillShare: Float)

/** The pager at rest (VigilReelProbe): identity, id, size, orientation and the page on screen. */
data class VigilPagerSample(
  val identity: Int,
  val viewId: String?,
  val width: Int,
  val height: Int,
  val horizontal: Boolean,
  /** Whether the view says it scrolls: pages found by identity or distance must come from one. */
  val scrollable: Boolean,
  val page: VigilPageSample?
)

/**
 * One finished gesture in a marked app: where, how far it moved down (null: not reported), and
 * whether its scrolls carried item positions (then the indexed path counts it: only the page's own
 * position may be used here, never distance or identity, or the reel would count twice).
 */
data class VigilSettle(
  val packageName: String,
  val windowId: Int,
  val className: String,
  val netDy: Int?,
  val indexed: Boolean = false
)

/** Where a pager at rest stands: its track, the reel's place in it, and the way the user went (-1, 0, 1). */
data class VigilPagePlace(val track: String, val index: Int, val direction: Int)

/**
 * Turns a pager at rest into a place in its list, for pagers whose scrolls carry no item positions
 * (YouTube Shorts, Snapchat, Facebook, TikTok; VigilReelRules). Free of Android calls. In order:
 *
 * 1. The page's own position in the list (the list tells it per item, as `rowIndex`).
 * 2. A new page view on screen ([VigilReelRule.byPageIdentity]): one place on, unless the swipe
 *    went up or the view is the one that stood one place up (going back). Pagers reuse 3 to 5
 *    views, so a view seen further back reads as new: a fair guess, the dwell still applies.
 * 3. The distance swiped, in pager heights ([VigilReelRule.byDistance]): under half a height is a
 *    nudge and moves nothing; a fling of three heights is three places on.
 *
 * Each gesture is judged on its own, so a lost scroll event never drifts the count. A list showing
 * more than one item at a time is a feed and never counts; a sideways pager neither.
 */
class VigilReelPages {
  /** A pager known by its page views: where the user is, and which view stood at the places nearby. */
  private class Seen(var index: Int, val at: HashMap<Int, Int>)

  private val positions = capped<Int>()
  private val pages = capped<Seen>()

  fun place(
    settle: VigilSettle,
    pager: VigilPagerSample,
    rule: VigilReelRule,
    screenWidth: Int,
    screenHeight: Int
  ): VigilPagePlace? {
    if (pager.horizontal) return null
    val page = pager.page
    val known = VigilReelRules.matchesId(rule, pager.viewId) ||
      (page != null && VigilReelRules.matchesPage(rule, page.viewId))
    val fullScreen = VigilReelDetector.isFullScreen(pager.width, pager.height, screenWidth, screenHeight)
    if (!known && !(rule.anyFullScreenPager && fullScreen)) return null
    val base = "${settle.packageName}|${settle.windowId}|${pager.identity}"
    val netDy = settle.netDy
    if (page != null) {
      if (page.fillShare < MIN_PAGE_SHARE) return null
      page.rowIndex?.let { return VigilPagePlace(base, it, direction(netDy)) }
      if (settle.indexed) return null
      if (rule.byPageIdentity && (known || pager.scrollable)) return byIdentity("$base|p", page.identity, netDy)
    }
    if (settle.indexed || (!known && !pager.scrollable)) return null
    if (rule.byDistance && netDy != null && pager.height > 0) return byDistance("$base|d", netDy, pager.height)
    return null
  }

  fun reset() {
    positions.clear()
    pages.clear()
  }

  private fun byDistance(key: String, netDy: Int, height: Int): VigilPagePlace? {
    val steps = if (abs(netDy) * 2 >= height) (netDy.toFloat() / height).roundToInt() else 0
    val at = (positions[key] ?: 0) + steps
    positions[key] = at
    if (steps == 0) return null
    return VigilPagePlace(key, at, if (steps > 0) 1 else -1)
  }

  private fun byIdentity(key: String, identity: Int, netDy: Int?): VigilPagePlace {
    val seen = pages[key]
    if (seen == null) {
      pages[key] = Seen(0, hashMapOf(0 to identity))
      return VigilPagePlace(key, 0, direction(netDy))
    }
    if (seen.at[seen.index] == identity) return VigilPagePlace(key, seen.index, 0)
    // The swipe's own direction when told; otherwise the view that stood one place up means "back".
    val step = direction(netDy).takeIf { it != 0 } ?: if (seen.at[seen.index - 1] == identity) -1 else 1
    seen.index += step
    seen.at[seen.index] = identity
    seen.at.keys.removeAll { kotlin.math.abs(it - seen.index) > IDENTITY_SPAN }
    return VigilPagePlace(key, seen.index, step)
  }

  private fun direction(netDy: Int?): Int = when {
    netDy == null || netDy == 0 -> 0
    netDy > 0 -> 1
    else -> -1
  }

  companion object {
    /** The page on screen fills at least this much of the pager: one item at a time. */
    const val MIN_PAGE_SHARE = 0.9f
    /** Page views remembered this many places either side (pagers recycle 3 to 5 views). */
    const val IDENTITY_SPAN = 4

    /** An access-ordered map that keeps the last [VigilReelDetector.MAX_TRACKS] entries. */
    fun <V> capped(): LinkedHashMap<String, V> =
      object : LinkedHashMap<String, V>(VigilReelDetector.MAX_TRACKS, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, V>?): Boolean =
          size > VigilReelDetector.MAX_TRACKS
      }
  }
}
