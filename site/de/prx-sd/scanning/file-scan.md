---
title: Datei- und Verzeichnisscan
description: "Vollständige Referenz für den Befehl sd scan. Dateien und Verzeichnisse mit Hash-Matching, YARA-Regeln und heuristischer Analyse auf Malware scannen."
---

# Datei- und Verzeichnisscan

Der Befehl `sd scan` ist die primäre Methode, um Dateien und Verzeichnisse auf Malware zu prüfen. Er führt jede Datei durch die mehrschichtige Erkennungspipeline -- Hash-Matching, YARA-Regeln und heuristische Analyse -- und meldet ein Urteil für jede Datei.

## Grundlegende Verwendung

Eine einzelne Datei scannen:

```bash
sd scan /path/to/file
```

Ein Verzeichnis (standardmäßig nicht rekursiv) scannen:

```bash
sd scan /home/user/downloads
```

Ein Verzeichnis und alle Unterverzeichnisse scannen:

```bash
sd scan /home --recursive
```

## Befehlsoptionen

| Option | Kurz | Standard | Beschreibung |
|--------|------|----------|--------------|
| `--recursive` | `-r` | aus | Rekursiv in Unterverzeichnisse |
| `--json` | `-j` | aus | Ergebnisse im JSON-Format ausgeben |
| `--threads` | `-t` | CPU-Kerne | Anzahl paralleler Scan-Threads |
| `--auto-quarantine` | `-q` | aus | Erkannte Bedrohungen automatisch in Quarantäne |
| `--remediate` | | aus | Automatische Bereinigung versuchen (löschen/quarantäne basierend auf Richtlinie) |
| `--exclude` | `-e` | keine | Glob-Muster zum Ausschließen von Dateien oder Verzeichnissen |
| `--report` | | keine | Scan-Bericht in Dateipfad schreiben |
| `--max-size-mb` | | 100 | Dateien überspringen, die größer als diese Größe in Megabyte sind |
| `--no-yara` | | aus | YARA-Regel-Scannen überspringen |
| `--no-heuristics` | | aus | Heuristische Analyse überspringen |
| `--min-severity` | | `suspicious` | Minimaler Schweregrad für Bericht (`suspicious` oder `malicious`) |

## Erkennungsablauf

Wenn `sd scan` eine Datei verarbeitet, durchläuft sie die Erkennungspipeline in Reihenfolge:

```
Datei → Magic-Number-Erkennung → Dateityp bestimmen
  │
  ├─ Schicht 1: SHA-256 Hash-Lookup (LMDB)
  │   Treffer → BÖSARTIG (sofort, ~1μs pro Datei)
  │
  ├─ Schicht 2: YARA-X-Regel-Scan (38.800+ Regeln)
  │   Treffer → BÖSARTIG mit Regelname
  │
  ├─ Schicht 3: Heuristische Analyse (dateityp-bewusst)
  │   Score ≥ 60 → BÖSARTIG
  │   Score 30-59 → VERDÄCHTIG
  │   Score < 30 → SAUBER
  │
  └─ Ergebnisaggregation → höchster Schweregrad gewinnt
```

Die Pipeline hat einen Kurzschluss: Wenn ein Hash-Treffer gefunden wird, werden YARA- und heuristische Analyse für diese Datei übersprungen. Dies macht das Scannen großer Verzeichnisse schnell -- die meisten sauberen Dateien werden in Mikrosekunden auf Hash-Ebene aufgelöst.

## Ausgabeformate

### Menschenlesbar (Standard)

```bash
sd scan /home/user/downloads --recursive
```

```
PRX-SD Scan Report
==================
Scanned: 3,421 files (1.2 GB)
Skipped: 14 files (exceeded max size)
Threats: 3 (2 malicious, 1 suspicious)

  [MALICIOUS] /home/user/downloads/invoice.exe
    Layer:   Hash match (SHA-256)
    Source:  MalwareBazaar
    Family:  Emotet
    SHA-256: e3b0c44298fc1c149afbf4c8996fb924...

  [MALICIOUS] /home/user/downloads/patch.scr
    Layer:   YARA rule
    Rule:    win_ransomware_lockbit3
    Source:  ReversingLabs

  [SUSPICIOUS] /home/user/downloads/updater.bin
    Layer:   Heuristic analysis
    Score:   42/100
    Findings:
      - High section entropy: 7.91 (packed)
      - Suspicious API imports: VirtualAllocEx, WriteProcessMemory
      - Non-standard PE timestamp

Duration: 5.8s (589 files/s)
```

### JSON-Ausgabe

```bash
sd scan /path --recursive --json
```

