---
title: Servidor MCP
description: "OpenPR incluye un servidor MCP integrado con 34 herramientas en transportes HTTP, stdio y SSE. Integra asistentes de IA como Claude, Codex y Cursor con tu gestión de proyectos."
---

# Servidor MCP

OpenPR incluye un **servidor MCP (Model Context Protocol)** integrado que expone 34 herramientas para que los asistentes de IA gestionen proyectos, incidencias, sprints, etiquetas, comentarios, propuestas y archivos. El servidor soporta tres protocolos de transporte simultáneamente.

## Protocolos de Transporte

| Protocolo | Caso de Uso | Endpoint |
|-----------|------------|----------|
| **HTTP** | Integraciones web, plugins OpenClaw | `POST /mcp/rpc` |
| **stdio** | Claude Desktop, Codex, CLI local | stdin/stdout JSON-RPC |
| **SSE** | Clientes de streaming, interfaces en tiempo real | `GET /sse` + `POST /messages` |

::: tip Multi-Protocolo
En modo HTTP, los tres protocolos están disponibles en un único puerto: `/mcp/rpc` (HTTP), `/sse` + `/messages` (SSE), y `/health` (verificación de estado).
:::

## Configuración

### Variables de Entorno

| Variable | Requerido | Descripción | Ejemplo |
|----------|----------|-------------|---------|
| `OPENPR_API_URL` | Sí | URL base del servidor de API | `http://localhost:3000` |
| `OPENPR_BOT_TOKEN` | Sí | Token de bot con prefijo `opr_` | `opr_abc123...` |
| `OPENPR_WORKSPACE_ID` | Sí | UUID del espacio de trabajo predeterminado | `e5166fd1-...` |

### Claude Desktop / Cursor / Codex (stdio)

Añade a la configuración de tu cliente MCP:

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_your_token_here",
        "OPENPR_WORKSPACE_ID": "your-workspace-uuid"
      }
    }
  }
}
```

### Modo HTTP

```bash
# Start the MCP server
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090

# Verify
curl -X POST http://localhost:8090/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Modo SSE

```bash
# 1. Connect SSE stream (returns session endpoint)
curl -N -H "Accept: text/event-stream" http://localhost:8090/sse
# -> event: endpoint
# -> data: /messages?session_id=<uuid>

# 2. POST request to the returned endpoint
curl -X POST "http://localhost:8090/messages?session_id=<uuid>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"projects.list","arguments":{}}}'
# -> Response arrives via SSE stream as event: message
```

### Docker Compose

```yaml
mcp-server:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: mcp-server
  environment:
    - OPENPR_API_URL=http://api:8080
    - OPENPR_BOT_TOKEN=opr_your_token
    - OPENPR_WORKSPACE_ID=your-workspace-uuid
  ports:
    - "8090:8090"
  command: ["./mcp-server", "--transport", "http", "--bind-addr", "0.0.0.0:8090"]
```

## Referencia de Herramientas (34 Herramientas)

### Proyectos (5)

| Herramienta | Params Requeridos | Descripción |
|-------------|-----------------|-------------|
| `projects.list` | -- | Listar todos los proyectos en el espacio de trabajo |
| `projects.get` | `project_id` | Obtener detalles del proyecto con conteo de incidencias |
| `projects.create` | `key`, `name` | Crear un proyecto |
| `projects.update` | `project_id` | Actualizar nombre/descripción |
| `projects.delete` | `project_id` | Eliminar un proyecto |

### Elementos de Trabajo / Incidencias (11)

| Herramienta | Params Requeridos | Descripción |
|-------------|-----------------|-------------|
| `work_items.list` | `project_id` | Listar incidencias en un proyecto |
| `work_items.get` | `work_item_id` | Obtener incidencia por UUID |
| `work_items.get_by_identifier` | `identifier` | Obtener por ID legible (p. ej., `API-42`) |
| `work_items.create` | `project_id`, `title` | Crear incidencia con estado, prioridad, descripción, assignee_id, due_at, adjuntos opcionales |
| `work_items.update` | `work_item_id` | Actualizar cualquier campo |
| `work_items.delete` | `work_item_id` | Eliminar una incidencia |
| `work_items.search` | `query` | Búsqueda de texto completo en todos los proyectos |
| `work_items.add_label` | `work_item_id`, `label_id` | Añadir una etiqueta |
| `work_items.add_labels` | `work_item_id`, `label_ids` | Añadir múltiples etiquetas |
| `work_items.remove_label` | `work_item_id`, `label_id` | Eliminar una etiqueta |
| `work_items.list_labels` | `work_item_id` | Listar etiquetas de una incidencia |

