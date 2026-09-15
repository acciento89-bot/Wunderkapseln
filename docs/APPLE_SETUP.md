# Apple-App-Zuordnung - WonderCaps

## Vom Nutzer vorgegeben am 14.09.2026

| Feld | Wert | Nachweis |
|---|---|---|
| App-Name | `WonderCaps` | Im Gespraech bestaetigt |
| Bundle-ID | `com.kamilunavo.wondercaps` | Im Gespraech bestaetigt |
| SKU | `wondercaps-001` | Im Gespraech bestaetigt |
| Zugriff | Vollzugriff laut Nutzer | Kein technischer Kontoabgleich in dieser Sitzung |

Der Nutzer hat den Apple-Datensatz nach eigener Angabe bereits angelegt. Diese Konfiguration ordnet den vorhandenen Quellcode diesem Datensatz zu. Kein neuer App-Datensatz und keine In-App-Kaufprodukte wurden von hier angelegt. Weder numerische Apple-App-ID noch Team-ID oder Signaturprofil sind hier verifiziert. Keine erfundenen IDs in EAS, Fastlane oder Xcode einsetzen.

## Lokale native Konfiguration

`app.json`: `expo.ios.bundleIdentifier` ist `com.kamilunavo.wondercaps`. `expo.ios.infoPlist.CFBundleDisplayName` und `CFBundleName` sind `WonderCaps`. Aktuell `expo.version` 0.5.0 und `expo.ios.buildNumber` 7. Vor einem ersten Upload die in App Store Connect angelegte Versionsnummer mit der tatsaechlich gebauten App abgleichen; 0.5.0 ist der lokale Alpha-Stand, keine aus Apple gelesene Versionsnummer.

Der interne Expo-Projektname/Slug und das GitHub-Repository bleiben Wunderkapseln. Deshalb kann ein generiertes Xcode-Projekt weiterhin diesen internen Namen tragen, waehrend das installierte iOS-App-Label WonderCaps lautet. Das ist keine zweite App.

Android bleibt `com.kamilunavo.wunderkapseln` mit dem bisherigen Namen. Keine Android-Paketmigration wurde beauftragt. App-Symbol, Splash-Grafik, Spielwelt, die 14 Sounds und der lokale Speicherschluessel bleiben unveraendert. Ein Wechsel einer bereits installierten nativen Bundle-ID wuerde nicht automatisch deren Sandbox-Daten migrieren; ein solcher Geraetebestand wurde hier nicht nachgewiesen.

## SKU ist kein technischer Bundle- oder Kaufbezeichner

`wondercaps-001` bleibt nur in Store-Unterlagen bzw. `docs/store-metadata.json` unter `apple.sku`. Die SKU ist eine interne App-Store-Connect-Kennung und nicht die numerische Apple ID, Bundle-ID, Signier-Team-ID oder ID eines Lebenspakets. Nicht als IAP-Produkt oder nativen Bundle-Identifier verwenden. Die bisherigen Kauf-ID-Vorschlaege sind weiterhin nur Vorschlaege, keine registrierten Produkte.

Apple dokumentiert die SKU als interne, nach Erstellung unveraenderliche Kennung. Die Bundle-ID des Builds muss zum Apple-Datensatz passen. Quelle: [Apple App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information). Die iOS-Konfiguration folgt [Expo SDK 55 App config](https://docs.expo.dev/versions/v55.0.0/config/app/).

## Reproduzierbare lokale Pruefung

```sh
node --test tests/apple-identity.test.mjs tests/native-audit.test.mjs
npm run check:build -- --source-only
npm run check:docs
```

Falsche iOS-ID, alte Anzeigenamen und versehentliche Android-Umbenennung muessen fehlschlagen. Ein fehlender Lock wird weiterhin als fehlend gemeldet. Aufgeloeste native Plists werden nur dann akzeptiert, wenn ID und Anzeigename stimmen. Platzhalter im generierten Plist sind ausschliesslich im expliziten Konfigurationsmodus erlaubt und bestaetigen keinen installierbaren Build.

## Noch nicht ausgefuehrt

Kein direkter Zugriff auf den bestehenden App-Store-Connect-Datensatz in dieser Sitzung. Die Suche nach einer passenden verfuegbaren Anbindung ergab kein direkt nutzbares App-Store-Connect-Werkzeug. Vollzugriff als Freigabe ersetzt nicht eine solche technische Verbindung.

Native Paketinstallation, Lockfile, Metro-Exports, Xcode-Build, Signierung, Upload und TestFlight-Pruefung sind weiterhin offen. Alle Build-Schritte und Voraussetzungen stehen in [BUILD_RUNBOOK.md](BUILD_RUNBOOK.md). Es wurden keine Zertifikate oder Profile neu erstellt oder widerrufen und keine Store-Veroeffentlichung vorgenommen.

Apple-Texte: [Deutsch](APPLE_STORE_COPY_DE.md), [Englisch](APPLE_STORE_COPY_EN.md). Diese Dateien koennen nach der nativen Abnahme fuer den bereits vorhandenen Datensatz verwendet werden.
