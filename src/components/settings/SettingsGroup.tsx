import { Children, Fragment, type ReactNode } from 'react';
import { View } from 'react-native';

import { createStyles } from '@/theme';

import { SectionHeader } from '../SectionHeader';

export type SettingsGroupProps = {
  /** The overline above the card, such as "YOU". */
  title: string;
  /** SettingsRows. Empty slots (null, false) are skipped, so rows can be conditional. */
  children: ReactNode;
};

/** A titled card of settings rows, with a hairline between each row. */
export function SettingsGroup({ title, children }: SettingsGroupProps) {
  const styles = useStyles();
  const rows = Children.toArray(children);
  if (rows.length === 0) return null;
  return (
    <>
      <SectionHeader title={title} />
      <View style={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <View style={styles.divider} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
    </>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    overflow: 'hidden',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  divider: { height: theme.layout.hairline, backgroundColor: theme.colors.border },
}));
