---
title: Gestión de Proyectos
description: Los proyectos organizan incidencias, sprints y etiquetas dentro de un espacio de trabajo. Aprende cómo crear y gestionar proyectos en OpenPR.
---

# Gestión de Proyectos

Un **proyecto** vive dentro de un espacio de trabajo y sirve como contenedor para incidencias, sprints, etiquetas y propuestas de gobernanza. Cada proyecto tiene una **clave** única (p. ej., `API`, `FRONT`, `OPS`) que prefixa los identificadores de incidencias.

## Crear un Proyecto

Navega a tu espacio de trabajo y haz clic en **Nuevo Proyecto**:

| Campo | Requerido | Descripción | Ejemplo |
|-------|----------|-------------|---------|
| Nombre | Sí | Nombre para mostrar | "API Backend" |
| Clave | Sí | Prefijo de 2-5 caracteres para incidencias | "API" |
| Descripción | No | Resumen del proyecto | "API REST y lógica de negocio" |

La clave debe ser única dentro del espacio de trabajo y determina los identificadores de incidencias: `API-1`, `API-2`, etc.

## Panel del Proyecto

Cada proyecto proporciona:

- **Tablero** -- Vista kanban con columnas de arrastrar y soltar (Backlog, Por Hacer, En Progreso, Hecho).
- **Incidencias** -- Vista de lista con filtrado, ordenación y búsqueda de texto completo.
- **Sprints** -- Planificación de sprints y gestión de ciclos. Ver [Sprints](../issues/sprints).
- **Etiquetas** -- Etiquetas con ámbito de proyecto para categorización. Ver [Etiquetas](../issues/labels).
- **Configuración** -- Nombre, clave, descripción y configuración de miembros del proyecto.

## Conteo de Incidencias

El resumen del proyecto muestra el conteo de incidencias por estado:

| Estado | Descripción |
|--------|-------------|
| Backlog | Ideas y trabajo futuro |
| Por Hacer | Planificado para el ciclo actual |
| En Progreso | Siendo trabajado activamente |
| Hecho | Trabajo completado |

## Referencia de API

```bash
# List projects in a workspace
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects

# Create a project
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Backend API", "key": "API"}'

# Get project with issue counts
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects/<project_id>
```

## Herramientas MCP

| Herramienta | Params | Descripción |
|-------------|--------|-------------|
| `projects.list` | -- | Listar todos los proyectos en el espacio de trabajo |
| `projects.get` | `project_id` | Obtener detalles del proyecto con conteo de incidencias |
| `projects.create` | `key`, `name` | Crear un nuevo proyecto |
| `projects.update` | `project_id` | Actualizar nombre o descripción |
| `projects.delete` | `project_id` | Eliminar un proyecto |

## Próximos Pasos

- [Incidencias](../issues/) -- Crear y gestionar incidencias dentro de proyectos
- [Miembros](./members) -- Gestionar el acceso al proyecto a través de roles del espacio de trabajo
