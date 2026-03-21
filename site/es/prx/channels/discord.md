---
title: Discord
description: Conectar PRX a Discord a traves de una aplicacion de bot
---

# Discord

> Conecta PRX a Discord usando una aplicacion de bot con Gateway WebSocket para mensajeria en tiempo real en servidores y DMs.

## Requisitos previos

- Una cuenta de Discord
- Una aplicacion de Discord con un usuario bot creado en el [Developer Portal](https://discord.com/developers/applications)
- El bot invitado a tu servidor con los permisos apropiados

## Configuracion rapida

### 1. Crear una aplicacion de bot

1. Ve al [Discord Developer Portal](https://discord.com/developers/applications)
2. Haz clic en "New Application" y dale un nombre
3. Navega a la seccion "Bot" y haz clic en "Add Bot"
4. Copia el token del bot
5. Bajo "Privileged Gateway Intents", habilita **Message Content Intent**

### 2. Invitar al bot

Genera una URL de invitacion bajo "OAuth2 > URL Generator":
- Scopes: `bot`
- Permissions: `Send Messages`, `Read Message History`, `Add Reactions`, `Attach Files`

### 3. Configurar

```toml
[channels_config.discord]
bot_token = "MTIzNDU2Nzg5.XXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
allowed_users = ["123456789012345678"]
```

### 4. Verificar

```bash
prx channel doctor discord
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `bot_token` | `String` | *requerido* | Token del bot de Discord del Developer Portal |
| `guild_id` | `String` | `null` | ID opcional del guild (servidor) para restringir el bot a un unico servidor |
| `allowed_users` | `[String]` | `[]` | IDs de usuario de Discord. Vacio = denegar todos. `"*"` = permitir todos |
| `listen_to_bots` | `bool` | `false` | Cuando es true, procesa mensajes de otros bots (siempre ignora sus propios mensajes) |
| `mention_only` | `bool` | `false` | Cuando es true, solo responder a mensajes que mencionen al bot con @ |

## Caracteristicas

- **Gateway WebSocket** -- entrega de mensajes en tiempo real a traves de la API Gateway de Discord
- **Soporte de servidor y DM** -- responde en canales de guild y mensajes directos
- **Procesamiento de adjuntos de texto** -- obtiene e integra automaticamente adjuntos `text/*`
- **Restriccion de guild** -- opcionalmente limita el bot a un unico servidor con `guild_id`
- **Comunicacion bot-a-bot** -- habilita `listen_to_bots` para flujos de trabajo multi-bot
- **Indicadores de escritura** -- muestra el estado de escritura mientras genera respuestas

## Limitaciones

- Los mensajes de Discord estan limitados a 2,000 caracteres (PRX divide automaticamente las respuestas mas largas)
- Solo los adjuntos con tipo MIME `text/*` se obtienen e integran; otros tipos de archivo se omiten
- El "Message Content Intent" debe estar habilitado para que el bot pueda leer el texto de los mensajes
- Requiere una conexion WebSocket estable al Gateway de Discord

## Solucion de problemas

### El bot esta en linea pero no responde
- Asegurate de que "Message Content Intent" esta habilitado en el Developer Portal bajo los ajustes del Bot
- Verifica que el ID de usuario de Discord del remitente esta en `allowed_users`
- Comprueba que el bot tiene permisos de `Send Messages` y `Read Message History` en el canal

### El bot solo funciona en algunos canales
- Si `guild_id` esta establecido, el bot solo responde en ese servidor especifico
- Verifica que el bot ha sido invitado con los permisos correctos para cada canal

### Los mensajes de otros bots se ignoran
- Establece `listen_to_bots = true` para procesar mensajes de otras cuentas de bot
- El bot siempre ignora sus propios mensajes para prevenir bucles de retroalimentacion
