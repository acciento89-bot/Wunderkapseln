import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const verify = read('.github/workflows/verify.yml');

function job(source, name) {
  const marker = `  ${name}:\n`;
  const index = source.indexOf(marker);
  assert.ok(index >= 0, `Missing CI job ${name}`);
  return source.slice(index + marker.length).split(/\n  [a-z][a-z0-9-]+:\n/)[0];
}

test('0.5.0 uses a one-time lock bootstrap workflow limited to the approved feature branch', () => {
  assert.ok(existsSync(new URL('../.github/workflows/bootstrap-lock.yml', import.meta.url)));
  const source = read('.github/workflows/bootstrap-lock.yml');
  assert.match(source, /branches:\s*\[feature\/store-purchases-build9\]/);
  assert.match(source, /permissions:\n  contents: write/);
  assert.match(source, /npm run native:install -- --bootstrap/);
  assert.match(source, /node tools\/ci-source\.mjs commit-lock/);
  assert.match(source, /verify-after-lock:/);
  assert.doesNotMatch(source, /git add -A|git add \./);
  assert.doesNotMatch(source, /eas submit|fastlane|upload_to_play_store|app-store|play-store/i);
});

test('normal verification never bootstraps dependencies and consumes only a committed lockfile', () => {
  const resolution = job(verify, 'native-resolution');
  assert.doesNotMatch(resolution, /--bootstrap|npm install/);
  assert.match(resolution, /npm run native:install/);
  assert.match(resolution, /package-lock\.json/);
});

test('Build 9 feature CI produces an audited Android AAB without any store upload', () => {
  const android = job(verify, 'android-preview');
  assert.match(android, /github\.event_name == 'push'/);
  assert.match(android, /refs\/heads\/feature\/store-purchases-build9/);
  assert.match(android, /bundleRelease/);
  assert.match(android, /Wunderkapseln-INTERNAL-ONLY-AAB/);
  assert.match(android, /jarsigner -verify/);
  assert.doesNotMatch(android, /play store|upload_to_play_store|eas submit/i);
});

test('feature-branch CI performs a signing-free iOS simulator build on macOS 26', () => {
  const ios = job(verify, 'ios-simulator');
  assert.match(ios, /runs-on: macos-26/);
  assert.match(ios, /github\.event_name == 'push'/);
  assert.match(ios, /refs\/heads\/feature\/store-purchases-build9/);
  assert.match(ios, /xcodebuild/);
  assert.match(ios, /-sdk iphonesimulator/);
  assert.match(ios, /CODE_SIGNING_ALLOWED=NO/);
  assert.match(ios, /WonderCaps-INTERNAL-ONLY-iOS-Simulator/);
  assert.doesNotMatch(ios, /archive|exportArchive|notary|fastlane|eas submit/i);
});

test('Build 9 advances Android after confirming the Play package has no existing version code', () => {
  const pkg = JSON.parse(read('package.json'));
  const expo = JSON.parse(read('app.json')).expo;
  assert.equal(pkg.version, '0.5.0');
  assert.equal(expo.version, '0.5.0');
  assert.equal(expo.ios.buildNumber, '9');
  assert.equal(expo.android.versionCode, 9);
  assert.equal(expo.ios.bundleIdentifier, 'com.kamilunavo.wondercaps');
  assert.equal(expo.android.package, 'com.kamilunavo.wunderkapseln');
});

test('canonical PNG app icon is explicitly allowed through gitignore', () => {
  const ignore = read('.gitignore');
  assert.match(ignore, /^!assets\/icon\.png$/m);
});
