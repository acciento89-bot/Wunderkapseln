# Dokumentationsindex - 0.5.0

**Buildfix vom 15.09.2026 (App-Version weiterhin 0.5.0):** Die automatische Lock-Uebergabe wurde korrigiert. Der Bootstrap ruft die Native-Pruefung direkt mit dem exakten Lock-Commit auf; auf einen weiteren GITHUB_TOKEN-Push wird nicht gewartet. Siehe [CI-Handoff-Korrektur](CI_HANDOFF_FIX.md). Ein nativer Build oder GitHub-Import ist damit noch nicht erfolgt.


**Verwendung:** Entwicklungs- und Release-Vorbereitung. Statusangaben beziehen sich auf die lokale Alpha bzw. explizit genannte CI-Evidenz, nicht automatisch auf einen Store-Release.

| Dokument | Inhalt |
|---|---|
| [GAME_DESIGN.md](GAME_DESIGN.md) | Spielregeln, Welten, Sondersteine, Fortschritt und Grenzen |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Module, Datenfluss, Speicher und Nebenwirkungen |
| [AUDIO_DESIGN.md](AUDIO_DESIGN.md) | 14 Effekte, Ereignisse, Mix, Timing und Lebenszyklus |
| [NATIVE_RUNTIME.md](NATIVE_RUNTIME.md) | Fokuswechsel, Android-Dialoge, exakte Zeitgrenzen und native Sound-Warteschlangen |
| [NATIVE_CI.md](NATIVE_CI.md) | Einmaliger Lock-Bootstrap, Android-APK- und iOS-Simulator-CI ohne Store-Upload |
| [BUILD_RUNBOOK.md](BUILD_RUNBOOK.md) | Lokaler Start, native Build-Schritte und Signierung |
| [MONETIZATION.md](MONETIZATION.md) | Produktvorschlaege, Zeitregeln und Kauf-Freigabekriterien |
| [QA_PLAN.md](QA_PLAN.md) | Automatische Tests und konkrete Geraete-Testfaelle |
| [APPLE_SETUP.md](APPLE_SETUP.md) | Bestehender Apple-Datensatz, WonderCaps-Kennung, SKU und offene Kontopruefung |
| [APPLE_STORE_COPY_DE.md](APPLE_STORE_COPY_DE.md) | Deutscher Apple-Textentwurf fuer WonderCaps |
| [APPLE_STORE_COPY_EN.md](APPLE_STORE_COPY_EN.md) | Englischer Apple-Textentwurf fuer WonderCaps |
| [STORE_COPY_DE.md](STORE_COPY_DE.md) | Deutscher Android-Textentwurf mit Feldgrenzen |
| [STORE_COPY_EN.md](STORE_COPY_EN.md) | Englischer Android-Textentwurf mit Feldgrenzen |
| [REVIEW_NOTES.md](REVIEW_NOTES.md) | Review-/TestFlight-Hinweise ohne erfundene Testzugaenge |
| [PRIVACY_DATA_MAP.md](PRIVACY_DATA_MAP.md) | Technisches Dateninventar und Datenschutz-Pruefbedarf |
| [ROADMAP.md](ROADMAP.md) | Priorisierte Arbeit bis zur Veroeffentlichung |
| [CODEX_HANDOFF.md](CODEX_HANDOFF.md) | Fortsetzung im Repository mit Befehlen und Grenzen |
| [RELEASE_GATES.md](RELEASE_GATES.md) | Verbindliche, noch offene Freigabekriterien |
| [CHANGELOG-0.5.0.md](CHANGELOG-0.5.0.md) | Native CI- und Versionsaenderungen |
| [PRUEFBERICHT-0.5.0.md](PRUEFBERICHT-0.5.0.md) | Aktueller lokaler/Remote-Teststatus |
| [CHANGELOG-0.4.2.md](CHANGELOG-0.4.2.md) | Laufzeitkorrekturen ohne neue Grafik oder Kauf-SDKs |
| [PRUEFBERICHT-0.4.2.md](PRUEFBERICHT-0.4.2.md) | Historischer 0.4.2-Teststand |
| [CHANGELOG-0.4.1.md](CHANGELOG-0.4.1.md) | Build-Vorbereitung ohne Gameplay-Aenderung |
| [PRUEFBERICHT-0.4.1.md](PRUEFBERICHT-0.4.1.md) | Historische Identitaets- und Build-Pruefung |
| [CHANGELOG-0.4.0.md](CHANGELOG-0.4.0.md) | Audio-Erweiterung |
| [PRUEFBERICHT-0.4.0.md](PRUEFBERICHT-0.4.0.md) | Historische Audio-/Browser-Pruefungen |
| [SOURCES.md](SOURCES.md) | Offizielle Plattform- und Toolchainquellen |

Maschinenlesbare Store-Entwuerfe stehen in `store-metadata.json`: `de`/`en` bleiben Android, `apple` enthaelt Apples festgelegte Kennung, SKU und eigene Lokalisierungen. Der Konsistenzcheck ist `npm run check:docs`. Aeltere Pruefberichte und QA-Logs bleiben Historie und belegen nicht automatisch den aktuellen Stand.

- [GitHub-Importstatus](GITHUB_IMPORT.md) - Zielbranch, Sperrstatus und reproduzierbarer spaeterer Import.
