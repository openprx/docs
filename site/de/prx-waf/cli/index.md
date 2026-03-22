---
title: CLI-Befehlsreferenz
description: "Vollständige Referenz für alle PRX-WAF CLI-Befehle und Unterbefehle. Server-Verwaltung, Regeloperationen, CrowdSec-Integration und Bot-Erkennung."
---

# CLI-Befehlsreferenz

Die `prx-waf`-Kommandozeilenschnittstelle bietet Befehle für Server-Verwaltung, Regeloperationen, CrowdSec-Integration und Bot-Erkennung.

## Globale Optionen

| Flag | Standard | Beschreibung |
|------|---------|-------------|
| `-c, --config <FILE>` | `configs/default.toml` | Pfad zur TOML-Konfigurationsdatei |

```bash
prx-waf -c /etc/prx-waf/config.toml <COMMAND>
```

## Server-Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `prx-waf run` | Reverse-Proxy + Management-API starten (blockiert dauerhaft) |
| `prx-waf migrate` | Nur Datenbankmigrationen ausführen |
| `prx-waf seed-admin` | Standard-Admin-Benutzer erstellen (admin/admin) |

```bash
# Server starten
prx-waf -c configs/default.toml run

# Migrationen vor dem ersten Start ausführen
prx-waf -c configs/default.toml migrate

# Admin-Benutzer erstellen
prx-waf -c configs/default.toml seed-admin
```

::: tip
Bei der Ersteinrichtung `migrate` und `seed-admin` vor `run` ausführen. Nachfolgende Starts benötigen nur `run` -- Migrationen werden automatisch überprüft.
:::

## Regelverwaltung

Befehle zur Verwaltung von Erkennungsregeln. Alle Regelbefehle operieren auf dem konfigurierten Regelverzeichnis.

| Befehl | Beschreibung |
|--------|-------------|
| `prx-waf rules list` | Alle geladenen Regeln auflisten |
| `prx-waf rules list --category <CAT>` | Regeln nach Kategorie filtern |
| `prx-waf rules list --source <SRC>` | Regeln nach Quelle filtern |
| `prx-waf rules info <RULE-ID>` | Detaillierte Informationen über eine Regel anzeigen |
| `prx-waf rules enable <RULE-ID>` | Eine deaktivierte Regel aktivieren |
| `prx-waf rules disable <RULE-ID>` | Eine Regel deaktivieren |
| `prx-waf rules reload` | Alle Regeln von der Festplatte hot-reloaden |
| `prx-waf rules validate <PATH>` | Eine Regeldatei auf Korrektheit validieren |
| `prx-waf rules import <PATH\|URL>` | Regeln aus einer Datei oder URL importieren |
| `prx-waf rules export [--format yaml]` | Aktuellen Regelsatz exportieren |
| `prx-waf rules update` | Neueste Regeln aus Remote-Quellen abrufen |
| `prx-waf rules search <QUERY>` | Regeln nach Name oder Beschreibung suchen |
| `prx-waf rules stats` | Regelstatistiken anzeigen |

### Beispiele

```bash
# Alle SQL-Injection-Regeln auflisten
prx-waf rules list --category sqli

# OWASP CRS-Regeln auflisten
prx-waf rules list --source owasp

# Details für eine bestimmte Regel anzeigen
prx-waf rules info CRS-942100

# Eine Regel deaktivieren, die Falsch-Positive verursacht
prx-waf rules disable CRS-942100

# Nach Regelbearbeitung hot-reloaden
prx-waf rules reload

# Benutzerdefinierte Regeln vor der Bereitstellung validieren
prx-waf rules validate rules/custom/myapp.yaml

# Regeln aus einer URL importieren
prx-waf rules import https://example.com/rules/custom.yaml

# Alle Regeln als YAML exportieren
prx-waf rules export --format yaml > all-rules.yaml

# Statistiken anzeigen
prx-waf rules stats
```

## Regelquellen-Verwaltung

Befehle zur Verwaltung von Remote-Regelquellen.

