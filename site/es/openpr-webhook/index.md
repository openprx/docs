---
title: OpenPR-Webhook
description: Servicio dispatcher de eventos webhook para OpenPR con verificación de firma HMAC-SHA256, filtrado de tareas de bot y 5 tipos de agentes para procesamiento flexible de eventos.
---

# OpenPR-Webhook

OpenPR-Webhook es un servicio despachador de eventos webhook para [OpenPR](https://github.com/openprx/openpr). Recibe eventos webhook de la plataforma OpenPR, los filtra según el contexto de bot y los enruta a uno o más agentes configurables para su procesamiento.

## Qué Hace

Cuando ocurre un evento en OpenPR (p. ej., se crea o actualiza una incidencia), la plataforma envía una solicitud POST de webhook a este servicio. OpenPR-Webhook entonces:

1. **Verifica la solicitud** usando validación de firma HMAC-SHA256
2. **Filtra eventos** -- solo se procesan los eventos con `bot_context.is_bot_task = true`
3. **Enruta a agentes** -- hace coincidir el evento con un agente configurado por nombre o tipo
4. **Despacha** -- ejecuta la acción del agente (enviar un mensaje, llamar a una herramienta CLI, reenviar a otro webhook, etc.)

## Descripción de la Arquitectura

```
Plataforma OpenPR
    |
    | POST /webhook (firmado HMAC-SHA256)
    v
+-------------------+
| openpr-webhook    |
|                   |
| Verif. firma      |
| Filtro de eventos |
| Coincid. agente   |
+-------------------+
    |           |           |
    v           v           v
 openclaw    webhook     agente cli
 (Signal/    (reenvío   (codex /
  Telegram)  HTTP)      claude-code)
```

## Características Principales

- **Verificación de firma HMAC-SHA256** en webhooks entrantes con soporte de rotación de múltiples secretos
- **Filtrado de tareas de bot** -- ignora silenciosamente los eventos no destinados a bots
- **5 tipos de agentes/executors** -- openclaw, openprx, webhook, custom, cli
- **Plantillas de mensajes** con variables de marcador de posición para formateo flexible de notificaciones
- **Transiciones de estado** -- actualiza automáticamente el estado de la incidencia al iniciar, completar o fallar una tarea
- **Túnel WSS** (Fase B) -- conexión WebSocket activa a un plano de control para despacho de tareas basado en push
- **Valores predeterminados seguros** -- las funciones peligrosas (túnel, cli, callback) están DESACTIVADAS por defecto, controladas por indicadores de características y modo seguro

## Tipos de Agentes Soportados

| Tipo | Propósito | Protocolo |
|------|---------|----------|
| `openclaw` | Enviar notificaciones vía Signal/Telegram mediante OpenClaw CLI | Comando de shell |
| `openprx` | Enviar mensajes vía API Signal de OpenPRX o CLI | API HTTP / Shell |
| `webhook` | Reenviar el payload completo del evento a un endpoint HTTP | HTTP POST |
| `custom` | Ejecutar un comando de shell arbitrario con el mensaje como argumento | Comando de shell |
| `cli` | Ejecutar un agente de codificación IA (codex, claude-code, opencode) en la incidencia | Subproceso |

## Enlaces Rápidos

- [Instalación](getting-started/installation.md)
- [Inicio Rápido](getting-started/quickstart.md)
- [Tipos de Agentes](agents/index.md)
- [Referencia de Executors](agents/executors.md)
- [Túnel WSS](tunnel/index.md)
- [Referencia de Configuración](configuration/index.md)
- [Resolución de Problemas](troubleshooting/index.md)

## Repositorio

Código fuente: [github.com/openprx/openpr-webhook](https://github.com/openprx/openpr-webhook)

Licencia: MIT OR Apache-2.0
