package expo.modules.vigil

/**
 * How the Vigil recognises the reels screen in one app. Matching uses only the scrolling view's
 * resource id (e.g. "clips_viewer_view_pager"), its bounds, its scroll positions and the position
 * of the page on screen in its list: never text, captions, usernames or what the video shows.
 *
 * - [pagerIds]: resource ids (the part after ":id/") of the app's reels pager. A match counts even
 *   when the pager doesn't fill the screen (split screen).
 * - [pageIds]: ids of one page inside that pager (one reel). A page with this id proves the pager.
 * - [anyFullScreenPager]: the fallback when the ids change after an app update: any vertical list
 *   that fills most of the screen and shows one item at a time counts as a reels pager.
 * - [bySettle]: once a swipe has come to rest, read the pager again: the page on screen and its
 *   position in the list (VigilReelPages). For pagers that send scrolls without item positions.
 *   Off for Instagram, whose pager reports positions and whose home feed must never be probed.
 * - [byDistance]: for pagers that report neither positions nor pages, a swipe of about one pager
 *   height (Android 9+ deltas) is one reel. Only for apps whose full-screen vertical feed is reels.
 * - [byPageIdentity]: for pagers that report no positions at all, a new page view on screen is a
 *   new reel (the one just left is remembered, so going back one doesn't count).
 * - [contentChanges]: also listen to content changes while the app is in front, for pagers that
 *   page without scroll events. Costs more events: only where needed.
 *
 * Ids are read from the app's own layout (Android Studio's Layout Inspector or `uiautomator dump`
 * on a test phone). Update this table when an app changes; docs/GUARDIANS.md "The reel counter".
 */
data class VigilReelRule(
  val pagerIds: Set<String> = emptySet(),
  val pageIds: Set<String> = emptySet(),
  val anyFullScreenPager: Boolean = true,
  val bySettle: Boolean = true,
  val byDistance: Boolean = false,
  val byPageIdentity: Boolean = false,
  val contentChanges: Boolean = false
)

object VigilReelRules {
  /** A package the user marked that has no entry below: the full-screen pager fallback only. */
  val GENERIC = VigilReelRule()

  // YouTube Shorts: the RecyclerView pager, one page per short. Its scrolls may come without item
  // positions, so the page at rest, then distance, then content changes do the work.
  private val YOUTUBE = VigilReelRule(
    pagerIds = setOf("reel_recycler"),
    pageIds = setOf("reel_player_page_container"),
    byDistance = true,
    contentChanges = true
  )

  private val TIKTOK = VigilReelRule(byDistance = true, contentChanges = true)

  private val TABLE: Map<String, VigilReelRule> = mapOf(
    // Instagram Reels (the Reels tab, and reels opened from the feed or Explore).
    "com.instagram.android" to VigilReelRule(pagerIds = setOf("clips_viewer_view_pager"), bySettle = false),
    "com.google.android.youtube" to YOUTUBE,
    // YouTube's common rebuilds (ReVanced), same layout.
    "app.revanced.android.youtube" to YOUTUBE,
    "app.rvx.android.youtube" to YOUTUBE,
    // TikTok (two package names, by region). Ids are obfuscated and change: the fallbacks do the work.
    "com.zhiliaoapp.musically" to TIKTOK,
    "com.ss.android.ugc.trill" to TIKTOK,
    // Facebook Reels: no stable ids.
    "com.facebook.katana" to VigilReelRule(byDistance = true, contentChanges = true),
    // Snapchat Spotlight and Stories: custom views that may report no positions at all.
    "com.snapchat.android" to VigilReelRule(byDistance = true, byPageIdentity = true, contentChanges = true)
  )

  fun of(packageName: String): VigilReelRule = TABLE[packageName] ?: GENERIC

  /** Whether a view id ("pkg:id/name", or null) is one of the rule's reels pagers. */
  fun matchesId(rule: VigilReelRule, viewId: String?): Boolean = matches(rule.pagerIds, viewId)

  /** Whether a view id is one of the rule's reel pages. */
  fun matchesPage(rule: VigilReelRule, viewId: String?): Boolean = matches(rule.pageIds, viewId)

  private fun matches(ids: Set<String>, viewId: String?): Boolean {
    if (viewId.isNullOrEmpty() || ids.isEmpty()) return false
    return viewId.substringAfter(":id/", viewId) in ids
  }
}
