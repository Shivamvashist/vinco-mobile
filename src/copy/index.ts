/**
 * All user-facing text. Components never hard-code sentences: they import from here.
 * One file per area. Lines that change with the user's tone are ToneLines.
 *
 * Humour rule: roast the habit, the phone and the excuse, never the person.
 * Every Roast line ends with a way forward. Selfie, weight and slip lines stay neutral.
 */
export { arcCopy } from './arc';
export { campaignCopy } from './campaign';
export { commonCopy } from './common';
export { dayCardCopy } from './dayCard';
export { progressCopy } from './progress';
export { proofCopy } from './proof';
export { onboardingCopy } from './onboarding';
export { isTabName, tabAccessibilityLabel, tabsCopy, type TabName } from './tabs';
export { todayCopy } from './today';
export { pickTone, type ToneLines } from './toneLines';
