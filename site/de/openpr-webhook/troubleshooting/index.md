---
title: Fehlerbehebung
description: "Lösungen für häufige OpenPR-Webhook-Probleme: 401-Fehler, Bot-Task-Filterung, fehlende Agenten, CLI-Probleme und Tunnel-Verbindungsfehler."
---

# Fehlerbehebung

## Häufige Probleme

### 401 Unauthorized bei Webhook-POST

**Symptom:** Alle Webhook-Anfragen geben HTTP 401 zurück.

**Ursachen:**

1. **Fehlender Signatur-Header.** Die Anfrage muss entweder `X-Webhook-Signature` oder `X-OpenPR-Signature` im Format `sha256={hex-digest}` enthalten.

2. **Falsches Secret.** Der HMAC-SHA256-Digest muss mit einem der Secrets in `security.webhook_secrets` übereinstimmen. Sicherstellen, dass Sender und Empfänger dasselbe Secret verwenden.

3. **Body-Mismatch.** Die Signatur wird über den rohen Request-Body berechnet. Wenn ein Proxy oder Middleware den Body modifiziert (z.B. JSON neu kodiert), stimmt die Signatur nicht überein.

**Debug:**

```bash
# Debug-Protokollierung aktivieren
RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml

# Vorübergehend unsignierte Anfragen zum Testen erlauben
# (config.toml)
[security]
allow_unsigned = true
```

### Event wird ignoriert (not_bot_task)

**Symptom:** Die Antwort ist `{"status": "ignored", "reason": "not_bot_task"}`.

**Ursache:** Die Webhook-Nutzlast enthält kein `bot_context.is_bot_task = true`. OpenPR-Webhook verarbeitet nur Events, die explizit als Bot-Tasks markiert sind.

**Lösung:** Sicherstellen, dass die OpenPR-Plattform so konfiguriert ist, dass der Bot-Kontext in Webhook-Nutzlasten enthalten ist:

```json
{
  "event": "issue.updated",
  "bot_context": {
    "is_bot_task": true,
    "bot_name": "my-agent",
    "bot_agent_type": "cli"
  },
  "data": { ... }
}
```

### Kein Agent gefunden

**Symptom:** Die Antwort ist `{"status": "no_agent", "bot_name": "..."}`.

**Ursache:** Kein konfigurierter Agent stimmt mit dem `bot_name` oder `bot_agent_type` aus der Nutzlast überein.

**Lösung:**

1. Überprüfen, ob ein Agent mit einer `id` oder einem `name` konfiguriert ist, der mit dem `bot_name`-Wert übereinstimmt
2. Überprüfen, ob der `agent_type` des Agenten mit `bot_agent_type` übereinstimmt
3. Agenten-Namensabgleich ignoriert Groß-/Kleinschreibung, aber `id`-Abgleich ist exakt

### CLI-Agent gibt "disabled" zurück

**Symptom:** CLI-Dispatch gibt `"cli disabled by feature flag or safe mode"` zurück.

**Ursachen:**

1. `features.cli_enabled` ist nicht auf `true` gesetzt
2. Die Umgebungsvariable `OPENPR_WEBHOOK_SAFE_MODE` ist gesetzt

**Lösung:**

```toml
[features]
cli_enabled = true
```

Und überprüfen, ob Safe Mode nicht aktiv ist:

```bash
echo $OPENPR_WEBHOOK_SAFE_MODE
# Sollte leer oder nicht gesetzt sein
```

### CLI-Executor "not allowed"

**Symptom:** Fehlermeldung `"executor not allowed: {name}"`.

**Ursache:** Das Feld `executor` in der CLI-Agenten-Konfiguration enthält einen Wert, der nicht in der Whitelist ist.

**Erlaubte Executors:**
- `codex`
- `claude-code`
- `opencode`

Jeder andere Wert wird aus Sicherheitsgründen abgelehnt.

### Tunnel schlägt bei Verbindung fehl

**Symptom:** Protokollmeldungen zeigen wiederholt `tunnel connect failed: ...`.

**Ursachen:**

1. **Ungültige URL.** Die Tunnel-URL muss mit `wss://` oder `ws://` beginnen.
2. **Netzwerkproblem.** Überprüfen, ob der Steuerungsebenen-Server erreichbar ist.
3. **Auth-Fehler.** Überprüfen, ob `tunnel.auth_token` korrekt ist.
4. **Fehlende erforderliche Felder.** Beide `tunnel.agent_id` und `tunnel.auth_token` müssen nicht leer sein.

