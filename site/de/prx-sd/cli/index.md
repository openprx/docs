---
title: CLI-Befehlsreferenz
description: Vollständige Referenz für alle 27 sd-CLI-Unterbefehle, nach Kategorie geordnet, mit globalen Optionen und schnellen Verwendungsbeispielen.
---

# CLI-Befehlsreferenz

Die `sd`-Befehlszeilenschnittstelle bietet 27 Unterbefehle, die in 10 Kategorien organisiert sind. Diese Seite dient als Schnellreferenz-Index. Jeder Befehl verlinkt auf seine detaillierte Dokumentationsseite, sofern verfügbar.

## Globale Optionen

Diese Flags können an jeden Unterbefehl übergeben werden:

| Flag | Standard | Beschreibung |
|------|----------|--------------|
| `--log-level <LEVEL>` | `warn` | Protokollierungsdetailgrad: `trace`, `debug`, `info`, `warn`, `error` |
| `--data-dir <PATH>` | `~/.prx-sd` | Basis-Datenverzeichnis für Signaturen, Quarantäne, Konfiguration und Plugins |
| `--help` | -- | Hilfe für jeden Befehl oder Unterbefehl anzeigen |
| `--version` | -- | Engine-Version anzeigen |

```bash
# Debug-Protokollierung aktivieren
sd --log-level debug scan /tmp

# Benutzerdefiniertes Datenverzeichnis verwenden
sd --data-dir /opt/prx-sd scan /home
```

## Scannen

Befehle für bedarfsgerechtes Datei- und System-Scanning.

| Befehl | Beschreibung |
|--------|--------------|
| `sd scan <PATH>` | Datei oder Verzeichnis auf Bedrohungen scannen |
| `sd scan-memory` | Laufenden Prozessarbeitsspeicher scannen (nur Linux, erfordert Root) |
| `sd scan-usb [DEVICE]` | USB/Wechselgeräte scannen |
| `sd check-rootkit` | Auf Rootkit-Indikatoren prüfen (nur Linux) |

```bash
# Verzeichnis rekursiv mit automatischer Quarantäne scannen
sd scan /home --auto-quarantine

# Mit JSON-Ausgabe für Automatisierung scannen
sd scan /tmp --json

# Mit 4 Threads und HTML-Bericht scannen
sd scan /var --threads 4 --report /tmp/report.html

# Muster ausschließen
sd scan /home --exclude "*.log" --exclude "/home/user/.cache"

# Scannen und automatisch bereinigen (Prozess beenden, Quarantäne, Persistenz entfernen)
sd scan /tmp --remediate

# Prozessarbeitsspeicher scannen
sudo sd scan-memory
sudo sd scan-memory --pid 1234

# USB-Geräte scannen
sd scan-usb
sd scan-usb /dev/sdb1 --auto-quarantine

# Auf Rootkits prüfen
sudo sd check-rootkit
sudo sd check-rootkit --json
```

## Echtzeitüberwachung

Befehle für kontinuierliche Dateisystemüberwachung und Hintergrund-Daemon-Betrieb.

| Befehl | Beschreibung |
|--------|--------------|
| `sd monitor <PATHS...>` | Echtzeit-Dateisystemüberwachung starten |
| `sd daemon [PATHS...]` | Als Hintergrund-Daemon mit Überwachung und automatischen Updates ausführen |

```bash
# /home und /tmp auf Änderungen überwachen
sd monitor /home /tmp

# Mit Block-Modus überwachen (fanotify, erfordert Root)
sudo sd monitor /home --block

# Als Daemon mit Standardpfaden (/home, /tmp) ausführen
sd daemon

# Daemon mit benutzerdefiniertem Update-Intervall (alle 2 Stunden)
sd daemon /home /tmp /var --update-hours 2
```

## Quarantäneverwaltung

Befehle zur Verwaltung des AES-256-GCM-verschlüsselten Quarantänetresors.

| Befehl | Beschreibung |
|--------|--------------|
| `sd quarantine list` | Alle Dateien in Quarantäne auflisten |
| `sd quarantine restore <ID>` | Eine Datei aus der Quarantäne an ihren ursprünglichen Ort wiederherstellen |
| `sd quarantine delete <ID>` | Eine Datei aus der Quarantäne dauerhaft löschen |
| `sd quarantine delete-all` | Alle Dateien aus der Quarantäne dauerhaft löschen |
| `sd quarantine stats` | Statistiken zum Quarantänetresor anzeigen |

