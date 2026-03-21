---
title: Nextcloud Talk
description: Conectar PRX a Nextcloud Talk a traves de la API OCS
---

# Nextcloud Talk

> Conecta PRX a Nextcloud Talk usando la API OCS y entrega de mensajes basada en webhooks para mensajeria de equipo auto-alojada.

## Requisitos previos

- Una instancia de Nextcloud (version 25 o posterior recomendada) con la aplicacion Talk habilitada
- Un token de aplicacion de bot para autenticacion de la API OCS
- Configuracion de webhook para entrega de mensajes entrantes

## Configuracion rapida

### 1. Crear un token de aplicacion de bot

En Nextcloud, genera una contrasena de aplicacion:
1. Ve a **Ajustes > Seguridad > Dispositivos y sesiones**
2. Crea una nueva contrasena de aplicacion con un nombre descriptivo (ej., "PRX Bot")
3. Copia el token generado

Alternativamente, para la API de bot de Nextcloud Talk (Nextcloud 27+):
1. Usa `occ` para registrar un bot: `php occ talk:bot:setup "PRX" <secret> <webhook-url>`

### 2. Configurar

```toml
[channels_config.nextcloud_talk]
base_url = "https://cloud.example.com"
app_token = "xxxxx-xxxxx-xxxxx-xxxxx-xxxxx"
allowed_users = ["admin", "alice"]
```

### 3. Configurar webhooks

Configura tu bot de Nextcloud Talk para enviar eventos de webhook al endpoint de gateway de PRX:

```
POST https://your-prx-domain.com/nextcloud-talk
```

### 4. Verificar

```bash
prx channel doctor nextcloud_talk
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `base_url` | `String` | *requerido* | URL base de Nextcloud (ej., `"https://cloud.example.com"`) |
| `app_token` | `String` | *requerido* | Token de aplicacion de bot para autenticacion bearer de la API OCS |
| `webhook_secret` | `String` | `null` | Secreto compartido para verificacion de firma HMAC-SHA256 de webhook. Tambien se puede establecer via la variable de entorno `ZEROCLAW_NEXTCLOUD_TALK_WEBHOOK_SECRET` |
| `allowed_users` | `[String]` | `[]` | IDs de actor de Nextcloud permitidos. Vacio = denegar todos. `"*"` = permitir todos |

## Caracteristicas

- **Entrega basada en webhooks** -- recibe mensajes via push HTTP webhook de Nextcloud Talk
- **Respuestas por API OCS** -- envia respuestas a traves de la API REST OCS de Nextcloud Talk
- **Verificacion HMAC-SHA256** -- validacion opcional de firma de webhook con `webhook_secret`
- **Multiples formatos de payload** -- soporta tanto formato legacy/personalizado como formato Activity Streams 2.0 (webhooks de bot de Nextcloud Talk)
- **Auto-alojado** -- funciona con cualquier instancia de Nextcloud, manteniendo todos los datos en tu infraestructura

## Limitaciones

- Requiere un endpoint HTTPS accesible publicamente para entrega de webhooks (o un proxy inverso)
- La API de bot de Nextcloud Talk esta disponible desde Nextcloud 27+; versiones anteriores requieren configuracion de webhook personalizada
- El bot debe estar registrado en la sala de Talk para recibir mensajes
- El manejo de adjuntos de archivos y medios no esta soportado actualmente
- Los payloads de webhook que usan marcas de tiempo en milisegundos se normalizan automaticamente a segundos

## Solucion de problemas

### Los eventos de webhook no se reciben
- Verifica que la URL del webhook es accesible publicamente y apunta a `https://your-domain/nextcloud-talk`
- Asegurate de que el bot esta registrado en la sala de Talk
- Revisa los logs del servidor de Nextcloud para errores de entrega de webhook

### La verificacion de firma falla
- Asegurate de que `webhook_secret` coincide con el secreto usado al registrar el bot
- El secreto se puede establecer via configuracion o la variable de entorno `ZEROCLAW_NEXTCLOUD_TALK_WEBHOOK_SECRET`

### Las respuestas no se publican
- Verifica que `base_url` es correcta y accesible desde el servidor PRX
- Comprueba que el `app_token` tiene permiso para publicar mensajes en la sala
- Revisa la respuesta de la API OCS para errores de autenticacion o permisos