```json
{
  "scan_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2026-03-21T14:30:00Z",
  "files_scanned": 3421,
  "files_skipped": 14,
  "total_bytes": 1288490188,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
      "md5": "d41d8cd98f00b204e9800998ecf8427e"
    }
  ],
  "duration_ms": 5800,
  "throughput_files_per_sec": 589
}
```

### Berichtsdatei

Ergebnisse für die Archivierung in eine Datei schreiben:

```bash
sd scan /srv/web --recursive --report /var/log/prx-sd/scan-report.json
```

## Ausschlussmuster

Verwenden Sie `--exclude`, um Dateien oder Verzeichnisse zu überspringen, die Glob-Mustern entsprechen. Mehrere Muster können angegeben werden:

```bash
sd scan /home --recursive \
  --exclude "*.log" \
  --exclude "node_modules/**" \
  --exclude ".git/**" \
  --exclude "/home/user/VMs/**"
```

::: tip Performance
Das Ausschließen großer Verzeichnisse wie `node_modules`, `.git` und VM-Images verbessert die Scan-Geschwindigkeit erheblich.
:::

## Auto-Quarantäne

Das Flag `--auto-quarantine` verschiebt erkannte Bedrohungen während des Scans in den Quarantänetresor:

```bash
sd scan /tmp --recursive --auto-quarantine
```

```
[MALICIOUS] /tmp/dropper.exe → Quarantined (QR-20260321-007)
```

Dateien in Quarantäne werden mit AES-256 verschlüsselt und in `~/.local/share/prx-sd/quarantine/` gespeichert. Sie können nicht versehentlich ausgeführt werden. Weitere Informationen finden Sie in der [Quarantäne-Dokumentation](../quarantine/).

## Beispielszenarien

### CI/CD-Pipeline-Scan

Build-Artefakte vor der Bereitstellung scannen:

```bash
sd scan ./dist --recursive --json --min-severity suspicious
```

Verwenden Sie den Exit-Code für Automatisierung: `0` = sauber, `1` = Bedrohungen gefunden, `2` = Scan-Fehler.

### Web-Server-Täglicher Scan

Einen nächtlichen Scan der web-zugänglichen Verzeichnisse planen:

```bash
sd scan /var/www /srv/uploads --recursive \
  --auto-quarantine \
  --report /var/log/prx-sd/daily-$(date +%Y%m%d).json \
  --exclude "*.log"
```

### Forensische Untersuchung

Ein als schreibgeschützt eingehängtes Datenträger-Image scannen:

```bash
sudo mount -o ro /dev/sdb1 /mnt/evidence
sd scan /mnt/evidence --recursive --json --threads 1 --max-size-mb 500
```

::: warning Große Scans
Beim Scannen von Millionen von Dateien verwenden Sie `--threads`, um die Ressourcennutzung zu steuern, und `--max-size-mb`, um überdimensionale Dateien zu überspringen, die den Scan verlangsamen können.
:::

### Home-Verzeichnis-Schnellprüfung

Schnell-Scan häufiger Bedrohungsstandorte:

```bash
sd scan ~/Downloads ~/Desktop /tmp --recursive
```

## Performance-Optimierung

| Dateien | Ungefähre Zeit | Hinweise |
|---------|----------------|----------|
| 1.000 | < 1 Sekunde | Hash-Schicht löst die meisten Dateien auf |
| 10.000 | 2-5 Sekunden | YARA-Regeln fügen ~0,3 ms pro Datei hinzu |
| 100.000 | 20-60 Sekunden | Abhängig von Dateigrößen und -typen |
| 1.000.000+ | 5-15 Minuten | `--threads` und `--exclude` verwenden |

Faktoren, die die Scan-Geschwindigkeit beeinflussen:

- **Festplatten-I/O** -- SSD ist 5-10x schneller als HDD für zufällige Lesevorgänge
- **Dateigrößenverteilung** -- Viele kleine Dateien sind schneller als wenige große Dateien
- **Erkennungsschichten** -- Nur-Hash-Scans (`--no-yara --no-heuristics`) sind am schnellsten
- **Thread-Anzahl** -- Mehr Threads helfen auf Mehrkern-Systemen mit schnellem Speicher

## Nächste Schritte

- [Arbeitsspeicher-Scan](./memory-scan) -- Laufenden Prozessarbeitsspeicher scannen
- [Rootkit-Erkennung](./rootkit) -- Auf Kernel-Ebene-Bedrohungen prüfen
- [USB-Scan](./usb-scan) -- Wechselmedien scannen
- [Erkennungsengine](../detection/) -- Funktionsweise jeder Erkennungsschicht
