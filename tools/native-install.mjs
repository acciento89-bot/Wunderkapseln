import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkLockfile, installationPlan } from './build-policy.mjs';
import { parseArguments, readBuildInputs, configurationErrors } from './build-inputs.mjs';

try {
  const { root, flags } = parseArguments(process.argv.slice(2), ['--bootstrap', '--dry-run']);
  const { pkg, expo, lock, inputErrors } = readBuildInputs(root);
  const errors = [...inputErrors, ...configurationErrors(pkg, expo)];
  if (errors.length) throw new Error(errors.join(', '));
  const plan = installationPlan(pkg, lock, { allowBootstrap: flags.has('--bootstrap') });
  if (flags.has('--dry-run')) {
    console.log(JSON.stringify({ dryRun: true, plan, nativeBuildVerified: false }, null, 2));
  } else {
    // Use npm's standard registry. This is never a proxy, alternate host or a security-denial fallback.
    // npm owns package integrity checking; the metadata gate does not replace it.
    const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : plan.command, plan.args, {
      cwd: root, stdio: 'inherit', shell: false, timeout: 600000,
      env: { ...process.env, npm_config_registry: 'https://registry.npmjs.org/',
        npm_config_fetch_retries: '0', npm_config_fetch_timeout: '30000' },
    });
    const after = readBuildInputs(root);
    const lockErrors = [...after.inputErrors, ...checkLockfile(after.pkg, after.lock)];
    const report = { schema: 1, timestamp: new Date().toISOString(), mode: plan.mode,
      command: [plan.command, ...plan.args], npmExitCode: result.status,
      processError: result.error?.code ?? null, lockErrors,
      installationSucceeded: result.status === 0 && !result.error && lockErrors.length === 0,
      nativeBuildVerified: false };
    mkdirSync(resolve(root, 'dist/build-evidence'), { recursive: true });
    writeFileSync(resolve(root, 'dist/build-evidence/dependency-install.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.installationSucceeded ? 0 : 1;
  }
} catch (error) {
  console.log(JSON.stringify({ errors: error.message.split(', '), nativeBuildVerified: false }, null, 2));
  process.exitCode = 1;
}
