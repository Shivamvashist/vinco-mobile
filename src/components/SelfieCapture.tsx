import Slider from '@react-native-community/slider';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Image, Linking, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { proofCopy } from '@/copy';
import type { DayKey } from '@/lib/dates';
import { deleteMediaFile, saveSelfie } from '@/media';
import { createStyles, useFeedback, useReduceMotion, useTheme } from '@/theme';

import { Button } from './Button';
import { IconButton } from './IconButton';
import { StampSlam } from './StampSlam';
import { Txt } from './Txt';

const copy = proofCopy.camera;

// One-off sizes from the prototype's selfie screens.
const FRAME_HEIGHT = 420;
const SHUTTER_SIZE = 76;
const GUIDE_WIDTH = 200;
const GUIDE_HEIGHT = 260;

/** ready: camera on. review: the shot waits for "Looks right". saving: moving it into place. */
type Phase = 'ready' | 'capturing' | 'review' | 'saving' | 'captured' | 'failed';

/** The ghost slider moves in 5% steps. */
const GHOST_STEP = 0.05;

export type SelfieCaptureProps = {
  day: DayKey;
  /** A stamp that slams onto the photo after the shot (DAY I in onboarding). */
  stamp?: { text: string; caption: string };
  /** Yesterday's photo, shown faintly over the camera to line up against. */
  ghostUri?: string | null;
  /** 0 hides the ghost. */
  ghostOpacity?: number;
  /** Shows the "Yesterday's outline" slider (up to `ghostOpacityMax`) when there is a ghost. */
  onGhostOpacityChange?: (opacity: number) => void;
  ghostOpacityMax?: number;
  /**
   * Shows each shot with the face outline and asks "Looks right?" before saving.
   * True face detection needs a custom build; until then the user checks by eye.
   */
  confirmAlignment?: boolean;
  /** Today's photo if already taken: shown, with Retake. */
  existingUri?: string | null;
  /** The photo is saved in the app's private folder (retakes replace it). */
  onCaptured: (path: string) => void;
};

/**
 * The selfie camera: front-facing (flippable), with a face outline or yesterday's photo as a guide.
 * Handles the camera permission: asks when it can, points to Settings when it can't.
 */
export function SelfieCapture({
  day,
  stamp,
  ghostUri,
  ghostOpacity = 0,
  onGhostOpacityChange,
  ghostOpacityMax = 0.6,
  confirmAlignment = false,
  existingUri,
  onCaptured,
}: SelfieCaptureProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [phase, setPhase] = useState<Phase>(existingUri ? 'captured' : 'ready');
  const [photoUri, setPhotoUri] = useState<string | null>(existingUri ?? null);
  /** The shot waiting in review (still in the camera's cache). */
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [hasSaveFailed, setHasSaveFailed] = useState(false);
  const [facing, setFacing] = useState<CameraType>('front');

  /** Moves a shot into the selfie folder and reports it. */
  const keep = async (uri: string) => {
    const path = await saveSelfie(uri, day);
    setPhotoUri(path);
    setPendingUri(null);
    setPhase('captured');
    onCaptured(path);
  };

  const capture = async () => {
    if (phase === 'capturing' || !camera.current) return;
    setPhase('capturing');
    setHasSaveFailed(false);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.8, shutterSound: false });
      if (!photo?.uri) throw new Error('No photo returned');
      // The stamp plays its own sound on impact; a plain selfie gets the shutter.
      if (!stamp) play('shutter');
      if (confirmAlignment) {
        setPendingUri(photo.uri);
        setPhase('review');
        return;
      }
      await keep(photo.uri);
    } catch (error) {
      if (__DEV__) console.warn('[selfie] Capture failed.', error);
      setPhase('failed');
    }
  };

  const confirm = async () => {
    if (phase !== 'review' || !pendingUri) return;
    setPhase('saving');
    try {
      await keep(pendingUri);
    } catch (error) {
      if (__DEV__) console.warn('[selfie] Save failed.', error);
      setHasSaveFailed(true);
      setPhase('review');
    }
  };

  const retake = () => {
    // A shot rejected in review was never saved: drop it from the cache.
    if (pendingUri) deleteMediaFile(pendingUri);
    setPendingUri(null);
    setHasSaveFailed(false);
    setPhotoUri(null);
    setPhase('ready');
  };

  if (!permission) return <View style={styles.frame} />;

  if (!permission.granted && phase !== 'captured') {
    return (
      <View style={[styles.frame, styles.permission]}>
        <Txt variant="body" color="textMuted" align="center">
          {copy.permissionDenied}
        </Txt>
        {permission.canAskAgain ? (
          <Button
            label={copy.allowCamera}
            size="compact"
            cue={null}
            onPress={() => void requestPermission()}
          />
        ) : (
          <Button
            label={copy.openSettings}
            variant="secondary"
            size="compact"
            cue={null}
            onPress={() => void Linking.openSettings()}
          />
        )}
      </View>
    );
  }

  const isCaptured = phase === 'captured' && photoUri != null;
  const isReviewing = (phase === 'review' || phase === 'saving') && pendingUri != null;
  const showGhost = !isCaptured && ghostUri != null && ghostOpacity > 0;
  const showGhostSlider = !isCaptured && ghostUri != null && onGhostOpacityChange != null;

  return (
    <View>
      <View style={styles.frame}>
        {isCaptured ? (
          <Image source={{ uri: photoUri }} style={styles.fill} accessibilityIgnoresInvertColors />
        ) : isReviewing ? (
          <Image source={{ uri: pendingUri }} style={styles.fill} accessibilityIgnoresInvertColors />
        ) : (
          <CameraView ref={camera} style={styles.fill} facing={facing} mirror={facing === 'front'} />
        )}
        {showGhost ? (
          <Image
            source={{ uri: ghostUri }}
            style={[styles.fill, { opacity: ghostOpacity }]}
            accessibilityIgnoresInvertColors
            accessible={false}
          />
        ) : null}
        {isCaptured && stamp ? (
          <View style={[styles.fill, styles.dim, styles.centre]}>
            <StampSlam text={stamp.text} caption={stamp.caption} size="medium" cue="seal" delay={250} />
          </View>
        ) : null}
        {isReviewing ? <FaceGuide isStill /> : null}
        {!isCaptured && !isReviewing ? (
          <>
            {showGhost ? null : <FaceGuide />}
            <Txt variant="caption" align="center" style={styles.guideText}>
              {showGhost ? copy.ghostGuide : copy.guide}
            </Txt>
            <View style={styles.flip}>
              <IconButton
                icon="flipCamera"
                accessibilityLabel={copy.flip}
                onPress={() => setFacing((current) => (current === 'front' ? 'back' : 'front'))}
              />
            </View>
          </>
        ) : null}
      </View>

      {showGhostSlider ? (
        <View style={styles.ghostControl}>
          <View style={styles.ghostLabelRow}>
            <Txt variant="caption">{copy.ghostSlider}</Txt>
            <Txt variant="caption" color="text">
              {copy.ghostValue(Math.round(ghostOpacity * 100))}
            </Txt>
          </View>
          <Slider
            accessibilityLabel={copy.ghostSlider}
            minimumValue={0}
            maximumValue={ghostOpacityMax}
            step={GHOST_STEP}
            value={Math.min(ghostOpacity, ghostOpacityMax)}
            onValueChange={onGhostOpacityChange}
            minimumTrackTintColor={theme.colors.accent}
            maximumTrackTintColor={theme.colors.borderStrong}
            thumbTintColor={theme.colors.accent}
          />
        </View>
      ) : null}

      {isReviewing ? (
        <View style={styles.controls}>
          <Txt variant="body" align="center" accessibilityRole="header">
            {ghostUri ? copy.reviewQuestion : copy.reviewQuestionFirst}
          </Txt>
          {hasSaveFailed ? (
            <Txt variant="caption" color="danger" align="center" accessibilityRole="alert">
              {copy.failed}
            </Txt>
          ) : null}
          <View style={styles.reviewActions}>
            <Button
              label={copy.looksRight}
              cue="confirm"
              loading={phase === 'saving'}
              onPress={() => void confirm()}
            />
            <Button label={copy.retake} variant="ghost" cue={null} onPress={retake} />
          </View>
        </View>
      ) : isCaptured ? (
        stamp ? null : (
          <View style={styles.controls}>
            <Button label={copy.retake} variant="secondary" size="compact" cue={null} onPress={retake} />
          </View>
        )
      ) : (
        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.takeSelfie}
            accessibilityState={{ busy: phase === 'capturing' }}
            disabled={phase === 'capturing'}
            onPress={() => void capture()}
            style={({ pressed }) => [styles.shutter, pressed && styles.pressed]}
          >
            <View style={styles.shutterCore} />
          </Pressable>
          <Txt variant="micro" align="center" color={phase === 'failed' ? 'danger' : 'textMuted'}>
            {phase === 'failed' ? copy.failed : copy.privacy}
          </Txt>
        </View>
      )}
    </View>
  );
}

