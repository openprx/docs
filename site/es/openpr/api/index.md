---
title: Descripción General de la API REST
description: "OpenPR expone una API REST completa para gestionar espacios de trabajo, proyectos, incidencias, gobernanza y más. Construida con Rust y Axum."
---

# Descripción General de la API REST

OpenPR proporciona una API RESTful construida con **Rust** y **Axum** para el acceso programático a todas las funciones de la plataforma. La API soporta formatos JSON de solicitud/respuesta y autenticación basada en JWT.

## URL Base

```
http://localhost:8080/api
```

En despliegues de producción detrás de un proxy inverso (Caddy/Nginx), la API generalmente se proxea a través de la URL del frontend.

## Formato de Respuesta

Todas las respuestas de la API siguen una estructura JSON consistente:

### Éxito

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### Error

```json
{
  "code": 400,
  "message": "Detailed error description"
}
```

Códigos de error comunes:

| Código | Significado |
|--------|------------|
| 400 | Solicitud incorrecta (error de validación) |
| 401 | No autorizado (token faltante o inválido) |
| 403 | Prohibido (permisos insuficientes) |
| 404 | No encontrado |
| 500 | Error interno del servidor |

## Categorías de API

| Categoría | Ruta Base | Descripción |
|-----------|-----------|-------------|
| [Autenticación](./authentication) | `/api/auth/*` | Registro, inicio de sesión, renovación de token |
| Proyectos | `/api/workspaces/*/projects/*` | CRUD, miembros, configuración |
| Incidencias | `/api/projects/*/issues/*` | CRUD, asignar, etiquetar, comentar |
| Tablero | `/api/projects/*/board` | Estado del tablero kanban |
| Sprints | `/api/projects/*/sprints/*` | CRUD y planificación de sprints |
| Etiquetas | `/api/labels/*` | CRUD de etiquetas |
| Búsqueda | `/api/search` | Búsqueda de texto completo |
| Propuestas | `/api/proposals/*` | Crear, votar, enviar, archivar |
| Gobernanza | `/api/governance/*` | Configuración, registros de auditoría |
| Decisiones | `/api/decisions/*` | Registros de decisiones |
| Puntuaciones de Confianza | `/api/trust-scores/*` | Puntuaciones, historial, apelaciones |
| Veto | `/api/veto/*` | Veto, escalación |
| Agentes de IA | `/api/projects/*/ai-agents/*` | Gestión de agentes |
| Tareas de IA | `/api/projects/*/ai-tasks/*` | Asignación de tareas |
| Tokens de Bot | `/api/workspaces/*/bots` | CRUD de tokens de bot |
| Subida de Archivos | `/api/v1/upload` | Subida de archivos multiparte |
| Webhooks | `/api/workspaces/*/webhooks/*` | CRUD de webhooks |
| Admin | `/api/admin/*` | Gestión del sistema |

Ver [Referencia de Endpoints](./endpoints) para la referencia completa de la API.

## Tipo de Contenido

Todas las solicitudes POST/PUT/PATCH deben usar `Content-Type: application/json`, excepto las subidas de archivos que usan `multipart/form-data`.

## Paginación

Los endpoints de lista soportan paginación:

```bash
curl "http://localhost:8080/api/projects/<id>/issues?page=1&per_page=20" \
  -H "Authorization: Bearer <token>"
```

## Búsqueda de Texto Completo

El endpoint de búsqueda usa la búsqueda de texto completo de PostgreSQL en incidencias, comentarios y propuestas:

```bash
curl "http://localhost:8080/api/search?q=authentication+bug" \
  -H "Authorization: Bearer <token>"
```

## Verificación de Estado

El servidor de API expone un endpoint de estado que no requiere autenticación:

```bash
curl http://localhost:8080/health
```

## Próximos Pasos

- [Autenticación](./authentication) -- Autenticación JWT y tokens de bot
- [Referencia de Endpoints](./endpoints) -- Documentación completa de endpoints
- [Servidor MCP](../mcp-server/) -- Interfaz amigable para IA con 34 herramientas
