---
title: iMessage
description: Conectar PRX a iMessage en macOS
---

# iMessage

> Conecta PRX a iMessage usando la base de datos de Messages de macOS y el puente AppleScript para integracion nativa con iMessage.

## Requisitos previos

- **Solo macOS** -- la integracion con iMessage requiere macOS (se recomienda Monterey 12.0 o posterior)
- Una cuenta de iMessage activa con sesion iniciada en la aplicacion Messages
- Acceso completo al disco otorgado al proceso PRX (para leer la base de datos de Messages)

## Configuracion rapida

### 1. Otorgar acceso completo al disco

1. Abre **Ajustes del Sistema > Privacidad y Seguridad > Acceso completo al disco**
2. Agrega la aplicacion de terminal o el binario PRX a la lista
3. Reinicia la terminal o el proceso PRX

### 2. Configurar

```toml
[channels_config.imessage]
allowed_contacts = ["+1234567890", "user@icloud.com"]
```

### 3. Verificar

```bash
prx channel doctor imessage
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `allowed_contacts` | `[String]` | *requerido* | Contactos de iMessage permitidos: numeros de telefono (E.164) o direcciones de correo electronico. Vacio = denegar todos |

## Caracteristicas

- **Integracion nativa con macOS** -- lee directamente de la base de datos SQLite de Messages
- **Puente AppleScript** -- envia respuestas via `osascript` para entrega confiable de mensajes
- **Contactos por telefono y email** -- filtra por numeros de telefono o direcciones de correo de Apple ID
- **Soporte de macOS moderno** -- maneja el formato typedstream `attributedBody` usado en macOS Ventura y posterior
- **Basado en polling** -- verifica periodicamente la base de datos de Messages en busca de nuevos mensajes

## Limitaciones

- **Solo macOS** -- no disponible en Linux o Windows
- Requiere acceso completo al disco para leer `~/Library/Messages/chat.db`
- La aplicacion Messages debe estar ejecutandose (o al menos con sesion iniciada)
- No puede iniciar conversaciones con nuevos contactos; el contacto debe tener una conversacion existente
- Los chats grupales de iMessage no estan soportados actualmente
- El intervalo de polling introduce una ligera latencia comparado con canales basados en push
- El envio basado en AppleScript puede no funcionar en entornos macOS sin interfaz grafica (solo SSH)

## Solucion de problemas

### "Permission denied" al leer la base de datos de Messages
- Asegurate de que el acceso completo al disco esta otorgado al proceso PRX o a su terminal padre
- En macOS Ventura+, verifica bajo **Ajustes del Sistema > Privacidad y Seguridad > Acceso completo al disco**
- Reinicia la terminal despues de otorgar permisos

### Los mensajes no se detectan
- Verifica que la aplicacion Messages tiene sesion iniciada con tu Apple ID
- Comprueba que el contacto esta en `allowed_contacts` (numero de telefono en formato E.164 o email)
- Los nuevos mensajes pueden tardar un ciclo de polling en ser detectados

### Las respuestas no se envian
- Asegurate de que la aplicacion Messages esta ejecutandose (no solo con sesion iniciada)
- El envio por AppleScript requiere acceso a la interfaz grafica; las sesiones solo por SSH pueden fallar
- Revisa Console.app de macOS para errores de AppleScript
