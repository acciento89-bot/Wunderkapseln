# Game Design - Wunderkapseln

## Identitaet und Ziel

Ein freundliches Match-3-Spiel fuer eine breite Casual-Zielgruppe. Die Gestaltung wirkt wie warme, plastische Miniaturwelten unter Glas. Das Spielfeld bleibt frontal, quadratisch und gut lesbar. Dies ist keine eigens als Kinder-App spezifizierte Anwendung; Alterszielgruppe und Store-Einstufung sind vor Release anhand des fertigen Produkts zu entscheiden.

## Kernschleife

Welt waehlen, freigeschaltetes Level starten, benachbarte Steine tauschen, Ziel innerhalb des Zuglimits erreichen, Sterne erhalten und die naechste Stufe oeffnen. Ungueltige Tausche verbrauchen keinen Zug. Tippen und Wischen benutzen dieselben Regeln. Laufende Versuche werden wiederaufgenommen. Replays verbessern Sterne, vergeben die Erstabschluss-Belohnung aber nicht erneut.

## Aktuell implementierte Regeln

Das Brett hat 8 x 8 Felder. Drei gleichfarbige Steine bilden einen Treffer. Vier in einer Reihe erzeugen einen Reihen-/Spalten-Spezialstein; fuenf erzeugen eine Regenbogenperle. Sich ueberschneidende Treffergruppen erzeugen eine Bombe. Reihen/Spalten leeren eine Linie; Bomben wirken auf das 3-x-3-Umfeld. Eine direkt getauschte Regenbogenperle richtet sich nach der Partnerfarbe; zwei Perlen treffen das ganze Brett. Andere zusammen aktivierte Specials loesen die vorhandenen Effekte aus. **Der neue Grosskombinations-Klang behauptet keine zusaetzliche, bislang nicht implementierte Spezial-Kombinationsregel.**

Bestehende Ziele sind Farbsammlungen und Frostschichten. Die Kampagne hat 480 deterministische Rezepte, zwoelf Welten mit je 40 Levels, verschiedene Frostmuster, vier bis sechs Farben und variierende Zug-/Zielwerte. Neue Brettformen, Ausgaenge und zu befreiende Figuren waren Konzeptideen; diese sind noch nicht implementiert.

## Wunderzuege

Treffer und erzeugte Specials fuellen die Ladung. Ein Wunderzug ist pro Versuch einmal ab 100 Ladung verfuegbar und kostet keinen regulaeren Zug. Die Faehigkeit wird verdient, nicht exklusiv verkauft.

| Typ | Aktuelles Verhalten | Welten |
|---|---|---|
| Bluete | Bis zu zwoelf Frostfelder treffen; ohne Frost die gewaehlte Farbe entfernen | Sternengarten, Pilzlichtwald, Honigatelier, Sonnenwerkstatt, Drachenhain |
| Wind | Gewaehlte Reihe verschieben und entfernen | Wolkenhafen, Mondbibliothek, Schneefunkeln, Traumkarussell |
| Flut | Gewaehlte Spalte entfernen | Korallenbucht, Kristallbucht, Aurorapalast |

## Fortschritt und Belohnung

Jede Welt hat fuenf sichtbare Ausbauschritte nach 8, 16, 24, 32 und 40 unterschiedlichen Siegen. Pro Erstabschluss werden 20 Funkel gespeichert; eine Verwendung dieser Waehrung ist noch nicht umgesetzt. Sterne werden nach uebrigen Zuegen berechnet: ein Stern bei Sieg, zwei ab drei Restzuegen und drei ab acht. Spaetere Levels duerfen fruehere nicht automatisch als erledigt markieren.

## Leben und aktive Spielzeit

Fuenf natuerliche Herzen, ein Herz alle 25 Minuten. Start und Sieg kosten kein Leben. Eine ungeschuetzte Niederlage oder bestaetigtes Aufgeben kostet ein Herz; erst bei leeren Herzen ein Reserveleben. Ein Lebenpaket legt fuenf volle Leben in die Reserve, ohne Ueberlauf an vollen Herzen. Ein laufender geschuetzter Versuch bleibt bis zu seinem Ende geschuetzt, auch wenn die Restzeit waehrenddessen null erreicht.

Aktive Zeit laeuft nur im Vordergrund, im spielbaren Level, ohne Modal und ausserhalb der Eingabe-blockierenden Animationen. Inventarpakete starten erst nach ausdruecklicher Aktivierung. Das Zehn-Minuten-Alpha-Geschenk ist kein Kauf.

## Design- und Balancing-Grenzen

Anfaengliche Zughinweise fuer Levels 1 bis 3, manuelle zielorientierte Tipps, DE/EN, abschaltbarer Ton und reduzierte Bewegung sind vorhanden. Grafiken verwenden zwoelf eigene Bauwerke und wiederverwendbare Formbausteine. Die Levelrezepte benoetigen menschliche Tests; insbesondere 98, 214, 230, 350, 430, 433 und 457 waren im historischen sichtbarkeitsbasierten Bot-Test ohne Sieg. Kein Bot-Ergebnis als menschliche Gewinnquote vermarkten.
