# Offizielle Referenzen

Pruefdatum: 14.09.2026. Versionierte SDK-Referenzen absichtlich verwenden; aktuelle Store-Regeln vor echter Einreichung erneut kontrollieren. Diese Liste dokumentiert technische Quellen, keine individuelle Rechtspruefung.

- [Expo SDK 55](https://docs.expo.dev/versions/v55.0.0/): bestehende React-/React-Native-Linie.
- [Expo Audio SDK 55](https://docs.expo.dev/versions/v55.0.0/sdk/audio/): useAudioPlayer, Seek, Audio-Modus und Aufnahme-/Background-Schalter.
- [Apple App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information): Name/Untertitel, App-Identitaet, EULA und Datenschutz-URL.
- [Apple Version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information): Beschreibung, Promo-Text, Keywords und Review-Felder. Keywords dort als maximal 100 Bytes beschrieben.
- [Google Play Store listing](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en-GB): Name 30, Kurzbeschreibung 80, Beschreibung 4000 Zeichen.
- [Apple IAP lifecycle](https://developer.apple.com/documentation/StoreKit/offering-completing-and-restoring-in-app-purchases): Transaktions-/Lieferungsprinzipien. Konkrete neue Integration muss zur gewaehlten StoreKit-Version passen.
- [Google Play Billing security](https://developer.android.com/google/play/billing/security): Verifikation, pending und Deduplizierung.
- [AdMob SSV](https://developers.google.com/admob/android/ssv): Signaturpruefung von Reward-Callbacks und UX-Abwaegung.
- [AdMob UMP](https://developers.google.com/admob/android/privacy): Consent-/Privacy-Options-Integration.
- [Google Data safety](https://support.google.com/googleplay/android-developer/answer/10787469): Angaben einschliesslich SDK-Datenverarbeitung.
- [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/): Drittpartner und Dateninventar.

## Ergaenzungen fuer Build-Vorbereitung 0.4.1

Erneut abgerufen am 14.09.2026.

- [npm ci, CLI 10](https://docs.npmjs.com/cli/v10/commands/npm-ci/): vorhandener konsistenter Lockfile, keine stille Korrektur bei Manifest-Abweichungen.
- [Expo Permissions](https://docs.expo.dev/guides/permissions/): deklarierte und blockierte native Berechtigungen; Konfiguration und Laufzeitanfrage sind getrennte Schritte.
- [Android apkanalyzer](https://developer.android.com/tools/apkanalyzer): `manifest print` liest das Manifest einer APK.
- [Android apksigner](https://developer.android.com/tools/apksigner): Signaturpruefung ist ein eigener Schritt nach dem Bauen.
- [GitHub workflow_dispatch](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch): manuell ausloesbare Workflows setzen eine Workflow-Datei im Default-Branch voraus. Dies ist keine Freigabe, selbststaendig zu mergen.

## Apple-Zuordnung fuer WonderCaps

Am 14.09.2026 fuer die aktuelle Aenderung abgerufen:

- [Apple App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information): SKU ist intern und nach App-Erstellung nicht aenderbar; der Build muss die passende Bundle-ID tragen.
- [Expo SDK 55 App config](https://docs.expo.dev/versions/v55.0.0/config/app/): `ios.bundleIdentifier` und `ios.infoPlist` fuer die native Apple-Konfiguration; Android hat seine eigene Paketkennung.

Diese Quellen bestaetigen die Konfigurationsfelder, nicht die Existenz oder Zugriffsrechte des vom Nutzer genannten App-Store-Connect-Datensatzes.

## Native Laufzeitkorrekturen 0.4.2

Am 14.09.2026 abgerufen:

- [React Native AppState](https://reactnative.dev/docs/appstate): Android blur/focus koennen unabhaengig von AppState change auftreten, etwa beim Benachrichtigungsfenster.
- [React Native Issue 36865](https://github.com/react/react-native/issues/36865): historischer nativer Modal-/Alert-Fokusfall. Kein Nachweis auf einem aktuellen Projekt-Geraet; verwendet als zu vermeidende Architektur-Falle.
- [Expo SDK 55 Audio](https://docs.expo.dev/versions/v55.0.0/sdk/audio/): seekTo liefert ein Promise; useAudioPlayer besitzt den Lebenszyklus der Player.

Die Quellen erklaeren die Plattformgrenzen. Die zugehoerigen Offline-Tests simulieren diese Grenzen; sie verifizieren weder einen installierten RN-Build noch Audiohardware.

## Native CI 0.5.0

Am 15.09.2026 erneut geprueft:

- [Expo SDK 55 Versionsreferenz](https://docs.expo.dev/versions/v55.0.0/): iOS 15.1+ und Xcode 26.2+ fuer SDK 55.
- [GitHub macOS 26 GA](https://github.blog/changelog/2026-02-26-macos-26-is-now-generally-available-for-github-hosted-runners/): `macos-26` ist ein gehostetes Runner-Label.
- [GitHub Runner-Auswahl](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job): dokumentiert die aktuellen Standardlabels fuer gehostete Runner.

Diese Quellen belegen die verfuegbare CI-Basis, nicht einen erfolgreichen Lauf dieses Repositories. Run-Ergebnisse muessen separat gelesen werden.