### Comentarios (3)

| Herramienta | Params Requeridos | Descripción |
|-------------|-----------------|-------------|
| `comments.create` | `work_item_id`, `content` | Crear comentario con adjuntos opcionales |
| `comments.list` | `work_item_id` | Listar comentarios de una incidencia |
| `comments.delete` | `comment_id` | Eliminar un comentario |

### Archivos (1)

| Herramienta | Params Requeridos | Descripción |
|-------------|-----------------|-------------|
| `files.upload` | `filename`, `content_base64` | Subir archivo (base64), devuelve URL y nombre de archivo |

### Etiquetas (5)

| Herramienta | Params Requeridos | Descripción |
|-------------|-----------------|-------------|
| `labels.list` | -- | Listar todas las etiquetas del espacio de trabajo |
| `labels.list_by_project` | `project_id` | Listar etiquetas de un proyecto |
| `labels.create` | `name`, `color` | Crear etiqueta (color: hex, p. ej., `#2563eb`) |
| `labels.update` | `label_id` | Actualizar nombre/color/descripción |
| `labels.delete` | `label_id` | Eliminar una etiqueta |

### Sprints (4)

| Herramienta | Params Requeridos | Descripción |
|-------------|-----------------|-------------|
| `sprints.list` | `project_id` | Listar sprints en un proyecto |
| `sprints.create` | `project_id`, `name` | Crear sprint con start_date, end_date opcionales |
| `sprints.update` | `sprint_id` | Actualizar nombre/fechas/estado |
| `sprints.delete` | `sprint_id` | Eliminar un sprint |

### Propuestas (3)

| Herramienta | Params Requeridos | Descripción |
|-------------|-----------------|-------------|
| `proposals.list` | `project_id` | Listar propuestas con filtro de estado opcional |
| `proposals.get` | `proposal_id` | Obtener detalles de la propuesta |
| `proposals.create` | `project_id`, `title`, `description` | Crear una propuesta de gobernanza |

### Miembros y Búsqueda (2)

| Herramienta | Params Requeridos | Descripción |
|-------------|-----------------|-------------|
| `members.list` | -- | Listar miembros del espacio de trabajo y roles |
| `search.all` | `query` | Búsqueda global en proyectos, incidencias, comentarios |

## Formato de Respuesta

Todas las respuestas de herramientas MCP siguen esta estructura:

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
  "message": "error description"
}
```

## Autenticación con Token de Bot

El servidor MCP se autentica a través de **tokens de bot** (prefijo `opr_`). Crea tokens de bot en **Configuración del Espacio de Trabajo** > **Tokens de Bot**.

Cada token de bot:
- Tiene un nombre para mostrar (que aparece en los feeds de actividad)
- Tiene ámbito en un espacio de trabajo
- Crea una entidad de usuario `bot_mcp` para la integridad del registro de auditoría
- Soporta todas las operaciones de lectura/escritura disponibles para los miembros del espacio de trabajo

## Integración con Agentes

Para agentes de codificación, OpenPR proporciona:

- **AGENTS.md** (`apps/mcp-server/AGENTS.md`) -- Patrones de flujo de trabajo y ejemplos de herramientas para agentes.
- **Paquete de Habilidades** (`skills/openpr-mcp/SKILL.md`) -- Habilidad gobernada con plantillas de flujo de trabajo y scripts.

Flujo de trabajo recomendado para agentes:
1. Carga `AGENTS.md` para la semántica de las herramientas.
2. Usa `tools/list` para enumerar las herramientas disponibles en tiempo de ejecución.
3. Sigue los patrones de flujo de trabajo: buscar -> crear -> etiquetar -> comentar.

## Próximos Pasos

- [Descripción General de la API](../api/) -- Referencia de la API REST
- [Miembros y Permisos](../workspace/members) -- Gestión de tokens de bot
- [Configuración](../configuration/) -- Todas las variables de entorno
