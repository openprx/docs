---
title: Issues & Tracking
description: OpenPR issues are the core work unit. Track tasks, bugs, and features with states, priorities, assignees, labels, and comments.
---

# Issues & Tracking

Issues (also called work items) are the core work unit in OpenPR. They represent tasks, bugs, features, or any trackable piece of work within a project.

## Issue Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Title | string | Yes | Short description of the work |
| Description | markdown | No | Detailed description with formatting |
| State | enum | Yes | Workflow state (see [Workflow](./workflow)) |
| Priority | enum | No | `low`, `medium`, `high`, `urgent` |
| Assignee | user | No | Team member responsible for the issue |
| Labels | list | No | Categorization tags (see [Labels](./labels)) |
| Sprint | sprint | No | Sprint cycle the issue belongs to |
| Due Date | datetime | No | Target completion date |
| Attachments | files | No | Attached files (images, docs, logs) |

## Issue Identifiers

Each issue has a human-readable identifier composed of the project key and a sequential number:

```
API-1, API-2, API-3, ...
FRONT-1, FRONT-2, ...
```

You can look up any issue by its identifier across all projects in the workspace.

## Creating Issues

### Via the Web UI

1. Navigate to your project.
2. Click **New Issue**.
3. Fill in the title, description, and optional fields.
4. Click **Create**.

### Via the REST API

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Implement user settings page",
    "description": "Add a settings page where users can update their profile.",
    "state": "todo",
    "priority": "medium",
    "assignee_id": "<user_uuid>"
  }'
```

### Via MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "work_items.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "title": "Implement user settings page",
      "state": "todo",
      "priority": "medium"
    }
  }
}
```

## Comments

Issues support threaded comments with markdown formatting and file attachments:

```bash
# Add a comment
curl -X POST http://localhost:8080/api/issues/<issue_id>/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content": "Fixed in commit abc123. Ready for review."}'
```

Comments are also available via MCP tools: `comments.create`, `comments.list`, `comments.delete`.

## Activity Feed

Every change to an issue is recorded in the activity feed:

- State changes
- Assignee changes
- Label additions/removals
- Comments
- Priority updates

The activity feed provides a complete audit trail for each issue.

## File Attachments

Issues and comments support file attachments including images, documents, logs, and archives. Upload via the API:

```bash
curl -X POST http://localhost:8080/api/v1/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@screenshot.png"
```

Or via MCP:

```json
{
  "method": "tools/call",
  "params": {
    "name": "files.upload",
    "arguments": {
      "filename": "screenshot.png",
      "content_base64": "<base64_encoded_content>"
    }
  }
}
```

Supported file types: images (PNG, JPG, GIF, WebP), documents (PDF, TXT), data (JSON, CSV, XML), archives (ZIP, GZ), and logs.

## Search

OpenPR provides full-text search across all issues, comments, and proposals using PostgreSQL FTS:

```bash
# Search via API
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/search?q=authentication+bug"

# Search via MCP
# work_items.search: search within a project
# search.all: global search across all projects
```

## MCP Tools

| Tool | Params | Description |
|------|--------|-------------|
| `work_items.list` | `project_id` | List issues in a project |
| `work_items.get` | `work_item_id` | Get issue by UUID |
| `work_items.get_by_identifier` | `identifier` | Get by human ID (e.g., `API-42`) |
| `work_items.create` | `project_id`, `title` | Create an issue |
| `work_items.update` | `work_item_id` | Update any field |
| `work_items.delete` | `work_item_id` | Delete an issue |
| `work_items.search` | `query` | Full-text search |
| `comments.create` | `work_item_id`, `content` | Add a comment |
| `comments.list` | `work_item_id` | List comments |
| `comments.delete` | `comment_id` | Delete a comment |
| `files.upload` | `filename`, `content_base64` | Upload a file |

## Next Steps

- [Workflow States](./workflow) -- Understand the issue lifecycle
- [Sprint Planning](./sprints) -- Organize issues into sprint cycles
- [Labels](./labels) -- Categorize issues with labels
