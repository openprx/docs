---
title: Desktop-Anwendung (GUI)
description: "PRX-SD enthält eine plattformübergreifende Desktop-Anwendung, die mit Tauri 2 und Vue 3 erstellt wurde, mit System-Tray-Integration, Drag-and-Drop-Scanning und einem Echtzeit-Dashboard."
---

# Desktop-Anwendung (GUI)

PRX-SD enthält eine plattformübergreifende Desktop-Anwendung, die mit **Tauri 2** (Rust-Backend) und **Vue 3** (TypeScript-Frontend) erstellt wurde. Die GUI bietet eine visuelle Schnittstelle zu allen Kernfunktionen der Engine, ohne die Kommandozeile zu benötigen.

## Architektur

```
+----------------------------------------------+
|              PRX-SD Desktop App               |
|                                               |
|   Vue 3 Frontend          Tauri 2 Backend     |
|   (Vite + TypeScript)     (Rust + IPC)        |
|                                               |
|   +------------------+   +-----------------+  |
|   | Dashboard        |<->| scan_path()     |  |
|   | File Scanner     |   | scan_directory()|  |
|   | Quarantine Mgmt  |   | get_config()    |  |
|   | Config Editor    |   | save_config()   |  |
|   | Signature Update |   | update_sigs()   |  |
|   | Alert History    |   | get_alerts()    |  |
|   | Adblock Panel    |   | adblock_*()     |  |
|   | Monitor Control  |   | start/stop()    |  |
|   +------------------+   +-----------------+  |
|                                               |
|   System Tray Icon (32x32)                    |
+----------------------------------------------+
```

Das Tauri-Backend stellt 18 IPC-Befehle bereit, die das Vue-Frontend aufruft, um mit der Scan-Engine, dem Quarantänetresor, der Signaturdatenbank und der Adblock-Filter-Engine zu interagieren. Alle rechenintensiven Aufgaben (Scanning, YARA-Matching, Hash-Lookups) laufen in Rust; das Frontend übernimmt nur das Rendering.

## Funktionen

### Echtzeit-Dashboard

Das Dashboard zeigt den Sicherheitsstatus auf einen Blick:

- **Gesamtanzahl der Scans** durchgeführt
- **Anzahl gefundener Bedrohungen**
- **Anzahl in Quarantäne befindlicher Dateien**
- **Letzter Scan-Zeitpunkt**
- **Überwachungsstatus** (aktiv/inaktiv)
- **Scan-Verlauf-Diagramm** (letzte 7 Tage)
- **Liste der letzten Bedrohungen** mit Pfaden, Bedrohungsnamen und Schweregraden

<!-- Screenshot placeholder: dashboard.png -->

### Drag-and-Drop-Scanning

Dateien oder Ordner auf das Anwendungsfenster ziehen, um sofort einen Scan zu starten. Ergebnisse erscheinen in einer sortierbaren Tabelle mit Spalten für Pfad, Bedrohungsstufe, Erkennungstyp, Bedrohungsname und Scan-Zeit.

<!-- Screenshot placeholder: scan-results.png -->

### Quarantäneverwaltung

Unter Quarantäne gestellte Dateien über eine visuelle Schnittstelle anzeigen, wiederherstellen und löschen:

- Sortierbare Tabelle mit ID, ursprünglichem Pfad, Bedrohungsname, Datum und Dateigröße
- Einmal-Klick-Wiederherstellung zum ursprünglichen Speicherort
- Einmal-Klick-Endlöschung
- Tresordaten (Gesamtdateien, Gesamtgröße, ältester/neuester Eintrag)

### Konfigurations-Editor

Alle Engine-Einstellungen über eine formularbasierte Schnittstelle bearbeiten. Änderungen werden in `~/.prx-sd/config.json` geschrieben und werden beim nächsten Scan wirksam.

### Signatur-Updates

Signatur-Datenbank-Updates über die GUI auslösen. Das Backend lädt das neueste Manifest herunter, verifiziert die SHA-256-Integrität und installiert das Update. Die Engine wird automatisch mit den neuen Signaturen neu initialisiert.

### Adblock-Panel

Werbung und bösartige Domain-Blockierung verwalten:

- Adblock-Schutz aktivieren/deaktivieren
- Filterlisten synchronisieren
- Einzelne Domains prüfen
- Blockprotokoll anzeigen (letzte 50 Einträge)
- Listenkonfiguration und Statistiken anzeigen

### System-Tray

PRX-SD sitzt im System-Tray mit einem dauerhaften Symbol und bietet schnellen Zugriff auf:

- Hauptfenster öffnen
- Echtzeitüberwachung starten/stoppen
- Daemon-Status prüfen
- Schnell-Scan auslösen
- Anwendung beenden

::: tip
Das System-Tray-Symbol ist mit 32x32 Pixeln konfiguriert. Auf HiDPI-Displays verwendet Tauri automatisch die Variante `128x128@2x.png`.
:::

