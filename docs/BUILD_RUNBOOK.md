# Build- und Start-Anleitung - 0.5.0

**Buildfix vom 15.09.2026 (App-Version weiterhin 0.5.0):** Die automatische Lock-Uebergabe wurde korrigiert. Der Bootstrap ruft die Native-Pruefung direkt mit dem exakten Lock-Commit auf; auf einen weiteren GITHUB_TOKEN-Push wird nicht gewartet. Siehe [CI-Handoff-Korrektur](CI_HANDOFF_FIX.md). Ein nativer Build oder GitHub-Import ist damit noch nicht erfolgt.


## Identitaet und Toolchain

Apple: **WonderCaps**, Bundle-ID `com.kamilunavo.wondercaps`, SKU `wondercaps-001`. Android: `com.kamilunavo.wunderkapseln`. Version `0.5.0`, iOS Build `7`, Android VersionCode `7`. Node 22 und npm 10 sind die lokale JavaScript-Basis. Expo SDK 55 verlangt laut offizieller Referenz Xcode 26.2+ fuer iOS; der CI-Simulatorjob verwendet deshalb `macos-26` und prueft die Xcode-Version vor dem Build.

## Offline-Pruefung

```sh
node tools/audio-assets.mjs
npm test
npm run check:build -- --source-only
npm run validate:levels
npm run preview:bundle
npm run audio:preview
npm run check:docs
```

`check:build -- --source-only` prueft Identitaet, Version, kanonische Icon-/Splash-Pfade sowie Audio-/Berechtigungseinstellungen. Ohne echten Lock bleibt `lockMetadataValid` false und `nativeBuildVerified` false.

## Lokaler Registry-Blocker

Am 15.09.2026 wurde der Standardweg erneut getestet: Node 22.16.0 und npm 10.9.2 laufen, `registry.npmjs.org` kann in dieser Umgebung aber nicht per DNS aufgeloest werden (`EAI_AGAIN`). Kein Fake-Lockfile und keine alternative Registry als Umgehung verwenden.

## Einmaliger GitHub-Lock-Bootstrap

Nach dem autorisierten Quellimport auf `feature/playable-miniature-worlds` reagiert `.github/workflows/bootstrap-lock.yml` auf den Push. Fehlt `package-lock.json`, fuehrt der Job aus:

```sh
npm run native:install -- --bootstrap
npm run check:build
npx --no-install expo install --check
```

Der Workflow verweigert Aenderungen an `package.json` oder `app.json`, staged ausschliesslich `package-lock.json` und committed nur dann, wenn ein neuer Lock entstanden ist. Der Folge-Push enthaelt bereits den Lock; der Bootstrap wird dann zum No-op.

## Reproduzierbare Verifikation

Der normale `.github/workflows/verify.yml` besitzt nur `contents: read` und bootstrapped nie. `native-resolution` verlangt `package-lock.json`, fuehrt `npm run native:install` (`npm ci`) aus und stellt den exakten Lock als Artefakt fuer beide Plattformen bereit.

`native-bundles` erzeugt danach Android- und iOS-JavaScript-Exports und prueft die generierte iOS-Konfiguration. Diese Exports sind noch keine installierbaren Apps.

## Internes Android-APK

Auf Pushes nach `feature/playable-miniature-worlds` laeuft zusaetzlich der Android-Job. Er verwendet Java 17, Android API 36 und Build Tools 36.0.0, fuehrt Expo Prebuild aus und erstellt `assembleRelease`. Das resultierende APK muss sein echtes Paketmanifest durch `tools/audit-native.py` bestehen. `apksigner` muss die erwartete Development-Signatur bestaetigen. Das Artefakt heisst `Wunderkapseln-INTERNAL-ONLY-APK` und darf nicht zu Google Play hochgeladen werden.

## iOS-Simulatorbuild

Der iOS-Job laeuft fuer denselben Feature-Branch auf `macos-26`. Er verlangt Xcode 26.2+, installiert den committed Lock, generiert iOS, fuehrt `pod install` aus und baut:

```sh
xcodebuild \
  -workspace <generierte-workspace> \
  -scheme <generiertes-scheme> \
  -configuration Release \
  -sdk iphonesimulator \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  build
```

Die gebaute `.app` muss `com.kamilunavo.wondercaps` in der Info.plist tragen und den nativen Audit bestehen. Danach wird sie als `WonderCaps-INTERNAL-ONLY-iOS-Simulator` hochgeladen. Das ist keine IPA, kein TestFlight-Archiv und kein physischer Geraetetest.

## Spaetere Produktionsbuilds

Erst nach erfolgreichem G1/G2: Android AAB mit dem echten Play-Uploadschluessel und iOS Archive/IPA mit verifiziertem Apple-Team/Provisioning. Schluessel, Zertifikate und Profile duerfen nicht im Repository liegen. Store-Uploads bleiben separate, ausdruecklich freizugebende Schritte.
