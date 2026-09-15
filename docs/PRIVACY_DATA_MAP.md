# Technisches Dateninventar - Alpha 0.4.0

**Arbeitsunterlage, keine fertige Datenschutzerklaerung und keine Rechtsberatung.** Der Quellstand ist lokal analysiert; das spaetere signierte Binary, seine SDKs und echte Netzwerkverbindungen muessen vor Store-Angaben geprueft werden.

| Daten | Aktueller Zweck/Ort | Aktuell an eigenen Dienst uebertragen? |
|---|---|---|
| Brett, RNG-Zustand, Level, Sterne, Versuch | Lokale Wiederaufnahme/Fortschritt | Kein eigener Endpunkt implementiert |
| Herzen, Reserve, Inventar, aktive Sekunden | Lokale Spiellogik | Kein eigener Endpunkt implementiert |
| Sprache, Ton, Bewegung, Haptik | Lokale Einstellungen | Kein eigener Endpunkt implementiert |
| Uhr-/Zeitwerte | Regeneration und Laufzeit | Kein eigener Endpunkt implementiert |
| Audio | Festes, synthetisiertes Asset | Kein Upload; keine Nutzeraufnahme |
| Konto, E-Mail, Standort, Kontakte, Fotos | Nicht fuer die Spielfunktionen erhoben | Kein entsprechender eigener Dienst |
| Zahlungshistorie und Werbedaten | Noch nicht implementiert | Erst nach spaeterer Integration neu bewerten |

Keine Mikrofon-/Fotoaufnahme. `app.json` schaltet Audioaufnahme und Hintergrundaudio aus und blockiert bestimmte Medienberechtigungen. Das final generierte Android-Manifest und iOS-Info.plist/Privacy-Manifeste sind trotzdem zu pruefen. Plattformdiagnose, Build-Dienste und spaeter hinzugefuegte SDKs nicht pauschal als datenfrei behandeln.

## Lokaler Speicher

Speicherung erfolgt in AsyncStorage bzw. im Browser-QA-Speicher. Es gibt keinen implementierten Konto-Loeschdienst, weil es keinen Account gibt. OS-Backup und Wiederherstellung koennen lokales Verhalten beeinflussen; vor einer oeffentlichen Zusage zur Loeschung/Neuinstallation auf Geraeten pruefen. Keine Verschluesselung der Profilpruefsumme behaupten.

## Vor Veroeffentlichung

Appbezogene Datenschutzseite mit tatsaechlichem Verantwortlichen und bestaetigten Kontaktdaten, Zwecken, Empfaengern, Aufbewahrung und Rechten erstellen und fachlich pruefen lassen. Keine Telefonnummern auf Produktseiten erfinden. Supportseite und EULA-Auswahl pruefen. Eine private Review-Kontaktangabe in einer Store-Konsole ist von einer oeffentlichen Produktseite zu unterscheiden.

Store-Formulare muessen alle relevanten SDKs und Endpunkte des fertigen Builds abdecken. Google verlangt zutreffende Angaben auch zu eingebundenen Drittanbieterbibliotheken; siehe [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469). Apple bezieht Drittpartnerpraktiken in [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/) ein. Aus diesem Dokument allein darf nicht automatisch die Antwort 'keine Datenerhebung' in die Konsolen geschrieben werden.

## Aenderung bei Monetarisierung

Vor Kauf-/Werbeintegration erneut inventarisieren: Transaktionskennungen, pseudonyme Zuordnung, Verifikationsserver, Logs, Werbe-ID, Consent, Crash/Analytics und Wiederherstellungsdienst. Alterszielgruppe bewusst entscheiden; eine breite spielerische Gestaltung ist keine automatische Freigabe fuer Kids-Kategorien. Keine Trackingfreigabe voraussetzen.
