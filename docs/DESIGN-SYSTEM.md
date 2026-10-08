# Vinco design system

Roman in spirit, modern in use. Dark by default, flat and minimal, one signature moment (the VINCO stamp). Everything visual and audible comes from the theme, so a whole new look (colours, fonts, sounds, haptics) can be swapped in one place.

Code: `src/theme/`. Live preview on the phone: the theme lab at `/dev/theme-lab` (dev builds only).

---

## 1. How it fits together

```
src/theme/
  index.ts             public API: import everything from '@/theme'
  types.ts             Theme, ThemeDefinition, ColorPalette, FeedbackCue ...
  ThemeProvider.tsx    resolves the active theme; useTheme, useThemeControls, useFeedback, SchemeOverride
  createStyles.ts      themed StyleSheet hook factory
  resolveTheme.ts      preferences to a concrete theme (pure, tested)
  contrast.ts          WCAG contrast maths (used by tests)
  tokens/              theme-independent: spacing, radius, layout, motion, type scale builder
  palettes/            colour schemes: basalt (dark), marble (light)
  themes/              core themes (vinco) and the registry
  feedback/            sound bank (expo-audio) and haptics (expo-haptics)
  __tests__/           contrast, resolver, theme completeness
```

A **core theme** (`ThemeDefinition`) = a dark scheme + a light scheme + fonts + feedback (sounds and haptics).
The user's **preferences** (`ThemePreferences`) = which core theme, colour mode (`dark`, `light`, `system`), sound on/off, haptics on/off.
The provider combines the two into the **resolved theme** that components read.

---

## 2. Using it in components

```tsx
import { View, Pressable } from 'react-native';
import { Txt } from '@/components/Txt';
import { createStyles, useFeedback } from '@/theme';

export function WaterRow({ litres, onAdd }: WaterRowProps) {
  const styles = useStyles();
  const play = useFeedback();

  return (
    <Pressable
      style={styles.row}
      onPress={() => {
        play('tap');
        onAdd();
      }}
    >
      <Txt variant="label">Water</Txt>
      <Txt variant="caption">{litres} of 4 L</Txt>
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  row: {
    padding: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSunk,
    gap: theme.space.xs,
  },
}));
```

(Real components take their text from `src/copy/`; shown inline here for brevity.)

**Rules, enforced by lint where possible**

- No hex or `rgb()` outside `src/theme/` (lint).
- No raw `<Text>`; use `Txt` (lint).
- Import from `@/theme`, never from files inside it (lint).
- No raw spacing or radius numbers; use the nearest token. Component-specific sizes go in `layout`.
- Pick font weight by family (`theme.fonts.bodySemiBold`), never `fontWeight`: Android ignores it for custom fonts.
- Touch targets at least `layout.minTouchTarget` (44).

---

## 3. Colour roles

Components ask for a **role**, not a colour. Roles are named for what they do, so a theme that isn't gold doesn't end up with a token called `gold`.

