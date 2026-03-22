---
title: Referencia de CLI
---

# Referencia de CLI

OpenPR incluye una interfaz de línea de comandos integrada en el binario `openpr-mcp`. Además de ejecutar el servidor MCP, proporciona comandos para gestionar proyectos, elementos de trabajo, comentarios, etiquetas, sprints y más directamente desde la terminal.

## Instalación

La CLI está disponible como parte del crate `mcp-server`. Después de compilar, el binario se llama `openpr-mcp`.

```bash
cargo build --release -p mcp-server
```

## Opciones Globales

Estas opciones aplican a todos los comandos:

| Opción | Descripción | Predeterminado |
|--------|-------------|----------------|
| `--api-url <URL>` | Endpoint del servidor API | `http://localhost:8080` |
| `--bot-token <TOKEN>` | Token de autenticación (prefijo `opr_`) | -- |
| `--workspace-id <UUID>` | Contexto del espacio de trabajo para operaciones | -- |
| `--format json\|table` | Formato de salida | `table` |

También puedes establecerlas mediante variables de entorno:

```bash
export OPENPR_API_URL=http://localhost:8080
export OPENPR_BOT_TOKEN=opr_your_token_here
export OPENPR_WORKSPACE_ID=your-workspace-uuid
```

## Comandos

### serve -- Iniciar Servidor MCP

Ejecuta el servidor MCP para la integración de herramientas de IA.

```bash
# HTTP transport (default)
openpr-mcp serve --transport http --port 8090

# Stdio transport (for direct integration)
openpr-mcp serve --transport stdio
```

### projects -- Gestión de Proyectos

```bash
# List all projects in the workspace
openpr-mcp projects list --format table

# Get details of a specific project
openpr-mcp projects get <project_id>

# Create a new project
openpr-mcp projects create --name "My Project" --key "MP"
```

### work-items -- Gestión de Elementos de Trabajo

```bash
# List work items with filters
openpr-mcp work-items list --project-id <id> --state todo
openpr-mcp work-items list --project-id <id> --state in_progress --assignee-id <user_id>

# Get a specific work item
openpr-mcp work-items get <id>

# Create a work item
openpr-mcp work-items create --project-id <id> --title "Fix bug" --state todo
openpr-mcp work-items create --project-id <id> --title "New feature" --state backlog --priority high

# Update a work item
openpr-mcp work-items update <id> --state in_progress --assignee-id <user_id>
openpr-mcp work-items update <id> --state done --priority low

# Search work items by text
openpr-mcp work-items search --query "authentication"
```

### comments -- Gestión de Comentarios

```bash
# List comments on a work item
openpr-mcp comments list --work-item-id <id>

# Add a comment
openpr-mcp comments create --work-item-id <id> --content "Fixed in commit abc123"
```

### labels -- Gestión de Etiquetas

```bash
# List workspace-level labels
openpr-mcp labels list --workspace

# List project-level labels
openpr-mcp labels list --project-id <id>
```

### sprints -- Gestión de Sprints

```bash
# List sprints for a project
openpr-mcp sprints list --project-id <id>
```

### search -- Búsqueda Global

```bash
# Search across all entities
openpr-mcp search --query "bug"
```

### files -- Archivos Adjuntos

```bash
# Upload a file to a work item
openpr-mcp files upload --work-item-id <id> --path ./screenshot.png
```

## Ejemplos de Uso

### Flujo de Trabajo Típico

```bash
# Set up credentials
export OPENPR_API_URL=https://openpr.example.com
export OPENPR_BOT_TOKEN=opr_abc123
export OPENPR_WORKSPACE_ID=550e8400-e29b-41d4-a716-446655440000

# List projects
openpr-mcp projects list

# View todo items for a project
openpr-mcp work-items list --project-id <id> --state todo --format table

# Pick up a work item
openpr-mcp work-items update <item_id> --state in_progress --assignee-id <your_user_id>

# Add a comment when done
openpr-mcp comments create --work-item-id <item_id> --content "Completed. See PR #42."

# Mark as done
openpr-mcp work-items update <item_id> --state done
```

### Salida JSON para Scripts

Usa `--format json` para obtener una salida legible por máquina adecuada para canalizar a `jq` u otras herramientas:

```bash
# Get all in-progress items as JSON
openpr-mcp work-items list --project-id <id> --state in_progress --format json

# Count items by state
openpr-mcp work-items list --project-id <id> --format json | jq '.[] | .state' | sort | uniq -c
```

## Ver También

- [Servidor MCP](../mcp-server/) -- Integración de herramientas MCP para agentes de IA
- [Referencia de API](../api/) -- Documentación completa de la API REST
- [Estados del Flujo de Trabajo](../issues/workflow) -- Gestión de estados de incidencias y flujos de trabajo personalizados
