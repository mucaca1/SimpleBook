import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { PublisherGithub } from '@electron-forge/publisher-github';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Helper function to generate latest.yml
function generateLatestYml(outputPath: string, version: string): string | undefined {
  const files = fs.readdirSync(outputPath);
  const setupExe = files.find(f => f.match(/Setup\.exe$/i));

  if (!setupExe) {
    console.warn('⚠️  Setup.exe not found, skipping latest.yml generation');
    return undefined;
  }

  const setupPath = path.join(outputPath, setupExe);
  const setupStats = fs.statSync(setupPath);

  // Calculate SHA512
  const fileBuffer = fs.readFileSync(setupPath);
  const hashSum = crypto.createHash('sha512');
  hashSum.update(fileBuffer);
  const sha512 = hashSum.digest('base64');

  // Replace spaces with dashes in URL (auto-updater expects dashes)
  const setupUrl = setupExe.replace(/ /g, '-');

  // Create latest.yml content
  const latestYml = `version: ${version}
files:
  - url: ${setupUrl}
    sha512: ${sha512}
    size: ${setupStats.size}
path: ${setupUrl}
sha512: ${sha512}
releaseDate: '${new Date().toISOString()}'
`;

  // Write latest.yml
  const ymlPath = path.join(outputPath, 'latest.yml');
  fs.writeFileSync(ymlPath, latestYml);

  console.log('✅ Generated latest.yml');
  console.log(`   Location: ${ymlPath}`);
  console.log(`   Version: ${version}`);
  console.log(`   File: ${setupExe}`);
  console.log(`   URL: ${setupUrl}`);

  return ymlPath;
}

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    extraResource: [
      './app-update.yml'
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      remoteReleases: 'https://github.com/mucaca1/SimpleBook',
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({})
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'mucaca1',
        name: 'SimpleBook',
      },
      prerelease: false,
      draft: false, // Creates draft release first for review
    }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/electron/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/electron/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
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
  hooks: {
    postMake: async (forgeConfig, makeResults) => {
      // Get version from package.json
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
      );
      const version = packageJson.version;

      console.log('\n🔧 Post-make hook: Generating latest.yml...\n');

      // Process each platform's output
      for (const makeResult of makeResults) {
        console.log(`Platform: ${makeResult.platform}`);

        for (let i = 0; i < makeResult.artifacts.length; i++) {
          const artifact = makeResult.artifacts[i];
          const artifactDir = path.dirname(artifact);

          // Only generate for Squirrel.Windows builds
          if (artifact.includes('squirrel.windows') && artifact.includes(' Setup.exe')) {
            console.log(`Processing: ${artifactDir}`);

            // Rename file from space to dash for consistent URL
            const oldPath = artifact;
            const newPath = path.join(artifactDir, path.basename(oldPath).replace(/ /g, '-'));
            fs.renameSync(oldPath, newPath);
            console.log(`Renamed: ${path.basename(oldPath)} -> ${path.basename(newPath)}`);

            // Update the artifact path
            makeResult.artifacts[i] = newPath;

            const ymlPath = generateLatestYml(artifactDir, version);

            // Add latest.yml to artifacts so it gets published to GitHub
            if (ymlPath && !makeResult.artifacts.includes(ymlPath)) {
              makeResult.artifacts.push(ymlPath);
              console.log(`Added to artifacts: ${ymlPath}`);
            }
          }
        }
      }

      console.log('\n✅ Post-make hook completed\n');
      return makeResults;
    },
  },
};

export default config;
