# Vinco UI kit: component specs

Every shared component, specced against the prototype (`docs/v1-reference/Vinco app UI.html`) **before** it was built, as [CONVENTIONS.md](CONVENTIONS.md) section 7 requires. Only components with a known screen to serve are here: nothing generic "just in case".

Each one is shown in all its states in the theme lab (`/dev/theme-lab`, long-press the Vici tab in development).

Shared rules for all components:

- Colours by role, type by variant, sizes from `space`, `radius` and `layout` (see [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)).
- Every pressable element has at least a 44 by 44 hit area (visual size may be smaller, with `hitSlop` making up the rest).
- Every animation respects the phone's reduce-motion setting: the final state appears without motion.
- Sounds and haptics go through `useFeedback()`; each component documents its cue.
- Components are presentational: data in through props, events out through callbacks.

---

## Already built (Step 3)

| Component           | Purpose                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| `Txt`               | All text, by type variant and colour role                                |
| `Screen`            | Safe area, background, gutters, scroll-to-top on tab re-tap              |
| `ScreenHeader`      | Eyebrow, title (accessibility header), caption, optional right accessory |
| `Card`              | Rounded container: `surface`, `sunk`, `raised`, optional border          |
| `ToneLine`          | A message in the user's tone, with the tone named underneath             |
| `navigation/TabBar` | Veni / Vidi / Vici, Latin over plain label                               |

---

## Step 4 components

### Icon

- **Used in:** order rows and order cards (water, sunrise, meal, workout), chips (flame), tone cards (book, helmet, flame), tiles (camera, list), lock badge, back and close buttons, recorders (mic), status (check), selfie (flipCamera).
- **Props:** `name: IconName`, `size = layout.iconSize`, `color: ColorRole = 'text'`, `strokeWidth = 1.8`, `accessibilityLabel?`.
- **Drawing:** the prototype's 24 by 24 line icons, round caps and joins, no fill.
- **Accessibility:** decorative (hidden) unless a label is passed, then announced as an image.

### Laurel

- **Used in:** splash, day card, finish screen.
- **Props:** `width = 150`, `color: ColorRole = 'accent'`, `strokeWidth = 1.4`.
- **Drawing:** the prototype wreath (viewBox 120 by 32). Decorative, hidden from screen readers.

### StampMark

- **Used in:** the VINCO stamp (Today, Step 5), the DAY I stamp (first selfie, Step 8).
- **Props:** `text`, `caption?` (the date under DAY I), `size: 'large' | 'medium' = 'large'`.
- **Look:** porphyry (`danger`) border and text, display face, wide letter spacing. Static: the slam is done by the overlay that shows it.

### Button

