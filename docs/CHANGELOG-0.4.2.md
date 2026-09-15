# Aenderungen - Alpha 0.4.2

Interne Buildnummer 6. Identitaeten, Preise/Kaufvorschlaege, Spielsteine, Levelrezepte, Speicherformat und alle Sounds bleiben bestehen.

Android-Fokusverlust und iOS-inactive/background pausieren ueber einen getesteten Laufzeitadapter; dessen Taktgeber laeuft nicht im Hintergrund. Android-Pausen-/Ergebnisdialoge liegen im App-Fenster, damit kein eigener Dialog blur und eine Fortsetzungsblockade erzeugt. Screenreader erhalten keinen Zugriff auf die verdeckte Hauptansicht.

Nach Animationen und bei Zeitpaket-Aktivierung werden aktive Spielzeitintervalle korrekt getrennt. Fuer Wunderzuege wird die vorhergehende aktive Zeit abgerechnet, ohne Animationszeit abzuziehen.

Native Klangwiederholungen serialisieren seekTo pro Player. Veraltete, abgebrochene und freigegebene Startaufrufe duerfen nicht wiedergeben. Fehler lassen spaetere Startaufrufe weiterhin zu. Andere Player bleiben parallel moeglich.

Dokumentation und Store-Textentwuerfe DE/EN sind angepasst. Keine neue Store-Zuordnung, kein IAP-/Werbe-SDK, keine native Paketinstallation, kein Build, keine Signierung und keine Veroeffentlichung.
