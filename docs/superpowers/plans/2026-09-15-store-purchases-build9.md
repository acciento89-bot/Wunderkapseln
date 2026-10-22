# WonderCaps Store Purchases Build 9 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate three verified consumable products on iOS and Android, upload iOS Build 9 through the GitHub Bridge, publish Android to internal testing, and leave production unsubmitted.

**Architecture:** `react-native-iap` supplies the StoreKit 2 and Google Play Billing client boundary. Native purchased callbacks are checked against exact app/product identities, mapped to a non-secret allocation ID, and journaled atomically in the local versioned save before the client finishes the consumable. GitHub branch `feature/store-purchases-build9` is authoritative; `acciento89-bot/onemorefloor` is the protected Apple bridge.

**Tech Stack:** Expo 55, React Native 0.83, React 19, react-native-iap, react-native-nitro-modules, Node test runner, GitHub Actions, Xcode/App Store Connect, Gradle/Google Play Billing.

**Spec:** `docs/superpowers/specs/2026-09-15-store-purchases-design.md`

## Global Constraints

- iOS identity is `WonderCaps` / `com.kamilunavo.wondercaps`; Android stays `com.kamilunavo.wunderkapseln`.
- Products are exactly `wk_lives_5`, `wk_time_60`, and `wk_time_240`, all consumable.
- Store-returned localized prices are the only prices displayed.
- `wk_lives_5` adds five reserve lives; time products remain inactive inventory until manual activation.
- Cancellation, pending/deferred, network failure, invalid evidence, and duplicate callbacks cannot grant inventory.
- Never commit signing material, store secrets, service-role keys, upload keys, or credentials.
- Apple may reach TestFlight Build 9 but never review submission or release.
- Android may publish to internal testing; production remains an unsubmitted draft with no rollout.

---

### Task 1: Lock dependency and release configuration

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `app.json`
- Modify: `tools/build-policy.mjs`
- Modify: `tests/build-config.test.mjs`
- Modify: `tests/apple-identity.test.mjs`

**Interfaces:**
- Produces: pinned native purchase dependencies, Expo native configuration, iOS build `9`, and audited Android version metadata.

- [ ] Add failing assertions that the exact approved dependencies and IAP plugin exist, iOS build is `9`, identities are unchanged, and no secret values are embedded.
- [ ] Run `node --test tests/build-config.test.mjs tests/apple-identity.test.mjs` and confirm the new assertions fail for missing purchase dependencies/build number.
- [ ] Pin compatible releases of `react-native-iap`, `react-native-nitro-modules`, and required Expo build configuration; resolve the lock only through the reviewed install path.
- [ ] Set `expo.ios.buildNumber` to `9`. Preserve Android version code until the Play Console inspection in Task 7 selects reuse or the next free code.
- [ ] Run the focused tests and `npm run check:build -- --source-only`; require zero failures.
- [ ] Commit through the GitHub Bridge with `build: prepare verified store dependencies`.

### Task 2: Implement pure purchase state machine

**Files:**
- Create: `payments/catalog.mjs`
- Create: `payments/purchase-machine.mjs`
- Create: `tests/purchase-machine.test.mjs`

**Interfaces:**
- Produces: `PRODUCTS`, `normalizeProducts(products)`, `createPurchaseMachine(dependencies)`, `begin(productId)`, `receive(purchase)`, `fail(error)`, and `retryUnfinished()`.
- Consumes: injected `verify`, `applyAllocation`, `finishTransaction`, and `persist` functions so tests do not load native SDKs.

- [ ] Write separate failing behavioral tests for dynamic price normalization, cancellation, pending/deferred, network failure, invalid verification, successful allocation-before-finish, duplicate callback, restart redelivery, persistence failure, and capacity deferral.
- [ ] Run `node --test tests/purchase-machine.test.mjs`; every new behavior must fail for the intended missing implementation.
- [ ] Implement the minimal state machine with no React, browser globals, Supabase client, or native SDK imports.
- [ ] Run the focused test until all state transitions pass, then run `npm test`.
- [ ] Commit through the GitHub Bridge with `feat: add idempotent purchase state machine`.

