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

The React Native client uses `react-native-iap` as the single native adapter over StoreKit 2 and Google Play Billing. The operating-system store remains the only checkout surface and payment processor. A dedicated Supabase project in `eu-central-1` provides anonymous authentication, server-side receipt/token verification, an immutable transaction journal, and atomic entitlement allocation.

The app creates or resumes a Supabase anonymous session without showing a login screen. Its user UUID is passed to Apple as `appAccountToken` and to Google as a one-way, store-safe obfuscated account identifier. The publishable Supabase key may be present in client configuration; all Apple private keys, Google service-account credentials, and Supabase secret/service-role keys exist only as Edge Function secrets.

Anonymous identity prevents callback duplication and supports retries on the same installation. It does not promise recovery after the anonymous session is irretrievably lost or cross-device restoration. Such recovery requires a later, explicitly designed identity-linking feature and is outside this release.

## Responsibilities

### Store adapter

- Connect to the native store when the treasure/shop screen is active.
- Fetch all three products as one-time in-app products.
- Display only store-returned localized title/price data. Never embed assumed prices.
- Start a purchase with the authenticated player identifier.
- Normalize purchase callbacks into `purchased`, `pending`, `cancelled`, or `failed` without mutating gameplay state.
- Send only purchased transactions to the verification service.
- Finish/consume a transaction only after the server reports that its entitlement is durably allocated or was already allocated.
- Reprocess unfinished transactions after restart through the same idempotent path.

### Verification Edge Function

- Require a valid Supabase user JWT and derive the user ID from verified claims.
- Accept a strict platform-specific payload: Apple signed transaction/JWS or Google purchase token, product ID, app identity, and client environment hints.
- Verify Apple data against Apple's server APIs and `com.kamilunavo.wondercaps`.
- Verify Google data against the Google Play Developer API and `com.kamilunavo.wunderkapseln`.
- Require the exact product ID, purchased/success state, matching application, matching account binding where supplied, and the expected Sandbox/Test/Production environment.
- Reject pending, cancelled, refunded, revoked, mismatched, malformed, or unverifiable transactions.
- Never log raw receipts, purchase tokens, signed transaction bodies, credentials, or complete authorization headers.

### Transaction journal and allocation

`purchase_transactions` stores one row per store transaction/token fingerprint with platform, environment, product, authenticated user, store state, verification timestamps, and allocation state. A database uniqueness constraint on the canonical platform transaction identifier is the primary duplicate barrier.

An internal database function executes verification-result recording and entitlement allocation in one transaction. A first valid transaction increments exactly one inventory counter. A repeated request for the same transaction returns the existing result without incrementing again. Client roles have no direct insert/update/delete access to journal or entitlement tables; only the verified Edge Function service path can mutate them. Exposed user-readable rows use RLS with `(select auth.uid()) = user_id`.

## Entitlement semantics

- `wk_lives_5`: after verified allocation, add five reserve lives. Natural lives remain unchanged and are still consumed first.
- `wk_time_60`: after verified allocation, add one `time60` pack to inventory.
- `wk_time_240`: after verified allocation, add one `time240` pack to inventory.
- Time packs do not alter `unlimitedSeconds` at purchase time. The existing manual activation converts them to 3,600 or 14,400 active seconds.
- Active seconds continue to decrease only during active gameplay, excluding menus, pause, background/inactive state, results, blocking animation, and interruptions.
- Capacity checks occur before allocation. A verified paid product must not disappear because local capacity is full; it remains durably pending for later delivery.

## Client delivery consistency

The server returns an allocation record with a stable allocation ID and current paid-inventory totals. The client persists applied allocation IDs alongside the existing versioned save before acknowledging local delivery. Repeated syncs compare IDs and cannot apply the same increment twice. If local persistence fails, the transaction remains unfinished and the same allocation is retried. Store completion happens only after durable local application.

The server journal remains the authority for whether a store transaction has been allocated. Gameplay remains local and offline after delivery; Supabase is required only to buy, verify, redeliver an unfinished purchase, or synchronize paid inventory.

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

- Dedicated Supabase project, anonymous sign-ins enabled, RLS on every exposed table.
- Public clients receive only the project URL and publishable key.
- Edge Functions validate JWTs and never trust a client-supplied user ID, price, currency, product reward, or transaction status.
- Product-to-reward mapping is a server constant shared by tests, not request data.
- Apple/Google credentials live only in managed server secrets.
- Database functions with elevated privileges live outside exposed schemas, have a fixed `search_path`, revoke default `PUBLIC` execution, and explicitly authorize only the service path.
- Logs use redacted request IDs and status categories.

## Testing and verification

Implementation follows red-green-refactor. Automated tests cover catalog mapping, dynamic-price rendering, cancel/pending/network states, server rejection, duplicate callbacks, restart redelivery, local-save failure, capacity deferral, and exactly-once allocation. Existing reserve-life and active-time tests remain unchanged and passing.

Required gates include the full Node suite, campaign validation, documentation checks, source/build audit, Android and iOS JavaScript exports, Android release AAB build, package/version/signature inspection, and GitHub status checks for the exact commit. The GitHub Bridge checks out that exact WonderCaps commit and performs the signed iOS archive and upload with its protected App Store Connect secrets.

Store acceptance requires real Apple Sandbox/TestFlight and Google license-tester cases for success, cancellation, pending, network interruption before and after verification, duplicate delivery, restart before finish, and all three products. Console metadata must match identifiers and consumable type. Evidence must record exact build/version, artifact hashes, track state, and actions deliberately not performed.

## Deployment order

1. Create the dedicated Supabase project and apply reviewed schema/RLS/function migrations.
2. Configure server-only Apple and Google verification credentials.
3. Implement and deploy verification functions against sandbox/test environments.
4. Integrate the tested client adapter and purchase UI.
5. Push the reviewed feature commit to GitHub and require all automated/native CI gates for that exact SHA.
6. Through the existing GitHub Bridge workflow, fetch the exact GitHub SHA, test Apple Sandbox/TestFlight, and create/upload iOS Build 9 without review submission. The workflow must propagate a failed archive, export, or uploader exit code instead of reporting a false-green run.
7. Inspect Google Play package, version codes, products, and tracks before selecting an artifact.
8. Upload or reuse the validated signed AAB, publish it to internal testing, and confirm tester availability.
9. Prepare the identical artifact in production only as an unsubmitted draft, with no rollout or production review action.

## Out of scope

- Subscriptions, advertisements, external checkout, price experiments, gameplay balancing, art/audio redesign, and new boosters.
- Visible registration/login or cross-device account linking.
- App Store review submission, App Store release, Google production rollout, or Google production review submission.
