# WonderCaps Store Purchases Design

## Goal

Ship the three existing consumable products through Apple In-App Purchase and Google Play Billing without changing gameplay, art, audio, or established life and active-time rules. GitHub is the authoritative source and CI handoff point. Apple Build 9 is archived, signed, and uploaded to TestFlight through the existing GitHub Bridge in `acciento89-bot/onemorefloor`, with no review submission. Android reaches internal testing, while production remains an unsubmitted draft.

## Fixed identities and release boundaries

- iOS app: `WonderCaps`, bundle ID `com.kamilunavo.wondercaps`, SKU `wondercaps-001`, app version `0.5.0`, next build `9`.
- Android package: `com.kamilunavo.wunderkapseln`, app version `0.5.0`. Reuse an already uploaded version code when possible; otherwise use the next free code.
- Products on both stores: `wk_lives_5`, `wk_time_60`, `wk_time_240`, all consumable.
- Apple: build and validate, then upload to TestFlight only when credentials and signing are available. Never submit for review or release.
- Android: publish only to internal testing. Prepare production using the same artifact only as an unsubmitted draft. Never start a production rollout or submit production for review.
- Never commit store credentials, API keys with secret privileges, upload keys, certificates, provisioning profiles, keystores, or passwords.
- Import the complete reviewed Build-8 source into `acciento89-bot/Wunderkapseln` and perform implementation on a feature branch. Do not treat a returned ZIP as the final development handoff.

## Selected architecture

The React Native client uses `react-native-iap` as the single native adapter over StoreKit 2 and Google Play Billing. The operating-system store remains the only checkout surface, payment processor, and source of localized prices and purchase state. No Supabase project, paid backend, visible account, or external checkout is introduced.

The app validates the native callback against the exact product and application identity, derives a stable non-secret allocation ID, persists that ID with the local save, and only then finishes the consumable. Unfinished transactions are requested again from the store after restart. This prevents callback duplication on the same installation; cross-device restoration of already-consumed consumables and server-grade fraud detection remain outside this release.

## Responsibilities

### Store adapter

- Connect to the native store when the treasure/shop screen is active.
- Fetch all three products as one-time in-app products.
- Display only store-returned localized title/price data. Never embed assumed prices.
- Start a native one-time-product purchase without introducing an app account.
- Normalize purchase callbacks into `purchased`, `pending`, `cancelled`, or `failed` without mutating gameplay state.
- Reject mismatched app/package IDs, unknown products, malformed quantities, pending states, and revoked Apple transactions.
- Finish/consume a transaction only after its entitlement is durably stored locally or was already stored.
- Reprocess unfinished transactions after restart through the same idempotent path.

### Native callback validation

- Accept only native StoreKit/Play Billing callbacks in purchased state for the three exact product IDs.
- Require `com.kamilunavo.wondercaps` on Apple and `com.kamilunavo.wunderkapseln` on Google when the callback exposes identity fields.
- Reject pending, revoked, mismatched, malformed, or unknown transactions.
- Never log or persist raw receipts, purchase tokens, signed transaction bodies, credentials, or authorization headers.

### Transaction journal and allocation

The versioned local save stores a bounded set of applied allocation IDs. Apple transaction IDs are namespaced directly; Google purchase tokens are converted to a stable local fingerprint so raw tokens are not persisted. A first valid callback increments exactly one inventory counter. Repeated callbacks return the existing result without incrementing again.

## Entitlement semantics

- `wk_lives_5`: after verified allocation, add five reserve lives. Natural lives remain unchanged and are still consumed first.
- `wk_time_60`: after verified allocation, add one `time60` pack to inventory.
- `wk_time_240`: after verified allocation, add one `time240` pack to inventory.
- Time packs do not alter `unlimitedSeconds` at purchase time. The existing manual activation converts them to 3,600 or 14,400 active seconds.
- Active seconds continue to decrease only during active gameplay, excluding menus, pause, background/inactive state, results, blocking animation, and interruptions.
- Capacity checks occur before allocation. A verified paid product must not disappear because local capacity is full; it remains durably pending for later delivery.

## Client delivery consistency

The native adapter produces an allocation record with a stable allocation ID. The client persists applied allocation IDs alongside the existing versioned save before acknowledging local delivery. Repeated callbacks compare IDs and cannot apply the same increment twice. If local persistence fails, the transaction remains unfinished and the same allocation is retried. Store completion happens only after durable local application.

## User interface and errors

The existing treasure screen keeps its layout and styling. Each of the three unavailable rows becomes a purchase row with the store-supplied display price and a disabled/loading state while products load or a purchase is in flight.

- Cancellation closes quietly with no credit.
- Pending/deferred shows a localized waiting notice and no credit.
- Network or verification failure shows a localized retry notice; the store transaction remains unfinished.
- Product unavailable shows a localized store-unavailable label rather than a fallback price.
- Duplicate delivery resolves as success without a second credit.
- Capacity blockage explains that the paid item is safe and will be delivered when capacity permits.

German and English dictionaries remain key-identical. Accessibility labels announce product name, dynamic price, progress state, and outcome.

## Security and privacy

- Product-to-reward mapping is a reviewed application constant shared by tests, never supplied by purchase callbacks.
- Raw purchase tokens and signed transaction bodies are not logged or persisted.
- Signing credentials and upload keys remain only in protected GitHub/store configuration and never enter the app repository.
- The accepted trade-off is installation-local replay protection rather than a paid verification backend.

## Testing and verification

Implementation follows red-green-refactor. Automated tests cover catalog mapping, dynamic-price rendering, cancel/pending/network states, server rejection, duplicate callbacks, restart redelivery, local-save failure, capacity deferral, and exactly-once allocation. Existing reserve-life and active-time tests remain unchanged and passing.

Required gates include the full Node suite, campaign validation, documentation checks, source/build audit, Android and iOS JavaScript exports, Android release AAB build, package/version/signature inspection, and GitHub status checks for the exact commit. The GitHub Bridge checks out that exact WonderCaps commit and performs the signed iOS archive and upload with its protected App Store Connect secrets.

Store acceptance requires real Apple Sandbox/TestFlight and Google license-tester cases for success, cancellation, pending, network interruption before and after verification, duplicate delivery, restart before finish, and all three products. Console metadata must match identifiers and consumable type. Evidence must record exact build/version, artifact hashes, track state, and actions deliberately not performed.

## Deployment order

1. Integrate the tested native adapter, local replay journal, and purchase UI.
2. Push the reviewed feature commit to GitHub and require all automated/native CI gates for that exact SHA.
3. Through the existing GitHub Bridge workflow, fetch the exact GitHub SHA, test Apple Sandbox/TestFlight, and create/upload iOS Build 9 without review submission. The workflow must propagate a failed archive, export, or uploader exit code instead of reporting a false-green run.
4. Create/inspect the Google Play package, version codes, products, and tracks before selecting an artifact.
5. Upload or reuse the validated signed AAB, publish it to internal testing, and confirm tester availability.
6. Prepare the identical artifact in production only as an unsubmitted draft, with no rollout or production review action.

## Out of scope

- Subscriptions, advertisements, external checkout, price experiments, gameplay balancing, art/audio redesign, and new boosters.
- Visible registration/login or cross-device account linking.
- App Store review submission, App Store release, Google production rollout, or Google production review submission.
