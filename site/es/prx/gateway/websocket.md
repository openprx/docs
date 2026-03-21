---
title: WebSocket
description: Interfaz WebSocket para interacciones de streaming en tiempo real con el agente.
---

# WebSocket

El gateway de PRX proporciona un endpoint WebSocket para comunicacion bidireccional en tiempo real con sesiones del agente. Esto permite respuestas en streaming, actualizaciones en vivo de ejecucion de herramientas y conversaciones interactivas.

## Conexion

Conecta al endpoint WebSocket en:

```
ws://127.0.0.1:3120/ws/sessions/:id
```

## Protocolo de mensajes

Los mensajes se intercambian como objetos JSON con un campo `type`:

### Cliente a servidor

- `message` -- enviar un mensaje de usuario
- `cancel` -- cancelar la operacion actual del agente
- `ping` -- ping de mantenimiento de conexion

### Servidor a cliente

- `token` -- token de respuesta en streaming
- `tool_call` -- el agente esta llamando a una herramienta
- `tool_result` -- la ejecucion de la herramienta se completo
- `done` -- respuesta del agente completada
- `error` -- ocurrio un error
- `pong` -- respuesta de mantenimiento de conexion

## Configuracion

```toml
[gateway.websocket]
max_connections = 100
ping_interval_secs = 30
max_message_size_kb = 1024
```

## Paginas relacionadas

- [Vision general del gateway](./)
- [API HTTP](./http-api)
