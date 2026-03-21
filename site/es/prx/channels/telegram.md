---
title: Telegram
description: Conectar PRX a Telegram a traves del Bot API
---

# Telegram

> Conecta PRX a Telegram usando el Bot API oficial con soporte para DMs, grupos, respuestas en streaming y adjuntos multimedia.

## Requisitos previos

- Una cuenta de Telegram
- Un token de bot de [@BotFather](https://t.me/BotFather)
- Los IDs de usuario o nombres de usuario de Telegram de los usuarios permitidos

## Configuracion rapida

### 1. Crear un bot

1. Abre Telegram y enviale un mensaje a [@BotFather](https://t.me/BotFather)
2. Envia `/newbot` y sigue las instrucciones para nombrar tu bot
3. Copia el token del bot (formato: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### 2. Configurar

Agrega lo siguiente a tu archivo de configuracion de PRX:

```toml
[channels_config.telegram]
bot_token = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
allowed_users = ["123456789", "your_username"]
```

Si `allowed_users` se deja vacio, PRX entra en **modo de emparejamiento** y genera un codigo de vinculacion de un solo uso. Envia `/bind <codigo>` desde tu cuenta de Telegram para emparejarte.

### 3. Verificar

```bash
prx channel doctor telegram
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `bot_token` | `String` | *requerido* | Token del Bot API de Telegram de @BotFather |
| `allowed_users` | `[String]` | `[]` | IDs o nombres de usuario de Telegram. Vacio = modo emparejamiento. `"*"` = permitir todos |
| `stream_mode` | `String` | `"none"` | Modo streaming: `"none"`, `"edit"` o `"typing"`. El modo edit actualiza progresivamente el mensaje de respuesta |
| `draft_update_interval_ms` | `u64` | `500` | Intervalo minimo (ms) entre ediciones de mensaje borrador para evitar limites de velocidad |
| `interrupt_on_new_message` | `bool` | `false` | Cuando es true, un nuevo mensaje del mismo remitente cancela la solicitud en curso |
| `mention_only` | `bool` | `false` | Cuando es true, solo responder a @menciones en grupos. Los DMs siempre se procesan |
| `ack_reactions` | `bool` | *heredado* | Sobreescritura para el ajuste global `ack_reactions`. Recurre a `[channels_config].ack_reactions` si no esta establecido |

## Caracteristicas

- **Mensajes directos y chats grupales** -- responde a DMs y conversaciones grupales
- **Respuestas en streaming** -- ediciones progresivas del mensaje muestran la respuesta a medida que se genera
- **Modo de emparejamiento** -- vinculacion segura con codigo de un solo uso cuando no hay usuarios permitidos configurados
- **Adjuntos multimedia** -- maneja documentos, fotos y descripciones
- **Division de mensajes largos** -- divide automaticamente las respuestas que exceden el limite de 4096 caracteres de Telegram en los limites de palabras
- **Reacciones de confirmacion** -- reacciona a los mensajes entrantes para confirmar la recepcion
- **Transcripcion de voz** -- transcribe mensajes de voz cuando STT esta configurado

## Limitaciones

- Telegram limita los mensajes de texto a 4,096 caracteres (PRX divide automaticamente los mensajes mas largos)
- El polling del Bot API introduce una ligera latencia comparado con el modo webhook
- Los bots no pueden iniciar conversaciones; los usuarios deben enviar un mensaje al bot primero
- Las subidas de archivos estan limitadas a 50 MB a traves del Bot API

## Solucion de problemas

### El bot no responde a los mensajes
- Verifica que el token del bot es correcto con `prx channel doctor telegram`
- Comprueba que el ID de usuario o nombre de usuario del remitente esta en `allowed_users`
- Si `allowed_users` esta vacio, usa `/bind <codigo>` para emparejarte primero

### Errores de limite de velocidad en streaming
- Aumenta `draft_update_interval_ms` (ej., a `1000` o mas)
- Telegram aplica limites de velocidad por chat en las ediciones de mensajes

### El bot responde en DMs pero no en grupos
- Asegurate de que `mention_only` esta establecido en `false`, o menciona al bot con @
- En BotFather, deshabilita el modo "Group Privacy" para que el bot pueda ver todos los mensajes del grupo
