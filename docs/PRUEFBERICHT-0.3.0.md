# Wunderkapseln - Alpha 0.3.0

## Neu umgesetzt

**Lebensreserve ohne Verlust:** Ein Paket mit fuenf Leben legt alle fuenf Leben in eine separate Reserve, auch bei bereits vollen Herzen. Normale Herzen regenerieren weiterhin alle 25 Minuten bis maximal fuenf. Erst wenn sie leer sind, verbraucht eine ungeschuetzte Niederlage ein Reserveleben. Start und Sieg kosten kein Leben. Vorhandene Ein-/Vier-Stunden-Pakete lassen sich jetzt in beiden Oberflaechen ausdruecklich aktivieren. Reale Kaeufe sind NICHT angeschlossen.

**Sicherer Speicherstart:** Ein voruebergehender Lesefehler startet kein leeres Ersatzprofil mehr. Beschaedigte Spielstaende ohne lesbare Sicherung und andere Formatversionen werden nicht still ueberschrieben. Es erscheint eine Wiederholen-Schaltflaeche. Eine gueltige Sicherung kann weiterhin wiederhergestellt werden. Alte Version-1-Spielstaende erhalten eine leere Reserve, ohne Fortschritt zu verlieren.

**Hilfreichere Zughinweise:** Die ersten drei Levels markieren vor dem ersten Zug einen sinnvollen Tausch. Manuelle Tipps richten sich nach sichtbaren Sammelzielen, Frost und Spezialsteinen. Sie kennen keine zukuenftigen Nachfuellungen und kosten weder Leben noch Zuege. Die Einblendung verschwindet, sobald sie nicht mehr zur Auswahl passt.

App-Symbol, Startsymbol, Weltengrafiken und Sounddateien wurden nicht veraendert; zehn zugrunde liegende Dateien sind byte-identisch zum Alpha-0.2.0-Archiv.

## Verifikation

- 91 automatisierte Unit-/Regressionstests bestanden. Erwartete Rotphasen neuer Tests und erfolgreiche Gruenphasen sind separat dokumentiert.
- 35 Browser-Pruefungen bestanden: 12 Basis-, 12 Ausbau/Audio- und 11 Speicher/Reserve/Hint-Pruefungen. Einschliesslich Smartphone-/Tablet-Breiten, Sicherungswiederherstellung, gesperrtem Speicherstart, realen Bedienaktionen und Tonwiedergabe. Die Speicheradapter dieser Tests sind kontrollierte Browser-Testadapter, keine echten nativen Datentraeger.
- 72 SVG-Kombinationen aus zwoelf Welten und sechs Ausbaustufen erfolgreich gerendert.
- Alle 480 Startfelder validiert.
- Sichtbarkeitsbasierter Kampagnentest: 480 Levels mal drei Versuche = 1.440 Partien. Ergebnis: 1.333 Siege, 107 Niederlagen, keine ungueltigen oder nicht aufgeloesten Spielfelder und keine nicht beendeten Partien. Der Strategiezugriff auf den verborgenen RNG ist technisch gesperrt.
- In drei Versuchen ohne Sieg: Level 98, 214, 230, 350, 430, 433 und 457. Diese sind fuer menschliche Tests priorisiert, NICHT als unloesbar klassifiziert. Bot-Ergebnisse sind keine menschlichen Erfolgsquoten und kein abschliessender Balancingnachweis.
- JSX-Syntax des nativen Einstiegs und Audio-Adapters sowie gemeinsame Icon-/Splash-Referenz geprueft. Das ist KEIN Android-/iOS-Build. Die Syntax-/SVG-Pruefungen nutzten bereits in der Umgebung installierte TypeScript-/Sharp-Werkzeuge; native Projektabhaengigkeiten wurden nicht installiert.

## Grenzen / offen

Keine APK, AAB oder IPA und kein physischer Geraetetest. Der Zugriff auf registry.npmjs.org scheiterte bei der DNS-Aufloesung; es gibt weiterhin keinen echten Dependency-Lockfile und keine installierten Expo/React-Native-Abhaengigkeiten. Keine StoreKit-/Google-Play-Billing-Anbindung, keine Belohnungswerbung und keine Store-Einreichung. Kein unabhaengiges Code-Review; lokales Diff-Review und Tests ersetzen dieses nicht.

Ein zusaetzlicher Test der HTML-Datei ueber file:// mit echtem localStorage wurde vor dem Laden durch die Browser-Administratorrichtlinie blockiert (ERR_BLOCKED_BY_ADMINISTRATOR). Er zaehlt NICHT zu den 35 bestandenen Browser-Pruefungen. Es wurde keine Umgehung dieser Richtlinie versucht. Der portable HTML-Export selbst ist gebaut; das direkte Oeffnen und Speichern haengt von der jeweiligen Browserumgebung ab.

Der vorhandene GitHub-Branch feature/playable-miniature-worlds wurde ausschliesslich gelesen: Er enthaelt weiterhin nur README.md. Kein erneuter Schreibversuch, Push, PR, Merge oder Workflow-Dispatch. Die Aenderungen werden als lokaler Quellcode geliefert.

## Dateien

Wunderkapseln-Vorschau-0.3.0.html: eigenstaendige Browser-Vorschau, keine native App.
Wunderkapseln-Alpha-0.3.0.zip: vollstaendiger Quellcode dieses Entwicklungsstands inklusive Tests und Pruefprotokollen, ohne node_modules, Zugangsdaten oder Signaturschluessel.
Wunderkapseln-Spielstart-0.3.0.png: Bildschirmaufnahme der echten Browser-Vorschau mit Starthinweis, kein natives Store-Bild.

Paketintegritaet: SHA256SUMS.json im Archiv listet die enthaltenen Dateien auf. Das entpackte Archiv wird erneut mit npm test geprueft; das Ergebnis wird separat ausgegeben.
