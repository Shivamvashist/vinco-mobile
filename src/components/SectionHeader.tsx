import { createStyles } from '@/theme';

import { Txt } from './Txt';

export type SectionHeaderProps = {
  title: string;
};

/** Overline title for a section: "YOUR ORDERS", "STEP ONE". Spacing matches the prototype. */
export function SectionHeader({ title }: SectionHeaderProps) {
  const styles = useStyles();
  return (
    <Txt variant="overline" accessibilityRole="header" style={styles.title}>
      {title}
    </Txt>
  );
}

const useStyles = createStyles((theme) => ({
  title: {
    marginTop: theme.space.xxl,
    marginBottom: theme.space.md,
  },
}));
