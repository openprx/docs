---
title: WhatsApp Web
description: Conectar PRX a WhatsApp a traves del cliente Web nativo (wa-rs)
---

# WhatsApp Web

> Conecta PRX a WhatsApp usando un cliente Web nativo en Rust (wa-rs) con cifrado de extremo a extremo, vinculacion por codigo QR o codigo de emparejamiento, y soporte completo de medios.

## Requisitos previos

- Una cuenta de WhatsApp con un numero de telefono activo
- PRX compilado con el feature flag `whatsapp-web`
- No se requiere cuenta de Meta Business API

## Configuracion rapida

### 1. Habilitar el feature flag

Compila PRX con soporte de WhatsApp Web:

```bash
cargo build --release --features whatsapp-web
```

### 2. Configurar

```toml
[channels_config.whatsapp]
session_path = "~/.config/openprx/whatsapp-session.db"
allowed_numbers = ["+1234567890", "*"]
```

Para vinculacion por codigo de emparejamiento (en lugar de codigo QR):

```toml
[channels_config.whatsapp]
session_path = "~/.config/openprx/whatsapp-session.db"
pair_phone = "15551234567"
allowed_numbers = ["*"]
```

### 3. Vincular tu cuenta

Inicia PRX. En la primera ejecucion, mostrara:
- Un **codigo QR** en la terminal para escanear con tu aplicacion movil de WhatsApp, o
- Un **codigo de emparejamiento** si `pair_phone` esta establecido (ingresa el codigo en WhatsApp > Dispositivos vinculados)

### 4. Verificar

```bash
prx channel doctor whatsapp
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `session_path` | `String` | *requerido* | Ruta a la base de datos SQLite de sesion. La presencia de este campo selecciona el modo Web |
| `pair_phone` | `String` | `null` | Numero de telefono para vinculacion por codigo de emparejamiento (formato: codigo de pais + numero, ej., `"15551234567"`). Si no esta establecido, se usa emparejamiento por codigo QR |
| `pair_code` | `String` | `null` | Codigo de emparejamiento personalizado para vinculacion. Dejar vacio para que WhatsApp genere uno |
| `allowed_numbers` | `[String]` | `[]` | Numeros de telefono permitidos en formato E.164 (ej., `"+1234567890"`). `"*"` = permitir todos |

## Caracteristicas

- **No requiere Meta Business API** -- se conecta directamente como dispositivo vinculado usando el protocolo WhatsApp Web
- **Cifrado de extremo a extremo** -- los mensajes se cifran via Signal Protocol, igual que los clientes oficiales de WhatsApp
- **Vinculacion por codigo QR y codigo de emparejamiento** -- dos formas de vincular tu cuenta de WhatsApp
- **Sesiones persistentes** -- el estado de sesion se almacena en una base de datos SQLite local, sobrevive a reinicios
- **Grupos y DMs** -- soporta tanto chats privados como conversaciones grupales
- **Mensajes multimedia** -- maneja imagenes, documentos y otros tipos de medios
- **Soporte de notas de voz** -- transcribe notas de voz entrantes (cuando STT esta configurado) y opcionalmente responde con notas de voz (cuando TTS esta configurado)
- **Presencia y reacciones** -- soporta indicadores de escritura y reacciones a mensajes

## Limitaciones

- Requiere el feature flag `whatsapp-web` en tiempo de compilacion
- Solo se soporta una sesion de dispositivo vinculado por numero de telefono (limitacion de WhatsApp)
- La sesion puede expirar si no se usa durante un periodo prolongado; se requiere re-vinculacion
- Solo macOS, Linux y Windows WSL2 (igual que PRX en si)
- WhatsApp puede requerir re-autenticacion ocasionalmente

## Solucion de problemas

### El codigo QR no aparece
- Asegurate de que `session_path` esta establecido y el directorio es escribible
- Verifica que PRX fue compilado con `--features whatsapp-web`
- Elimina la base de datos de sesion y reinicia para forzar un nuevo emparejamiento

### Sesion expirada o desconectada
- Elimina la base de datos de sesion en la `session_path` configurada
- Reinicia PRX para activar un nuevo flujo de codigo QR o codigo de emparejamiento

### Las notas de voz no se transcriben
- Configura la seccion `[transcription]` en tu configuracion de PRX para habilitar STT
- Backends STT soportados: OpenAI Whisper, Deepgram, AssemblyAI, Google STT

::: tip Modo Cloud API
Si tienes una cuenta de Meta Business y prefieres mensajeria basada en webhooks, consulta [WhatsApp (Cloud API)](./whatsapp).
:::
