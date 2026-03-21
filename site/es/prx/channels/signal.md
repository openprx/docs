---
title: Signal
description: Conectar PRX a Signal a traves de signal-cli
---

# Signal

> Conecta PRX a Signal usando la API JSON-RPC y SSE del demonio signal-cli para mensajeria cifrada en DMs y grupos.

## Requisitos previos

- Un numero de telefono registrado en Signal
- [signal-cli](https://github.com/AsamK/signal-cli) instalado y registrado
- signal-cli ejecutandose en modo demonio con la API HTTP habilitada

## Configuracion rapida

### 1. Instalar y registrar signal-cli

```bash
# Instalar signal-cli (ver https://github.com/AsamK/signal-cli para la ultima version)
# Registrar tu numero de telefono
signal-cli -u +1234567890 register
signal-cli -u +1234567890 verify <verification-code>
```

### 2. Iniciar el demonio signal-cli

```bash
signal-cli -u +1234567890 daemon --http localhost:8686
```

### 3. Configurar

```toml
[channels_config.signal]
http_url = "http://127.0.0.1:8686"
account = "+1234567890"
allowed_from = ["+1987654321", "*"]
```

### 4. Verificar

```bash
prx channel doctor signal
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `http_url` | `String` | *requerido* | URL base del demonio HTTP signal-cli (ej., `"http://127.0.0.1:8686"`) |
| `account` | `String` | *requerido* | Numero de telefono E.164 de la cuenta signal-cli (ej., `"+1234567890"`) |
| `group_id` | `String` | `null` | Filtrar mensajes por grupo. `null` = aceptar todos (DMs y grupos). `"dm"` = solo aceptar DMs. ID de grupo especifico = solo ese grupo |
| `allowed_from` | `[String]` | `[]` | Numeros de telefono de remitentes permitidos en formato E.164. `"*"` = permitir todos |
| `ignore_attachments` | `bool` | `false` | Omitir mensajes que son solo adjuntos (sin cuerpo de texto) |
| `ignore_stories` | `bool` | `false` | Omitir mensajes de historias entrantes |

## Caracteristicas

- **Cifrado de extremo a extremo** -- todos los mensajes estan cifrados via el Protocolo Signal
- **Soporte de DM y grupos** -- maneja tanto mensajes directos como conversaciones grupales
- **Flujo de eventos SSE** -- escucha via Server-Sent Events en `/api/v1/events` para entrega en tiempo real
- **Envio JSON-RPC** -- envia respuestas via JSON-RPC en `/api/v1/rpc`
- **Filtrado flexible de grupos** -- acepta todos los mensajes, solo DMs o un grupo especifico
- **Manejo de adjuntos** -- procesa u omite opcionalmente mensajes que son solo adjuntos

## Limitaciones

- Requiere que signal-cli se ejecute como un proceso demonio separado
- signal-cli debe estar registrado y verificado con un numero de telefono valido
- Una instancia de signal-cli soporta un numero de telefono
- El envio de mensajes de grupo requiere que la cuenta signal-cli sea miembro del grupo
- signal-cli es una aplicacion Java con sus propios requisitos de recursos

## Solucion de problemas

### No se puede conectar a signal-cli
- Verifica que el demonio signal-cli esta ejecutandose: `curl http://127.0.0.1:8686/api/v1/about`
- Comprueba que `http_url` coincide con la direccion y puerto de enlace del demonio
- Asegurate de que no hay reglas de firewall bloqueando la conexion

### Los mensajes de grupos se ignoran
- Verifica el filtro `group_id` -- si esta establecido en `"dm"`, los mensajes de grupo se excluyen
- Si esta establecido en un ID de grupo especifico, solo se aceptan mensajes de ese grupo
- Establece `group_id` en `null` (u omitelo) para aceptar todos los mensajes

### Los mensajes de solo adjuntos se omiten
- Este es el comportamiento esperado cuando `ignore_attachments = true`
- Establece `ignore_attachments = false` para procesar mensajes de solo adjuntos
