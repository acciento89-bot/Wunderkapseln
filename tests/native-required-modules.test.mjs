import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const config = JSON.parse(readFileSync(new URL('../app.json', import.meta.url))).expo;

test('audio assets have an explicit SDK-55 native runtime dependency', () => {
  // ExpoAudio imports Asset at startup. A wildcard transitive peer resolved to
  // SDK 57 and was absent from the generated ExpoModulesProvider on the Mac.
  assert.match(pkg.dependencies['expo-asset'] ?? '', /^~?55\./);
  assert.equal(pkg.devDependencies?.['expo-asset'], undefined);
});

test('the configured dark native interface includes its SDK-55 runtime module', () => {
  assert.equal(config.userInterfaceStyle, 'dark');
  assert.match(pkg.dependencies['expo-system-ui'] ?? '', /^~?55\./);
  assert.equal(pkg.devDependencies?.['expo-system-ui'], undefined);
});
