# Capy 🦫

A capybara that lives in the corner of your Mac, holding your three
priorities for the day. After your check-in time, if anything is still
unchecked, he wakes up and follows your cursor around the screen —
roasting you (or cheering for you, your choice) until you finish.

The only ways to make him go back to sleep:

1. **Do your tasks.** Check off all three and he naps in a party hat.
2. **Click his bed** to call him home — costs you a 30-minute snooze.
3. Wait until midnight, when the day resets.

## Install

1. Download the latest `Capy-darwin-arm64-x.x.x.zip` from
   [Releases](https://github.com/audreypork/no-cap/releases)
2. Unzip it and drag `Capy.app` into your **Applications** folder
3. Open it — find the sleeping capybara in the bottom-right corner of
   your screen

The app is signed and notarized, so it opens without warnings.
Requires an Apple Silicon Mac (M1 or later) running macOS.

## Use

- **Click the capybara** to open the panel: set up to 3 priorities and
  your daily check-in time
- **Click the sliders icon** for settings — including the
  **Naughty / Nice** toggle, which decides whether the flying capybara
  roasts you or cheers you on
- Clicks pass straight through Capy to whatever app is underneath —
  he only intercepts the pixels he's standing on

## Develop

```bash
npm install
npm start          # dev with hot reload
npm run make       # package Capy.app (set CAPY_SIGN=1 for a signed build)
```

Built with Electron Forge + Vite + TypeScript + React.
