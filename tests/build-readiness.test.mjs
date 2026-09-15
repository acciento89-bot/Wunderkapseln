import test from 'node:test';
import assert from 'node:assert/strict';
const module = await import('../tools/build-policy.mjs').catch(() => ({}));
const pkg = { name: 'wunderkapseln', version: '0.4.0', dependencies: { expo: '55.0.28', react: '19.2.0' }, devDependencies: { typescript: '~5.9.2' } };
function policy(name, ...args) {
  assert.equal(typeof module[name], 'function', `${name} must be implemented`);
  return module[name](...args);
}
function lockfile() {
  return { lockfileVersion: 3, packages: { '': structuredClone(pkg),
    'node_modules/expo': { version: '55.0.28', resolved: 'https://registry.npmjs.org/expo/-/expo-55.0.28.tgz', integrity: 'sha512-' + Buffer.alloc(64, 42).toString('base64') },
    'node_modules/react': { version: '19.2.0', resolved: 'https://registry.npmjs.org/react/-/react-19.2.0.tgz', integrity: 'sha512-' + Buffer.alloc(64, 42).toString('base64') },
    'node_modules/typescript': { version: '5.9.2', resolved: 'https://registry.npmjs.org/typescript/-/typescript-5.9.2.tgz', integrity: 'sha512-' + Buffer.alloc(64, 42).toString('base64') },
  } };
}
test('missing lockfile blocks locked builds rather than pretending to be reproducible', () => {
  assert.deepEqual(policy('checkLockfile', pkg, null), ['missing_lockfile']);
});
test('structurally consistent package lock passes metadata checks, not a network integrity claim', () => {
  assert.deepEqual(policy('checkLockfile', pkg, lockfile()), []);
});
test('lockfile for another app or version is rejected', () => {
  const lock = lockfile(); lock.packages[''].name = 'different-app';
  assert.ok(policy('checkLockfile', pkg, lock).includes('lock_identity_mismatch'));
});
test('changed dependency ranges must be resolved explicitly, never silently installed with npm ci', () => {
  const lock = lockfile(); lock.packages[''].dependencies.expo = '^55.0.0';
  assert.ok(policy('checkLockfile', pkg, lock).includes('lock_dependencies_mismatch'));
});
test('lockfiles missing a declared installed dependency fail', () => {
  const lock = lockfile(); delete lock.packages['node_modules/react'];
  assert.ok(policy('checkLockfile', pkg, lock).includes('missing_locked_package:react'));
});
test('unexpected extra root dependencies cannot silently expand the reviewed package list', () => {
  const lock = lockfile(); lock.packages[''].dependencies.unapproved = '1.0.0';
  assert.ok(policy('checkLockfile', pkg, lock).includes('lock_dependencies_mismatch'));
});
test('local and git package references are rejected by the public-registry build policy', () => {
  const lock = lockfile(); lock.packages['node_modules/react'].resolved = 'file:../react';
  assert.ok(policy('checkLockfile', pkg, lock).includes('unapproved_package_source:node_modules/react'));
});
test('a transitive package without integrity metadata is not accepted', () => {
  const lock = lockfile(); lock.packages['node_modules/nested'] = { version: '1.0.0', resolved: 'https://registry.npmjs.org/nested/-/nested-1.0.0.tgz' };
  assert.ok(policy('checkLockfile', pkg, lock).includes('missing_integrity:node_modules/nested'));
});
test('bootstrap installation is explicit and subsequent installation uses npm ci', () => {
  assert.deepEqual(policy('installationPlan', pkg, null, { allowBootstrap: true }), { mode: 'bootstrap', command: 'npm', args: ['install', '--no-audit', '--no-fund'] });
  assert.deepEqual(policy('installationPlan', pkg, lockfile()), { mode: 'locked', command: 'npm', args: ['ci', '--no-audit', '--no-fund'] });
});
test('bootstrap is never implicitly chosen for a missing or inconsistent lockfile', () => {
  assert.throws(() => policy('installationPlan', pkg, null), /missing_lockfile/);
  const lock = lockfile(); lock.packages[''].version = '0.0.0';
  assert.throws(() => policy('installationPlan', pkg, lock, { allowBootstrap: true }), /lock_identity_mismatch/);
});
test('project configuration must match each approved platform identity and version', () => {
  const expo = { version: '0.4.0', icon: './assets/icon.png', splash: { image: './assets/icon.png' }, ios: { bundleIdentifier: 'com.kamilunavo.wondercaps', buildNumber: '4', infoPlist: { CFBundleDisplayName: 'WonderCaps' } }, android: { package: 'com.kamilunavo.wunderkapseln', versionCode: 4 } };
  assert.deepEqual(policy('checkAppIdentity', pkg, expo), []);
  expo.android.package = 'com.example.app'; expo.splash.image = './other.png'; expo.ios.buildNumber = '5';
  const errors = policy('checkAppIdentity', pkg, expo);
  assert.ok(errors.includes('application_id_mismatch'));
  assert.ok(errors.includes('icon_splash_mismatch'));
  assert.ok(errors.includes('build_number_mismatch'));
});
test('old-format and structurally malformed lockfiles are rejected with explicit reasons', () => {
  assert.deepEqual(policy('checkLockfile', pkg, { lockfileVersion: 1 }), ['unsupported_lockfile']);
  assert.deepEqual(policy('checkLockfile', pkg, { lockfileVersion: 3, packages: {} }), ['missing_lock_root']);
});

