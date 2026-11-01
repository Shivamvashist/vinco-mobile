import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { FlowLayout } from '@/components/onboarding/FlowLayout';
import { PermissionRow } from '@/components/permissions/PermissionRow';
import { Txt } from '@/components/Txt';
import { onboardingCopy, permissionsCopy } from '@/copy';
import { useAppPermissions } from '@/hooks/useAppPermissions';
import { getStepPosition, useOnboardingStore } from '@/stores';
import { createStyles } from '@/theme';

const copy = onboardingCopy.permissions;

/**
 * Asks only for reminders, the one permission every plan uses from Day I. The camera is asked
 * when the selfie is taken, the microphone when the oath is recorded, the alarm and the focus
 * guard when they are set up. Optional: Continue always goes on.
 */
export default function OnboardingPermissionsScreen() {
  const styles = useStyles();
  const arcKind = useOnboardingStore((state) => state.arcKind);
  const setLastStep = useOnboardingStore((state) => state.setLastStep);
  const position = getStepPosition('permissions', arcKind);
  const reminders = useAppPermissions().items.notifications;

  useEffect(() => setLastStep('permissions'), [setLastStep]);

  return (
    <FlowLayout
      step={position.step}
      totalSteps={position.total}
      backHref="/onboarding/tone"
      title={copy.title}
      subtitle={copy.subtitle}
      footer={<Button label={onboardingCopy.continue} onPress={() => router.push('/onboarding/oath')} />}
    >
      <View style={styles.body}>
        <PermissionRow
          icon="bell"
          label={permissionsCopy.items.notifications.label}
          why={permissionsCopy.items.notifications.why}
          permission={reminders}
        />
        <Txt variant="caption">{copy.later}</Txt>
      </View>
    </FlowLayout>
  );
}

const useStyles = createStyles((theme) => ({
  body: { gap: theme.space.md },
}));
