---
title: Autenticación
description: "OpenPR usa tokens JWT para la autenticación de usuarios y tokens de bot para el acceso de IA/MCP. Aprende sobre el registro, inicio de sesión, renovación de tokens y tokens de bot."
---

# Autenticación

OpenPR usa **JWT (JSON Web Tokens)** para la autenticación de usuarios y **tokens de bot** para el acceso de asistentes de IA y del servidor MCP.

## Autenticación de Usuarios (JWT)

### Registrarse

Crea una nueva cuenta:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePassword123"
  }'
```

Respuesta:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

::: tip Primer Usuario
El primer usuario registrado recibe automáticamente el rol de `admin`. Todos los usuarios posteriores son `user` por defecto.
:::

### Iniciar Sesión

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

La respuesta incluye `access_token`, `refresh_token` e información del usuario con `role`.

### Usar el Token de Acceso

Incluye el token de acceso en el encabezado `Authorization` para todas las solicitudes autenticadas:

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/workspaces
```

### Renovación de Token

Cuando el token de acceso expira, usa el token de actualización para obtener un nuevo par:

```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJ..."}'
```

### Obtener Usuario Actual

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/auth/me
```

Devuelve el perfil del usuario actual incluyendo `role` (admin/user).

## Configuración de Tokens

Los tiempos de vida de los tokens JWT se configuran mediante variables de entorno:

| Variable | Predeterminado | Descripción |
|----------|----------------|-------------|
| `JWT_SECRET` | `change-me-in-production` | Clave secreta para firmar tokens |
| `JWT_ACCESS_TTL_SECONDS` | `2592000` (30 días) | Tiempo de vida del token de acceso |
| `JWT_REFRESH_TTL_SECONDS` | `604800` (7 días) | Tiempo de vida del token de actualización |

::: danger Seguridad en Producción
Siempre establece `JWT_SECRET` a un valor fuerte y aleatorio en producción. El valor predeterminado es inseguro.
:::

## Autenticación con Token de Bot

Los tokens de bot proporcionan autenticación para asistentes de IA y herramientas automatizadas. Tienen ámbito de espacio de trabajo y usan el prefijo `opr_`.

### Crear Tokens de Bot

Los tokens de bot se gestionan a través de la interfaz de configuración del espacio de trabajo o la API:

```bash
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/bots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"name": "Claude Assistant"}'
```

### Usar Tokens de Bot

Los tokens de bot se usan de la misma manera que los tokens JWT:

```bash
curl -H "Authorization: Bearer opr_abc123..." \
  http://localhost:8080/api/workspaces/<workspace_id>/projects
```

### Propiedades del Token de Bot

| Propiedad | Descripción |
|-----------|-------------|
| Prefijo | `opr_` |
| Ámbito | Un espacio de trabajo |
| Tipo de Entidad | Crea una entidad de usuario `bot_mcp` |
| Permisos | Igual que un miembro del espacio de trabajo |
| Registro de Auditoría | Todas las acciones registradas bajo el usuario bot |

## Resumen de Endpoints de Autenticación

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/register` | POST | Crear cuenta |
| `/api/auth/login` | POST | Iniciar sesión y obtener tokens |
| `/api/auth/refresh` | POST | Renovar par de tokens |
| `/api/auth/me` | GET | Obtener información del usuario actual |

## Próximos Pasos

- [Referencia de Endpoints](./endpoints) -- Documentación completa de la API
- [Servidor MCP](../mcp-server/) -- Uso de tokens de bot con MCP
- [Miembros y Permisos](../workspace/members) -- Control de acceso basado en roles
