---
title: Mattermost
description: Conectar PRX a Mattermost a traves de la API REST
---

# Mattermost

> Conecta PRX a Mattermost usando la API REST v4 para mensajeria en esta alternativa de Slack de codigo abierto y auto-alojada.

## Requisitos previos

- Un servidor Mattermost (auto-alojado o en la nube)
- Una cuenta de bot creada en Mattermost con un token de acceso personal
- El bot invitado a los canales donde debe operar

## Configuracion rapida

### 1. Crear una cuenta de bot

1. Ve a **System Console > Integrations > Bot Accounts** y habilita las cuentas de bot
2. Ve a **Integrations > Bot Accounts > Add Bot Account**
3. Establece un nombre de usuario, nombre para mostrar y rol
4. Copia el **Access Token** generado

Alternativamente, crea una cuenta de usuario regular y genera un token de acceso personal en **Profile > Security > Personal Access Tokens**.

### 2. Configurar

```toml
[channels_config.mattermost]
url = "https://mattermost.example.com"
bot_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
channel_id = "abc123def456ghi789"
allowed_users = ["user123456"]
```

### 3. Verificar

```bash
prx channel doctor mattermost
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `url` | `String` | *requerido* | URL del servidor Mattermost (ej., `"https://mattermost.example.com"`) |
| `bot_token` | `String` | *requerido* | Token de acceso del bot o token de acceso personal |
| `channel_id` | `String` | `null` | ID de canal opcional para restringir el bot a un unico canal |
| `allowed_users` | `[String]` | `[]` | IDs de usuario de Mattermost permitidos. Vacio = denegar todos. `"*"` = permitir todos |
| `thread_replies` | `bool` | `true` | Cuando es true, las respuestas se enlazan al hilo del post original. Cuando es false, van a la raiz del canal |
| `mention_only` | `bool` | `false` | Cuando es true, solo responder a mensajes que mencionen al bot con @ |

## Caracteristicas

- **API REST v4** -- usa la API estandar de Mattermost para enviar y recibir mensajes
- **Respuestas en hilos** -- responde automaticamente dentro del hilo de origen
- **Indicadores de escritura** -- muestra el estado de escritura mientras genera respuestas
- **Compatible con auto-alojamiento** -- funciona con cualquier despliegue de Mattermost, sin dependencias externas
- **Restriccion de canal** -- opcionalmente limita el bot a un unico canal con `channel_id`
- **Filtrado por mencion** -- solo responder a @menciones en canales concurridos

## Limitaciones

- Usa polling en lugar de WebSocket para entrega de mensajes, introduciendo una ligera latencia
- El bot debe ser miembro del canal para leer y enviar mensajes
- Las cuentas de bot requieren que el administrador del sistema las habilite en la System Console de Mattermost
- El procesamiento de adjuntos de archivos no esta soportado actualmente
- Las barras diagonales finales en la URL se eliminan automaticamente

## Solucion de problemas

### El bot no responde
- Verifica que la `url` no tiene barra diagonal final (se elimina automaticamente, pero verifica)
- Confirma que el token del bot es valido: `curl -H "Authorization: Bearer <token>" https://your-mm.com/api/v4/users/me`
- Asegurate de que el bot ha sido agregado al canal

### Las respuestas van al lugar equivocado
- Si `thread_replies = true`, las respuestas se enlazan al `root_id` del post original
- Si el mensaje original no esta en un hilo, se crea un nuevo hilo
- Establece `thread_replies = false` para siempre publicar en la raiz del canal

### El bot responde a todo en el canal
- Establece `mention_only = true` para solo responder cuando se mencione con @
- Alternativamente, restringe a un canal dedicado con `channel_id`
