import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, 'package.json')));
const app = JSON.parse(readFileSync(join(root, 'app.json')));
function fixture(t) {
  const path = mkdtempSync(join(tmpdir(), 'wunder-build-'));
  t.after(() => rmSync(path, { recursive: true, force: true }));
  writeFileSync(join(path, 'package.json'), JSON.stringify(pkg));
  writeFileSync(join(path, 'app.json'), JSON.stringify(app));
  return path;
}
function cli(tool, dir, ...args) { return spawnSync(process.execPath, [join(root, 'tools', tool), '--root', dir, ...args], { encoding: 'utf8', timeout: 5000 }); }
function payload(result) { assert.ok(result.stdout?.trim(), result.stderr); return JSON.parse(result.stdout); }
test('normal install refuses a missing lock before launching npm', t => {
  const dir = fixture(t), result = cli('native-install.mjs', dir, '--dry-run');
  assert.equal(result.status, 1); assert.ok(payload(result).errors.includes('missing_lockfile'));
  assert.equal(existsSync(join(dir, 'node_modules')), false);
});
test('explicit bootstrap dry run reports install and never mutates the directory', t => {
  const dir = fixture(t), result = cli('native-install.mjs', dir, '--bootstrap', '--dry-run');
  assert.equal(result.status, 0, result.stderr); assert.equal(payload(result).plan.args[0], 'install');
  assert.equal(existsSync(join(dir, 'package-lock.json')), false);
  assert.equal(existsSync(join(dir, 'node_modules')), false);
});
test('a malformed existing lock fails even when bootstrap is requested', t => {
  const dir = fixture(t); writeFileSync(join(dir, 'package-lock.json'), '{broken');
  const result = cli('native-install.mjs', dir, '--bootstrap', '--dry-run');
  assert.equal(result.status, 1); assert.ok(payload(result).errors.includes('invalid_json:package-lock.json'));
  assert.equal(readFileSync(join(dir, 'package-lock.json'), 'utf8'), '{broken');
});
test('source-only readiness reports the missing native resolution without claiming a build', t => {
  const dir = fixture(t), result = cli('check-build.mjs', dir, '--source-only');
  assert.equal(result.status, 0, result.stderr); const report = payload(result);
  assert.equal(report.sourceConfigValid, true); assert.equal(report.lockMetadataValid, false);
  assert.equal(report.nativeBuildVerified, false); assert.deepEqual(report.lockErrors, ['missing_lockfile']);
});
test('full readiness exits nonzero when a native resolution is missing', t => {
  const result = cli('check-build.mjs', fixture(t));
  assert.equal(result.status, 1); assert.equal(payload(result).lockMetadataValid, false);
});
test('unknown install flags cannot silently opt into a network operation', t => {
  const result = cli('native-install.mjs', fixture(t), '--bootstarp', '--dry-run');
  assert.equal(result.status, 1); assert.ok(payload(result).errors.includes('unknown_argument:--bootstarp'));
});
test('native configuration rejects microphone, background audio and unexpected plugins', t => {
  const dir = fixture(t), config = structuredClone(app);
  config.expo.plugins[0][1].recordAudioAndroid = true;
  config.expo.plugins.push('unreviewed-sdk');
  writeFileSync(join(dir, 'app.json'), JSON.stringify(config));
  const result = cli('check-build.mjs', dir, '--source-only');
  assert.equal(result.status, 1); const report = payload(result);
  assert.ok(report.configErrors.includes('audio_capability_enabled:recordAudioAndroid'));
  assert.ok(report.configErrors.includes('unreviewed_plugin:unreviewed-sdk'));
});
test('registry-only install is also gated by app identity before any network call', t => {
  const dir = fixture(t), config = structuredClone(app); config.expo.android.package = 'wrong.app';
  writeFileSync(join(dir, 'app.json'), JSON.stringify(config));
  const result = cli('native-install.mjs', dir, '--bootstrap', '--dry-run');
  assert.equal(result.status, 1); assert.ok(payload(result).errors.includes('application_id_mismatch'));
});