- **Used in:** every primary action ("Continue", "Accept my orders", "Seal the day"), secondary ("See your progress", "Record again"), quiet links ("Skip for now", "Back to Today"), and the large two-line "Cross the Rubicon / Begin your arc".
- **Props:** `label`, `onPress`, `variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary'` (danger: wax-seal red, only for the confirm step of something that can't be undone, like "Retreat to the Rubicon"), `size: 'regular' | 'compact' | 'large' = 'regular'` (56, 48, 64), `sublabel?` (large only), `disabled`, `loading`, `cue: FeedbackCue | null = 'tap'`, `accessibilityHint?`.
- **States:** pressed (primary darkens to `accentPressed`, secondary fills with `surface`, ghost dims), disabled (primary turns `surface` with muted text, no cue), loading (spinner, presses ignored).
- **Edge cases:** a second press within 500 ms is ignored, so a double tap can't navigate twice or save twice.
- **Accessibility:** role button, busy and disabled states, label includes the sublabel.

### IconButton

- **Used in:** back (onboarding), close (selfie, workout log, day card), flip camera.
- **Props:** `icon: IconName`, `accessibilityLabel` (required), `onPress`, `color: ColorRole = 'text'`, `cue = null`.
- **Look:** 44 by 44, icon 22, dims when pressed.

### StatChip

- **Used in:** Today's chips ("Campaign 11", "2 Truces", "Optio").
- **Props:** `label`, `icon?`, `emphasis: 'default' | 'muted' = 'default'`.
- **Look:** `surface` pill, height 30, caption-size text, accent icon. Not pressable.

### ChoiceChip

- **Used in:** tone preview scenes ("9pm, task open" / "Missed a day"), theme lab.
- **Props:** `label`, `selected`, `onPress`, `cue = 'toggle'`.
- **Look:** 36 high pill (hit area 44 via hitSlop), border `border`, selected: border `accent` + `accentTint`.
- **Accessibility:** role radio with checked state; wrap a group in a View with role radiogroup.

### SectionHeader

- **Used in:** "YOUR ORDERS", "STEP ONE" (Today), "THIS WEEK", "GUARD MODE".
- **Props:** `title`.
- **Look:** overline, with the prototype's spacing (space above for separation, small gap below). Announced as a header.

### ProgressBar

- **Used in:** water's 4 segments (Today), onboarding step indicator (5 segments, thin), rank progress and timelapse progress (continuous).
- **Props:** `value` (0 to 1) **or** `segments: { total, filled }`, `size: 'thin' | 'regular' | 'thick' = 'regular'` (3, 5, 6), `color: ColorRole = 'accent'`, `accessibilityLabel?`.
- **Edge cases:** values outside 0 to 1, NaN and Infinity are clamped; `filled` above `total` is capped; `total` 0 renders an empty track.
- **Motion:** fill animates over `motion.duration.base`.
- **Accessibility:** role progressbar with the current value.

### ProgressRing

- **Used in:** Today header, orders done out of 4.
- **Props:** `value` (0 to 1), `size = 64`, `strokeWidth = 5`, `children` (centre content), `accessibilityLabel`.
- **Motion:** arc animates over 600 ms with the standard easing.
- **Edge cases and accessibility:** clamped like ProgressBar; role progressbar.

### StatusCircle

- **Used in:** each order row (Today), the step-one box.
- **Props:** `status: 'none' | 'min' | 'full'`, `size = 30`.
- **Look:** none = `borderStrong` ring; min = `accent` ring with `accentFill`; full = solid `accent` with an `onAccent` check.
- **Motion:** pops (0.6, 1.2, 1) when the status changes, never on first render.

### OptionCard

- **Used in:** arc length (30 / 60 / 90), tone picker (Philosopher / Centurion / Roast me), later guard modes.
- **Props:** `title`, `description?`, `badge?` ("Most chosen"), `leading?` (the "LX / 60" block or a tone icon), `selected`, `onPress`, `cue = 'select'`.
- **Look:** sunk card with `border`; selected: 1.5 `accent` border and `accentTint` background. Pops slightly on selection.
- **Accessibility:** role radio, checked state.

### Stepper

- **Used in:** "Your orders" onboarding (water 2 to 5 L in 0.5 steps, wake time, meals 1 to 3, workout 20 to 90 min).
- **Props:** `caption` ("Conquer"), `value`, `onChange`, `min`, `max`, `step`, `formatValue(value)`, `accessibilityLabel` ("Water full goal").
- **Look:** caption in accent over the value, then minus and plus buttons (44 by 44 each).
- **Edge cases:** values are rounded to 2 decimals (0.1 + 0.2 never shows 0.30000000000000004), clamped to min and max; pressing at a limit plays `denied` and changes nothing.
- **Motion and feedback:** value bumps on change; `stepUp` / `stepDown` cues.
- **Accessibility:** role adjustable with increment and decrement actions and the formatted value, so TalkBack users can swipe to change it.

### TextField

- **Used in:** workout note (Today, Step 5), weight (selfie, Step 10), step-one goal (Step 12).
- **Props:** `label`, `value`, `onChangeText`, `multiline`, plus `placeholder`, `maxLength`, `keyboardType`, `autoCapitalize`, `returnKeyType`, `onSubmitEditing`.
- **Look:** caption label above; field on `background` with `border`, radius `sm`, body font; border turns `accent` while focused; placeholder in `textFaint`.
- **Edge cases:** callers pass `maxLength` so notes stay short; font scale capped like body text.
- **Accessibility:** the label is the field's accessibility label.

### BottomSheet

- **Used in:** workout log on Today (typed note now, voice later), later small confirmations.
- **Props:** `visible`, `onClose`, `title?`, `children`.
- **Look:** `scrim` behind; sheet on `surface`, top radius `lg`, padding 22 and the bottom safe area.
- **Behaviour:** slides up and fades in; slides down before unmounting; closes on scrim tap and the Android back button; moves up with the keyboard.
- **Accessibility:** the sheet is modal for screen readers; the scrim is a "Close" button.

---

### Toast

- **Used in:** day card (shared, unavailable, failed).
- **Props:** `message` (null hides it), `onHide`.
- **Behaviour:** inverse pill near the bottom, rises in, leaves after 2.4 s; a new message restarts the timer; announced politely to screen readers; still with reduced motion.

### SelfieCapture

- **Used in:** first selfie (onboarding, with the DAY I stamp), daily selfie (with yesterday's photo as a ghost).
- **Props:** `day`, `stamp?`, `ghostUri?`, `ghostOpacity`, `existingUri?` (shows today's photo with Retake), `onCaptured(path)`.
- **Behaviour:** front camera, flippable; face outline when there is no ghost; saves into the private folder (retake replaces the day's photo); plays `shutter` (or the stamp's `seal`).
- **Edge cases:** permission not yet asked, refused but askable ("Allow camera"), refused for good ("Open settings"); a failed capture says so and allows another try.

### StampSlam

- **Used in:** the VINCO stamp (Today), the DAY I stamp (first selfie).
- **Props:** `StampMark` props plus `cue` (played on impact) and `delay`.
- **Motion:** drops from 3x and rotated, overshoots, settles at -8 degrees; cue 55% into the slam. Plays once per mount; with reduced motion it appears and the cue plays at once.

## Built with their screens, not in the kit

These are specific to one screen, so they live with it: `today/` (`TaskRow`, `WorkoutSheet`, `StampOverlay`, `SelfieTile`, `SealDayCard`: stays once every order holds so the day card is always one tap away; `TruceBanner`: while a Truce can still save the campaign; `TodoTile`: the to-do summary), `orders/` (`AddOrderSheet`: name, unit, minimum, full goal; errors inline, closes only once saved), `tasks/` (`TaskItemRow`: a checkbox row with a remove button, simpler than an order row on purpose; `CarryOverCard`: carry over or drop, one by one or all; `AddTaskSheet`: stays open after each save for quick entry), `onboarding/` (`FlowLayout`, `QuoteCarousel`, `RiverLines`, `TypingPreview`, `OathRecorder`), `progress/` (`StatTile`, `MonthCalendar`), `arc/` (`ArcJourney`, `RankCard`, `SettingsRow`, `RetreatSheet`: confirm button stays disabled until RETREAT is typed; "Hold the line" cancels), `campaign/` (`Column`), `dayCard/` (`DayCard`, fixed palettes so a shared card looks the same on every phone). Also outside the kit: `StartupError` (database recovery screen).
