import { createAudioPlayer } from 'expo-audio';

import { createSoundBank } from '../feedback/soundBank';
import type { FeedbackSet } from '../types';

const mockedCreatePlayer = createAudioPlayer as jest.Mock;

function feedbackWith(sounds: Partial<FeedbackSet['sounds']>): FeedbackSet {
  return { volume: 0.5, sounds: sounds as FeedbackSet['sounds'], haptics: {} as FeedbackSet['haptics'] };
}

beforeEach(() => mockedCreatePlayer.mockClear());

describe('createSoundBank', () => {
  it('preloads one player per sound and applies the volume', () => {
    createSoundBank(feedbackWith({ tap: 1, win: 2, stamp: null }));
    expect(mockedCreatePlayer).toHaveBeenCalledTimes(2);
    expect(mockedCreatePlayer.mock.results[0]?.value.volume).toBe(0.5);
  });

  it('rewinds, then plays once the rewind has landed', async () => {
    const bank = createSoundBank(feedbackWith({ tap: 1 }));
    const player = mockedCreatePlayer.mock.results[0]?.value;
    bank.play('tap');
    expect(player.seekTo).toHaveBeenCalledWith(0);
    expect(player.play).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it('still plays when the rewind fails', async () => {
    const bank = createSoundBank(feedbackWith({ tap: 1 }));
    const player = mockedCreatePlayer.mock.results[0]?.value;
    player.seekTo.mockReturnValueOnce(Promise.reject(new Error('seek failed')));
    bank.play('tap');
    await Promise.resolve();
    await Promise.resolve();
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it('does nothing for a silent or unknown cue', () => {
    const bank = createSoundBank(feedbackWith({ stamp: null }));
    expect(() => bank.play('stamp')).not.toThrow();
    expect(() => bank.play('tap')).not.toThrow();
  });

  it('skips a sound that fails to load instead of crashing', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockedCreatePlayer.mockImplementationOnce(() => {
      throw new Error('decode failed');
    });
    const bank = createSoundBank(feedbackWith({ tap: 1, win: 2 }));
    expect(() => bank.play('tap')).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('clamps volume into 0 to 1', () => {
    createSoundBank({ ...feedbackWith({ tap: 1 }), volume: 3 });
    expect(mockedCreatePlayer.mock.results[0]?.value.volume).toBe(1);
  });

  it('releases every player and plays nothing afterwards', () => {
    const bank = createSoundBank(feedbackWith({ tap: 1 }));
    const player = mockedCreatePlayer.mock.results[0]?.value;
    bank.release();
    expect(player.release).toHaveBeenCalledTimes(1);
    bank.play('tap');
    expect(player.play).not.toHaveBeenCalled();
  });
});
