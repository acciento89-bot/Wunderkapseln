import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const verify = readFileSync(new URL('../.github/workflows/verify.yml', import.meta.url), 'utf8');
const bootstrap = readFileSync(new URL('../.github/workflows/bootstrap-lock.yml', import.meta.url), 'utf8');

function job(source, name) {
  const marker = `  ${name}:\n`;
  const index = source.indexOf(marker);
  assert.ok(index >= 0, `Missing CI job ${name}`);
  return source.slice(index + marker.length).split(/\n  [a-z][a-z0-9-]+:\n/)[0];
}

test('first dependency resolution is isolated to a one-time lock workflow on the approved feature branch', () => {
  assert.match(bootstrap, /branches:\s*\[feature\/playable-miniature-worlds\]/);
  assert.match(bootstrap, /npm run native:install -- --bootstrap/);
  assert.match(bootstrap, /node tools\/ci-source\.mjs commit-lock/);
  assert.match(bootstrap, /git diff --exit-code -- package\.json app\.json/);
  const resolution = job(verify, 'native-resolution');
  assert.doesNotMatch(resolution, /--bootstrap|npm install/);
  assert.match(resolution, /test -f package-lock\.json/);
  assert.match(resolution, /npm run native:install/);
});

test('Android and iOS JavaScript bundling are downstream of the single committed lock resolution', () => {
  const bundles = job(verify, 'native-bundles');
  assert.match(bundles, /needs: \[rules-and-preview, native-resolution\]/);
  assert.match(bundles, /actions\/download-artifact@v4/);
  assert.match(bundles, /wondercaps-lock-\$\{\{ inputs\.source_sha \|\| github\.sha \}\}/);
  assert.match(bundles, /npm run native:install/);
  assert.match(bundles, /expo export --platform android/);
  assert.match(bundles, /expo export --platform ios/);
});

test('internal Android APK runs only for pushes to the approved feature branch and shares the committed lock', () => {
  const apk = job(verify, 'android-preview');
  assert.match(apk, /github\.event_name == 'push'/);
  assert.match(apk, /refs\/heads\/feature\/playable-miniature-worlds/);
  assert.match(apk, /needs: \[rules-and-preview, native-resolution, native-bundles\]/);
  assert.match(apk, /wondercaps-lock-\$\{\{ inputs\.source_sha \|\| github\.sha \}\}/);
  assert.match(apk, /npm run native:install/);
  assert.match(apk, /assembleRelease/);
});

test('capability audit reads the packaged Android manifest before internal artifact upload', () => {
  const apk = job(verify, 'android-preview');
  assert.match(apk, /apkanalyzer.*manifest print/);
  assert.match(apk, /audit-native\.py --android/);
  assert.match(apk, /apksigner.*verify --verbose --print-certs/);
  assert.ok(apk.indexOf('audit-native.py --android') < apk.indexOf('name: Wunderkapseln-INTERNAL-ONLY-APK'));
  assert.doesNotMatch(apk, /continue-on-error: true/);
});

test('iOS simulator CI uses macOS 26, Xcode 26.2+ and explicitly disables signing', () => {
  const ios = job(verify, 'ios-simulator');
  assert.match(ios, /runs-on: macos-26/);
  assert.match(ios, /Xcode 26\.2/);
  assert.match(ios, /pod install/);
  assert.match(ios, /xcodebuild/);
  assert.match(ios, /-sdk iphonesimulator/);
  assert.match(ios, /CODE_SIGNING_ALLOWED=NO/);
  assert.match(ios, /audit-native\.py --ios/);
  assert.match(ios, /com\.kamilunavo\.wondercaps/);
});

test('verification is read-only and neither workflow contains store submission or secrets', () => {
  assert.match(verify, /permissions:\n  contents: read/);
  assert.match(bootstrap, /permissions:\n  contents: write/);
  assert.doesNotMatch(`${verify}\n${bootstrap}`, /secrets\.|eas submit|fastlane|upload_to_play_store|exportArchive|notary/i);
  assert.doesNotMatch(bootstrap, /git add -A|git add \./);
  assert.match(verify, /timeout-minutes:/);
});

test('source configuration blocks legacy file access and overlays in the native release', () => {
  const config = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo;
  for (const name of ['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.SYSTEM_ALERT_WINDOW']) {
    assert.ok(config.android.blockedPermissions.includes(name), `Must block ${name}`);
  }
});