/** The dashed head-and-shoulders outline, breathing gently (still in review). Decorative. */
function FaceGuide({ isStill = false }: { isStill?: boolean }) {
  const theme = useTheme();
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const breath = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion || isStill) return;
    breath.value = withRepeat(
      withSequence(withTiming(0.5, { duration: 1200 }), withTiming(1, { duration: 1200 })),
      -1,
    );
  }, [breath, reduceMotion, isStill]);

  const breathStyle = useAnimatedStyle(() => ({ opacity: breath.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.guide, breathStyle]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Svg
        width={GUIDE_WIDTH}
        height={GUIDE_HEIGHT}
        viewBox={`0 0 ${GUIDE_WIDTH} ${GUIDE_HEIGHT}`}
        fill="none"
      >
        <Ellipse
          cx="100"
          cy="110"
          rx="70"
          ry="92"
          stroke={theme.colors.accent}
          strokeWidth={1.5}
          strokeDasharray="6 6"
        />
        <Path
          d="M20 260c8-40 40-58 80-58s72 18 80 58"
          stroke={theme.colors.accent}
          strokeWidth={1.5}
          strokeDasharray="6 6"
        />
      </Svg>
    </Animated.View>
  );
}

const useStyles = createStyles((theme) => ({
  frame: {
    height: FRAME_HEIGHT,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundDeep,
  },
  permission: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.lg,
    padding: theme.space.xxl,
  },
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  dim: { backgroundColor: theme.colors.scrim },
  centre: { alignItems: 'center', justifyContent: 'center' },
  guide: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: theme.space.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideText: { position: 'absolute', left: 0, right: 0, bottom: theme.space.lg },
  flip: { position: 'absolute', top: theme.space.sm, right: theme.space.sm },
  controls: { alignItems: 'center', gap: theme.space.md, marginTop: theme.space.xl },
  reviewActions: { alignSelf: 'stretch', gap: theme.space.xs },
  ghostControl: { marginTop: theme.space.lg },
  ghostLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  shutter: {
    width: SHUTTER_SIZE,
    height: SHUTTER_SIZE,
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.stampBorderWidth,
    borderColor: theme.colors.text,
    padding: theme.space.xs,
  },
  shutterCore: { flex: 1, borderRadius: theme.radius.pill, backgroundColor: theme.colors.text },
  pressed: { opacity: 0.7 },
}));
