---
title: Quarantäneverwaltung
description: "Quarantänierte Bedrohungen mit AES-256-GCM-verschlüsseltem Tresor verwalten, Dateien wiederherstellen und Quarantäne-Statistiken einsehen."
---

# Quarantäneverwaltung

Wenn PRX-SD eine Bedrohung erkennt, kann es die Datei in einem verschlüsselten Quarantänetresor isolieren. Quarantänierte Dateien werden mit AES-256-GCM verschlüsselt, umbenannt und in ein sicheres Verzeichnis verschoben, von dem aus sie nicht versehentlich ausgeführt werden können. Alle ursprünglichen Metadaten werden für die forensische Analyse aufbewahrt.

## Funktionsweise der Quarantäne

```
Bedrohung erkannt
  1. Zufälligen AES-256-GCM-Schlüssel generieren
  2. Dateiinhalt verschlüsseln
  3. Verschlüsseltes Blob in vault.bin speichern
  4. Metadaten (ursprünglicher Pfad, Hash, Erkennungsinfos) als JSON speichern
  5. Originaldatei von der Festplatte löschen
  6. Quarantäneereignis protokollieren
```

Der Quarantänetresor wird unter `~/.prx-sd/quarantine/` gespeichert:

```
~/.prx-sd/quarantine/
  vault.bin                    # Verschlüsselter Dateispeicher (nur anhängen)
  index.json                   # Quarantäne-Index mit Metadaten
  entries/
    a1b2c3d4.json             # Metadaten pro Eintrag
    e5f6g7h8.json
```

Jeder Quarantäne-Eintrag enthält:

```json
{
  "id": "a1b2c3d4",
  "original_path": "/tmp/payload.exe",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
  "file_size": 245760,
  "detection": {
    "engine": "yara",
    "rule": "Win_Trojan_AgentTesla",
    "severity": "malicious"
  },
  "quarantined_at": "2026-03-21T10:15:32Z",
  "vault_offset": 1048576,
  "vault_length": 245792
}
```

::: tip
Der Quarantänetresor verwendet authentifizierte Verschlüsselung (AES-256-GCM). Dies verhindert sowohl die versehentliche Ausführung von quarantänierter Malware als auch die Manipulation von Beweismitteln.
:::

## Quarantänierte Dateien auflisten

```bash
sd quarantine list [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|--------------|
| `--json` | | `false` | Als JSON ausgeben |
| `--sort` | `-s` | `date` | Sortieren nach: `date`, `name`, `size`, `severity` |
| `--filter` | `-f` | | Nach Schweregrad filtern: `malicious`, `suspicious` |
| `--limit` | `-n` | alle | Maximale anzuzeigende Einträge |

### Beispiel

```bash
sd quarantine list
```

```
Quarantine Vault (4 entries, 1.2 MB)

ID        Date                 Size     Severity   Detection              Original Path
a1b2c3d4  2026-03-21 10:15:32  240 KB   malicious  Win_Trojan_AgentTesla  /tmp/payload.exe
e5f6g7h8  2026-03-20 14:22:01  512 KB   malicious  Ransom_LockBit3       /home/user/doc.pdf.lockbit
c9d0e1f2  2026-03-19 09:45:18  32 KB    suspicious  Suspicious_Script     /var/www/upload/shell.php
b3a4c5d6  2026-03-18 16:30:55  384 KB   malicious  SHA256_Match          /tmp/dropper.bin
```

## Dateien wiederherstellen

Eine quarantänierte Datei am ursprünglichen Ort oder an einem angegebenen Pfad wiederherstellen:

```bash
sd quarantine restore <ID> [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|--------------|
| `--to` | `-t` | ursprünglicher Pfad | An einem anderen Ort wiederherstellen |
| `--force` | `-f` | `false` | Überschreiben, wenn das Ziel bereits existiert |

::: warning
Das Wiederherstellen einer quarantänierten Datei legt eine bekannt-bösartige oder verdächtige Datei wieder auf der Festplatte ab. Stellen Sie Dateien nur wieder her, wenn Sie sie als Fehlalarme bestätigt haben oder sie für Analysen in einer isolierten Umgebung benötigen.
:::

### Beispiele

```bash
# Am ursprünglichen Ort wiederherstellen
sd quarantine restore a1b2c3d4

# In ein bestimmtes Verzeichnis für Analyse wiederherstellen
sd quarantine restore a1b2c3d4 --to /tmp/analysis/

# Überschreiben erzwingen, wenn Datei am Ziel vorhanden ist
sd quarantine restore a1b2c3d4 --to /tmp/analysis/ --force
```

## Quarantänierte Dateien löschen

Quarantäne-Einträge dauerhaft löschen:

```bash
# Einen einzelnen Eintrag löschen
sd quarantine delete <ID>

# Alle Einträge löschen
sd quarantine delete-all

# Einträge löschen, die älter als 30 Tage sind
sd quarantine delete --older-than 30d

# Alle Einträge mit einem bestimmten Schweregrad löschen
sd quarantine delete --filter malicious
```

Beim Löschen werden die verschlüsselten Daten vor dem Entfernen aus dem Tresor mit Nullen überschrieben.

::: warning
Das Löschen ist dauerhaft. Die verschlüsselten Dateidaten und Metadaten sind nach dem Löschen nicht wiederherstellbar. Erwägen Sie den Export von Einträgen zur Archivierung vor dem Löschen.
:::

## Quarantäne-Statistiken

Aggregierte Statistiken über den Quarantänetresor anzeigen:

```bash
sd quarantine stats
```

```
Quarantine Statistics
  Total entries:       47
  Total size:          28.4 MB (encrypted)
  Oldest entry:        2026-02-15
  Newest entry:        2026-03-21

  By severity:
    Malicious:         31 (65.9%)
    Suspicious:        16 (34.1%)

  By detection engine:
    YARA rules:        22 (46.8%)
    Hash match:        15 (31.9%)
    Heuristic:          7 (14.9%)
    Ransomware:         3 (6.4%)

  Top detections:
    Win_Trojan_Agent    8 entries
    Ransom_LockBit3     5 entries
    SHA256_Match        5 entries
    Suspicious_Script   4 entries
```

## Automatische Quarantäne

Automatische Quarantäne während Scans oder Überwachung aktivieren:

```bash
# Mit Auto-Quarantäne scannen
sd scan /tmp --auto-quarantine

# Mit Auto-Quarantäne überwachen
sd monitor --auto-quarantine /home /tmp

# Daemon mit Auto-Quarantäne
sd daemon start --auto-quarantine
```

Oder als Standardrichtlinie festlegen:

```toml
[policy]
on_malicious = "quarantine"
on_suspicious = "report"
```

## Quarantänedaten exportieren

Quarantäne-Metadaten für Berichte oder SIEM-Integration exportieren:

```bash
# Alle Metadaten als JSON exportieren
sd quarantine list --json > quarantine_report.json

# Statistiken als JSON exportieren
sd quarantine stats --json > quarantine_stats.json
```

## Nächste Schritte

- [Bedrohungsreaktion](/de/prx-sd/remediation/) -- Reaktionsrichtlinien über die Quarantäne hinaus konfigurieren
- [Dateiüberwachung](/de/prx-sd/realtime/monitor) -- Echtzeitschutz mit Auto-Quarantäne
- [Webhook-Alarme](/de/prx-sd/alerts/webhook) -- Benachrichtigt werden, wenn Dateien in Quarantäne kommen
- [Bedrohungsgeheimdienst](/de/prx-sd/signatures/) -- Übersicht der Signaturdatenbank
