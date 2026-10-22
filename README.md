# WonderCaps (Apple) / Wunderkapseln - Alpha 0.5.0

**Buildfix vom 15.09.2026 (App-Version weiterhin 0.5.0):** Die automatische Lock-Uebergabe wurde korrigiert. Der Bootstrap ruft die Native-Pruefung direkt mit dem exakten Lock-Commit auf; auf einen weiteren GITHUB_TOKEN-Push wird nicht gewartet. Siehe [CI-Handoff-Korrektur](docs/CI_HANDOFF_FIX.md). Ein nativer Build oder GitHub-Import ist damit noch nicht erfolgt.


Ein Match-3-Abenteuer von Kamilunavo: zwoelf lebendige Miniaturwelten unter Glas, 480 Levelrezepte, erspielbare Wunderzuege und sichtbarer Ausbau.

**Stand:** spielbare Alpha mit nativer React-Native-Oberflaeche fuer iOS/Android und separater Browser-Vorschau. Kein WebView-Client. 0.5.0 bereitet erstmals einen echten nativen CI-Buildpfad vor; bis erfolgreiche Remote-Laufdaten vorliegen, werden keine APK-/iOS-Build-Erfolge behauptet. Keine aktiven Zahlungen, keine Werbung und keine Store-Einreichung.

## Apple-Zuordnung

Vom Nutzer vorgegeben: **WonderCaps**, Bundle-ID **`com.kamilunavo.wondercaps`**, SKU **`wondercaps-001`**. Lokal in iOS-Konfiguration und Store-Unterlagen uebernommen, nicht direkt in App Store Connect verifiziert. Android bleibt `com.kamilunavo.wunderkapseln`; Repository und Expo-Slug bleiben Wunderkapseln. Version 0.5.0, iOS Build 7, Android VersionCode 7. Details: [Apple-Einrichtung](docs/APPLE_SETUP.md).

## Start ohne native Abhaengigkeiten

```sh
node tools/audio-assets.mjs
npm test
npm run validate:levels
npm run preview:bundle
npm run audio:preview
npm run preview
```

Der lokale Preview-Server nennt seine Adresse. `dist/Wunderkapseln-preview.html` ist der portable Export; `dist/Wunderkapseln-soundcheck.html` spielt alle 14 Originaleffekte einzeln. Direkter Dateizugriff und lokaler Speicher haengen von Browserrichtlinien ab; keine Sperren umgehen.

## Spiel und Audio

Eigenstaendige Klaenge fuer Raketen, Bomben, Regenbogenperlen, Mehrfachkombinationen, Wind, Flut und Blueten. Separate Bereitschafts- und Ausbau-Fanfaren. Maximal drei gleichzeitige Stimmen, Abbruch bei Pause, Menue, Hintergrund und Stummschaltung. 0.4.2 korrigierte Fokus-/Dialoggrenzen, Aktivzeitabrechnung und serialisierte Audiostarts. Diese Regeln bleiben in 0.5.0 unveraendert.

## Native CI in 0.5.0

Der lokale Container kann `registry.npmjs.org` weiterhin nicht per DNS aufloesen. Deshalb erzeugt ein eng begrenzter GitHub-Actions-Workflow den ersten echten Lock nur auf `feature/playable-miniature-worlds`. Danach verwendet die normale CI ausschliesslich den committed Lock und `npm ci`.

Geplant und getestet sind zwei interne Build-Artefakte ohne Store-Aktion: ein Android-Release-Mode-APK mit Entwicklungszertifikat sowie eine signierungsfreie iOS-Simulator-App auf `macos-26` mit Xcode 26.2+. Details und Grenzen: [Native CI](docs/NATIVE_CI.md) und [Build-Anleitung](docs/BUILD_RUNBOOK.md).

## Dokumentation

Beginne mit [Dokumentationsindex](docs/README.md), [Entwickler-Uebergabe](docs/CODEX_HANDOFF.md), [Native CI](docs/NATIVE_CI.md), [Build-Anleitung](docs/BUILD_RUNBOOK.md) und [Freigabekriterien](docs/RELEASE_GATES.md). Der [Pruefbericht 0.5.0](docs/PRUEFBERICHT-0.5.0.md) trennt lokale Tests von noch ausstehenden Remote-Builds.

## Struktur

`App.js` und `native/` bilden den nativen Client. `core/` enthaelt Regeln, Speicher, Session, Audioereignisse und Lebenslogik. `ui/` erzeugt gemeinsame SVGs und PCM-Sounds. `web/` ist ausschliesslich die QA-Vorschau. `tools/` baut Vorschau, Sounds und Pruefungen. `.github/workflows/` enthaelt den Lock-Bootstrap und die native Verifikation. `docs/` enthaelt Entwicklung, Store-Vorbereitung und Evidenz.

## Verbindliche Grenzen

480 Definitionen sind nicht 480 von Menschen ausbalancierte Levels. Ein JavaScript-Export ist keine installierbare App. Ein Simulatorbuild ist kein TestFlight-Build. Ein internes APK ist kein Play-Release. Eine Pruefsumme ist keine Kaufverifikation. Store-Dokumente sind Entwuerfe, keine erfolgte Einreichung. Repository- und CI-Status separat im aktuellen Pruefbericht nachsehen.

Copyright (c) 2026 Kamilunavo. All rights reserved. Keine Open-Source-Lizenz erteilt.
