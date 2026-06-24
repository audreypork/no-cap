# Capy 🦫

A capybara that lives in the corner of your screen, holding your three
priorities for the day. After your check-in time, if anything is still
unchecked, he wakes up and follows your cursor around the screen —
roasting you (or cheering for you, your choice) until you finish.

Runs on **macOS** (Apple Silicon) and **Windows** (10/11).

The only ways to make him go back to sleep:

1. **Do your tasks.** Check off all three and he naps in a party hat.
2. **Click his bed** to call him home — costs you a 30-minute snooze.
3. Wait until midnight, when the day resets.

## Install

Grab the latest build from [getcapy.lol](https://getcapy.lol) or the
[Releases page](https://github.com/audreypork/no-cap/releases).

**macOS** (Apple Silicon, M1+):
1. Download `Capy.zip`, unzip, drag `Capy.app` into **Applications**
2. Open it — signed & notarized, so it launches without warnings

**Windows** (10/11):
1. Download `Capy-Setup.exe` (installer) — or `Capy-windows-portable.zip`,
   unzip, and run `Capy.exe`
2. The build is currently unsigned, so SmartScreen may say "Windows
   protected your PC" — click **More info → Run anyway**

Either way, the sleeping capybara appears in the bottom-right corner.

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
