# Aenderungen 0.4.1 - native Build-Vorbereitung

## Implementiert

Explizite Bootstrap-/npm-ci-Auswahl mit struktureller Lockfile-Pruefung; normale Builds erzeugen keinen Ersatz-Lock. App-IDs, Versionen, Buildnummern und kanonische Iconpfade werden vorab abgeglichen. Installer und Offline-Check geben eindeutige Fehler aus und behaupten keinen nativen Build.

Neue lesende Pruefung der echten APK-Manifestdaten und generierter/aufgeloester iOS-Info.plist. Erlaubte Berechtigungen sind eng begrenzt; App-ID, Background-Faehigkeiten und Android-Release-Debugflag werden kontrolliert. iOS-Platzhalter duerfen nur in ausdruecklich markierter Konfigurationspruefung bestehen bleiben.

Ein gemeinsamer Lockfile-Aufloesungsjob mit demselben Lock-Artefakt fuer beide Exports und den optionalen internen APK-Job. Keine automatische Erstaufloesung, kein macOS-Runner, keine Store-Aktion. Android-APK wird vor Artefaktbereitstellung auf Paketmanifest und Entwicklungszertifikat geprueft. Diese YAML wurde lokal geprueft, aber nicht bei GitHub ausgefuehrt.

45 Build-Tests gegen die 112 bisherigen Tests; zusaetzlich 14 Tests fuer die vom Nutzer vorgegebene Apple-Zuordnung. Build-Anleitung, Release-Gates, Quellen und Entwickler-Uebergabe aktualisiert. App-Version 0.4.1 / interne Buildnummer 5. Keine Produktregistrierung oder Kaufaktivierung.

## Apple-Zuordnung

iOS: WonderCaps, Bundle-ID `com.kamilunavo.wondercaps`, SKU `wondercaps-001` nur als Store-Metadatum. Anzeigename und Bundle-Name in iOS-Info.plist gesetzt. Pruefer erwarten die korrekte separate Plattformkennung statt faelschlich zwei gleiche IDs. Apple-Setup und getrennte deutsche/englische Apple-Store-Textentwuerfe hinzugefuegt. Der Nutzer meldet vorhandenen Apple-Datensatz und Vollzugriff; kein Remote-Kontoabgleich oder Upload.

## Unveraendert

Gameplay, UI, Native-Client, Speicherdatenmodell, Miniaturweltgrafiken, kanonisches App-/Startsymbol und alle 14 Klangdateien. Vorschau und Klangatelier behalten denselben Inhalt wie 0.4.0. Daher keine neue Grafik- oder Soundversion behauptet.

## Blockiert

Native npm-Installation: `getaddrinfo EAI_AGAIN registry.npmjs.org`. Kein echter Lock, Metro-Export, APK/AAB/IPA oder Geraetetestergebnis. Fruehere GitHub-Schreibsperre wurde nicht mit einem anderen Transportweg umgangen.
