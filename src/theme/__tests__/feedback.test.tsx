import { render } from '@testing-library/react-native';
import { createAudioPlayer } from 'expo-audio';

import { ThemeProvider, useFeedback } from '../ThemeProvider';
import { DEFAULT_THEME_PREFERENCES } from '../themes/registry';
import { vincoTheme } from '../themes/vinco';
import type { FeedbackCue } from '../types';

const mockedCreatePlayer = createAudioPlayer as jest.Mock;

/** Plays each cue once on mount, then renders nothing. */
function Player({ cues }: { cues: FeedbackCue[] }) {
  const play = useFeedback();
  cues.forEach((cue) => play(cue));
  return null;
}

/** The player made for a cue: the bank creates them in the theme's cue order. */
function playerFor(cue: FeedbackCue) {
  const index = Object.keys(vincoTheme.feedback.sounds).indexOf(cue);
  return mockedCreatePlayer.mock.results[index]?.value;
}

beforeEach(() => mockedCreatePlayer.mockClear());

describe('feedback with Sounds off', () => {
  it('still plays the seal and the stamp, and nothing else', async () => {
    const { rerender } = render(
      <ThemeProvider
        preferences={{ ...DEFAULT_THEME_PREFERENCES, soundEnabled: false }}
        onPreferencesChange={() => undefined}
      >
        <Player cues={[]} />
      </ThemeProvider>,
    );
    // The bank loads after the first render; play once it exists.
    rerender(
      <ThemeProvider
        preferences={{ ...DEFAULT_THEME_PREFERENCES, soundEnabled: false }}
        onPreferencesChange={() => undefined}
      >
        <Player cues={['tap', 'seal', 'stamp']} />
      </ThemeProvider>,
    );
    await Promise.resolve();
    // The seal and the stamp rewind to play; the tap is never touched.
    expect(playerFor('seal').seekTo).toHaveBeenCalled();
    expect(playerFor('stamp').seekTo).toHaveBeenCalled();
    expect(playerFor('tap').seekTo).not.toHaveBeenCalled();
  });
});
