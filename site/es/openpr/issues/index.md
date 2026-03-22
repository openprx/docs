---
title: Incidencias y Seguimiento
description: Las incidencias de OpenPR son la unidad central de trabajo. Realiza el seguimiento de tareas, errores y funcionalidades con estados, prioridades, responsables, etiquetas y comentarios.
---

# Incidencias y Seguimiento

Las incidencias (también llamadas elementos de trabajo) son la unidad central de trabajo en OpenPR. Representan tareas, errores, funcionalidades o cualquier pieza de trabajo rastreable dentro de un proyecto.

## Campos de una Incidencia

| Campo | Tipo | Requerido | Descripción |
|-------|------|----------|-------------|
| Título | string | Sí | Descripción breve del trabajo |
| Descripción | markdown | No | Descripción detallada con formato |
| Estado | enum | Sí | Estado del flujo de trabajo (ver [Flujo de Trabajo](./workflow)) |
| Prioridad | enum | No | `low`, `medium`, `high`, `urgent` |
| Responsable | usuario | No | Miembro del equipo responsable de la incidencia |
| Etiquetas | lista | No | Etiquetas de categorización (ver [Etiquetas](./labels)) |
| Sprint | sprint | No | Ciclo de sprint al que pertenece la incidencia |
| Fecha de Entrega | datetime | No | Fecha de finalización objetivo |
| Adjuntos | archivos | No | Archivos adjuntos (imágenes, documentos, registros) |

## Identificadores de Incidencias

Cada incidencia tiene un identificador legible compuesto por la clave del proyecto y un número secuencial:

```
API-1, API-2, API-3, ...
FRONT-1, FRONT-2, ...
```

Puedes buscar cualquier incidencia por su identificador en todos los proyectos del espacio de trabajo.

## Crear Incidencias

### Mediante la Interfaz Web

1. Navega a tu proyecto.
2. Haz clic en **Nueva Incidencia**.
3. Completa el título, descripción y campos opcionales.
4. Haz clic en **Crear**.

### Mediante la API REST

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Implement user settings page",
    "description": "Add a settings page where users can update their profile.",
    "state": "todo",
    "priority": "medium",
    "assignee_id": "<user_uuid>"
  }'
```

### Mediante MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "work_items.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "title": "Implement user settings page",
      "state": "todo",
      "priority": "medium"
    }
  }
}
```

## Comentarios

Las incidencias soportan comentarios con formato markdown y archivos adjuntos:

```bash
# Add a comment
curl -X POST http://localhost:8080/api/issues/<issue_id>/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content": "Fixed in commit abc123. Ready for review."}'
```

Los comentarios también están disponibles a través de herramientas MCP: `comments.create`, `comments.list`, `comments.delete`.

## Feed de Actividad

Cada cambio en una incidencia se registra en el feed de actividad:

- Cambios de estado
- Cambios de responsable
- Adiciones/eliminaciones de etiquetas
- Comentarios
- Actualizaciones de prioridad

El feed de actividad proporciona un registro de auditoría completo para cada incidencia.

## Archivos Adjuntos

Las incidencias y comentarios soportan archivos adjuntos incluyendo imágenes, documentos, registros y archivos. Sube a través de la API:

```bash
curl -X POST http://localhost:8080/api/v1/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@screenshot.png"
```

O a través de MCP:

```json
{
  "method": "tools/call",
  "params": {
    "name": "files.upload",
    "arguments": {
      "filename": "screenshot.png",
      "content_base64": "<base64_encoded_content>"
    }
  }
}
```

Tipos de archivo soportados: imágenes (PNG, JPG, GIF, WebP), documentos (PDF, TXT), datos (JSON, CSV, XML), archivos comprimidos (ZIP, GZ) y registros.

## Búsqueda

OpenPR proporciona búsqueda de texto completo en todas las incidencias, comentarios y propuestas usando PostgreSQL FTS:

```bash
# Search via API
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/search?q=authentication+bug"

# Search via MCP
# work_items.search: search within a project
# search.all: global search across all projects
```

## Herramientas MCP

| Herramienta | Params | Descripción |
|-------------|--------|-------------|
| `work_items.list` | `project_id` | Listar incidencias en un proyecto |
| `work_items.get` | `work_item_id` | Obtener incidencia por UUID |
| `work_items.get_by_identifier` | `identifier` | Obtener por ID legible (p. ej., `API-42`) |
| `work_items.create` | `project_id`, `title` | Crear una incidencia |
| `work_items.update` | `work_item_id` | Actualizar cualquier campo |
| `work_items.delete` | `work_item_id` | Eliminar una incidencia |
| `work_items.search` | `query` | Búsqueda de texto completo |
| `comments.create` | `work_item_id`, `content` | Añadir un comentario |
| `comments.list` | `work_item_id` | Listar comentarios |
| `comments.delete` | `comment_id` | Eliminar un comentario |
| `files.upload` | `filename`, `content_base64` | Subir un archivo |

## Próximos Pasos

- [Estados del Flujo de Trabajo](./workflow) -- Entender el ciclo de vida de las incidencias
- [Planificación de Sprints](./sprints) -- Organizar incidencias en ciclos de sprint
- [Etiquetas](./labels) -- Categorizar incidencias con etiquetas
