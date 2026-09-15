# Pruefbericht - Alpha 0.4.1 / WonderCaps-Apple-Zuordnung

## Umgesetzt

Die begonnene Build-Vorbereitung ist lokal fertiggestellt: explizite Bootstrap-/npm-ci-Auswahl, strukturelle Lockfile-Pruefung, gemeinsame Lock-Uebergabe fuer Android und iOS, native Berechtigungspruefer sowie Build-/Uebergabeunterlagen. Version 0.4.1, interne Buildnummer 5. Kein neuer Spielinhalt.

Auf Nutzerangabe ist Apple jetzt **WonderCaps**, Bundle-ID **`com.kamilunavo.wondercaps`**, SKU **`wondercaps-001`**. iOS-Info.plist setzt Anzeigenamen und Bundle-Namen auf WonderCaps. Die Apple-SKU steht ausschliesslich in Store-Metadaten, nicht in nativer Konfiguration oder Kaufartikeln. Android behielt `com.kamilunavo.wunderkapseln`; Repository und Expo-Slug bleiben Wunderkapseln.

Apple-Setup und eigene deutsche/englische Apple-Store-Texte sind in APPLE_SETUP.md, APPLE_STORE_COPY_DE.md und APPLE_STORE_COPY_EN.md hinterlegt. Metadaten-JSON und Markdown werden zusammen geprueft. Der bestehende Datensatz und Vollzugriff sind Nutzerangaben, nicht das Ergebnis einer technischen App-Store-Connect-Abfrage.

## Frisch ausgefuehrte Pruefungen

- 171 Unit-/Regressionstests bestanden, 0 Fehler: 112 bisherige Spiel-/Audio-/Dokumenttests, 45 Build-Tests und 14 neue Apple-Identitaetstests. 157 Basistests wurden vor der Apple-Aenderung erneut ausgefuehrt. Von den 14 neuen Tests scheiterten zuvor 12 erwartungsgemaess; zwei pruften bereits unveraendert richtige Schutzregeln.
- 44 gezielte Identitaets-/Build-/Manifest-Tests bestanden. iOS akzeptiert nur die freigegebene WonderCaps-ID; der alte Anzeigename und ein versehentlicher Android-ID-Wechsel werden abgewiesen.
- 24 zentrale Markdown-Dokumente samt lokalen Verweisen, Apple-/Android-DE-/EN-Textgrenzen, SKU und lokaler Apple-Konfigurationszuordnung geprueft.
- Alle 480 Startfelder validiert. 21 deterministische Beispielpartien gewonnen; kein menschlicher Balancingnachweis.
- 72 SVG-Welt-/Ausbaustufen mit vorhandenem Host-Sharp gerendert. JSX-Syntax des nativen Einstiegs und Audio-Adapters mit vorhandenem Host-TypeScript geprueft. Diese beiden Host-Werkzeuge ersetzen weder Expo-/React-Native-Installation noch nativen Build.
- 39 Dateien aus Spielkern, nativer Oberflaeche, Browser-Oberflaeche, Grafik und Audio sind bytegleich zum geprueften 0.4.0-Archiv, einschliesslich aller 14 Sounds. Spielvorschau und Klangatelier wurden neu erzeugt und sind bytegleich zu 0.4.0. Keine neuen Screenshots oder frischen Browser-/Geraetetests behauptet.
- Workflow-YAML lokal eingelesen: vier Ubuntu-Jobs, kein macOS-Job und keine Store-Aktion. Nicht remote ausgefuehrt.

Aktuelle Belege liegen unter `docs/qa/0.4.1/apple-identity/`. `baseline.tap`, `red.tap`, `green.tap`, `unit-tests.tap`, `docs-check.txt`, `source-config.txt`, `host-qa-tools.json`, `source-check-host.txt`, `art-check-host.txt`, `workflow-parse.json` und `unchanged-game-assets.json` trennen ihre Pruefarten. Alte Logs in anderen Ordnern sind Historie.

## Externe Build-Blocker

Der bereits dokumentierte Standard-npm-Installationsversuch dieser 0.4.1-Build-Arbeit endete am 14.09.2026 mit Exit 1 und `getaddrinfo EAI_AGAIN registry.npmjs.org`. Kein echter package-lock.json und keine installierten nativen Abhaengigkeiten. Bei der anschliessenden Apple-Korrektur wurde nicht noch einmal derselbe Netzversuch wiederholt.

`check:build -- --source-only` meldet `sourceConfigValid: true`, `lockMetadataValid: false`, `nativeBuildVerified: false`. Der regulaere Installationspfad bleibt bei `missing_lockfile` gesperrt; er erzeugt keinen Fake-Lock. Ein normaler Quellen-Syntaxcheck scheiterte zunaechst an nicht lokal installierten Dev-Paketen. Fuer die ausdruecklich markierte Host-QA wurden nur bereits vorhandene TypeScript-/Sharp-Pakete kurz lokal aufgeloest; danach wurden diese Links entfernt. Keine Expo-Installation daraus ableiten.

## Nicht ausgefuehrt

Keine Gradle-/Xcode-/Metro-Ausfuehrung, keine APK/AAB/IPA und kein nativer Geraetetest. Keine neue Audio-Lautstaerke-/Bluetooth-/Silent-Switch-Abnahme und kein menschlicher Leveltest. Native Manifest-/Plist-Tests liefen gegen kontrollierte Fixtures, nicht gegen eine gebaute App. Kein unabhaengiges Code-Review; nur eigene Quellenpruefung und Tests.

Keine StoreKit-/Play-Billing-/AdMob-Integration, keine aktiven Kaeufe, keine Zertifikats- oder Profilanlage. Keine direkte Apple-Kontopruefung: die Plugin-Suche lieferte kein unmittelbar nutzbares App-Store-Connect-Werkzeug. Die Angaben Name/ID/SKU sind dennoch lokal exakt uebernommen; Zugriffserlaubnis und technische Anbindung werden nicht gleichgesetzt.

## GitHub und Distribution

Die vorherige Quellcodeuebertragung wurde von der Plattform gesperrt. In dieser Fortsetzung kein erneuter Schreibversuch und keine alternative Uploadroute, kein Remote-Commit/PR/Merge, kein CI-Dispatch und kein Apple-/Google-Upload. Der frueher ausgelesene README-only-Branch wird nicht als synchronisiert dargestellt. Ein vorbereiteter Workflow ist kein erfolgreicher Build.

## Paket

Der Quellcode enthaelt SHA256SUMS.json und alle vorhandenen 14 WAV-Dateien, Generatoren, Tests, Plattformkonfigurationen und Markdown-Unterlagen. Keine node_modules, generierten Android-/iOS-Projekte, Git-Metadaten, Secrets oder Signaturschluessel. Der Quellstand wurde frisch entpackt: erneut 171 Tests bestanden, alle manifestierten Dateien stimmen vor und nach dem Testlauf mit ihren SHA-256-Werten ueberein. Apple-/Android-Metadaten und Dokumente wurden auch in der entpackten Kopie erfolgreich geprueft. Das aktuelle ZIP wird nach der abschliessenden Dokumentation erneut genauso geprueft; sein SHA-256-Wert steht im separat beigefuegten Archivpruefbericht.
