# Pruefbericht - Alpha 0.4.0

## Umsetzung

Neun neue Originaleffekte fuer Rakete, Bombe, Regenbogen, Grosskombination, Wind, Flut, Bluete, volle Ladung und Ausbau. Zusammen 14 Sounds. Native statische WAV-Quellen und Browser-PCM nutzen denselben Synthesizer. Frames werden zeitlich zu ihren Bursts vertont, Sieg/Niederlage und Ausbau danach. Maximal drei Stimmen; geplante und asynchrone Starts sind bei Pause, Hintergrund, Stummschaltung und Navigation abbrechbar.

Spielregeln, Speicherung, Lebens-/Zeitmodell und bestaetigte Grafikrichtung bleiben bestehen. Zehn Bestandsdateien (Icon/Grafikgrundlagen und fuenf Sounds) sind per SHA-256 unveraendert gegen das Alpha-0.3-Archiv. Kein neues Kombinationsregelwerk wird durch den neuen Klang behauptet.

Markdown-Unterlagen fuer GDD, Architektur, Audio, Build, QA, Monetarisierung, Datenschutzinventar, Store-Texte DE/EN, Review, Roadmap und Entwickler-Uebergabe sind enthalten. Store-Daten sind explizite Entwuerfe; keine echten Produkte registriert.

## Aktuelle Verifikation

112 automatisierte Unit-/Regressionstests bestanden im frischen Lauf, null Fehler. Auch nach Entpacken des Source-ZIP bestehen alle 112 Tests. Spielvorschau und Klangatelier wurden daraus erneut erzeugt und sind byte-identisch zu den ausgelieferten HTML-Dateien. Der Nachweis steht in docs/qa/0.4.0/unit-tests.tap. Die drei bestehenden Browser-Suiten bestehen mit 35 Pruefungen; die neue Audio-Suite mit 16. Insgesamt 51 Browser-Pruefungen. Alle 480 Startbretter validiert. 72 SVG-Welt-/Ausbaustufen-Kombinationen gerendert. Native JSX-Syntax, kanonische Iconreferenz und Audio-Berechtigungseinstellungen geprueft.

Browser-Audio wird anhand realer AudioBufferSourceNode-Startaufrufe und PCM-Signaturen identifiziert. Dies ist kein physischer Hoertest. Browser-Spielstaende sind kontrollierte QA-Adapter, kein nativer Speichertest. Vorhandene Browser-Dedup-Tests wurden an die absichtlich neue mehrteilige Tonfolge angepasst; separate Tests pruefen deren genaue Reihenfolge und Abbruch.

## Nicht ausgefuehrt / offen

Keine native Dependency-Installation oder Lockfile-Erzeugung: DNS-Aufloesung von registry.npmjs.org scheiterte. Die Syntax-/SVG-Pruefung verwendete vorinstallierte TypeScript-/Sharp-Werkzeuge. Keine APK/AAB/IPA, kein Metro-Export und kein Xcode-/Gradle-Geraetebuild; kein physischer Lautsprecher-/Bluetooth-/Silent-Switch-Test. Kein unabhaengiges Code-Review. Keine aktuelle menschliche Balancing-Abnahme.

Keine StoreKit-/Play-Billing-/Werbeintegration. Kein Backend, keine Verbrauchsgueter-Wiederherstellung ueber Geraete, keine fertigen Datenschutz-/Supportseiten und keine Store-Einreichung.

## GitHub

Der Zielbranch feature/playable-miniature-worlds wurde zu Beginn erneut gelesen; Head war 26bd85ea34eec78f43b017ad7e1e7dadd49ee5df und der Inhalt README-only. Der erneute GitHub-create_tree-Aufruf fuer den ersten Transferteil (Audio-Spezifikation und Voice-Pool) war erfolgreich: Tree 4e783a7af3754e8e4495a5404f24402a65bbcf88. Es wurde noch kein Commit erstellt und keine Branch-Referenz auf diesen Tree gesetzt. Damit ist der komplette Quellcodeimport weiterhin offen; der sichtbare Branch bleibt README-only. Kein PR, Merge, CI-Dispatch oder Store-Upload. Die vollstaendige Alpha und alle Markdown-Dateien werden als gepruefte lokale Archive geliefert. Dieser erfolgreiche Staging-Schritt wird nicht als vollstaendiger Upload dargestellt.

## Artefakte

Source-ZIP ohne node_modules, git-Verzeichnis, Secrets oder Signaturschluessel. Portable HTML-Spielvorschau, HTML-Klangatelier, WAV-Hoerprobe und Markdown-Paket. Native Quelltexte sind enthalten; HTML ist kein Ersatz fuer die native App. SHA256SUMS.json deckt die ausgelieferten Projektdateien ab.
