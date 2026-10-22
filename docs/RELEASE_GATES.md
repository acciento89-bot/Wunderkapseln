# Release gates - Alpha 0.5.0 ist nicht store-ready

**Buildfix vom 15.09.2026 (App-Version weiterhin 0.5.0):** Die automatische Lock-Uebergabe wurde korrigiert. Der Bootstrap ruft die Native-Pruefung direkt mit dem exakten Lock-Commit auf; auf einen weiteren GITHUB_TOKEN-Push wird nicht gewartet. Siehe [CI-Handoff-Korrektur](CI_HANDOFF_FIX.md). Ein nativer Build oder GitHub-Import ist damit noch nicht erfolgt.


## G0 - lokale Alpha

Gemeinsame Tests, Browserinteraktionen, Levelstart-Validierung, Audio-/Assetparitaet und Dokumentkonsistenz muessen fuer denselben Quellstand bestehen. 0.5.0 fuegt Release-CI-Tests fuer Lock-Bootstrap, Android-APK, iOS-Simulator und Icon-Importschutz hinzu.

## G1 - native interne Builds: VORBEREITET, REMOTE-NACHWEIS AUSSTEHEND

Der lokale Container kann die npm-Registry weiterhin nicht per DNS aufloesen. Ein eigener branchgebundener Workflow soll deshalb einmalig einen echten `package-lock.json` erzeugen und nur diesen committen. Danach muss die normale CI den Lock mit `npm ci` verwenden. Der Feature-Branch soll ein internes Android-APK und einen signierungsfreien iOS-Simulatorbuild erzeugen. Solange die GitHub-Laufdaten und Artefakte nicht tatsaechlich gelesen und erfolgreich bestaetigt wurden, bleibt G1 offen.

## G2 - Spiel und Audio: TEILWEISE

0.4.2 ergaenzte kontrollierte Native-Grenztests fuer AppState/Android-Fokus, Dialogpraesentation, Aktivzeit und asynchrone Player. 0.5.0 aendert diese Regeln nicht. Echte OS-Ereignisreihenfolgen, TalkBack/VoiceOver, Player-Wiedergabe, Frametimes und Touchqualitaet bleiben Geraetechecks. 480 Startbretter sind automatisiert pruefbar; menschliche Levelbalance bleibt offen.

## G3 - Kauf und Werbung: GESPERRT

Keine echten Zahlungen aktivieren, bis Produktregistrierung, Verifikation, Transaktions-Idempotenz, verbrauchsgutgeeignete Wiederherstellung, Erstattung und beide Store-Sandboxes bestanden sind. Kein Werbe-SDK ohne Consent-/Daten-/Zielgruppenpruefung und Reward-Regeln. Details in [MONETIZATION.md](MONETIZATION.md).

## G4 - Metadaten und rechtliche Vorbereitung: ENTWURF

Apple-Zuordnung lokal festgelegt: WonderCaps / `com.kamilunavo.wondercaps` / SKU `wondercaps-001` (Nutzerangabe, kein Kontoabgleich). Gesonderte Apple-DE-/EN-Texte und Android-Texte sind vorbereitet. Appbezogene Datenschutz-/Supportseiten, EULA-Pruefung, Altersfragebogen, SDK-Datenangaben, Marken-/Namenspruefung und echte Geraetescreenshots fehlen. Keine Rechtsfreigabe behaupten.

## G5 - Distribution: NICHT ERFOLGT

Interne CI-Artefakte duerfen nicht mit Store-Binaries verwechselt werden. Kein AAB-/Google-Play-Upload, keine signierte IPA, kein TestFlight und kein App-Store-Upload ohne ausdrueckliche Freigabe und erfolgreiche G1/G2-Abnahme. App-/Launcher-/Splash-/Store-Icon vor jedem Upload gegen die kanonische Grafik vergleichen.

## STOP

Bei nicht aufloesbarer nativer Abhaengigkeit, fehlgeschlagenen Tests, fehlender Signierung, unbestaetigter Transaktion oder Tool-Sicherheitssperre den jeweiligen externen Schritt stoppen. Keine Sperren umgehen und keinen Teilerfolg als Release ausgeben.
