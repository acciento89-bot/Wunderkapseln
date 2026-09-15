import { checkLockfile } from './build-policy.mjs';
import { parseArguments, readBuildInputs, configurationErrors } from './build-inputs.mjs';
try {
  const { root, flags } = parseArguments(process.argv.slice(2), ['--source-only']);
  const { pkg, expo, lock, inputErrors } = readBuildInputs(root);
  const configErrors = [...inputErrors, ...configurationErrors(pkg, expo)];
  const lockErrors = checkLockfile(pkg, lock);
  const report = { schema: 1, version: pkg?.version ?? null, sourceConfigValid: configErrors.length === 0,
    lockMetadataValid: inputErrors.length === 0 && lockErrors.length === 0,
    nativeBuildVerified: false, evidence: 'offline-metadata-only', configErrors, lockErrors,
    nextRequiredEvidence: ['npm-ci', 'expo-compatibility-check', 'android-ios-exports', 'native-build', 'device-tests'] };
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.sourceConfigValid && (flags.has('--source-only') || report.lockMetadataValid) ? 0 : 1;
} catch (error) {
  console.log(JSON.stringify({ errors: [error.message], nativeBuildVerified: false })); process.exitCode = 1;
}
