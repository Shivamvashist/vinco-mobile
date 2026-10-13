# Versions and releases

How Vinco numbers its versions, and where each version's changes are written down. One file per version in this folder. Later the backend imports these into an `app_releases` table so the admin panel can show them (see "Later: the backend" below).

## Versions

| Version            | Status      | Date        | In short                                                                         |
| ------------------ | ----------- | ----------- | -------------------------------------------------------------------------------- |
| [1.1.0](v1.1.0.md) | in progress | 13 Oct 2026 | Orders-first onboarding, a clean Today with the user menu, calories, day summary |
| [1.0.0](v1.0.0.md) | baseline    | 12 Oct 2026 | The first version: the full tracker, campaign and free training, Forum, Vici     |

## The numbering: semantic versioning

`MAJOR.MINOR.PATCH`, for example `1.1.0`.

| Part      | Goes up when                                                                                       | Example                                |
| --------- | -------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **MAJOR** | The app changes in a way that starts a new era: a rebuilt core flow, or data that can't carry over | `2.0.0`                                |
| **MINOR** | New features, or a change to an existing flow (each wave of work)                                  | `1.1.0`: onboarding starts from orders |
| **PATCH** | Fixes only, nothing new for the user to learn                                                      | `1.1.1`: a crash on the selfie screen  |

Two numbers live in the Android app:

- **Version name** (`version` in `app.json`, also in `package.json`): the `1.1.0` users see in Settings and on the Play Store. Changed by hand, following the table above.
- **Version code**: a whole number Play uses to order builds; it must go up with every upload and is never reused. EAS keeps it on its servers (`appVersionSource: "remote"` in `eas.json`) and adds one for every production build (`autoIncrement`), so it is never edited by hand. Write the code into the version file once the build exists.

## Each version file

Front matter (read by the backend later, so keep the keys exactly):

```yaml
---
version: 1.1.0
status: in progress # baseline | in progress | released
date: 2026-10-13 # the day work started; the release day once released
versionCode: null # filled in from the EAS build
migrations: [0009_day_calories]
---
```

Then these sections, in this order, leaving out the empty ones:

| Section              | For      | What goes in it                                                                                                                                      |
| -------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Release notes**    | Users    | The "What's new" text for the Play Store and the in-app notice. Plain words, at most 500 characters (Play's limit). No Latin without its plain label |
| **Features**         | Everyone | The baseline only: the full list of what the app does in that version                                                                                |
| **Added**            | Team     | New features                                                                                                                                         |
| **Changed**          | Team     | Changes to existing flows: what it was, what it is now                                                                                               |
| **Removed**          | Team     | Features or screens taken out                                                                                                                        |
| **Fixed**            | Team     | Bugs fixed                                                                                                                                           |
| **Data and upgrade** | Team     | Database migrations, saved settings that change, and what an existing user sees after updating                                                       |
| **Not yet**          | Team     | Known gaps carried to a later version                                                                                                                |

The team-facing part is the **changelog**; the user-facing part is the **release notes**. The headings follow the widely used "Keep a Changelog" style.

## How it's kept

1. **While building:** every feature milestone adds its lines to the version marked `in progress` (Added, Changed, Removed, Fixed, Data). Only one version is in progress at a time.
2. **Starting the next version:** decide MINOR or PATCH from the table, create `vX.Y.Z.md` with status `in progress`, add it to the table above.
3. **Releasing:**
   - Set `version` in `app.json` and `package.json` to the release.
   - Write the release notes (500 characters at most), then build (`eas build -p android --profile production`).
   - Set `status: released`, the release `date` and the `versionCode` from the build.
   - Paste the release notes into Play Console's "What's new".
4. **Never rewrite a released file**, except to fix a typo. A mistake in a release is fixed by the next version's notes.

## Later: the backend

When `vinco-backend` is built (its `docs/PLAN.md`):

- An `app_releases` table (version, status, date, version code, release notes, changelog) filled from these files, and an admin page listing them.
- The app already sends `X-App-Version` on every call, and the admin stats split live users by app version, so each release can be matched to how many people run it.
- A minimum supported version per platform: older apps get `426 upgrade_required` and the app asks the user to update.
- The backend and the admin panel keep their own version numbers and changelogs; the API itself is versioned by its path (`/v1`).

## A naming clash to settle

The product plan ([v1-docs/PLAN.md](../v1-docs/PLAN.md), [GUARDIANS.md](../GUARDIANS.md)) calls the 1 January 2027 release "Vinco 1.0" and later ones "1.1" and "1.2". Those are product milestones, not these version numbers: the app is already at 1.0.0 and 1.1.0. Until the milestones are renamed, read "Vinco 1.0" in older docs as "the 1 January release" (the Vigil, Aurora, sign-in).
