import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { Button } from '@/components/Button';
import { FlowLayout } from '@/components/onboarding/FlowLayout';
import { PermissionList } from '@/components/permissions/PermissionList';
import { onboardingCopy } from '@/copy';
import { ESSENTIAL_PERMISSIONS, useAppPermissions } from '@/hooks/useAppPermissions';
import { getStepPosition, useOnboardingStore } from '@/stores';

const copy = onboardingCopy.permissions;

/**
 * Asks ahead for what the next steps and the days use: reminders, the camera (selfie) and the
 * microphone (oath), plus the alarm and the focus guard in the Vinco build. Every one is
 * optional: Continue always goes on, and each is asked again in context if still off.
 */
export default function OnboardingPermissionsScreen() {
  const arcKind = useOnboardingStore((state) => state.arcKind);
  const setLastStep = useOnboardingStore((state) => state.setLastStep);
  const position = getStepPosition('permissions', arcKind);
  const permissions = useAppPermissions();
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => setLastStep('permissions'), [setLastStep]);

  const canAskAny = ESSENTIAL_PERMISSIONS.some((key) => permissions.items[key].canAsk);
  const goNext = () => router.push('/onboarding/oath');

  const handleAllowAll = () => {
    setIsAsking(true);
    void permissions.requestEssentials().finally(() => setIsAsking(false));
  };

  return (
    <FlowLayout
      step={position.step}
      totalSteps={position.total}
      backHref="/onboarding/tone"
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        canAskAny || isAsking ? (
          <>
            <Button
              label={copy.allowAll}
              accessibilityHint={copy.allowAllHint}
              loading={isAsking}
              onPress={handleAllowAll}
            />
            <Button label={onboardingCopy.continue} variant="ghost" cue={null} onPress={goNext} />
          </>
        ) : (
          <Button label={onboardingCopy.continue} onPress={goNext} />
        )
      }
    >
      <PermissionList permissions={permissions} />
    </FlowLayout>
  );
}