**Debug:**

```bash
# WebSocket-Konnektivität manuell testen
# (erfordert wscat oder websocat)
wscat -c wss://control.example.com/ws -H "Authorization: Bearer your-token"
```

### Tunnel verbindet sich immer wieder

**Symptom:** Protokolle zeigen `tunnel disconnected, reconnecting in Ns` in einer Schleife.

**Normales Verhalten:** Der Tunnel verbindet sich automatisch mit exponentiellem Backoff wieder (bis `tunnel_reconnect_backoff_max_secs`). Die Steuerungsebenen-Protokolle auf den Trennungsgrund prüfen.

**Feinabstimmung:**

```toml
[tunnel]
reconnect_secs = 3        # Basis-Retry-Intervall
heartbeat_secs = 20       # Keep-alive-Intervall

[runtime]
tunnel_reconnect_backoff_max_secs = 120  # Max. Backoff
```

### Callback-Fehler

**Symptom:** Protokolle zeigen `start callback failed: ...` oder `final callback failed: ...`.

**Ursachen:**

1. **callback_enabled ist false.** Callbacks erfordern `features.callback_enabled = true`.
2. **Ungültige callback_url.** Überprüfen, ob die URL erreichbar ist.
3. **Auth-Fehler.** Wenn der Callback-Endpunkt Auth erfordert, `callback_token` setzen.
4. **Timeout.** Der Standard-HTTP-Timeout beträgt 15 Sekunden. Mit `runtime.http_timeout_secs` erhöhen.

### OpenClaw/Custom-Agenten-Ausführungsfehler

**Symptom:** Antwort enthält `exec_error: ...` oder `error: ...`.

**Ursachen:**

1. **Binary nicht gefunden.** Überprüfen, ob der `command`-Pfad existiert und ausführbar ist.
2. **Berechtigung verweigert.** Der openpr-webhook-Prozess muss Ausführungsberechtigung haben.
3. **Fehlende Abhängigkeiten.** Das CLI-Tool kann andere Programme oder Bibliotheken erfordern.

**Debug:**

```bash
# Den Befehl manuell testen
/usr/local/bin/openclaw --channel signal --target "+1234567890" --message "test"
```

## Diagnose-Checkliste

1. **Dienst-Integrität prüfen:**
   ```bash
   curl http://localhost:9000/health
   # Sollte zurückgeben: ok
   ```

2. **Geladene Agenten prüfen:**
   Im Startprotokoll nach `Loaded N agent(s)` suchen.

3. **Debug-Protokollierung aktivieren:**
   ```bash
   RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml
   ```

4. **Signatur manuell verifizieren:**
   ```bash
   echo -n '{"event":"test"}' | openssl dgst -sha256 -hmac "your-secret"
   ```

5. **Mit unsignierten Anfragen testen (nur Entwicklung):**
   ```toml
   [security]
   allow_unsigned = true
   ```

6. **Safe-Mode-Status prüfen:**
   ```bash
   # Falls gesetzt, sind Tunnel/CLI/Callback deaktiviert
   echo $OPENPR_WEBHOOK_SAFE_MODE
   ```

## Protokollmeldungen-Referenz

| Protokollebene | Meldung | Bedeutung |
|---------------|---------|-----------|
| INFO | `Loaded N agent(s)` | Konfiguration erfolgreich geladen |
| INFO | `openpr-webhook listening on ...` | Server gestartet |
| INFO | `Received webhook event: ...` | Eingehendes Event geparst |
| INFO | `Dispatching to agent: ...` | Agent abgeglichen, weiterleiten |
| INFO | `tunnel connected: ...` | WSS-Tunnel hergestellt |
| WARN | `Invalid webhook signature` | Signaturverifizierung fehlgeschlagen |
| WARN | `No agent for bot_name=...` | Kein übereinstimmender Agent gefunden |
| WARN | `tunnel disconnected, reconnecting` | Tunnel-Verbindung unterbrochen |
| WARN | `tunnel using insecure ws:// transport` | Kein TLS verwendet |
| ERROR | `tunnel connect failed: ...` | WebSocket-Verbindungsfehler |
| ERROR | `openclaw failed: ...` | OpenClaw-Befehl gab Nicht-Null zurück |
