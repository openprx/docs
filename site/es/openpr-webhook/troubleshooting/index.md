---
title: Resolución de Problemas
description: "Soluciones para problemas comunes de OpenPR-Webhook incluyendo errores de firma, filtrado de eventos, agentes CLI, túnel y callbacks."
---

# Resolución de Problemas

## Problemas Comunes

### 401 No Autorizado en POST de Webhook

**Síntoma:** Todas las solicitudes webhook devuelven HTTP 401.

**Causas:**

1. **Encabezado de firma faltante.** La solicitud debe incluir `X-Webhook-Signature` o `X-OpenPR-Signature` con el formato `sha256={hex-digest}`.

2. **Secreto incorrecto.** El digest HMAC-SHA256 debe coincidir con uno de los secretos en `security.webhook_secrets`. Verifica que el lado emisor y el receptor usen el mismo string de secreto.

3. **Cuerpo no coincide.** La firma se calcula sobre el cuerpo raw de la solicitud. Si un proxy o middleware modifica el cuerpo (p. ej., recodificando JSON), la firma no coincidirá.

**Depuración:**

```bash
# Enable debug logging
RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml

# Temporarily allow unsigned requests for testing
# (config.toml)
[security]
allow_unsigned = true
```

### Evento Ignorado (not_bot_task)

**Síntoma:** La respuesta es `{"status": "ignored", "reason": "not_bot_task"}`.

**Causa:** El payload webhook no contiene `bot_context.is_bot_task = true`. OpenPR-Webhook solo procesa eventos marcados explícitamente como tareas de bot.

**Solución:** Asegúrate de que la plataforma OpenPR esté configurada para incluir el contexto de bot en los payloads webhook:

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

### Ningún Agente Encontrado

**Síntoma:** La respuesta es `{"status": "no_agent", "bot_name": "..."}`.

**Causa:** Ningún agente configurado coincide con el `bot_name` o `bot_agent_type` del payload.

**Solución:**

1. Verifica que un agente esté configurado con un `id` o `name` que coincida con el valor de `bot_name`
2. Verifica que el `agent_type` del agente coincida con `bot_agent_type`
3. La coincidencia por nombre del agente no distingue mayúsculas/minúsculas, pero la coincidencia por `id` es exacta

### El Agente CLI Devuelve "disabled"

**Síntoma:** El despacho CLI devuelve `"cli disabled by feature flag or safe mode"`.

**Causas:**

1. `features.cli_enabled` no está establecido en `true`
2. La variable de entorno `OPENPR_WEBHOOK_SAFE_MODE` está establecida

**Solución:**

```toml
[features]
cli_enabled = true
```

Y verifica que el modo seguro no esté activo:

```bash
echo $OPENPR_WEBHOOK_SAFE_MODE
# Should be empty or unset
```

### Executor CLI "not allowed"

**Síntoma:** Mensaje de error `"executor not allowed: {name}"`.

**Causa:** El campo `executor` en la configuración del agente CLI contiene un valor que no está en la lista blanca.

**Executors permitidos:**
- `codex`
- `claude-code`
- `opencode`

Cualquier otro valor se rechaza por razones de seguridad.

### El Túnel Falla al Conectar

**Síntoma:** Los mensajes de registro muestran `tunnel connect failed: ...` repetidamente.

**Causas:**

1. **URL inválida.** El URL del túnel debe comenzar con `wss://` o `ws://`.
2. **Problema de red.** Verifica que el servidor del plano de control sea accesible.
3. **Fallo de autenticación.** Verifica que `tunnel.auth_token` sea correcto.
4. **Campos requeridos faltantes.** Tanto `tunnel.agent_id` como `tunnel.auth_token` deben ser no vacíos.

**Depuración:**

```bash
# Test WebSocket connectivity manually
# (requires wscat or websocat)
wscat -c wss://control.example.com/ws -H "Authorization: Bearer your-token"
```

### El Túnel Sigue Reconectando

**Síntoma:** Los registros muestran `tunnel disconnected, reconnecting in Ns` en un bucle.

**Comportamiento normal:** El túnel se reconecta automáticamente con retroceso exponencial (hasta `tunnel_reconnect_backoff_max_secs`). Comprueba los registros del plano de control para la razón de desconexión.

**Ajuste:**

```toml
[tunnel]
reconnect_secs = 3        # Base retry interval
heartbeat_secs = 20       # Keep-alive interval

[runtime]
tunnel_reconnect_backoff_max_secs = 120  # Max backoff
```

### Fallos de Callback

**Síntoma:** Los registros muestran `start callback failed: ...` o `final callback failed: ...`.

**Causas:**

1. **callback_enabled es false.** Los callbacks requieren `features.callback_enabled = true`.
2. **callback_url inválida.** Verifica que el URL sea accesible.
3. **Fallo de autenticación.** Si el endpoint de callback requiere auth, establece `callback_token`.
4. **Timeout.** El timeout HTTP predeterminado es 15 segundos. Aumenta con `runtime.http_timeout_secs`.

### Errores de Ejecución del Agente OpenClaw/Custom

**Síntoma:** La respuesta contiene `exec_error: ...` o `error: ...`.

**Causas:**

1. **Binario no encontrado.** Verifica que la ruta del `command` exista y sea ejecutable.
2. **Permiso denegado.** El proceso openpr-webhook debe tener permiso de ejecución.
3. **Dependencias faltantes.** La herramienta CLI puede requerir otros programas o librerías.

**Depuración:**

```bash
# Test the command manually
/usr/local/bin/openclaw --channel signal --target "+1234567890" --message "test"
```

## Lista de Verificación de Diagnóstico

1. **Verifica el estado del servicio:**
   ```bash
   curl http://localhost:9000/health
   # Should return: ok
   ```

2. **Verifica los agentes cargados:**
   Mira el registro de inicio para `Loaded N agent(s)`.

3. **Habilita el registro de depuración:**
   ```bash
   RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml
   ```

4. **Verifica la firma manualmente:**
   ```bash
   echo -n '{"event":"test"}' | openssl dgst -sha256 -hmac "your-secret"
   ```

5. **Prueba con solicitudes sin firmar (solo desarrollo):**
   ```toml
   [security]
   allow_unsigned = true
   ```

6. **Verifica el estado del modo seguro:**
   ```bash
   # If set, tunnel/cli/callback are force-disabled
   echo $OPENPR_WEBHOOK_SAFE_MODE
   ```

## Referencia de Mensajes de Registro

| Nivel de Registro | Mensaje | Significado |
|-----------|---------|---------|
| INFO | `Loaded N agent(s)` | Configuración cargada exitosamente |
| INFO | `openpr-webhook listening on ...` | Servidor iniciado |
| INFO | `Received webhook event: ...` | Evento entrante analizado |
| INFO | `Dispatching to agent: ...` | Agente coincidente, despachando |
| INFO | `tunnel connected: ...` | Túnel WSS establecido |
| WARN | `Invalid webhook signature` | Verificación de firma fallida |
| WARN | `No agent for bot_name=...` | Ningún agente coincidente encontrado |
| WARN | `tunnel disconnected, reconnecting` | Conexión del túnel perdida |
| WARN | `tunnel using insecure ws:// transport` | No usando TLS |
| ERROR | `tunnel connect failed: ...` | Error de conexión WebSocket |
| ERROR | `openclaw failed: ...` | Comando OpenClaw devolvió no-cero |
