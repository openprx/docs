---
title: Hooks
description: Sistema de extension dirigido por eventos con 8 eventos de ciclo de vida, ejecucion de hooks de shell, callbacks de plugins WASM, gestion por API HTTP e integracion con bus de eventos para observabilidad y automatizacion.
---

# Hooks

Los hooks de PRX proporcionan un sistema de extension dirigido por eventos que permite reaccionar a eventos del ciclo de vida durante la ejecucion del agente. Cada momento significativo en el bucle del agente -- iniciar un turno, llamar a un LLM, invocar una herramienta, encontrar un error -- emite un evento de hook. Se asocian acciones a estos eventos via un archivo de configuracion `hooks.json`, manifiestos de plugins WASM o la API HTTP.

Los hooks son **disparar y olvidar** por diseno. Nunca bloquean el bucle del agente, nunca modifican el flujo de ejecucion y nunca inyectan datos de vuelta en la conversacion. Esto los hace ideales para registro de auditoria, recoleccion de metricas, notificaciones externas y automatizacion de efectos secundarios sin introducir latencia o modos de fallo en el pipeline principal del agente.

Hay tres backends de ejecucion de hooks:

- **Hooks de shell** -- Ejecutar un comando externo con el payload del evento pasado via variable de entorno, archivo temporal o stdin. Configurados en `hooks.json`.
- **Hooks de plugin WASM** -- Llamar a la funcion `on-event` exportada por un plugin WASM. Declarados en el manifiesto `plugin.toml` del plugin.
- **Hooks de bus de eventos** -- Publicar al bus de eventos interno en el topico `prx.lifecycle.<evento>`. Siempre activos; no requieren configuracion.

## Eventos de hook

PRX emite 8 eventos de ciclo de vida. Cada evento lleva un payload JSON con campos especificos del contexto.

| Evento | Cuando se emite | Campos del payload |
|--------|----------------|-------------------|
| `agent_start` | El bucle del agente inicia un nuevo turno | `agent` (string), `session` (string) |
| `agent_end` | El bucle del agente completa un turno | `success` (bool), `messages_count` (number) |
| `llm_request` | Antes de enviar una solicitud al proveedor LLM | `provider` (string), `model` (string), `messages_count` (number) |
| `llm_response` | Despues de recibir la respuesta del LLM | `provider` (string), `model` (string), `duration_ms` (number), `success` (bool) |
| `tool_call_start` | Antes de que una herramienta inicie ejecucion | `tool` (string), `arguments` (object) |
| `tool_call` | Despues de que una herramienta complete ejecucion | `tool` (string), `success` (bool), `output` (string) |
| `turn_complete` | Turno completo finalizado (todas las herramientas resueltas) | _(objeto vacio)_ |
| `error` | Cualquier error durante la ejecucion | `component` (string), `message` (string) |

## Configuracion

Los hooks de shell se configuran en un archivo `hooks.json` colocado en el directorio del espacio de trabajo. PRX observa este archivo para cambios y **recarga en caliente** la configuracion sin requerir reinicio.

```json
{
  "hooks": {
    "agent_start": [
      {
        "command": "/usr/local/bin/notify",
        "args": ["--channel", "ops", "--title", "Agent Started"],
        "timeout_ms": 3000
      }
    ],
    "llm_response": [
      {
        "command": "python3",
        "args": ["/opt/hooks/log_latency.py"],
        "stdin_json": true,
        "timeout_ms": 2000
      }
    ],
    "error": [
      {
        "command": "curl",
        "args": ["-X", "POST", "-H", "Content-Type: application/json", "-d", "@-", "https://hooks.slack.com/services/T00/B00/xxxxx"],
        "stdin_json": true,
        "timeout_ms": 10000
      }
    ]
  }
}
```

## Campos de accion de hook

| Campo | Tipo | Requerido | Por defecto | Descripcion |
|-------|------|-----------|-------------|-------------|
| `command` | string | Si | -- | Ruta absoluta al ejecutable o nombre de comando en el PATH sanitizado |
| `args` | string[] | No | `[]` | Argumentos pasados al comando |
| `env` | object | No | `{}` | Variables de entorno adicionales fusionadas en el entorno de ejecucion sanitizado |
| `cwd` | string | No | directorio workspace | Directorio de trabajo para el proceso generado |
| `timeout_ms` | number | No | `30000` | Tiempo maximo de ejecucion en milisegundos. El proceso se mata (SIGKILL) si excede este limite |
| `stdin_json` | bool | No | `false` | Cuando es `true`, el payload JSON completo del evento se canaliza al proceso via stdin |

## Entrega de payload

Las acciones de hook reciben el payload del evento a traves de tres canales simultaneamente:

1. **Variable de entorno** (`ZERO_HOOK_PAYLOAD`) -- cadena JSON del payload (limite de 8 KB)
2. **Archivo temporal** (`ZERO_HOOK_PAYLOAD_FILE`) -- sin limite de tamano
3. **Entrada estandar** (stdin) -- cuando `stdin_json` es `true`

## Hooks de plugins WASM

Los plugins WASM pueden suscribirse a eventos de hook exportando la funcion `on-event` definida en la interfaz WIT de PRX. Los plugins declaran que eventos quieren recibir en su manifiesto `plugin.toml`.

## Integracion con bus de eventos

Cada evento de hook se publica automaticamente al bus de eventos interno en el topico `prx.lifecycle.<evento>`. Esto ocurre independientemente de si hay hooks de shell o WASM configurados.

## API HTTP

Los hooks pueden gestionarse programaticamente a traves de la API HTTP con endpoints para listar, crear, actualizar, eliminar y alternar hooks.

## Seguridad

- **Variables de entorno bloqueadas**: `LD_PRELOAD`, `LD_LIBRARY_PATH`, `DYLD_INSERT_LIBRARIES`, `PATH`, `HOME` se eliminan del entorno de ejecucion de hooks
- **Validacion de entrada**: Rechazo de bytes nulos, rechazo de metacaracteres de shell en el campo `command`
- **Aplicacion de timeout**: Cada proceso de hook esta sujeto al `timeout_ms` configurado
- **Aislamiento de recursos**: Los procesos de hook heredan las mismas restricciones de cgroup y namespace que las ejecuciones de herramientas shell

## Relacionado

- [Ejecucion shell](/es/prx/tools/shell) -- herramienta shell que los hooks a menudo envuelven
- [Integracion MCP](/es/prx/tools/mcp) -- protocolo de herramientas externo que emite eventos `tool_call`
- [Plugins](/es/prx/plugins/) -- sistema de plugins WASM incluyendo capacidades de hook
- [Observabilidad](/es/prx/observability/) -- metricas y rastreo que complementan los hooks
- [Seguridad](/es/prx/security/) -- sandbox y motor de politicas que gobierna la ejecucion de hooks
