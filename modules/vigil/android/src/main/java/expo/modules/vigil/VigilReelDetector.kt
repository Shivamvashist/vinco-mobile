package expo.modules.vigil

/**
 * One scroll event from a marked app, reduced to positions. Nothing else from the event is read.
 * `deltaX` / `deltaY` are null where Android doesn't report them (before Android 9).
 */
data class VigilScroll(
  val packageName: String,
  val windowId: Int,
  val className: String,
  val fromIndex: Int,
  val toIndex: Int,
  val itemCount: Int,
  val deltaX: Int?,
  val deltaY: Int?
)

/**
 * The scrolling view itself, read only when needed: an identity (stable while the view lives), its
 * resource id, and its size on screen. Never its text or anything inside it.
 */
data class VigilScroller(val identity: Int, val viewId: String?, val width: Int, val height: Int)

/** What the service should do with a scroll: count reels at once, and/or start a dwell for a new one. */
data class VigilReelDecision(val countNow: Int = 0, val arriveToken: Long? = null) {
  companion object {
    val NONE = VigilReelDecision()
  }
}

/**
 * Turns scroll events into reels. Free of Android calls, so the rules read in one place.
 *
 * A reels pager is a vertical list that snaps to one item at a time (`fromIndex == toIndex` once it
 * settles) and is either named in [VigilReelRules] or fills most of the screen. A reel counts when
 * the user settles on an item further down than any counted before in that pager and stays on it
 * for [DWELL_MS] (the service confirms with [confirm]). So:
 * - flinging past reels counts only the ones stayed on;
 * - scrolling back up never counts again (the pager's highest counted item is remembered; the last
 *   [MAX_TRACKS] pagers are kept, so going from the feed to Reels and back doesn't start over);
 * - the reel on screen when a pager is first seen mid-session counts once, when the user swipes on
 *   from it (it was watched before the first event arrived).
 * Lists that report no positions count by distance, only where the rule allows it: a full-screen
 * vertical scroll of [DISTANCE_SHARE] of the list's height past the furthest point counted.
 * Each event costs O(1); the scroller (one call into the other app) is read only when a list settles
 * on one item, or once per list in distance mode.
 */
class VigilReelDetector {
  private data class Pending(val track: String, val index: Int, val packageName: String, val token: Long)

  private data class DistanceTrack(val key: String, val pageHeight: Int, var position: Long, var mark: Long)

