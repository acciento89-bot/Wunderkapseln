# Architektur und Datenfluss

## Modulgrenzen

| Bereich | Verantwortung | Darf nicht |
|---|---|---|
| `core/game.mjs` | Deterministische Brettregeln, Swaps, Kaskaden, Wunder, Validierung | Auf Uhr, Audio, Netzwerk oder Kauf-SDK zugreifen |
| `core/levels.mjs` | 480 Rezepte und Weltenkonfiguration | Fortschritt speichern |
| `core/profile.mjs` | Herzen, Reserve, aktive Sekunden, Inventar, Sterne | Reale Zahlungen bestaetigen |
| `core/session.mjs` | Versuch starten, abschliessen, einmalig abrechnen | Spielergebnisse doppelt abrechnen |
| `core/storage.mjs` | Versioniertes JSON, Integritaetscheck, Sicherung, serielle Schreibqueue | Lesefehler durch leeren Spielstand ueberschreiben |
| `core/controller.mjs` | Eingaben, Animationen, Vordergrund, Navigation, Speichern, Feedback-IDs | Audio als Voraussetzung fuer Spielzuege behandeln |
| `core/feedback.mjs` | Effekte aus Ergebnis/Frames planen; Folgeereignisse abbrechen | Bretter, Leben oder Entitlements aendern |
| `core/voice-pool.mjs` | Maximal drei laufende oder startende Stimmen; Generationenabbruch | Nach Pause alte Starts fortsetzen |
| `ui/sounds.mjs` | Deterministische Float32-PCM- und PCM16-WAV-Erzeugung | Mikrofon, Downloads oder Zufallsaufnahmen verwenden |
| `native/useGameAudio.js` | Statische Metro-Assets, expo-audio-Player, Lifecycle | Background-Audio oder Aufnahme aktivieren |
| `web/audio.mjs` | Browser-Buffer aus denselben PCM-Regeln | Native App ersetzen |
| `App.js`, `web/app.mjs` | Plattformspezifische Darstellung derselben Controller-Daten | Eigene abweichende Spielregeln erfinden |

## Ein Zug

```text
Eingabe -> acceptsInput -> Session-Reducer -> reine Brettregeln
       -> neuer Session-Zustand + Animationsframes + kosmetische Metadaten
       -> sofort in Schreibqueue
       -> Burst-/Fall-Animationen und einmalige Feedback-IDs
       -> Ergebnisdialog und gegebenenfalls Fanfare
```

`swap` fuegt `triggeredSpecials` hinzu. `useWonder` fuegt `wonder` hinzu. Diese Metadaten sind nicht Teil der gespeicherten Spielregeln und erfordern keine Save-Migration. Alte Specials werden nur bei tatsaechlich geloeschten Feldern als aktiviert behandelt; ein neu erzeugtes Special ist kein abgeschossenes Special.

## Speicher und Wiederherstellung

Native Speicherung laeuft ueber AsyncStorage, Browser-QA ueber localStorage. Der Spielstand umfasst Profil, Brett, RNG-Zustand, Versuch, Schutzflag und Abrechnungsstatus. Hauptdatei und Sicherung werden validiert. Unlesbarer Speicher bzw. unbekannte Version sperren den Start und erlauben Wiederholen, statt alte Daten zu vernichten. Version-1-Daten bleiben kompatibel.

Die Integritaetspruefsumme erkennt zufaellige Beschaedigung. Sie ist weder Verschluesselung noch Manipulationsschutz oder Zahlungsnachweis. Vor bezahlten Verbrauchsguetern sind ein verifiziertes Transaktionsjournal, Wiederherstellungskonzept und atomare Zuteilung noetig.

## Audio-API

```js
feedbackPlan(result, {kind, initialCharge, milestone}); // {frames, settled}
compactFeedback(plan); // {cue, followups:[{cue, delayMs}]} oder null
createFeedbackDriver(adapter, {schedule, cancel}); // update(state, foreground), dispose()
createVoicePool(adapter, {maxVoices:3}); // play(cue), stop(), dispose()
```

Der Voice-Pool reserviert Plaetze vor asynchronem Laden/Seek. Ein Guard verwirft alte Ruecklaeufe. Gleiche Klaenge ersetzen sich; die vierte Stimme verdraengt die aelteste. Ein neu eintreffendes Feedback-Event verwirft alte ausstehende Fanfaren, laesst bereits begonnene Effekte aber innerhalb der Pool-Grenze ausklingen.

## Bewusste Grenzen

Kein Backend, kein Account, keine Cloud-Synchronisation, kein Analytics-/Werbe-/Kauf-SDK. Die Architektur bereitet diese Integrationen nicht durch Fake-Erfolge vor. Der native Quellcode ist vorhanden; Metro und native Compiler muessen noch auf echten Projektabhaengigkeiten laufen.

## Native Laufzeitgrenzen seit 0.4.2

`native/runtime.mjs` uebertraegt AppState sowie Android focus/blur auf den Controller und besitzt den Vordergrund-Taktgeber. `native/modal.mjs` vermeidet auf Android ein zweites Fenster fuer Spiele-Dialoge; iOS behaelt Modal. `native/player-adapter.mjs` serialisiert native seekTo-Aufrufe je Player, ohne unterschiedliche Klaenge global zu blockieren. `native/useGameAudio.js` besitzt nur Hooks, Asset-Zuordnung und Verdrahtung. Details, Grenzen und physische Abnahme stehen in [NATIVE_RUNTIME.md](NATIVE_RUNTIME.md).
