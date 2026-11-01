import { Storage } from 'expo-sqlite/kv-store';

/** The last error that broke a screen or the app, kept on the phone for the developer. */
export type CrashRecord = { at: string; where: string; message: string; stack: string };

const KEY = 'vinco.lastCrash';
/** Enough stack to find the line, small enough to read on a phone. */
const STACK_LINES = 8;

/** The error's message and the top of its stack, as plain text. Never throws. */
export function describeError(error: unknown): { message: string; stack: string } {
  if (error instanceof Error) {
    const stack = (error.stack ?? '').split('\n').slice(0, STACK_LINES).join('\n');
    return { message: `${error.name}: ${error.message}`, stack };
  }
  return { message: String(error), stack: '' };
}

/** Keeps the latest crash. Storage failing must never add a second error. */
export function recordCrash(error: unknown, where: string): void {
  try {
    const record: CrashRecord = { at: new Date().toISOString(), where, ...describeError(error) };
    Storage.setItemSync(KEY, JSON.stringify(record));
  } catch {
    // Nothing more to do: the crash itself is already being handled.
  }
}

/** The latest crash, or null. */
export function readLastCrash(): CrashRecord | null {
  try {
    const raw = Storage.getItemSync(KEY);
    return raw ? (JSON.parse(raw) as CrashRecord) : null;
  } catch {
    return null;
  }
}

/** Forgets the kept crash (dev tools). */
export function clearLastCrash(): void {
  try {
    Storage.removeItemSync(KEY);
  } catch {
    // Nothing kept, or storage unavailable: either way there is nothing to show.
  }
}

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsShape = {
  getGlobalHandler: () => GlobalHandler;
  setGlobalHandler: (handler: GlobalHandler) => void;
};

let isInstalled = false;

/**
 * Records every uncaught JavaScript error (timers, presses, promises React doesn't see) before the
 * default handler runs, so a crash on the phone leaves its cause behind. Install once, at start-up.
 */
export function installCrashRecorder(): void {
  const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsShape }).ErrorUtils;
  if (isInstalled || !errorUtils) return;
  isInstalled = true;
  const previous = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    recordCrash(error, isFatal ? 'fatal' : 'error');
    previous(error, isFatal);
  });
}
