---
title: Miembros y Permisos
description: "Gestiona miembros del espacio de trabajo, roles y tokens de bot en OpenPR. Control de acceso basado en roles con niveles de propietario, administrador y miembro."
---

# Miembros y Permisos

OpenPR utiliza control de acceso basado en roles (RBAC) con ámbito de espacio de trabajo. Cada miembro del espacio de trabajo tiene un rol que determina sus permisos.

## Roles

| Rol | Descripción | Permisos |
|-----|-------------|---------|
| **Propietario** | Creador del espacio de trabajo o propietario promovido | Acceso completo: eliminar espacio de trabajo, gestionar todas las configuraciones, promover/degradar miembros |
| **Administrador** | Administrador del espacio de trabajo | Gestionar proyectos, miembros (excepto propietarios), configuraciones, configuración de gobernanza |
| **Miembro** | Miembro regular del equipo | Crear y gestionar incidencias, comentarios, etiquetas; participar en gobernanza |

## Invitar Miembros

Navega a **Configuración del Espacio de Trabajo** > **Miembros** > **Invitar**:

1. Introduce la dirección de correo electrónico del usuario.
2. Selecciona un rol (Propietario, Administrador o Miembro).
3. Haz clic en **Invitar**.

El usuario invitado debe tener una cuenta OpenPR. Si no tiene una, necesita registrarse primero.

## Gestionar Miembros

Desde la lista de miembros, puedes:

- **Cambiar rol** -- Promover o degradar miembros (los administradores no pueden cambiar roles de propietario).
- **Eliminar** -- Eliminar un miembro del espacio de trabajo.

## Tipos de Usuario

OpenPR soporta dos tipos de entidad:

| Tipo | Descripción | Creado Por |
|------|-------------|-----------|
| `human` | Usuarios humanos regulares | Registro de usuario |
| `bot` | Cuentas de bot/IA | Creación de token de bot |

Los usuarios bot se crean automáticamente cuando se genera un token de bot. Aparecen en feeds de actividad y registros de auditoría con su nombre para mostrar.

## Tokens de Bot

Los tokens de bot permiten que los asistentes de IA y herramientas externas se autentiquen con el servidor MCP y la API. Cada token:

- Tiene el prefijo `opr_`.
- Tiene ámbito en un espacio de trabajo.
- Crea una entidad de usuario `bot_mcp` correspondiente.
- Soporta todas las operaciones de lectura/escritura disponibles para los miembros del espacio de trabajo.

### Crear un Token de Bot

Navega a **Configuración del Espacio de Trabajo** > **Tokens de Bot** > **Crear**:

1. Introduce un nombre para mostrar (p. ej., "Asistente Claude").
2. Haz clic en **Crear**.
3. Copia el token inmediatamente -- no se mostrará de nuevo.

### Usar Tokens de Bot

Los tokens de bot se usan en la configuración del servidor MCP:

```bash
# Environment variable
OPENPR_BOT_TOKEN=opr_your_token_here
```

O en solicitudes de API:

```bash
curl -H "Authorization: Bearer opr_your_token_here" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects
```

## Referencia de API

```bash
# List workspace members
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/members

# List bot tokens
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/bots
```

## Herramientas MCP

| Herramienta | Descripción |
|-------------|-------------|
| `members.list` | Listar todos los miembros del espacio de trabajo y sus roles |

## Próximos Pasos

- [Gestión de Espacios de Trabajo](./index) -- Configuración del espacio de trabajo
- [Servidor MCP](../mcp-server/) -- Configurar asistentes de IA con tokens de bot
