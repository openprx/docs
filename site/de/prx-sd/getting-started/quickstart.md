---
title: Schnellstart
description: PRX-SD in 5 Minuten zum Malware-Scannen bringen. Installieren, Signaturen aktualisieren, Dateien scannen, Ergebnisse auswerten und Echtzeitüberwachung aktivieren.
---

# Schnellstart

Dieser Leitfaden führt Sie in weniger als 5 Minuten von null bis zum ersten Malware-Scan. Am Ende haben Sie PRX-SD installiert, Signaturen aktualisiert und Echtzeitüberwachung eingerichtet.

::: tip Voraussetzungen
Sie benötigen ein Linux- oder macOS-System mit installiertem `curl`. Für andere Methoden und Plattformdetails lesen Sie die [Installationsanleitung](./installation).
:::

## Schritt 1: PRX-SD installieren

Neueste Version mit dem Installationsskript herunterladen und installieren:

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash
```

Installation überprüfen:

```bash
sd --version
```

Sie sollten folgende Ausgabe sehen:

```
prx-sd 0.5.0
```

## Schritt 2: Signaturdatenbank aktualisieren

PRX-SD wird mit einer eingebauten Blocklist geliefert, aber Sie müssen die neuesten Bedrohungsinformationen für vollständigen Schutz herunterladen. Der Befehl `update` holt Hash-Signaturen und YARA-Regeln von allen konfigurierten Quellen:

```bash
sd update
```

Erwartete Ausgabe:

```
[INFO] Updating hash signatures...
[INFO]   MalwareBazaar: 12,847 hashes (last 48h)
[INFO]   URLhaus: 8,234 hashes
[INFO]   Feodo Tracker: 1,456 hashes
[INFO]   ThreatFox: 5,891 hashes
[INFO] Updating YARA rules...
[INFO]   Built-in rules: 64
[INFO]   Yara-Rules/rules: 12,400
[INFO]   Neo23x0/signature-base: 8,200
[INFO]   ReversingLabs: 9,500
[INFO]   ESET IOC: 3,800
[INFO]   InQuest: 4,836
[INFO] Signature database updated successfully.
[INFO] Total: 28,428 hashes, 38,800 YARA rules
```

::: tip Vollständiges Update
Um die vollständige VirusShare-Datenbank (20M+ MD5-Hashes) einzuschließen, führen Sie aus:
```bash
sd update --full
```
Dies dauert länger, bietet aber maximale Hash-Abdeckung.
:::

## Schritt 3: Datei oder Verzeichnis scannen

Eine einzelne verdächtige Datei scannen:

```bash
sd scan /path/to/suspicious_file
```

Ein ganzes Verzeichnis rekursiv scannen:

```bash
sd scan /home --recursive
```

Beispielausgabe für ein sauberes Verzeichnis:

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 0
Status:  CLEAN

Duration: 2.3s
```

Beispielausgabe wenn Bedrohungen gefunden werden:

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 2

  [MALICIOUS] /home/user/downloads/invoice.exe
    Match: SHA-256 hash (MalwareBazaar)
    Family: Emotet
    Action: None (use --auto-quarantine to isolate)

  [SUSPICIOUS] /home/user/downloads/tool.bin
    Match: Heuristic analysis
    Score: 45/100
    Findings: High entropy (7.8), UPX packed
    Action: None

Duration: 3.1s
```

## Schritt 4: Ergebnisse auswerten und Maßnahmen ergreifen

Für einen detaillierten JSON-Bericht, der für Automatisierung oder Log-Aufnahme geeignet ist:

```bash
sd scan /home --recursive --json
```

```json
{
  "scan_id": "a1b2c3d4",
  "timestamp": "2026-03-21T10:00:00Z",
  "files_scanned": 1847,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "detection_layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924..."
    }
  ],
  "duration_ms": 3100
}
```

Um erkannte Bedrohungen während eines Scans automatisch in Quarantäne zu verschieben:

```bash
sd scan /home --recursive --auto-quarantine
```

Dateien in Quarantäne werden in ein sicheres, verschlüsseltes Verzeichnis verschoben. Sie können sie auflisten und wiederherstellen:

```bash
# Dateien in Quarantäne auflisten
sd quarantine list

# Eine Datei anhand ihrer Quarantäne-ID wiederherstellen
sd quarantine restore QR-20260321-001
```

::: warning Quarantäne
Dateien in Quarantäne sind verschlüsselt und können nicht versehentlich ausgeführt werden. Verwenden Sie `sd quarantine restore` nur, wenn Sie sicher sind, dass die Datei ein Fehlalarm ist.
:::

## Schritt 5: Echtzeitüberwachung aktivieren

Echtzeitmonitor starten, um Verzeichnisse auf neue oder geänderte Dateien zu überwachen:

```bash
sd monitor /home /tmp /var/www
```

Der Monitor läuft im Vordergrund und scannt Dateien, wenn sie erstellt oder geändert werden:

```
[INFO] Monitoring 3 directories...
[INFO] Press Ctrl+C to stop.
[2026-03-21 10:05:32] SCAN /home/user/downloads/update.bin → CLEAN
[2026-03-21 10:07:15] SCAN /tmp/payload.sh → [MALICIOUS] YARA: linux_backdoor_reverse_shell
```

Um den Monitor als Hintergrunddienst auszuführen:

```bash
# systemd-Dienst installieren und starten
sd service install
sd service start

# Dienststatus prüfen
sd service status
```

## Was Sie jetzt haben

Nach Abschluss dieser Schritte verfügt Ihr System über:

| Komponente | Status |
|------------|--------|
| `sd`-Binärdatei | Im PATH installiert |
| Hash-Datenbank | 28.000+ SHA-256/MD5-Hashes in LMDB |
| YARA-Regeln | 38.800+ Regeln aus 8 Quellen |
| Echtzeitmonitor | Überwacht angegebene Verzeichnisse |

## Nächste Schritte

- [Datei- und Verzeichnisscan](../scanning/file-scan) -- Alle `sd scan`-Optionen erkunden, einschließlich Threads, Ausschlüsse und Größenbeschränkungen
- [Arbeitsspeicher-Scan](../scanning/memory-scan) -- Laufenden Prozessarbeitsspeicher auf In-Memory-Bedrohungen scannen
- [Rootkit-Erkennung](../scanning/rootkit) -- Kernel- und Userspace-Rootkits prüfen
- [Erkennungsengine](../detection/) -- Verstehen, wie die mehrschichtige Pipeline funktioniert
- [YARA-Regeln](../detection/yara-rules) -- Über Regelquellen und benutzerdefinierte Regeln lernen
