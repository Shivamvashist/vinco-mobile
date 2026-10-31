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
  tokens/              theme-independent: spacing, radius, layout, motion, type scale builder, screen-width scale
  palettes/            colour schemes: nox, basalt, purpura, aes (dark); marble, papyrus, calx, alba (light)
  effects.ts           depth per scheme: glow strength, card hairline, soft shadow on light
  surfaces.ts          the one card language: cardSurface and iconTile style helpers
  themes/              core themes (vinco) and the registry
  feedback/            sound bank (expo-audio) and haptics (expo-haptics)
  __tests__/           contrast, resolver, theme completeness
```

A **core theme** (`ThemeDefinition`) = a dark scheme + a light scheme + fonts + feedback (sounds and haptics).
The user's **preferences** (`ThemePreferences`) = which core theme, colour mode (`dark`, `light`, `system`), sound on/off, haptics on/off.
The provider combines the two, plus the window width, into the **resolved theme** that components read.

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
- No raw spacing or radius numbers; use the nearest token. Sizes shared by several components go in `layout`; a one-off illustration size (the oath's record button) is a named constant at the top of its component.
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
| `accentFill`                 | gold 25%             | gold 22%       | Status circle at minimum held                 |
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
| `inverse`, `onInverse`       | marble, basalt       | basalt, marble | Selected segment                              |

Tests (`src/theme/__tests__/themes.test.ts`) check that every scheme keeps readable contrast: text 7:1, muted text and accent 4.5:1, text on accent 4.5:1. A new scheme that fails them won't pass `npm run check`.

`SchemeOverride` forces a scheme for part of the screen, for example `<SchemeOverride scheme="dark">` around the camera so it stays dark in light mode.

---

### Palettes (31 Oct)

A **theme** is fonts and sounds (Vinco). A **palette** is one full set of colour roles for dark or light (`src/theme/palettes/registry.ts`). The user picks a mode (dark, light, match phone), a dark palette and a light palette on the Appearance screen (`/appearance`, from Settings); "match phone" switches between the two picks. Forced-dark screens (camera, alarm) use the user's dark palette through `SchemeOverride`.

| Palette | Scheme | Plain label     | Ground and accent                                   |
| ------- | ------ | --------------- | --------------------------------------------------- |
| Nox     | dark   | True black      | Pure black for OLED, laurel gold (default)          |
| Basalt  | dark   | Dark stone      | Warm basalt, laurel gold (the default until 31 Oct) |
| Purpura | dark   | Imperial purple | Deep violet, gold; danger leans rose                |
| Aes     | dark   | Bronze green    | Dark slate, verdigris accent (the one without gold) |
| Marble  | light  | Light stone     | Marble, deep gold (default)                         |
| Papyrus | light  | Parchment       | Warm paper, sepia ink, laurel-leaf green            |
| Calx    | light  | Limestone       | Cool limestone, near-black text, imperial purple    |
| Alba    | light  | First light     | Pearl with a breath of rose, sunrise vermilion      |

- Every palette passes the same contrast pairs (`theme/__tests__/themes.test.ts`): text 7:1 on background, surface and sunk; muted text, accent, currency and danger 4.5:1; on-accent 4.5:1.
- Saved as `darkPaletteId` and `lightPaletteId` in preferences; an unknown id, or one of the wrong scheme, falls back to the default on restore. Nox became the default dark palette on 31 Oct (the Vinco theme's own dark scheme is Nox too); a saved choice is kept, only the default changed.
- **Depth per scheme** (`theme/effects.ts`, read as `theme.effects`): built from each palette, so a new palette gets it for free. Dark: glows at full strength, the plain `border`, no shadow. Light: glows at half strength (a full glow reads as a stain on pale stone), the card hairline a step stronger (`border` mixed 45% toward `borderStrong`), and a soft two-layer shadow in the palette's own ink. Use `theme.effects.cardBorder` and `theme.effects.cardShadow` (a `boxShadow`) on cards, tiles and the hero; `Glow` applies `glowStrength` itself. `Card` and `cardSurface` (below) use them, so most components never touch them directly.
- The day card keeps its own fixed styles (`palettes/dayCards.ts`), so a shared card looks the same everywhere.
- **Adding one:** create `palettes/<id>.ts` (a `ColorScheme` with every role), add it to `PALETTES` with its scheme, add its plain label to `settingsCopy.palettes`. The tests cover it at once (contrast in `themes.test.ts`, depth in `effects.test.ts`); its preview on `/appearance` is drawn from its own colours.

## 4. Typography

Display face: **Marcellus**, for big moments only. Body face: **Figtree** (400, 500, 600, 700). Use through `<Txt variant="...">`.

| Variant        | Font          | Size / line            | Default colour | Use                        |
| -------------- | ------------- | ---------------------- | -------------- | -------------------------- |
| `hero`         | display       | 64 / 72, tracked       | text           | VINCO wordmark             |
| `numeral`      | display       | 96 / 100               | text           | Day number on the day card |
| `display`      | display       | 36 / 42                | text           | Big stats                  |
| `title`        | display       | 28 / 34                | text           | Screen titles              |
| `heading`      | display       | 21 / 27                | text           | Sheet titles, rank name    |
| `headingSmall` | display       | 17 / 22                | text           | Latin tab names            |
| `quote`        | display       | 19 / 26                | text           | Stoic and Latin quotes     |
| `eyebrow`      | display       | 13 / 18, caps, tracked | textMuted      | "DAY XII OF LX"            |
| `bodyLarge`    | body          | 16 / 24                | text           | Longer reading             |
| `body`         | body          | 15 / 22                | text           | Default                    |
| `label`        | body semibold | 15 / 21                | text           | Task names                 |
| `labelSmall`   | body semibold | 13 / 18                | text           | Inline actions "+1 L"      |
| `button`       | body bold     | 16 / 20                | text           | Buttons                    |
| `caption`      | body          | 13 / 18                | textMuted      | Sub-lines                  |
| `overline`     | body semibold | 13 / 18, caps          | textMuted      | "YOUR ORDERS"              |
| `micro`        | body          | 11 / 14                | textMuted      | Tab labels, legends        |

Sizes are for a 412 dp wide phone; narrower phones get them a little smaller (section 5). Each variant caps how far the phone's font-size setting can enlarge it (body and caption 1.35x, labels 1.3x, titles 1.2x, the wordmark and day numeral not at all), so large system fonts never break a layout. Roman numerals are decoration only: a small eyebrow above a big Arabic number.

---

## 5. Spacing, radius, layout, motion

- **space**: `xxs 2, xs 4, sm 8, md 12, lg 16, xl 20, xxl 24, xxxl 32, huge 48, giant 64`
- **radius**: `xs 4, sm 10, md 16 (inset rows), lg 24 (cards, tiles, sheets), xl 30 (the hero, full-screen surfaces), pill 999`
- **layout**: `screenGutter 18, flowGutter 22, cardPadding 12, minTouchTarget 44, buttonHeight 52, buttonHeightCompact 44, buttonHeightLarge 58, tabBarHeight 70, iconSize 22, iconSizeSmall 16, iconTileSize 34, chipHeight 30, choiceChipHeight 36, statusCircleSize 28, ringSize 58, ringStrokeWidth 5, barHeightThin / Regular / Thick 3 / 5 / 6, sheetPadding 20` (trimmed for real phones on 13 Oct)
- **Scaling to the phone** (`tokens/scale.ts`, 13 Oct): all of the above are design sizes for a 412 dp wide phone. The theme multiplies space and layout by `sizeScale = clamp(width / 412, 0.84, 1)` and type by a gentler share of it, so a 360 dp phone gets the same layout a little smaller. `minTouchTarget`, border widths and stamp borders never shrink. Read `theme.sizeScale` for a one-off size; never use raw pixel sizes.
- **Animating:** `withTiming(value, themeTiming('base'))` or `themeEasing('standard')` from `@/theme`. Check `useReduceMotion()` first; when true, set the final value directly.
- **motion**: durations `instant 100, fast 200, base 350, slow 500, slower 800` ms; easing `standard (0.2, 0.8, 0.2, 1)`; `stagger 60` ms. Quick and quiet everywhere; the stamp is the one big moment. Respect the phone's reduce-motion setting.

### Surfaces: one card language (1 Nov)

Every card, tile, row and panel speaks the same language, so a palette or scheme change reaches all of them at once. Controlled in two places: `Card` (`components/Card.tsx`) and `cardSurface` (`theme/surfaces.ts`).

- **The card:** `surface` (or `surfaceRaised` for menus and previews), the card hairline (`layout.hairline` in `effects.cardBorder`), the soft shadow on light palettes (`effects.cardShadow`), `borderCurve: 'continuous'` and `radius.lg`. The hero alone uses `radius.xl`.
- **`Card`** for a plain container: `variant` `surface` (default), `raised` or `sunk` (an inset row inside a card or sheet: `surfaceSunk`, `radius.md`, no shadow; `bordered` adds the hairline). `glow={{ color, origin?, intensity? }}` lays a soft palette light behind the content (`components/Glow.tsx`, the hero's light): accent for dawn, wins and rank, danger for a warning, rest for a sick day.
- **`cardSurface(theme, level?)`** for anything that cannot be a `Card` (a pressable tile, a list container with dividers): spread it into the style, `{ ...cardSurface(theme), padding: ... }`.
- **`iconTile(theme, fill?, shape?)`**: the small square (or round) soft tile behind a card's icon, `layout.iconTileSize` on `accentSoft` by default.
- **Inside a card or a sheet** (both `surface`), inset things are `surfaceSunk`; never `surface` on `surface`.
- **Tints are states, not panels.** `accentTint` with `accentBorder` (or `accent`) marks a selected card or chip, a picked order, a step button. A whole notice or card is never a flat tinted box: make it a card and give it a glow. Selectable cards keep a full border width in both states (`layout.borderWidth` or `borderWidthStrong`, coloured `cardBorder` when off), so picking one never shifts the layout.

### Day card designs (31 Oct)

The shareable "Day sealed" card has a **design** (the layout) and a **colour style** (`theme/palettes/dayCards.ts`), picked separately on `/day-card` and remembered in `useDayCardStore`. Every design draws only from the style's `background`, `foreground`, `accent`, `onAccent` and `frame`, so each works in every style. The card is a fixed 270 by 480 picture (captured with view-shot), so designs use exact sizes (`CardTxt` in `components/dayCard/designs/parts.tsx`) and ignore the phone's font scale and width scaling: a shared card looks the same from every phone. Text budget: about six words besides numbers and the wordmark; only Classic shows order rows, the others draw orders as marks.

| Design (picker name)   | Idea                                                                       | Orders as        | Source |
| ---------------------- | -------------------------------------------------------------------------- | ---------------- | ------ |
| `classic` (Classic)    | Laurel, "DAY XII OF LX", big number, order rows, campaign and rank         | Rows with ticks  | Free   |
| `numeral` (Numeral)    | The day carved as one huge gold Roman numeral, tens over units when larger | Tally strokes    | Free   |
| `laurel` (Laurel)      | A full victor's wreath ringing the day number, campaign below              | Berries          | Free   |
| `sol` (Sunrise)        | The sun on the horizon, the day number under its reflection                | Rays (long=done) | Free   |
| `inscription` (Tablet) | A "tabula ansata" plaque cut with "DIES XII", "VENI · VIDI · VICI" above   | Interpuncts      | Free   |
| `stamp` (Stamp)        | The seal slammed across a ghosted number, "VICI." (I conquered) beneath    | None             | Forum  |
| `memento` (Memento)    | One line worth keeping, by tone and result, and almost nothing else        | None             | Forum  |

- **Held is quieter:** Stamp slams (angled, double-ruled "VINCO") only on a conquered day; a held day gets a straight single-ruled "HELD" seal and "STETI." (I stood firm). An open day shows as held.
- **Adding a design:** add the id to `DAY_CARD_DESIGN_IDS` (`features/dayCard`), a file in `components/dayCard/designs/`, its entry in `DayCard`'s map, a sketch in `DesignThumb`, and a name in `dayCardCopy.designs`. A Forum design also needs a Forum item, `DESIGN_FORUM_ITEMS`, and copy in `forumCopy.items`.

---

## 6. Sound and haptics (feedback cues)

Components never play a file directly. They call `play(cue)` from `useFeedback()`, and the active theme decides what sound and haptic that cue means. The user can turn sound and haptics off separately. **Sounds are off by default** (13 Oct); haptics are on. UI sounds mix with music and stay quiet when the phone is on silent.

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
| `whoosh`                     | Switching tabs                  | soft filtered air       | selection        |
| `notice` / `noticeAlert`     | A notice arrives (section 6b)   | none (haptic only)      | light / warning  |

**Levels.** Each recipe keeps the prototype's shape, then the file is scaled to its tier's peak: ticks (tap, select, toggle, steps, denied) -6 dBFS, moments (win, confirm, chime, record, shutter, rise, truce) -3 dBFS, signature (stamp, cross, seal) -1.5 dBFS, whisper (whoosh) -17 dBFS (noise sounds louder than a tone at the same peak, so the tab switch is felt more than heard). Nothing clips; the stamp stays the loudest moment. Playback rewinds, then plays once the rewind lands, so rapid taps never click.

**Always on.** A theme lists `feedback.essential` cues that play even with Sounds off. Vinco's are `seal` (the DAY I stamp on the first selfie), `recordStop` (the oath locking in) and `stamp` (a conquered day): the moments the app is built around. The phone's own silent mode still mutes them.

Sounds are generated from the prototype's own recipes by `scripts/generate-sounds.mjs` into `assets/sounds/vinco/`. To change a sound, edit its recipe and run `npm run sounds`.

---

## 6b. Notices (in-app, 31 Oct)

One quiet notice system for short messages inside the app (it replaced the old `Toast`). Local reminders and the alarm are a different thing ([NOTIFICATIONS.md](NOTIFICATIONS.md)).

```ts
import { dismissNotice, notify } from '@/components/notices';