| Role                         | Basalt (dark)        | Marble (light) | Brand name and use                            |
| ---------------------------- | -------------------- | -------------- | --------------------------------------------- |
| `background`                 | `#1D1A17`            | `#F2ECE1`      | Basalt. Screen background                     |
| `backgroundDeep`             | `#0F0D0B`            | `#E6DFD2`      | Camera, milestone cards                       |
| `surface`                    | `#26221E`            | `#FBF8F2`      | Cards                                         |
| `surfaceSunk`                | `#211E1A`            | `#ECE5D8`      | Inset rows, task rows                         |
| `surfaceRaised`              | `#2E2924`            | `#FFFFFF`      | Previews, bubbles                             |
| `border`                     | `#3B352E`            | `#D8CEBD`      | Borders, dividers, empty bars                 |
| `borderStrong`               | `#5A5249`            | `#B3A794`      | Empty status ring, inactive milestone         |
| `text`                       | `#ECE5D8`            | `#1D1A17`      | Marble. Main text                             |
| `textMuted`                  | `#A99F90`            | `#625849`      | Secondary text                                |
| `textFaint`                  | `#5E574E`            | `#9A8F80`      | Disabled, future days                         |
| `accent`                     | `#D2AC55`            | `#7A5C14`      | Laurel gold. Wins, full goal, primary buttons |
| `accentPressed`              | `#E4C477`            | `#634A0F`      | Pressed primary                               |
| `accentSoft`                 | gold 12%             | gold 12%       | Icon tiles, minimum-held fill                 |
| `accentTint`                 | gold 8%              | gold 8%        | Selected card background                      |
| `accentBorder`               | gold 45%             | gold 45%       | Row at full goal                              |
| `onAccent`                   | `#1D1A17`            | `#FBF8F2`      | Text on accent                                |
| `danger`                     | `#D0697D`            | `#A23C52`      | Porphyry. Warnings, reel counter, recording   |
| `dangerSoft`, `dangerBorder` | 16%, 50%             | 12%, 45%       | Reel badge                                    |
| `seal`, `onSeal`             | `#8E2B3A`, `#F2D9DD` | same           | Wax seal (oath)                               |
| `currency`                   | `#C9C6BF`            | `#66625B`      | Silver. Denarii only                          |
| `rest`                       | `#4A5A6E`            | same           | Truce day                                     |
| `info`                       | `#8FA7C2`            | `#4C6C8F`      | Sleep, neutral data                           |
| `success`                    | `#3F6B32`            | same           | Mission complete                              |
| `scrim`                      | black 60%            | basalt 45%     | Behind sheets                                 |
| `overlay`                    | black 82%            | marble 92%     | Behind the VINCO stamp                        |
| `inverse`, `onInverse`       | marble, basalt       | basalt, marble | Selected segment, toast                       |

Tests (`src/theme/__tests__/themes.test.ts`) check that every scheme keeps readable contrast: text 7:1, muted text and accent 4.5:1, text on accent 4.5:1. A new scheme that fails them won't pass `npm run check`.

`SchemeOverride` forces a scheme for part of the screen, for example `<SchemeOverride scheme="dark">` around the camera so it stays dark in light mode.

---

## 4. Typography

Display face: **Marcellus**, for big moments only. Body face: **Figtree** (400, 500, 600, 700). Use through `<Txt variant="...">`.

| Variant      | Font          | Size / line            | Default colour | Use                        |
| ------------ | ------------- | ---------------------- | -------------- | -------------------------- |
| `hero`       | display       | 64 / 72, tracked       | text           | VINCO wordmark             |
| `numeral`    | display       | 96 / 100               | text           | Day number on the day card |
| `display`    | display       | 40 / 46                | text           | Big stats                  |
| `title`      | display       | 30 / 36                | text           | Screen titles              |
| `heading`    | display       | 22 / 28                | text           | Sheet titles, rank name    |
| `quote`      | display       | 20 / 27                | text           | Stoic and Latin quotes     |
| `eyebrow`    | display       | 13 / 18, caps, tracked | textMuted      | "DAY XII OF LX"            |
| `bodyLarge`  | body          | 16 / 24                | text           | Longer reading             |
| `body`       | body          | 15 / 22                | text           | Default                    |
| `label`      | body semibold | 16 / 22                | text           | Task names                 |
| `labelSmall` | body semibold | 13 / 18                | text           | Inline actions "+1 L"      |
| `button`     | body bold     | 16 / 20                | text           | Buttons                    |
| `caption`    | body          | 13 / 18                | textMuted      | Sub-lines                  |
| `overline`   | body semibold | 13 / 18, caps          | textMuted      | "YOUR ORDERS"              |
| `micro`      | body          | 11 / 14                | textMuted      | Tab labels, legends        |

