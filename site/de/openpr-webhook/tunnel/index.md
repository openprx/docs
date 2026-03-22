---
title: WSS-Tunnel
description: "Der WSS-Tunnel ermöglicht Push-basierte Task-Verteilung von einer Steuerungsebene an OpenPR-Webhook über eine persistente WebSocket-Verbindung."
---

# WSS-Tunnel

Der WSS-Tunnel (Phase B) stellt eine aktive WebSocket-Verbindung von OpenPR-Webhook zu einem Steuerungsebenen-Server bereit. Anstatt auf eingehende HTTP-Webhooks zu warten, ermöglicht der Tunnel der Steuerungsebene, Tasks direkt über eine persistente Verbindung an den Agenten zu pushen.

Dies ist besonders nützlich, wenn der Webhook-Dienst hinter einem NAT oder einer Firewall läuft und keine eingehenden HTTP-Anfragen empfangen kann.

## Funktionsweise

```
Steuerungsebene (wss://...)
    ^         |
    |         | task.dispatch
    |         v
+-------------------+
| openpr-webhook    |
|   Tunnel-Client   |
|                   |
| task.ack  ------->|
| heartbeat ------->|
| task.result ----->|
+-------------------+
    |
    v
  CLI-Agent (codex / claude-code / opencode)
```

1. OpenPR-Webhook öffnet eine WebSocket-Verbindung zur Steuerungsebenen-URL
2. Authentifiziert sich mit einem Bearer-Token im `Authorization`-Header
3. Sendet periodische Heartbeat-Nachrichten, um die Verbindung aufrechtzuerhalten
4. Empfängt `task.dispatch`-Nachrichten von der Steuerungsebene
5. Quittiert sofort mit `task.ack`
6. Führt den Task asynchron über den CLI-Agenten aus
7. Sendet `task.result` zurück, wenn die Ausführung abgeschlossen ist

## Tunnel aktivieren

Der Tunnel erfordert **zwei** aktivierte Dinge:

1. Feature-Flag: `features.tunnel_enabled = true`
2. Tunnel-Abschnitt: `tunnel.enabled = true`

Beide Bedingungen müssen erfüllt sein, und `OPENPR_WEBHOOK_SAFE_MODE` darf nicht gesetzt sein.

```toml
[features]
tunnel_enabled = true
cli_enabled = true  # Normalerweise für die Task-Ausführung erforderlich

[tunnel]
enabled = true
url = "wss://control.example.com/ws/agent"
agent_id = "my-webhook-agent"
auth_token = "your-bearer-token"
reconnect_secs = 3
heartbeat_secs = 20
```

## Nachrichtenumschlag-Format

Alle Tunnel-Nachrichten verwenden einen Standard-Umschlag:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "heartbeat",
  "ts": 1711234567,
  "agent_id": "my-webhook-agent",
  "payload": { "alive": true },
  "sig": "sha256=abc123..."
}
```

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | String (UUID) | Eindeutiger Nachrichtenbezeichner |
| `type` | String | Nachrichtentyp (siehe unten) |
| `ts` | Integer | Unix-Zeitstempel (Sekunden) |
| `agent_id` | String | ID des sendenden Agenten |
| `payload` | Objekt | Typspezifische Nutzlast |
| `sig` | String (optional) | HMAC-SHA256-Signatur des Umschlags |

## Nachrichtentypen

### Ausgehend (Agent zur Steuerungsebene)

| Typ | Wann | Nutzlast |
|-----|------|---------|
| `heartbeat` | Alle N Sekunden | `{"alive": true}` |
| `task.ack` | Sofort beim Empfang eines Tasks | `{"run_id": "...", "issue_id": "...", "status": "accepted"}` |
| `task.result` | Nach Task-Abschluss | `{"run_id": "...", "issue_id": "...", "status": "success/failed", "summary": "..."}` |
| `error` | Bei Protokollfehlern | `{"reason": "invalid_json/missing_signature/bad_signature", "msg_id": "..."}` |

### Eingehend (Steuerungsebene zum Agenten)

| Typ | Zweck | Nutzlast |
|-----|-------|---------|
| `task.dispatch` | Einem Agenten einen Task zuweisen | `{"run_id": "...", "issue_id": "...", "agent": "...", "body": {...}}` |

## Task-Dispatch-Ablauf

```
Steuerungsebene                    openpr-webhook
    |                                 |
    |--- task.dispatch ------------->|
    |                                 |--- task.ack (sofort)
    |<--- task.ack ------------------|
    |                                 |
    |                                 |--- CLI-Agent ausführen
    |                                 |    (asynchron, bis Timeout)
    |                                 |
    |<--- task.result ---------------|--- task.result
    |                                 |
