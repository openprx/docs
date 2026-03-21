---
title: Funciones del host
description: Referencia de funciones del host disponibles para plugins WASM de PRX.
---

# Funciones del host

Las funciones del host son la superficie de API expuesta por PRX a los plugins WASM. Proporcionan acceso controlado a capacidades del host como solicitudes HTTP, operaciones de archivos y estado del agente.

## Funciones del host disponibles

### HTTP

| Funcion | Descripcion | Permiso |
|---------|-------------|---------|
| `http_request(method, url, headers, body)` | Realizar una solicitud HTTP | `net.http` |
| `http_get(url)` | Atajo para solicitud GET | `net.http` |
| `http_post(url, body)` | Atajo para solicitud POST | `net.http` |

### Sistema de archivos

| Funcion | Descripcion | Permiso |
|---------|-------------|---------|
| `fs_read(path)` | Leer un archivo | `fs.read` |
| `fs_write(path, data)` | Escribir un archivo | `fs.write` |
| `fs_list(path)` | Listar contenido del directorio | `fs.read` |

### Estado del agente

| Funcion | Descripcion | Permiso |
|---------|-------------|---------|
| `memory_get(key)` | Leer de la memoria del agente | `agent.memory.read` |
| `memory_set(key, value)` | Escribir en la memoria del agente | `agent.memory.write` |
| `config_get(key)` | Leer configuracion del plugin | `agent.config` |

### Registro

| Funcion | Descripcion | Permiso |
|---------|-------------|---------|
| `log_info(msg)` | Registrar a nivel info | Siempre permitido |
| `log_warn(msg)` | Registrar a nivel warn | Siempre permitido |
| `log_error(msg)` | Registrar a nivel error | Siempre permitido |

## Manifiesto de permisos

Cada plugin declara los permisos requeridos en su manifiesto:

```toml
[permissions]
net.http = ["api.example.com"]
fs.read = ["/data/*"]
agent.memory.read = true
```

## Paginas relacionadas

- [Arquitectura de plugins](./architecture)
- [Referencia del PDK](./pdk)
- [Sandbox de seguridad](/es/prx/security/sandbox)
