# Native Laufzeit - Alpha 0.4.2

## Umfang

Kein neues Gameplay, keine neuen SDKs, keine Design-Neuerstellung. Apple bleibt WonderCaps / com.kamilunavo.wondercaps / SKU wondercaps-001. Android bleibt com.kamilunavo.wunderkapseln. Alle 14 WAV-Dateien, Icon/Splash und Welten bleiben erhalten.

## Fokus und Unterbrechungen

`native/runtime.mjs` verbindet den bestehenden GameController mit AppState. Android besitzt zusaetzlich focus/blur; ein Benachrichtigungsfenster kann die App sichtbar lassen und dennoch die Interaktion unterbrechen. Nur active UND vorhandener Fokus starten den 250-ms-Takt. Beim Verlust wird die aktive Zeit bis zur Grenze abgerechnet, die Animation beendet, der laufende Versuch gespeichert und die Pause bzw. das Ergebnis erhalten. Rueckkehr setzt den Versuch nicht ungefragt fort.

Zustandswechsel und Fokus werden getrennt gespeichert, damit focus vor active den Hintergrund nicht aufhebt und active vor focus nicht zu frueh weiterlaeuft. iOS verwendet active/inactive/background. Abgemeldete Listener und Taktgeber duerfen nach Unmount nicht neu aktivieren.

## Android-Dialoge ohne Fokus-Schleife

Android-native Dialogfenster koennen selbst blur erzeugen. Wuerde jede Pause ein solches Fenster erzeugen, koennte die Rueckkehr blockieren oder eine Sieg-Fanfare abgebrochen werden. `native/modal.mjs` erstellt daher fuer Android eine native View-Ebene im selben Activity-Fenster. Die vorhandenen Inhalte, Abmessungen und Schaltflaechen bleiben gleich. iOS nutzt weiterhin React Natives Modal. Der Android-Overlay wird unmittelbar ein-/ausgeblendet; der bisherige native Fenster-Fade wird dort nicht verwendet.

Die darunterliegende Oberflaeche ist bei geoeffnetem Dialog fuer Screenreader verborgen. Hardware-Zurueck und Accessibility-Escape nutzen die bestehende close/back-Logik. Fokusfuehrung und Lesereihenfolge muessen auf TalkBack und VoiceOver physisch getestet werden.

## Aktive Spielzeit

`core/controller.mjs` setzt den Beginn des naechsten abrechenbaren Intervalls nach Animationsabschluss bzw. Abbruch neu. So wird der Abstand zum letzten 250-ms-Puls nicht teilweise als Spielzeit nachberechnet. Aktivierung eines Zeitpakets und Ausloesen eines Wunderzugs rechnen zuvor tatsaechlich aktive Zeit ab. Der 2-Sekunden-Stall-Deckel, Lebensreserve, geschuetzter Versuch und Speicherformat sind unveraendert.

## Native Audiostarts

`native/player-adapter.mjs` verwaltet eine Promise-Kette je hook-eigenem Player. Ein alter seekTo-Aufruf muss abgeschlossen sein, bevor derselbe Player einen neueren seekTo-Aufruf erhaelt. Unterschiedliche Player werden nicht global serialisiert; das vorhandene Drei-Stimmen-Limit bleibt bei createVoicePool.

Generationszaehler und isCurrent verhindern Wiedergabe nach Stop, Ersetzung oder Unmount. Fehlgeschlagene Suchlaeufe blockieren spaetere Wiederholungen nicht dauerhaft. useAudioPlayer besitzt weiterhin die native Freigabe; der Adapter gibt diese Objekte nicht doppelt frei. Es gibt keine neuen Dateizugriffe, Mikrofonrechte oder Hintergrund-Audiofunktionen.

## Reproduzierbare Offline-Grenztests

```sh
node --test tests/active-time-boundaries.test.mjs tests/native-runtime.test.mjs tests/native-player-adapter.test.mjs tests/native-modal.test.mjs
npm test
```

Die Tests verwenden den echten Controller, das echte Feedback-System und die echten Adapter. AppState, AudioPlayer und React-Elementerzeugung werden an ihrer Grenze kontrolliert simuliert. Sie beweisen JavaScript-Verhalten unter diesen Ereignissen, nicht die tatsaechliche Zustellung durch Android/iOS oder eine erfolgreiche native Wiedergabe.

## Physische Abnahme vor Release

- Android: Benachrichtigungsleiste, Schnelleinstellungen, Home, Displaysperre; jedes Mal bleiben Zeit/Versuch erhalten, Rueckkehr zeigt Pause.
- Android: Pause, Regeln, Abbrechen, Ergebnis und naechstes Level mehrfach oeffnen; kein Dialog-Fokus-Deadlock, kein unsichtbarer Touchblocker.
- iOS: Kontrollzentrum, App-Umschalter, Anrufunterbrechung; keine laufende Zeit oder spaete Toene.
- Beide: rasche Raketen-/Bombenfolgen, Lautlos, Kopfhoerer/Bluetooth und Ton aus/ein pruefen; dann TalkBack/VoiceOver mit offenen Dialogen testen.

## Primaerquellen, geprueft am 14.09.2026

[React Native AppState](https://reactnative.dev/docs/appstate) dokumentiert Android focus/blur unabhaengig von change. [React Native Issue 36865](https://github.com/react/react-native/issues/36865) dokumentiert Modal-/Alert-bedingtes blur; es ist ein historischer Reproduktionsfall, kein Geraetetest dieses Projekts. [Expo SDK 55 Audio](https://docs.expo.dev/versions/v55.0.0/sdk/audio/) dokumentiert asynchrones seekTo und hook-eigene Player-Freigabe.
