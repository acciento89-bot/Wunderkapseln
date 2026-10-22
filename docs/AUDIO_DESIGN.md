# Audio Design und Abnahme

## Klangcharakter

Originale, lokal synthetisierte Spielklaenge: warmes Glas, weiche Impulse, luftige Anstiege und musikalische Splitter. Keine fremden Aufnahmen, keine Sprachausgabe, keine Mikrofonaufnahme. Die fuenf bisherigen WAVs bleiben byte-identisch.

| Cue / Datei | Ausloeser | Charakter |
|---|---|---|
| `match.wav` | Normaler Treffer | Zwei kleine Glasnoten |
| `combo.wav` | Kaskade ab Tiefe drei | Aufsteigende Tonfolge |
| `wonder.wav` | Kompatibler Rueckfall fuer unbekannten Wundertyp | Allgemeiner Wunderklang |
| `win.wav` | Level gewonnen | Warme Erfolgsfanfare |
| `lost.wav` | Level verloren | Sanfter Abschluss |
| `rocket.wav` | Eine alte Reihe/Spalte aktiviert | Luftiger Sweep und Glanz |
| `bomb.wav` | Eine alte Bombe aktiviert | Weicher Bass und Splitter |
| `prism.wav` | Eine alte Regenbogenperle aktiviert | Gestaffelte Kristallnoten |
| `mega.wav` | Mindestens zwei alte Specials gemeinsam aktiviert | Kraftvoller mehrstimmiger Ausklang |
| `wind.wav` | Wind-Wunder | Luftzug und hohe Glocken |
| `tide.wav` | Flut-Wunder | Wellenschub und Perlen |
| `bloom.wav` | Blueten-Wunder | Aufbluehender Akkord |
| `charge.wav` | Ladung erreicht neu 100; Partie laeuft weiter | Zweiton-Bereitschaft |
| `restoration.wav` | Erstmaliger Ausbau-Meilenstein nach einem Sieg | Eigene kleine Welt-Fanfare |

Alle Dateien befinden sich unter `assets/audio/`. Native WAV und Browser-PCM stammen aus `ui/sounds.mjs`. Format: 22.050 Hz, mono, PCM16-WAV. Die Generatoren sind deterministisch. Der Browser nutzt intern Float32-PCM; Tests vergleichen WAV-Erzeugung und eingebundene Dateien.

## Synchronisation

Normale Bewegung: Effekt am Anfang des Burst-Frames, Ergebnis beim Ende der Darstellung. Es werden hoechstens sechs Kaskadenframes animiert; die vollstaendige Brettaufloesung findet dennoch im Kern statt. Folgeframes werden nicht nachtraeglich vertont, wenn keine zugehoerige Animation angezeigt wird.

Reduzierte Bewegung: sofortiger Endzustand, ein dominanter Effekt und nach 350 ms gegebenenfalls der Abschluss. Nach der Sieg-Fanfare folgt ein neuer Ausbauklang mit 950 ms Abstand. Diese Verzoegerungen betreffen nur Audio, nicht Spiellogik oder Eingabefreigabe. Sehr schnelles Weiterspielen darf ausstehende Fanfaren abbrechen.

Wunder-Typen haben auf dem ersten Frame Vorrang; danach folgen Mehrfach-Special, Regenbogen, Bombe, Rakete, Kaskade und Match. Keine zufaellige oder RNG-veraendernde Soundentscheidung.

## Mix und Lebenszyklus

Maximal drei Stimmen einschliesslich ausstehender Starts. Gleicher Cue startet seine Stimme neu. Native Lautstaerke und Browser-Mastergain sind 0,5. Neue Rohsignale werden bei Bedarf auf Peak 0,5 begrenzt; alle Dateien haben weiche Ein-/Ausblendungen und bestehen den Peak-/Finite-Test. Das ist keine psychoakustische Lautheitsmessung oder Geraete-Abnahme.

Pause, Regeln, andere Menues, Hintergrund, Stummschaltung und Unmount stoppen aktive Stimmen und geplante Folgeereignisse. Generationen-Guards verhindern Wiedergabe nach einem verspaeteten Unlock/Seek. Das iOS-Stummschalter-Verhalten bleibt respektiert; keine Aufnahme- oder Background-Berechtigung. Die verwendeten Optionen sind im offiziellen [Expo-SDK-55-Audioreferenz](https://docs.expo.dev/versions/v55.0.0/sdk/audio/) dokumentiert.

## Hoerprobe

```sh
npm run audio:assets
npm run audio:preview
```

`dist/Wunderkapseln-soundcheck.html` enthaelt 14 Einzeltests und eine abspielbare Effekt-Sieg-Ausbau-Abfolge. `dist/Wunderkapseln-ability-showcase.wav` enthaelt neun neue Effekte, getrennt durch 300 ms Stille. Diese Hoerproben aendern keine Spielstaende.

## Noch auf Geraeten abnehmen

iPhone-Lautsprecher und Stummschalter, iPad, Android-Lautsprecher, kabelgebundene und Bluetooth-Ausgabe; Lautstaerke niedrig/hoch; Kopfhoerer-Abziehen; Systemunterbrechung; wiederholter Neustart und App-Hintergrund. Pruefen, dass Ton aus keinen Gameplay-Nachteil verursacht. Browser-Startaufrufe sind kein Beleg fuer tatsaechlich gehoerten nativen Ton.

## Native Suchlauf-Reihenfolge seit 0.4.2

`native/player-adapter.mjs` wartet auf den Abschluss eines alten seekTo, bevor derselbe Player erneut positioniert wird. Nach jeder asynchronen Grenze werden Generation, aktuelle Stimme und Freigabestatus geprueft. Unterschiedliche Sound-Player bleiben parallel; die bestehende Obergrenze von drei Stimmen und die 14 WAV-Dateien bleiben unveraendert. Stop/Unmount verhindern verspaetete Starts, fehlgeschlagene Suchlaeufe blockieren den naechsten Versuch nicht dauerhaft. Ein nativer Suchlauf ohne Rueckkehr kann weitere Aufrufe desselben Players weiter aufhalten; das erfordert Geraetepruefung, keine unsichere Parallelisierung. Hook-eigene Player werden nicht doppelt released. Siehe [NATIVE_RUNTIME.md](NATIVE_RUNTIME.md) fuer Tests und Betriebssystemgrenzen.
