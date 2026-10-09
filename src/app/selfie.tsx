import { router } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { SelfieCapture } from '@/components/SelfieCapture';
import { TextField } from '@/components/TextField';
import { Txt } from '@/components/Txt';
import { proofCopy } from '@/copy';
import { dayOfArc } from '@/lib/dates';
import { parseWeightKg } from '@/features/proof';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useCampaign } from '@/hooks/useCampaign';
import { useDailySelfie } from '@/hooks/useDailySelfie';
import { useToday } from '@/hooks/useToday';
import { toRoman } from '@/lib/toRoman';
import { GHOST_OPACITY_MAX, usePreferencesStore } from '@/stores';
import { createStyles, SchemeOverride } from '@/theme';

const copy = proofCopy.daily;

const THUMB_WIDTH = 52;
const THUMB_HEIGHT = 66;

/** The daily selfie: lined up against yesterday, kept on the phone, with an optional weight. */
export default function DailySelfieScreen() {
  return (
    <SchemeOverride scheme="dark">
      <DailySelfieContent />
    </SchemeOverride>
  );
}

function DailySelfieContent() {
  const styles = useStyles();
  const today = useToday();
  const { arc, targets } = useActiveArc();
  const campaign = useCampaign(arc, targets, today);
  const selfie = useDailySelfie(today);
  const ghostOpacity = usePreferencesStore((state) => state.ghostOpacity);
  const setGhostOpacity = usePreferencesStore((state) => state.setGhostOpacity);
  // Until the user types, the field shows the saved weight (which may load a moment after opening).
  const [editedWeight, setEditedWeight] = useState<string | null>(null);
  const weightText = editedWeight ?? (selfie.weightKg != null ? String(selfie.weightKg) : '');
  const [isWeightInvalid, setIsWeightInvalid] = useState(false);

  const dayNumber = arc ? Math.max(1, dayOfArc(arc.startDay, today)) : 1;
  const dayRoman = toRoman(Math.min(dayNumber, 3999));
  const startDay = arc?.startDay;

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/veni');
  };

  /** Saves the weight if valid (or clears it when empty), then closes. */
  const finish = () => {
    const trimmed = weightText.trim();
    if (trimmed === '') {
      selfie.saveWeight(null);
      close();
      return;
    }
    const kg = parseWeightKg(trimmed);
    if (kg == null) {
      setIsWeightInvalid(true);
      return;
    }
    selfie.saveWeight(kg);
    close();
  };

  return (
    <Screen scroll={false} gutter="none" edges={['top', 'bottom']} background="backgroundDeep">
      <View style={styles.header}>
        <IconButton icon="close" accessibilityLabel={copy.close} onPress={close} />
        <Txt variant="headingSmall" accessibilityRole="header" style={styles.title}>
          {copy.title(dayRoman).toUpperCase()}
        </Txt>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <SelfieCapture
          day={today}
          ghostUri={selfie.ghostPath}
          ghostOpacity={ghostOpacity}
          ghostOpacityMax={GHOST_OPACITY_MAX}
          onGhostOpacityChange={setGhostOpacity}
          confirmAlignment
          existingUri={selfie.todayPath}
          onCaptured={selfie.saveSelfie}
        />

        {selfie.todayPath ? (
          <View style={styles.after}>
            <View style={styles.saved}>
              <Icon name="check" color="accent" />
              <Txt variant="body" style={styles.savedText}>
                {copy.saved(dayRoman, campaign.selfieDays, arc?.lengthDays ?? campaign.selfieDays)}
              </Txt>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.strip}
            >
              {[...selfie.recent].reverse().map((item) => (
                <View key={item.day} style={[styles.thumb, item.day === today && styles.thumbToday]}>
                  <Image
                    source={{ uri: item.selfiePath }}
                    style={styles.thumbImage}
                    accessibilityIgnoresInvertColors
                  />
                  {startDay ? (
                    <Txt variant="micro" color="text" style={styles.thumbLabel}>
                      {toRoman(Math.max(1, dayOfArc(startDay, item.day)))}
                    </Txt>
                  ) : null}
                </View>
              ))}
            </ScrollView>

            <TextField
              label={copy.weightLabel}
              value={weightText}
              onChangeText={(text) => {
                setEditedWeight(text);
                setIsWeightInvalid(false);
              }}
              placeholder={copy.weightPlaceholder}
              keyboardType="decimal-pad"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={finish}
            />
            {isWeightInvalid ? (
              <Txt variant="caption" color="danger">
                {copy.weightInvalid}
              </Txt>
            ) : null}
            <Button label={copy.done} cue="confirm" onPress={finish} />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.space.sm },
  title: { flex: 1, textAlign: 'center', letterSpacing: 2 },
  headerSpacer: { width: theme.layout.minTouchTarget },
  body: { padding: theme.space.lg, paddingBottom: theme.space.xxxl, gap: theme.space.lg },
  after: { gap: theme.space.md },
  saved: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  savedText: { flex: 1 },
  strip: { gap: theme.space.xs + theme.space.xxs },
  thumb: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  thumbToday: { borderColor: theme.colors.accent },
  thumbImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  thumbLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: theme.space.xxs,
    textAlign: 'center',
    fontFamily: theme.fonts.display,
  },
}));
