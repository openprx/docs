---
title: Agenten-Typen
description: "Die 5 Agenten-Typen in OpenPR-Webhook: openclaw, openprx, webhook, custom und cli. Konfiguration, Nachrichtenvorlagen und Abgleichlogik."
---

# Agenten-Typen

Agenten sind die zentralen Verteilungseinheiten in OpenPR-Webhook. Jeder Agent definiert, wie ein übereinstimmendes Webhook-Event behandelt wird. In einer einzelnen Bereitstellung können mehrere Agenten konfiguriert werden, und Events werden basierend auf dem `bot_context` in der Webhook-Nutzlast an den entsprechenden Agenten weitergeleitet.

## Übersicht

| Typ | Anwendungsfall | Feature-Flag erforderlich |
|-----|---------------|--------------------------|
| `openclaw` | Benachrichtigungen über Signal/Telegram mit OpenClaw-CLI senden | Nein |
| `openprx` | Nachrichten über OpenPRX-Signal-API oder CLI senden | Nein |
| `webhook` | Events an HTTP-Endpunkte weiterleiten (Slack, Discord usw.) | Nein |
| `custom` | Beliebige Shell-Befehle ausführen | Nein |
| `cli` | KI-Coding-Agenten ausführen (codex, claude-code, opencode) | Ja (`cli_enabled`) |

## Agenten-Konfigurationsstruktur

Jeder Agent hat diese gemeinsamen Felder:

```toml
[[agents]]
id = "unique-id"              # Eindeutiger Bezeichner, wird für den Abgleich verwendet
name = "Human-Readable Name"  # Anzeigename, auch für den Abgleich verwendet
agent_type = "openclaw"       # Eines von: openclaw, openprx, webhook, custom, cli
message_template = "..."      # Optional: benutzerdefiniertes Nachrichtenformat
```

Dann, abhängig vom `agent_type`, den typspezifischen Konfigurationsblock angeben:

- `[agents.openclaw]` für openclaw-Agenten
- `[agents.openprx]` für openprx-Agenten
- `[agents.webhook]` für webhook-Agenten
- `[agents.custom]` für custom-Agenten
- `[agents.cli]` für cli-Agenten

## Nachrichtenvorlagen

Das Feld `message_template` unterstützt Platzhalter, die mit Werten aus der Webhook-Nutzlast ersetzt werden:

| Platzhalter | Quelle | Beispiel |
|-------------|--------|---------|
| `{event}` | `payload.event` | `issue.updated` |
| `{title}` | `payload.data.issue.title` | `Fix login bug` |
| `{key}` | `payload.data.issue.key` | `PROJ-42` |
| `{issue_id}` | `payload.data.issue.id` | `123` |
| `{reason}` | `payload.bot_context.trigger_reason` | `assigned_to_bot` |
| `{actor}` | `payload.actor.name` | `alice` |
| `{project}` | `payload.project.name` | `backend` |
| `{workspace}` | `payload.workspace.name` | `IM` |
| `{state}` | `payload.data.issue.state` | `in_progress` |
| `{priority}` | `payload.data.issue.priority` | `high` |
| `{url}` | abgeleitet | `issue/123` |

Standardvorlage (für openclaw, openprx, webhook, custom):

```
[{project}] {event}: {key} {title}
{actor} | Trigger: {reason}
```

## Agenten-Abgleichlogik

Wenn ein Webhook-Event mit `bot_context.is_bot_task = true` ankommt:

1. Der Dienst extrahiert `bot_context.bot_name` und `bot_context.bot_agent_type`
2. Er sucht nach einem Agenten, dessen `id` oder `name` (Groß-/Kleinschreibung ignoriert) mit `bot_name` übereinstimmt
3. Wenn kein Namensabgleich, fällt er auf den ersten Agenten zurück, dessen `agent_type` mit `bot_agent_type` übereinstimmt
4. Wenn überhaupt kein Agent übereinstimmt, wird das Event quittiert, aber nicht weitergeleitet

## Multi-Agenten-Beispiel

```toml
# Agent 1: Benachrichtigung via Telegram
[[agents]]
id = "notify-tg"
name = "Telegram Notifier"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "telegram"
target = "@my-channel"

# Agent 2: An Slack weiterleiten
[[agents]]
id = "notify-slack"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"

# Agent 3: KI-Coding-Agent mit MCP Closed-Loop
[[agents]]
id = "coder"
name = "Code Agent"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 600
skip_callback_state = true  # KI aktualisiert Status direkt via MCP

[agents.cli.env_vars]
OPENPR_API_URL = "http://localhost:3000"
OPENPR_BOT_TOKEN = "opr_xxx"
```

In diesem Setup kann OpenPR verschiedene Events an verschiedene Agenten weiterleiten, indem das Feld `bot_name` in der Webhook-Nutzlast gesetzt wird.

## Nächste Schritte

- [Executor-Referenz](executors.md) -- detaillierte Dokumentation für jeden Executor-Typ
- [Konfigurationsreferenz](../configuration/index.md) -- vollständiges TOML-Schema
