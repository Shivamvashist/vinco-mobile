# AGENTS.md

Instructions for any AI coding agent working in this repo (Claude, Gemini, Codex, Cursor and others).

**Start here:**

1. [.claude/CLAUDE.md](.claude/CLAUDE.md): product context, working rules, stack. The rules there apply to every agent, not only Claude.
2. [HISTORY.md](HISTORY.md): current state, architecture, decisions, what's next.
3. [docs/CONVENTIONS.md](docs/CONVENTIONS.md) and [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md): how code is written here.

The short version of the working rules: no git commands unless asked, no em-dashes anywhere, protect the core job, stay in scope, update HISTORY.md after each milestone, check edge cases, plan UI before building, and run `npm run check` before calling anything done.

---

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed: do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json` (currently 57).
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt (an index of all Expo docs with corrections to common LLM misconceptions). Follow its links to the specific page you need; never answer from memory.

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm install: resolves SDK-compatible versions
npx expo start              # start the dev server
npm run check               # typecheck + lint + em-dash scan + tests
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

On Windows, pass dev flags as `npx expo install <pkg> "--" --save-dev`, then confirm the package landed in `devDependencies`.

## Navigation and routing

- Use **Expo Router** for all navigation. Routes live in `src/app/`: every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`); no local Android Studio required. Run the CLI as `npx eas-cli@latest <command>`.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- `ios/` and `android/` are generated (Continuous Native Generation). Never create or edit them by hand; configure native behaviour in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build.
- Prefer Expo modules over third-party libraries.
