# Wunderkapseln - spielbare Alpha 0.2.0

## Neu umgesetzt

Zwölf eigenständige Bauwerke und passende Hintergründe statt drei wiederverwendeter Grundmotive. Darunter Mondbibliothek, Honigatelier, Drachenhain, Traumkarussell und Aurorapalast. Glasglocken-Look und Spielsteine bleiben erhalten. Das kanonische App-/Startsymbol ist unverändert.

Jede Welt hat fünf sichtbare Ausbau-Meilensteine nach 8, 16, 24, 32 und 40 unterschiedlichen Level-Siegen. Die Anzeige nennt das nächste Detail und den verbleibenden Fortschritt. Der erste Sprung über einen Meilenstein wird gefeiert; Wiederholungen erzeugen keine doppelte Feier oder Belohnung.

Fünf lokal erzeugte Klang-Effekte für Matches, Kettenreaktionen, Wunderzüge, Siege und Niederlagen. Ton ist abschaltbar. Keine Mikrofonaufnahme, kein Hintergrund-Audio, kein Audio-Netzwerkdienst. Die native Audio-Anbindung ist im Quellcode vorhanden; echte native Wiedergabe ist noch nicht auf Geräten geprüft.

Verspätete Eingaben außerhalb des Spielfelds werden verworfen. Zurück-Navigation, Hintergrundwechsel bei Ergebnisanimationen und wiederholtes Laden des Spielstands wurden korrigiert. Die Systemeinstellung für reduzierte Bewegung überschreibt nicht mehr dauerhaft die Spieleinstellung. Beschädigte Sternzeichen der nativen Ergebnisanzeige wurden ersetzt.

## Tatsächlich geprüft

- 67 automatisierte Node-Tests bestanden, null Fehler.
- 24 Browser-Prüfungen bestanden, einschließlich echter Web-Audio-Startaufrufe, Stummschaltung, Meilensteinen, alter Speicherstände, Zurück-Navigation und Layouts von 320 bis 1024 Pixeln Breite.
- 72 SVG-Welt-/Ausbaustufen-Kombinationen erfolgreich gerendert: zwölf Welten mit Grundzustand plus fünf Ausbaustufen.
- Alle 480 Startfelder auf gültige Spielzustände, fehlende automatische Startmatches und vorhandene Züge geprüft.
- Alle 480 Levels in einem deterministischen Belastungstest beendet: 460 Siege, 20 Niederlagen, keine ungültigen Bretter und keine nicht beendeten Partien. Der Testspieler kennt Nachfüll-Ergebnisse; dies ist KEINE menschliche Erfolgsquote und KEIN vollständiger Lösbarkeits- oder Balancingnachweis.
- Syntaxprüfung für den nativen Einstieg und Audio-Adapter erfolgreich. Das ist KEIN nativer Build.

## Noch offen

Keine APK, AAB oder IPA. Native Paketinstallation und Build bleiben ungeprüft, da die npm-Registry hier nicht aufgelöst werden konnte. Kein echter Dependency-Lockfile. Kein physischer Gerätetest und kein unabhängiges Code-Review.

StoreKit/Google Play Billing und Belohnungswerbung sind noch nicht implementiert. Reale Zahlungen bleiben deaktiviert. Menschliche Spieltests, Schwierigkeits-Balancing und Store-Vorbereitung stehen aus.

In dieser Runde kein GitHub-Push, kein PR, kein Merge, kein CI-Dispatch und keine Store-Einreichung. Der Quellcode wird lokal als ZIP geliefert; der frühere gesperrte Upload wird nicht als erfolgreich dargestellt.

## Dateien

Wunderkapseln-Vorschau-0.2.0.html ist die eigenständige Browser-Vorschau, keine native App. Das ZIP enthält React-Native-Quellcode, gemeinsame Regeln, Grafiken, Tondateien, Tests und Prüfprotokolle. Bestehende Version-1-Spielstände sind kompatibel.

Die beigefügten UI-Bilder stammen aus dem Browser-Test, nicht von einem Android-/iOS-Gerät und nicht aus einem Store-Release.
