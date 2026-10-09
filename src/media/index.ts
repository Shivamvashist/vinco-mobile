/**
 * Photos and recordings, kept in the app's private folder. They never leave the phone.
 * Each function moves a temporary capture (camera or recorder cache) to its permanent place
 * and returns the new file URI to store in the database. Throws if the file system fails.
 */
import { Directory, File, Paths } from 'expo-file-system';

import type { DayKey } from '@/lib/dates';

const SELFIE_FOLDER = 'selfies';
const OATH_FOLDER = 'oath';
const DEFAULT_AUDIO_EXTENSION = '.m4a';

/**
 * Saves a day's selfie as selfies/YYYY-MM-DD-<time>.jpg. Every capture gets its own name, so a
 * retake can never show the old photo from the image cache. The caller deletes the old file
 * once the new path is saved (see useDailySelfie).
 */
export async function saveSelfie(sourceUri: string, day: DayKey): Promise<string> {
  return keepFile(sourceUri, SELFIE_FOLDER, `${day}-${Date.now()}.jpg`);
}

/** Saves the oath recording with a unique name, keeping the recorder's file type. */
export async function saveOath(sourceUri: string): Promise<string> {
  return keepFile(sourceUri, OATH_FOLDER, `oath-${Date.now()}${extensionOf(sourceUri)}`);
}

/** Deletes a saved file if it exists. Never throws: a missing file is already the goal. */
export function deleteMediaFile(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    if (__DEV__) console.warn('[media] Could not delete file.', error);
  }
}

/** Deletes every saved selfie and oath. Never throws: what can't be deleted is left behind. */
export function deleteAllMedia(): void {
  for (const folderName of [SELFIE_FOLDER, OATH_FOLDER]) {
    try {
      const folder = new Directory(Paths.document, folderName);
      if (folder.exists) folder.delete();
    } catch (error) {
      if (__DEV__) console.warn(`[media] Could not delete ${folderName}.`, error);
    }
  }
}

async function keepFile(sourceUri: string, folderName: string, fileName: string): Promise<string> {
  const folder = new Directory(Paths.document, folderName);
  if (!folder.exists) folder.create({ intermediates: true, idempotent: true });
  const destination = new File(folder, fileName);
  if (destination.exists) destination.delete();
  await new File(sourceUri).move(destination);
  return destination.uri;
}

function extensionOf(uri: string): string {
  const match = /\.[a-z0-9]{2,4}$/i.exec(uri.split('?')[0] ?? '');
  return match ? match[0].toLowerCase() : DEFAULT_AUDIO_EXTENSION;
}
