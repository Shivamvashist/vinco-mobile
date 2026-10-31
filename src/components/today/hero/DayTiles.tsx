import { useWindowDimensions, View } from 'react-native';

import { todayCopy } from '@/copy';
import { dayOfStreakWeek, type NextStreakReward, STREAK } from '@/features/campaign';
import { createStyles } from '@/theme';

import { RollingNumber } from '../../RollingNumber';
import { Txt } from '../../Txt';
import { HeroTile } from './HeroTile';

export type DayTilesProps = {
  run: number;
  isTodayHeld: boolean;
  isLudus: boolean;
  nextReward: NextStreakReward;
  denarii: number;
  todayEarned: number;
  onOpenRun: () => void;
  onOpenPurse: () => void;
};

/** Below this window width the tiles stack, so the numbers never squeeze. */
const STACK_BELOW_WIDTH = 340;
const PAY_DAYS = new Set<number>(STREAK.weekly.map((step) => step.dayOfWeek));

const copy = todayCopy.tiles;

/**
 * The two tiles under the hero: the run (with this week's seven steps, paying days marked) and the
 * purse (with today's pay). They replace the campaign and denarii chips and the Stipendium card.
 */
export function DayTiles({
  run,
  isTodayHeld,
  isLudus,
  nextReward,
  denarii,
  todayEarned,
  onOpenRun,
  onOpenPurse,
}: DayTilesProps) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  // A finished week starts the next one empty until today holds.
  const filled = isTodayHeld ? dayOfStreakWeek(run) : run % STREAK.weekLength;
  const next = todayCopy.streak.next(nextReward.inDays, nextReward.denarii, nextReward.hasTruce);

  return (
    <View style={[styles.row, width < STACK_BELOW_WIDTH && styles.stacked]}>
      <HeroTile
        icon="flame"
        title={isLudus ? copy.run.ludus : copy.run.campaign}
        glow="info"
        glowOrigin="bottomLeft"
        isLit={nextReward.inDays === 1}
        onPress={onOpenRun}
        accessibilityLabel={copy.run.label(run, next)}
        accessibilityHint={copy.run.hint}
      >
        <View style={styles.figure}>
          <RollingNumber value={String(run)} variant="display" />
          <Txt variant="caption">{copy.run.unit(run)}</Txt>
        </View>
        <View style={styles.pips}>
          {Array.from({ length: STREAK.weekLength }, (_, index) => {
            const day = index + 1;
            return (
              <View
                key={day}
                style={[
                  styles.pip,
                  PAY_DAYS.has(day) && styles.payPip,
                  day <= filled ? styles.pipDone : styles.pipOpen,
                ]}
              />
            );
          })}
        </View>
      </HeroTile>

      <HeroTile
        icon="coin"
        title={copy.purse.title}
        glow="currency"
        glowOrigin="bottomRight"
        isLit={todayEarned > 0}
        onPress={onOpenPurse}
        accessibilityLabel={copy.purse.label(denarii, todayEarned)}
        accessibilityHint={copy.purse.hint}
      >
        <View style={styles.figure}>
          <RollingNumber value={String(denarii)} variant="display" />
          <Txt variant="caption">{copy.purse.unit}</Txt>
        </View>
        <Txt variant="caption" color={todayEarned > 0 ? 'currency' : 'textMuted'} numberOfLines={1}>
          {todayEarned > 0 ? copy.purse.today(todayEarned) : copy.purse.none}
        </Txt>
      </HeroTile>
    </View>
  );
}

const PIP = 6;
const PAY_PIP = 10;

const useStyles = createStyles((theme) => ({
  row: { flexDirection: 'row', gap: theme.space.md },
  stacked: { flexDirection: 'column' },
  figure: { marginTop: theme.space.sm },
  pips: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.space.sm,
  },
  pip: { width: PIP, height: PIP, borderRadius: PIP / 2 },
  payPip: { width: PAY_PIP, height: PAY_PIP, borderRadius: PAY_PIP / 2 },
  pipDone: { backgroundColor: theme.colors.info },
  pipOpen: { backgroundColor: theme.colors.borderStrong },
}));
