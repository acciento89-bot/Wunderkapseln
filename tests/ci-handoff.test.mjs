import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));
const workflow = name => readFileSync(join(project, '.github/workflows', name), 'utf8');
const verify = workflow('verify.yml');
const bootstrap = workflow('bootstrap-lock.yml');
// Structural contracts for these two files; full YAML parsing is a separate host QA check.
function job(source, name) {
  const marker = `  ${name}:\n`;
  const index = source.indexOf(marker, source.indexOf('jobs:'));
  assert.ok(index >= 0, `Missing CI job ${name}`);
  return source.slice(index + marker.length).split(/\n  [a-z][a-z0-9-]+:\n/)[0];
}
const steps = source => source.slice(source.indexOf('    steps:')).split(/\n      - /).slice(1);
let tools = {};
try { tools = await import('../tools/ci-source.mjs'); }
catch (error) { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; }

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' },
  }).trim();
}
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'wondercaps-ci-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const remote = join(root, 'remote.git');
  const checkout = join(root, 'checkout');
  mkdirSync(checkout);
  git(root, 'init', '--bare', remote);
  git(checkout, 'init', '-b', 'feature/playable-miniature-worlds');
  git(checkout, 'config', 'user.name', 'Local fixture');
  git(checkout, 'config', 'user.email', 'fixture@localhost');
  const pkg = { name: 'ci-fixture-only', version: '1.0.0', dependencies: {} };
  writeFileSync(join(checkout, 'package.json'), JSON.stringify(pkg));
  writeFileSync(join(checkout, 'App.js'), 'export default 1;\n');
  git(checkout, 'add', '.');
  git(checkout, 'commit', '-m', 'fixture base');
  const base = git(checkout, 'rev-parse', 'HEAD');
  git(checkout, 'remote', 'add', 'origin', remote);
  git(checkout, 'push', 'origin', 'HEAD:refs/heads/feature/playable-miniature-worlds');
  // Synthetic metadata belongs only to the throwaway git fixture, not the real app.
  const lock = { lockfileVersion: 3, packages: { '': pkg } };
  const writeLock = () => writeFileSync(join(checkout, 'package-lock.json'), JSON.stringify(lock));
  return { root, checkout, remote, base, writeLock };
}
function publish(f) {
  assert.equal(typeof tools.commitBootstrapLock, 'function', 'lock handoff implementation is missing');
  return tools.commitBootstrapLock(f.checkout, { expectedSha: f.base, branch: 'feature/playable-miniature-worlds' });
}
function inspect(f, sha, base = '') {
  assert.equal(typeof tools.verifyCiSource, 'function', 'source provenance implementation is missing');
  return tools.verifyCiSource(f.checkout, { expectedSha: sha, bootstrapBaseSha: base });
}

test('bootstrap invokes the reusable native verification directly after its lock commit', () => {
  assert.match(verify, /workflow_call:\n    inputs:\n      source_sha:[\s\S]*?type: string/);
  const next = job(bootstrap, 'verify-after-lock');
  assert.match(next, /uses: \.\/\.github\/workflows\/verify\.yml/);
  assert.match(next, /needs: bootstrap-lock/);
  assert.match(next, /permissions:\n      contents: read/);
  assert.match(next, /source_sha: \$\{\{ needs\.bootstrap-lock\.outputs\.source_sha \}\}/);
  assert.match(next, /if: needs\.bootstrap-lock\.outputs\.created == 'true'/);
  assert.doesNotMatch(next, /secrets:/);
});

test('every verifier checkout and shared lock artifact use the exact selected source SHA', () => {
  for (const name of ['rules-and-preview', 'native-resolution', 'native-bundles', 'android-preview', 'ios-simulator']) {
    const body = job(verify, name);
    const parts = steps(body);
    const checkout = parts.find(s => s.startsWith('uses: actions/checkout@'));
    assert.ok(checkout.includes('ref: ${{ inputs.source_sha || github.sha }}'), name);
    assert.match(checkout, /persist-credentials: false/, name);
    const proof = parts.find(s => s.includes('run: node tools/ci-source.mjs verify'));
    assert.ok(proof, `missing provenance check for ${name}`);
    assert.ok(proof.includes('EXPECTED_SOURCE_SHA: ${{ inputs.source_sha || github.sha }}'));
    for (const part of parts.filter(s => s.includes('name: wondercaps-lock-'))) {
      assert.ok(part.includes('name: wondercaps-lock-${{ inputs.source_sha || github.sha }}'));
    }
  }
});

