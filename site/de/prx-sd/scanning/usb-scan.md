---
title: USB-Gerätescan
description: "Angeschlossene USB-Wechselspeichergeräte automatisch erkennen und auf Malware scannen, wenn sie verbunden werden, mit sd scan-usb."
---

# USB-Gerätescan

Der Befehl `sd scan-usb` erkennt angeschlossene USB-Wechselspeichergeräte und scannt ihren Inhalt auf Malware. Dies ist in Umgebungen entscheidend, in denen USB-Laufwerke ein häufiger Malware-Übertragungsvektor sind, wie z.B. Air-Gap-Netzwerke, gemeinsam genutzte Workstations und industrielle Steuerungssysteme.

## Funktionsweise

Bei Aufruf führt `sd scan-usb` folgende Schritte aus:

1. **Geräteerkennung** -- Block-Geräte über `/sys/block/` aufzählen und Wechselgeräte (USB-Massenspeicher) identifizieren.
2. **Mount-Erkennung** -- Prüfen, ob das Gerät bereits eingehängt ist. Falls nicht, kann es optional in einem schreibgeschützten Modus in ein temporäres Verzeichnis eingehängt werden.
3. **Vollständiger Scan** -- Die vollständige Erkennungspipeline (Hash-Matching, YARA-Regeln, heuristische Analyse) auf alle Dateien des Geräts anwenden.
4. **Bericht** -- Einen Scan-Bericht mit Urteilen pro Datei erstellen.

::: tip Auto-Einhängen
Standardmäßig scannt `sd scan-usb` bereits eingehängte Geräte. Verwenden Sie `--auto-mount`, um nicht eingehängte USB-Geräte automatisch im schreibgeschützten Modus zum Scannen einzuhängen.
:::

## Grundlegende Verwendung

Alle angeschlossenen USB-Speichergeräte scannen:

```bash
sd scan-usb
```

Beispiel-Ausgabe:

```
PRX-SD USB Scan
===============
Detected USB devices:
  /dev/sdb1 → /media/user/USB_DRIVE (vfat, 16 GB)

Scanning /media/user/USB_DRIVE...
Scanned: 847 files (2.1 GB)
Threats: 1

  [MALICIOUS] /media/user/USB_DRIVE/autorun.exe
    Layer:   YARA rule
    Rule:    win_worm_usb_spreader
    Details: USB worm with autorun.inf exploitation

Duration: 4.2s
```

## Befehlsoptionen

| Option | Kurz | Standard | Beschreibung |
|--------|------|----------|--------------|
| `--auto-quarantine` | `-q` | aus | Erkannte Bedrohungen automatisch in Quarantäne |
| `--auto-mount` | | aus | Nicht eingehängte USB-Geräte im schreibgeschützten Modus einhängen |
| `--device` | `-d` | alle | Nur ein bestimmtes Gerät scannen (z.B. `/dev/sdb1`) |
| `--json` | `-j` | aus | Ergebnisse im JSON-Format ausgeben |
| `--eject-after` | | aus | Gerät nach dem Scannen sicher auswerfen |
| `--max-size-mb` | | 100 | Dateien überspringen, die größer als diese Größe sind |

## Auto-Quarantäne

Auf USB-Geräten gefundene Bedrohungen automatisch isolieren:

```bash
sd scan-usb --auto-quarantine
```

```
Scanning /media/user/USB_DRIVE...
  [MALICIOUS] /media/user/USB_DRIVE/autorun.exe → Quarantined (QR-20260321-012)
  [MALICIOUS] /media/user/USB_DRIVE/.hidden/payload.bin → Quarantined (QR-20260321-013)

Threats quarantined: 2
Safe to use: Review remaining files before opening.
```

::: warning Wichtig
Wenn `--auto-quarantine` beim USB-Scan verwendet wird, werden die bösartigen Dateien in den lokalen Quarantänetresor auf dem Host-Rechner verschoben, nicht vom USB-Gerät gelöscht. Die Originaldateien auf dem USB verbleiben, es sei denn, Sie verwenden auch `--remediate`.
:::

## Bestimmte Geräte scannen

Wenn mehrere USB-Geräte angeschlossen sind, ein bestimmtes scannen:

```bash
sd scan-usb --device /dev/sdb1
```

Erkannte USB-Geräte auflisten ohne zu scannen:

```bash
sd scan-usb --list
```

```
Detected USB storage devices:
  1. /dev/sdb1  Kingston DataTraveler  16 GB  vfat  Mounted: /media/user/USB_DRIVE
  2. /dev/sdc1  SanDisk Ultra          64 GB  exfat Not mounted
```

## JSON-Ausgabe

```bash
sd scan-usb --json
```

```json
{
  "scan_type": "usb",
  "timestamp": "2026-03-21T17:00:00Z",
  "devices": [
    {
      "device": "/dev/sdb1",
      "label": "USB_DRIVE",
      "filesystem": "vfat",
      "size_gb": 16,
      "mount_point": "/media/user/USB_DRIVE",
      "files_scanned": 847,
      "threats": [
        {
          "path": "/media/user/USB_DRIVE/autorun.exe",
          "verdict": "malicious",
          "layer": "yara",
          "rule": "win_worm_usb_spreader"
        }
      ]
    }
  ]
}
```

## Häufige USB-Bedrohungen

USB-Geräte werden häufig zur Übertragung folgender Malware-Typen verwendet:

| Bedrohungstyp | Beschreibung | Erkennungsschicht |
|---------------|--------------|-------------------|
| Autorun-Würmer | Nutzen `autorun.inf` zur Ausführung unter Windows | YARA-Regeln |
| USB-Dropper | Getarnte Executables (z.B. `document.pdf.exe`) | Heuristik + YARA |
| BadUSB-Payloads | Skripte für HID-Emulations-Angriffe | Dateianalyse |
| Ransomware-Träger | Verschlüsselte Payloads, die beim Kopieren aktivieren | Hash + YARA |
| Datenexfiltrations-Tools | Werkzeuge zum Sammeln und Extrahieren von Daten | Heuristische Analyse |

## Integration mit Echtzeitüberwachung

Sie können USB-Scannen mit dem `sd monitor`-Daemon kombinieren, um USB-Geräte automatisch beim Anschließen zu scannen:

```bash
sd monitor --watch-usb /home /tmp
```

Dies startet den Echtzeit-Dateimonitor und fügt USB-Auto-Scan-Funktionalität hinzu. Wenn ein neues USB-Gerät über udev erkannt wird, wird es automatisch gescannt.

::: tip Kiosk-Modus
Für öffentliche Terminals oder gemeinsam genutzte Workstations kombinieren Sie `--watch-usb` mit `--auto-quarantine`, um Bedrohungen von USB-Geräten automatisch zu neutralisieren, ohne Benutzereingriff.
:::

## Nächste Schritte

- [Datei- und Verzeichnisscan](./file-scan) -- Vollständige Referenz für `sd scan`
- [Arbeitsspeicher-Scan](./memory-scan) -- Laufenden Prozessarbeitsspeicher scannen
- [Rootkit-Erkennung](./rootkit) -- Auf Systemebene-Bedrohungen prüfen
- [Erkennungsengine](../detection/) -- Funktionsweise der mehrschichtigen Pipeline
