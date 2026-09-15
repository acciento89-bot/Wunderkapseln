import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { checkAppIdentity } from '../tools/build-policy.mjs';

const read = file => JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
const pkg = read('package.json');
const app = read('app.json').expo;
const approved = () => ({ ...structuredClone(app), ios: { ...structuredClone(app.ios),
  bundleIdentifier: 'com.kamilunavo.wondercaps', infoPlist: { ITSAppUsesNonExemptEncryption: false,
    CFBundleDisplayName: 'WonderCaps', CFBundleName: 'WonderCaps' } } });
function auditPlist(t, { id = 'com.kamilunavo.wondercaps', name = 'WonderCaps' } = {}, extra = []) {
  const dir = mkdtempSync(join(tmpdir(), 'wondercaps-identity-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'Info.plist');
  const xml = `<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>${id}</string>${name === null ? '' : `<key>CFBundleDisplayName</key><string>${name}</string>`}</dict></plist>`;
  writeFileSync(path, xml);
  const result = spawnSync('python3', ['tools/audit-native.py', '--ios', path, ...extra], { encoding: 'utf8', timeout: 5000 });
  assert.ok(result.stdout.trim(), result.stderr);
  assert.equal(readFileSync(path, 'utf8'), xml, 'identity audit is read-only');
  return { code: result.status, ...JSON.parse(result.stdout) };
}

test('iOS source config uses the exact owner-supplied WonderCaps bundle identifier', () => {
  assert.equal(app.ios.bundleIdentifier, 'com.kamilunavo.wondercaps');
  assert.equal(app.ios.buildNumber, '9');
});
test('iOS installed display name and bundle name use WonderCaps, not the repository title', () => {
  assert.equal(app.ios.infoPlist.CFBundleDisplayName, 'WonderCaps');
  assert.equal(app.ios.infoPlist.CFBundleName, 'WonderCaps');
});
test('the Apple-only identity change preserves Android package, Expo slug and repository name', () => {
  assert.equal(app.android.package, 'com.kamilunavo.wunderkapseln');
  assert.equal(app.name, 'Wunderkapseln');
  assert.equal(app.slug, 'wunderkapseln');
  assert.equal(pkg.name, 'wunderkapseln');
});
test('identity gate accepts different approved platform identifiers', () => {
  assert.deepEqual(checkAppIdentity(pkg, approved()), []);
});
test('identity gate permits independently monotonic iOS and Android build numbers', () => {
  const config=approved();config.ios.buildNumber='9';config.android.versionCode=8;
  assert.deepEqual(checkAppIdentity(pkg,config),[]);
});
test('identity gate rejects an iOS regression to the former Android identifier', () => {
  const config = approved(); config.ios.bundleIdentifier = 'com.kamilunavo.wunderkapseln';
  assert.ok(checkAppIdentity(pkg, config).includes('application_id_mismatch'));
});
test('identity gate does not permit an unintended Android rename to the Apple identifier', () => {
  const config = approved(); config.android.package = 'com.kamilunavo.wondercaps';
  assert.ok(checkAppIdentity(pkg, config).includes('application_id_mismatch'));
});
test('identity gate rejects a stale or absent Apple display name', () => {
  for (const name of ['Wunderkapseln', 'Wondercaps', undefined]) {
    const config = approved(); config.ios.infoPlist.CFBundleDisplayName = name;
    assert.ok(checkAppIdentity(pkg, config).includes('ios_display_name_mismatch'));
  }
});
test('an Info.plist override cannot silently replace the approved iOS identifier', () => {
  const config = approved(); config.ios.infoPlist.CFBundleIdentifier = 'com.example.other';
  assert.ok(checkAppIdentity(pkg, config).includes('ios_bundle_override_mismatch'));
});
test('Apple SKU is recorded as store metadata, never as a native identifier or payment SKU', () => {
  const meta = read('docs/store-metadata.json');
  assert.equal(meta.apple?.sku, 'wondercaps-001');
  assert.equal(meta.apple?.bundleIdentifier, 'com.kamilunavo.wondercaps');
  assert.equal(meta.apple?.name, 'WonderCaps');
  assert.equal(meta.apple?.recordStatus, 'owner_reported_existing');
  assert.equal(meta.apple?.verifiedInAppStoreConnect, false);
  assert.ok(!JSON.stringify(app).includes('wondercaps-001'));
});
test('German and English Apple listing drafts use WonderCaps while Android drafts are retained', () => {
  const meta = read('docs/store-metadata.json');
  for (const lang of ['de', 'en']) {
    assert.equal(meta.apple?.localizations?.[lang]?.name, 'WonderCaps');
    assert.ok(meta.apple.localizations[lang].description.includes('WonderCaps'));
    assert.ok(!meta.apple.localizations[lang].description.includes('Wunderkapseln'));
    assert.equal(meta[lang].name, 'Wunderkapseln');
    const markdown = readFileSync(new URL(`../docs/APPLE_STORE_COPY_${lang.toUpperCase()}.md`, import.meta.url), 'utf8');
    assert.ok(markdown.includes(meta.apple.localizations[lang].description));
  }
});
test('resolved Apple plist accepts the approved identifier and display name without claiming a build', t => {
  const result = auditPlist(t);
  assert.equal(result.code, 0);
  assert.equal(result.identityVerified, true);
  assert.equal(result.displayNameVerified, true);
  assert.equal(result.nativeBuildVerified, false);
});
test('the old iOS identifier is rejected even in config-only mode', t => {
  const result = auditPlist(t, { id: 'com.kamilunavo.wunderkapseln' }, ['--allow-unresolved-identity']);
  assert.equal(result.code, 1);
  assert.ok(result.errors.includes('application_id_mismatch'));
});
test('missing or stale Apple display name fails native plist inspection', t => {
  for (const name of [null, 'Wunderkapseln', 'Wondercaps']) {
    const result = auditPlist(t, { name });
    assert.equal(result.code, 1);
    assert.ok(result.errors.includes('ios_display_name_mismatch'));
  }
});
test('unresolved Apple build variables still require explicit config-only inspection', t => {
  const result = auditPlist(t, { id: '$(PRODUCT_BUNDLE_IDENTIFIER)' }, ['--allow-unresolved-identity']);
  assert.equal(result.code, 0);
  assert.equal(result.identityVerified, false);
  assert.equal(result.displayNameVerified, true);
  assert.equal(result.scope, 'generated-config-only');
});
