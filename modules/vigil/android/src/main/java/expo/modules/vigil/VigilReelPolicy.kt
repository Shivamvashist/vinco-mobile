package expo.modules.vigil

/** A moment the Vigil steps in: the budget just reached, or a round milestone (25, 50...). */
enum class VigilReelMilestone { BUDGET, EVERY }

/** The badge's colour: calm (marble), near the budget (gold), past it (porphyry). */
enum class VigilReelStage { CALM, NEAR, OVER }

/**
 * The reel watch's rules, free of Android calls. Mirrored and tested in
 * src/features/guard/reels.ts (`getReelStepIn`, `getReelBadgeStage`): keep the two in step.
 */
object VigilReelPolicy {
  /** A milestone card every this many reels (GUARD_RULES.milestoneEvery). */
  const val MILESTONE_EVERY = 25

  /** The step-in at this count, or null. Pax never steps in; the budget wins when both fall together. */
  fun milestone(count: Int, budget: Int, level: VigilReelLevel): VigilReelMilestone? {
    if (!level.showsBadge || count <= 0) return null
    if (count == budget) return VigilReelMilestone.BUDGET
    if (count % MILESTONE_EVERY == 0) return VigilReelMilestone.EVERY
    return null
  }

  /** Near from 80% of the budget, over once past it. */
  fun stage(count: Int, budget: Int): VigilReelStage = when {
    count > budget -> VigilReelStage.OVER
    count * 5 >= budget * 4 -> VigilReelStage.NEAR
    else -> VigilReelStage.CALM
  }

  /** Fills "{count}" and "{budget}" in a line of overlay copy. */
  fun fill(template: String, count: Int, budget: Int): String =
    template.replace("{count}", count.toString()).replace("{budget}", budget.toString())
}
