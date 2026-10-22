# Native build readiness - approved continuation

The user's approved continuation preserves the game, miniature artwork and all 14 sounds. Complete the interrupted native build preparation. No new gameplay, billing, advertisements or store submission. Do not retry or route around the blocked GitHub write.

## Deliverables

1. A dependency-free, fail-closed check for app identity and npm package-lock v3. Reject missing/inconsistent locks, non-registry dependencies and absent integrity metadata. A metadata pass is not an npm installation or integrity verification.
2. An explicit first-resolution command. Missing locks may be created only with `--bootstrap`; subsequent installs use `npm ci`. Bad existing locks never trigger bootstrap. Never fabricate a real lockfile.
3. A read-only native capability auditor. Check generated iOS Info.plist and the final merged Android release manifest, not just app.json. Fail on microphone, camera, location, media, tracking, background audio or unapproved permissions. Internal APKs must remain non-debuggable and must use the canonical app identity.
4. A workflow with one resolution stage and one lock artifact used by every native job. Android/iOS JavaScript exports run on Ubuntu. Internal APK assembly is manual-only, has no store credentials and no upload. No macOS runner is introduced.
5. Updated developer handoff, build runbook and honest per-version evidence. Retain existing gameplay files byte-for-byte. Existing UI/browser results remain historical unless rerun.

## Validation

Run failing tests first, then all Node tests, preview/audio generators, 480 start-board checks, source/art/document checks and CLI failure-path integration tests. Android XML and iOS plist auditors are tested with explicit fixtures; they are not device/native build evidence. A fresh npm attempt may run against the standard registry only. DNS or security denial is a stop for that external operation.

## Owner-provided Apple identity amendment

iOS now uses WonderCaps / `com.kamilunavo.wondercaps`, App Store SKU `wondercaps-001`. Android remains `com.kamilunavo.wunderkapseln`. Identity gates validate each platform separately. Full details and verification limits are in `docs/APPLE_SETUP.md`.
