package expo.modules.vigil

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.net.Uri

/**
 * What the reel watch shows over a marked app, and what its buttons do (Vigil level and up):
 *
 * - The badge (VigilBadge): the count, draggable; a tap opens the panel.
 * - The panel (VigilReelPanelView): today against the allowance and the pass.
 * - Under the allowance: the budget card at the allowance and a milestone card every 25.
 * - Past it: the blocking card on every reel counted, one at a time, refreshed in place. At Vigil
 *   it can be closed; at Guard and Imperium only Leave or the pass.
 *
 * "Leave" goes to the home screen (GLOBAL_ACTION_HOME). The pass opens Vinco at
 * vinco://reels?pass=1, where the app confirms and buys it: the ledger has one writer (JavaScript),
 * and the new allowance comes back through `configure`. Runs on the service's main thread.
 */
class VigilReelOverlays(private val service: AccessibilityService) {
  private val windows = VigilReelWindows(service)
  private val badge = VigilBadge(service, windows)

  /** The badge with today's count (a marked app came to the front, or the settings changed). */
  fun showBadge(count: Int, config: VigilReelConfig) {
    val allowance = config.allowance()
    badge.show(count, allowance, config) { openPanel(config) }
    // A pass bought (or the budget raised) while the blocking card is up: it goes once under.
    if (windows.isBlockShown && count <= allowance) windows.hideBlock()
  }

  /** A reel was just counted in the app in front. */
  fun onCounted(count: Int, config: VigilReelConfig) {
    showBadge(count, config)
    val allowance = config.allowance()
    when (VigilReelPolicy.stepIn(count, allowance, config.level)) {
      VigilReelMilestone.BLOCK -> showBlock(count, config)
      VigilReelMilestone.BUDGET -> showCard(config, count, "budgetTitle", "budgetBody")
      VigilReelMilestone.EVERY -> showCard(config, count, "milestoneTitle", "milestoneBody")
      null -> Unit
    }
  }

  fun hideAll() {
    windows.hideFloating()
    badge.hide()
  }

  private fun state(count: Int, config: VigilReelConfig) = VigilReelState(
    count = count,
    allowance = config.allowance(),
    passes = config.passesToday(),
    canPass = config.canOfferPass(),
    passesLeft = config.passesToday() < config.passMax
  )

  private fun openPanel(config: VigilReelConfig) {
    val latest = VigilReelStore.config(service) ?: config
    val count = VigilReelStore.todayCount(service)
    val words = VigilReelWords(latest, count, latest.allowance())
    val actions = VigilReelActions(
      onClose = { windows.hidePanel() },
      onPass = {
        windows.hidePanel()
        openPass()
      },
      onLeave = {
        windows.hidePanel()
        leave()
      }
    )
    windows.showPanel(VigilReelPanelView(service, words, VigilReelWords.palette(latest), state(count, latest), actions))
  }

  private fun showBlock(count: Int, config: VigilReelConfig) {
    val words = VigilReelWords(config, count, config.allowance())
    val actions = VigilReelActions(
      onClose = { windows.hideBlock() },
      onPass = {
        windows.hideBlock()
        openPass()
      },
      onLeave = {
        windows.hideBlock()
        leave()
      }
    )
    windows.showBlock(
      create = {
        VigilReelBlockView(
          service,
          words,
          VigilReelWords.palette(config),
          state(count, config),
          VigilReelPolicy.blockClosable(config.level),
          actions
        )
      },
      refresh = { it.refresh(words) }
    )
  }

  private fun showCard(config: VigilReelConfig, count: Int, titleKey: String, bodyKey: String) {
    val words = VigilReelWords(config, count, config.allowance())
    val notice = VigilNotice(title = words.get(titleKey), body = words.get(bodyKey), primary = words.get("close"))
    val view = VigilViews.notice(
      service,
      VigilReelWords.palette(config),
      notice,
      onPrimary = { windows.hideCard() },
      onSecondary = { windows.hideCard() }
    )
    windows.showCard(view, CARD_MAX_MS)
  }

  /** Home screen: off the feed, without opening anything else. */
  private fun leave() {
    try {
      service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_HOME)
    } catch (_: Exception) {
      // The system refused: the card is gone and counting carries on.
    }
  }

  /** Vinco's reel screen with the pass's confirm sheet open. */
  private fun openPass() {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(PASS_LINK))
      .setPackage(service.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    try {
      service.startActivity(intent)
    } catch (_: Exception) {
      val launch = service.packageManager.getLaunchIntentForPackage(service.packageName) ?: return
      launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      try {
        service.startActivity(launch)
      } catch (_: Exception) {
        // Blocked by the system: nothing more to do.
      }
    }
  }

  private companion object {
    const val PASS_LINK = "vinco://reels?pass=1"
    const val CARD_MAX_MS = 60_000L
  }
}
