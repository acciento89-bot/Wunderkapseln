# Pruefbericht: WonderCaps 0.5.0 - Native-CI-Buildfix

Stand: 15.09.2026. App-Version 0.5.0 / iOS Build 7 / Android VersionCode 7. Kein neues Gameplay-Release.

## Tatsaechlich geaendert

Die Lock-Bootstrap-Kette ruft die Native-Pruefung nun direkt als reusable workflow auf, statt auf einen von GITHUB_TOKEN unterdrueckten Folge-Push zu warten. Der komplette Folgepfad verwendet die konkrete Lock-only-Kindcommit-SHA. Commit- und Download-Pruefungen verhindern fremde Quellcodeaenderungen, verwechselte Locks, falsche Ausgangscommits und Force-Pushes bei Konkurrenz.

Ein plattformneutraler Artefaktselektor ersetzt mehrdeutige beziehungsweise shellabhaengige Dateiauswahl. Gradle-/Xcode-Protokolle und Herkunftsnachweise bleiben auch bei fehlgeschlagenen nativen Jobs erhalten; ungepruefte Binaries werden nicht als Erfolg hochgeladen.

README, AGENTS, Build-/Import-Anleitungen, Entwickler-Uebergabe und Release-Gates verweisen auf die neue, ausfuehrliche CI_HANDOFF_FIX.md. Historische Berichte bleiben als Historie erhalten.

## Verifiziert

- Vor Aenderungen: alle 207 bestehenden Tests bestanden.
- 16 neue Tests wurden zuerst ausgefuehrt und schlugen erwartungsgemaess fehl. Nach Implementierung bestanden alle 16. Drei weitere Tests pruefen Lock-Manipulation und die Reihenfolge der Download-Pruefung.
- Vollstaendige abschliessende Suite: 226 Tests bestanden, 0 Fehler.
- Die gezielten CI-Suiten bestehen mit 32 Tests. Echte Git-Operationen laufen dabei in kurzlebigen lokalen Repositories mit lokalen Bare-Remotes; es ist kein GitHub-Integrationstest.
- Beide Workflow-Dateien wurden auf diesem Host als YAML eingelesen. 46 Shell-Bloecke wurden mit bash -n geprueft. Das ist keine GitHub-Actions-Ausfuehrung oder vollstaendige Actions-Ausdrucksauswertung.
- Die bestehenden 31 Dokumentpruefungen und die separate Verweispruefung des neuen Handoff-Dokuments bestanden.
- Alle 480 Startfelder durch den bestehenden Levelvalidator geprueft. Dies ist kein menschliches Balancing.
- 44 Produktdateien sind byte-identisch zur gelieferten 0.5.0: native und Browser-Oberflaeche, Spielkern, Grafiken, alle 14 Sounds, Paket-/App-Konfiguration. Die neu erzeugte Vorschau ist ebenfalls byte-identisch zur vorherigen 0.5.0-Vorschau; sie wird deshalb nicht als neues visuelles Update angeboten.
- Das ausgelieferte Archiv wird in einem neuen Verzeichnis entpackt und dort mit npm test sowie allen Datei-SHA-256-Pruefsummen geprueft. Das endgueltige Resultat und der Archivhash stehen in der beigefuegten Archivpruefung.

Belege: docs/qa/ci-handoff/baseline.tap, red.tap, final-suite.tap, workflow-syntax.json, unchanged-product.json, docs.txt und source-config.txt. npm test benoetigt Node 22, Git und Python 3, aber weder npm-Paketdownloads noch PyYAML. PyYAML war ausschliesslich ein bereits vorhandenes Host-Werkzeug fuer die separate YAML-Inspektion.

## Nicht ausgefuehrt

Der normale HTTPS-Aufruf zur npm-Registry scheiterte erneut bei der DNS-Aufloesung (curl Exit 6). Der Downloadhelfer lieferte vor einer Uebertragung eine URL-Pruefvoraussetzung; der anschliessende Web-Aufruf derselben npm-Metadatenadresse wurde abgewiesen. Es wurde danach keine weitere Route fuer Paketdownloads verwendet. Kein package-lock.json fuer die eigentliche App erzeugt, keine Expo-/React-Native-Installation und kein nativer Compiler gestartet. Der Quellen-Gate meldet korrekt missing_lockfile und nativeBuildVerified: false.

Kein Android SDK und kein Xcode in diesem Container. Keine APK, AAB, IPA oder Simulator-App; keine echten Geraete-, Audio- oder Storetests. Kein unabhaengiger Review-Agent verfuegbar; nur eigene Diff-Pruefung und die genannten Tests. Die noch nicht erfolgte GitHub-Runner-Ausfuehrung kann weitere plattformspezifische Fehler aufdecken.

GitHub wurde ausschliesslich gelesen: feature/playable-miniature-worlds enthielt weiterhin nur README.md. Kein neuer Schreibversuch nach den vorherigen Plattform-Sperren, keine alternative Uploadroute, kein Remote-Commit, PR, Merge oder Workflow-Dispatch. Lokale Git-Fixture-Pushes sind davon getrennt und beruehren kein Online-Konto.

Keine Apple-/Google-Kontoaenderung, Signierung, Kaufaktivierung, Werbung oder Store-Einreichung. Die Apple-Zuordnung WonderCaps / com.kamilunavo.wondercaps / wondercaps-001 bleibt unveraendert. Android bleibt com.kamilunavo.wunderkapseln.

## Naechster zwingender Nachweis

Der vollstaendige Quellcode muss zunaechst ueber einen erlaubten GitHub-Zugang im Repository vorhanden sein. Danach sind ein realer Lock, erfolgreiches npm ci, Metro-Exports und die tatsaechlichen nativen Runner-Artefakte zu verifizieren. Eine weitere lokale Testzahl oder eine vorbereitete Workflow-Datei ersetzt diese Nachweise nicht.
