---
title: Inicio Rápido
description: Pon OpenPR en marcha y crea tu primer espacio de trabajo, proyecto e incidencias en 5 minutos.
---

# Inicio Rápido

Esta guía te lleva por la configuración de OpenPR y la creación de tu primer espacio de trabajo, proyecto e incidencias. Asume que ya has completado la [instalación](./installation).

## Paso 1: Iniciar OpenPR

Si aún no lo has hecho, inicia los servicios:

```bash
cd openpr
docker-compose up -d
```

Espera a que todos los servicios estén saludables:

```bash
docker-compose ps
```

## Paso 2: Registrar tu Cuenta de Administrador

Abre http://localhost:3000 en tu navegador. Haz clic en **Registrarse** y crea tu cuenta.

::: tip El Primer Usuario es Administrador
El primer usuario registrado recibe automáticamente el rol de **administrador**. Este usuario puede gestionar todos los espacios de trabajo, proyectos y configuraciones del sistema.
:::

## Paso 3: Crear un Espacio de Trabajo

Después de iniciar sesión, crea tu primer espacio de trabajo:

1. Haz clic en **Crear Espacio de Trabajo** en el panel.
2. Introduce un nombre (p. ej., "Mi Equipo") y un slug (p. ej., "mi-equipo").
3. Haz clic en **Crear**.

Un espacio de trabajo es el contenedor de nivel superior para todos tus proyectos y miembros.

## Paso 4: Crear un Proyecto

Dentro de tu espacio de trabajo:

1. Haz clic en **Nuevo Proyecto**.
2. Introduce un nombre (p. ej., "API Backend") y una clave de proyecto (p. ej., "API"). La clave se usa como prefijo para los identificadores de incidencias (p. ej., API-1, API-2).
3. Haz clic en **Crear**.

## Paso 5: Crear Incidencias

Navega a tu proyecto y crea incidencias:

1. Haz clic en **Nueva Incidencia**.
2. Introduce un título y descripción.
3. Establece el estado (backlog, todo, in_progress o done).
4. Opcionalmente establece prioridad (low, medium, high, urgent), responsable y etiquetas.
5. Haz clic en **Crear**.

Las incidencias también pueden crearse a través de la API o el servidor MCP:

```bash
# Create an issue via REST API
curl -X POST http://localhost:8080/api/projects/<project_id>/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "title": "Set up CI pipeline",
    "state": "todo",
    "priority": "high"
  }'
```

## Paso 6: Configurar el Tablero Kanban

Navega a la vista de **Tablero** en tu proyecto. Las incidencias se organizan en columnas por estado:

| Columna | Estado | Descripción |
|---------|--------|-------------|
| Backlog | `backlog` | Ideas y trabajo futuro |
| Por Hacer | `todo` | Planificado para el ciclo actual |
| En Progreso | `in_progress` | Siendo trabajado activamente |
| Hecho | `done` | Trabajo completado |

Arrastra y suelta las incidencias entre columnas para actualizar su estado.

## Paso 7: Invitar Miembros del Equipo

Ve a **Configuración del Espacio de Trabajo** > **Miembros**:

1. Haz clic en **Invitar Miembro**.
2. Introduce la dirección de correo electrónico.
3. Selecciona un rol: **Propietario**, **Administrador** o **Miembro**.

| Rol | Permisos |
|-----|---------|
| Propietario | Acceso completo, puede eliminar el espacio de trabajo |
| Administrador | Gestionar proyectos, miembros, configuración |
| Miembro | Crear y gestionar incidencias, comentarios |

## Paso 8: Conectar Asistentes de IA (Opcional)

Configura el servidor MCP para que los asistentes de IA gestionen tus proyectos:

1. Ve a **Configuración del Espacio de Trabajo** > **Tokens de Bot**.
2. Crea un nuevo token de bot. Tendrá el prefijo `opr_`.
3. Configura tu asistente de IA con el token.

Ejemplo de configuración para Claude Desktop:

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

El asistente de IA ahora puede listar proyectos, crear incidencias, gestionar sprints y más a través de 34 herramientas MCP.

## ¿Qué Sigue?

- [Gestión de Espacios de Trabajo](../workspace/) -- Aprende sobre la organización del espacio de trabajo y los roles de miembros
- [Incidencias y Flujo de Trabajo](../issues/) -- Profundiza en el seguimiento de incidencias y la gestión de estados
- [Planificación de Sprints](../issues/sprints) -- Configura ciclos de sprint
- [Centro de Gobernanza](../governance/) -- Habilita propuestas, votación y puntuaciones de confianza
- [Referencia de API](../api/) -- Integra con herramientas externas
- [Servidor MCP](../mcp-server/) -- Referencia completa de herramientas MCP para asistentes de IA