```bash
# Dateien in Quarantäne auflisten
sd quarantine list

# Datei wiederherstellen (erste 8 Zeichen der ID verwenden)
sd quarantine restore a1b2c3d4

# An alternativen Pfad wiederherstellen
sd quarantine restore a1b2c3d4 --to /tmp/recovered/

# Einen bestimmten Eintrag löschen
sd quarantine delete a1b2c3d4

# Alle Einträge löschen (mit Bestätigungsaufforderung)
sd quarantine delete-all

# Alle Einträge ohne Bestätigung löschen
sd quarantine delete-all --yes

# Quarantäne-Statistiken anzeigen
sd quarantine stats
```

## Signaturverwaltung

Befehle zum Aktualisieren und Importieren von Bedrohungssignaturen.

| Befehl | Beschreibung |
|--------|--------------|
| `sd update` | Auf Signatur-Datenbankupdates prüfen und anwenden |
| `sd import <FILE>` | Hash-Signaturen aus einer Blocklist-Datei importieren |
| `sd import-clamav <FILES...>` | ClamAV-Signaturdateien importieren (.cvd, .hdb, .hsb) |
| `sd info` | Engine-Version, Signaturstatus und Systeminformationen anzeigen |

```bash
# Signaturen aktualisieren
sd update

# Auf Updates prüfen ohne herunterzuladen
sd update --check-only

# Neudownload erzwingen
sd update --force

# Benutzerdefinierte Hash-Datei importieren
sd import /path/to/hashes.txt

# ClamAV-Signaturen importieren
sd import-clamav main.cvd daily.cvd

# Engine-Informationen anzeigen
sd info
```

## Konfiguration

Befehle zur Verwaltung der Engine-Konfiguration und Bereinigungsrichtlinie.

| Befehl | Beschreibung |
|--------|--------------|
| `sd config show` | Aktuelle Konfiguration anzeigen |
| `sd config set <KEY> <VALUE>` | Konfigurationswert festlegen |
| `sd config reset` | Konfiguration auf Standardwerte zurücksetzen |
| `sd policy show` | Bereinigungsrichtlinie anzeigen |
| `sd policy set <KEY> <VALUE>` | Bereinigungsrichtlinienwert festlegen |
| `sd policy reset` | Bereinigungsrichtlinie auf Standardwerte zurücksetzen |

```bash
# Konfiguration anzeigen
sd config show

# Scan-Threads festlegen
sd config set scan.threads 8

# Auf Standardwerte zurücksetzen
sd config reset

# Bereinigungsrichtlinie anzeigen
sd policy show
```

Weitere Informationen finden Sie unter [Konfigurationsübersicht](../configuration/) und [Konfigurationsreferenz](../configuration/reference).

## Geplante Scans

Befehle zur Verwaltung wiederkehrender geplanter Scans über systemd-Timer oder Cron.

| Befehl | Beschreibung |
|--------|--------------|
| `sd schedule add <PATH>` | Einen wiederkehrenden geplanten Scan registrieren |
| `sd schedule remove` | Den geplanten Scan entfernen |
| `sd schedule status` | Aktuellen Zeitplanstatus anzeigen |

```bash
# Wöchentlichen Scan von /home planen
sd schedule add /home --frequency weekly

# Täglichen Scan planen
sd schedule add /var --frequency daily

# Verfügbare Frequenzen: hourly, 4h, 12h, daily, weekly
sd schedule add /tmp --frequency 4h

# Zeitplan entfernen
sd schedule remove

# Zeitplanstatus prüfen
sd schedule status
```

## Alarme & Webhooks

Befehle zur Konfiguration von Alarmbenachrichtigungen über Webhooks und E-Mail.

| Befehl | Beschreibung |
|--------|--------------|
| `sd webhook list` | Konfigurierte Webhook-Endpunkte auflisten |
| `sd webhook add <NAME> <URL>` | Einen Webhook-Endpunkt hinzufügen |
| `sd webhook remove <NAME>` | Einen Webhook-Endpunkt entfernen |
| `sd webhook test` | Testalarm an alle Webhooks senden |
| `sd email-alert configure` | SMTP-E-Mail-Alarme konfigurieren |
| `sd email-alert test` | Test-Alarm-E-Mail senden |
| `sd email-alert send <NAME> <LEVEL> <PATH>` | Benutzerdefinierte Alarm-E-Mail senden |

