---
title: Members & Permissions
description: Manage workspace members, roles, and bot tokens in OpenPR. Role-based access control with owner, admin, and member levels.
---

# Members & Permissions

OpenPR uses role-based access control (RBAC) scoped to workspaces. Each workspace member has a role that determines their permissions.

## Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Owner** | Workspace creator or promoted owner | Full access: delete workspace, manage all settings, promote/demote members |
| **Admin** | Workspace administrator | Manage projects, members (except owners), settings, governance config |
| **Member** | Regular team member | Create and manage issues, comments, labels; participate in governance |

## Inviting Members

Navigate to **Workspace Settings** > **Members** > **Invite**:

1. Enter the user's email address.
2. Select a role (Owner, Admin, or Member).
3. Click **Invite**.

The invited user must have an OpenPR account. If they don't have one, they need to register first.

## Managing Members

From the members list, you can:

- **Change role** -- Promote or demote members (admins cannot change owner roles).
- **Remove** -- Remove a member from the workspace.

## User Types

OpenPR supports two entity types:

| Type | Description | Created By |
|------|-------------|-----------|
| `human` | Regular human users | User registration |
| `bot` | Bot/AI accounts | Bot token creation |

Bot users are created automatically when a bot token is generated. They appear in activity feeds and audit logs with their display name.

## Bot Tokens

Bot tokens enable AI assistants and external tools to authenticate with the MCP server and API. Each token:

- Has an `opr_` prefix.
- Is scoped to one workspace.
- Creates a corresponding `bot_mcp` user entity.
- Supports all read/write operations available to workspace members.

### Creating a Bot Token

Navigate to **Workspace Settings** > **Bot Tokens** > **Create**:

1. Enter a display name (e.g., "Claude Assistant").
2. Click **Create**.
3. Copy the token immediately -- it will not be shown again.

### Using Bot Tokens

Bot tokens are used in MCP server configuration:

```bash
# Environment variable
OPENPR_BOT_TOKEN=opr_your_token_here
```

Or in API requests:

```bash
curl -H "Authorization: Bearer opr_your_token_here" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects
```

## API Reference

```bash
# List workspace members
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/members

# List bot tokens
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/bots
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `members.list` | List all workspace members and their roles |

## Next Steps

- [Workspace Management](./index) -- Workspace configuration
- [MCP Server](../mcp-server/) -- Configure AI assistants with bot tokens
