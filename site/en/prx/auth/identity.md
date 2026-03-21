---
title: Identity Management
description: Workspace and user scoping, multi-tenancy, and identity context propagation in PRX.
---

# Identity Management

PRX's identity system provides workspace-level and user-level scoping for all agent operations. In multi-tenant deployments, identity context determines which memories, configurations, tools, and resources a given session can access. The identity module is the foundation for access control, audit logging, and personalization.

## Overview

Every PRX session operates within an identity context that includes:

| Component | Description |
|-----------|-------------|
| **User** | The human or bot interacting with the agent |
| **Workspace** | A logical boundary grouping users, configurations, and data |
| **Session** | A single conversation between a user and the agent |
| **Principal** | The effective identity for access control decisions |

```
┌─────────────────────────────────────────┐
│              Workspace: "acme"          │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ User: A  │  │ User: B  │  ...       │
│  │          │  │          │            │
│  │ Sessions │  │ Sessions │            │
│  │ Memories │  │ Memories │            │
│  │ Config   │  │ Config   │            │
│  └──────────┘  └──────────┘            │
│                                         │
│  Shared: workspace config, tools, keys │
└─────────────────────────────────────────┘
```

## Configuration

### Workspace Setup

```toml
[identity]
# Enable multi-tenant identity scoping.
enabled = true

# Default workspace for sessions that do not specify one.
default_workspace = "default"

# Allow users to create new workspaces.
allow_workspace_creation = true

# Maximum workspaces per deployment.
max_workspaces = 100
```

### User Profiles

User profiles store per-user preferences and metadata:

```toml
[identity.profiles]
# Storage backend for user profiles: "memory" | "sqlite" | "postgres"
backend = "sqlite"
path = "~/.local/share/openprx/identities.db"
```

### Workspace Configuration

Each workspace can have its own configuration overlay:

```toml
# Workspace-specific overrides in config.toml
[workspaces.acme]
display_name = "ACME Corp"
default_provider = "openai"
default_model = "gpt-4o"

[workspaces.acme.memory]
backend = "postgres"

[workspaces.acme.security.tool_policy]
default = "supervised"
```

## Identity Context

The `IdentityContext` struct is passed through the entire request pipeline. It contains: `user_id`, `display_name`, `workspace_id`, `session_id`, `role` (Owner/Admin/Member/Guest), `channel`, and arbitrary `metadata`.

The identity context propagates through every layer: the gateway extracts it from incoming requests, the agent loop uses it to scope memory and tool access, the memory system namespaces data by workspace and user, cost tracking attributes usage, and the audit log records the actor.

## Multi-Tenancy

PRX supports multi-tenant deployments where multiple organizations share a single PRX instance. Tenancy boundaries are enforced at the workspace level:

### Data Isolation

| Resource | Isolation Level |
|----------|----------------|
| Memories | Per-workspace + per-user |
| Configuration | Per-workspace overlay on global defaults |
| Tool policies | Per-workspace overrides |
| Secrets | Per-workspace vault |
| Cost budgets | Per-workspace limits |
| Audit logs | Per-workspace filtering |

### Cross-Workspace Access

By default, users can only access resources within their workspace. Cross-workspace access requires explicit configuration:

```toml
[identity.cross_workspace]
# Allow workspace admins to access other workspaces.
admin_cross_access = false

# Allow specific users to access multiple workspaces.
[[identity.cross_workspace.grants]]
user_id = "shared-bot"
workspaces = ["acme", "beta-corp"]
role = "member"
```

## User Resolution

PRX resolves user identity differently depending on the communication channel:

| Channel | Identity Source | User ID Format |
|---------|----------------|----------------|
| Telegram | Telegram user ID | `telegram:<user_id>` |
| Discord | Discord user ID | `discord:<user_id>` |
| Slack | Slack user ID | `slack:<workspace_id>:<user_id>` |
| CLI | System username | `cli:<username>` |
| API/Gateway | Bearer token / API key | `api:<key_hash>` |
| WeChat | WeChat OpenID | `wechat:<open_id>` |
| QQ | QQ number | `qq:<qq_number>` |

### First-Contact Registration

When a new user interacts with PRX for the first time, an identity record is created automatically: the channel adapter extracts the user identifier, creates a profile with default settings, and assigns the user to the `default_workspace` with the `Member` role.

### Manual User Management

```bash
# List all known users
prx identity list

# Show user details
prx identity info telegram:123456

# Assign a user to a workspace
prx identity assign telegram:123456 --workspace acme --role admin

# Remove a user from a workspace
prx identity remove telegram:123456 --workspace acme

# Set user metadata
prx identity set telegram:123456 --key language --value en
```

## Workspace Management

```bash
# List all workspaces
prx workspace list

# Create a new workspace
prx workspace create acme --display-name "ACME Corp"

# Show workspace details
prx workspace info acme

# Set workspace configuration
prx workspace config acme --set default_provider=anthropic

# Delete a workspace (requires confirmation)
prx workspace delete acme --confirm
```

## User Profiles

User profiles store preferences that personalize the agent's behavior:

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | Unique identifier |
| `display_name` | string | Human-readable name |
| `language` | string | Preferred language (ISO 639-1) |
| `timezone` | string | Preferred timezone (IANA format) |
| `role` | enum | Workspace role (owner, admin, member, guest) |
| `preferences` | map | Key-value preferences (model, verbosity, etc.) |
| `created_at` | datetime | First interaction timestamp |
| `last_seen_at` | datetime | Most recent interaction timestamp |

### Profile Access in System Prompts

The agent's system prompt can include user profile information via template variables (e.g. <code v-pre>{{identity.display_name}}</code>, <code v-pre>{{identity.language}}</code>), resolved from the identity context before the prompt is sent to the LLM.

## Role-Based Access Control

Workspace roles determine what actions a user can perform:

| Permission | Owner | Admin | Member | Guest |
|------------|-------|-------|--------|-------|
| Use agent (chat) | Yes | Yes | Yes | Yes |
| Store memories | Yes | Yes | Yes | No |
| Configure tools | Yes | Yes | No | No |
| Manage users | Yes | Yes | No | No |
| Manage workspace | Yes | No | No | No |
| View audit logs | Yes | Yes | No | No |

## Integration Points

When `identity.enabled = true`, all memory operations are scoped by `workspace:{workspace_id}:user:{user_id}:{key}`, ensuring data isolation. Tool policies can be overridden per-workspace, and token usage is attributed to the identity context for per-user cost reporting.

## Security Notes

- **Identity spoofing** -- the identity system trusts the channel adapter to correctly identify users. Ensure channel authentication is properly configured (bot tokens, OAuth, etc.).
- **Workspace isolation** -- workspace boundaries are enforced in application logic. The underlying storage (SQLite, Postgres) does not provide database-level isolation. A bug in the scoping logic could leak data.
- **Guest access** -- guests have minimal permissions by default. Review the guest role configuration when enabling public-facing agents.
- **Profile data** -- user profiles may contain personal information. Handle in accordance with your privacy policy and applicable regulations.
- **Cross-workspace grants** -- grant cross-workspace access sparingly. Each grant expands the blast radius of a compromised account.

## Related Pages

- [Authentication Overview](/en/prx/auth/)
- [OAuth2 Flows](/en/prx/auth/oauth2)
- [Provider Profiles](/en/prx/auth/profiles)
- [Security Overview](/en/prx/security/)
- [Policy Engine](/en/prx/security/policy-engine)
- [Memory System](/en/prx/memory/)
