# Pruefbericht - WonderCaps / Wunderkapseln Alpha 0.5.0

## Umfang

0.5.0 bereitet den ersten echten nativen CI-Buildpfad vor. Version `0.5.0`, iOS Build `7`, Android VersionCode `7`. Apple bleibt WonderCaps mit `com.kamilunavo.wondercaps` und SKU `wondercaps-001`; Android bleibt `com.kamilunavo.wunderkapseln`.

## Lokale Red-/Green-Evidenz

Vor der Implementierung wurden neue Release-CI-Tests angelegt. Der Rotlauf schlug wegen fehlendem Bootstrap-Workflow, manuellem Android-Job, fehlendem iOS-Simulatorjob und alter Version wie erwartet fehl. Nach der Implementierung bestehen die gezielten Release-/Workflowtests.

Der lokale Netzwerkblocker wurde am 15.09.2026 erneut reproduziert: Node 22.16.0 und npm 10.9.2 sind vorhanden, aber `registry.npmjs.org` kann in dieser Laufzeit nicht per DNS aufgeloest werden (`EAI_AGAIN`). Deshalb wurde lokal kein Lockfile erfunden und kein nativer Build behauptet.

## CI-Design

`bootstrap-lock.yml` ist auf `feature/playable-miniature-worlds` begrenzt und besitzt nur fuer den einmaligen Lock-Commit `contents: write`. Gestaged wird ausschliesslich `package-lock.json`; Aenderungen an `package.json` oder `app.json` stoppen den Bootstrap.

`verify.yml` bleibt `contents: read`. Der normale native Installationspfad erfordert ein committed Lockfile. Android und iOS verwenden denselben Lock. Der Android-Job erzeugt nur ein internes APK mit Entwicklungszertifikat. Der iOS-Job baut auf `macos-26` fuer den Simulator ohne Code-Signing. Keiner der Workflows enthaelt Store-Submit, Fastlane, EAS Submit oder Produktionsschluessel.

## Lokale Verifikation

- Vollstaendige Node-Test-Suite: 207 Tests, 207 bestanden, 0 Fehler.
- Dokument-Gate: 31 Markdown-Dokumente samt GitHub-Importstatus und Store-Metadaten bestanden.
- Alle 480 Level-Startzustaende wurden durch `npm run validate:levels` validiert.
- Browser-Vorschau und Klangatelier wurden mit den 14 Sounds neu erzeugt.
- Beide Workflow-YAML-Dateien wurden lokal geparst.
- `npm run check:build -- --source-only`: Quellenkonfiguration gueltig, nativer Lock weiterhin bewusst fehlend (`missing_lockfile`), deshalb kein Native-Buildstatus.

## GitHub-Import

Der Zielbranch wurde vor dem Schreibversuch erneut gelesen und zeigte weiterhin auf `26bd85ea34eec78f43b017ad7e1e7dadd49ee5df` mit README-only-Inhalt. Mehrere vorbereitende, **unreferenzierte** Git-Tree-/Blob-Objekte konnten erstellt werden. Beim groesseren Quellcodeimport blockierte die Plattform den Schreibvorgang mit einer Sicherheitsentscheidung. Danach wurden keine weiteren Schreibversuche vorgenommen und die Sperre wurde nicht umgangen.

Wichtig: Es wurde **kein Commit erstellt**, **kein Branch-Ref bewegt**, kein PR geoeffnet und kein Workflow durch diesen Import gestartet. Der sichtbare Feature-Branch bleibt daher unveraendert. Details und das spaetere Vorgehen stehen in `docs/GITHUB_IMPORT.md`.

## Noch ausstehende Remote-Evidenz

Bis zu einem spaeteren erlaubten vollstaendigen GitHub-Import fehlen echte Actions-Run-IDs, ein committed `package-lock.json`, native Paketinstallation sowie APK-/iOS-Simulator-Artefakte. Diese Punkte sind weiterhin nicht als erfolgreich bestaetigt zu behandeln.

## Store-Grenze

Kein AAB/Google-Play-Upload, keine signierte IPA, kein TestFlight, kein App-Store-Upload, keine StoreKit-/Play-Billing-Aktivierung und keine Werbeintegration. Produktionssignierung bleibt separat.
