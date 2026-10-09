/**
 * DEV ONLY: every UI kit component in its states, interactive, for checking on a phone.
 * Shown inside the theme lab. Labels are not user-facing, so they are not in src/copy.
 */
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { ChoiceChip } from '@/components/ChoiceChip';
import { Icon, ICON_NAMES } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Laurel } from '@/components/Laurel';
import { OptionCard } from '@/components/OptionCard';
import { ProgressBar } from '@/components/ProgressBar';
import { ProgressRing } from '@/components/ProgressRing';
import { SectionHeader } from '@/components/SectionHeader';
import { StampMark } from '@/components/StampMark';
import { StatChip } from '@/components/StatChip';
import { StatusCircle } from '@/components/StatusCircle';
import { Stepper } from '@/components/Stepper';
import { Txt } from '@/components/Txt';
import type { OrderStatus } from '@/features/orders';
import { createStyles } from '@/theme';

const SHEET_SAMPLE = `15 seconds. "Push day, bench 3 sets, 40 minutes." That's enough.`;
const STATUSES: OrderStatus[] = ['none', 'min', 'full'];
const ARCS = [
  {
    days: 30,
    roman: 'XXX',
    title: 'First campaign',
    description: 'Prove you can hold the line for a month.',
  },
  {
    days: 60,
    roman: 'LX',
    title: 'The winter arc',
    description: 'Through the cold months.',
    badge: 'Most chosen',
  },
  { days: 90, roman: 'XC', title: 'Legend tier', description: 'Finish it and earn the rank of Caesar.' },
];

export function KitGallery() {
  const styles = useStyles();
  const [litres, setLitres] = useState(1);
  const [ordersDone, setOrdersDone] = useState(1);
  const [statusIndex, setStatusIndex] = useState(0);
  const [arc, setArc] = useState(60);
  const [scene, setScene] = useState<'open' | 'missed'>('open');
  const [waterGoal, setWaterGoal] = useState(4);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <View>
      <Group title="Icons">
        <View style={styles.wrapRow}>
          {ICON_NAMES.map((name) => (
            <View key={name} style={styles.iconCell}>
              <Icon name={name} />
              <Txt variant="micro">{name}</Txt>
            </View>
          ))}
        </View>
      </Group>

      <Group title="Marks">
        <Laurel />
        <StampMark text="VINCO" />
        <StampMark text="DAY I" caption="9 OCTOBER 2026" size="medium" />
      </Group>

      <Group title="Buttons (tap Loading to toggle)">
        <Button label="Continue" onPress={() => undefined} />
        <Button label="Seal the day" loading={isLoading} onPress={() => undefined} />
        <Button label="Loading" variant="secondary" size="compact" onPress={() => setIsLoading((v) => !v)} />
        <Button label="Allow all three to start" disabled onPress={() => undefined} />
        <Button label="See your progress" variant="secondary" onPress={() => undefined} />
        <Button label="Skip for now" variant="ghost" cue={null} onPress={() => undefined} />
        <Button
          label="Cross the Rubicon"
          sublabel="Begin your arc"
          size="large"
          cue="cross"
          onPress={() => undefined}
        />
        <View style={styles.row}>
          <IconButton icon="back" accessibilityLabel="Back" onPress={() => undefined} />
          <IconButton icon="close" accessibilityLabel="Close" onPress={() => undefined} />
          <IconButton icon="flipCamera" accessibilityLabel="Flip camera" onPress={() => undefined} />
        </View>
      </Group>

      <Group title="Chips">
        <View style={styles.wrapRow}>
          <StatChip icon="flame" label="Campaign 11" />
          <StatChip label="Truce ready" emphasis="muted" />
          <StatChip label="Optio" emphasis="muted" />
        </View>
        <View style={styles.wrapRow} accessibilityRole="radiogroup">
          <ChoiceChip label="9pm, task open" selected={scene === 'open'} onPress={() => setScene('open')} />
          <ChoiceChip label="Missed a day" selected={scene === 'missed'} onPress={() => setScene('missed')} />
        </View>
      </Group>

      <Group title="Section header">
        <SectionHeader title="Your orders" />
      </Group>

      <Group title="Progress (tap the ring, use the water buttons)">
        <View style={styles.row}>
          <Button
            label="+1 L"
            size="compact"
            variant="secondary"
            onPress={() => setLitres((value) => (value >= 4 ? 0 : value + 1))}
          />
        </View>
        <ProgressBar segments={{ total: 4, filled: litres }} accessibilityLabel="Water" />
        <ProgressBar segments={{ total: 5, filled: 2 }} size="thin" />
        <ProgressBar value={0.4} size="thick" />
        <View style={styles.row}>
          <ProgressRing value={ordersDone / 4} accessibilityLabel={`${ordersDone} of 4 orders held`}>
            <Txt variant="headingSmall">{`${ordersDone}/4`}</Txt>
          </ProgressRing>
          <Button
            label="Next order"
            size="compact"
            variant="secondary"
            onPress={() => setOrdersDone((value) => (value >= 4 ? 0 : value + 1))}
          />
        </View>
      </Group>

      <Group title="Status circle (tap to cycle)">
        <View style={styles.row}>
          {STATUSES.map((status) => (
            <StatusCircle key={status} status={status} />
          ))}
          <Button
            label={`Cycle: ${STATUSES[statusIndex] ?? 'none'}`}
            size="compact"
            variant="secondary"
            onPress={() => setStatusIndex((index) => (index + 1) % STATUSES.length)}
          />
          <StatusCircle status={STATUSES[statusIndex] ?? 'none'} />
        </View>
      </Group>

      <Group title="Option cards">
        <View style={styles.stack} accessibilityRole="radiogroup">
          {ARCS.map((option) => (
            <OptionCard
              key={option.days}
              title={option.title}
              description={option.description}
              badge={option.badge}
              selected={arc === option.days}
              onPress={() => setArc(option.days)}
              leading={
                <View style={styles.arcNumber}>
                  <Txt variant="eyebrow">{option.roman}</Txt>
                  <Txt variant="display" color={arc === option.days ? 'accent' : 'text'}>
                    {option.days}
                  </Txt>
                </View>
              }
            />
          ))}
        </View>
      </Group>

      <Group title="Stepper">
        <Stepper
          caption="Conquer"
          value={waterGoal}
          onChange={setWaterGoal}
          min={2}
          max={5}
          step={0.5}
          formatValue={(value) => `${value} litres`}
          accessibilityLabel="Water full goal"
        />
      </Group>

      <Group title="Bottom sheet">
        <Button label="Open sheet" variant="secondary" onPress={() => setIsSheetOpen(true)} />
        <BottomSheet visible={isSheetOpen} onClose={() => setIsSheetOpen(false)} title="What did you train?">
          <Txt variant="caption">{SHEET_SAMPLE}</Txt>
          <View style={styles.sheetAction}>
            <Button label="Done" onPress={() => setIsSheetOpen(false)} />
          </View>
        </BottomSheet>
      </Group>
    </View>
  );
}

type GroupProps = {
  title: string;
  children: ReactNode;
};

function Group({ title, children }: GroupProps) {
  const styles = useStyles();
  return (
    <View style={styles.group}>
      <Txt variant="overline">{title}</Txt>
      {children}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  group: { marginTop: theme.space.xxl, gap: theme.space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
  stack: { gap: theme.space.md },
  iconCell: { width: 64, alignItems: 'center', gap: theme.space.xs },
  arcNumber: { width: 64 },
  sheetAction: { marginTop: theme.space.xl },
}));
