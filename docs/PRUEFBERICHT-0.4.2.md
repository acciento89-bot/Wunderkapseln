# Pruefbericht - WonderCaps / Wunderkapseln Alpha 0.4.2

## Tatsaechliche Aenderungen

Fortsetzung aus WonderCaps-Alpha-0.4.1.zip. Version 0.4.2, interne Buildnummer 6. Apple bleibt WonderCaps, Bundle-ID com.kamilunavo.wondercaps, SKU wondercaps-001. Android bleibt com.kamilunavo.wunderkapseln. Kein neues Store-Produkt.

Der native Laufzeitadapter behandelt Android-Fokusverlust und iOS-inactive/background getrennt vom Spielzustand. Taktgeber, Eingaben und Feedback werden ueber den vorhandenen Controller pausiert; Rueckkehr setzt nicht automatisch fort. Android-Spiel-Dialoge liegen jetzt im selben Activity-Fenster statt in einem zweiten nativen Fenster. iOS behaelt Modal. Der Android-Fenster-Fade entfiel bewusst; Dialoginhalt und Gestaltung bleiben. Verdeckte Hauptansicht wird fuer Screenreader verborgen, deren native Fokusfuehrung bleibt eine offene Geraeteabnahme.

Aktive Spielzeit beginnt nach Animationen/Abbruch mit einer neuen Zeitgrenze. Die Aktivierung eines Zeitpakets und das Ausloesen einer Weltfaehigkeit rechnen bereits vergangene aktive Zeit vor dem neuen Zustand ab. Animationszeit bzw. Zeit vor Paketaktivierung wird nicht nachtraeglich berechnet. Speicherformat, Levelregeln und Lebensreserve bleiben gleich.

Der native Audio-Adapter serialisiert seekTo-Aufrufe pro Sound-Player. Veraltete, gestoppte oder nach Unmount ausstehende Starts duerfen nicht abspielen. Fehler blockieren folgende Versuche nicht dauerhaft; unterschiedliche Sounds bleiben parallel bis zum vorhandenen Drei-Stimmen-Limit. Keine neuen Sounds oder SDKs.

## Frisch ausgefuehrte Pruefungen

- 171 Basistests bestanden vor der Aenderung. Die fuenf neuen Zeitgrenztests schlugen auf dem Altstand fehl. Neue Adapter und ihre Verdrahtung wurden durch rote Tests eingefuehrt.
- Der aus dem alten Hook isoliert ausgefuehrte Originaladapter hatte bei zwei schnellen gleichen Effekten zwei gleichzeitig offene seekTo-Aufrufe auf demselben kontrollierten Player. Das ist die aufgezeichnete Regression, kein physischer Hoertest.
- 201 Unit-/Regressionstests bestanden, null Fehler: 171 bestehende und 30 neue (5 Zeit, 10 Laufzeit, 10 Audio, 5 Dialog).
- 51 Browser-Pruefungen bestanden: 12 Basis, 12 Ausbau/Audio, 11 Speicher/Reserve/Hinweise, 16 grosse Faehigkeiten/Audio. Echte Chromium-JavaScript-/DOM-/Web-Audio-Pfade, kontrollierte Speicheradapter; nicht Android/iOS.
- Alle 480 Startbretter validiert; 21 deterministische Beispielpartien gewonnen. Keine neue vollstaendige Kampagnenanalyse, kein menschlicher Balancing- oder Loesbarkeitsnachweis.
- 72 SVG-Welt-/Ausbaustufen gerendert. JSX-Syntax, Iconreferenzen, Plattformkennungen und Quell-Berechtigungseinstellungen geprueft. Die vorinstallierten Host-Werkzeuge TypeScript 5.8.3 und Sharp 0.34.1 sind keine Installation der gepinnten Projektpakete.
- 27 zentrale Markdown-Dateien samt lokalen Verweisen und Apple-/Android-DE-/EN-Metadaten geprueft.
- 31 bestehende Grafik-/Audio-/Regeldateien bytegleich mit 0.4.1, einschliesslich aller 14 WAV-Dateien und beider Icon-Dateien. Controller und native Adapter wurden absichtlich geaendert.
- Spielvorschau und Klangatelier frisch erzeugt. Alte Berichte sind weiterhin als Historie vorhanden; aktuelle Belege liegen ausschliesslich unter docs/qa/0.4.2/.

Die Host-Pruefschritte entfernten ihre temporaeren Paketlinks wieder. Kein node_modules und kein package-lock.json im gelieferten Quellstand. Die SHA256SUMS.json deckt die gepackten Quelldateien ab; der separate Archivpruefbericht dokumentiert die erneute Extraktion, Tests und Pruefsummen.

## Belege

baseline.tap, time-red.tap, runtime-red.tap, runtime-time-green.tap, audio-legacy-repro.json, audio-red.tap, audio-green.tap, modal-red.tap, native-boundaries-green.tap, unit-tests.tap. Browserberichte: browser-summary.json und die vier browser-*-report.json-Dateien bzw. browser-report.json. Weitere Belege: levels.txt, build-gates.json.txt, host-qa-tools.json, source-host-check.txt, art-host-check.txt, docs-check.txt, unchanged-assets-rules.json.

## Native Build-Grenze bleibt offen

Eine einzelne Standard-HTTPS-Probe an registry.npmjs.org scheiterte in dieser Fortsetzung mit curl Exit 6 (DNS-Aufloesung). Kein wiederholtes Installationsprobieren, kein Lockfile erfunden. check:build -- --source-only meldet sourceConfigValid=true, lockMetadataValid=false, nativeBuildVerified=false und missing_lockfile.

Keine Metro-/Gradle-/Xcode-Ausfuehrung, keine APK/AAB/IPA, keine Signierung, kein TestFlight- oder Store-Upload. AppState-/Player-/React-Elementtests sind kontrollierte Grenztests, keine Betriebssystem-/Renderer-/Geraete-Abnahme. Bluetooth, Lautlos, Audio-Unterbrechungen und Screenreader-Fokus muessen auf echten nativen Builds geprueft werden. Kein unabhaengiges Code-Review; eigene Diff-Pruefung und Tests sind entsprechend begrenzt.

## GitHub, Apple und Monetarisierung

Der Remote-Branch feature/playable-miniature-worlds wurde erneut nur gelesen: weiterhin README-only. Kein erneuter gesperrter Schreibversuch, keine alternative Uploadroute, kein Remote-Commit/PR/Merge/Workflow-Dispatch. Lokaler Entwicklungsbranch ist kein Upload.

Apple-Name/Bundle-ID/SKU und Vollzugriff beruhen weiterhin auf Nutzerangaben. Kein direkter Apple-Kontoabgleich, keine neue Zertifikats-/Profilanlage. Keine echten Kaufprodukte registriert, keine StoreKit-/Play-Billing-/Werbeintegration und keine Zahlungen. Der vorbereitete Text-/MD-Stand ist keine Store-Einreichung.