  /** Pager track key to the highest item counted in it (-1: none yet). Access-ordered, capped. */
  private val tracks = object : LinkedHashMap<String, Int>(MAX_TRACKS, 0.75f, true) {
    override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, Int>?): Boolean = size > MAX_TRACKS
  }
  private var pending: Pending? = null
  private var distance: DistanceTrack? = null
  private var nextToken = 1L

  fun onScroll(
    scroll: VigilScroll,
    rule: VigilReelRule,
    screenWidth: Int,
    screenHeight: Int,
    readScroller: () -> VigilScroller?
  ): VigilReelDecision {
    val dx = scroll.deltaX
    val dy = scroll.deltaY
    // A sideways scroll (tabs, the stories tray): never a reels pager.
    if (dx != null && dy != null && dx != 0 && dy == 0) return VigilReelDecision.NONE
    if (scroll.fromIndex >= 0 && scroll.toIndex >= 0) {
      return onIndexed(scroll, rule, screenWidth, screenHeight, readScroller)
    }
    if (!rule.byDistance || dy == null) return VigilReelDecision.NONE
    return onDistance(scroll, dy, rule, screenWidth, screenHeight, readScroller)
  }

  /** The dwell is over: counts the pending reel if it is still the one on screen. */
  fun confirm(token: Long): Boolean {
    val waiting = pending ?: return false
    if (waiting.token != token) return false
    pending = null
    // Distance mode has no item positions (index -1): its furthest point is kept in its own track.
    if (waiting.index >= 0) tracks[waiting.track] = maxOf(tracks[waiting.track] ?: -1, waiting.index)
    return true
  }

  /** The user left the app (or the reel) before the dwell ended. */
  fun cancelPending(packageName: String? = null) {
    if (packageName == null || pending?.packageName != packageName) pending = null
  }

  fun pendingPackage(): String? = pending?.packageName

  fun reset() {
    tracks.clear()
    pending = null
    distance = null
  }

  private fun onIndexed(
    scroll: VigilScroll,
    rule: VigilReelRule,
    screenWidth: Int,
    screenHeight: Int,
    readScroller: () -> VigilScroller?
  ): VigilReelDecision {
    if (scroll.itemCount == 1) return VigilReelDecision.NONE
    val waiting = pending
    if (scroll.fromIndex != scroll.toIndex) {
      // Mid-swipe: leaving the reel still in its dwell means it was skipped.
      if (waiting != null && waiting.packageName == scroll.packageName && waiting.index in scroll.fromIndex..scroll.toIndex) {
        pending = null
      }
      return VigilReelDecision.NONE
    }
    val scroller = readScroller() ?: return VigilReelDecision.NONE
    if (!isReelsPager(scroller, rule, screenWidth, screenHeight)) return VigilReelDecision.NONE
    val track = "${scroll.packageName}|${scroll.windowId}|${scroller.identity}"
    val index = scroll.fromIndex
    var countNow = 0
    var top = tracks[track]
    if (top == null) {
      // First sight of this pager. A forward swipe got us here: the reel above was watched.
      top = if (scroll.deltaY != null && scroll.deltaY > 0 && index > 0) {
        countNow = 1
        index - 1
      } else if (scroll.deltaY != null && scroll.deltaY < 0) {
        // Came back up from a reel we never saw: treat this one as seen.
        index
      } else {
        -1
      }
      tracks[track] = top
    }
    if (index <= top) {
      pending = null
      return VigilReelDecision(countNow = countNow)
    }
    if (waiting != null && waiting.track == track && waiting.index == index) {
      // The same reel settling again (a small bounce): keep its dwell running.
      return VigilReelDecision(countNow = countNow)
    }
    val token = nextToken++
    pending = Pending(track, index, scroll.packageName, token)
    return VigilReelDecision(countNow = countNow, arriveToken = token)
  }

  private fun onDistance(
    scroll: VigilScroll,
    dy: Int,
    rule: VigilReelRule,
    screenWidth: Int,
    screenHeight: Int,
    readScroller: () -> VigilScroller?
  ): VigilReelDecision {
    val key = "${scroll.packageName}|${scroll.windowId}|${scroll.className}"
    var track = distance
    if (track == null || track.key != key) {
      val scroller = readScroller() ?: return VigilReelDecision.NONE
      if (!isFullScreen(scroller, screenWidth, screenHeight) || !rule.byDistance) return VigilReelDecision.NONE
      track = DistanceTrack(key, scroller.height, 0L, 0L)
      distance = track
    }
    track.position += dy
    if (track.position - track.mark < (track.pageHeight * DISTANCE_SHARE).toLong()) return VigilReelDecision.NONE
    track.mark = track.position
    val token = nextToken++
    pending = Pending(key, -1, scroll.packageName, token)
    return VigilReelDecision(arriveToken = token)
  }

  private fun isReelsPager(scroller: VigilScroller, rule: VigilReelRule, screenWidth: Int, screenHeight: Int): Boolean {
    if (VigilReelRules.matchesId(rule, scroller.viewId)) return true
    return rule.anyFullScreenPager && isFullScreen(scroller, screenWidth, screenHeight)
  }

  private fun isFullScreen(scroller: VigilScroller, screenWidth: Int, screenHeight: Int): Boolean {
    if (screenWidth <= 0 || screenHeight <= 0) return false
    return scroller.width >= screenWidth * MIN_WIDTH_SHARE && scroller.height >= screenHeight * MIN_HEIGHT_SHARE
  }

  companion object {
    /** A reel counts once the user has stayed on it this long. */
    const val DWELL_MS = 1200L
    const val MAX_TRACKS = 8
    const val DISTANCE_SHARE = 0.6
    const val MIN_WIDTH_SHARE = 0.9
    /** The reels pager sits between the status bar and the app's bottom bar: most of the height. */
    const val MIN_HEIGHT_SHARE = 0.75
  }
}
