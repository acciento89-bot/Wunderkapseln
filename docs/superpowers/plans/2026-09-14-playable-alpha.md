# Wunderkapseln Playable Alpha Implementation Plan

> For agentic workers: use superpowers:executing-plans and perform each test-first unit in order.

**Goal:** Deliver a playable offline-first miniature-world match-3 alpha and tested shared engine to the supplied repository.
**Architecture:** Pure deterministic rules and immutable profile reducers, a native Expo/SVG client, and a browser QA client with identical rules/art. Real-money operations fail closed until verified store integration exists.
**Tech Stack:** Node 22 built-in tests, ECMAScript modules, Expo SDK 55, React Native 0.83, React 19.2, react-native-svg, AsyncStorage.
**Spec:** docs/superpowers/specs/2026-09-14-game.md

## Global constraints
480 definitions / 12 worlds; 5 lives; 1500-second regeneration. DE/EN. No forced advertising or subscriptions. No WebView. Every save mutation serialized. Payments unavailable, not simulated. Native builds are not claimed tested unless a successful native build is observed.

## Task 1: deterministic match engine and campaign
Files: core/levels.mjs, core/game.mjs, tests/game.test.mjs.
Interface: levelFor(id), createGame(level, attempt), swap(game, a, b), useWonder(game, target), legalMoves(game), findMatches(board, size), validateGame(game).
- [x] Write tests: `assert.equal(levelFor(480).world,11)`; for all levels `assert.equal(findMatches(g.board,g.size).length,0)` and `assert.ok(legalMoves(g).length)`; assert invalid swap preserves board and moves; test rockets/prisms/intersections and chained clears using fixed fixtures.
- [x] Run `node --test tests/game.test.mjs`; observe missing module/behavior failures.
- [x] Implement rules with explicit RNG state, capped cascade recovery and event frames for animation.
- [x] Repeat tests and simulate deterministic playthroughs, validate every board invariant.

## Task 2: profile, sessions and crash-safe saves
Files: core/profile.mjs, core/session.mjs, core/storage.mjs, tests/profile.test.mjs.
Interface: freshProfile(now, locale), regenerate(profile, now), finishLevel(profile, id, stars), loseLife(profile, now), spendActiveTime(profile, seconds, active), activatePack(profile, key), createSession(profile), encodeSave(session), decodeSave(text), createSaveQueue(adapter).
- [x] Test precise 1499/1500-second boundaries, cap, full-to-depleted transition, negative wall-clock jump, timer paused/background/inventory cases, sequential progress, replay reward idempotence, corrupted saves and serialized writes.
- [x] Run tests; observe missing behavior.
- [x] Implement validated reducers and recoverable storage. Persist active attempt; abandoning only after explicit confirmation.
- [x] Run entire test suite.

## Task 3: playable native interface and shared original art
Files: App.js, ui/art.mjs, ui/strings.mjs, app.json, index.js, assets/icon.svg, tools/assets.mjs, web/.
- [x] Add translation and SVG structural tests. Render each world's dome and each gem/special to SVG.
- [x] Implement native navigation, atlas, playfield gesture/tap interaction, accessible targets, Wonder Move, pause/results/next flow, inventory, settings and unavailable-shop notice.
- [x] Implement browser QA harness with exact same rules and art. Serve using `node tools/serve.mjs`.
- [x] Exercise start, valid and invalid swaps, pause, win, next, storage reload, German/English, reduced motion and phone/tablet sizes via Playwright. Retry/loss reducers covered by Node tests; native device playtesting remains open. Inspect real runtime screenshots, not promotional mockups.

## Task 4: build automation and delivery
Files: package.json, .github/workflows/verify.yml, README.md, docs/RELEASE_GATES.md.
- [x] Run `npm test`, campaign validation, JS syntax/transpile checks and browser interaction checks.
- [x] Add Linux-only automated test/Android preview build; never use real signing secrets or store upload. Separate native iOS build instructions for Xcode.
- [ ] Upload source and open PR: the platform blocked the GitHub create_tree write with an indeterminate safety-status message. No alternate write route attempted. The remote branch contains only the initialization commit; source is delivered as a ZIP instead.
- [x] Review files, scan for secrets, archive verified source and record remaining native build/release gates.