## Aus dem Quellcode erstellen

### Voraussetzungen

- **Rust** 1.85.0 oder höher
- **Node.js** 18+ mit npm
- **System-Abhängigkeiten** (Linux):

```bash
# Debian/Ubuntu
sudo apt install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

# Fedora
sudo dnf install -y webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel
```

### Entwicklungsmodus

Frontend-Dev-Server und Tauri-Backend zusammen mit Hot Reload ausführen:

```bash
cd gui
npm install
npm run tauri dev
```

Dies startet:
- Vite-Dev-Server unter `http://localhost:1420`
- Tauri-Backend, das die Dev-URL lädt

### Produktions-Build

Verteilbares Anwendungspaket erstellen:

```bash
cd gui
npm install
npm run tauri build
```

Die Build-Ausgabe variiert je nach Plattform:

| Plattform | Ausgabe |
|-----------|--------|
| Linux | `.deb`, `.AppImage`, `.rpm` in `src-tauri/target/release/bundle/` |
| macOS | `.dmg`, `.app` in `src-tauri/target/release/bundle/` |
| Windows | `.msi`, `.exe` in `src-tauri\target\release\bundle\` |

## Anwendungskonfiguration

Die Tauri-App wird über `gui/src-tauri/tauri.conf.json` konfiguriert:

```json
{
  "productName": "PRX-SD",
  "version": "0.1.0",
  "identifier": "com.prxsd.app",
  "app": {
    "windows": [
      {
        "title": "PRX-SD Antivirus",
        "width": 1200,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600,
        "center": true,
        "resizable": true
      }
    ],
    "trayIcon": {
      "id": "main-tray",
      "iconPath": "icons/32x32.png",
      "tooltip": "PRX-SD Antivirus"
    }
  }
}
```

## IPC-Befehle

Das Backend stellt diese Tauri-Befehle dem Frontend bereit:

| Befehl | Beschreibung |
|--------|-------------|
| `scan_path` | Datei oder Verzeichnis scannen, Ergebnisse zurückgeben |
| `scan_directory` | Verzeichnis rekursiv scannen |
| `start_monitor` | Echtzeitüberwachung validieren und starten |
| `stop_monitor` | Überwachungs-Daemon stoppen |
| `get_quarantine_list` | Alle Quarantäne-Einträge auflisten |
| `restore_quarantine` | Quarantänierte Datei nach ID wiederherstellen |
| `delete_quarantine` | Quarantäne-Eintrag nach ID löschen |
| `get_config` | Aktuelle Scan-Konfiguration lesen |
| `save_config` | Scan-Konfiguration auf Festplatte schreiben |
| `get_engine_info` | Engine-Version, Signaturanzahl, YARA-Regeln abrufen |
| `update_signatures` | Neueste Signaturen herunterladen und installieren |
| `get_alert_history` | Alarmverlauf aus Audit-Protokollen lesen |
| `get_dashboard_stats` | Dashboard-Statistiken aggregieren |
| `get_adblock_stats` | Adblock-Status und Regelanzahl abrufen |
| `adblock_enable` | Hosts-Datei-Werbeblockerung aktivieren |
| `adblock_disable` | Hosts-Datei-Werbeblockerung deaktivieren |
| `adblock_sync` | Filterlisten neu herunterladen |
| `adblock_check` | Prüfen, ob eine Domain blockiert ist |
| `get_adblock_log` | Letzte Blockprotokoll-Einträge lesen |

## Datenverzeichnis

Die GUI verwendet dasselbe `~/.prx-sd/`-Datenverzeichnis wie die CLI. Konfigurationsänderungen in der GUI sind für `sd`-Befehle sichtbar und umgekehrt.

::: warning
GUI und CLI teilen denselben Scan-Engine-Zustand. Wenn der Daemon über `sd daemon` läuft, validiert die Schaltfläche "Monitor starten" der GUI die Bereitschaft, aber die eigentliche Überwachung wird vom Daemon-Prozess verwaltet. Vermeiden Sie es, den GUI-Scanner und den Daemon-Scanner gleichzeitig auf denselben Dateien auszuführen.
:::

## Tech-Stack

| Komponente | Technologie |
|------------|-----------|
| Backend | Tauri 2, Rust |
| Frontend | Vue 3, TypeScript, Vite 6 |
| IPC | Tauri-Befehlsprotokoll |
| Tray | Tauri-Tray-Plugin |
| Bundler | Tauri-Bundler (deb/AppImage/dmg/msi) |
| API-Bindungen | `@tauri-apps/api` v2 |

## Nächste Schritte

- PRX-SD gemäß dem [Installationsleitfaden](../getting-started/installation) installieren
- Die [CLI](../cli/) für Skripting und Automatisierung erlernen
- Die Engine über die [Konfigurationsreferenz](../configuration/reference) konfigurieren
- Erkennung mit [WASM-Plugins](../plugins/) erweitern
