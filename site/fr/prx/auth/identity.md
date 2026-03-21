---
title: Identity Management
description: Workspace and user scoping, multi-tenancy, and identity context propagation in PRX.
---

# Identity Management

Le systeme d'identite de PRX fournit un cadrage au niveau de l'espace de travail et de l'utilisateur pour toutes les operations d'agent. In multi-tenant deployments, identity context determine which memories, configurations, tools, et resources a given session can access. The identity module is the foundation for access control, journalisation d'audit, et personalization.

## Apercu

Chaque session PRX opere dans an identity context that includes:

| Component | Description |
|-----------|-------------|
| **User** | L'humain ou le bot interagissant avec l'agent |
| **Workspace** | A logical boundary grouping users, configurations, and data |
| **Session** | A single conversation between a user and l'agent |
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

Each espace de travail can have its own configuration overlay:

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

La structure `IdentityContext` est transmise dans tout le pipeline de requetes. Elle contient : `user_id`, `display_name`, `espace de travail_id`, `session_id`, `role` (Owner/Admin/Member/Guest), `channel`, and arbitrary `metadata`.

Le contexte d'identite se propage a travers chaque couche: la passerelle l'extrait des requetes entrantes, la boucle de l'agent uses it to scope memory et tool access, the systeme de memoire namespaces data by espace de travail et user, cost tracking attributes usage, et the journal d'audit records the actor.

## Multi-Tenancy

PRX prend en charge multi-tenant deployments where multiple organizations share un seul PRX instance. Tenancy boundaries are enforced au espace de travail level:

### Data Isolation

| Resource | Isolation Level |
|----------|----------------|
| Memories | Per-espace de travail + per-user |
| Configuration | Per-espace de travail overlay on global defaults |
| Tool policies | Per-espace de travail overrides |
| Secrets | Per-espace de travail vault |
| Cost budgets | Per-espace de travail limits |
| Audit logs | Per-espace de travail filtering |

### Cross-Workspace Access

By default, users ne peut que access resources within their espace de travail. Cross-espace de travail access necessite explicit configuration:

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

PRX resolves user identity differently en fonction de the communication channel:

| Channel | Identity Source | User ID Format |
|---------|----------------|----------------|
| Telegram | Telegram user ID | `telegram:<user_id>` |
| Discord | Discord user ID | `discord:<user_id>` |
| Slack | Slack user ID | `slack:<espace de travail_id>:<user_id>` |
| CLI | System username | `cli:<username>` |
| API/Gateway | Bearer token / API key | `api:<key_hash>` |
| WeChat | WeChat OpenID | `wechat:<open_id>` |
| QQ | QQ number | `qq:<qq_number>` |

### First-Contact Registration

Lorsqu'un nouvel utilisateur interagit avec PRX pour la premiere fois, un enregistrement d'identite est cree automatiquement: the channel adapter extracts l'utilisateur identifier, creates a profile with default settings, et assigns l'utilisateur vers le `default_espace de travail` avec le `Member` role.

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

User profiles store preferences that personalize la reponse de l'agent behavior:

| Champ | Type | Description |
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

L'agent's system prompt can include user profile information via template variables (e.g. <code v-pre>{{identity.display_name}}</code>, <code v-pre>{{identity.language}}</code>), resolved depuis le identity context before the prompt est envoye a le LLM.

## Role-Based Access Control

Workspace roles determine what actions a user can perform:

| Permission | Owner | Admin | Member | Guest |
|------------|-------|-------|--------|-------|
| Use agent (chat) | Oui | Oui | Oui | Oui |
| Store memories | Oui | Oui | Oui | Non |
| Configure tools | Oui | Oui | Non | Non |
| Manage users | Oui | Oui | Non | Non |
| Manage espace de travail | Oui | Non | Non | Non |
| View journal d'audits | Oui | Oui | Non | Non |

## Integration Points

When `identity.enabled = true`, all memory operations are scoped by `espace de travail:{espace de travail_id}:user:{user_id}:{key}`, ensuring data isolation. Tool policies peut etre overridden per-espace de travail, et token usage is attributed vers le identity context for per-user cost reporting.

## Securite Nontes

- **Identity spoofing** -- the identity system trusts the channel adapter to correctly identify users. Ensure channel authentication is properly configured (bot tokens, OAuth, etc.).
- **Workspace isolation** -- espace de travail boundaries are enforced in application logic. The underlying storage (SQLite, Postgres) ne fait pas provide database-level isolation. A bug in the scoping logic could leak data.
- **Guest access** -- guests have minimal permissions par defaut. Review the guest role configuration when enabling public-facing agents.
- **Profile data** -- user profiles may contain personal information. Handle in accordance with your privacy policy and applicable regulations.
- **Cross-espace de travail grants** -- grant cross-espace de travail access sparingly. Each grant expands the blast radius of a compromised account.

## Voir aussi Pages

- [Authentication Overview](/fr/prx/auth/)
- [OAuth2 Flows](/fr/prx/auth/oauth2)
- [Provider Profiles](/fr/prx/auth/profiles)
- [Security Overview](/fr/prx/security/)
- [Moteur de politiques](/fr/prx/security/policy-engine)
- [Memory System](/fr/prx/memory/)
