---
title: Matrix
description: Conectar PRX a Matrix con soporte de cifrado de extremo a extremo
---

# Matrix

> Conecta PRX a la red Matrix usando la API Client-Server con cifrado de extremo a extremo (E2EE) opcional y mensajeria basada en salas.

## Requisitos previos

- Un homeserver de Matrix (ej., [matrix.org](https://matrix.org), o Synapse/Dendrite auto-alojado)
- Una cuenta de bot en el homeserver con un token de acceso
- El ID de la sala donde el bot debe escuchar
- PRX compilado con el feature flag `channel-matrix`

## Configuracion rapida

### 1. Crear una cuenta de bot

Crea una cuenta en tu homeserver de Matrix para el bot. Puedes usar Element o la linea de comandos:

```bash
# Usando curl contra la API del homeserver
curl -X POST "https://matrix.org/_matrix/client/v3/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "prx-bot", "password": "secure-password", "auth": {"type": "m.login.dummy"}}'
```

### 2. Obtener un token de acceso

```bash
curl -X POST "https://matrix.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{"type": "m.login.password", "user": "prx-bot", "password": "secure-password"}'
```

### 3. Invitar al bot a una sala

Desde tu cliente de Matrix, invita la cuenta del bot a la sala donde debe operar. Anota el ID de la sala (formato: `!abc123:matrix.org`).

### 4. Configurar

```toml
[channels_config.matrix]
homeserver = "https://matrix.org"
access_token = "syt_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
room_id = "!abc123def456:matrix.org"
allowed_users = ["@alice:matrix.org", "@bob:matrix.org"]
```

### 5. Verificar

```bash
prx channel doctor matrix
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `homeserver` | `String` | *requerido* | URL del homeserver de Matrix (ej., `"https://matrix.org"`) |
| `access_token` | `String` | *requerido* | Token de acceso de Matrix para la cuenta del bot |
| `user_id` | `String` | `null` | ID de usuario de Matrix (ej., `"@bot:matrix.org"`). Usado para restauracion de sesion |
| `device_id` | `String` | `null` | ID de dispositivo de Matrix. Usado para continuidad de sesion E2EE |
| `room_id` | `String` | *requerido* | ID de la sala para escuchar (ej., `"!abc123:matrix.org"`) |
| `allowed_users` | `[String]` | `[]` | IDs de usuario de Matrix permitidos. Vacio = denegar todos. `"*"` = permitir todos |

## Caracteristicas

- **Cifrado de extremo a extremo** -- soporta salas cifradas usando matrix-sdk con Vodozemac
- **Mensajeria basada en salas** -- escucha y responde en una sala de Matrix especifica
- **Reacciones a mensajes** -- reacciona a mensajes para confirmar recepcion y finalizacion
- **Confirmaciones de lectura** -- envia confirmaciones de lectura para mensajes procesados
- **Persistencia de sesion** -- almacena sesiones criptograficas localmente para continuidad E2EE entre reinicios
- **Agnostico de homeserver** -- funciona con cualquier homeserver de Matrix (Synapse, Dendrite, Conduit, etc.)

## Limitaciones

- Actualmente escucha en una sola sala (establecida via `room_id`)
- Requiere el feature flag `channel-matrix` en tiempo de compilacion
- El respaldo de claves E2EE y la verificacion de firma cruzada aun no estan soportados
- Salas grandes con alto volumen de mensajes pueden aumentar el uso de recursos
- El bot debe ser invitado a la sala antes de poder escuchar

## Solucion de problemas

### El bot no responde en salas cifradas
- Asegurate de que `user_id` y `device_id` estan establecidos para la gestion adecuada de sesiones E2EE
- Elimina el almacen criptografico local y reinicia para re-establecer las sesiones de cifrado
- Verifica que la cuenta del bot ha sido verificada/confiada por los miembros de la sala

### Error "Room not found"
- Confirma que el formato del ID de la sala es correcto (prefijo `!`, sufijo `:homeserver`)
- Asegurate de que el bot ha sido invitado y se ha unido a la sala
- Los alias de sala (ej., `#room:matrix.org`) no estan soportados; usa el ID de la sala

### Token de acceso rechazado
- Los tokens de acceso pueden expirar; genera uno nuevo via la API de login
- Asegurate de que el token pertenece al homeserver correcto
