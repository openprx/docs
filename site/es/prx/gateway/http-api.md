---
title: API HTTP
description: Referencia de la API HTTP RESTful del gateway de PRX.
---

# API HTTP

El gateway de PRX expone una API HTTP RESTful para gestionar sesiones del agente, enviar mensajes y consultar el estado del sistema.

## URL base

Por defecto, la API esta disponible en `http://127.0.0.1:3120/api/v1`.

## Endpoints

### Sesiones

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `POST` | `/sessions` | Crear una nueva sesion de agente |
| `GET` | `/sessions` | Listar sesiones activas |
| `GET` | `/sessions/:id` | Obtener detalles de una sesion |
| `DELETE` | `/sessions/:id` | Terminar una sesion |

### Mensajes

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `POST` | `/sessions/:id/messages` | Enviar un mensaje al agente |
| `GET` | `/sessions/:id/messages` | Obtener historial de mensajes |

### Sistema

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/health` | Verificacion de salud |
| `GET` | `/info` | Informacion del sistema |
| `GET` | `/metrics` | Metricas de Prometheus |

## Autenticacion

Las solicitudes a la API requieren un token bearer:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3120/api/v1/sessions
```

## Paginas relacionadas

- [Vision general del gateway](./)
- [WebSocket](./websocket)
- [Middleware](./middleware)
