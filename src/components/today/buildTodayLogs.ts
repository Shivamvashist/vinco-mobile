import { router } from 'expo-router';

import { proofCopy, todayCopy } from '@/copy';
import type { DailySelfie } from '@/hooks/useDailySelfie';

import type { DailyLogItem } from './DailyLogRows';

const copy = todayCopy.quickLogs;

/**
 * Today's three daily logs as rows: the selfie (opens the camera), weight and calories (open
 * their sheets), each with today's value once logged. Day tasks: they never affect sealing.
 */
export function buildTodayLogs(
  selfie: DailySelfie,
  open: { weight: () => void; calories: () => void },
): DailyLogItem[] {
  return [
    {
      key: 'selfie',
      icon: 'camera',
      title: copy.selfie,
      value: selfie.todayPath ? copy.selfieDone : null,
      hint: copy.selfieHint,
      onPress: () => router.push('/selfie'),
    },
    {
      key: 'weight',
      icon: 'scale',
      title: copy.weight,
      value: selfie.weightKg != null ? copy.weightDone(proofCopy.kg(selfie.weightKg)) : null,
      hint: copy.weightHint,
      onPress: open.weight,
    },
    {
      key: 'calories',
      icon: 'plate',
      title: copy.calories,
      value: selfie.calories != null ? copy.caloriesDone(proofCopy.kcal(selfie.calories)) : null,
      hint: copy.caloriesHint,
      onPress: open.calories,
    },
  ];
}
