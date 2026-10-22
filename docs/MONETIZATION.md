# Monetarisierung - vorbereiteter Vertrag, noch nicht aktiviert

## Status

Die Alpha verarbeitet keine echten Zahlungen. Sie enthaelt keinen StoreKit-/Play-Billing-Adapter, keine Server-Verifikation und kein Werbe-SDK. Vorhandenes Inventar und Aktivierung sind Spiellogik, kein Zahlungsnachweis. Der Shop zeigt Verfuegbarkeit nicht faelschlich an.

## Vorgeschlagener Startkatalog

IDs sind Vorschlaege, nicht in Store-Konsolen registrierte Produkte. Preise sind Testannahmen in EUR, keine Store-Antworten oder nachgewiesene Wirtschaftlichkeit.

| ID-Vorschlag beider Stores | Inventarschluessel | Verbrauchsgut / Zuteilung | Testpreis |
|---|---|---|---|
| `wk_lives_5` | `lives5` | Ein aktivierbares Paket, danach fuenf Reserveleben | 0,99 EUR |
| `wk_time_60` | `time60` | Ein aktivierbares Paket, danach 3.600 aktive Sekunden | 1,99 EUR |
| `wk_time_240` | `time240` | Ein aktivierbares Paket, danach 14.400 aktive Sekunden | 3,99 EUR |

Das vorhandene `time10`-Geschenk ist einmalig pro lokalem Alpha-Profil und kein Kaufartikel. Boosterpakete und kosmetische Steine waren akzeptierte Ausbauideen, aber haben noch keine implementierte Zuteilung; deshalb nicht als kaufbare Produkte vorbereiten. Kein Abo, keine Zwangswerbung, keine Lootboxen.

## Fairnessvertrag

Herzen maximal fuenf, Regeneration 25 Minuten. Reserveleben verfallen nicht an vollen Herzen. Naturherzen werden vor Reserve verbraucht. Kaufzeit beginnt erst bei eigener Aktivierung; Vorraete sind vor Aktivierung keine laufenden Timer. Zeit stoppt bei Hintergrund, Pause, Ergebnis, Menue und blockierender Animation. Ein geschuetzt gestarteter Versuch bleibt bis zu seinem Ende geschuetzt. Das muss auf der Angebotsseite deutlich formuliert werden. Bei Kapazitaetsgrenzen darf ein bezahltes Paket weder verschwinden noch still verworfen werden.

## Transaktionsarchitektur fuer die naechste Implementierung

Produktdaten und lokalisierte Preise ausschliesslich vom jeweiligen Store laden. Abbruch, pending/deferred und Netzfehler muessen ohne Zuteilung enden. Verifizierte Transaktionen in einem serverseitigen, eindeutig indizierten Journal mit Produkt-/App-/Umgebungs-/Nutzerzuordnung speichern. Zuteilung und Idempotenz atomar ausfuehren; danach Store-Transaktion abschliessen bzw. Verbrauch bestaetigen. Ein Retry oder doppelter Callback darf niemals doppelt fuellen. Keine Empfangsdaten oder Tokens in Klartext-Logs.

Google empfiehlt Kaufverifikation vor Zuteilung, Status PURCHASED statt PENDING und sichere Deduplizierung; Verbrauch/Quittierung muss zum Produkttyp passen. Siehe [Play Billing security](https://developer.android.com/google/play/billing/security). Apple dokumentiert Lieferung vor Abschluss und die Verarbeitung wiederholter unbeendeter Transaktionen; siehe [Apple IAP lifecycle](https://developer.apple.com/documentation/StoreKit/offering-completing-and-restoring-in-app-purchases).

**Verbrauchsgueter werden nicht durch einen beliebigen Restore-Knopf erneut geschenkt.** Fuer Geraetewechsel und Neuinstallation braucht der verbleibende bezahlte Vorrat ein eigenes verifiziertes Wiederherstellungskonzept. Keine Cloud-Sicherung behaupten, solange kein Account-/Entitlementdienst existiert. Diese Produktentscheidung ist vor echten Verkaeufen ein Release-Blocker.

## Freiwillige Belohnungswerbung

Spaeter maximal eine klar angekuendigte Belohnung pro freiwillig abgeschlossenem Vorgang. Nicht bei Tap, Ladebeginn oder normalem Schliessen belohnen. Netzwerk-/Consentfehler duerfen keinen Zug oder kein Leben kosten. Serverseitige Signatur-/Transaktionspruefung vorbereiten und Callback-Wiederholungen deduplizieren. Google beschreibt [SSV und dessen UX-Abwaegung](https://developers.google.com/admob/android/ssv); die genaue Belohnungsstrategie ist vor Einbau festzulegen.

Vor Werbe-SDK: Consent-/Privacy-Optionen, Datenfluss, Alterszielgruppe, echte Test-IDs und aktualisierte Store-Angaben. [UMP-Dokumentation](https://developers.google.com/admob/android/privacy) als Implementierungsreferenz, nicht als pauschaler Rechtskonformitaetsnachweis.

## Abnahme

Sandbox-Faelle fuer erfolgreichen Kauf, Abbruch, pending, Netzverlust vor/nach Verifikation, Neustart vor/nach Zuteilung, doppelte Zustellung, volle Herzen, volle Inventarkapazitaet, Erstattung, Kaufwiederherstellung und Geraetewechsel. Kein echtes Geld bis alle Faelle nachvollziehbar bestanden sind.
