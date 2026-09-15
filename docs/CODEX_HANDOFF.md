# Entwickler-Uebergabe - WonderCaps / Wunderkapseln 0.5.0

**Buildfix vom 15.09.2026 (App-Version weiterhin 0.5.0):** Die automatische Lock-Uebergabe wurde korrigiert. Der Bootstrap ruft die Native-Pruefung direkt mit dem exakten Lock-Commit auf; auf einen weiteren GITHUB_TOKEN-Push wird nicht gewartet. Siehe [CI-Handoff-Korrektur](CI_HANDOFF_FIX.md). Ein nativer Build oder GitHub-Import ist damit noch nicht erfolgt.


## Massgeblicher Stand

0.5.0 setzt den lokalen 0.4.2-Stand fort und konzentriert sich auf den ersten echten nativen CI-Pfad. Version `0.5.0`, iOS Build `7`, Android VersionCode `7`. Lies `AGENTS.md`, [NATIVE_CI.md](NATIVE_CI.md), [NATIVE_RUNTIME.md](NATIVE_RUNTIME.md), [RELEASE_GATES.md](RELEASE_GATES.md), [BUILD_RUNBOOK.md](BUILD_RUNBOOK.md) und [PRUEFBERICHT-0.5.0.md](PRUEFBERICHT-0.5.0.md).

## Identitaeten nicht angleichen

Apple ist WonderCaps / `com.kamilunavo.wondercaps` / SKU `wondercaps-001`. Android bleibt `com.kamilunavo.wunderkapseln`; Repository und Expo-Slug bleiben Wunderkapseln. Die SKU ist kein IAP-Produkt und keine Signierkennung. App-/Splash-Icon bleiben `assets/icon.png`; `.gitignore` muss diese Datei explizit zulassen.

## Lokale Grenze

Am 15.09.2026 wurde der npm-Zugriff erneut getestet. Node 22.16.0 und npm 10.9.2 sind vorhanden, DNS fuer `registry.npmjs.org` liefert jedoch weiterhin `EAI_AGAIN`. Kein Fake-Lockfile erzeugen und keine fremde Registry als Umgehung verwenden.

```sh
npm test
npm run check:build -- --source-only
npm run check:docs
npm run validate:levels
npm run preview:bundle
npm run audio:preview
```

## Einmaliger Remote-Lock

`bootstrap-lock.yml` laeuft nur auf `feature/playable-miniature-worlds`. Fehlt `package-lock.json`, fuehrt er `npm run native:install -- --bootstrap` aus, prueft Build-Metadaten und Expo-Paketversionen und staged ausschliesslich `package-lock.json`. `package.json` und `app.json` duerfen sich dabei nicht aendern. Nach dem Lock ist der Job ein No-op.

## Native Verify-Kette

`verify.yml` bleibt read-only. `native-resolution` verlangt einen committed Lock und verwendet `npm ci` ueber `npm run native:install`. `native-bundles` erzeugt beide JavaScript-Exports. Auf Pushes zum freigegebenen Feature-Branch laufen zusaetzlich:

- Android: API 36/Build Tools 36, `assembleRelease`, Paketmanifest-Audit, Development-Signaturpruefung, internes APK-Artefakt.
- iOS: `macos-26`, Xcode mindestens 26.2, `pod install`, Release-Simulatorbuild mit `CODE_SIGNING_ALLOWED=NO`, Info.plist-Audit, internes Simulator-ZIP.

Keiner dieser Jobs darf EAS Submit, Fastlane, Store-Upload, Produktionsschluessel oder Zertifikaterstellung enthalten.

## Unveraenderte Produktbasis

Alle 14 Sounds, Spielregeln, Lebens-/Zeitmodell, Speicherformat, 480 Levelrezepte und Weltgrafiken bleiben in 0.5.0 inhaltlich unveraendert. Echte Kaeufe und Werbung bleiben ausgeschaltet. 480 Rezepte sind kein menschlicher Balancingnachweis.

## Nach Remote-Import

Nicht vom Vorhandensein der Workflow-Dateien auf Erfolg schliessen. Run-ID, Conclusion, Commit-SHA und Artefakte tatsaechlich aus GitHub lesen. Erst ein erfolgreicher Android-Job belegt ein internes APK; erst ein erfolgreicher macOS-Job belegt einen Simulatorbuild. Beides ist noch kein Store-Build und kein Geraetetest.

## Aktueller Nachtrag: Nutzerabnahme am 15.09.2026

Die oben beschriebene Container-DNS-Grenze ist historisch: Auf dem autorisierten Mac wurden danach echte interne Android- und iOS-Simulator-Builds erstellt; siehe `../.local-build/BUILD-RESULT.md`.
Der Nutzer bestaetigt nun, dass der iOS-Simulatorstand funktioniert und die iPhone-Screenshots schon erstellt sind. Vorhandene Screenshots nicht neu erstellen oder ersetzen. Genaue Einzelergebnisse, iPad-Bilder und physische Geraetetests daraus nicht ableiten.
Die aktuelle Abnahme, der Umfang und offene Signatur-/Sicherheitspruefungen stehen in [USER_QA_2026-09-15.md](USER_QA_2026-09-15.md). Kein TestFlight- oder Store-Upload ist damit bestaetigt.

## Neuer Auftrag und erfolgreicher Upload: 15.09.2026

Der Nutzer hat jetzt zusaetzlich iPad-13-Zoll- und iPhone-6,5-Zoll-Screenshots sowie den TestFlight-Upload ausdruecklich beauftragt. Zwoelf echte DE/EN-PNGs wurden erzeugt und geprueft. Der signierte iPhoneOS-Build 0.5.0 (7) wurde von Apple erfolgreich angenommen; keine App-Store-Veroeffentlichung. Tester-Verfuegbarkeit ist noch nicht getrennt verifiziert.
Siehe [STORE_CAPTURE_TESTFLIGHT_2026-09-15.md](STORE_CAPTURE_TESTFLIGHT_2026-09-15.md) fuer Aufloesungen, Pfade, Uploadbeleg, nicht blockierende Symbolwarnungen und die aktuelle 230-Tests-Verifikation. Diese Aktualisierung ersetzt fuer den aktuellen Status die oben erwaehnte fruehere Signatur-Blockade; historische Notizen bleiben erhalten.
