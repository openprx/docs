---
title: Konfigurationsreferenz
description: Vollständige Referenz für jeden PRX-SD-Konfigurationsschlüssel einschließlich Typen, Standardwerte und detaillierte Beschreibungen.
---

# Konfigurationsreferenz

Diese Seite dokumentiert jeden Konfigurationsschlüssel in `~/.prx-sd/config.json`. Verwenden Sie `sd config set <key> <value>`, um eine Einstellung zu ändern, oder bearbeiten Sie die JSON-Datei direkt.

## Scan-Einstellungen (`scan.*`)

Einstellungen, die steuern, wie die Scan-Engine Dateien verarbeitet.

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| `scan.max_file_size` | `integer` | `104857600` (100 MiB) | Maximale Dateigröße in Bytes. Dateien, die größer als dieser Wert sind, werden beim Scannen übersprungen. Auf `0` setzen, um das Limit zu deaktivieren (nicht empfohlen). |
| `scan.threads` | `integer \| null` | `null` (auto) | Anzahl der parallelen Scanner-Threads. Bei `null` verwendet PRX-SD die Anzahl der logischen CPU-Kerne. Auf eine bestimmte Zahl setzen, um die Parallelität zu begrenzen oder zu erhöhen. |
| `scan.timeout_per_file_ms` | `integer` | `30000` (30 s) | Maximale Zeit in Millisekunden für das Scannen einer einzelnen Datei. Bei Überschreitung wird die Datei als Fehler markiert und der Scan mit der nächsten Datei fortgesetzt. |
| `scan.scan_archives` | `boolean` | `true` | Ob in Archivdateien (ZIP, tar.gz, 7z, RAR usw.) rekursiv gescannt werden soll. |
| `scan.max_archive_depth` | `integer` | `3` | Maximale Verschachtelungstiefe beim Rekursiv-Scannen von Archiven. Verhindert Zip-Bomb-Angriffe. |
| `scan.heuristic_threshold` | `integer` | `60` | Minimaler heuristischer Score (0-100), um eine Datei als **Bösartig** zu markieren. Dateien mit einem Score zwischen 30 und diesem Schwellenwert werden als **Verdächtig** markiert. Niedrigere Werte erhöhen die Empfindlichkeit, können aber mehr Fehlalarme erzeugen. |
| `scan.exclude_paths` | `string[]` | `[]` | Liste von Glob-Mustern oder Pfadpräfixen, die vom Scannen ausgeschlossen werden sollen. Unterstützt `*` (beliebige Zeichen) und `?` (einzelnes Zeichen) als Platzhalter. |

### Beispiele

```bash
# Maximale Dateigröße auf 500 MiB erhöhen
sd config set scan.max_file_size 524288000

# Genau 4 Threads verwenden
sd config set scan.threads 4

# Zeitüberschreitung pro Datei auf 60 Sekunden erhöhen
sd config set scan.timeout_per_file_ms 60000

# Archiv-Scan deaktivieren
sd config set scan.scan_archives false

# Archiv-Verschachtelungstiefe auf 5 setzen
sd config set scan.max_archive_depth 5

# Heuristischen Schwellenwert für höhere Empfindlichkeit senken
sd config set scan.heuristic_threshold 40

# Pfade ausschließen
sd config set scan.exclude_paths '["/proc", "/sys", "/dev", "*.log", "*.tmp"]'
```

## Monitor-Einstellungen (`monitor.*`)

Einstellungen, die die Echtzeit-Dateisystemüberwachung steuern (`sd monitor` und `sd daemon`).

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| `monitor.block_mode` | `boolean` | `false` | Bei `true` werden fanotify-Berechtigungsereignisse (nur Linux) verwendet, um den Zugriff auf bösartige Dateien zu **blockieren**, bevor der anfragende Prozess sie lesen kann. Erfordert Root-Rechte. Bei `false` werden Dateien nach der Erstellung/Änderung gescannt und Bedrohungen werden gemeldet, aber nicht blockiert. |
| `monitor.channel_capacity` | `integer` | `4096` | Größe des internen Ereigniskanal-Puffers zwischen dem Dateisystem-Watcher und dem Scanner. Erhöhen Sie diesen Wert, wenn unter hoher Dateisystemaktivität "Channel full"-Warnungen auftreten. |