notify({ kind: 'success', message: 'Truce bought.' }); // returns its key
notify({ kind: 'reward', message: '+5 denarii', id: 'denarii-today' }); // same id replaces
notify({ kind: 'error', message: 'Could not share.', action: { label: 'Retry', onPress } });
dismissNotice('denarii-today');
```

| Kind      | Icon    | Colour role | Stays                       |
| --------- | ------- | ----------- | --------------------------- |
| `success` | check   | `accent`    | 3 s (5 s with an action)    |
| `reward`  | coin    | `currency`  | 3 s (5 s with an action)    |
| `info`    | info    | `info`      | 3 s (5 s with an action)    |
| `warning` | warning | `accent`    | 3 s (5 s with an action)    |
| `error`   | alert   | `danger`    | until dismissed or acted on |

(`success` uses `accent`, not the `success` role: that green is too dark to read as a small icon on the dark palettes.)

- **Look:** a capsule under the status bar (safe area), `surfaceRaised` with the card hairline and shadow from `theme.effects`, the kind's icon, one line of `label` text (two at most, then an ellipsis), an optional compact action, and "x2" when a repeat merges.
- **Queue** (pure, tested: `features/notices`): one on screen at a time; the same message (or the same `id`) merges into the one showing or waiting (its timer restarts, the count goes up); an error jumps the queue and the notice it displaced waits first in line; at most 4 wait (the oldest that isn't an error is dropped).
- **Motion:** springs in from above (`settle`), leaves upwards when its time is up, when tapped, swiped up (gesture handler) or acted on. A repeat bumps it gently. Reduce motion: it fades in and out.
- **Feedback:** `notice` (light) or `noticeAlert` (warning, for warnings and errors), haptic only; notices never make a sound (the caller plays its own cue where a moment deserves one). Each new notice is announced to screen readers once, with its kind ("Problem: ..."); tapping it dismisses it.
- **Where it draws:** `NoticeHost` is mounted once in the root layout, over every screen. An open `BottomSheet` mounts its own host inside its `Modal` (on Android a Modal is a separate window that nothing outside it can cover); only the newest host draws, so a notice never shows twice.
- **Background:** when the app goes to the background, passing notices are dropped and errors are kept. "Reset the journey" clears them all.

---

## 7. Adding or switching a core theme

1. **Palettes**: add `src/theme/palettes/<name>.ts` (dark) and a light one, filling every `ColorPalette` role.
2. **Fonts**: install with `npx expo install @expo-google-fonts/<font>`, import single weights from subpaths (`@expo-google-fonts/<font>/400Regular`) so only those files ship.
3. **Sounds**: copy the recipes in `scripts/generate-sounds.mjs`, output to `assets/sounds/<theme-id>/`. Any cue can be `null` (silent).
4. **Theme**: add `src/theme/themes/<theme-id>.ts` exporting a `ThemeDefinition`, then add it to `THEMES` in `themes/registry.ts`.
5. **Check**: `npm run check` (contrast and completeness tests run on every registered theme), then review it in the theme lab in both schemes.

Switching at runtime: `useThemeControls().setThemeId('<id>')`, `setColorMode('light' | 'dark' | 'system')`, `setPalette(scheme, paletteId)`, `setSoundEnabled`, `setHapticsEnabled`. Changing the default for everyone: `DEFAULT_THEME_PREFERENCES` in `themes/registry.ts`. `ThemeProvider` is controlled: the root layout passes `preferences` from the persisted Zustand store (`src/stores/preferencesStore.ts`) and saves changes through `onPreferencesChange`. Saved values are validated on restore, so a corrupted or outdated save falls back to defaults.
