# Vinco

**Veni, vidi, vici.** Vinco uses your phone to beat your phone: an Android app for running a 30, 60 or 90 day arc with four daily orders, a selfie as proof, and (from 1.0) a live reel counter.

This repo is the Expo (React Native) app.

## Run it

```powershell
npm install
npx expo start      # scan the QR code with Expo Go on your Android phone
```

## Before you change anything

| Read                                                       | For                                    |
| ---------------------------------------------------------- | -------------------------------------- |
| [.claude/CLAUDE.md](.claude/CLAUDE.md)                     | Product context and working rules      |
| [HISTORY.md](HISTORY.md)                                   | Current state and what's next          |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md)                 | Naming, exports, structure, edge cases |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md)             | Theme, colours, type, sounds           |
| [docs/v1-docs/BUILD-STEPS.md](docs/v1-docs/BUILD-STEPS.md) | The build plan                         |
| [docs/v1-docs/PLAN.md](docs/v1-docs/PLAN.md)               | The product plan                       |

## Checks

```powershell
npm run check       # typecheck + lint + em-dash scan + tests
```
