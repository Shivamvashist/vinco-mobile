package expo.modules.vigil

/** A moment the Vigil steps in: the allowance just reached, a round milestone (25, 50...), or a reel past it. */
enum class VigilReelMilestone { BUDGET, EVERY, BLOCK }

/** The badge's colour: calm (marble), near the allowance (gold), past it (porphyry). */
enum class VigilReelStage { CALM, NEAR, OVER }

/**
 * The reel watch's rules, free of Android calls. Mirrored and tested in src/features/guard
 * (reels.ts `getReelStepIn`, `getReelBadgeStage`; reelPass.ts): keep the two in step.
 * "Allowance" is the budget plus 12 reels for each reel pass bought today.
 */
object VigilReelPolicy {
  /** A milestone card every this many reels (GUARD_RULES.milestoneEvery). */
  const val MILESTONE_EVERY = 25

  fun allowance(budget: Int, passes: Int, passReels: Int): Int =
    budget + passes.coerceAtLeast(0) * passReels.coerceAtLeast(0)

  /**
   * The step-in at this count, or null. Pax never steps in. Past the allowance every reel brings
   * the blocking card (it supersedes the milestones); at the allowance the budget card; under it
   * a milestone every 25.
   */
  fun stepIn(count: Int, allowance: Int, level: VigilReelLevel): VigilReelMilestone? {
    if (!level.showsBadge || count <= 0) return null
    if (count > allowance) return VigilReelMilestone.BLOCK
    if (count == allowance) return VigilReelMilestone.BUDGET
    if (count % MILESTONE_EVERY == 0) return VigilReelMilestone.EVERY
    return null
  }

  /** The blocking card can be closed at Vigil only; at Guard and Imperium it is Leave or a pass. */
  fun blockClosable(level: VigilReelLevel): Boolean = level == VigilReelLevel.VIGIL

  /** Near from 80% of the allowance, over once past it. */
  fun stage(count: Int, allowance: Int): VigilReelStage = when {
    count > allowance -> VigilReelStage.OVER
    count * 5 >= allowance * 4 -> VigilReelStage.NEAR
    else -> VigilReelStage.CALM
  }
}