test('null package entries are rejected without crashing the auditor', () => {
  const lock = lockfile(); lock.packages['node_modules/react'] = null;
  assert.ok(policy('checkLockfile', pkg, lock).includes('invalid_locked_package:node_modules/react'));
});
test('locked exact dependency versions must match direct pins', () => {
  const lock = lockfile(); lock.packages['node_modules/react'].version = '19.1.0';
  assert.ok(policy('checkLockfile', pkg, lock).includes('locked_version_mismatch:react'));
});
test('truncated or fabricated-length SRI metadata fails the structural gate', () => {
  const lock = lockfile(); lock.packages['node_modules/react'].integrity = 'sha512-not-a-digest';
  assert.ok(policy('checkLockfile', pkg, lock).includes('invalid_integrity:node_modules/react'));
});
test('registry lookalikes, credential-bearing URLs and links are not approved tarballs', () => {
  for (const resolved of ['https://registry.npmjs.org.evil.test/react.tgz', 'https://user:password@registry.npmjs.org/react.tgz', 'http://registry.npmjs.org/react.tgz']) {
    const lock = lockfile(); lock.packages['node_modules/react'].resolved = resolved;
    assert.ok(policy('checkLockfile', pkg, lock).includes('unapproved_package_source:node_modules/react'));
  }
  const lock = lockfile(); lock.packages['node_modules/react'].link = true;
  assert.ok(policy('checkLockfile', pkg, lock).includes('unapproved_package_source:node_modules/react'));
});
test('unexpected app version and adaptive icon cannot bypass the canonical identity policy', () => {
  const expo = { version: '0.0.0', icon: './assets/icon.png', splash: { image: './assets/icon.png' }, ios: { bundleIdentifier: 'com.kamilunavo.wondercaps', buildNumber: '4', infoPlist: { CFBundleDisplayName: 'WonderCaps' } }, android: { package: 'com.kamilunavo.wunderkapseln', versionCode: 4, adaptiveIcon: { foregroundImage: './other.png' } } };
  const errors = policy('checkAppIdentity', pkg, expo);
  assert.ok(errors.includes('app_version_mismatch')); assert.ok(errors.includes('unexpected_adaptive_icon'));
});
test('malformed lock package maps produce explicit failures', () => {
  assert.deepEqual(policy('checkLockfile', pkg, { lockfileVersion: 3, packages: [] }), ['missing_lock_root']);
});
