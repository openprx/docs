---
title: Túnel WSS
description: "El Túnel WSS proporciona una conexión WebSocket activa desde OpenPR-Webhook a un plano de control para despacho de tareas basado en push a través de NAT y firewalls."
---

# Túnel WSS

El Túnel WSS (Fase B) proporciona una conexión WebSocket activa desde OpenPR-Webhook a un servidor de plano de control. En lugar de esperar webhooks HTTP entrantes, el túnel permite que el plano de control empuje tareas directamente al agente a través de una conexión persistente.

Esto es particularmente útil cuando el servicio webhook se ejecuta detrás de un NAT o firewall y no puede recibir solicitudes HTTP entrantes.

## Cómo Funciona

```
Plano de Control (wss://...)
    ^         |
    |         | task.dispatch
    |         v
+-------------------+
| openpr-webhook    |
|   cliente túnel   |
|                   |
| task.ack  ------->|
| heartbeat ------->|
| task.result ----->|
+-------------------+
    |
    v
  Agente CLI (codex / claude-code / opencode)
```

1. OpenPR-Webhook abre una conexión WebSocket al URL del plano de control
2. Se autentica usando un token Bearer en el encabezado `Authorization`
3. Envía mensajes periódicos de heartbeat para mantener la conexión activa
4. Recibe mensajes `task.dispatch` del plano de control
5. Reconoce inmediatamente con `task.ack`
6. Ejecuta la tarea de forma asíncrona a través del agente CLI
7. Envía de vuelta `task.result` cuando se completa la ejecución

## Habilitar el Túnel

El túnel requiere que **dos** cosas estén habilitadas:

1. Indicador de característica: `features.tunnel_enabled = true`
2. Sección de túnel: `tunnel.enabled = true`

Ambas condiciones deben ser verdaderas, y `OPENPR_WEBHOOK_SAFE_MODE` no debe estar establecido.

```toml
[features]
tunnel_enabled = true
cli_enabled = true  # Usually needed for task execution

[tunnel]
enabled = true
url = "wss://control.example.com/ws/agent"
agent_id = "my-webhook-agent"
auth_token = "your-bearer-token"
reconnect_secs = 3
heartbeat_secs = 20
```

## Formato del Envelope de Mensajes

Todos los mensajes del túnel usan un envelope estándar:

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

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (UUID) | Identificador único del mensaje |
| `type` | String | Tipo de mensaje (ver abajo) |
| `ts` | Integer | Marca de tiempo Unix (segundos) |
| `agent_id` | String | ID del agente emisor |
| `payload` | Object | Payload específico del tipo |
| `sig` | String (opcional) | Firma HMAC-SHA256 del envelope |

## Tipos de Mensajes

### Salientes (agente al plano de control)

| Tipo | Cuándo | Payload |
|------|------|---------|
| `heartbeat` | Cada N segundos | `{"alive": true}` |
| `task.ack` | Inmediatamente al recibir una tarea | `{"run_id": "...", "issue_id": "...", "status": "accepted"}` |
| `task.result` | Tras la finalización de la tarea | `{"run_id": "...", "issue_id": "...", "status": "success/failed", "summary": "..."}` |
| `error` | En errores de protocolo | `{"reason": "invalid_json/missing_signature/bad_signature", "msg_id": "..."}` |

### Entrantes (plano de control al agente)

| Tipo | Propósito | Payload |
|------|---------|---------|
| `task.dispatch` | Asignar una tarea a este agente | `{"run_id": "...", "issue_id": "...", "agent": "...", "body": {...}}` |

## Flujo de Despacho de Tareas

```
Plano de Control                    openpr-webhook
    |                                 |
    |--- task.dispatch ------------->|
    |                                 |--- task.ack (inmediato)
    |<--- task.ack ------------------|
    |                                 |
    |                                 |--- ejecutar agente CLI
    |                                 |    (async, hasta timeout)
    |                                 |
    |<--- task.result ---------------|--- task.result
    |                                 |
```

Los campos del payload `task.dispatch`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `run_id` | String | Identificador único de ejecución (auto-generado si falta) |
| `issue_id` | String | ID de la incidencia a trabajar |
| `agent` | String (opcional) | ID del agente objetivo (recurre al primer agente `cli`) |
| `body` | Object | Payload completo del webhook para pasar al dispatcher |

## Firma HMAC del Envelope

Cuando `tunnel.hmac_secret` está configurado, todos los envelopes salientes se firman:

1. El envelope se serializa a JSON con `sig` establecido a `null`
2. Se calcula HMAC-SHA256 sobre los bytes JSON usando el secreto
3. La firma se establece como `sha256={hex}` en el campo `sig`

Para mensajes entrantes, si `tunnel.require_inbound_sig = true`, cualquier mensaje sin firma válida se rechaza con un envelope `error`.

```toml
[tunnel]
hmac_secret = "shared-secret-with-control-plane"
require_inbound_sig = true
```

## Comportamiento de Reconexión

El cliente del túnel se reconecta automáticamente en caso de desconexión:

- Retraso de reintento inicial: `reconnect_secs` (predeterminado: 3 segundos)
- Retroceso: se duplica en cada fallo consecutivo
- Retroceso máximo: `runtime.tunnel_reconnect_backoff_max_secs` (predeterminado: 60 segundos)
- Se restablece al retraso base en una conexión exitosa

## Control de Concurrencia

La ejecución de tareas CLI a través del túnel está limitada por `runtime.cli_max_concurrency`:

```toml
[runtime]
cli_max_concurrency = 2  # Allow 2 concurrent CLI tasks (default: 1)
```

Las tareas que excedan el límite de concurrencia esperan un permiso de semáforo. Esto evita sobrecargar la máquina cuando se despachan múltiples tareas en rápida sucesión.

## Referencia de Configuración

| Campo | Predeterminado | Descripción |
|-------|---------|-------------|
| `tunnel.enabled` | `false` | Habilitar/deshabilitar el túnel |
| `tunnel.url` | -- | URL de WebSocket (`wss://` o `ws://`) |
| `tunnel.agent_id` | `openpr-webhook` | Identificador del agente |
| `tunnel.auth_token` | -- | Token Bearer para autenticación |
| `tunnel.reconnect_secs` | `3` | Intervalo base de reconexión |
| `tunnel.heartbeat_secs` | `20` | Intervalo de heartbeat (mínimo 3s) |
| `tunnel.hmac_secret` | -- | Secreto de firma HMAC-SHA256 |
| `tunnel.require_inbound_sig` | `false` | Rechazar mensajes entrantes sin firmar |

## Notas de Seguridad

- Siempre usa `wss://` en producción. El servicio registra una advertencia si se usa `ws://`.
- El `auth_token` se envía como encabezado HTTP durante la actualización de WebSocket; asegúrate de que se use TLS.
- Habilita `require_inbound_sig` con un `hmac_secret` para prevenir despachos de tareas falsificados.
