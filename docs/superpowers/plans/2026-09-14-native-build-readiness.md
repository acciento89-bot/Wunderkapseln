# Native Build Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make native build preparation fail clearly, share an actual lockfile across jobs and reject unwanted native capabilities without altering game content.

**Architecture:** Pure Node policy functions validate package/config metadata. A thin CLI executes an explicit npm plan and saves evidence. Python's standard XML/plist parsers inspect generated native capabilities; GitHub Actions passes the same lock artifact to exports and an optional internal APK job.

**Tech Stack:** Node 22, Expo SDK 55 (unchanged), npm 10, Python 3 standard library, GitHub Actions Ubuntu.

**Spec:** docs/superpowers/specs/2026-09-14-native-build-readiness.md

## Global Constraints

- Preserve five lives, 1500-second regeneration and active-play-only time.
- Build native iOS and Android together. Do not replace App.js with a WebView.
- App icon and splash must reference one canonical icon, not independently generated designs.
- No fabricated lockfile, native build result, payment result or remote commit.
- No GitHub write retry, store submission, signing-key change or macOS runner in this task.

## Task 1: Lock and identity policy with an explicit installer

Files: `tools/build-policy.mjs`, `tools/native-install.mjs`, `tools/check-build.mjs`, `tests/build-readiness.test.mjs`, `tests/build-cli.test.mjs`.
Interfaces: `checkLockfile(pkg, lock) -> string[]`, `checkAppIdentity(pkg, expo) -> string[]`, `installationPlan(pkg, lock, {allowBootstrap}) -> {mode,command,args}`.

- [x] Run the existing red tests and retain their assertion failures.

```sh
node --test tests/build-readiness.test.mjs
```

- [x] Add behavior tests for malformed data, package integrity, bootstrap-only first install and CLI dry runs. Core assertions:

```js
assert.deepEqual(checkLockfile(pkg, null), ['missing_lockfile']);
assert.throws(() => installationPlan(pkg, null), /missing_lockfile/);
assert.equal(installationPlan(pkg, validLock).args[0], 'ci');
assert.equal(installationPlan(pkg, null, { allowBootstrap: true }).args[0], 'install');
```

- [x] Implement the validation and thin process wrapper. Parse only existing JSON, reject unexpected flags and report nonzero npm exits. `--dry-run` must never run npm or create a lock. Build-readiness output is JSON with explicit missing stages.
- [x] Run all policy and subprocess tests.

```sh
node --test tests/build-readiness.test.mjs tests/build-cli.test.mjs
```

## Task 2: Inspect generated native capabilities

Files: `tools/audit-native.py`, `tests/native-audit.test.mjs`, native manifest/plist fixture helpers in that test file.
Interface: `python tools/audit-native.py --android PATH` or `--ios PATH`, returning JSON and exit 0 only for a compatible final manifest/plist.

- [x] Add fixtures proving that microphone, injected permissions, background modes, wrong identity and missing files fail; permitted Internet/Vibration and a minimal foreground plist pass.
- [x] Run to see the missing implementation fail.

```sh
node --test tests/native-audit.test.mjs
```

- [x] Implement with ElementTree/plistlib, no regex-only XML parser. Reject unresolved Android merge directives, unresolved package placeholders and invalid input rather than silently skipping them.
- [x] Run the fixture suite and retain JSON with `evidenceKind: fixture` in the test report.

## Task 3: Shared dependency resolution in the workflow

Files: `.github/workflows/verify.yml`, `package.json`, `app.json`, `tests/workflow-readiness.test.mjs`.

- [x] Check the workflow contract before modification: one explicit bootstrap input, no automatic bootstrap, `native-resolution` as upstream job, same lock artifact in both native jobs, manual-only internal APK, final merged-manifest and signature checks, no store or macOS job.
- [x] Run workflow tests red, then implement named jobs `rules-and-preview`, `native-resolution`, `native-bundles`, `android-preview` with read-only contents permission. Keep checked package versions unchanged.
- [x] Run tests green. Update runbook with exact commands and required prerequisites. Do not label this as executed CI.

## Task 4: Validate and package

- [x] Run all tests and generate outputs without changing gameplay or audio content.

```sh
npm test
npm run validate:levels
npm run preview:bundle
npm run audio:preview
npm run check:source
npm run check:art
npm run check:docs
```

- [x] Attempt only the authorized standard registry route; record DNS failure or real install evidence exactly. Validate unchanged source/art/sound hashes against 0.4.0.
- [x] Update `docs/CODEX_HANDOFF.md`, `docs/RELEASE_GATES.md`, `docs/BUILD_RUNBOOK.md`, `docs/PRUEFBERICHT-0.4.1.md`; regenerate archive hashes and rerun tests from a clean extraction.
- [x] Retain local work and a new source archive. No remote commit or merge because the earlier write was blocked.

## Ergaenzung aus Nutzerangabe: Apple WonderCaps

- [x] Bestehenden 0.4.1-Arbeitsstand wiederaufgenommen und 157 Basistests erneut ausgefuehrt.
- [x] Vor den Aenderungen 14 Identitaetstests geschrieben; 12 erwartete Fehler im Rotlauf beobachtet.
- [x] iOS auf WonderCaps / `com.kamilunavo.wondercaps` gestellt; Android-ID nicht veraendert.
- [x] SKU `wondercaps-001` ausschliesslich in Apple-Store-Metadaten gefuehrt.
- [x] Native Identitaetspruefer auf getrennte Plattformzuordnung umgestellt, Apple-Anzeigenamen geprueft.
- [x] Bestehende Testfixtures an die geaenderte Anforderung angepasst, ohne Berechtigungspruefungen zu entfernen.
- [x] 44 gezielte Identitaets-/Build-/Manifest-Tests bestanden.
- [x] Apple-DE-/EN-Texte und Setup-/Uebergabeunterlagen synchronisiert.
- [x] Abschliessender Gesamtlauf, Archiv-Neutest und Pruefsummenvergleich.

Keine neue Netzwerkprobe und kein erneuter GitHub-Schreibversuch in dieser Identitaetskorrektur. Keine Apple-Kontomutation. Der bereits dokumentierte Registry-Fehler bleibt ein unerledigter externer Build-Schritt, kein weiterer fehlgeschlagener Versuch.
