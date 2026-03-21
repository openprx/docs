---
title: Slack
description: Conectar PRX a Slack a traves del Bot API y Socket Mode
---

# Slack

> Conecta PRX a Slack usando un bot con tokens OAuth, Socket Mode para eventos en tiempo real y soporte de conversaciones en hilos.

## Requisitos previos

- Un espacio de trabajo de Slack donde tengas permisos para instalar aplicaciones
- Una aplicacion de Slack creada en [api.slack.com/apps](https://api.slack.com/apps)
- Un token de bot (`xoxb-...`) y opcionalmente un token de nivel de aplicacion (`xapp-...`) para Socket Mode

## Configuracion rapida

### 1. Crear una aplicacion de Slack

1. Ve a [api.slack.com/apps](https://api.slack.com/apps) y haz clic en "Create New App"
2. Elige "From scratch" y selecciona tu espacio de trabajo
3. Bajo "OAuth & Permissions", agrega estos scopes de bot:
   - `chat:write`, `channels:history`, `groups:history`, `im:history`, `mpim:history`
   - `files:read`, `files:write`, `reactions:write`, `users:read`
4. Instala la aplicacion en tu espacio de trabajo y copia el **Bot User OAuth Token** (`xoxb-...`)

### 2. Habilitar Socket Mode (recomendado)

1. Bajo "Socket Mode", habilitalo y genera un token de nivel de aplicacion (`xapp-...`) con el scope `connections:write`
2. Bajo "Event Subscriptions", suscribete a: `message.channels`, `message.groups`, `message.im`, `message.mpim`

### 3. Configurar

```toml
[channels_config.slack]
bot_token = "xoxb-your-bot-token-here"
app_token = "xapp-your-app-token-here"
allowed_users = ["U01ABCDEF"]
```

### 4. Verificar

```bash
prx channel doctor slack
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `bot_token` | `String` | *requerido* | Token OAuth del bot de Slack (`xoxb-...`) |
| `app_token` | `String` | `null` | Token de nivel de aplicacion (`xapp-...`) para Socket Mode. Sin este, recurre a polling |
| `channel_id` | `String` | `null` | Restringir el bot a un unico canal. Omitir o establecer `"*"` para escuchar en todos los canales |
| `allowed_users` | `[String]` | `[]` | IDs de usuario de Slack. Vacio = denegar todos. `"*"` = permitir todos |
| `interrupt_on_new_message` | `bool` | `false` | Cuando es true, un nuevo mensaje del mismo remitente cancela la solicitud en curso |
| `thread_replies` | `bool` | `true` | Cuando es true, las respuestas permanecen en el hilo de origen. Cuando es false, van a la raiz del canal |
| `mention_only` | `bool` | `false` | Cuando es true, solo responder a @menciones. Los DMs siempre se procesan |

## Caracteristicas

- **Socket Mode** -- entrega de eventos en tiempo real sin URL publica (requiere `app_token`)
- **Respuestas en hilos** -- responde automaticamente dentro del hilo de origen
- **Adjuntos de archivos** -- descarga e integra archivos de texto; procesa imagenes de hasta 5 MB
- **Nombres de visualizacion de usuarios** -- resuelve IDs de usuario de Slack a nombres de visualizacion con cache (TTL de 6 horas)
- **Soporte multi-canal** -- escucha en multiples canales o restringe a uno
- **Indicadores de escritura** -- muestra el estado de escritura mientras genera respuestas
- **Soporte de interrupcion** -- cancela solicitudes en curso cuando el usuario envia un seguimiento

## Limitaciones

- Los mensajes de Slack estan limitados a 40,000 caracteres (raramente un problema)
- Las descargas de archivos estan limitadas a 256 KB para texto y 5 MB para imagenes
- Maximo 8 adjuntos de archivos procesados por mensaje
- Socket Mode requiere el scope `connections:write` en un token de nivel de aplicacion
- Sin Socket Mode (`app_token`), el canal recurre a polling con mayor latencia

## Solucion de problemas

### El bot no recibe mensajes
- Verifica que Socket Mode esta habilitado y el `app_token` es correcto
- Comprueba que "Event Subscriptions" incluye los eventos `message.*` necesarios
- Asegurate de que el bot ha sido invitado al canal (`/invite @botname`)

### Las respuestas van al canal en lugar del hilo
- Comprueba que `thread_replies` no esta establecido en `false`
- Las respuestas en hilos requieren que el mensaje original tenga un `thread_ts`

### Los adjuntos de archivos no se procesan
- Asegurate de que el bot tiene el scope `files:read`
- Solo los tipos MIME `text/*` e imagenes comunes estan soportados
- Los archivos que superan los limites de tamano se omiten silenciosamente
