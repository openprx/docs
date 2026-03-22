---
title: Etiquetas
description: Organiza y categoriza incidencias con etiquetas codificadas por colores en OpenPR. Las etiquetas pueden ser de ámbito global en el espacio de trabajo o de ámbito de proyecto.
---

# Etiquetas

Las etiquetas proporcionan una forma flexible de categorizar y filtrar incidencias. Cada etiqueta tiene un nombre, color y descripción opcional.

## Crear Etiquetas

### Mediante la Interfaz Web

1. Navega a la configuración de tu proyecto o espacio de trabajo.
2. Ve a **Etiquetas**.
3. Haz clic en **Nueva Etiqueta**.
4. Introduce un nombre (p. ej., "bug", "feature", "documentation").
5. Elige un color (formato hexadecimal, p. ej., `#ef4444` para rojo).
6. Haz clic en **Crear**.

### Mediante la API

```bash
curl -X POST http://localhost:8080/api/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "bug",
    "color": "#ef4444",
    "description": "Something is not working"
  }'
```

### Mediante MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "labels.create",
    "arguments": {
      "name": "bug",
      "color": "#ef4444"
    }
  }
}
```

## Esquemas de Etiquetas Comunes

Aquí se muestran algunas organizaciones de etiquetas populares:

### Por Tipo

| Etiqueta | Color | Descripción |
|---------|-------|-------------|
| `bug` | `#ef4444` (rojo) | Algo está roto |
| `feature` | `#3b82f6` (azul) | Solicitud de nueva funcionalidad |
| `enhancement` | `#8b5cf6` (morado) | Mejora a funcionalidad existente |
| `documentation` | `#06b6d4` (cian) | Actualizaciones de documentación |
| `refactor` | `#f59e0b` (ámbar) | Refactorización de código |

### Por Prioridad

| Etiqueta | Color | Descripción |
|---------|-------|-------------|
| `P0-critical` | `#dc2626` (rojo) | Producción caída |
| `P1-high` | `#ea580c` (naranja) | Funcionalidad principal rota |
| `P2-medium` | `#eab308` (amarillo) | Problema no crítico |
| `P3-low` | `#22c55e` (verde) | Sería bueno tener |

## Añadir Etiquetas a Incidencias

### Mediante la Interfaz Web

Abre una incidencia y haz clic en el campo **Etiquetas** para añadir o eliminar etiquetas.

### Mediante la API

```bash
# Add a label to an issue
curl -X POST http://localhost:8080/api/issues/<issue_id>/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"label_id": "<label_uuid>"}'
```

### Mediante MCP

| Herramienta | Params | Descripción |
|-------------|--------|-------------|
| `work_items.add_label` | `work_item_id`, `label_id` | Añadir una etiqueta |
| `work_items.add_labels` | `work_item_id`, `label_ids` | Añadir múltiples etiquetas |
| `work_items.remove_label` | `work_item_id`, `label_id` | Eliminar una etiqueta |
| `work_items.list_labels` | `work_item_id` | Listar etiquetas de una incidencia |

## Herramientas MCP para Gestión de Etiquetas

| Herramienta | Params | Descripción |
|-------------|--------|-------------|
| `labels.list` | -- | Listar todas las etiquetas del espacio de trabajo |
| `labels.list_by_project` | `project_id` | Listar etiquetas de un proyecto |
| `labels.create` | `name`, `color` | Crear una etiqueta |
| `labels.update` | `label_id` | Actualizar nombre, color o descripción |
| `labels.delete` | `label_id` | Eliminar una etiqueta |

## Próximos Pasos

- [Descripción General de Incidencias](./index) -- Referencia completa de campos de incidencias
- [Estados del Flujo de Trabajo](./workflow) -- Gestión del ciclo de vida de incidencias
- [Planificación de Sprints](./sprints) -- Organizar incidencias etiquetadas en sprints