```bash
# Slack-Webhook hinzufügen
sd webhook add my-slack https://hooks.slack.com/services/... --format slack

# Discord-Webhook hinzufügen
sd webhook add my-discord https://discord.com/api/webhooks/... --format discord

# Generischen Webhook hinzufügen
sd webhook add my-webhook https://example.com/webhook

# Alle Webhooks auflisten
sd webhook list

# Alle Webhooks testen
sd webhook test

# E-Mail-Alarme konfigurieren
sd email-alert configure

# E-Mail-Alarme testen
sd email-alert test
```

## Netzwerkschutz

Befehle für DNS-basierte Werbe- und Malicious-Domain-Blockierung.

| Befehl | Beschreibung |
|--------|--------------|
| `sd adblock enable` | Adblock-Schutz über Hosts-Datei aktivieren |
| `sd adblock disable` | Adblock-Schutz deaktivieren |
| `sd adblock sync` | Alle Filterlisten neu herunterladen |
| `sd adblock stats` | Adblock-Engine-Statistiken anzeigen |
| `sd adblock check <URL>` | Prüfen ob eine URL/Domain blockiert ist |
| `sd adblock log` | Kürzlich blockierte Einträge anzeigen |
| `sd adblock add <NAME> <URL>` | Benutzerdefinierte Filterliste hinzufügen |
| `sd adblock remove <NAME>` | Filterliste entfernen |
| `sd dns-proxy` | Lokalen DNS-Proxy mit Filterung starten |

```bash
# Adblock aktivieren
sudo sd adblock enable

# DNS-Proxy starten
sudo sd dns-proxy --listen 127.0.0.1:53 --upstream 1.1.1.1:53
```

Weitere Informationen finden Sie unter [Adblock](../network/adblock) und [DNS-Proxy](../network/dns-proxy).

## Berichterstattung

| Befehl | Beschreibung |
|--------|--------------|
| `sd report <OUTPUT>` | Einen HTML-Bericht aus JSON-Scan-Ergebnissen generieren |

```bash
# Mit JSON-Ausgabe scannen, dann HTML-Bericht generieren
sd scan /home --json > results.json
sd report report.html --input results.json

# Oder direkt das --report-Flag verwenden
sd scan /home --report /tmp/scan-report.html
```

## System

Befehle für Engine-Wartung, Integration und Selbstaktualisierung.

| Befehl | Beschreibung |
|--------|--------------|
| `sd status` | Daemon-Status anzeigen (läuft/gestoppt, PID, blockierte Bedrohungen) |
| `sd install-integration` | Dateimanager-Kontextmenü-Scan-Integration installieren |
| `sd self-update` | Auf Engine-Binärdatei-Updates prüfen und anwenden |

```bash
# Daemon-Status prüfen
sd status

# Desktop-Integration installieren
sd install-integration

# Auf Engine-Updates prüfen
sd self-update --check-only

# Engine-Update anwenden
sd self-update
```

## Community

Befehle für Community-Bedrohungsgeheimdienst-Austausch.

| Befehl | Beschreibung |
|--------|--------------|
| `sd community status` | Community-Sharing-Konfiguration anzeigen |
| `sd community enroll` | Diese Maschine mit der Community-API registrieren |
| `sd community disable` | Community-Sharing deaktivieren |

```bash
# Registrierungsstatus prüfen
sd community status

# Beim Community-Sharing registrieren
sd community enroll

# Sharing deaktivieren (Anmeldedaten bleiben erhalten)
sd community disable
```

## Nächste Schritte

- Mit dem [Schnellstart-Leitfaden](../getting-started/quickstart) beginnen, um in 5 Minuten zu scannen
- [Konfiguration](../configuration/) erkunden, um das Engine-Verhalten anzupassen
- [Echtzeitüberwachung](../realtime/) einrichten für kontinuierlichen Schutz
- Über die [Erkennungsengine](../detection/) Pipeline lernen
