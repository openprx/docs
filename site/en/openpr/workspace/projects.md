---
title: Project Management
description: Projects organize issues, sprints, and labels within a workspace. Learn how to create and manage projects in OpenPR.
---

# Project Management

A **project** lives inside a workspace and serves as the container for issues, sprints, labels, and governance proposals. Each project has a unique **key** (e.g., `API`, `FRONT`, `OPS`) that prefixes issue identifiers.

## Creating a Project

Navigate to your workspace and click **New Project**:

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| Name | Yes | Display name | "Backend API" |
| Key | Yes | 2-5 character prefix for issues | "API" |
| Description | No | Project summary | "REST API and business logic" |

The key must be unique within the workspace and determines issue identifiers: `API-1`, `API-2`, etc.

## Project Dashboard

Each project provides:

- **Board** -- Kanban view with drag-and-drop columns (Backlog, To Do, In Progress, Done).
- **Issues** -- List view with filtering, sorting, and full-text search.
- **Sprints** -- Sprint planning and cycle management. See [Sprints](../issues/sprints).
- **Labels** -- Project-scoped labels for categorization. See [Labels](../issues/labels).
- **Settings** -- Project name, key, description, and member settings.

## Issue Counts

The project overview shows issue counts by state:

| State | Description |
|-------|-------------|
| Backlog | Ideas and future work |
| To Do | Planned for the current cycle |
| In Progress | Actively being worked on |
| Done | Completed work |

## API Reference

```bash
# List projects in a workspace
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects

# Create a project
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Backend API", "key": "API"}'

# Get project with issue counts
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects/<project_id>
```

## MCP Tools

| Tool | Params | Description |
|------|--------|-------------|
| `projects.list` | -- | List all projects in the workspace |
| `projects.get` | `project_id` | Get project details with issue counts |
| `projects.create` | `key`, `name` | Create a new project |
| `projects.update` | `project_id` | Update name or description |
| `projects.delete` | `project_id` | Delete a project |

## Next Steps

- [Issues](../issues/) -- Create and manage issues within projects
- [Members](./members) -- Manage project access through workspace roles
