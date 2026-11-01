package expo.modules.vigil

/**
 * How the Vigil recognises the reels screen in one app. Matching uses only the scrolling view's
 * resource id (e.g. "clips_viewer_view_pager"), its bounds and its scroll positions: never text,
 * captions, usernames or what the video shows.
 *
 * - [pagerIds]: resource ids (the part after ":id/") of the app's reels pager. A match counts even
 *   when the pager doesn't fill the screen (split screen).
 * - [anyFullScreenPager]: the fallback when the ids change after an app update: any vertical list
 *   that fills most of the screen and snaps to one item at a time counts as a reels pager.
 * - [byDistance]: for lists that report no item positions, a full-screen vertical scroll of about
 *   one screen counts as one reel. Only for apps whose full-screen vertical feed is the reels feed.
 *
 * Ids are read from the app's own layout (Android Studio's Layout Inspector or `uiautomator dump`
 * on a test phone). Update this table when an app changes; docs/GUARDIANS.md "The reel counter".
 */
data class VigilReelRule(
  val pagerIds: Set<String> = emptySet(),
  val anyFullScreenPager: Boolean = true,
  val byDistance: Boolean = false
)

object VigilReelRules {
  /** A package the user marked that has no entry below: the full-screen pager fallback only. */
  val GENERIC = VigilReelRule()

  private val TABLE: Map<String, VigilReelRule> = mapOf(
    // Instagram Reels (the Reels tab, and reels opened from the feed or Explore).
    "com.instagram.android" to VigilReelRule(pagerIds = setOf("clips_viewer_view_pager")),
    // YouTube Shorts.
    "com.google.android.youtube" to VigilReelRule(pagerIds = setOf("reel_recycler", "reel_player_page_container")),
    // TikTok (two package names, by region). Ids are obfuscated and change: the fallbacks do the work.
    "com.zhiliaoapp.musically" to VigilReelRule(byDistance = true),
    "com.ss.android.ugc.trill" to VigilReelRule(byDistance = true),
    // Facebook Reels: no stable ids, the full-screen pager fallback only.
    "com.facebook.katana" to VigilReelRule(),
    // Snapchat Spotlight: the full-screen pager fallback only.
    "com.snapchat.android" to VigilReelRule()
  )

  fun of(packageName: String): VigilReelRule = TABLE[packageName] ?: GENERIC

  /** Whether a view id ("pkg:id/name", or null) is one of the rule's reels pagers. */
  fun matchesId(rule: VigilReelRule, viewId: String?): Boolean {
    if (viewId.isNullOrEmpty() || rule.pagerIds.isEmpty()) return false
    val name = viewId.substringAfter(":id/", viewId)
    return name in rule.pagerIds
  }
}
