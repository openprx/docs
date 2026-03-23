---
title: Konfigurationsübersicht
description: "Verstehen, wie die PRX-SD-Konfiguration funktioniert, wo Konfigurationsdateien gespeichert werden und wie Einstellungen mit dem Befehl sd config angezeigt, geändert und zurückgesetzt werden."
---

# Konfigurationsübersicht

PRX-SD speichert die gesamte Konfiguration in einer einzigen JSON-Datei unter `~/.prx-sd/config.json`. Diese Datei wird beim ersten Start automatisch mit sinnvollen Standardwerten erstellt. Sie können die Konfiguration mit dem Befehl `sd config` anzeigen, ändern und zurücksetzen oder die JSON-Datei direkt bearbeiten.

## Speicherort der Konfigurationsdatei

| Plattform | Standardpfad |
|-----------|-------------|
| Linux / macOS | `~/.prx-sd/config.json` |
| Windows | `%USERPROFILE%\.prx-sd\config.json` |
| Benutzerdefiniert | `--data-dir /path/to/dir` (globales CLI-Flag) |

Das globale Flag `--data-dir` überschreibt den Standardspeicherort. Wenn gesetzt, wird die Konfigurationsdatei aus `<data-dir>/config.json` gelesen.

```bash
# Benutzerdefiniertes Datenverzeichnis verwenden
sd --data-dir /opt/prx-sd config show
```

## Der Befehl `sd config`

### Aktuelle Konfiguration anzeigen

Alle aktuellen Einstellungen einschließlich des Konfigurationsdateipfads anzeigen:

```bash
sd config show
```

Ausgabe:

```
Current Configuration
  File: /home/user/.prx-sd/config.json

{
  "scan": {
    "max_file_size": 104857600,
    "threads": null,
    "timeout_per_file_ms": 30000,
    "scan_archives": true,
    "max_archive_depth": 3,
    "heuristic_threshold": 60,
    "exclude_paths": []
  },
  "monitor": {
    "block_mode": false,
    "channel_capacity": 4096
  },
  "update_server_url": null,
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

### Konfigurationswert festlegen

Beliebigen Konfigurationsschlüssel mit punkt-separierter Notation festlegen. Werte werden automatisch als entsprechenden JSON-Typ geparst (Boolean, Integer, Float, Array, Objekt oder String).

```bash
sd config set <key> <value>
```

Beispiele:

```bash
# Maximale Dateigröße auf 200 MiB festlegen
sd config set scan.max_file_size 209715200

# Scan-Threads auf 8 festlegen
sd config set scan.threads 8

# Automatische Quarantäne aktivieren
sd config set quarantine.auto_quarantine true

# Heuristischen Schwellenwert auf 50 setzen (empfindlicher)
sd config set scan.heuristic_threshold 50

# Ausschlusspfade als JSON-Array festlegen
sd config set scan.exclude_paths '["*.log", "/proc", "/sys"]'

# Update-Server-URL ändern
sd config set update_server_url "https://custom-update.example.com/v1"
```

Ausgabe:

```
OK Set scan.max_file_size = 209715200 (was 104857600)
```

::: tip
Verschachtelte Schlüssel verwenden Punkt-Notation. Zum Beispiel navigiert `scan.max_file_size` in das `scan`-Objekt und setzt das Feld `max_file_size`. Zwischenobjekte werden automatisch erstellt, wenn sie nicht vorhanden sind.
:::

### Auf Standardwerte zurücksetzen

Alle Konfigurationen auf Werkseinstellungen zurücksetzen:

```bash
sd config reset
```

Ausgabe:

```
OK Configuration reset to defaults.
```

::: warning
Das Zurücksetzen der Konfiguration löscht keine Signaturdatenbanken, YARA-Regeln oder Dateien in Quarantäne. Es setzt nur die Datei `config.json` auf Standardwerte zurück.
:::

## Konfigurationskategorien

Die Konfiguration ist in vier Hauptbereiche unterteilt:

| Bereich | Zweck |
|---------|-------|
| `scan.*` | Datei-Scan-Verhalten: Dateigrößenbeschränkungen, Threads, Zeitüberschreitungen, Archive, Heuristik |
| `monitor.*` | Echtzeitüberwachung: Block-Modus, Ereigniskanal-Kapazität |
| `quarantine.*` | Quarantänetresor: Auto-Quarantäne, maximale Tresorgröße |
| `update_server_url` | Signatur-Update-Server-Endpunkt |

Eine vollständige Referenz aller Konfigurationsschlüssel, deren Typen, Standardwerte und Beschreibungen finden Sie in der [Konfigurationsreferenz](./reference).

## Standardkonfiguration

Beim ersten Start generiert PRX-SD die folgende Standardkonfiguration:

```json
{
  "scan": {
    "max_file_size": 104857600,
    "threads": null,
    "timeout_per_file_ms": 30000,
    "scan_archives": true,
    "max_archive_depth": 3,
    "heuristic_threshold": 60,
    "exclude_paths": []
  },
  "monitor": {
    "block_mode": false,
    "channel_capacity": 4096
  },
  "update_server_url": null,
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

Wichtige Standardwerte:

- **Maximale Dateigröße:** 100 MiB (größere Dateien werden übersprungen)
- **Threads:** `null` (automatische Erkennung basierend auf CPU-Anzahl)
- **Zeitüberschreitung:** 30 Sekunden pro Datei
- **Archive:** Gescannt, bis zu 3 Verschachtelungsebenen
- **Heuristischer Schwellenwert:** 60 (Score 60+ = bösartig, 30-59 = verdächtig)
- **Block-Modus:** Deaktiviert (Monitor meldet, blockiert aber keinen Dateizugriff)
- **Auto-Quarantäne:** Deaktiviert (Bedrohungen werden gemeldet, aber nicht verschoben)
- **Tresorgröße-Limit:** 1024 MiB

## Konfigurationsdatei direkt bearbeiten

Sie können `~/.prx-sd/config.json` auch mit einem beliebigen Texteditor bearbeiten. PRX-SD liest die Datei zu Beginn jedes Befehls, sodass Änderungen sofort wirksam werden.

```bash
# Im Editor öffnen
$EDITOR ~/.prx-sd/config.json
```

Stellen Sie sicher, dass die Datei gültiges JSON ist. Wenn sie fehlerhaft ist, fällt PRX-SD auf Standardwerte zurück und gibt eine Warnung aus.

## Datenverzeichnisstruktur

```
~/.prx-sd/
  config.json       # Engine-Konfiguration
  signatures/       # LMDB-Hash-Signaturdatenbank
  yara/             # Kompilierte YARA-Regeldateien
  quarantine/       # AES-256-GCM-verschlüsselter Quarantänetresor
  adblock/          # Adblock-Filterlisten und Protokolle
  plugins/          # WASM-Plugin-Verzeichnisse
  audit/            # Scan-Audit-Protokolle (JSONL)
  prx-sd.pid        # Daemon-PID-Datei (wenn aktiv)
```

## Nächste Schritte

- Die [Konfigurationsreferenz](./reference) für jeden Schlüssel, Typ und Standardwert lesen
- Über [Scannen](../scanning/file-scan) lernen, um zu verstehen, wie die Konfiguration Scans beeinflusst
- [Echtzeitüberwachung](../realtime/) einrichten und `monitor.block_mode` konfigurieren
- [Quarantäne](../quarantine/) mit Auto-Quarantäne-Verhalten konfigurieren