### Beispiele

```bash
# Block-Modus aktivieren (erfordert Root)
sd config set monitor.block_mode true

# Kanal-Puffer für stark ausgelastete Server erhöhen
sd config set monitor.channel_capacity 16384
```

::: warning
Block-Modus (`monitor.block_mode = true`) verwendet Linux fanotify-Berechtigungsereignisse. Dies erfordert:
- Root-Rechte
- Einen Linux-Kernel mit aktiviertem `CONFIG_FANOTIFY_ACCESS_PERMISSIONS`
- Den PRX-SD-Daemon, der als Root läuft

Unter macOS und Windows ist der Block-Modus nicht verfügbar und diese Einstellung wird ignoriert.
:::

## Update-Einstellungen

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| `update_server_url` | `string` | `null` | URL des Signatur-Update-Servers. Die Engine holt `<url>/manifest.json`, um auf Updates zu prüfen. Überschreiben Sie dies, um einen privaten Spiegel oder einen Air-Gap-Update-Server zu verwenden. |

### Beispiele

```bash
# Privaten Spiegel verwenden
sd config set update_server_url "https://internal-mirror.example.com/prx-sd/v1"

# Auf offiziellen Server zurücksetzen
sd config set update_server_url null
```

## Quarantäne-Einstellungen (`quarantine.*`)

Einstellungen, die den verschlüsselten Quarantänetresor steuern.

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| `quarantine.auto_quarantine` | `boolean` | `false` | Bei `true` werden Dateien, die als **Bösartig** erkannt werden, beim Scannen automatisch in den Quarantänetresor verschoben. Bei `false` werden Bedrohungen gemeldet, aber Dateien verbleiben an ihrem Ort. |
| `quarantine.max_vault_size_mb` | `integer` | `1024` (1 GiB) | Maximale Gesamtgröße des Quarantänetresors in MiB. Wenn dieses Limit erreicht ist, können keine neuen Dateien mehr in Quarantäne verschoben werden, bis ältere Einträge gelöscht werden. |

### Beispiele

```bash
# Automatische Quarantäne aktivieren
sd config set quarantine.auto_quarantine true

# Tresorgröße auf 5 GiB erhöhen
sd config set quarantine.max_vault_size_mb 5120

# Auto-Quarantäne deaktivieren (nur melden)
sd config set quarantine.auto_quarantine false
```

## Vollständige Standardkonfiguration

Als Referenz hier die vollständige Standardkonfiguration:

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

## Wert-Parsing-Regeln

Bei Verwendung von `sd config set` werden Werte automatisch in dieser Reihenfolge geparst:

1. **Boolean** -- `true` oder `false`
2. **Null** -- `null`
3. **Integer** -- z.B. `42`, `104857600`
4. **Float** -- z.B. `3.14`
5. **JSON-Array/Objekt** -- z.B. `'["/proc", "*.log"]'`, `'{"key": "value"}'`
6. **String** -- alles andere, z.B. `"https://example.com"`

::: tip
Wenn Sie Arrays oder Objekte festlegen, schließen Sie den Wert in einfache Anführungszeichen ein, um Shell-Expansion zu verhindern:
```bash
sd config set scan.exclude_paths '["*.log", "/proc", "/sys"]'
```
:::

## Verwandte Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `sd config show` | Aktuelle Konfiguration anzeigen |
| `sd config set <key> <value>` | Einen Konfigurationswert festlegen |
| `sd config reset` | Alle Einstellungen auf Standardwerte zurücksetzen |
| `sd policy show` | Bereinigungsrichtlinie anzeigen |
| `sd policy set <key> <value>` | Einen Bereinigungsrichtlinienwert festlegen |
| `sd policy reset` | Bereinigungsrichtlinie auf Standardwerte zurücksetzen |

## Nächste Schritte

- Zur [Konfigurationsübersicht](./index) für eine allgemeine Einführung zurückkehren
- Lernen Sie, wie sich `scan.*`-Einstellungen auf das [Datei-Scannen](../scanning/file-scan) auswirken
- [Echtzeitüberwachung](../realtime/) mit `monitor.*`-Einstellungen konfigurieren
- [Quarantäne](../quarantine/) mit Auto-Quarantäne einrichten
