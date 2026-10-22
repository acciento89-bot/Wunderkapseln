# Native CI - WonderCaps 0.5.0

**Buildfix vom 15.09.2026 (App-Version weiterhin 0.5.0):** Die automatische Lock-Uebergabe wurde korrigiert. Der Bootstrap ruft die Native-Pruefung direkt mit dem exakten Lock-Commit auf; auf einen weiteren GITHUB_TOKEN-Push wird nicht gewartet. Siehe [CI-Handoff-Korrektur](CI_HANDOFF_FIX.md). Ein nativer Build oder GitHub-Import ist damit noch nicht erfolgt.


## Ziel

Der 0.5.0-Pfad soll erstmals echte native Build-Evidenz erzeugen, ohne einen Store-Upload auszufuehren. Der lokale Container besitzt weiterhin keinen DNS-Zugriff auf `registry.npmjs.org`; deshalb wird die erste echte Dependency-Aufloesung ausschliesslich auf GitHub Actions ausgefuehrt, nachdem der Quellstand autorisiert im Feature-Branch liegt.

## Einmaliger Lock-Bootstrap

`.github/workflows/bootstrap-lock.yml` laeuft nur bei Pushes nach `feature/playable-miniature-worlds`. Fehlt `package-lock.json`, fuehrt der Job den bereits getesteten expliziten Bootstrap aus:

```sh
npm run native:install -- --bootstrap
npm run check:build
npx --no-install expo install --check
```

Vor dem Commit muss `package.json` und `app.json` unveraendert bleiben. Es wird ausschliesslich `package-lock.json` gestaged. Existiert bereits ein Lockfile, ist der Workflow ein No-op. Keine Store-Aktion, kein Signaturschluessel und keine anderen Projektdateien werden durch diesen Job committed.

## Verifikation nach dem Lock

`.github/workflows/verify.yml` verwendet danach nur `npm run native:install`, also den `npm ci`-Pfad. Der Lock wird als Artefakt an alle nachgelagerten Plattformjobs weitergegeben.

- `rules-and-preview`: Regeln, Tests, Dokumente, Level, Browser-/Audioexport.
- `native-resolution`: installiert exakt den committed Lock und prueft Expo-Paketkompatibilitaet.
- `native-bundles`: erstellt Android-/iOS-JavaScript-Exports und prueft die generierte iOS-Konfiguration.
- `android-preview`: nur fuer Pushes auf den freigegebenen Feature-Branch; erzeugt ein internes Release-Mode-APK mit Entwicklungszertifikat, prueft Paketmanifest und Signatur und laedt es nur als CI-Artefakt hoch.
- `ios-simulator`: nur fuer denselben Feature-Branch; nutzt `macos-26`, verlangt Xcode 26.2+, baut eine Release-Konfiguration fuer `iphonesimulator` mit deaktivierter Signierung, prueft die gebaute Info.plist und laedt eine Simulator-App als CI-Artefakt hoch.

## Was dieser Pfad nicht tut

Kein AAB fuer Google Play, keine signierte IPA, kein TestFlight, kein App-Store- oder Play-Store-Upload, keine Zertifikaterstellung und keine Produktionssignierung. Interne CI-Artefakte sind keine Store-Binaries. Ein erfolgreicher Simulatorbuild ersetzt keinen iPhone-Geraetetest.

## Identitaeten

- Apple-Anzeigename: `WonderCaps`
- Apple Bundle-ID: `com.kamilunavo.wondercaps`
- Apple SKU: `wondercaps-001` nur als Store-Metadatum
- Android Package: `com.kamilunavo.wunderkapseln`
- Version: `0.5.0`
- iOS Build: `7`
- Android VersionCode: `7`

## Offizielle Toolchain-Basis

Expo SDK 55 nennt iOS 15.1+ und Xcode 26.2+ als Build-Basis. GitHub stellt `macos-26` als gehosteten Runner bereit. Links stehen in [SOURCES.md](SOURCES.md). Die tatsaechlich verwendete Xcode-Version wird im CI-Lauf geprueft und muss mindestens 26.2 sein.
