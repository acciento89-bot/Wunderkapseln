/** Git provenance and one-time lock publishing. No package downloads or store actions. */
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, lstatSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkLockfile } from './build-policy.mjs';

const APPROVED_BRANCH = 'feature/playable-miniature-worlds';
const SHA = /^[0-9a-f]{40}$/;
const git = (root, ...args) => execFileSync('git', ['-C', root, ...args], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000, maxBuffer: 4 * 1024 * 1024,
}).trim();
const gitStatus = (root, ...args) => spawnSync('git', ['-C', root, ...args], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000,
}).status;
const trackedLock = (root, sha) => gitStatus(root, 'cat-file', '-e', `${sha}:package-lock.json`) === 0;

export function verifyCiSource(root, { expectedSha, bootstrapBaseSha = '' } = {}) {
  if (!SHA.test(expectedSha ?? '')) throw new Error('invalid_source_sha');
  if (bootstrapBaseSha && !SHA.test(bootstrapBaseSha)) throw new Error('invalid_bootstrap_base_sha');
  const sourceSha = git(root, 'rev-parse', 'HEAD');
  if (sourceSha !== expectedSha) throw new Error('source_sha_mismatch');
  if (bootstrapBaseSha) {
    if (git(root, 'show', '-s', '--format=%P', sourceSha) !== bootstrapBaseSha) {
      throw new Error('bootstrap_parent_mismatch');
    }
    if (trackedLock(root, bootstrapBaseSha) ||
        git(root, 'diff-tree', '--no-commit-id', '--name-status', '-r', sourceSha) !== 'A\tpackage-lock.json') {
      throw new Error('bootstrap_commit_not_lock_only');
    }
  }
  const path = join(root, 'package-lock.json');
  let lockSha256 = null;
  if (trackedLock(root, sourceSha)) {
    if (!existsSync(path) || !lstatSync(path).isFile()) throw new Error('missing_regular_lockfile');
    const committed = execFileSync('git', ['-C', root, 'show', `${sourceSha}:package-lock.json`]);
    const local = readFileSync(path);
    if (!committed.equals(local)) throw new Error('lock_differs_from_commit');
    lockSha256 = createHash('sha256').update(local).digest('hex');
  } else if (existsSync(path)) {
    throw new Error('uncommitted_lockfile');
  }
  return { schema: 1, evidence: 'git-source-provenance', sourceSha,
    bootstrapBaseSha: bootstrapBaseSha || null, lockSha256, nativeBuildVerified: false };
}

export function commitBootstrapLock(root, { expectedSha, branch } = {}) {
  if (branch !== APPROVED_BRANCH) throw new Error('unapproved_branch');
  if (!SHA.test(expectedSha ?? '')) throw new Error('invalid_source_sha');
  if (git(root, 'rev-parse', 'HEAD') !== expectedSha) throw new Error('source_sha_mismatch');
  if (trackedLock(root, expectedSha)) throw new Error('base_already_has_lock');
  if (gitStatus(root, 'diff', '--cached', '--quiet') !== 0) throw new Error('dirty_index');
  const changed = git(root, 'diff', '--name-only', '-z').split('\0').filter(Boolean);
  const untracked = git(root, 'ls-files', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean);
  if ([...changed, ...untracked].some(path => path !== 'package-lock.json')) throw new Error('changes_outside_lockfile');
  const lockPath = join(root, 'package-lock.json');
  if (!existsSync(lockPath) || !lstatSync(lockPath).isFile()) throw new Error('missing_regular_lockfile');
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const errors = checkLockfile(pkg, JSON.parse(readFileSync(lockPath, 'utf8')));
  if (errors.length) throw new Error(errors.join(', '));
  git(root, 'add', '--', 'package-lock.json');
  git(root, '-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
    'commit', '-m', 'build: lock native dependencies');
  const sourceSha = git(root, 'rev-parse', 'HEAD');
  verifyCiSource(root, { expectedSha: sourceSha, bootstrapBaseSha: expectedSha });
  // A concurrent branch change must reject this ordinary fast-forward push. Never force or rebase it.
  git(root, 'push', 'origin', `${sourceSha}:refs/heads/${branch}`);
  return { created: true, sourceSha, bootstrapBaseSha: expectedSha, nativeBuildVerified: false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 3 || !['verify', 'commit-lock'].includes(process.argv[2])) throw new Error('usage: ci-source.mjs verify|commit-lock');
    const root = process.cwd();
    let report;
    if (process.argv[2] === 'commit-lock') {
      report = commitBootstrapLock(root, { expectedSha: process.env.EXPECTED_SOURCE_SHA, branch: process.env.GITHUB_REF_NAME });
      if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `source_sha=${report.sourceSha}\ncreated=true\n`);
    } else {
      report = verifyCiSource(root, { expectedSha: process.env.EXPECTED_SOURCE_SHA, bootstrapBaseSha: process.env.BOOTSTRAP_BASE_SHA || '' });
    }
    mkdirSync(join(root, 'dist/build-evidence'), { recursive: true });
    writeFileSync(join(root, 'dist/build-evidence/ci-source.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message, nativeBuildVerified: false }));
    process.exitCode = 1;
  }
}
