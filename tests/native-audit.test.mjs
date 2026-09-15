import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('..', import.meta.url));
const appId = 'com.kamilunavo.wunderkapseln';
function run(t, kind, xml, ...args) {
  const dir = mkdtempSync(join(tmpdir(), 'wunder-native-audit-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, kind === 'android' ? 'AndroidManifest.xml' : 'Info.plist');
  if (xml !== null) writeFileSync(path, xml);
  const result = spawnSync('python3', [join(root, 'tools/audit-native.py'), `--${kind}`, path, ...args], { encoding: 'utf8', timeout: 5000 });
  if (xml !== null) assert.equal(readFileSync(path, 'utf8'), xml, 'audit must never rewrite a manifest');
  assert.ok(result.stdout.trim(), result.stderr); return { ...result, report: JSON.parse(result.stdout) };
}
const manifest = (permissions = '', attributes = '', contents = '') => `<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="${appId}">${permissions}<application android:debuggable="false" ${attributes}>${contents}</application></manifest>`;
const permission = name => `<uses-permission android:name="${name}"/>`;
const plist = (extra = '', id = 'com.kamilunavo.wondercaps') => `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>${id}</string><key>CFBundleDisplayName</key><string>WonderCaps</string>${extra}</dict></plist>`;
test('final Android manifest allows Internet and vibration without extra capabilities', t => {
  const result = run(t, 'android', manifest(permission('android.permission.INTERNET') + permission('android.permission.VIBRATE')));
  assert.equal(result.status, 0); assert.deepEqual(result.report.errors, []); assert.equal(result.report.identityVerified, true);
});
test('Android microphone, camera, location, notifications and ad id are rejected', t => {
  for (const name of ['android.permission.RECORD_AUDIO', 'android.permission.CAMERA', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.POST_NOTIFICATIONS', 'com.google.android.gms.permission.AD_ID']) {
    const result = run(t, 'android', manifest(permission(name)));
    assert.equal(result.status, 1); assert.ok(result.report.errors.includes(`unapproved_permission:${name}`));
  }
});
test('Android SDK-scoped permissions are inspected too', t => {
  const result = run(t, 'android', manifest('<uses-permission-sdk-23 android:name="android.permission.READ_EXTERNAL_STORAGE"/>'));
  assert.equal(result.status, 1); assert.ok(result.report.errors.includes('unapproved_permission:android.permission.READ_EXTERNAL_STORAGE'));
});
test('an unmerged tools removal marker is not evidence that a final APK is safe', t => {
  const xml = manifest(permission('android.permission.INTERNET')).replace('package=', 'xmlns:tools="http://schemas.android.com/tools" tools:node="merge" package=');
  const result = run(t, 'android', xml); assert.equal(result.status, 1); assert.ok(result.report.errors.includes('unmerged_manifest'));
});
test('wrong app identity, debuggability and cleartext permission block a release audit', t => {
  const xml = manifest('', 'android:usesCleartextTraffic="true"').replace(appId, 'wrong.app').replace('debuggable="false"', 'debuggable="true"');
  const result = run(t, 'android', xml); assert.equal(result.status, 1);
  for (const reason of ['application_id_mismatch', 'debuggable_release', 'cleartext_traffic_enabled']) assert.ok(result.report.errors.includes(reason));
});
test('background audio service is rejected even without its foreground permission', t => {
  const result = run(t, 'android', manifest('', '', '<service android:name="expo.modules.audio.service.AudioControlsService" android:foregroundServiceType="mediaPlayback"/>'));
  assert.equal(result.status, 1); assert.ok(result.report.errors.includes('background_service_enabled'));
});
test('AndroidX private dynamic receiver permission requires the signature protection level', t => {
  const name = `${appId}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`;
  const valid = permission(name) + `<permission android:name="${name}" android:protectionLevel="signature"/>`;
  assert.equal(run(t, 'android', manifest(valid)).status, 0);
  const bad = run(t, 'android', manifest(valid.replace('protectionLevel="signature"', 'protectionLevel="normal"')));
  assert.equal(bad.status, 1); assert.ok(bad.report.errors.includes('unsafe_private_permission'));
});
test('missing or malformed native inputs cannot report successful verification', t => {
  assert.equal(run(t, 'android', null).status, 1);
  assert.equal(run(t, 'android', '<manifest>').status, 1);
  assert.equal(run(t, 'ios', '<plist>broken').status, 1);
});
test('minimal resolved iOS plist passes foreground-only capability audit', t => {
  const result = run(t, 'ios', plist()); assert.equal(result.status, 0); assert.equal(result.report.identityVerified, true);
});
test('iOS microphone, tracking and background audio capabilities are rejected', t => {
  const result = run(t, 'ios', plist('<key>NSMicrophoneUsageDescription</key><string>record</string><key>NSUserTrackingUsageDescription</key><string>track</string><key>UIBackgroundModes</key><array><string>audio</string></array>'));
  assert.equal(result.status, 1);
  assert.ok(result.report.errors.includes('unapproved_usage_description:NSMicrophoneUsageDescription'));
  assert.ok(result.report.errors.includes('background_modes_enabled'));
});
test('unresolved iOS build variables require an explicit config-only mode', t => {
  const input = plist('', '$(PRODUCT_BUNDLE_IDENTIFIER)');
  assert.equal(run(t, 'ios', input).status, 1);
  const result = run(t, 'ios', input, '--allow-unresolved-identity');
  assert.equal(result.status, 0); assert.equal(result.report.identityVerified, false);
  assert.equal(result.report.scope, 'generated-config-only');
});
test('explicit config-only mode still rejects the wrong concrete iOS identity', t => {
  assert.equal(run(t, 'ios', plist('', 'wrong.app'), '--allow-unresolved-identity').status, 1);
});

// ExpoAudio.updatePlaySoundThroughEarpiece sets AudioManager mode and speaker
// routing even when microphone capture is disabled. This normal permission
// authorizes routing, not recording; sensitive and background gates stay strict.
test('foreground playback permits the normal audio-routing permission', t => {
  const result = run(t, 'android', manifest(permission('android.permission.MODIFY_AUDIO_SETTINGS')));
  assert.equal(result.status, 0);
  assert.deepEqual(result.report.permissions, ['android.permission.MODIFY_AUDIO_SETTINGS']);
});
test('audio-routing permission does not authorize microphone or background playback', t => {
  const routing = permission('android.permission.MODIFY_AUDIO_SETTINGS');
  const mic = run(t, 'android', manifest(routing + permission('android.permission.RECORD_AUDIO')));
  assert.equal(mic.status, 1);
  assert.ok(mic.report.errors.includes('unapproved_permission:android.permission.RECORD_AUDIO'));
  const background = run(t, 'android', manifest(routing, '', '<service android:name="expo.modules.audio.service.AudioControlsService" android:foregroundServiceType="mediaPlayback"/>'));
  assert.equal(background.status, 1);
  assert.ok(background.report.errors.includes('background_service_enabled'));
});
