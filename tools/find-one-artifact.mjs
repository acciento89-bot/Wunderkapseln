/** Portable replacement for shell-specific array discovery. Rejects ambiguous output. */
import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function findOneArtifact(root, suffix, kind, depth = 1) {
  if (!suffix?.startsWith('.') || suffix.includes('/') || !['file', 'directory'].includes(kind) ||
      !Number.isInteger(depth) || depth < 1 || depth > 3) throw new Error('invalid_artifact_arguments');
  const found = [];
  function visit(directory, remaining) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      const path = join(directory, entry.name);
      if ((kind === 'file' ? entry.isFile() : entry.isDirectory()) && entry.name.endsWith(suffix)) found.push(path);
      if (remaining > 1 && entry.isDirectory()) visit(path, remaining - 1);
    }
  }
  visit(resolve(root), depth);
  if (found.length !== 1) throw new Error(`exactly_one_artifact_required: found ${found.length} ${suffix}`);
  if (/[\r\n]/.test(found[0])) throw new Error('unsupported_artifact_path');
  return found[0];
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length < 3 || args.length > 4) throw new Error('usage: find-one-artifact.mjs ROOT SUFFIX file|directory [DEPTH]');
    console.log(findOneArtifact(args[0], args[1], args[2], args[3] === undefined ? 1 : Number(args[3])));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
