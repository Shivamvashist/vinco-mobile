import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { rewardsCopy } from '@/copy';
import { TRUCES } from '@/features/campaign';
import { useHudCounts } from '@/hooks/useHudCounts';
import { createStyles, useFeedback } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Txt } from '../Txt';

import { HudCounter } from './HudCounter';
import type { RewardAmounts } from './rewardFlight';

export type HudCountersProps = {
  /** Rewards already in the records but not shown yet (a held focus before its Claim). */
  held?: RewardAmounts;
};

const copy = rewardsCopy.hud;

/**
 * The HUD at the top right of each tab: one slim pill with three counters, denarii (opens the
 * Forum), Gloria (opens Vidi) and Truces held (a short explainer). Each is a landing spot for the
 * reward flight. Reads the records itself, so a tab adds it with one line. The focus result shows
 * it too, so a focus claim has counters to fly to (the tabs' counters are off screen there).
 */
export function HudCounters({ held }: HudCountersProps = {}) {
  const styles = useStyles();
  const play = useFeedback();
  const counts = useHudCounts();
  const [isTruceSheetOpen, setIsTruceSheetOpen] = useState(false);

  return (
    <>
      <View style={styles.pill}>
        <HudCounter
          kind="denarii"
          total={counts.denarii}
          held={held?.denarii}
          icon="coin"
          color="currency"
          accessibilityLabel={copy.denariiLabel(counts.denarii)}
          onPress={() => {
            play('tap');
            router.push('/forum');
          }}
        />
        <HudCounter
          kind="gloria"
          total={counts.gloria}
          held={held?.gloria}
          icon="laurel"
          color="accent"
          hasDivider
          accessibilityLabel={copy.gloriaLabel(counts.gloria)}
          onPress={() => {
            play('tap');
            router.navigate('/vidi');
          }}
        />
        <HudCounter
          kind="truces"
          total={counts.truces}
          held={held?.truces}
          icon="shield"
          color="info"
          hasDivider
          accessibilityLabel={copy.trucesLabel(counts.truces)}
          onPress={() => {
            play('tap');
            setIsTruceSheetOpen(true);
          }}
        />
      </View>
      <BottomSheet
        visible={isTruceSheetOpen}
        onClose={() => setIsTruceSheetOpen(false)}
        title={copy.truceSheetTitle(counts.truces)}
      >
        <Txt variant="body" color="textMuted">
          {copy.truceSheetBody(TRUCES.maxHeld, TRUCES.priceDenarii)}
        </Txt>
        <View style={styles.sheetAction}>
          <Button
            label={copy.openForum}
            variant="secondary"
            size="compact"
            onPress={() => {
              setIsTruceSheetOpen(false);
              router.push('/forum');
            }}
          />
        </View>
      </BottomSheet>
    </>
  );
}

const useStyles = createStyles((theme) => ({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.effects.cardBorder,
    backgroundColor: theme.colors.surface,
    boxShadow: theme.effects.cardShadow,
  },
  sheetAction: { marginTop: theme.space.lg },
}));
