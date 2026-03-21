---
title: Mensajeria
description: Herramientas para enviar mensajes a traves de canales de comunicacion con enrutamiento automatico y acceso de bajo nivel al gateway.
---

# Mensajeria

PRX proporciona dos herramientas de mensajeria que permiten a los agentes enviar mensajes de vuelta a traves de canales de comunicacion. La herramienta `message_send` es la interfaz de alto nivel para enviar mensajes de texto, multimedia y voz a cualquier canal configurado, mientras que la herramienta `gateway` proporciona acceso de bajo nivel al gateway HTTP/WebSocket Axum para entrega de mensajes sin procesar.

## Referencia de herramientas

### message_send

Envia un mensaje a cualquier canal configurado y destinatario. La herramienta enruta automaticamente al canal activo.

| Parametro | Tipo | Requerido | Por defecto | Descripcion |
|-----------|------|-----------|-------------|-------------|
| `text` | `string` | Condicional | -- | Contenido del mensaje de texto |
| `channel` | `string` | No | Canal activo | Nombre del canal destino |
| `recipient` | `string` | No | Usuario actual | Identificador del destinatario |
| `media_path` | `string` | No | -- | Ruta al archivo multimedia |
| `caption` | `string` | No | -- | Titulo para mensajes multimedia |
| `voice_path` | `string` | No | -- | Ruta al archivo de voz/audio |

### gateway

Acceso de bajo nivel al gateway para enviar mensajes sin procesar a traves del gateway HTTP/WebSocket Axum.

## Transportes de canal soportados

| Canal | Texto | Multimedia | Voz | Respuesta |
|-------|:-----:|:----------:|:---:|:---------:|
| Telegram | Si | Si | Si | Si |
| Discord | Si | Si | Si | Si |
| Slack | Si | Si | No | Si |
| WhatsApp | Si | Si | Si | Si |
| Signal | Si | Si | No | Si |
| Matrix | Si | Si | No | Si |
| Email | Si | Si (adjunto) | No | Si |
| CLI | Si | No | No | No |

## Relacionado

- [Vision general de canales](/es/prx/channels/) -- las 19 plataformas de mensajeria soportadas
- [Gateway](/es/prx/gateway/) -- arquitectura de API HTTP y WebSocket
- [Herramientas de renderizado (TTS)](/es/prx/tools/media) -- texto a voz para mensajes de voz
- [Vision general de herramientas](/es/prx/tools/) -- todas las herramientas y sistema de registro
