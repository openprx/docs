---
title: Schnellstart
description: PRX in 5 Minuten zum Laufen bringen. Installieren, LLM-Anbieter konfigurieren, Daemon starten und chatten.
---

# Schnellstart

Diese Anleitung bringt Sie in unter 5 Minuten von null zu einem laufenden PRX-Agenten.

## Schritt 1: PRX installieren

Installieren Sie das neueste Release:

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

Überprüfen Sie die Installation:

```bash
prx --version
```

::: tip
Siehe den [Installationsleitfaden](./installation) für alternative Methoden (Cargo, Quellcode-Kompilierung, Docker).
:::

## Schritt 2: Einrichtungsassistent ausführen

Der Einrichtungsassistent konfiguriert interaktiv Ihren LLM-Anbieter, API-Schlüssel und Grundeinstellungen:

```bash
prx onboard
```

Der Assistent führt Sie durch folgende Schritte:

1. **Anbieter auswählen** -- Anthropic, OpenAI, Ollama, OpenRouter und weitere
2. **API-Schlüssel eingeben** -- sicher in der Konfigurationsdatei gespeichert
3. **Standardmodell wählen** -- der Assistent ruft verfügbare Modelle von Ihrem Anbieter ab
4. **Gedächtnis-Backend festlegen** -- Markdown (Standard), SQLite oder PostgreSQL

Nach Abschluss des Assistenten wird Ihre Konfiguration unter `~/.config/openprx/openprx.toml` gespeichert.

::: info Schnelleinrichtung
Wenn Sie Ihren Anbieter und Ihr Modell bereits kennen, können Sie den interaktiven Assistenten überspringen:

```bash
prx onboard --provider anthropic --api-key sk-ant-... --model claude-sonnet-4-20250514
```

Alle Optionen finden Sie unter [Einrichtungsassistent](./onboarding).
:::

## Schritt 3: Daemon starten

Starten Sie den PRX-Daemon im Hintergrund. Der Daemon verwaltet die Agent-Laufzeit, die Gateway-API und alle konfigurierten Kanäle:

```bash
prx daemon
```

Standardmäßig lauscht der Daemon auf `127.0.0.1:3120`. Sie können Host und Port anpassen:

```bash
prx daemon --host 0.0.0.0 --port 8080
```

::: tip Als Dienst ausführen
Für Produktionsbereitstellungen installieren Sie PRX als Systemdienst, damit es beim Booten automatisch startet:

```bash
prx service install
```

Dies erstellt eine systemd-Unit (Linux) oder launchd-plist (macOS). Details unter [prx service](../cli/service).
:::

## Schritt 4: Mit PRX chatten

Öffnen Sie eine interaktive Chat-Sitzung direkt in Ihrem Terminal:

```bash
prx chat
```

Dies verbindet sich mit dem laufenden Daemon und öffnet eine REPL, in der Sie mit Ihrem konfigurierten LLM sprechen können. Geben Sie Ihre Nachricht ein und drücken Sie Enter:

```
You: What can you help me with?
PRX: I can help you with a wide range of tasks...
```

Sie können auch einen Anbieter und ein Modell für eine einzelne Sitzung angeben:

```bash
prx chat --provider ollama --model llama3.2
```

Drücken Sie `Ctrl+C` oder geben Sie `/quit` ein, um den Chat zu beenden.

## Schritt 5: Einen Kanal verbinden

PRX unterstützt 19 Messaging-Kanäle. Um einen zu verbinden, fügen Sie dessen Konfiguration zu Ihrer `~/.config/openprx/openprx.toml`-Datei hinzu.

Zum Beispiel, um einen Telegram-Bot zu verbinden:

```toml
[channels.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["your_telegram_username"]
```

Dann starten Sie den Daemon neu, damit der neue Kanal übernommen wird:

```bash
prx daemon
```

Oder verwenden Sie den Kanalverwaltungsbefehl:

```bash
prx channel add telegram
```

Die vollständige Liste unterstützter Plattformen und deren Konfiguration finden Sie in der [Kanalübersicht](../channels/).

## Schritt 6: Status prüfen

Zeigen Sie den aktuellen Zustand Ihrer PRX-Instanz an:

```bash
prx status
```

Dies zeigt an:

- **Version** und Binärdateipfad
- **Arbeitsbereich**-Verzeichnis
- **Konfigurations**-Dateispeicherort
- **Anbieter** und verwendetes Modell
- **Aktive Kanäle** und deren Verbindungsstatus
- **Gedächtnis-Backend** und Statistiken
- **Betriebszeit** und Ressourcenverbrauch

Beispielausgabe:

```
PRX Status

Version:     0.3.0
Workspace:   /home/user/.local/share/openprx
Config:      /home/user/.config/openprx/openprx.toml
Provider:    anthropic (claude-sonnet-4-20250514)
Memory:      markdown (/home/user/.local/share/openprx/memory)
Channels:    telegram (connected), cli (active)
Gateway:     http://127.0.0.1:3120
Uptime:      2h 15m
```

## Wie geht es weiter?

Nachdem PRX läuft, erkunden Sie den Rest der Dokumentation:

| Thema | Beschreibung |
|-------|-------------|
| [Einrichtungsassistent](./onboarding) | Vertiefung aller Einrichtungsoptionen |
| [Kanäle](../channels/) | Telegram, Discord, Slack und 16 weitere verbinden |
| [Anbieter](../providers/) | LLM-Anbieter konfigurieren und wechseln |
| [Werkzeuge](../tools/) | 46+ integrierte Werkzeuge erkunden |
| [Selbstentwicklung](../self-evolution/) | Das L1/L2/L3-Entwicklungssystem kennenlernen |
| [Konfiguration](../config/) | Vollständige Konfigurationsreferenz mit allen Optionen |
| [CLI-Referenz](../cli/) | Vollständige Befehlsreferenz |
