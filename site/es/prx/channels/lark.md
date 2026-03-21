---
title: Lark / Feishu
description: Conectar PRX a Lark (internacional) o Feishu (China) IM
---

# Lark / Feishu

> Conecta PRX a Lark (internacional) o Feishu (China continental) usando la API Open Platform con conexion larga WebSocket o entrega de eventos por webhook HTTP.

## Requisitos previos

- Un tenant (organizacion) de Lark o Feishu
- Una aplicacion creada en la [Consola de Desarrollador de Lark](https://open.larksuite.com/app) o [Consola de Desarrollador de Feishu](https://open.feishu.cn/app)
- App ID, App Secret y Verification Token de la consola de desarrollador

## Configuracion rapida

### 1. Crear una aplicacion de bot

1. Ve a la consola de desarrollador y crea una nueva Custom App
2. Bajo "Credentials", copia el **App ID** y **App Secret**
3. Bajo "Event Subscriptions", copia el **Verification Token**
4. Agrega la capacidad de bot y configura los permisos:
   - `im:message`, `im:message.group_at_msg`, `im:message.p2p_msg`

### 2. Configurar

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
verification_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["ou_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"]
```

Para Feishu (China):

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
verification_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
use_feishu = true
allowed_users = ["*"]
```

### 3. Verificar

```bash
prx channel doctor lark
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `app_id` | `String` | *requerido* | App ID de la consola de desarrollador de Lark/Feishu |
| `app_secret` | `String` | *requerido* | App Secret de la consola de desarrollador |
| `verification_token` | `String` | `null` | Token de verificacion para validacion de webhook |
| `encrypt_key` | `String` | `null` | Clave de cifrado para descifrado de mensajes de webhook |
| `allowed_users` | `[String]` | `[]` | IDs de usuario o union IDs permitidos. Vacio = denegar todos. `"*"` = permitir todos |
| `mention_only` | `bool` | `false` | Cuando es true, solo responder a @menciones en grupos. Los DMs siempre se procesan |
| `use_feishu` | `bool` | `false` | Cuando es true, usar endpoints API de Feishu (CN) en lugar de Lark (internacional) |
| `receive_mode` | `String` | `"websocket"` | Modo de recepcion de eventos: `"websocket"` (por defecto, no se necesita URL publica) o `"webhook"` |
| `port` | `u16` | `null` | Puerto HTTP solo para modo webhook. Requerido cuando `receive_mode = "webhook"`, ignorado para websocket |

## Caracteristicas

- **Conexion larga WebSocket** -- conexion WSS persistente para eventos en tiempo real sin URL publica (modo por defecto)
- **Modo webhook HTTP** -- entrega alternativa de eventos via callbacks HTTP para entornos que lo requieran
- **Soporte de Lark y Feishu** -- cambia automaticamente los endpoints API entre Lark (internacional) y Feishu (China)
- **Reacciones de confirmacion** -- reacciona a mensajes entrantes con reacciones apropiadas segun el idioma (zh-CN, zh-TW, en, ja)
- **Mensajeria de DM y grupo** -- maneja tanto chats privados como conversaciones grupales
- **Gestion de tenant access token** -- obtiene y renueva automaticamente los tokens de acceso del tenant
- **Deduplicacion de mensajes** -- previene el doble despacho de mensajes WebSocket dentro de una ventana de 30 minutos

## Limitaciones

- El modo WebSocket requiere una conexion saliente estable a los servidores de Lark/Feishu
- El modo webhook requiere un endpoint HTTPS accesible publicamente
- El bot debe ser agregado a un grupo antes de poder recibir mensajes de grupo
- Feishu y Lark usan dominios API diferentes; asegurate de que `use_feishu` coincida con la region de tu tenant
- La aprobacion de la aplicacion empresarial puede ser necesaria dependiendo de las politicas de administrador de tu tenant

## Solucion de problemas

### El bot no recibe mensajes
- En modo websocket, verifica que las conexiones salientes a `open.larksuite.com` (o `open.feishu.cn`) estan permitidas
- Verifica que la aplicacion tiene los permisos `im:message` requeridos y ha sido aprobada/publicada
- Asegurate de que el bot ha sido agregado al grupo o el usuario ha iniciado un DM con el

### "Verification failed" en eventos de webhook
- Verifica que `verification_token` coincide con el valor en la consola de desarrollador
- Si usas `encrypt_key`, asegurate de que coincide exactamente con el ajuste de la consola

### Region API incorrecta
- Si usas un tenant de Feishu (China), establece `use_feishu = true`
- Si usas un tenant de Lark (internacional), asegurate de que `use_feishu = false` (el valor por defecto)
