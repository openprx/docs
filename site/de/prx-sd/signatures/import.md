---
title: Hashes importieren
description: Benutzerdefinierte Hash-Blocklists und ClamAV-Signaturdatenbanken in PRX-SD importieren.
---

# Hashes importieren

PRX-SD ermöglicht den Import benutzerdefinierter Hash-Blocklists und ClamAV-Signaturdatenbanken, um die Erkennungsabdeckung mit eigenen Bedrohungsgeheimdiensten oder organisationalen Blocklists zu erweitern.

## Benutzerdefinierte Hashes importieren

### Verwendung

```bash
sd import [OPTIONS] <FILE>
```

### Optionen

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--format` | `-f` | Auto-Erkennung | Hash-Format: `sha256`, `sha1`, `md5`, `auto` |
| `--label` | `-l` | Dateiname | Bezeichnung für den importierten Satz |
| `--replace` | | `false` | Vorhandene Einträge mit gleicher Bezeichnung ersetzen |
| `--dry-run` | | `false` | Datei ohne Importieren validieren |
| `--quiet` | `-q` | `false` | Fortschrittsausgabe unterdrücken |

### Unterstützte Hash-Dateiformate

PRX-SD akzeptiert mehrere gängige Formate:

**Einfache Liste** -- ein Hash pro Zeile:

```
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

**Hash mit Bezeichnung** -- Hash gefolgt von einem Leerzeichen und optionaler Beschreibung:

```
e3b0c44298fc1c149afbf4c8996fb924  empty_file
d7a8fbb307d7809469ca9abcb0082e4f  known_malware_sample
```

**CSV-Format** -- kommagetrennt mit Kopfzeilen:

```csv
hash,family,source
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855,Emotet,internal
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592,TrickBot,partner
```

**Kommentarzeilen** -- Zeilen, die mit `#` beginnen, werden ignoriert:

```
# Benutzerdefinierte Blocklist - aktualisiert 2026-03-21
# Quelle: internes Threat-Hunting-Team
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

::: tip
Das Hash-Format wird anhand der Länge automatisch erkannt: 32 Zeichen = MD5, 40 Zeichen = SHA-1, 64 Zeichen = SHA-256. `--format` verwenden, um es zu überschreiben, wenn die Erkennung fehlschlägt.
:::

### Import-Beispiele

```bash
# SHA-256-Blocklist importieren
sd import threat_hashes.txt

# Mit explizitem Format und Bezeichnung importieren
sd import --format md5 --label "partner-feed-2026Q1" partner_hashes.txt

# Trockenlauf zur Dateivalidierung
sd import --dry-run suspicious_hashes.csv

# Vorhandenen Import-Satz ersetzen
sd import --replace --label "daily-feed" today_hashes.txt
```

### Import-Ausgabe

```
Importing hashes from threat_hashes.txt...
  Format:    SHA-256 (auto-detected)
  Label:     threat_hashes
  Total:     1,247 lines
  Valid:     1,203 hashes
  Skipped:   44 (duplicates: 38, invalid: 6)
  Imported:  1,203 new entries
  Database:  ~/.prx-sd/signatures/hashes/custom.lmdb
```

## ClamAV-Datenbanken importieren

### Verwendung

```bash
sd import-clamav [OPTIONS] <FILE>
```

### Optionen

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--type` | `-t` | Auto-Erkennung | Datenbanktyp: `cvd`, `cld`, `hdb`, `hsb`, `auto` |
| `--quiet` | `-q` | `false` | Fortschrittsausgabe unterdrücken |

### Unterstützte ClamAV-Formate

| Format | Erweiterung | Beschreibung |
|--------|-------------|-------------|
| **CVD** | `.cvd` | ClamAV Virus Database (komprimiert, signiert) |
| **CLD** | `.cld` | ClamAV Local Database (inkrementelle Updates) |
| **HDB** | `.hdb` | MD5-Hash-Datenbank (Klartext) |
| **HSB** | `.hsb` | SHA-256-Hash-Datenbank (Klartext) |
| **NDB** | `.ndb` | Erweitertes Signaturformat (körperbasiert) |

::: warning
CVD/CLD-Dateien können sehr groß sein. Die `main.cvd`-Datei allein enthält über 6 Millionen Signaturen und benötigt nach dem Import ca. 300 MB Festplattenspeicher.
:::

### ClamAV-Import-Beispiele

```bash
# Hauptdatenbank von ClamAV importieren
sd import-clamav /var/lib/clamav/main.cvd

# Tages-Update-Datenbank importieren
sd import-clamav /var/lib/clamav/daily.cvd

# Klartext-Hash-Datenbank importieren
sd import-clamav custom_sigs.hdb

# SHA-256-Hash-Datenbank importieren
sd import-clamav my_hashes.hsb
```

### ClamAV-Integration einrichten

Um ClamAV-Signaturen mit PRX-SD zu verwenden:

1. freshclam installieren (ClamAV-Updater):

```bash
# Debian/Ubuntu
sudo apt install clamav

# macOS
brew install clamav

# Fedora/RHEL
sudo dnf install clamav-update
```

2. Datenbanken herunterladen:

```bash
sudo freshclam
```

3. In PRX-SD importieren:

```bash
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

4. ClamAV in der Konfiguration aktivieren:

```toml
[signatures.sources]
clamav = true
```

## Importierte Hashes verwalten

Importierte Hash-Sätze anzeigen:

```bash
sd info --imports
```

```
Custom Hash Imports:
  threat_hashes       1,203 SHA-256  imported 2026-03-21
  partner-feed-2026Q1   847 MD5      imported 2026-03-15
  daily-feed          2,401 SHA-256  imported 2026-03-21

ClamAV Imports:
  main.cvd            6,234,109 sigs  imported 2026-03-20
  daily.cvd           1,847,322 sigs  imported 2026-03-21
```

Importierten Satz entfernen:

```bash
sd import --remove --label "partner-feed-2026Q1"
```

## Nächste Schritte

- [Benutzerdefinierte YARA-Regeln](./custom-rules) -- musterbasierte Erkennungsregeln schreiben
- [Signaturquellen](./sources) -- alle verfügbaren Bedrohungsgeheimdienst-Quellen
- [Signaturen aktualisieren](./update) -- Datenbanken aktuell halten
- [Bedrohungsgeheimdienst Übersicht](./index) -- Datenbankarchitektur
