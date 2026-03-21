---
title: QQ
description: Conectar PRX a la mensajeria instantanea QQ a traves del Bot API
---

# QQ

> Conecta PRX a QQ usando el Bot API oficial con soporte para mensajes privados, chats grupales, guilds y adjuntos multimedia.

## Requisitos previos

- Una cuenta de QQ (personal o empresarial)
- Una aplicacion de bot registrada en la [QQ Open Platform](https://q.qq.com/)
- Un App ID y App Secret de la consola de desarrollador
- El bot debe estar aprobado y publicado (modo sandbox disponible para pruebas)

## Configuracion rapida

### 1. Crear un bot de QQ

1. Ve a la [QQ Open Platform](https://q.qq.com/) e inicia sesion con tu cuenta de QQ
2. Navega a "Applications" y crea una nueva aplicacion de bot
3. Rellena el nombre del bot, descripcion y avatar
4. Bajo "Development Settings", copia el **App ID** y **App Secret**
5. Configura los intents del bot (tipos de mensaje que el bot debe recibir)
6. Para pruebas, habilita el modo sandbox que limita el bot a un guild de prueba designado

### 2. Configurar

Agrega lo siguiente a tu archivo de configuracion de PRX:

```toml
[channels_config.qq]
app_id = "102012345"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["user_openid_1", "user_openid_2"]
sandbox = true
```

Establece `sandbox = false` una vez que el bot haya sido aprobado para uso en produccion.

### 3. Verificar

```bash
prx channel doctor qq
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `app_id` | `String` | *requerido* | ID de aplicacion de la consola de desarrollador de QQ Open Platform |
| `app_secret` | `String` | *requerido* | Secreto de aplicacion de la consola de desarrollador |
| `allowed_users` | `[String]` | `[]` | OpenIDs de usuario permitidos. Vacio = modo emparejamiento. `"*"` = permitir todos |
| `sandbox` | `bool` | `false` | Cuando es true, conectar al gateway sandbox para pruebas |
| `intents` | `[String]` | `["guilds", "guild_messages", "direct_messages"]` | Intents de eventos a suscribir |
| `stream_mode` | `String` | `"none"` | Modo streaming: `"none"` o `"typing"`. El modo typing envia un indicador de escritura mientras genera |
| `interrupt_on_new_message` | `bool` | `false` | Cuando es true, un nuevo mensaje del mismo remitente cancela la solicitud en curso |
| `mention_only` | `bool` | `false` | Cuando es true, solo responder a @menciones en canales de grupo o guild. Los DMs siempre se procesan |
| `ack_reactions` | `bool` | *heredado* | Sobreescritura para el ajuste global `ack_reactions`. Recurre a `[channels_config].ack_reactions` si no esta establecido |

## Como funciona

PRX se conecta al Bot API de QQ usando un flujo de eventos basado en WebSocket. El ciclo de vida de la conexion es:

1. **Autenticacion** -- PRX obtiene un token de acceso usando el App ID y App Secret via credenciales de cliente OAuth2
2. **Descubrimiento de gateway** -- el bot solicita la URL del gateway WebSocket a la API de QQ
3. **Establecimiento de sesion** -- se abre una conexion WebSocket al gateway con el token de acceso
4. **Suscripcion de intents** -- el bot declara que tipos de eventos quiere recibir
5. **Bucle de eventos** -- los mensajes entrantes se despachan al bucle del agente PRX; las respuestas se envian via la API REST

```
QQ Gateway (WSS) ──► PRX Channel Handler ──► Agent Loop
                                                │
QQ REST API ◄───── Reply with message ◄────────┘
```

## Caracteristicas

- **Mensajeria de guild y grupo** -- responde a mensajes en guilds (canales) y chats grupales de QQ
- **Mensajes directos** -- maneja conversaciones privadas 1:1 con usuarios
- **Modo de emparejamiento** -- vinculacion segura con codigo de un solo uso cuando no hay usuarios permitidos configurados
- **Adjuntos multimedia** -- soporta envio y recepcion de imagenes, archivos y tarjetas multimedia enriquecidas
- **Respuestas Markdown** -- los bots de QQ soportan un subconjunto de formato Markdown en respuestas
- **Reacciones de confirmacion** -- reacciona a mensajes entrantes para confirmar recepcion cuando esta habilitado
- **Modo sandbox** -- prueba el bot en un entorno de guild aislado antes del despliegue en produccion
- **Renovacion automatica de token** -- los tokens de acceso se renuevan automaticamente antes de expirar
- **Multiplataforma** -- funciona en QQ desktop, movil y QQ para Linux

## Tipos de mensaje

El Bot API de QQ soporta varios tipos de contenido de mensaje:

| Tipo | Direccion | Descripcion |
|------|-----------|-------------|
| Texto | Enviar / Recibir | Mensajes de texto plano, hasta 2,048 caracteres |
| Markdown | Enviar | Texto formateado con el subconjunto Markdown de QQ |
| Imagen | Enviar / Recibir | Adjuntos de imagen (JPEG, PNG, GIF) |
| Archivo | Recibir | Adjuntos de archivos de usuarios |
| Embed enriquecido | Enviar | Mensajes de tarjeta estructurados con titulo, descripcion y miniatura |
| Plantilla Ark | Enviar | Mensajes enriquecidos basados en plantillas usando el sistema Ark de QQ |

## Intents

Los intents controlan que eventos recibe el bot. Intents disponibles:

| Intent | Eventos | Notas |
|--------|---------|-------|
| `guilds` | Creacion, actualizacion, eliminacion de guild | Cambios de metadatos de guild |
| `guild_members` | Agregar, actualizar, eliminar miembro | Requiere permisos elevados |
| `guild_messages` | Mensajes en canales de texto de guild | Intent mas comun |
| `guild_message_reactions` | Agregar/eliminar reacciones en guilds | Reacciones emoji |
| `direct_messages` | DMs privados con el bot | Siempre recomendado |
| `group_and_c2c` | Chats grupales y mensajes C2C | Requiere aprobacion separada |
| `interaction` | Clics en botones e interacciones | Para componentes de mensaje interactivos |

## Limitaciones

- El Bot API de QQ tiene restriccion regional; los bots estan disponibles principalmente en China continental
- El modo sandbox limita el bot a un unico guild de prueba con un numero pequeno de miembros
- Los bots de produccion requieren aprobacion del equipo de revision de QQ Open Platform
- El chat grupal y la mensajeria C2C requieren una solicitud de permiso separada
- Las subidas de archivos estan limitadas a 20 MB por adjunto
- La moderacion de contenido es aplicada por QQ; los mensajes con contenido prohibido se descartan silenciosamente
- Se aplican limites de velocidad: aproximadamente 5 mensajes por segundo por guild, 2 por segundo para DMs
- El bot no puede iniciar conversaciones; los usuarios o administradores deben agregar al bot primero

## Solucion de problemas

### El bot no se conecta al gateway de QQ

- Verifica que `app_id` y `app_secret` son correctos con `prx channel doctor qq`
- Si usas modo sandbox, asegurate de que `sandbox = true` esta establecido (sandbox y produccion usan gateways diferentes)
- Comprueba que las conexiones salientes a `api.sgroup.qq.com` y el gateway WebSocket no estan bloqueadas

### El bot se conecta pero no recibe mensajes

- Verifica que los `intents` correctos estan configurados para tu caso de uso
- En canales de guild, el bot puede necesitar que un admin del guild le otorgue el permiso "Receive Messages"
- Comprueba que el OpenID del usuario remitente esta en `allowed_users`, o establece `allowed_users = ["*"]`

### Las respuestas no se entregan

- QQ aplica moderacion de contenido; revisa los logs de PRX para respuestas de rechazo de la API
- Asegurate de que el bot tiene el permiso "Send Messages" en el guild o grupo objetivo
- Para respuestas DM, el usuario debe haber enviado un mensaje al bot primero para abrir la conversacion

### Fallos de renovacion de token

- El App Secret puede haber sido rotado en la consola de desarrollador; actualiza la configuracion con el nuevo secreto
- Los problemas de red pueden prevenir la renovacion de token; verifica la conectividad a `bots.qq.com`

## Paginas relacionadas

- [Vision general de canales](./)
- [DingTalk](./dingtalk) -- configuracion similar para la plataforma DingTalk
- [Lark](./lark) -- configuracion similar para Lark / Feishu
- [Seguridad: Emparejamiento](../security/pairing) -- detalles sobre el emparejamiento con codigo de vinculacion de un solo uso
