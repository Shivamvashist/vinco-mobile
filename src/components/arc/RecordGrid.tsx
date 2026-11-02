import { View } from 'react-native';

import { arcCopy } from '@/copy';
import { createStyles } from '@/theme';

import { StatTile } from '../progress/StatTile';

export type RecordGridProps = {
  isLudus: boolean;
  campaign: number;
  bestCampaign: number;
  completedDays: number;
  conqueredDays: number;
  heldDays: number;
  trucesUsed: number;
  selfies: number;
  /** Days from Day I to today (the Ludus shows it in place of Truces). */
  daysSoFar: number;
  /** Where the grid starts in Vici's return stagger; each tile follows diagonally. Default 0. */
  settleFrom?: number;
};

const copy = arcCopy.stats;

/** Vici's record in two rows: six numbers for a campaign, five in the Ludus (days trained, not a campaign). */
export function RecordGrid(props: RecordGridProps) {
  const styles = useStyles();
  const settleFrom = props.settleFrom ?? 0;
  const first = props.isLudus
    ? [
        { value: props.completedDays, label: copy.trained, isHeadline: true },
        { value: props.conqueredDays, label: copy.conquered },
        { value: props.heldDays, label: copy.held },
      ]
    : [
        { value: props.campaign, label: copy.campaign, isHeadline: true },
        { value: props.bestCampaign, label: copy.best },
        { value: props.conqueredDays, label: copy.conquered },
      ];
  const second = props.isLudus
    ? [
        { value: props.daysSoFar, label: copy.daysSoFar },
        { value: props.selfies, label: copy.selfies },
      ]
    : [
        { value: props.heldDays, label: copy.held },
        { value: props.trucesUsed, label: copy.trucesUsed },
        { value: props.selfies, label: copy.selfies },
      ];

  return (
    <View style={styles.grid}>
      {[first, second].map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((stat, column) => (
            <StatTile
              key={stat.label}
              settleOrder={settleFrom + rowIndex + column}
              value={String(stat.value)}
              label={stat.label}
              color={'isHeadline' in stat && stat.isHeadline ? 'accent' : 'text'}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  grid: { gap: theme.space.sm },
  row: { flexDirection: 'row', gap: theme.space.sm },
}));
