import { useEffect, useEffectEvent, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { noticesCopy } from '@/copy';
import { createStyles, useFeedback, useTheme } from '@/theme';

import { NoticePill } from './NoticePill';
import {
  claimAnnouncement,
  createNoticeHostId,
  dismissNotice,
  registerNoticeHost,
  useNotices,
} from './notices';

/**
 * Where notices draw: a strip under the status bar, over everything else in its window. Mounted
 * once in the root layout, and inside each open BottomSheet (a Modal is its own window). Only the
 * newest host draws. A fresh notice is announced to screen readers and gives a light haptic
 * (a firmer one for warnings and errors); notices never make a sound.
 */
export function NoticeHost() {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const play = useFeedback();
  const [hostId] = useState(createNoticeHostId);
  const { queue, activeHost } = useNotices();
  const visible = activeHost === hostId ? queue.visible : null;
  const visibleKey = visible?.key ?? null;

  useEffect(() => registerNoticeHost(hostId), [hostId]);

  const announce = useEffectEvent(() => {
    if (!visible || !claimAnnouncement(visible.key)) return;
    play(visible.kind === 'error' || visible.kind === 'warning' ? 'noticeAlert' : 'notice');
    AccessibilityInfo.announceForAccessibility(
      noticesCopy.spoken(noticesCopy.kinds[visible.kind], visible.message, visible.count),
    );
  });

  useEffect(() => {
    if (visibleKey != null) announce();
  }, [visibleKey]);

  if (!visible) return null;
  return (
    <GestureHandlerRootView
      pointerEvents="box-none"
      style={[styles.host, { top: insets.top + theme.space.xs }]}
    >
      <NoticePill key={visible.key} notice={visible} onGone={dismissNotice} />
    </GestureHandlerRootView>
  );
}

const useStyles = createStyles((theme) => ({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: theme.layout.flowGutter,
  },
}));
