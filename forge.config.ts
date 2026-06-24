import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

// Set CAPY_SIGN=1 to produce a signed + notarized macOS build. Requires:
//  - a "Developer ID Application" certificate in the login keychain
//  - notary credentials stored via:
//    xcrun notarytool store-credentials capy-notarize
const shouldSign = process.env.CAPY_SIGN === '1';

// `icon` is given without an extension so the packager picks the right
// file per platform: icon.icns on macOS, icon.ico on Windows.
const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'Capy',
    icon: './icons/icon',
    appBundleId: 'com.audreypork.capy',
    appCategoryType: 'public.app-category.productivity',
    ...(shouldSign
      ? {
          osxSign: {},
          osxNotarize: {
            keychainProfile: 'capy-notarize',
          },
        }
      : {}),
  },
  rebuildConfig: {},
  makers: [
    // macOS: zipped .app (signed + notarized when CAPY_SIGN=1)
    new MakerZIP({}, ['darwin']),
    // Windows: Squirrel installer (built on a Windows host / CI) plus a
    // portable zip that can be cross-built from any platform.
    new MakerSquirrel({
      name: 'Capy',
      setupIcon: './icons/icon.ico',
      iconUrl:
        'https://raw.githubusercontent.com/audreypork/no-cap/main/icons/icon.ico',
    }),
    new MakerZIP({}, ['win32']),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
