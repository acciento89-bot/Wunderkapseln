# Aenderungen - Alpha 0.5.0

## Native Release-Pipeline

- Ein einmaliger, branchgebundener GitHub-Actions-Bootstrap erzeugt den ersten echten `package-lock.json` auf einer Umgebung mit Registry-Zugriff.
- Der Bootstrap darf nur `package-lock.json` committen und bricht bei Manifest-Aenderungen ab.
- Der normale Verify-Workflow bootstrapped nie selbst, sondern verwendet danach ausschliesslich den committed Lock und `npm ci`.
- Pushes auf `feature/playable-miniature-worlds` sollen ein internes Android-APK und einen signierungsfreien iOS-Simulatorbuild erzeugen. Beide bleiben reine CI-Artefakte ohne Store-Upload.
- iOS verwendet `macos-26` und verweigert Xcode-Versionen unter 26.2.

## Identitaet und Version

- Produktversion auf `0.5.0` angehoben.
- iOS Build Number und Android VersionCode auf `7` angehoben.
- Apple bleibt `WonderCaps` / `com.kamilunavo.wondercaps` / SKU `wondercaps-001`.
- Android bleibt `com.kamilunavo.wunderkapseln`.
- Der kanonische PNG-App-Icon-Pfad ist jetzt explizit von der generellen PNG-Gitignore-Regel ausgenommen.

## Unveraendert

Gameplay, 480 Leveldefinitionen, Lebens-/Zeitmodell, Speicherformat, Weltgrafiken und alle 14 Sounds wurden durch diesen Build-Pipeline-Schritt nicht absichtlich veraendert. Es gibt weiterhin keine aktiven In-App-Kaeufe, Werbung oder Store-Einreichung.
