---
title: WhatsApp (Cloud API)
description: Conectar PRX a WhatsApp a traves de la Business Cloud API
---

# WhatsApp (Cloud API)

> Conecta PRX a WhatsApp usando la Meta Business Cloud API para mensajeria basada en webhooks con la plataforma WhatsApp Business.

## Requisitos previos

- Una [cuenta de Meta Business](https://business.facebook.com/)
- Una aplicacion de WhatsApp Business API configurada en el [Meta Developer Portal](https://developers.facebook.com/)
- Un ID de numero de telefono y token de acceso de la WhatsApp Business API
- Un endpoint HTTPS accesible publicamente para webhooks

## Configuracion rapida

### 1. Configurar la WhatsApp Business API

1. Ve al [Meta Developer Portal](https://developers.facebook.com/) y crea una aplicacion
2. Agrega el producto "WhatsApp" a tu aplicacion
3. Bajo "WhatsApp > API Setup", anota tu **Phone Number ID** y genera un **Permanent Access Token**

### 2. Configurar PRX

```toml
[channels_config.whatsapp]
access_token = "EAAxxxxxxxxxxxxxxxxxxxxxxxx"
phone_number_id = "123456789012345"
verify_token = "my-secret-verify-token"
allowed_numbers = ["+1234567890"]
```

### 3. Configurar webhooks

1. En el Meta Developer Portal, ve a "WhatsApp > Configuration"
2. Establece la URL del webhook a `https://your-domain.com/whatsapp`
3. Ingresa el mismo `verify_token` que configuraste en PRX
4. Suscribete al campo de webhook `messages`

### 4. Verificar

```bash
prx channel doctor whatsapp
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `access_token` | `String` | *requerido* | Token de acceso permanente de la Meta Business API |
| `phone_number_id` | `String` | *requerido* | ID del numero de telefono de la Meta Business API. La presencia de este campo selecciona el modo Cloud API |
| `verify_token` | `String` | *requerido* | Secreto compartido para el handshake de verificacion de webhook |
| `app_secret` | `String` | `null` | Secreto de aplicacion para verificacion de firma de webhook (HMAC-SHA256). Tambien se puede establecer via la variable de entorno `ZEROCLAW_WHATSAPP_APP_SECRET` |
| `allowed_numbers` | `[String]` | `[]` | Numeros de telefono permitidos en formato E.164 (ej., `"+1234567890"`). `"*"` = permitir todos |

## Caracteristicas

- **Mensajeria basada en webhooks** -- recibe mensajes via notificaciones push de webhook de Meta
- **Filtrado de numeros de telefono E.164** -- restringe el acceso a numeros de telefono especificos
- **Aplicacion de HTTPS** -- rechaza transmitir datos por URLs no HTTPS
- **Verificacion de firma de webhook** -- validacion opcional HMAC-SHA256 con `app_secret`
- **Mensajes de texto y multimedia** -- maneja texto entrante, imagenes y otros tipos de medios

## Limitaciones

- Requiere un endpoint HTTPS accesible publicamente para la entrega de webhooks
- La Cloud API de Meta tiene limites de velocidad basados en tu nivel de negocio
- Ventana de mensajeria de 24 horas: solo puedes responder dentro de las 24 horas del ultimo mensaje del usuario (a menos que uses plantillas de mensaje)
- Los numeros de telefono deben estar en formato E.164 para la lista de permitidos

## Solucion de problemas

### La verificacion de webhook falla
- Asegurate de que `verify_token` en la configuracion de PRX coincide exactamente con lo que ingresaste en el Meta Developer Portal
- El endpoint de webhook debe responder a solicitudes GET con el parametro `hub.challenge`

### No se reciben mensajes
- Verifica que la suscripcion de webhook incluye el campo `messages`
- Verifica que la URL del webhook es accesible publicamente por HTTPS
- Revisa los logs de entrega de webhook en el Meta Developer Portal

### Error "Refusing to transmit over non-HTTPS"
- Toda la comunicacion con la WhatsApp Cloud API requiere HTTPS
- Asegurate de que tu gateway PRX esta detras de un proxy con terminacion TLS (ej., Caddy, Nginx con SSL)

::: tip Modo WhatsApp Web
Para un cliente nativo de WhatsApp Web que no requiere configuracion de Meta Business API, consulta [WhatsApp Web](./whatsapp-web).
:::
