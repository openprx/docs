---
title: Quick Start
description: Get OpenPR running and create your first workspace, project, and issues in 5 minutes.
---

# Quick Start

This guide walks you through setting up OpenPR and creating your first workspace, project, and issues. It assumes you have already completed the [installation](./installation).

## Step 1: Start OpenPR

If you haven't already, start the services:

```bash
cd openpr
docker-compose up -d
```

Wait for all services to be healthy:

```bash
docker-compose ps
```

## Step 2: Register Your Admin Account

Open http://localhost:3000 in your browser. Click **Register** and create your account.

::: tip First User is Admin
The first registered user automatically receives the **admin** role. This user can manage all workspaces, projects, and system settings.
:::

## Step 3: Create a Workspace

After logging in, create your first workspace:

1. Click **Create Workspace** on the dashboard.
2. Enter a name (e.g., "My Team") and a slug (e.g., "my-team").
3. Click **Create**.

A workspace is the top-level container for all your projects and members.

## Step 4: Create a Project

Inside your workspace:

1. Click **New Project**.
2. Enter a name (e.g., "Backend API") and a project key (e.g., "API"). The key is used as a prefix for issue identifiers (e.g., API-1, API-2).
3. Click **Create**.

## Step 5: Create Issues

Navigate to your project and create issues:

1. Click **New Issue**.
2. Enter a title and description.
3. Set the state (backlog, todo, in_progress, or done).
4. Optionally set priority (low, medium, high, urgent), assignee, and labels.
5. Click **Create**.

Issues can also be created via the API or MCP server:

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

## Step 6: Set Up the Kanban Board

Navigate to the **Board** view in your project. Issues are organized into columns by state:

| Column | State | Description |
|--------|-------|-------------|
| Backlog | `backlog` | Ideas and future work |
| To Do | `todo` | Planned for current cycle |
| In Progress | `in_progress` | Actively being worked on |
| Done | `done` | Completed work |

Drag and drop issues between columns to update their state.

## Step 7: Invite Team Members

Go to **Workspace Settings** > **Members**:

1. Click **Invite Member**.
2. Enter the email address.
3. Select a role: **Owner**, **Admin**, or **Member**.

| Role | Permissions |
|------|------------|
| Owner | Full access, can delete workspace |
| Admin | Manage projects, members, settings |
| Member | Create and manage issues, comments |

## Step 8: Connect AI Assistants (Optional)

Set up the MCP server to let AI assistants manage your projects:

1. Go to **Workspace Settings** > **Bot Tokens**.
2. Create a new bot token. It will have the `opr_` prefix.
3. Configure your AI assistant with the token.

Example Claude Desktop configuration:

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

The AI assistant can now list projects, create issues, manage sprints, and more through 34 MCP tools.

## What's Next?

- [Workspace Management](../workspace/) -- Learn about workspace organization and member roles
- [Issues & Workflow](../issues/) -- Deep dive into issue tracking and state management
- [Sprint Planning](../issues/sprints) -- Set up sprint cycles
- [Governance Center](../governance/) -- Enable proposals, voting, and trust scores
- [API Reference](../api/) -- Integrate with external tools
- [MCP Server](../mcp-server/) -- Full MCP tool reference for AI assistants
