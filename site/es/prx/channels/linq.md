---
title: LINQ
description: Conectar PRX a iMessage, RCS y SMS a traves de la API Linq Partner
---

# LINQ

> Conecta PRX a iMessage, RCS y SMS a traves de la API Linq Partner V3 para mensajeria movil multi-protocolo.

## Requisitos previos

- Una cuenta [Linq](https://linqapp.com) Partner con acceso API
- Un token API de Linq
- Un numero de telefono provisionado a traves de Linq para enviar mensajes

## Configuracion rapida

### 1. Obtener credenciales API

1. Registrate para una cuenta Linq Partner en [linqapp.com](https://linqapp.com)
2. Obtén tu **Token API** del panel de socios
3. Anota el **numero de telefono** asignado a tu cuenta para envio

### 2. Configurar

```toml
[channels_config.linq]
api_token = "your-linq-api-token"
from_phone = "+15551234567"
allowed_senders = ["+1987654321"]
```

### 3. Configurar webhooks

Configura Linq para enviar eventos de webhook al endpoint de gateway de PRX:

```
POST https://your-prx-domain.com/linq
```

### 4. Verificar

```bash
prx channel doctor linq
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `api_token` | `String` | *requerido* | Token API de Linq Partner (usado como Bearer auth) |
| `from_phone` | `String` | *requerido* | Numero de telefono de envio (formato E.164, ej., `"+15551234567"`) |
| `signing_secret` | `String` | `null` | Secreto de firma de webhook para verificacion de firma HMAC |
| `allowed_senders` | `[String]` | `[]` | Numeros de telefono de remitentes permitidos en formato E.164. `"*"` = permitir todos |

## Caracteristicas

- **Mensajeria multi-protocolo** -- enviar y recibir via iMessage, RCS y SMS a traves de una unica integracion
- **Entrega basada en webhooks** -- recibe mensajes via push HTTP webhook de Linq
- **Soporte de imagenes** -- procesa adjuntos de imagenes entrantes y los renderiza como marcadores de imagen
- **Deteccion saliente/entrante** -- filtra automaticamente tus propios mensajes salientes
- **Verificacion de firma** -- validacion opcional de firma HMAC de webhook con `signing_secret`
- **Filtrado de numeros de telefono E.164** -- restringe el acceso a numeros de telefono de remitentes especificos

## Limitaciones

- Requiere un endpoint HTTPS accesible publicamente para entrega de webhooks
- El acceso a la API Linq Partner requiere una cuenta de socio (no una cuenta de consumidor)
- La entrega de mensajes depende del protocolo de mensajeria del destinatario (iMessage, RCS o fallback a SMS)
- Solo los tipos MIME de imagen se procesan para adjuntos en linea; otros tipos de medios se omiten
- Los limites de velocidad de la API dependen de tu nivel de Linq Partner

## Solucion de problemas

### Los eventos de webhook no se reciben
- Verifica que la URL del webhook es accesible publicamente y apunta a `https://your-domain/linq`
- Revisa el panel de socios de Linq para logs de entrega de webhook y errores
- Asegurate de que el gateway de PRX esta ejecutandose y escuchando en el puerto correcto

### Los mensajes se envian pero las respuestas fallan
- Verifica que el `api_token` es valido y no ha expirado
- Comprueba que `from_phone` es un numero de telefono valido y provisionado en tu cuenta Linq
- Revisa la respuesta de la API Linq para detalles del error

### El bot responde a sus propios mensajes
- Esto no deberia ocurrir; PRX filtra automaticamente los mensajes salientes usando los campos `is_from_me` y `direction`
- Si ocurre, verifica que el formato del payload del webhook coincide con la estructura esperada de Linq V3