### Task 3: Make paid allocation idempotent in local saves

**Files:**
- Modify: `core/profile.mjs`
- Modify: `core/storage.mjs`
- Modify: `core/controller.mjs`
- Create: `tests/purchase-allocation.test.mjs`

**Interfaces:**
- Produces: `applyPaidAllocation(profile, allocation)` where allocation contains `id`, `productId`, and `quantity`; persisted `appliedPurchaseIds` bounded to reviewed safe limits.
- Consumes: the product mapping from `payments/catalog.mjs`.

- [ ] Write failing tests proving one allocation applies once, lives go directly to reserve, time products enter inactive inventory, duplicate IDs are no-ops, invalid products are rejected, capacity is deferred, and old saves migrate safely.
- [ ] Run `node --test tests/purchase-allocation.test.mjs` and confirm RED.
- [ ] Implement immutable allocation and versioned-save migration without changing normal gameplay paths.
- [ ] Run focused tests plus `tests/reserve-lives.test.mjs`, `tests/profile.test.mjs`, and `tests/storage-safety.test.mjs`.
- [ ] Commit through the GitHub Bridge with `feat: persist verified paid allocations exactly once`.

### Task 4: Validate native store callbacks locally

**Files:**
- Create: `payments/native-store.mjs`
- Create: `tests/native-store.test.mjs`

**Interfaces:**
- Produces: `verifyStorePurchase(purchase)` returning `{status, allocation}` with a stable non-secret allocation ID.
- Consumes: native StoreKit/Google Play Billing callback fields and exact app/product identifiers.

- [ ] Write failing tests for app/package mismatch, unknown products, pending/revoked/malformed callbacks, stable allocation IDs, and raw-token non-persistence.
- [ ] Implement the minimal callback validator and error normalizer.
- [ ] Run focused tests and the complete Node suite.
- [ ] Commit through the GitHub Bridge with `feat: validate native store purchases`.

### Task 5: Integrate native stores and treasure UI

**Files:**
- Create: `payments/native-store.mjs`
- Create: `payments/usePurchases.js`
- Modify: `App.js`
- Modify: `ui/strings.mjs`
- Create: `tests/purchase-ui.test.mjs`
- Modify: `tests/ui.test.mjs`
- Modify: `tests/native-required-modules.test.mjs`

**Interfaces:**
- Produces: `usePurchases(controller)` with `{products, status, buy, retry}` and store-native checkout for exact product IDs.
- Consumes: pure purchase machine, native callback validator, controller allocation method, and `react-native-iap` callbacks.

- [ ] Write failing source/behavior tests for all three dynamic prices, disabled loading/unavailable states, localized cancel/pending/network/capacity notices, accessibility labels, exact account binding, and no direct grant from callbacks.
- [ ] Run focused tests and confirm RED for missing hook/UI.
- [ ] Implement product fetch, platform purchase request, native validation, durable allocation, restart replay, and finish-after-delivery.
- [ ] Replace only the three unavailable shop rows; preserve existing treasure layout, art, sound, navigation, and activation controls.
- [ ] Synchronize DE/EN keys and run focused tests, `npm test`, and `npm run check:docs`.
- [ ] Commit through the GitHub Bridge with `feat: connect WonderCaps shop to native stores`.

### Task 6: Build and verify the exact release commit

**Files:**
- Modify: `.github/workflows/verify.yml`
- Modify: `tools/audit-native.py`
- Modify: `tests/release-ci.test.mjs`
- Modify: `docs/CODEX_HANDOFF.md`
- Modify: `docs/RELEASE_GATES.md`
- Create: `docs/BUILD9_RELEASE_STATE.md`

**Interfaces:**
- Produces: exact commit SHA with green source tests, iOS/Android exports, Android release AAB, native identity/capability audits, and retained failure evidence.