```

Die `task.dispatch`-Nutzlastfelder:

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `run_id` | String | Eindeutiger Run-Bezeichner (wird automatisch generiert, wenn fehlend) |
| `issue_id` | String | Issue-ID zum Bearbeiten |
| `agent` | String (optional) | Ziel-Agenten-ID (fällt auf den ersten `cli`-Agenten zurück) |
| `body` | Objekt | Vollständige Webhook-Nutzlast zum Übergeben an den Dispatcher |

## HMAC-Umschlag-Signierung

Wenn `tunnel.hmac_secret` konfiguriert ist, werden alle ausgehenden Umschläge signiert:

1. Der Umschlag wird mit `sig` auf `null` gesetzt zu JSON serialisiert
2. HMAC-SHA256 wird über die JSON-Bytes mit dem Secret berechnet
3. Die Signatur wird als `sha256={hex}` im Feld `sig` gesetzt

Für eingehende Nachrichten wird, wenn `tunnel.require_inbound_sig = true`, jede Nachricht ohne gültige Signatur mit einem `error`-Umschlag abgelehnt.

```toml
[tunnel]
hmac_secret = "shared-secret-with-control-plane"
require_inbound_sig = true
```

## Wiederverbindungsverhalten

Der Tunnel-Client verbindet sich bei Trennung automatisch wieder:

- Anfängliche Retry-Verzögerung: `reconnect_secs` (Standard: 3 Sekunden)
- Backoff: verdoppelt sich bei jedem aufeinanderfolgenden Fehler
- Maximales Backoff: `runtime.tunnel_reconnect_backoff_max_secs` (Standard: 60 Sekunden)
- Wird auf Basisverzögerung bei erfolgreicher Verbindung zurückgesetzt

## Parallelitätskontrolle

Die CLI-Task-Ausführung über den Tunnel wird durch `runtime.cli_max_concurrency` begrenzt:

```toml
[runtime]
cli_max_concurrency = 2  # 2 gleichzeitige CLI-Tasks erlauben (Standard: 1)
```

Tasks, die das Parallelitätslimit überschreiten, warten auf eine Semaphor-Genehmigung. Dies verhindert Überlastung des Computers, wenn mehrere Tasks in rascher Folge verteilt werden.

## Konfigurationsreferenz

| Feld | Standard | Beschreibung |
|------|---------|-------------|
| `tunnel.enabled` | `false` | Tunnel aktivieren/deaktivieren |
| `tunnel.url` | -- | WebSocket-URL (`wss://` oder `ws://`) |
| `tunnel.agent_id` | `openpr-webhook` | Agenten-Bezeichner |
| `tunnel.auth_token` | -- | Bearer-Token für Authentifizierung |
| `tunnel.reconnect_secs` | `3` | Basis-Wiederverbindungsintervall |
| `tunnel.heartbeat_secs` | `20` | Heartbeat-Intervall (Minimum 3s) |
| `tunnel.hmac_secret` | -- | HMAC-SHA256-Signing-Secret |
| `tunnel.require_inbound_sig` | `false` | Unsignierte eingehende Nachrichten ablehnen |

## Sicherheitshinweise

- Immer `wss://` in der Produktion verwenden. Der Dienst protokolliert eine Warnung, wenn `ws://` verwendet wird.
- Das `auth_token` wird als HTTP-Header während des WebSocket-Upgrades gesendet; sicherstellen, dass TLS verwendet wird.
- `require_inbound_sig` mit einem `hmac_secret` aktivieren, um gefälschte Task-Dispatches zu verhindern.
