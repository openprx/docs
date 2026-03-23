---
title: Konfigurationsreferenz
description: "Vollständige TOML-Konfigurationsreferenz für OpenPR-Webhook: Server, Sicherheit, Feature-Flags, Laufzeit, WSS-Tunnel und Agenten."
---

# Konfigurationsreferenz

OpenPR-Webhook verwendet eine einzige TOML-Konfigurationsdatei. Standardmäßig sucht es nach `config.toml` im aktuellen Verzeichnis. Ein benutzerdefinierter Pfad kann als erstes Befehlszeilenargument angegeben werden.

## Vollständiges Schema

```toml
# ─── Server ───────────────────────────────────────────────
[server]
listen = "0.0.0.0:9000"               # Bind-Adresse und Port

# ─── Security ─────────────────────────────────────────────
[security]
webhook_secrets = ["secret1", "secret2"]  # HMAC-SHA256-Secrets (unterstützt Rotation)
allow_unsigned = false                     # Unsignierte Webhook-Anfragen erlauben (Standard: false)

# ─── Feature Flags ────────────────────────────────────────
[features]
tunnel_enabled = false                 # WSS-Tunnel-Subsystem aktivieren (Standard: false)
cli_enabled = false                    # CLI-Agenten-Executor aktivieren (Standard: false)
callback_enabled = false               # Zustandsübergangs-Callbacks aktivieren (Standard: false)

# ─── Runtime Tuning ───────────────────────────────────────
[runtime]
cli_max_concurrency = 1               # Max. gleichzeitige CLI-Tasks (Standard: 1)
http_timeout_secs = 15                 # HTTP-Client-Timeout (Standard: 15)
tunnel_reconnect_backoff_max_secs = 60 # Max. Tunnel-Wiederverbindungs-Backoff (Standard: 60)

# ─── WSS Tunnel ───────────────────────────────────────────
[tunnel]
enabled = false                        # Diese Tunnel-Instanz aktivieren (Standard: false)
url = "wss://control.example.com/ws"   # WebSocket-URL
agent_id = "my-agent"                  # Agenten-Bezeichner
auth_token = "bearer-token"            # Bearer-Auth-Token
reconnect_secs = 3                     # Basis-Wiederverbindungsintervall (Standard: 3)
heartbeat_secs = 20                    # Heartbeat-Intervall (Standard: 20, Min: 3)
hmac_secret = "envelope-signing-key"   # Umschlag-HMAC-Signing-Secret
require_inbound_sig = false            # Eingehende Nachrichtensignaturen erfordern (Standard: false)

# ─── Agents ───────────────────────────────────────────────

# --- OpenClaw-Agent ---
[[agents]]
id = "notify-signal"
name = "Signal Notifier"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "signal"
target = "+1234567890"

# --- OpenPRX-Agent (HTTP-API-Modus) ---
[[agents]]
id = "openprx-signal"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"
account = "+1234567890"
target = "+0987654321"
channel = "signal"

# --- OpenPRX-Agent (CLI-Modus) ---
[[agents]]
id = "openprx-cli"
name = "OpenPRX CLI"
agent_type = "openprx"

[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"

# --- Webhook-Agent ---
[[agents]]
id = "forward-slack"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-hmac-secret"        # Optional: ausgehende Anfragen signieren

# --- Custom-Agent ---
[[agents]]
id = "custom-script"
name = "Custom Script"
agent_type = "custom"
message_template = "{event}|{key}|{title}"

[agents.custom]
command = "/usr/local/bin/handle-event.sh"
args = ["--format", "json"]

# --- CLI-Agent ---
[[agents]]
id = "ai-coder"
name = "AI Coder"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 900
max_output_chars = 12000
prompt_template = "Fix issue {issue_id}: {title}\nContext: {reason}"
update_state_on_start = "in_progress"
update_state_on_success = "done"
update_state_on_fail = "todo"
callback = "mcp"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"
skip_callback_state = false               # true setzen, wenn KI den Status via MCP verwaltet
# mcp_instructions = "..."               # Benutzerdefinierte MCP-Anweisungen (überschreibt Standard)
# mcp_config_path = "/path/to/mcp.json"  # claude-code --mcp-config Pfad

[agents.cli.env_vars]                      # Umgebungsvariablen pro Agent
# OPENPR_API_URL = "http://localhost:3000"
# OPENPR_BOT_TOKEN = "opr_xxx"
```

## Abschnittsreferenz

### `[server]`

| Feld | Typ | Erforderlich | Standard | Beschreibung |
|------|-----|-------------|---------|-------------|
| `listen` | String | Ja | -- | TCP-Bind-Adresse im `host:port`-Format |

### `[security]`

| Feld | Typ | Erforderlich | Standard | Beschreibung |
|------|-----|-------------|---------|-------------|
| `webhook_secrets` | Array von Strings | Nein | `[]` | Liste gültiger HMAC-SHA256-Secrets für eingehende Verifikation. Mehrere Secrets unterstützen Schlüsselrotation. |
| `allow_unsigned` | Boolean | Nein | `false` | Unsignierte Anfragen ohne Signaturverifizierung akzeptieren. **Nicht für die Produktion empfohlen.** |

