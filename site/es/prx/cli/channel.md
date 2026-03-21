---
title: prx channel
description: Gestionar conexiones de canales de mensajeria -- listar, agregar, eliminar, iniciar y diagnosticar canales.
---

# prx channel

Gestiona los canales de mensajeria a los que PRX se conecta. Los canales son los puentes entre las plataformas de mensajeria (Telegram, Discord, Slack, etc.) y el runtime del agente PRX.

## Uso

```bash
prx channel <SUBCOMANDO> [OPTIONS]
```

## Subcomandos

### `prx channel list`

Lista todos los canales configurados y su estado actual.

```bash
prx channel list [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--json` | `-j` | `false` | Salida en formato JSON |
| `--verbose` | `-v` | `false` | Mostrar informacion detallada de conexion |

**Ejemplo de salida:**

```
 Name         Type       Status      Uptime
 telegram-main  telegram   connected   3d 14h
 discord-dev    discord    connected   3d 14h
 slack-team     slack      error       --
 cli            cli        stopped     --
```

### `prx channel add`

Agrega una nueva configuracion de canal de forma interactiva o mediante opciones.

```bash
prx channel add [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--type` | `-t` | | Tipo de canal (ej., `telegram`, `discord`, `slack`) |
| `--name` | `-n` | auto-generado | Nombre para mostrar del canal |
| `--token` | | | Token del bot o clave API |
| `--enabled` | | `true` | Habilitar el canal inmediatamente |
| `--interactive` | `-i` | `true` | Usar el asistente interactivo |

```bash
# Modo interactivo (preguntas guiadas)
prx channel add

# No interactivo con opciones
prx channel add --type telegram --name my-bot --token "123456:ABC-DEF"
```

### `prx channel remove`

Elimina una configuracion de canal.

```bash
prx channel remove <NOMBRE> [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--force` | `-f` | `false` | Omitir confirmacion |

```bash
prx channel remove slack-team
prx channel remove slack-team --force
```

### `prx channel start`

Inicia (o reinicia) un canal especifico sin reiniciar el demonio.

```bash
prx channel start <NOMBRE>
```

```bash
# Reiniciar un canal con error
prx channel start slack-team
```

Este comando envia un mensaje de control al demonio en ejecucion. El demonio debe estar ejecutandose para que este comando funcione.

### `prx channel doctor`

Ejecuta diagnosticos en las conexiones de los canales. Verifica la validez del token, conectividad de red, URLs de webhook y permisos.

```bash
prx channel doctor [NOMBRE]
```

Si se omite `NOMBRE`, se verifican todos los canales.

```bash
# Verificar todos los canales
prx channel doctor

# Verificar un canal especifico
prx channel doctor telegram-main
```

**Ejemplo de salida:**

```
 telegram-main
   Token valid ...................... OK
   API reachable ................... OK
   Webhook URL configured ......... OK
   Bot permissions ................. OK (read, send, edit, delete)

 slack-team
   Token valid ...................... OK
   API reachable ................... FAIL (timeout after 5s)
   Suggestion: Check network connectivity or Slack API status
```

## Ejemplos

```bash
# Flujo completo: agregar, verificar, iniciar
prx channel add --type discord --name dev-server --token "MTIz..."
prx channel doctor dev-server
prx channel start dev-server

# Listar canales como JSON para scripting
prx channel list --json | jq '.[] | select(.status == "error")'
```

## Relacionado

- [Vision general de canales](/es/prx/channels/) -- documentacion detallada de canales
- [prx daemon](./daemon) -- el demonio que ejecuta las conexiones de canales
- [prx doctor](./doctor) -- diagnosticos completos del sistema incluyendo canales
