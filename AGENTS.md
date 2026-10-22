# Wunderkapseln development constraints

Build native iOS and Android together. Do not replace App.js with a WebView. Keep the shared rules independent of React, browser globals and payment SDKs. Native and preview clients must use the same core and SVG artwork.

Preserve five lives, 1500-second regeneration and active-play-only time. Resume unfinished attempts; never reset or charge on app reopening. Progress unlocks sequentially and replay rewards are idempotent. Do not simulate successful purchases. Keep paid checkout and ads unavailable until genuine verification exists.

Write and run failing behavioral tests before changes; `npm test` needs Node 22, Git and Python 3, but no installed npm dependencies. Run campaign validation and native bundle/build jobs before claiming native compatibility. Browser screenshots are QA evidence, not native/store screenshots. Keep both locale dictionaries synchronized. Never commit signing material or credentials. App icon and splash must reference one canonical icon, not independently generated designs.

The 480 recipes require human balancing and richer world-specific assets before public launch. Do not describe them as 480 handcrafted or fully playtested levels. Do not claim a CI run passed without fetching its result. Work on feature branches; do not publish to stores without explicit owner approval.

## Alpha 0.4 audio and preparation

Read docs/CODEX_HANDOFF.md and docs/RELEASE_GATES.md before further work. Audio cues are cosmetic and must not alter RNG or rewards. Keep the 14 native static WAV imports synchronized with ui/sounds.mjs. Bounded polyphony, stale async guards and cancellation of delayed fanfares are mandatory. Run node tools/audio-assets.mjs before tests in a clean source checkout. Store metadata JSON and Markdown must stay synchronized; run npm run check:docs. Draft product IDs and prices are not registered store products.

## Alpha 0.4.1 build gates

Use `npm run check:build -- --source-only` for source metadata, not native completion. `npm run native:install` requires a real, consistent package-lock v3 and uses npm ci. Only an explicit `--bootstrap` permits first resolution; a malformed existing lock must never be replaced silently. The workflow passes one lock artifact to all native jobs. `tools/audit-native.py` is read-only; Android input must be the packaged/merged manifest, not app.json. Unresolved iOS identifiers are accepted only with the explicit config-only flag and remain unverified. Node native-audit tests require Python 3. The original 0.4.1 workflow had no macOS job. Alpha 0.5.0 supersedes that part with a signing-free Simulator job; no store-upload action is configured. Do not retry or bypass a platform-blocked write.

## Apple identity approved by owner

iOS is WonderCaps: `com.kamilunavo.wondercaps`, display/bundle name `WonderCaps`, App Store SKU `wondercaps-001`. Android remains `com.kamilunavo.wunderkapseln`; repository, Expo slug, save key and artwork stay unchanged. Read docs/APPLE_SETUP.md. Never require equal iOS/Android identifiers again. Never use the App Store SKU as a bundle ID, numeric Apple app ID, signing team or purchase product ID. The owner reported an existing Apple record and full access; this session has not independently verified the Apple account. Keep Apple listing drafts in docs/APPLE_STORE_COPY_DE.md and docs/APPLE_STORE_COPY_EN.md, synchronized with docs/store-metadata.json -> apple.

## Alpha 0.4.2 native runtime

Read docs/NATIVE_RUNTIME.md. Android AppState blur/focus and change are independent gates; do not auto-resume on foreground return. Android game dialogs must not create a separate focus-losing window. Hide the obscured screen from accessibility while an overlay is open; real TalkBack/VoiceOver navigation remains a device gate. Tick boundaries must exclude animations and time before pack activation. Serialize seekTo on the same hook-owned audio player; retain cancellation guards and parallelism across different players. Do not release hook-owned players from the adapter.

Run `node --test tests/active-time-boundaries.test.mjs tests/native-runtime.test.mjs tests/native-player-adapter.test.mjs tests/native-modal.test.mjs` plus the full test suite. These are injected boundary tests, not native execution. Preserve the original 14 sound files and canonical artwork. Record actual build blockers; do not substitute another metadata-only test pass for a device build.

## Alpha 0.5.0 native CI

The approved feature branch is `feature/playable-miniature-worlds`. `.github/workflows/bootstrap-lock.yml` may resolve dependencies only when `package-lock.json` is absent and may commit only that lockfile. The normal verify workflow must never bootstrap. Android internal APK and iOS Simulator jobs are branch-only CI evidence, not store releases. iOS uses `macos-26`, requires Xcode 26.2+ and disables signing. Never add store upload, signing secrets or production credentials to these workflows. Keep `!assets/icon.png` in `.gitignore` so the canonical launcher/splash asset cannot disappear from an import.

## Lock handoff correction (same app version 0.5.0)

Read docs/CI_HANDOFF_FIX.md. Never rely on a GITHUB_TOKEN push to trigger a new verify run. The bootstrap explicitly calls verify.yml via workflow_call with a verified lock-only child commit. Every checkout and downloaded lock must match that source_sha. Native verification is contents: read and has no inherited secrets. Concurrent branch changes must reject the ordinary push; never force/rebase/retry around that guard. Use portable exact-one artifact discovery and preserve failure logs without publishing unchecked binaries. Local bare repositories in the test suite are fixtures, not GitHub writes.
