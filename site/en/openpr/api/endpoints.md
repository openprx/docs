---
title: API Endpoints Reference
description: Complete reference for all OpenPR REST API endpoints including authentication, projects, issues, governance, AI, and admin operations.
---

# API Endpoints Reference

This page provides a complete reference for all OpenPR REST API endpoints. All endpoints require authentication unless noted otherwise.

## Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create a new account | No |
| POST | `/api/auth/login` | Login and receive tokens | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| GET | `/api/auth/me` | Get current user info | Yes |

## Workspaces

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces` | List user's workspaces |
| POST | `/api/workspaces` | Create a workspace |
| GET | `/api/workspaces/:id` | Get workspace details |
| PUT | `/api/workspaces/:id` | Update workspace |
| DELETE | `/api/workspaces/:id` | Delete workspace (owner only) |

## Workspace Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces/:id/members` | List members |
| POST | `/api/workspaces/:id/members` | Add a member |
| PUT | `/api/workspaces/:id/members/:user_id` | Update member role |
| DELETE | `/api/workspaces/:id/members/:user_id` | Remove member |

## Bot Tokens

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces/:id/bots` | List bot tokens |
| POST | `/api/workspaces/:id/bots` | Create bot token |
| DELETE | `/api/workspaces/:id/bots/:bot_id` | Delete bot token |

## Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces/:ws_id/projects` | List projects |
| POST | `/api/workspaces/:ws_id/projects` | Create project |
| GET | `/api/workspaces/:ws_id/projects/:id` | Get project with counts |
| PUT | `/api/workspaces/:ws_id/projects/:id` | Update project |
| DELETE | `/api/workspaces/:ws_id/projects/:id` | Delete project |

## Issues (Work Items)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/issues` | List issues (pagination, filters) |
| POST | `/api/projects/:id/issues` | Create issue |
| GET | `/api/issues/:id` | Get issue by UUID |
| PATCH | `/api/issues/:id` | Update issue fields |
| DELETE | `/api/issues/:id` | Delete issue |

### Issue Fields (Create/Update)

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

## Board

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/board` | Get kanban board state |

## Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/issues/:id/comments` | List comments on an issue |
| POST | `/api/issues/:id/comments` | Create a comment |
| DELETE | `/api/comments/:id` | Delete a comment |

## Labels

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/labels` | List all workspace labels |
| POST | `/api/labels` | Create a label |
| PUT | `/api/labels/:id` | Update label |
| DELETE | `/api/labels/:id` | Delete label |
| POST | `/api/issues/:id/labels` | Add label to issue |
| DELETE | `/api/issues/:id/labels/:label_id` | Remove label from issue |

## Sprints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/sprints` | List sprints |
| POST | `/api/projects/:id/sprints` | Create sprint |
| PUT | `/api/sprints/:id` | Update sprint |
| DELETE | `/api/sprints/:id` | Delete sprint |

## Proposals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/proposals` | List proposals |
| POST | `/api/proposals` | Create proposal |
| GET | `/api/proposals/:id` | Get proposal details |
| POST | `/api/proposals/:id/vote` | Cast a vote |
| POST | `/api/proposals/:id/submit` | Submit for voting |
| POST | `/api/proposals/:id/archive` | Archive proposal |

## Governance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/governance/config` | Get governance configuration |
| PUT | `/api/governance/config` | Update governance configuration |
| GET | `/api/governance/audit-logs` | List governance audit logs |

## Decisions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/decisions` | List decisions |
| GET | `/api/decisions/:id` | Get decision details |

## Trust Scores

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trust-scores` | List trust scores |
| GET | `/api/trust-scores/:user_id` | Get user trust score |
| GET | `/api/trust-scores/:user_id/history` | Get score history |
| POST | `/api/trust-scores/:user_id/appeals` | File an appeal |

## Veto

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/veto` | List veto events |
| POST | `/api/veto` | Create veto |
| POST | `/api/veto/:id/escalate` | Escalate a veto |

## AI Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/ai-agents` | List AI agents |
| POST | `/api/projects/:id/ai-agents` | Register AI agent |
| GET | `/api/projects/:id/ai-agents/:agent_id` | Get agent details |
| PUT | `/api/projects/:id/ai-agents/:agent_id` | Update agent |
| DELETE | `/api/projects/:id/ai-agents/:agent_id` | Remove agent |

## AI Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/ai-tasks` | List AI tasks |
| POST | `/api/projects/:id/ai-tasks` | Create AI task |
| PUT | `/api/projects/:id/ai-tasks/:task_id` | Update task status |
| POST | `/api/projects/:id/ai-tasks/:task_id/callback` | Task callback |

## File Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/upload` | Upload file (multipart/form-data) |

Supported types: images (PNG, JPG, GIF, WebP), documents (PDF, TXT), data (JSON, CSV, XML), archives (ZIP, GZ), logs.

## Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces/:id/webhooks` | List webhooks |
| POST | `/api/workspaces/:id/webhooks` | Create webhook |
| PUT | `/api/workspaces/:id/webhooks/:wh_id` | Update webhook |
| DELETE | `/api/workspaces/:id/webhooks/:wh_id` | Delete webhook |
| GET | `/api/workspaces/:id/webhooks/:wh_id/deliveries` | Delivery log |

## Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search?q=<query>` | Full-text search across all entities |

## Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users (admin only) |
| PUT | `/api/admin/users/:id` | Update user (admin only) |

## Health

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | No |

## Next Steps

- [Authentication](./authentication) -- Token management and bot tokens
- [API Overview](./index) -- Response format and conventions
- [MCP Server](../mcp-server/) -- AI-friendly interface
