# Companion rescue chapter — source feature, native acceptance pending

The native home screen offers twelve independent rescue puzzles. Clear the colored pieces below a companion to let it fall to a marked bottom-row exit. Companions cannot be swapped or matched, and special clears preserve them. Later recipes introduce column specials, bombs, prisms, frost and two companions. The included solution traces prove legal completions in the pure engine; they do not establish human balancing.

Rescue progress, best move counts and one unfinished rescue are stored separately in `wunderkapseln.rescue.v1`. An unfinished campaign remains held when entering this chapter. Rescue neither spends nor awards campaign hearts, reserves, purchased active time, stars, currency or restoration. Existing natural wall-clock regeneration still follows the original controller when focus is routed back; it is not a rescue reward.

A move or completion becomes visible only after the separate journal is written and read back. Failed writes hold the candidate and allow exact retry. Corrupt or incompatible journals block replacement; no destructive reset is offered. A bounded engine dead-board/cascade failure is held as a stopped attempt with explicit restart. Returning from background/focus loss requires Resume.

Both German and English copy and companion/exit accessibility labels are included. The new vector companion and exit marks use the existing SVG board and palette. Launcher/splash, fourteen original sound effects, original 480 recipes and all payment modules remain unchanged. The separate native background music addition is documented in [MUSIC-0.6.0.md](MUSIC-0.6.0.md).

Verified in the implementation task: Node pure/source suite and original 480 campaign opening validation, including exact before/after opening and first-move hashes. Not verified: dependency installation, Expo/Hermes/native compilation, actual native rendering, touch/accessibility, performance, device lifecycle, physical display transitions or delivery. Existing source-only build metadata checks explicitly report nativeBuildVerified false.

Google update provenance and current maximum version require a fresh release check before versioning. The shared Apple listing remains unpublished and must not be sent to review under the published-app instruction. No purchases, restorations or available-purchase reconciliation may be used as repeated QA. The existing payment hook can request available purchases when Treasures is active; root must use a guarded fixture before any native acceptance launch where needed.

## Android release preparation, 22 October 2026

Fresh Google console readback established public 0.5.0 (9) as the highest uploaded version. Android candidate is 0.6.0 (10); iOS counter remains unchanged at 9. Android native compilation is enabled on this rescue branch; iOS native compilation and store delivery are deferred. No current candidate has yet passed native acceptance or been submitted.
