---
title: Signaturen aktualisieren
description: "Bedrohungsgeheimdienst-Datenbanken mit sd update aktuell halten, einschließlich inkrementeller Updates und Ed25519-Verifizierung."
---

# Signaturen aktualisieren

Der Befehl `sd update` lädt die neuesten Bedrohungssignaturen aus allen konfigurierten Quellen herunter. Regelmäßige Updates sind entscheidend -- neue Malware-Samples erscheinen jede Minute, und eine veraltete Signaturdatenbank hinterlässt Lücken im Schutz.

## Verwendung

```bash
sd update [OPTIONS]
```

## Optionen

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--check-only` | | `false` | Nach verfügbaren Updates suchen, ohne herunterzuladen |
| `--force` | `-f` | `false` | Alle Signaturen neu herunterladen, Cache ignorieren |
| `--source` | `-s` | alle | Nur eine bestimmte Quellkategorie aktualisieren: `hashes`, `yara`, `ioc`, `clamav` |
| `--full` | | `false` | Große Datensätze einschließen (VirusShare 20M+ MD5-Hashes) |
| `--server-url` | | offiziell | Benutzerdefinierte Update-Server-URL |
| `--no-verify` | | `false` | Ed25519-Signaturverifizierung überspringen (nicht empfohlen) |
| `--timeout` | `-t` | `300` | Download-Timeout pro Quelle in Sekunden |
| `--parallel` | `-p` | `4` | Anzahl paralleler Downloads |
| `--quiet` | `-q` | `false` | Fortschrittsausgabe unterdrücken |

## Funktionsweise

### Update-Ablauf

```
sd update
  1. Metadaten.json vom Update-Server abrufen
  2. Lokale Versionen mit Remote-Versionen vergleichen
  3. Für jede veraltete Quelle:
     a. Inkrementellen Diff herunterladen (oder vollständige Datei, wenn kein Diff verfügbar)
     b. Ed25519-Signatur verifizieren
     c. In lokale Datenbank einpflegen
  4. YARA-Regeln neu kompilieren
  5. Lokale metadata.json aktualisieren
```

### Inkrementelle Updates

PRX-SD verwendet inkrementelle Updates, um Bandbreite zu minimieren:

| Quellentyp | Update-Methode | Typische Größe |
|------------|---------------|----------------|
| Hash-Datenbanken | Delta-Diff (Ergänzungen + Entfernungen) | 50-200 KB |
| YARA-Regeln | Git-ähnliche Patches | 10-50 KB |
| IOC-Feeds | Vollständiger Ersatz (kleine Dateien) | 1-5 MB |
| ClamAV | cdiff-Inkremental-Updates | 100-500 KB |

Wenn inkrementelle Updates nicht verfügbar sind (Erstinstallation, Beschädigung oder `--force`), werden vollständige Datenbanken heruntergeladen.

### Ed25519-Signaturverifizierung

Jede heruntergeladene Datei wird vor der Anwendung gegen eine Ed25519-Signatur verifiziert. Dies schützt vor:

- **Manipulationen** -- veränderte Dateien werden abgelehnt
- **Beschädigungen** -- unvollständige Downloads werden erkannt
- **Replay-Angriffen** -- alte Signaturen können nicht wiederholt werden (Zeitstempel-Validierung)

Der Signatur-öffentliche-Schlüssel ist bei der Kompilierung in die `sd`-Binärdatei eingebettet.

::: warning
Verwenden Sie niemals `--no-verify` in der Produktion. Die Signaturverifizierung verhindert Supply-Chain-Angriffe durch kompromittierte Update-Server oder Man-in-the-Middle-Angriffe.
:::

## Updates prüfen

Um verfügbare Updates zu sehen, ohne herunterzuladen:

```bash
sd update --check-only
```

```
Checking for updates...
  MalwareBazaar:    update available (v2026.0321.2, +847 hashes)
  URLhaus:          up to date (v2026.0321.1)
  Feodo Tracker:    update available (v2026.0321.3, +12 hashes)
  ThreatFox:        up to date (v2026.0321.1)
  YARA Community:   update available (v2026.0320.1, +3 rules)
  IOC Feeds:        update available (v2026.0321.1, +1,204 indicators)
  ClamAV:           not configured

3 sources have updates available.
Run 'sd update' to download.
```

## Benutzerdefinierter Update-Server

Für air-gapped Umgebungen oder Organisationen, die einen privaten Spiegel betreiben:

```bash
sd update --server-url https://signatures.internal.corp/prx-sd
```

Server dauerhaft in `config.toml` festlegen:

```toml
[update]
server_url = "https://signatures.internal.corp/prx-sd"
interval_hours = 6
auto_update = true
```

::: tip
Verwenden Sie das `prx-sd-mirror`-Tool, um einen lokalen Signatur-Spiegel einzurichten. Weitere Informationen finden Sie im [Self-Hosting-Leitfaden](https://github.com/OpenPRX/prx-sd-signatures).
:::

## Shell-Skript-Alternative

Für Systeme, auf denen `sd` nicht installiert ist, das mitgelieferte Shell-Skript verwenden:

```bash
# Standard-Update (Hashes + YARA)
./tools/update-signatures.sh

# Vollständiges Update einschließlich VirusShare
./tools/update-signatures.sh --full

# Nur Hashes aktualisieren
./tools/update-signatures.sh --source hashes

# Nur YARA-Regeln aktualisieren
./tools/update-signatures.sh --source yara
```

## Beispiele

```bash
# Standard-Update
sd update

# Vollständigen Neu-Download aller erzwingen
sd update --force

# Nur YARA-Regeln aktualisieren
sd update --source yara

# Vollständiges Update mit VirusShare (großer Download)
sd update --full

# Stiller Modus für Cron-Jobs
sd update --quiet

# Zuerst prüfen, was verfügbar ist
sd update --check-only

# Benutzerdefinierten Server mit erhöhter Parallelität verwenden
sd update --server-url https://mirror.example.com --parallel 8
```

## Updates automatisieren

### Mit sd daemon

Der Daemon übernimmt Updates automatisch. Intervall konfigurieren:

```bash
sd daemon start --update-hours 4
```

### Mit cron

```bash
# Signaturen alle 6 Stunden aktualisieren
0 */6 * * * /usr/local/bin/sd update --quiet 2>&1 | logger -t prx-sd
```

### Mit systemd-Timer

```ini
# /etc/systemd/system/prx-sd-update.timer
[Unit]
Description=PRX-SD Signature Update Timer

[Timer]
OnCalendar=*-*-* 00/6:00:00
RandomizedDelaySec=900
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now prx-sd-update.timer
```

## Nächste Schritte

- [Signaturquellen](./sources) -- Details zu jeder Bedrohungsgeheimdienst-Quelle
- [Hashes importieren](./import) -- Benutzerdefinierte Hash-Blocklists hinzufügen
- [Daemon](../realtime/daemon) -- Automatische Hintergrund-Updates
- [Bedrohungsgeheimdienst Übersicht](./index) -- Datenbankarchitektur-Übersicht
