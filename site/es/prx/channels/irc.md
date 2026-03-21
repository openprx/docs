---
title: IRC
description: Conectar PRX a IRC a traves de TLS
---

# IRC

> Conecta PRX a servidores de Internet Relay Chat (IRC) a traves de TLS con soporte para canales, DMs y multiples metodos de autenticacion.

## Requisitos previos

- Un servidor IRC al que conectarse (ej., Libera.Chat, OFTC o un servidor privado)
- Un nickname para el bot
- Servidor IRC con TLS habilitado (el puerto 6697 es el estandar)

## Configuracion rapida

### 1. Elegir un servidor y registrar un nickname (opcional)

Para redes publicas como Libera.Chat, puede que quieras registrar el nickname de tu bot con NickServ:

```
/msg NickServ REGISTER <password> <email>
```

### 2. Configurar

```toml
[channels_config.irc]
server = "irc.libera.chat"
port = 6697
nickname = "prx-bot"
channels = ["#my-channel"]
allowed_users = ["mynick", "*"]
```

Con autenticacion NickServ:

```toml
[channels_config.irc]
server = "irc.libera.chat"
port = 6697
nickname = "prx-bot"
channels = ["#my-channel", "#another-channel"]
allowed_users = ["*"]
nickserv_password = "your-nickserv-password"
```

### 3. Verificar

```bash
prx channel doctor irc
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `server` | `String` | *requerido* | Nombre de host del servidor IRC (ej., `"irc.libera.chat"`) |
| `port` | `u16` | `6697` | Puerto del servidor IRC (6697 para TLS) |
| `nickname` | `String` | *requerido* | Nickname del bot en la red IRC |
| `username` | `String` | *nickname* | Nombre de usuario IRC (por defecto el nickname si no esta establecido) |
| `channels` | `[String]` | `[]` | Canales IRC a unirse al conectar (ej., `["#channel1", "#channel2"]`) |
| `allowed_users` | `[String]` | `[]` | Nicknames permitidos (insensible a mayusculas). Vacio = denegar todos. `"*"` = permitir todos |
| `server_password` | `String` | `null` | Contrasena del servidor (para bouncers como ZNC) |
| `nickserv_password` | `String` | `null` | Contrasena IDENTIFY de NickServ para autenticacion de nickname |
| `sasl_password` | `String` | `null` | Contrasena SASL PLAIN para autenticacion IRCv3 |
| `verify_tls` | `bool` | `true` | Verificar el certificado TLS del servidor |

## Caracteristicas

- **Cifrado TLS** -- todas las conexiones usan TLS para seguridad
- **Multiples metodos de autenticacion** -- soporta contrasena de servidor, IDENTIFY de NickServ y SASL PLAIN (IRCv3)
- **Soporte multi-canal** -- unirse y responder en multiples canales simultaneamente
- **Soporte de canal y DM** -- maneja tanto PRIVMSG de canal como mensajes directos
- **Salida de texto plano** -- las respuestas se adaptan automaticamente para IRC (sin markdown, sin bloques de codigo)
- **Division inteligente de mensajes** -- los mensajes largos se dividen respetando los limites de longitud de linea de IRC
- **Keepalive de conexion** -- responde a mensajes PING del servidor y detecta conexiones muertas (timeout de lectura de 5 minutos)
- **IDs de mensaje monotonicos** -- asegura ordenamiento unico de mensajes bajo trafico en rafagas

## Limitaciones

- IRC es solo texto plano; markdown, HTML y formato enriquecido no estan soportados
- Los mensajes estan sujetos a limites de longitud de linea de IRC (tipicamente 512 bytes incluyendo overhead del protocolo)
- Sin capacidad integrada de compartir medios o archivos
- La conexion puede caer si el servidor no recibe respuesta al PING dentro del timeout
- Algunas redes IRC tienen medidas anti-flood que pueden limitar la velocidad del bot
- Los cambios de nick y la reconexion despues de divisiones de red se manejan pero pueden causar breves interrupciones

## Solucion de problemas

### No se puede conectar al servidor IRC
- Verifica que el nombre de host del `server` y el `port` son correctos
- Asegurate de que el puerto 6697 (TLS) no esta bloqueado por un firewall
- Si usas un certificado auto-firmado, establece `verify_tls = false`

### El bot se une a canales pero no responde
- Verifica que el nickname del remitente esta en `allowed_users` (coincidencia insensible a mayusculas)
- Establece `allowed_users = ["*"]` para permitir todos los usuarios durante pruebas
- Verifica que el bot tiene permiso para hablar en el canal (no silenciado ni baneado)

### La autenticacion NickServ falla
- Asegurate de que `nickserv_password` es correcta
- El nickname del bot debe estar registrado con NickServ antes de poder identificarse
- Algunas redes requieren autenticacion SASL en lugar de NickServ; usa `sasl_password` en ese caso
