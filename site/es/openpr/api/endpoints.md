---
title: Referencia de Endpoints de API
description: Referencia completa de todos los endpoints de la API REST de OpenPR incluyendo autenticación, proyectos, incidencias, gobernanza, IA y operaciones de administración.
---

# Referencia de Endpoints de API

Esta página proporciona una referencia completa de todos los endpoints de la API REST de OpenPR. Todos los endpoints requieren autenticación a menos que se indique lo contrario.

## Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Crear una nueva cuenta | No |
| POST | `/api/auth/login` | Iniciar sesión y recibir tokens | No |
| POST | `/api/auth/refresh` | Renovar token de acceso | No |
| GET | `/api/auth/me` | Obtener información del usuario actual | Sí |

## Espacios de Trabajo

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/workspaces` | Listar espacios de trabajo del usuario |
| POST | `/api/workspaces` | Crear un espacio de trabajo |
| GET | `/api/workspaces/:id` | Obtener detalles del espacio de trabajo |
| PUT | `/api/workspaces/:id` | Actualizar espacio de trabajo |
| DELETE | `/api/workspaces/:id` | Eliminar espacio de trabajo (solo propietario) |

## Miembros del Espacio de Trabajo

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/workspaces/:id/members` | Listar miembros |
| POST | `/api/workspaces/:id/members` | Añadir un miembro |
| PUT | `/api/workspaces/:id/members/:user_id` | Actualizar rol del miembro |
| DELETE | `/api/workspaces/:id/members/:user_id` | Eliminar miembro |

## Tokens de Bot

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/workspaces/:id/bots` | Listar tokens de bot |
| POST | `/api/workspaces/:id/bots` | Crear token de bot |
| DELETE | `/api/workspaces/:id/bots/:bot_id` | Eliminar token de bot |

## Proyectos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/workspaces/:ws_id/projects` | Listar proyectos |
| POST | `/api/workspaces/:ws_id/projects` | Crear proyecto |
| GET | `/api/workspaces/:ws_id/projects/:id` | Obtener proyecto con conteos |
| PUT | `/api/workspaces/:ws_id/projects/:id` | Actualizar proyecto |
| DELETE | `/api/workspaces/:ws_id/projects/:id` | Eliminar proyecto |

## Incidencias (Elementos de Trabajo)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/projects/:id/issues` | Listar incidencias (paginación, filtros) |
| POST | `/api/projects/:id/issues` | Crear incidencia |
| GET | `/api/issues/:id` | Obtener incidencia por UUID |
| PATCH | `/api/issues/:id` | Actualizar campos de la incidencia |
| DELETE | `/api/issues/:id` | Eliminar incidencia |

### Campos de Incidencia (Crear/Actualizar)

```json
{
  "title": "string (required on create)",
  "description": "string (markdown)",
  "state": "backlog | todo | in_progress | done",
  "priority": "low | medium | high | urgent",
  "assignee_id": "uuid",
  "sprint_id": "uuid",
  "due_at": "ISO 8601 datetime"
}
```

## Tablero

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/projects/:id/board` | Obtener estado del tablero kanban |

## Comentarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/issues/:id/comments` | Listar comentarios de una incidencia |
| POST | `/api/issues/:id/comments` | Crear un comentario |
| DELETE | `/api/comments/:id` | Eliminar un comentario |

## Etiquetas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/labels` | Listar todas las etiquetas del espacio de trabajo |
| POST | `/api/labels` | Crear una etiqueta |
| PUT | `/api/labels/:id` | Actualizar etiqueta |
| DELETE | `/api/labels/:id` | Eliminar etiqueta |
| POST | `/api/issues/:id/labels` | Añadir etiqueta a una incidencia |
| DELETE | `/api/issues/:id/labels/:label_id` | Eliminar etiqueta de una incidencia |

## Sprints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/projects/:id/sprints` | Listar sprints |
| POST | `/api/projects/:id/sprints` | Crear sprint |
| PUT | `/api/sprints/:id` | Actualizar sprint |
| DELETE | `/api/sprints/:id` | Eliminar sprint |

## Propuestas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/proposals` | Listar propuestas |
| POST | `/api/proposals` | Crear propuesta |
| GET | `/api/proposals/:id` | Obtener detalles de la propuesta |
| POST | `/api/proposals/:id/vote` | Emitir un voto |
| POST | `/api/proposals/:id/submit` | Enviar para votación |
| POST | `/api/proposals/:id/archive` | Archivar propuesta |

## Gobernanza

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/governance/config` | Obtener configuración de gobernanza |
| PUT | `/api/governance/config` | Actualizar configuración de gobernanza |
| GET | `/api/governance/audit-logs` | Listar registros de auditoría de gobernanza |

## Decisiones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/decisions` | Listar decisiones |
| GET | `/api/decisions/:id` | Obtener detalles de la decisión |

## Puntuaciones de Confianza

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/trust-scores` | Listar puntuaciones de confianza |
| GET | `/api/trust-scores/:user_id` | Obtener puntuación de confianza del usuario |
| GET | `/api/trust-scores/:user_id/history` | Obtener historial de puntuación |
| POST | `/api/trust-scores/:user_id/appeals` | Presentar una apelación |

## Veto

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/veto` | Listar eventos de veto |
| POST | `/api/veto` | Crear veto |
| POST | `/api/veto/:id/escalate` | Escalar un veto |

## Agentes de IA

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/projects/:id/ai-agents` | Listar agentes de IA |
| POST | `/api/projects/:id/ai-agents` | Registrar agente de IA |
| GET | `/api/projects/:id/ai-agents/:agent_id` | Obtener detalles del agente |
| PUT | `/api/projects/:id/ai-agents/:agent_id` | Actualizar agente |
| DELETE | `/api/projects/:id/ai-agents/:agent_id` | Eliminar agente |

## Tareas de IA

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/projects/:id/ai-tasks` | Listar tareas de IA |
| POST | `/api/projects/:id/ai-tasks` | Crear tarea de IA |
| PUT | `/api/projects/:id/ai-tasks/:task_id` | Actualizar estado de la tarea |
| POST | `/api/projects/:id/ai-tasks/:task_id/callback` | Callback de tarea |

## Subida de Archivos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/upload` | Subir archivo (multipart/form-data) |

Tipos soportados: imágenes (PNG, JPG, GIF, WebP), documentos (PDF, TXT), datos (JSON, CSV, XML), archivos comprimidos (ZIP, GZ), registros.

## Webhooks

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/workspaces/:id/webhooks` | Listar webhooks |
| POST | `/api/workspaces/:id/webhooks` | Crear webhook |
| PUT | `/api/workspaces/:id/webhooks/:wh_id` | Actualizar webhook |
| DELETE | `/api/workspaces/:id/webhooks/:wh_id` | Eliminar webhook |
| GET | `/api/workspaces/:id/webhooks/:wh_id/deliveries` | Registro de entregas |

## Búsqueda

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/search?q=<query>` | Búsqueda de texto completo en todas las entidades |

## Administración

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/users` | Listar todos los usuarios (solo admin) |
| PUT | `/api/admin/users/:id` | Actualizar usuario (solo admin) |

## Estado

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Verificación de estado | No |

## Próximos Pasos

- [Autenticación](./authentication) -- Gestión de tokens y tokens de bot
- [Descripción General de la API](./index) -- Formato de respuesta y convenciones
- [Servidor MCP](../mcp-server/) -- Interfaz amigable para IA
