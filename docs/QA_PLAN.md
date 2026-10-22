# QA-Plan und Freigabe

## Automatische lokale Pruefungen

```sh
node tools/audio-assets.mjs
npm test
npm run validate:levels
npm run preview:bundle
npm run audio:preview
npm run check:docs
npm run check:source
npm run check:art
python tools/browser-qa.py
python tools/browser-polish-qa.py
python tools/browser-safety-qa.py
python tools/browser-abilities-qa.py
```

Die letzten vier Befehle brauchen Python Playwright und Chromium; der aktuelle Testpfad verwendet `/usr/bin/chromium`. Browserdaten sind kontrollierte QA-Speicheradapter, keine echte native Dateisystempruefung. `check:source` und `check:art` benoetigen TypeScript bzw. Sharp. Keine native Kompatibilitaet allein aus JSX-Syntax ableiten.

Optionale Kampagnenanalysen: `npm run audit:campaign` kennt zukuenftige Fuellungen und ist ein Stresstest. `npm run audit:visible` waehlt anhand sichtbarer Informationen. Beide sind keine menschlichen Gewinnquoten. Neuer Lauf, Seed, Strategie und Quellstand muessen bei neuen Aussagen dokumentiert werden.

## Konkrete Geraete-Abnahme

| ID | Handlung | Erwartung |
|---|---|---|
| N01 | iPhone, iPad und Android starten, Hochformat und Safe Areas pruefen | Kein verdeckter Titel, kein Statusleisten-Ueberlapp |
| N02 | Tippen, kurzes/langes Wischen, Finger ausserhalb loslassen | Genau ein gueltiger Zug; keine Geistereingabe |
| N03 | 30 schnelle Zuege/Kaskaden | Eingaben waehrend Aufloesung gesperrt, danach wieder nutzbar |
| N04 | App mitten im Versuch beenden, neu starten | Gleiches Brett, gleiche Zuege, keine Zusatzkosten |
| N05 | Lesefehler/Beschaedigung mit und ohne Sicherung | Wiederherstellung oder gesperrter Start, kein stilles Leerprofil |
| N06 | Mit vollen Herzen Fuenferpaket aktivieren, Herzen verlieren | Fuenf Reserveleben bleiben erhalten; Regeneration funktioniert |
| N07 | Zeitpaket aktivieren, Menue/Ad-Flow/Pause/Hintergrund | Nur aktive Spielzeit laeuft; laufender Schutz bleibt korrekt |
| A01 | Rakete, Bombe, Regenbogen und Mehrfach-Special ausloesen | Passender Sound am Effekt, nicht erst nach dem gesamten Zug |
| A02 | Wind, Flut und Bluete ausloesen | Drei unterscheidbare Klangtypen |
| A03 | Sound aus, Stummschalter, Hintergrund mitten im Seek | Keine verspaeteten oder weiterlaufenden Sounds |
| A04 | Bluetooth trennen und Systemunterbrechung provozieren | Keine Aufnahmeabfrage, kein Absturz, keine Hintergrundwiedergabe |
| A05 | Sieg beim achten Abschluss; Level wiederholen | Fanfare nach Sieg; keine zweite Ausbau-Belohnung |
| A06 | Reduzierte Bewegung einschalten | Keine Pflichtanimation; Klangfolge bleibt begrenzt/abbrechbar |
| L01 | Geraet DE und EN, dann Sprache manuell wechseln | Ziele, Weltinfos, Inventar und Fehlermeldungen passend |
| S01 | Installiertes Icon, Startsymbol und Listing vergleichen | Eine kanonische Grafik ohne erfundene Variante |

## Menschliches Balancing

Zuerst 30 repraesentative Levels aus verschiedenen Welten mit echten Spielenden testen, dann alle Rezeptfamilien und die auffaelligen Level 98/214/230/350/430/433/457. Pro Durchlauf Level, Seed/Versuch, Spielzeit, Fehlversuche, Zielverstaendnis und Fruststellen erfassen. Zeitliche Kaufanreize nicht durch absichtlich unfaire Bretter erzeugen. Erst danach die Kampagnenkurve freigeben.

## Kauf-/Werbeabnahme

Siehe [MONETIZATION.md](MONETIZATION.md). Im aktuellen Build muessen echte Zahlungen und Werbeschaltflaechen weiterhin nicht verfuegbar sein. Keine reale Transaktion zu Testzwecken vortaeuschen.

## Belegstandard

Pro Check: Quellstand, Befehl/Geraet, tatsaechliches Ergebnis und offene Abweichungen. Browserbilder sind keine Store-Screenshots. Ein fehlgeschlagener Lauf wird nicht geloescht oder in einen Erfolg umbenannt. Ein alter Bericht gilt nur fuer seine eigene Version.

## Zusaetzliche physische Laufzeit-Abnahme 0.4.2

| ID | Handlung | Erwartung |
|---|---|---|
| N08 | Android: Benachrichtigungsleiste/Schnelleinstellungen waehrend eines Zeitpakets oeffnen | Ohne App-Wechsel pausieren; kein Zeitverbrauch und kein spaeter Sound; Rueckkehr verlangt bewusstes Fortsetzen |
| N09 | Android: Pause, Regeln, Abbruch und Ergebnis mehrfach oeffnen/schliessen | Keine Fokus-Schleife; Zurueck funktioniert; Hauptansicht nimmt bei offenem Dialog keine Eingaben an |
| N10 | iOS: Kontrollzentrum, App-Umschalter, Anrufunterbrechung | Inactive/background pausieren; Rueckkehr setzt nicht ungefragt fort |
| N11 | Zeitpaket vor/wahrend langer Kaskade vergleichen; danach Wunderzug ausloesen | Nur aktive Spielzeit ausserhalb Animationen wird abgezogen; vor Paketaktivierung vergangene Zeit bleibt unberechnet |
| N12 | TalkBack/VoiceOver mit Regeln/Pause/Ergebnis | Verdeckte Hauptansicht nicht vorgelesen, Dialogaktionen erreichbar, Fokus nach Schliessen sinnvoll |
| A07 | Identische Raketen-/Bombeneffekte rasch wiederholen, mittendrin pausieren/stummschalten | Kein alter Seek setzt neuen Effekt zurueck; abgebrochene Starts bleiben still; unterschiedliche Effekte koennen parallel spielen |

Diese Geraete-Faelle sind noch offen. Die automatisierten AppState-, Player- und Elementtests unter tests/native-*.test.mjs sind kontrollierte Grenztests und keine physische Abnahme.
