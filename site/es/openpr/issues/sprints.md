---
title: Gestión de Sprints
description: Planifica y realiza el seguimiento del trabajo en iteraciones con tiempo limitado usando los sprints de OpenPR. Crea sprints, asigna incidencias y monitoriza el progreso.
---

# Gestión de Sprints

Los sprints son iteraciones con tiempo limitado para organizar y rastrear el trabajo. Cada sprint pertenece a un proyecto y tiene una fecha de inicio, fecha de fin y un conjunto de incidencias asignadas.

## Crear un Sprint

### Mediante la Interfaz Web

1. Navega a tu proyecto.
2. Ve a la sección **Sprints**.
3. Haz clic en **Nuevo Sprint**.
4. Introduce el nombre del sprint, fecha de inicio y fecha de fin.

### Mediante la API

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/sprints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Sprint 1",
    "start_date": "2026-03-24",
    "end_date": "2026-04-07"
  }'
```

### Mediante MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "sprints.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "name": "Sprint 1",
      "start_date": "2026-03-24",
      "end_date": "2026-04-07"
    }
  }
}
```

## Campos del Sprint

| Campo | Tipo | Requerido | Descripción |
|-------|------|----------|-------------|
| Nombre | string | Sí | Nombre del sprint (p. ej., "Sprint 1", "Semana 3 Q1") |
| Fecha de Inicio | date | No | Fecha de inicio del sprint |
| Fecha de Fin | date | No | Fecha de fin del sprint |
| Estado | enum | Auto | Activo, completado o planificado |

## Asignar Incidencias a Sprints

Asigna incidencias a un sprint actualizando el `sprint_id` de la incidencia:

```bash
curl -X PATCH http://localhost:8080/api/issues/<issue_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"sprint_id": "<sprint_uuid>"}'
```

O mediante la interfaz web, arrastra incidencias a la sección del sprint o usa el panel de detalle de la incidencia.

## Flujo de Trabajo de Planificación de Sprint

Un flujo de trabajo típico de planificación de sprint:

1. **Crea el sprint** con fechas de inicio y fin.
2. **Revisa el backlog** -- identifica las incidencias a incluir.
3. **Mueve incidencias** desde Backlog/Por Hacer al sprint.
4. **Establece prioridades** y responsables para las incidencias del sprint.
5. **Inicia el sprint** -- el equipo comienza el trabajo.
6. **Sigue el progreso** en el tablero y la vista del sprint.
7. **Completa el sprint** -- revisa los elementos completados/pendientes.

## Herramientas MCP

| Herramienta | Params | Descripción |
|-------------|--------|-------------|
| `sprints.list` | `project_id` | Listar sprints en un proyecto |
| `sprints.create` | `project_id`, `name` | Crear un sprint con fechas opcionales |
| `sprints.update` | `sprint_id` | Actualizar nombre, fechas o estado |
| `sprints.delete` | `sprint_id` | Eliminar un sprint |

## Próximos Pasos

- [Estados del Flujo de Trabajo](./workflow) -- Entender las transiciones de estado de las incidencias
- [Etiquetas](./labels) -- Categorizar las incidencias del sprint
- [Descripción General de Incidencias](./index) -- Referencia completa de campos de incidencias
