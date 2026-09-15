# GitHub-Importstatus - Alpha 0.5.0

**Buildfix vom 15.09.2026 (App-Version weiterhin 0.5.0):** Die automatische Lock-Uebergabe wurde korrigiert. Der Bootstrap ruft die Native-Pruefung direkt mit dem exakten Lock-Commit auf; auf einen weiteren GITHUB_TOKEN-Push wird nicht gewartet. Siehe [CI-Handoff-Korrektur](CI_HANDOFF_FIX.md). Ein nativer Build oder GitHub-Import ist damit noch nicht erfolgt.


## Ziel

Repository: `acciento89-bot/Wunderkapseln`

Zielbranch: `feature/playable-miniature-worlds`

Der vollstaendige lokale Stand soll als ein atomarer Quellcode-Import auf diesen Branch gelangen. Erst danach darf der branchgebundene Lock-Bootstrap laufen. Es werden keine Store-Credentials, Signaturschluessel, `node_modules`, generierten Android-/iOS-Projekte oder lokalen QA-Ausgaben importiert.

## Stand vom 15.09.2026

Vor dem Import zeigte der Zielbranch weiterhin auf Commit `26bd85ea34eec78f43b017ad7e1e7dadd49ee5df` und enthielt nur `README.md`.

Der GitHub-Connector akzeptierte mehrere unreferenzierte Git-Objekte fuer den vorbereiteten 0.5.0-Tree. Beim Import groesserer Quellcodedateien blockierte die Plattform den Schreibvorgang jedoch mit einer Sicherheitsentscheidung. Entsprechend wurde **kein** Commit erzeugt und **keine** Branch-Referenz bewegt. Weitere Schreibversuche wurden nicht unternommen und die Sperre wurde nicht umgangen.

Die erzeugten unreferenzierten Git-Objekte sind keine veroeffentlichte Version und koennen ignoriert werden. Massgeblich bleibt der Branch-Head auf dem oben genannten README-only-Commit, bis ein spaeterer erlaubter Import nachweislich abgeschlossen ist.

## Reproduzierbarer Importumfang

Das Release-Archiv `WonderCaps-Alpha-0.5.0.zip` ist der kanonische lokale Quellstand. Fuer einen spaeteren Git-Import werden generierte/vertrauliche Verzeichnisse ausgeschlossen:

- `node_modules/`
- `.expo/`
- `dist/`
- `android/`
- `ios/`
- `docs/qa/`
- lokale Signatur- und Provisioningdateien

`assets/icon.png` muss trotz der allgemeinen PNG-Regel versionierbar bleiben (`!assets/icon.png`). Die WAV-Dateien lassen sich deterministisch mit `node tools/audio-assets.mjs` erzeugen; der kanonische App-Icon-Pfad wird mit `npm run assets` erzeugt/geprueft.

## Nach einem spaeteren erfolgreichen Import

1. Branch-Head erneut lesen und den neuen Commit festhalten.
2. `Bootstrap WonderCaps native lock` muss genau einmal einen echten `package-lock.json` erzeugen, sofern noch keiner existiert.
3. Den vom Bot erzeugten Lock-Commit kontrollieren: nur `package-lock.json` darf geaendert sein.
4. `Verify WonderCaps 0.5 native release path` auf dem Lock-Commit abwarten.
5. Run-IDs, Jobstatus und Artefakt-SHAs in `docs/PRUEFBERICHT-0.5.0.md` eintragen.
6. Erst bei gruenem Native-Build die internen APK-/Simulatorartefakte als erfolgreich gebaut bezeichnen.

Kein Workflow in 0.5.0 darf zu Google Play, TestFlight oder App Store Connect hochladen.
