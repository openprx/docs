---
title: OpenPR-Webhook
description: "Webhook-Event-Dispatcher für OpenPR. Empfängt Webhook-Events, filtert nach Bot-Kontext und leitet an konfigurierbare Agenten weiter."
---

# OpenPR-Webhook

OpenPR-Webhook ist ein Webhook-Event-Dispatcher-Dienst für [OpenPR](https://github.com/openprx/openpr). Er empfängt Webhook-Events von der OpenPR-Plattform, filtert sie nach Bot-Kontext und leitet sie an einen oder mehrere konfigurierbare Agenten zur Verarbeitung weiter.

## Was es macht

Wenn ein Event in OpenPR auftritt (z.B. ein Issue wird erstellt oder aktualisiert), sendet die Plattform eine Webhook-POST-Anfrage an diesen Dienst. OpenPR-Webhook:

1. **Verifiziert die Anfrage** mit HMAC-SHA256-Signaturvalidierung
2. **Filtert Events** -- nur Events mit `bot_context.is_bot_task = true` werden verarbeitet
3. **Leitet an Agenten weiter** -- ordnet das Event einem konfigurierten Agenten nach Name oder Typ zu
4. **Verteilt** -- führt die Aktion des Agenten aus (Nachricht senden, CLI-Tool aufrufen, an einen anderen Webhook weiterleiten usw.)

## Architektur-Übersicht

```
OpenPR-Plattform
    |
    | POST /webhook (HMAC-SHA256 signiert)
    v
+-------------------+
| openpr-webhook    |
|                   |
| Signatur prüfen   |
| Event filtern     |
| Agenten abgleichen|
+-------------------+
    |           |           |
    v           v           v
 openclaw    webhook     cli-Agent
 (Signal/    (HTTP-      (codex /
  Telegram)  Weiter-     claude-code)
             leitung)
```

## Hauptfunktionen

- **HMAC-SHA256-Signaturverifikation** bei eingehenden Webhooks mit Multi-Secret-Rotationsunterstützung
- **Bot-Task-Filterung** -- ignoriert Events, die nicht für Bots bestimmt sind, lautlos
- **5 Agenten-/Executor-Typen** -- openclaw, openprx, webhook, custom, cli
- **Nachrichtenvorlagen** mit Platzhaltervariablen für flexible Benachrichtigungsformatierung
- **Zustandsübergänge** -- Issue-Status bei Taskstart, Erfolg oder Fehler automatisch aktualisieren
- **WSS-Tunnel** (Phase B) -- aktive WebSocket-Verbindung zu einer Steuerungsebene für Push-basierte Task-Verteilung
- **Sicherheitsorientierte Standards** -- gefährliche Funktionen (Tunnel, CLI, Callback) sind standardmäßig DEAKTIVIERT, hinter Feature-Flags und Safe Mode gesichert

## Unterstützte Agenten-Typen

| Typ | Zweck | Protokoll |
|-----|-------|-----------|
| `openclaw` | Benachrichtigungen über Signal/Telegram via OpenClaw-CLI senden | Shell-Befehl |
| `openprx` | Nachrichten über OpenPRX-Signal-API oder CLI senden | HTTP-API / Shell |
| `webhook` | Vollständige Event-Nutzlast an einen HTTP-Endpunkt weiterleiten | HTTP POST |
| `custom` | Einen beliebigen Shell-Befehl mit der Nachricht als Argument ausführen | Shell-Befehl |
| `cli` | Einen KI-Coding-Agenten (codex, claude-code, opencode) auf dem Issue ausführen | Unterprozess |

## Schnelllinks

- [Installation](getting-started/installation.md)
- [Schnellstart](getting-started/quickstart.md)
- [Agenten-Typen](agents/index.md)
- [Executor-Referenz](agents/executors.md)
- [WSS-Tunnel](tunnel/index.md)
- [Konfigurationsreferenz](configuration/index.md)
- [Fehlerbehebung](troubleshooting/index.md)

## Repository

Quellcode: [github.com/openprx/openpr-webhook](https://github.com/openprx/openpr-webhook)

Lizenz: MIT OR Apache-2.0