**Signaturverifizierung** prüft zwei Header in dieser Reihenfolge:
1. `X-Webhook-Signature`
2. `X-OpenPR-Signature`

Der Header-Wert sollte im Format `sha256={hex-digest}` sein. Der Dienst versucht jedes Secret in `webhook_secrets`, bis eines übereinstimmt.

### `[features]`

Alle Feature-Flags sind standardmäßig `false`. Dieser Defense-in-Depth-Ansatz stellt sicher, dass gefährliche Funktionen explizit aktiviert werden müssen.

| Feld | Typ | Standard | Beschreibung |
|------|-----|---------|-------------|
| `tunnel_enabled` | Boolean | `false` | Das WSS-Tunnel-Subsystem aktivieren |
| `cli_enabled` | Boolean | `false` | Den CLI-Agenten-Executor aktivieren |
| `callback_enabled` | Boolean | `false` | Zustandsübergangs-Callbacks aktivieren |

### `[runtime]`

| Feld | Typ | Standard | Beschreibung |
|------|-----|---------|-------------|
| `cli_max_concurrency` | Integer | `1` | Maximale Anzahl gleichzeitiger CLI-Agenten-Tasks |
| `http_timeout_secs` | Integer | `15` | Timeout für ausgehende HTTP-Anfragen (Webhook-Weiterleitung, Callbacks, Signal-API) |
| `tunnel_reconnect_backoff_max_secs` | Integer | `60` | Maximales Backoff-Intervall für Tunnel-Wiederverbindung |

### `[tunnel]`

Siehe [WSS-Tunnel](../tunnel/index.md) für detaillierte Dokumentation.

### `[[agents]]`

Siehe [Agenten-Typen](../agents/index.md) und [Executor-Referenz](../agents/executors.md) für detaillierte Dokumentation.

## Umgebungsvariablen

| Variable | Beschreibung |
|----------|-------------|
| `OPENPR_WEBHOOK_SAFE_MODE` | Auf `1`, `true`, `yes` oder `on` setzen, um Tunnel-, CLI- und Callback-Funktionen unabhängig von der Konfiguration zu deaktivieren. Nützlich für Notfall-Lockdown. |
| `RUST_LOG` | Steuert die Protokoll-Ausführlichkeit. Standard: `openpr_webhook=info`. Beispiele: `openpr_webhook=debug`, `openpr_webhook=trace` |

### Umgebungsvariablen pro Agent

CLI-Agenten unterstützen das Injizieren benutzerdefinierter Umgebungsvariablen via `[agents.cli.env_vars]`. Diese werden an den Executor-Unterprozess weitergegeben und sind nützlich für die Bereitstellung von MCP-Authentifizierung:

| Variable | Beschreibung |
|----------|-------------|
| `OPENPR_API_URL` | OpenPR-API-Basis-URL (vom MCP-Server verwendet) |
| `OPENPR_BOT_TOKEN` | Bot-Authentifizierungstoken (Präfix `opr_`) |
| `OPENPR_WORKSPACE_ID` | Ziel-Workspace-UUID |

## Safe Mode

Das Setzen von `OPENPR_WEBHOOK_SAFE_MODE=1` deaktiviert:

- CLI-Agenten-Ausführung (`cli_enabled` auf `false` erzwungen)
- Callback-Senden (`callback_enabled` auf `false` erzwungen)
- WSS-Tunnel (`tunnel_enabled` auf `false` erzwungen)

Nicht gefährliche Agenten (openclaw, openprx, webhook, custom) funktionieren weiterhin normal. Dies ermöglicht eine schnelle Sperrung des Dienstes ohne Änderung der Konfigurationsdatei.

```bash
OPENPR_WEBHOOK_SAFE_MODE=1 ./openpr-webhook config.toml
```

## Minimalkonfiguration

Die kleinste gültige Konfiguration:

```toml
[server]
listen = "0.0.0.0:9000"

[security]
allow_unsigned = true
```

Dies startet den Dienst ohne Agenten und ohne Signaturverifizierung. Nur für die Entwicklung nützlich.

## Produktions-Checkliste

- [ ] Mindestens einen Eintrag in `webhook_secrets` setzen
- [ ] `allow_unsigned = false` setzen
- [ ] Mindestens einen Agenten konfigurieren
- [ ] Bei CLI-Agenten: `cli_enabled = true` setzen und Executor-Whitelist überprüfen
- [ ] Bei Tunnel: `wss://` (nicht `ws://`) verwenden, `hmac_secret` setzen und `require_inbound_sig = true`
- [ ] `RUST_LOG=openpr_webhook=info` setzen (kein `debug`/`trace` in der Produktion für Performance)
- [ ] Erwägen, zunächst mit `OPENPR_WEBHOOK_SAFE_MODE=1` zu betreiben, um Nicht-CLI-Funktionalität zu verifizieren
