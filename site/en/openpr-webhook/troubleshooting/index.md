# Troubleshooting

## Common Issues

### 401 Unauthorized on Webhook POST

**Symptom:** All webhook requests return HTTP 401.

**Causes:**

1. **Missing signature header.** The request must include either `X-Webhook-Signature` or `X-OpenPR-Signature` with the format `sha256={hex-digest}`.

2. **Wrong secret.** The HMAC-SHA256 digest must match one of the secrets in `security.webhook_secrets`. Check that the sending side and receiving side use the same secret string.

3. **Body mismatch.** The signature is computed over the raw request body. If a proxy or middleware modifies the body (e.g., re-encoding JSON), the signature will not match.

**Debug:**

```bash
# Enable debug logging
RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml

# Temporarily allow unsigned requests for testing
# (config.toml)
[security]
allow_unsigned = true
```

### Event is Ignored (not_bot_task)

**Symptom:** The response is `{"status": "ignored", "reason": "not_bot_task"}`.

**Cause:** The webhook payload does not contain `bot_context.is_bot_task = true`. OpenPR-Webhook only processes events explicitly marked as bot tasks.

**Fix:** Ensure the OpenPR platform is configured to include the bot context in webhook payloads:

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

### No Agent Found

**Symptom:** The response is `{"status": "no_agent", "bot_name": "..."}`.

**Cause:** No configured agent matches the `bot_name` or `bot_agent_type` from the payload.

**Fix:**

1. Check that an agent is configured with an `id` or `name` that matches the `bot_name` value
2. Check that the agent's `agent_type` matches `bot_agent_type`
3. Agent name matching is case-insensitive, but `id` matching is exact

### CLI Agent Returns "disabled"

**Symptom:** CLI dispatch returns `"cli disabled by feature flag or safe mode"`.

**Causes:**

1. `features.cli_enabled` is not set to `true`
2. `OPENPR_WEBHOOK_SAFE_MODE` environment variable is set

**Fix:**

```toml
[features]
cli_enabled = true
```

And verify safe mode is not active:

```bash
echo $OPENPR_WEBHOOK_SAFE_MODE
# Should be empty or unset
```

### CLI Executor "not allowed"

**Symptom:** Error message `"executor not allowed: {name}"`.

**Cause:** The `executor` field in the CLI agent config contains a value not in the whitelist.

**Allowed executors:**
- `codex`
- `claude-code`
- `opencode`

Any other value is rejected for security reasons.

### Tunnel Fails to Connect

**Symptom:** Log messages show `tunnel connect failed: ...` repeatedly.

**Causes:**

1. **Invalid URL.** The tunnel URL must start with `wss://` or `ws://`.
2. **Network issue.** Verify the control plane server is reachable.
3. **Auth failure.** Check that `tunnel.auth_token` is correct.
4. **Missing required fields.** Both `tunnel.agent_id` and `tunnel.auth_token` must be non-empty.

**Debug:**

```bash
# Test WebSocket connectivity manually
# (requires wscat or websocat)
wscat -c wss://control.example.com/ws -H "Authorization: Bearer your-token"
```

### Tunnel Keeps Reconnecting

**Symptom:** Logs show `tunnel disconnected, reconnecting in Ns` in a loop.

**Normal behavior:** The tunnel auto-reconnects with exponential backoff (up to `tunnel_reconnect_backoff_max_secs`). Check the control plane logs for the disconnect reason.

**Tuning:**

```toml
[tunnel]
reconnect_secs = 3        # Base retry interval
heartbeat_secs = 20       # Keep-alive interval

[runtime]
tunnel_reconnect_backoff_max_secs = 120  # Max backoff
```

### Callback Failures

**Symptom:** Logs show `start callback failed: ...` or `final callback failed: ...`.

**Causes:**

1. **callback_enabled is false.** Callbacks require `features.callback_enabled = true`.
2. **Invalid callback_url.** Verify the URL is reachable.
3. **Auth failure.** If the callback endpoint requires auth, set `callback_token`.
4. **Timeout.** The default HTTP timeout is 15 seconds. Increase with `runtime.http_timeout_secs`.

### OpenClaw/Custom Agent Execution Errors

**Symptom:** Response contains `exec_error: ...` or `error: ...`.

**Causes:**

1. **Binary not found.** Verify the `command` path exists and is executable.
2. **Permission denied.** The openpr-webhook process must have execute permission.
3. **Missing dependencies.** The CLI tool may require other programs or libraries.

**Debug:**

```bash
# Test the command manually
/usr/local/bin/openclaw --channel signal --target "+1234567890" --message "test"
```

## Diagnostic Checklist

1. **Check service health:**
   ```bash
   curl http://localhost:9000/health
   # Should return: ok
   ```

2. **Check loaded agents:**
   Look at the startup log for `Loaded N agent(s)`.

3. **Enable debug logging:**
   ```bash
   RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml
   ```

4. **Verify signature manually:**
   ```bash
   echo -n '{"event":"test"}' | openssl dgst -sha256 -hmac "your-secret"
   ```

5. **Test with unsigned requests (development only):**
   ```toml
   [security]
   allow_unsigned = true
   ```

6. **Check safe mode status:**
   ```bash
   # If set, tunnel/cli/callback are force-disabled
   echo $OPENPR_WEBHOOK_SAFE_MODE
   ```

## Log Messages Reference

| Log Level | Message | Meaning |
|-----------|---------|---------|
| INFO | `Loaded N agent(s)` | Configuration loaded successfully |
| INFO | `openpr-webhook listening on ...` | Server started |
| INFO | `Received webhook event: ...` | Incoming event parsed |
| INFO | `Dispatching to agent: ...` | Agent matched, dispatching |
| INFO | `tunnel connected: ...` | WSS tunnel established |
| WARN | `Invalid webhook signature` | Signature verification failed |
| WARN | `No agent for bot_name=...` | No matching agent found |
| WARN | `tunnel disconnected, reconnecting` | Tunnel connection lost |
| WARN | `tunnel using insecure ws:// transport` | Not using TLS |
| ERROR | `tunnel connect failed: ...` | WebSocket connection error |
| ERROR | `openclaw failed: ...` | OpenClaw command returned non-zero |
