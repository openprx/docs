---
title: Executor-Referenz
description: "Detaillierte Dokumentation aller 5 Executor-Typen in OpenPR-Webhook: openclaw, openprx, webhook, custom und cli."
---

# Executor-Referenz

Diese Seite dokumentiert alle 5 Executor-Typen im Detail, einschließlich ihrer Konfigurationsfelder, ihres Verhaltens und Beispiele.

## openclaw

Sendet Benachrichtigungen über Messaging-Plattformen (Signal, Telegram) via das OpenClaw-CLI-Tool.

**Funktionsweise:** Konstruiert einen Shell-Befehl, der das OpenClaw-Binary mit `--channel`-, `--target`- und `--message`-Argumenten aufruft.

**Konfiguration:**

```toml
[[agents]]
id = "my-openclaw"
name = "Signal Notifier"
agent_type = "openclaw"
message_template = "[{project}] {key}: {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"   # Pfad zum OpenClaw-Binary
channel = "signal"                     # Kanal: "signal" oder "telegram"
target = "+1234567890"                 # Telefonnummer, Gruppen-ID oder Kanalname
```

**Felder:**

| Feld | Erforderlich | Beschreibung |
|------|-------------|-------------|
| `command` | Ja | Pfad zum OpenClaw-CLI-Binary |
| `channel` | Ja | Messaging-Kanal (`signal`, `telegram`) |
| `target` | Ja | Empfängeridentifikator (Telefonnummer, Gruppen-ID usw.) |

---

## openprx

Sendet Nachrichten über die OpenPRX-Messaging-Infrastruktur. Unterstützt zwei Modi: HTTP-API (Signal-Daemon) oder CLI-Befehl.

**Modus 1: Signal-API (bevorzugt)**

Sendet einen JSON-POST an einen Signal-CLI-REST-API-Daemon:

```toml
[[agents]]
id = "my-openprx"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"  # signal-cli REST-API-Basis-URL
account = "+1234567890"                 # Absender-Telefonnummer
target = "+0987654321"                  # Empfänger-Telefonnummer oder UUID
channel = "signal"                      # Standard: "signal"
```

Die an die Signal-API gesendete HTTP-Anfrage:

```
POST {signal_api}/api/v1/send/{account}
Content-Type: application/json

{
  "recipients": ["{target}"],
  "message": "..."
}
```

**Modus 2: CLI-Befehl**

Fällt auf die Ausführung eines Shell-Befehls zurück, wenn `signal_api` nicht gesetzt ist:

```toml
[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"
```

**Felder:**

| Feld | Erforderlich | Beschreibung |
|------|-------------|-------------|
| `signal_api` | Nein | Signal-Daemon-HTTP-API-Basis-URL |
| `account` | Nein | Konto-Telefonnummer (wird mit `signal_api` verwendet) |
| `target` | Ja | Empfänger-Telefonnummer oder UUID |
| `channel` | Nein | Kanalname (Standard: `signal`) |
| `command` | Nein | CLI-Befehl (Fallback, wenn `signal_api` nicht gesetzt ist) |

Mindestens eines von `signal_api` oder `command` muss angegeben werden.

---

## webhook

Leitet die vollständige Webhook-Nutzlast unverändert an einen HTTP-Endpunkt weiter. Nützlich für die Integration mit Slack, Discord, benutzerdefinierten APIs oder das Verketten zu einem anderen Webhook-Dienst.

**Funktionsweise:** Sendet einen JSON-POST an die konfigurierte URL mit der ursprünglichen Nutzlast. Signiert ausgehende Anfragen optional mit HMAC-SHA256.

```toml
[[agents]]
id = "slack-forward"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-signing-secret"  # Optional: ausgehende Anfragen signieren
```

**Felder:**

| Feld | Erforderlich | Beschreibung |
|------|-------------|-------------|
| `url` | Ja | Ziel-URL |
| `secret` | Nein | HMAC-SHA256-Secret für ausgehende Signatur (als `X-Webhook-Signature`-Header gesendet) |

Wenn `secret` gesetzt ist, enthält die ausgehende Anfrage einen `X-Webhook-Signature: sha256=...`-Header, der über den JSON-Body berechnet wird, sodass die Empfängerseite die Authentizität verifizieren kann.

---

## custom

Führt einen beliebigen Shell-Befehl aus und übergibt die formatierte Nachricht als Argument. Nützlich für benutzerdefinierte Integrationen, Protokollierung oder das Auslösen externer Skripte.

**Funktionsweise:** Führt `sh -c '{command} "{message}"'` aus, wobei `{message}` die gerenderte Vorlage mit maskierten Sonderzeichen ist.

```toml
[[agents]]
id = "custom-logger"
name = "Log to File"
agent_type = "custom"
message_template = "{event} | {key} | {title}"

[agents.custom]
command = "/usr/local/bin/log-event.sh"
args = ["--format", "json"]  # Optionale zusätzliche Argumente
```

**Felder:**

