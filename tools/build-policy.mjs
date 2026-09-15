/** Offline metadata gates only. npm ci still verifies downloads and dependency resolution. */
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const androidApplicationId = 'com.kamilunavo.wunderkapseln';
const iosApplicationId = 'com.kamilunavo.wondercaps';
function dependencyMap(value) {
  if (value === undefined) return '{}';
  if (!isRecord(value) || Object.values(value).some(v => typeof v !== 'string')) return null;
  return JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}
function approvedTarball(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'registry.npmjs.org' && !url.port &&
      !url.username && !url.password && !url.search && !url.hash && url.pathname.endsWith('.tgz');
  } catch { return false; }
}
function validIntegrity(value) {
  if (typeof value !== 'string') return false;
  const lengths = { sha512: 64, sha384: 48, sha256: 32, sha1: 20 };
  return value.trim().split(/\s+/).some(entry => {
    const match = /^(sha512|sha384|sha256|sha1)-([A-Za-z0-9+/]+={0,2})$/.exec(entry);
    if (!match) return false;
    const digest = Buffer.from(match[2], 'base64');
    return digest.length === lengths[match[1]] && digest.toString('base64') === match[2];
  });
}
export function checkLockfile(pkg, lock) {
  if (!isRecord(pkg) || typeof pkg.name !== 'string' || !exactVersion.test(pkg.version)) return ['invalid_package_json'];
  if (lock === null || lock === undefined) return ['missing_lockfile'];
  if (!isRecord(lock) || lock.lockfileVersion !== 3) return ['unsupported_lockfile'];
  if (!isRecord(lock.packages) || !isRecord(lock.packages[''])) return ['missing_lock_root'];
  const errors = [], root = lock.packages[''];
  if (root.name !== pkg.name || root.version !== pkg.version) errors.push('lock_identity_mismatch');
  for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    const expected = dependencyMap(pkg[field]), actual = dependencyMap(root[field]);
    if (expected === null || actual === null || expected !== actual) errors.push('lock_dependencies_mismatch');
  }
  const direct = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies };
  for (const [name, version] of Object.entries(direct)) {
    const entry = lock.packages[`node_modules/${name}`];
    if (!Object.hasOwn(lock.packages, `node_modules/${name}`)) errors.push(`missing_locked_package:${name}`);
    else if (isRecord(entry) && exactVersion.test(version) && entry.version !== version) errors.push(`locked_version_mismatch:${name}`);
  }
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (path === '') continue;
    if (!path.startsWith('node_modules/') || path.split('/').some(p => p === '..' || p === '.') ||
        !isRecord(entry) || !exactVersion.test(entry.version)) {
      errors.push(`invalid_locked_package:${path}`); continue;
    }
    if (entry.link || !approvedTarball(entry.resolved)) errors.push(`unapproved_package_source:${path}`);
    if (typeof entry.integrity !== 'string' || !entry.integrity.trim()) errors.push(`missing_integrity:${path}`);
    else if (!validIntegrity(entry.integrity)) errors.push(`invalid_integrity:${path}`);
  }
  return [...new Set(errors)];
}
export function installationPlan(pkg, lock, { allowBootstrap = false } = {}) {
  const errors = checkLockfile(pkg, lock);
  if (errors.length === 1 && errors[0] === 'missing_lockfile' && allowBootstrap === true) {
    return { mode: 'bootstrap', command: 'npm', args: ['install', '--no-audit', '--no-fund'] };
  }
  if (errors.length) throw new Error(errors.join(', '));
  return { mode: 'locked', command: 'npm', args: ['ci', '--no-audit', '--no-fund'] };
}
export function checkAppIdentity(pkg, expo) {
  if (!isRecord(pkg) || !isRecord(expo)) return ['invalid_app_config'];
  const errors = [];
  if (expo.version !== pkg.version) errors.push('app_version_mismatch');
  if (expo.ios?.bundleIdentifier !== iosApplicationId || expo.android?.package !== androidApplicationId) errors.push('application_id_mismatch');
  const plist = expo.ios?.infoPlist;
  if (plist?.CFBundleDisplayName !== 'WonderCaps') errors.push('ios_display_name_mismatch');
  if (plist?.CFBundleName !== undefined && plist.CFBundleName !== 'WonderCaps') errors.push('ios_bundle_name_mismatch');
  if (plist?.CFBundleIdentifier !== undefined && plist.CFBundleIdentifier !== iosApplicationId) errors.push('ios_bundle_override_mismatch');
  if (expo.icon !== './assets/icon.png' || expo.splash?.image !== expo.icon) errors.push('icon_splash_mismatch');
  if (expo.android?.adaptiveIcon !== undefined) errors.push('unexpected_adaptive_icon');
  const versionCode = expo.android?.versionCode;
  const iosBuild = expo.ios?.buildNumber;
  if (!Number.isSafeInteger(versionCode) || versionCode < 1 || !/^\d+$/.test(iosBuild ?? '') || Number(iosBuild) < 1) errors.push('build_number_mismatch');
  return errors;
}
