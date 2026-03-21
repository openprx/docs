---
title: Protocolo de comunicacion entre nodos
description: Especificacion tecnica del protocolo de comunicacion nodo a nodo de PRX.
---

# Protocolo de comunicacion entre nodos

Los nodos PRX se comunican usando un protocolo cifrado y autenticado sobre TCP. Esta pagina describe el formato de trama y los tipos de mensaje.

## Transporte

- **Protocolo**: TCP con TLS 1.3 (autenticacion mutua via claves emparejadas)
- **Serializacion**: Tramas MessagePack con prefijo de longitud
- **Compresion**: Compresion de trama LZ4 opcional

## Tipos de mensaje

| Tipo | Direccion | Descripcion |
|------|-----------|-------------|
| `TaskRequest` | Controlador -> Nodo | Asignar una tarea al nodo |
| `TaskResult` | Nodo -> Controlador | Devolver resultado de ejecucion de tarea |
| `StatusQuery` | Controlador -> Nodo | Solicitar estado del nodo |
| `StatusReport` | Nodo -> Controlador | Informar salud y capacidad del nodo |
| `Heartbeat` | Bidireccional | Mantenimiento de conexion y medicion de latencia |
| `Cancel` | Controlador -> Nodo | Cancelar una tarea en ejecucion |

## Configuracion

```toml
[node.protocol]
tls_version = "1.3"
compression = "lz4"  # "lz4" | "none"
max_frame_size_kb = 4096
heartbeat_interval_secs = 15
connection_timeout_secs = 10
```

## Ciclo de vida de la conexion

1. **Conectar** -- se establece la conexion TCP
2. **Handshake TLS** -- autenticacion mutua con claves emparejadas
3. **Negociacion de protocolo** -- acordar version y compresion
4. **Activo** -- intercambiar mensajes
5. **Cierre elegante** -- enviar mensaje de desconexion y cerrar

## Paginas relacionadas

- [Vision general de nodos](./)
- [Emparejamiento de nodos](./pairing)