| Befehl | Beschreibung |
|--------|-------------|
| `prx-waf sources list` | Konfigurierte Regelquellen auflisten |
| `prx-waf sources add <NAME> <URL>` | Eine Remote-Regelquelle hinzufügen |
| `prx-waf sources remove <NAME>` | Eine Regelquelle entfernen |
| `prx-waf sources update [NAME]` | Neuestes von einer bestimmten Quelle abrufen (oder allen) |
| `prx-waf sources sync` | Alle Remote-Quellen synchronisieren |

### Beispiele

```bash
# Alle Quellen auflisten
prx-waf sources list

# Eine benutzerdefinierte Quelle hinzufügen
prx-waf sources add my-rules https://example.com/rules/latest.yaml

# Alle Quellen synchronisieren
prx-waf sources sync

# Eine bestimmte Quelle aktualisieren
prx-waf sources update owasp-crs
```

## CrowdSec-Integration

Befehle zur Verwaltung der CrowdSec-Bedrohungsgeheimdienst-Integration.

| Befehl | Beschreibung |
|--------|-------------|
| `prx-waf crowdsec status` | CrowdSec-Integrationsstatus anzeigen |
| `prx-waf crowdsec decisions` | Aktive Entscheidungen von LAPI auflisten |
| `prx-waf crowdsec test` | LAPI-Konnektivität testen |
| `prx-waf crowdsec setup` | Interaktiver CrowdSec-Einrichtungsassistent |

### Beispiele

```bash
# Integrationsstatus prüfen
prx-waf crowdsec status

# Aktive Block/Captcha-Entscheidungen auflisten
prx-waf crowdsec decisions

# Konnektivität zu CrowdSec LAPI testen
prx-waf crowdsec test

# Einrichtungsassistenten starten
prx-waf crowdsec setup
```

## Bot-Erkennung

Befehle zur Verwaltung von Bot-Erkennungsregeln.

| Befehl | Beschreibung |
|--------|-------------|
| `prx-waf bot list` | Bekannte Bot-Signaturen auflisten |
| `prx-waf bot add <PATTERN> [--action ACTION]` | Ein Bot-Erkennungsmuster hinzufügen |
| `prx-waf bot remove <PATTERN>` | Ein Bot-Erkennungsmuster entfernen |
| `prx-waf bot test <USER-AGENT>` | Einen User-Agent gegen Bot-Regeln testen |

### Beispiele

```bash
# Alle Bot-Signaturen auflisten
prx-waf bot list

# Ein neues Bot-Muster hinzufügen
prx-waf bot add "(?i)my-bad-bot" --action block

# Ein Bot-Muster im Log-only-Modus hinzufügen
prx-waf bot add "(?i)suspicious-crawler" --action log

# Einen User-Agent-String testen
prx-waf bot test "Mozilla/5.0 (compatible; Googlebot/2.1)"

# Ein Bot-Muster entfernen
prx-waf bot remove "(?i)my-bad-bot"
```

## Nutzungsmuster

### Ersteinrichtung

```bash
# 1. Migrationen ausführen
prx-waf -c configs/default.toml migrate

# 2. Admin-Benutzer erstellen
prx-waf -c configs/default.toml seed-admin

# 3. Server starten
prx-waf -c configs/default.toml run
```

### Regel-Wartungs-Workflow

```bash
# 1. Auf Upstream-Regelupdates prüfen
prx-waf rules update

# 2. Nach Update validieren
prx-waf rules validate rules/

# 3. Änderungen überprüfen
prx-waf rules stats

# 4. Hot-Reload
prx-waf rules reload
```

### CrowdSec-Integrationseinrichtung

```bash
# 1. Einrichtungsassistenten starten
prx-waf crowdsec setup

# 2. Konnektivität testen
prx-waf crowdsec test

# 3. Verifikation, dass Entscheidungen fließen
prx-waf crowdsec decisions
```

## Nächste Schritte

- [Schnellstart](../getting-started/quickstart) -- Mit PRX-WAF beginnen
- [Regel-Engine](../rules/) -- Erkennungspipeline verstehen
- [Konfigurationsreferenz](../configuration/reference) -- Alle Konfigurationsschlüssel