| Feld | Erforderlich | Beschreibung |
|------|-------------|-------------|
| `command` | Ja | Pfad zur ausführbaren Datei oder Shell-Befehl |
| `args` | Nein | Zusätzliche Befehlszeilenargumente |

**Sicherheitshinweis:** Der Custom-Executor führt Shell-Befehle aus. Sicherstellen, dass der Befehlspfad vertrauenswürdig und nicht benutzerkontrollierbar ist.

---

## cli

Führt KI-Coding-Agenten aus, um Issues zu verarbeiten. Dies ist der leistungsfähigste Executor-Typ, konzipiert für automatisierte Code-Generierung und Issue-Lösung.

**Erfordert:** `features.cli_enabled = true` in der Konfiguration. Wird bei `OPENPR_WEBHOOK_SAFE_MODE=1` blockiert.

**Unterstützte Executors (Whitelist):**

| Executor | Binary | Befehlsmuster |
|----------|--------|--------------|
| `codex` | `codex` | `codex exec --full-auto "{prompt}"` |
| `claude-code` | `claude` | `claude --print --permission-mode bypassPermissions "{prompt}"` |
| `opencode` | `opencode` | `opencode run "{prompt}"` |

Jeder Executor, der nicht in dieser Whitelist ist, wird abgelehnt.

**Konfiguration:**

```toml
[features]
cli_enabled = true
callback_enabled = true  # Erforderlich für Zustandsübergänge

[[agents]]
id = "my-coder"
name = "Code Agent"
agent_type = "cli"

[agents.cli]
executor = "claude-code"               # Eines von: codex, claude-code, opencode
workdir = "/opt/projects/backend"      # Arbeitsverzeichnis für das CLI-Tool
timeout_secs = 900                     # Timeout in Sekunden (Standard: 900)
max_output_chars = 12000               # Max. Zeichen aus stdout/stderr erfassen (Standard: 12000)
prompt_template = "Fix issue {issue_id}: {title}\nContext: {reason}"

# Zustandsübergänge (erfordert callback_enabled)
update_state_on_start = "in_progress"  # Issue-Status beim Taskstart setzen
update_state_on_success = "done"       # Issue-Status bei Erfolg setzen
update_state_on_fail = "todo"          # Issue-Status bei Fehler/Timeout setzen

# Callback-Konfiguration
callback = "mcp"                       # Callback-Modus: "mcp" oder "api"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"        # Optionales Bearer-Token für Callback
```

**Felder:**

| Feld | Erforderlich | Standard | Beschreibung |
|------|-------------|---------|-------------|
| `executor` | Ja | -- | CLI-Tool-Name (`codex`, `claude-code`, `opencode`) |
| `workdir` | Nein | -- | Arbeitsverzeichnis |
| `timeout_secs` | Nein | 900 | Prozess-Timeout |
| `max_output_chars` | Nein | 12000 | Ausgabe-Tail-Erfassungslimit |
| `prompt_template` | Nein | `Fix issue {issue_id}: {title}\nContext: {reason}` | An das CLI-Tool gesendete Eingabeaufforderung |
| `update_state_on_start` | Nein | -- | Issue-Status beim Taskstart |
| `update_state_on_success` | Nein | -- | Issue-Status bei Erfolg |
| `update_state_on_fail` | Nein | -- | Issue-Status bei Fehler oder Timeout |
| `callback` | Nein | `mcp` | Callback-Protokoll (`mcp` oder `api`) |
| `callback_url` | Nein | -- | URL zum Senden von Callbacks |
| `callback_token` | Nein | -- | Bearer-Token für Callback-Auth |

**Prompt-Vorlagen-Platzhalter (CLI-spezifisch):**

| Platzhalter | Quelle |
|-------------|--------|
| `{issue_id}` | `payload.data.issue.id` |
| `{title}` | `payload.data.issue.title` |
| `{reason}` | `payload.bot_context.trigger_reason` |

**Callback-Nutzlast (MCP-Modus):**

Wenn `callback = "mcp"`, sendet der Dienst einen JSON-RPC-artigen POST an `callback_url`:

```json
{
  "method": "issue.comment",
  "params": {
    "issue_id": "42",
    "run_id": "run-1711234567890",
    "executor": "claude-code",
    "status": "success",
    "summary": "cli execution completed",
    "exit_code": 0,
    "duration_ms": 45000,
    "stdout_tail": "...",
    "stderr_tail": "...",
    "state": "done"
  }
}
```

**Zustandsübergangs-Lebenszyklus:**

```
Event empfangen
    |
    v
[update_state_on_start] --> Issue-Status = "in_progress"
    |
    v
CLI-Tool läuft (bis timeout_secs)
    |
    +-- Erfolg --> [update_state_on_success] --> Issue-Status = "done"
    |
    +-- Fehler --> [update_state_on_fail] --> Issue-Status = "todo"
    |
    +-- Timeout --> [update_state_on_fail] --> Issue-Status = "todo"
```