- [ ] Write failing workflow tests for AAB generation, purchase-module presence, exact metadata inspection, secret absence, and retained diagnostics.
- [ ] Update CI without adding store credentials or automatic store submission to the WonderCaps repository.
- [ ] Run `npm test`, `npm run validate:levels`, `npm run audit:campaign`, `npm run check:docs`, `npm run check:build -- --source-only`, `npm run export:ios`, and `npm run export:android`.
- [ ] Push the exact reviewed commit, wait for GitHub checks, inspect run conclusions and artifacts rather than assuming success, and record hashes.
- [ ] Commit through the GitHub Bridge with `ci: validate WonderCaps Build 9 artifacts`.

### Task 7: Inspect and prepare Google Play safely

**Files:**
- Modify after console inspection: `app.json`
- Modify after console inspection: `docs/BUILD9_RELEASE_STATE.md`
- Create in Bridge repository: `.github/workflows/wondercaps-play-internal.yml`

**Interfaces:**
- Produces: one signed AAB tied to the inspected package/version, published internal release, and production draft referencing the identical artifact.

- [ ] Read Play Console state for `com.kamilunavo.wunderkapseln`: highest version code, version name, artifact status, internal track, production track, and all three product records.
- [ ] If version code `8` is already uploaded and matches the exact source/signature, reuse it; otherwise set the next free version code and rebuild once.
- [ ] Create a Bridge workflow that consumes the protected Kamilunavo upload key without exposing it, builds/signs once, verifies certificate/package/version/hash, and fails closed.
- [ ] Upload the AAB only when no matching artifact exists; publish only to internal testing and confirm the release state.
- [ ] Select the same artifact for production only as an unsubmitted draft. Do not submit, roll out, or send production for review.
- [ ] Record exact console states and artifact SHA-256 in `docs/BUILD9_RELEASE_STATE.md`.

### Task 8: Upload iOS Build 9 through the GitHub Bridge

**Files:**
- Create in Bridge repository: `.github/workflows/wondercaps-build9-testflight.yml`
- Create in Bridge repository: `validation/wondercaps-build9-result.txt`
- Modify: `docs/BUILD9_RELEASE_STATE.md`

**Interfaces:**
- Produces: a manually dispatched, SHA-pinned Bridge run that archives/signs `com.kamilunavo.wondercaps` Build 9 and uploads it to App Store Connect/TestFlight.

- [ ] Base the workflow on the proven Bridge secret names `ASC_ISSUER_ID`, `ASC_KEY_ID`, and `ASC_PRIVATE_KEY_B64`; keep values protected and unprinted.
- [ ] Require inputs for the exact WonderCaps source SHA and expected build `9`; abort on any identity/version mismatch.
- [ ] Install pinned dependencies, run unit tests, prebuild iOS, archive with signing, inspect archive identity/capabilities, export, and upload.
- [ ] Capture each command's true exit status. A failed archive, export, or uploader must fail the job; never reproduce the prior false-green `altool` behavior.
- [ ] Dispatch only after all source checks are green, then inspect run, job, and upload logs through GitHub.
- [ ] Confirm Build 9 appears and finishes processing in App Store Connect/TestFlight. Do not submit for review, attach to an App Store version, or release.
- [ ] Commit only redacted validation evidence and update `docs/BUILD9_RELEASE_STATE.md` with run ID, source SHA, artifact hash, and explicit non-actions.

### Task 9: Final regression and state handoff

**Files:**
- Modify: `docs/CODEX_HANDOFF.md`
- Modify: `docs/RELEASE_GATES.md`
- Modify: `docs/BUILD9_RELEASE_STATE.md`

**Interfaces:**
- Produces: reproducible final evidence for code, TestFlight, Play internal, and untouched production/review gates.

- [ ] Re-run the complete test/build matrix against the final GitHub SHA.
- [ ] Recheck repository history and tracked files for credentials, keystores, certificates, tokens, and private keys.
- [ ] Verify the three dynamic product records in both stores and execute sandbox/license-tester cases for success, cancel, pending where supported, network interruption, duplicate callback, and restart redelivery.
- [ ] Confirm Apple has no review/release action and Google production has no submitted release or rollout.
- [ ] Update handoff documents with exact evidence, remaining manual/device gates, and no unsupported success claims.
- [ ] Commit through the GitHub Bridge with `docs: record Build 9 store release state`.