test('macOS packaging does not depend on mapfile or select the first of several apps', () => {
  const ios = job(verify, 'ios-simulator');
  assert.doesNotMatch(ios, /\bmapfile\b|head -n 1/);
  assert.match(ios, /node tools\/find-one-artifact\.mjs/);
});

test('native build failures retain diagnostic evidence without uploading an unchecked binary', () => {
  for (const name of ['android-preview', 'ios-simulator']) {
    const parts = steps(job(verify, name));
    const evidence = parts.find(s => s.startsWith('name: Keep native failure diagnostics'));
    assert.match(evidence ?? '', /if: always\(\)/, name);
    assert.match(evidence, /path: dist\/build-evidence\//);
    const binary = parts.find(s => s.includes('INTERNAL-ONLY'));
    assert.ok(binary && !binary.includes('if: always()'), name);
  }
});

test('lock handoff publishes only the lock and returns a verified child commit', t => {
  const f = fixture(t); f.writeLock();
  const result = publish(f);
  assert.equal(result.created, true);
  assert.notEqual(result.sourceSha, f.base);
  assert.equal(git(f.checkout, 'diff-tree', '--no-commit-id', '--name-only', '-r', result.sourceSha), 'package-lock.json');
  assert.equal(git(f.checkout, 'rev-parse', `${result.sourceSha}^`), f.base);
  assert.match(git(f.checkout, 'ls-remote', 'origin', 'refs/heads/feature/playable-miniature-worlds'), new RegExp(`^${result.sourceSha}`));
  const proof = inspect(f, result.sourceSha, f.base);
  assert.equal(proof.sourceSha, result.sourceSha);
  assert.equal(proof.bootstrapBaseSha, f.base);
  assert.equal(proof.nativeBuildVerified, false);
});

test('bootstrap rejects tracked changes outside the lock before committing', t => {
  const f = fixture(t); f.writeLock();
  writeFileSync(join(f.checkout, 'App.js'), 'export default 2;\n');
  assert.throws(() => publish(f), /outside_lockfile/);
  assert.equal(git(f.checkout, 'rev-parse', 'HEAD'), f.base);
});

test('bootstrap rejects staged unrelated changes without changing the index', t => {
  const f = fixture(t); f.writeLock();
  writeFileSync(join(f.checkout, 'extra.txt'), 'no'); git(f.checkout, 'add', 'extra.txt');
  assert.throws(() => publish(f), /dirty_index/);
  assert.equal(git(f.checkout, 'diff', '--cached', '--name-only'), 'extra.txt');
});

test('bootstrap rejects an unexpected source commit', t => {
  const f = fixture(t); f.writeLock(); f.base = '0'.repeat(40);
  assert.throws(() => publish(f), /source_sha_mismatch/);
});

test('bootstrap never replaces an already committed lock', t => {
  const f = fixture(t); f.writeLock(); git(f.checkout, 'add', 'package-lock.json');
  git(f.checkout, 'commit', '-m', 'fixture existing lock'); f.base = git(f.checkout, 'rev-parse', 'HEAD');
  assert.throws(() => publish(f), /base_already_has_lock/);
});

test('bootstrap rejects invalid lock metadata', t => {
  const f = fixture(t); writeFileSync(join(f.checkout, 'package-lock.json'), '{}');
  assert.throws(() => publish(f), /unsupported_lockfile/);
  assert.equal(git(f.checkout, 'rev-parse', 'HEAD'), f.base);
});

test('bootstrap refuses other branch names before making a commit', t => {
  const f = fixture(t); f.writeLock();
  assert.equal(typeof tools.commitBootstrapLock, 'function');
  assert.throws(() => tools.commitBootstrapLock(f.checkout, { expectedSha: f.base, branch: 'main' }), /unapproved_branch/);
  assert.equal(git(f.checkout, 'rev-parse', 'HEAD'), f.base);
});

test('a concurrent remote commit is not overwritten by the lock bootstrap', t => {
  const f = fixture(t); f.writeLock();
  const other = join(f.root, 'other');
  git(f.root, 'clone', '--branch', 'feature/playable-miniature-worlds', f.remote, other);
  git(other, 'config', 'user.name', 'Other fixture'); git(other, 'config', 'user.email', 'other@localhost');
  writeFileSync(join(other, 'App.js'), 'export default 3;\n');
  git(other, 'add', '.'); git(other, 'commit', '-m', 'concurrent owner change');
  git(other, 'push', 'origin', 'HEAD:refs/heads/feature/playable-miniature-worlds');
  const changed = git(other, 'rev-parse', 'HEAD');
  assert.throws(() => publish(f), /non-fast-forward|rejected|fetch first/i);
  assert.match(git(f.checkout, 'ls-remote', 'origin', 'refs/heads/feature/playable-miniature-worlds'), new RegExp(`^${changed}`));
});

test('source guard rejects mutable names instead of full commit hashes', t => {
  const f = fixture(t);
  assert.throws(() => inspect(f, 'main'), /invalid_source_sha/);
});

test('source guard rejects a child commit that changes source code as well as the lock', t => {
  const f = fixture(t); f.writeLock(); writeFileSync(join(f.checkout, 'App.js'), 'export default 4;\n');
  git(f.checkout, 'add', '.'); git(f.checkout, 'commit', '-m', 'not a lock-only child');
  assert.throws(() => inspect(f, git(f.checkout, 'rev-parse', 'HEAD'), f.base), /not_lock_only/);
});

test('source guard accepts a regular checkout without inventing a lock or build result', t => {
  const f = fixture(t);
  const result = inspect(f, f.base);
  assert.equal(result.sourceSha, f.base);
  assert.equal(result.lockSha256, null);
  assert.equal(result.nativeBuildVerified, false);
  assert.equal(existsSync(join(f.checkout, 'package-lock.json')), false);
});

test('portable artifact discovery handles spaces and fails on zero or multiple outputs', t => {
  const root = mkdtempSync(join(tmpdir(), 'wondercaps-artifact-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const cli = join(project, 'tools/find-one-artifact.mjs');
  const run = (...args) => execFileSync(process.execPath, [cli, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  assert.ok(existsSync(cli), 'portable artifact selector is missing');
  assert.throws(() => run(root, '.app', 'directory'), /exactly_one_artifact/);
  mkdirSync(join(root, 'Wonder Caps.app'));
  assert.equal(run(root, '.app', 'directory'), resolve(root, 'Wonder Caps.app'));
  mkdirSync(join(root, 'Second.app'));
  assert.throws(() => run(root, '.app', 'directory'), /exactly_one_artifact/);
  writeFileSync(join(root, 'WonderCaps.apk'), 'fixture, not an APK');
  assert.equal(run(root, '.apk', 'file'), resolve(root, 'WonderCaps.apk'));
});

test('a downloaded or edited lock must still match the committed bytes', t => {
  const f = fixture(t); f.writeLock(); const result = publish(f);
  writeFileSync(join(f.checkout, 'package-lock.json'), '{}');
  assert.throws(() => inspect(f, result.sourceSha, f.base), /lock_differs_from_commit/);
});

test('source guard refuses an uncommitted lock on an ordinary checkout', t => {
  const f = fixture(t); f.writeLock();
  assert.throws(() => inspect(f, f.base), /uncommitted_lockfile/);
});

test('each downstream platform rechecks the downloaded lock before installing dependencies', () => {
  for (const name of ['native-bundles', 'android-preview', 'ios-simulator']) {
    const parts = steps(job(verify, name));
    const download = parts.findIndex(s => s.startsWith('uses: actions/download-artifact@'));
    assert.ok(parts[download + 1].includes('run: node tools/ci-source.mjs verify'), name);
    assert.ok(parts[download + 2].startsWith('run: npm run native:install'), name);
  }
});