Each variant caps how far the phone's font-size setting can enlarge it, so huge type never breaks a layout. Roman numerals are decoration only: a small eyebrow above a big Arabic number.

---

## 5. Spacing, radius, layout, motion

- **space**: `xxs 2, xs 4, sm 8, md 12, lg 16, xl 20, xxl 24, xxxl 32, huge 48, giant 64`
- **radius**: `xs 4, sm 10, md 16 (cards), lg 24 (sheets), pill 999`
- **layout**: `screenGutter 20, flowGutter 24, cardPadding 14, minTouchTarget 44, buttonHeight 56, buttonHeightCompact 48, tabBarHeight 76, iconSize 22, iconSizeSmall 16`
- **motion**: durations `instant 100, fast 200, base 350, slow 500, slower 800` ms; easing `standard (0.2, 0.8, 0.2, 1)`; `stagger 60` ms. Quick and quiet everywhere; the stamp is the one big moment. Respect the phone's reduce-motion setting.

---

## 6. Sound and haptics (feedback cues)

Components never play a file directly. They call `play(cue)` from `useFeedback()`, and the active theme decides what sound and haptic that cue means. The user can turn sound and haptics off separately. UI sounds mix with music and stay quiet when the phone is on silent.

| Cue                          | When                            | Vinco sound             | Haptic           |
| ---------------------------- | ------------------------------- | ----------------------- | ---------------- |
| `tap`                        | Task tap (+1 L, +1 meal)        | short bright tick       | light            |
| `select`                     | Pick an option card             | rising chirp            | selection        |
| `toggle`                     | Segmented control, small switch | soft tick               | selection        |
| `stepUp` / `stepDown`        | Stepper + / -                   | high / low blip         | selection        |
| `win`                        | A task reaches full goal        | three-note rise         | success          |
| `stamp`                      | VINCO stamp lands               | low thud + brass figure | heavy            |
| `cross`                      | Cross the Rubicon               | thud + triad            | heavy            |
| `chime`                      | Splash "Enter"                  | two-note chime          | none             |
| `confirm`                    | Share or save done              | two-note chime, higher  | success          |
| `recordStart` / `recordStop` | Voice note                      | blip / sealing chord    | medium / success |
| `shutter`                    | Daily selfie                    | double click            | medium           |
| `seal`                       | First selfie, DAY I stamp       | click + thud            | heavy            |
| `rise`                       | Resurgo                         | four-note arpeggio      | success          |
| `truce`                      | Truce used                      | two calm notes          | medium           |
| `denied`                     | Tap on something locked         | low tick                | warning          |

Sounds are generated from the prototype's own recipes by `scripts/generate-sounds.mjs` into `assets/sounds/vinco/`. To change a sound, edit its recipe and run `npm run sounds`.

---

## 7. Adding or switching a core theme

1. **Palettes**: add `src/theme/palettes/<name>.ts` (dark) and a light one, filling every `ColorPalette` role.
2. **Fonts**: install with `npx expo install @expo-google-fonts/<font>`, import single weights from subpaths (`@expo-google-fonts/<font>/400Regular`) so only those files ship.
3. **Sounds**: copy the recipes in `scripts/generate-sounds.mjs`, output to `assets/sounds/<theme-id>/`. Any cue can be `null` (silent).
4. **Theme**: add `src/theme/themes/<theme-id>.ts` exporting a `ThemeDefinition`, then add it to `THEMES` in `themes/registry.ts`.
5. **Check**: `npm run check` (contrast and completeness tests run on every registered theme), then review it in the theme lab in both schemes.

Switching at runtime: `useThemeControls().setThemeId('<id>')`, `setColorMode('light' | 'dark' | 'system')`, `setSoundEnabled`, `setHapticsEnabled`. Changing the default for everyone: `DEFAULT_THEME_PREFERENCES` in `themes/registry.ts`. Preferences are saved to the phone from Step 7 (local database), through the provider's `initialPreferences` and `onPreferencesChange` props.
