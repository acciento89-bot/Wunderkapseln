# Native CI: korrigierte Lock-Uebergabe (15.09.2026)

## Geltungsbereich

Dies ist ein Buildfix auf Basis der Alpha 0.5.0, kein neues Spielupdate. App-Version 0.5.0, iOS Build 7 und Android VersionCode 7 bleiben unveraendert. Apple: WonderCaps / com.kamilunavo.wondercaps / SKU wondercaps-001. Android: com.kamilunavo.wunderkapseln. Spielregeln, Spielstaende, Grafiken und alle 14 WAV-Dateien werden nicht veraendert.

## Der nachgewiesene Fehler

Der bisherige Bootstrap erzeugte einen Lockfile-Commit mit dem GitHub-eigenen GITHUB_TOKEN und wartete anschliessend implizit auf den naechsten Push-Workflow. GitHub startet fuer solche Pushes keinen neuen Workflow. Ein erfolgreicher Lock-Commit allein haette somit noch keinen Android-/iOS-Build ausgeloest. Der parallel gestartete Verify-Lauf gehoert zum urspruenglichen Commit ohne Lock und kann weiterhin mit missing_lockfile fehlschlagen.

## Korrigierter Ablauf

1. Ein normaler Push auf feature/playable-miniature-worlds startet den einmaligen Bootstrap.
2. Wenn im Ausgangscommit bereits ein Lock liegt, bleibt der Bootstrap ein No-op; der normale Verify-Lauf verwendet den vorhandenen Lock.
3. Andernfalls wird der echte Lock durch npm von der Standard-Registry aufgeloest und mit den vorhandenen Build-/Expo-Pruefungen geprueft.
4. tools/ci-source.mjs commit-lock akzeptiert nur den erwarteten Ausgangscommit und den freigegebenen Feature-Branch. Der Index muss leer sein; ausser package-lock.json sind weder geaenderte getrackte noch zusaetzliche nicht ignorierte Dateien erlaubt. Ein existierender Lock darf nicht ersetzt werden.
5. Es wird ausschliesslich der Lock committed. Der neue Commit muss genau einen Parent haben und als einzige Aenderung package-lock.json hinzufuegen. Der Push erfolgt ohne Force und ohne automatisches Rebase. Parallel eingegangene Aenderungen fuehren zum Abbruch, nicht zum Ueberschreiben.
6. Erst nach erfolgreichem Push gibt der Job source_sha aus. verify-after-lock ruft verify.yml direkt als lokalen reusable workflow auf. Kein Ersatz-Token, kein zusaetzliches Secret und kein Store-Zugriff sind dafuer konfiguriert. Der Folgejob hat nur contents: read.
7. Jeder nachgelagerte Checkout verwendet genau source_sha; auch der gemeinsame Lock-Artefaktname enthaelt diese SHA. Nach jedem Lock-Download wird der Inhalt bytegenau gegen den Git-Commit geprueft, bevor npm ci beginnt.
8. Regeln, Paketinstallation, Metro-Exports, internes Android-APK und iOS-Simulator werden durch dieselbe bestehende Verify-Kette ausgefuehrt. Sie bootstrappen selbst niemals.

Der reusable workflow selbst stammt vom Aufrufer-Commit. Die Quellen duerfen deshalb nur dessen gepruefter Lock-only-Kindcommit sein; diese Bedingung prueft der Herkunfts-Guard. Die GitHub-Ereignisdaten bleiben dem Aufrufer zugeordnet. Deshalb ist bei der spaeteren Auswertung nicht nur github.sha aus der Run-Uebersicht zu lesen, sondern auch ci-source.json und dessen sourceSha und lockSha256. Ein erfolgreicher verschachtelter Lauf wird nicht automatisch als Statusnachweis fuer jeden anderen Commit ausgegeben. Ein spaeterer PR muss seine eigenen Checks auf seinem aktuellen Stand bestehen.

Die Concurrency-Gruppen von Bootstrap und Verify unterscheiden sich, damit der aufgerufene Lauf seinen Aufrufer nicht abbricht. Es gibt weder workflow_run noch pull_request_target und keine Secrets-Vererbung.

## Plattform-Paketierung

Die Auswahl des iOS-Workspace, Xcode-Projekts und der fertigen .app erfolgt ueber tools/find-one-artifact.mjs. Null oder mehrere Treffer sind Fehler. Pfade mit Leerzeichen bleiben erhalten, Symlinks werden nicht verfolgt. Der macOS-Job braucht weder mapfile noch head -n 1 fuer diese Auswahl. Das ist eine portable Quellkorrektur, kein Nachweis eines ausgefuehrten macOS-Builds.

Android und iOS speichern Fehlerdiagnostik mit if: always(). Gradle- und Xcode-Ausgaben werden zusaetzlich in Build-Evidence-Dateien geschrieben. Pipefail bleibt aktiv: Ein fehlgeschlagener Compiler wird nicht durch tee zum Erfolg. Die eigentlichen APK-/Simulator-Pakete werden weiterhin nur nach erfolgreichem Build und Audit hochgeladen.

## Reproduzierbare lokale Pruefung

Voraussetzungen fuer diese Tests: Node 22, Git und Python 3 fuer die bereits bestehenden Manifesttests. Kein npm-Paketdownload und kein PyYAML sind fuer npm test erforderlich.

```sh
node --test tests/ci-handoff.test.mjs tests/release-ci.test.mjs tests/workflow-readiness.test.mjs
npm test
npm run check:docs
npm run check:build -- --source-only
npm run validate:levels
```

Die Git-Tests verwenden temporaere lokale Repositories und lokale Bare-Remotes, niemals das Konto des Nutzers. Der Test-Lock ist synthetische Metadaten einer leeren Fixture, kein vorgetaeuschter Lock der eigentlichen App. Getestet werden unter anderem Lock-only-Commit, unveraenderte parallele Remote-Aenderungen, falscher Ausgangscommit, falscher Branch, fremde Index-/Dateiaenderungen und manipulierte Lock-Artefakte. Die Tests ersetzen keinen GitHub-Runner und keinen echten Native-Build.

## Aktuelle externe Grenzen

Der Standard-HTTPS-Zugriff auf registry.npmjs.org konnte in dieser Sitzung nicht per DNS aufgeloest werden (curl Exit 6). Kein nativer Installationsversuch kann damit abgeschlossen werden; es wurde kein App-Lock erfunden. Im Container fehlt zudem das Android SDK; Xcode/macOS steht hier ebenfalls nicht zur Verfuegung.

Der GitHub-Feature-Branch wurde nur gelesen und enthaelt weiterhin README.md. Nach den vorherigen Plattform-Sicherheitssperren wurde kein weiterer Schreibversuch oder alternativer Uploadweg verwendet. Kein Remote-Commit, kein PR, kein Workflow-Dispatch und kein Store-Upload in dieser Sitzung. Der korrigierte Quellcode ist lokal im vollstaendigen Buildfix-Archiv enthalten.

## Offizielle Grundlagen

- [GitHub: Triggering a workflow](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
- [GitHub: Reuse workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)
- [GitHub: Reusing workflow configurations, Kontext und Concurrency](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations)

Geprueft am 15.09.2026. Lokale Resultate stehen im beigefuegten Pruefbericht; ein zukuenftiger Remote-Run muss unabhaengig anhand seiner Commit-Zuordnung, Logs und Artefakte verifiziert werden.
