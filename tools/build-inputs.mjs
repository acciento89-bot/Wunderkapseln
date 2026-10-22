import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkAppIdentity } from './build-policy.mjs';

export function parseArguments(argv, permittedFlags) {
  let root = process.cwd(); const flags = new Set();
  for (let i = 0; i < argv.length; i++) {
    const value = argv[i];
    if (value === '--root') {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error('missing_root_path');
      root = resolve(argv[++i]);
    } else if (permittedFlags.includes(value)) flags.add(value);
    else throw new Error(`unknown_argument:${value}`);
  }
  return { root, flags };
}
export function readBuildInputs(root) {
  const inputErrors = [];
  function read(name, optional = false) {
    try { return JSON.parse(readFileSync(resolve(root, name), 'utf8')); }
    catch (error) {
      if (optional && error.code === 'ENOENT') return null;
      inputErrors.push(error.code === 'ENOENT' ? `missing_file:${name}` : error instanceof SyntaxError ? `invalid_json:${name}` : `unreadable_file:${name}`);
      return null;
    }
  }
  const pkg = read('package.json'), app = read('app.json'), lock = read('package-lock.json', true);
  return { pkg, expo: app?.expo, lock, inputErrors };
}
export function configurationErrors(pkg, expo) {
  const errors = checkAppIdentity(pkg, expo);
  if (!expo || typeof expo !== 'object') return errors;
  const plugins = Array.isArray(expo.plugins) ? expo.plugins : [];
  const audio = plugins.find(plugin => Array.isArray(plugin) && plugin[0] === 'expo-audio')?.[1];
  if (!audio || typeof audio !== 'object') errors.push('missing_audio_configuration');
  else for (const key of ['microphonePermission', 'recordAudioAndroid', 'enableBackgroundPlayback', 'enableBackgroundRecording']) {
    if (audio[key] !== false) errors.push(`audio_capability_enabled:${key}`);
  }
  for (const plugin of plugins) {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    if (!['expo-audio', 'expo-asset', 'expo-build-properties'].includes(name)) errors.push(`unreviewed_plugin:${String(name)}`);
  }
  const buildProperties = plugins.find(plugin => Array.isArray(plugin) && plugin[0] === 'expo-build-properties')?.[1];
  if (buildProperties?.ios?.deploymentTarget !== '15.1' || buildProperties?.android?.kotlinVersion !== '2.2.0') errors.push('invalid_iap_build_properties');
  const allowed = new Set(['android.permission.VIBRATE', 'android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE']);
  if (!Array.isArray(expo.android?.permissions)) errors.push('invalid_android_permissions');
  else for (const permission of expo.android.permissions) if (!allowed.has(permission)) errors.push(`unapproved_permission:${permission}`);
  if (!Array.isArray(expo.android?.blockedPermissions) || !expo.android.blockedPermissions.includes('android.permission.RECORD_AUDIO')) errors.push('missing_microphone_block');
  return [...new Set(errors)];
}
