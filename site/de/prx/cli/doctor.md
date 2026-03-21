---
title: prx doctor
description: Systemdiagnose ausführen, um Daemon-Zustand, Kanalstatus und Modellverfügbarkeit zu überprüfen.
---

# prx doctor

Umfassende Diagnose der PRX-Installation ausführen. Prüft Konfigurationsgültigkeit, Daemon-Verbindung, Kanalzustand, Anbieter-API-Zugriff und Modellverfügbarkeit.

## Verwendung

```bash
prx doctor [UNTERBEFEHL] [OPTIONS]
```

## Optionen

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Konfigurationsdateipfad |
| `--json` | `-j` | `false` | Ausgabe als JSON |
| `--verbose` | `-v` | `false` | Detaillierte Prüfausgabe anzeigen |
| `--fix` | | `false` | Versuchen, häufige Probleme automatisch zu beheben |

## Unterbefehle

### `prx doctor` (ohne Unterbefehl)

Alle Diagnoseprüfungen ausführen.

```bash
prx doctor
```

**Beispielausgabe:**

```
 PRX Doctor
 ══════════════════════════════════════════

 Configuration
   Config file exists ............... OK
   Config file valid ................ OK
   Data directory writable .......... OK

 Daemon
   Daemon running ................... OK (PID 12345)
   Gateway reachable ................ OK (127.0.0.1:3120)
   Uptime ........................... 3d 14h 22m

 Providers
   anthropic ....................... OK (claude-sonnet-4-20250514)
   ollama .......................... OK (llama3, 2 models)
   openai .......................... WARN (key not configured)

 Channels
   telegram-main ................... OK (connected)
   discord-dev ..................... OK (connected)
   slack-team ...................... FAIL (auth error)

 Memory
   Backend (sqlite) ................ OK
   Entries ......................... 1,247

 Evolution
   Engine .......................... OK (running)
   Last L1 cycle ................... 2h ago

 Summary: 10 passed, 1 warning, 1 failure
```

### `prx doctor models`

Modellverfügbarkeit bei allen konfigurierten Anbietern prüfen.

```bash
prx doctor models [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--provider` | `-P` | alle | Nur einen bestimmten Anbieter prüfen |

```bash
# Alle Anbietermodelle prüfen
prx doctor models

# Nur Ollama-Modelle prüfen
prx doctor models --provider ollama
```

**Beispielausgabe:**

```
 Provider     Model                        Status    Latency
 anthropic    claude-sonnet-4-20250514              OK        245ms
 anthropic    claude-haiku-4-20250514               OK        189ms
 ollama       llama3                       OK        12ms
 ollama       codellama                    OK        15ms
 openai       gpt-4o                       SKIP (no key)
```

## Diagnoseprüfungen

Der Doctor führt folgende Prüfungen durch:

| Kategorie | Prüfung | Beschreibung |
|-----------|---------|-------------|
| Konfiguration | Datei vorhanden | Konfigurationsdatei ist am erwarteten Pfad vorhanden |
| Konfiguration | Gültige Syntax | TOML wird fehlerfrei geparst |
| Konfiguration | Schema gültig | Alle Werte entsprechen erwarteten Typen und Bereichen |
| Daemon | Prozess läuft | Daemon-PID ist aktiv |
| Daemon | Gateway erreichbar | HTTP-Gesundheitsendpunkt antwortet |
| Anbieter | API-Schlüssel gesetzt | Erforderliche API-Schlüssel sind konfiguriert |
| Anbieter | API erreichbar | Anbieter-API antwortet auf eine Testanfrage |
| Kanäle | Token gültig | Kanal-Bot-Token werden akzeptiert |
| Kanäle | Verbunden | Kanal ist aktiv verbunden |
| Gedächtnis | Backend verfügbar | Gedächtnisspeicher ist erreichbar |
| Evolution | Engine läuft | Entwicklungs-Engine ist aktiv |

## Automatische Reparatur

Das `--fix`-Flag versucht, häufige Probleme automatisch zu beheben:

- Fehlende Datenverzeichnisse erstellen
- Abgelaufene OAuth-Token erneuern
- Getrennte Kanäle neu starten
- Ungültige Cache-Einträge entfernen

```bash
prx doctor --fix
```

## Verwandte Themen

- [prx daemon](./daemon) -- Daemon starten, wenn er nicht läuft
- [prx channel doctor](./channel) -- detaillierte Kanaldiagnose
- [Fehlerbehebung](/de/prx/troubleshooting/) -- häufige Fehler und Lösungen
- [Diagnoseleitfaden](/de/prx/troubleshooting/diagnostics) -- vertiefte Diagnose
