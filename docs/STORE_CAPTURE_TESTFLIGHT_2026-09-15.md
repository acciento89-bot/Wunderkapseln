# WonderCaps: Screenshots und TestFlight-Upload

Stand: 15.09.2026. Auftrag: echte Screenshots fuer iPad 13 Zoll und iPhone 6,5 Zoll sowie TestFlight-Upload; keine App-Store-Veroeffentlichung.

## Native Screenshots
12 unveraenderte RGB-PNGs ohne Alphakanal: je drei Motive in DE und EN pro Geraet.
- iPhone 11 Pro Max, Displayklasse 6,5 Zoll: 1242 x 2688 Pixel.
- iPad Pro 13 Zoll (M4): 2064 x 2752 Pixel.
- Motive: Start, Level 1, Weltensammlung. Echte native UI-Bedienung; keine erfundenen Spielstaende, kein Hochskalieren und keine Montage.
- Beide finalen XCTest-Laeufe bestanden mit je zwei Tests. Die 12 Aufnahmen wurden aus erfolgreichen Testanhaengen exportiert und im ZIP einzeln per SHA-256 gegen die Originale geprueft.
- Ziel: ~/Downloads/WonderCaps-AppStore-Screenshots-20260915
- ZIP: ~/Downloads/WonderCaps-Screenshots-iPad13-iPhone6_5-DE-EN.zip
- Vorhandene Nutzer-Screenshots unveraendert. iPad-Aufnahmen zeigen die bestehende zentrierte Tablet-Darstellung.
- Keine Screenshot-Uploads in App Store Connect vorgenommen.

## TestFlight-Build-Upload erfolgreich
- App: WonderCaps, Bundle-ID com.kamilunavo.wondercaps, SKU wondercaps-001.
- Hochgeladen: Version 0.5.0, Build 7. Verifiziertes iPhoneOS-Archiv, kein Simulatorpaket.
- Apple-Team: TKG684N5GL. Automatische Signierung mit bestehendem Xcode-Zugang.
- xcodebuild archive: ARCHIVE SUCCEEDED. Code-Signatur und finale Info.plist geprueft.
- xcodebuild -exportArchive mit destination=upload: Exit 0, EXPORT SUCCEEDED.
- Apple-Rueckmeldung am 15.09.2026 um 17:10:46 (Mac-Ortszeit): Upload succeeded; Uploaded package is processing.
- Endgueltige Verarbeitung und Verfuegbarkeit fuer Tester noch nicht separat bestaetigt. Keine interne Testgruppe veraendert, keine externen Tester eingeladen und keine Review-/Store-Veroeffentlichung ausgeloest.

## Verifikation und bekannte Hinweise
Vollstaendige Node-Suite: 230 bestanden, null Fehler. Drei zuvor fehlgeschlagene Konfigurationstests wurden auf den legitimen, bereits eingebundenen expo-asset-Pluginpfad zurueckgefuehrt; der enge Pluginpruefer akzeptiert jetzt expo-audio und expo-asset. Unbekannte Plugins und Mikrofonaufnahme bleiben abgewiesen.
Der Upload war erfolgreich mit Warnungen ueber fehlende Debug-Symbole fuer React.framework, ReactNativeDependencies.framework und hermesvm.framework. Diese Warnungen sind nicht als gescheiterter Upload zu behandeln; vollstaendige Fremdframework-Symbolizierung ist offen.
Die npm-Pruefung meldet weiterhin 10 Toolchain-Funde, darunter sharp als hohe Einstufung in devDependencies. Keine pauschale Sicherheitsfreigabe oder automatisches Major-Upgrade vorgenommen.

## Belege auf dem Mac
- .local-build/store-screens/iPhone65-v3.xcresult und iPad13.xcresult
- .local-build/store-screens/iphone-export/manifest.json und ipad-export/manifest.json
- .local-build/testflight-unit-tests-green.tap und testflight-npm-audit.json
- .local-build/testflight/archive.log, archive-capabilities.json und upload.log
- .local-build/testflight/WonderCaps-0.5.0-7.xcarchive
- Screenshots-Manifest.json im Ausgabeordner

Apple-Abmessungen: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
Apple-Uploadablauf: https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds
