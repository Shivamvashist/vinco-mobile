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
 * Two ways in, one way to count:
 * - [onScroll]: a list that reports item positions. A reels pager settles on one item
 *   (`fromIndex == toIndex`) and is either named in [VigilReelRules] or fills most of the screen.
 * - [onSettled]: a pager read again once a swipe has come to rest (VigilReels), for pagers that
 *   report no positions; [VigilReelPages] finds its place (position, page, or distance).
 *
 * A reel counts when the user settles on a place further down than any counted before in that
 * pager and stays on it for [DWELL_MS] (the service confirms with [confirm]). So:
 * - flinging past reels counts only the ones stayed on;
 * - scrolling back up never counts again (the pager's highest counted place is remembered; the
 *   last [MAX_TRACKS] pagers are kept, so going from the feed to Reels and back doesn't start over);
 * - the reel on screen when a pager is first seen on a forward swipe counts at once (it was
 *   watched before the first event arrived); a pager first seen at rest counts its reel after the dwell.
 * Each event costs O(1); the scroller (one call into the other app) is read only when a list settles.
 */
class VigilReelDetector {
  private data class Pending(
    val track: String,
    val index: Int,
    val packageName: String,
    val token: Long,
    /** Set for a reel found at rest: a new swipe in this list before the dwell ends skips it. */
    val settledIn: String?
  )

  /** Pager track key to the highest place counted in it. */
  private val tracks = VigilReelPages.capped<Int>()
  private val pages = VigilReelPages()
  private var pending: Pending? = null
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
    if (scroll.fromIndex < 0 || scroll.toIndex < 0 || scroll.itemCount == 1) return VigilReelDecision.NONE
    val waiting = pending
    if (scroll.fromIndex != scroll.toIndex) {
      // Mid-swipe: leaving the reel still in its dwell means it was skipped.
      if (waiting != null && waiting.packageName == scroll.packageName && waiting.index in scroll.fromIndex..scroll.toIndex) {
        pending = null
      }
      return VigilReelDecision.NONE
    }
    val scroller = readScroller() ?: return VigilReelDecision.NONE
    val known = VigilReelRules.matchesId(rule, scroller.viewId)
    if (!known && !(rule.anyFullScreenPager && isFullScreen(scroller.width, scroller.height, screenWidth, screenHeight))) {
      return VigilReelDecision.NONE
    }
    val track = "${scroll.packageName}|${scroll.windowId}|${scroller.identity}"
    val direction = when {
      dy == null || dy == 0 -> 0
      dy > 0 -> 1
      else -> -1
    }
    return arrive(track, scroll.fromIndex, scroll.packageName, direction, null)
  }

  /** A pager at rest, read again (pagers without item positions). */
  fun onSettled(
    settle: VigilSettle,
    pager: VigilPagerSample,
    rule: VigilReelRule,
    screenWidth: Int,
    screenHeight: Int
  ): VigilReelDecision {
    val place = pages.place(settle, pager, rule, screenWidth, screenHeight) ?: return VigilReelDecision.NONE
    val settledIn = "${settle.packageName}|${settle.windowId}|${settle.className}"
    return arrive(place.track, place.index, settle.packageName, place.direction, settledIn)
  }

  /** A new swipe began in this list: a reel found at rest in it and still in its dwell was skipped. */
  fun onSwipe(packageName: String, windowId: Int, className: String) {
    if (pending?.settledIn == "$packageName|$windowId|$className") pending = null
  }

  /** The dwell is over: counts the pending reel if it is still the one on screen. */
  fun confirm(token: Long): Boolean {
    val waiting = pending ?: return false
    if (waiting.token != token) return false
    pending = null
    tracks[waiting.track] = maxOf(tracks[waiting.track] ?: Int.MIN_VALUE, waiting.index)
    return true
  }

  /** The user left the app (or the reel) before the dwell ended. */
  fun cancelPending(packageName: String? = null) {
    if (packageName == null || pending?.packageName != packageName) pending = null
  }

  fun pendingPackage(): String? = pending?.packageName

  fun reset() {
    tracks.clear()
    pages.reset()
    pending = null
  }

  /**
   * The user is on place [index] of [track]. `direction`: 1 came down to it, -1 came up, 0 unknown.
   * Starts the dwell for a place further down than any counted, or counts the one before at once
   * when the pager is first seen on a forward swipe.
   */
  private fun arrive(track: String, index: Int, packageName: String, direction: Int, settledIn: String?): VigilReelDecision {
    val waiting = pending
    var countNow = 0
    var top = tracks[track]
    if (top == null) {
      top = when {
        // First sight on a forward swipe: the reel above was watched before we saw anything.
        direction > 0 && index > 0 -> {
          countNow = 1
          index - 1
        }
        // Came back up to it from a reel we never saw: this one counts as seen.
        direction < 0 -> index
        // Opened on it: it counts after its dwell.
        else -> index - 1
      }
      tracks[track] = top
    }
    if (index <= top) {
      if (waiting?.track == track) pending = null
      return VigilReelDecision(countNow = countNow)
    }
    if (waiting != null && waiting.track == track && waiting.index == index) {
      // The same reel settling again (a small bounce, a page refreshing): keep its dwell running.
      return VigilReelDecision(countNow = countNow)
    }
    val token = nextToken++
    pending = Pending(track, index, packageName, token, settledIn)
    return VigilReelDecision(countNow = countNow, arriveToken = token)
  }

  companion object {
    /** A reel counts once the user has stayed on it this long. */
    const val DWELL_MS = 1200L
    const val MAX_TRACKS = 8
    const val MIN_WIDTH_SHARE = 0.9
    /** The reels pager sits between the status bar and the app's bottom bar: most of the height. */
    const val MIN_HEIGHT_SHARE = 0.75

    fun isFullScreen(width: Int, height: Int, screenWidth: Int, screenHeight: Int): Boolean {
      if (screenWidth <= 0 || screenHeight <= 0) return false
      return width >= screenWidth * MIN_WIDTH_SHARE && height >= screenHeight * MIN_HEIGHT_SHARE
    }
  }
}
