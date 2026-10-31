/**
 * In-app notices, callable from anywhere: `notify({ kind, message, action?, id? })` and
 * `dismissNotice(id)`. The queue's rules are pure (features/notices); this module holds the one
 * live queue and the hosts that draw it. The root layout mounts a host for every screen, and each
 * open BottomSheet mounts one inside its Modal (a Modal is its own window on Android, so nothing
 * outside it can draw on top). Only the newest host draws, so a notice is never shown twice.
 */
import { useSyncExternalStore } from 'react';
import { AppState, type NativeEventSubscription } from 'react-native';

import {
  dismissFromQueue,
  EMPTY_NOTICE_QUEUE,
  enqueueNotice,
  keepOnlyErrors,
  type NoticeInput,
  noticeKey,
  type NoticeQueue,
} from '@/features/notices';

type NoticesState = {
  queue: NoticeQueue;
  /** The host that draws: the newest one mounted, or null. */
  activeHost: number | null;
};

let state: NoticesState = { queue: EMPTY_NOTICE_QUEUE, activeHost: null };
let hosts: number[] = [];
let nextHostId = 1;
let lastAnnouncedKey: string | null = null;
let appStateSubscription: NativeEventSubscription | null = null;
const listeners = new Set<() => void>();

/**
 * Shows a short notice at the top of the screen. Returns its key, for dismissNotice.
 * Errors stay until dismissed or acted on; the others leave by themselves.
 */
export function notify(input: NoticeInput): string {
  setQueue(enqueueNotice(state.queue, input, Date.now()));
  return noticeKey({ ...input, message: input.message.trim() });
}

/** Takes a notice away by its id (or the key notify returned), on screen or waiting. */
export function dismissNotice(id: string): void {
  setQueue(dismissFromQueue(state.queue, id, Date.now()));
}

/**
 * True once per notice shown: the host announces it to screen readers and gives its haptic.
 * A merged repeat, or the same notice moving to another host, is not announced again.
 */
export function claimAnnouncement(key: string): boolean {
  if (lastAnnouncedKey === key) return false;
  lastAnnouncedKey = key;
  return true;
}

/** A new host's id (once per host, before it registers). */
export function createNoticeHostId(): number {
  return nextHostId++;
}

/** A host puts itself on top of the stack. Returns the way off it. */
export function registerNoticeHost(id: number): () => void {
  hosts = [...hosts.filter((host) => host !== id), id];
  if (!appStateSubscription) {
    appStateSubscription = AppState.addEventListener('change', (status) => {
      // What was passing is stale when the user comes back; errors still wait for them.
      if (status === 'background') setQueue(keepOnlyErrors(state.queue, Date.now()));
    });
  }
  setState({ ...state, activeHost: id });
  return () => {
    hosts = hosts.filter((host) => host !== id);
    if (hosts.length === 0) {
      appStateSubscription?.remove();
      appStateSubscription = null;
    }
    setState({ ...state, activeHost: hosts[hosts.length - 1] ?? null });
  };
}

/** The queue and the drawing host, live. */
export function useNotices(): NoticesState {
  return useSyncExternalStore(subscribe, getNotices, getNotices);
}

/** The queue now, outside React. */
export function getNotices(): NoticesState {
  return state;
}

/** Every notice gone at once (the journey was reset, and between tests). Hosts stay mounted. */
export function clearNotices(): void {
  lastAnnouncedKey = null;
  setQueue(EMPTY_NOTICE_QUEUE);
}

function setQueue(queue: NoticeQueue): void {
  if (queue === state.queue) return;
  if (!queue.visible) lastAnnouncedKey = null;
  setState({ ...state, queue });
}

function setState(next: NoticesState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
