---
title: Email
description: Conectar PRX a email a traves de IMAP y SMTP
---

# Email

> Conecta PRX a cualquier proveedor de email usando IMAP para recibir y SMTP para enviar, con soporte push IDLE para entrega en tiempo real.

## Requisitos previos

- Una cuenta de email con acceso IMAP y SMTP habilitado
- Nombres de host y puertos de los servidores IMAP/SMTP
- Credenciales de email (usuario y contrasena o contrasena especifica de aplicacion)

## Configuracion rapida

### 1. Habilitar acceso IMAP

Para la mayoria de proveedores de email:
- **Gmail**: Habilita IMAP en Configuracion de Gmail > Reenvio y POP/IMAP, luego genera una [Contrasena de aplicacion](https://myaccount.google.com/apppasswords)
- **Outlook**: IMAP esta habilitado por defecto; usa una contrasena de aplicacion si 2FA esta activo
- **Auto-alojado**: Asegurate de que tu servidor de correo tiene IMAP habilitado

### 2. Configurar

```toml
[channels_config.email]
imap_host = "imap.gmail.com"
imap_port = 993
smtp_host = "smtp.gmail.com"
smtp_port = 465
username = "your-bot@gmail.com"
password = "your-app-password"
from_address = "your-bot@gmail.com"
allowed_senders = ["trusted-user@example.com"]
```

### 3. Verificar

```bash
prx channel doctor email
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `imap_host` | `String` | *requerido* | Nombre de host del servidor IMAP (ej., `"imap.gmail.com"`) |
| `imap_port` | `u16` | `993` | Puerto del servidor IMAP (993 para TLS) |
| `imap_folder` | `String` | `"INBOX"` | Carpeta IMAP para verificar nuevos mensajes |
| `smtp_host` | `String` | *requerido* | Nombre de host del servidor SMTP (ej., `"smtp.gmail.com"`) |
| `smtp_port` | `u16` | `465` | Puerto del servidor SMTP (465 para TLS implicito, 587 para STARTTLS) |
| `smtp_tls` | `bool` | `true` | Usar TLS para conexiones SMTP |
| `username` | `String` | *requerido* | Usuario de email para autenticacion IMAP/SMTP |
| `password` | `String` | *requerido* | Contrasena de email o contrasena especifica de aplicacion |
| `from_address` | `String` | *requerido* | Direccion de remitente para emails salientes |
| `idle_timeout_secs` | `u64` | `1740` | Timeout de IDLE en segundos antes de reconectar (por defecto: 29 minutos segun RFC 2177) |
| `allowed_senders` | `[String]` | `[]` | Direcciones o dominios de remitentes permitidos. Vacio = denegar todos. `"*"` = permitir todos |
| `default_subject` | `String` | `"PRX Message"` | Linea de asunto por defecto para emails salientes |

## Caracteristicas

- **IMAP IDLE** -- notificaciones push en tiempo real para nuevos emails (RFC 2177), sin retardo de polling
- **Cifrado TLS** -- las conexiones a servidores IMAP y SMTP estan cifradas via TLS
- **Analisis MIME** -- maneja emails multipart, extrae contenido de texto y adjuntos
- **Filtrado a nivel de dominio** -- permite dominios completos (ej., `"@company.com"`) en la lista de remitentes permitidos
- **Reconexion automatica** -- re-establece la conexion IDLE despues del timeout de 29 minutos
- **Hilos de respuesta** -- responde al hilo de email original con cabeceras `In-Reply-To` apropiadas

## Limitaciones

- Solo procesa emails en la carpeta IMAP configurada (por defecto: INBOX)
- Los emails HTML se procesan como texto plano (las etiquetas HTML se eliminan)
- Los adjuntos grandes pueden no procesarse completamente dependiendo de las restricciones de memoria
- Algunos proveedores de email requieren contrasenas especificas de aplicacion cuando 2FA esta habilitado
- El soporte IDLE depende del servidor IMAP; la mayoria de servidores modernos lo soportan

## Solucion de problemas

### No se puede conectar al servidor IMAP
- Verifica que `imap_host` y `imap_port` son correctos para tu proveedor
- Asegurate de que el acceso IMAP esta habilitado en la configuracion de tu cuenta de email
- Si usas Gmail, genera una contrasena de aplicacion (las contrasenas regulares estan bloqueadas con 2FA)
- Verifica que TLS no esta siendo bloqueado por un firewall

### Los emails no se detectan
- Verifica que `imap_folder` es correcto (por defecto: `"INBOX"`)
- Comprueba que la direccion o dominio del remitente esta en `allowed_senders`
- Algunos proveedores pueden tener un retardo antes de que los emails aparezcan en IMAP

### Las respuestas no se envian
- Verifica los ajustes de `smtp_host`, `smtp_port` y `smtp_tls` para tu proveedor
- Comprueba las credenciales de autenticacion SMTP (mismo `username`/`password` que IMAP, o credenciales SMTP separadas)
- Revisa los logs del servidor para razones de rechazo SMTP (ej., fallos SPF/DKIM)
