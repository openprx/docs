---
title: Labels
description: Organize and categorize issues with color-coded labels in OpenPR. Labels can be workspace-wide or project-scoped.
---

# Labels

Labels provide a flexible way to categorize and filter issues. Each label has a name, color, and optional description.

## Creating Labels

### Via the Web UI

1. Navigate to your project or workspace settings.
2. Go to **Labels**.
3. Click **New Label**.
4. Enter a name (e.g., "bug", "feature", "documentation").
5. Choose a color (hex format, e.g., `#ef4444` for red).
6. Click **Create**.

### Via the API

```bash
curl -X POST http://localhost:8080/api/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "bug",
    "color": "#ef4444",
    "description": "Something is not working"
  }'
```

### Via MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "labels.create",
    "arguments": {
      "name": "bug",
      "color": "#ef4444"
    }
  }
}
```

## Common Label Schemes

Here are some popular label organizations:

### By Type

| Label | Color | Description |
|-------|-------|-------------|
| `bug` | `#ef4444` (red) | Something is broken |
| `feature` | `#3b82f6` (blue) | New feature request |
| `enhancement` | `#8b5cf6` (purple) | Improvement to existing feature |
| `documentation` | `#06b6d4` (cyan) | Documentation updates |
| `refactor` | `#f59e0b` (amber) | Code refactoring |

### By Priority

| Label | Color | Description |
|-------|-------|-------------|
| `P0-critical` | `#dc2626` (red) | Production down |
| `P1-high` | `#ea580c` (orange) | Major feature broken |
| `P2-medium` | `#eab308` (yellow) | Non-critical issue |
| `P3-low` | `#22c55e` (green) | Nice to have |

## Adding Labels to Issues

### Via the Web UI

Open an issue and click the **Labels** field to add or remove labels.

### Via the API

```bash
# Add a label to an issue
curl -X POST http://localhost:8080/api/issues/<issue_id>/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"label_id": "<label_uuid>"}'
```

### Via MCP

| Tool | Params | Description |
|------|--------|-------------|
| `work_items.add_label` | `work_item_id`, `label_id` | Add one label |
| `work_items.add_labels` | `work_item_id`, `label_ids` | Add multiple labels |
| `work_items.remove_label` | `work_item_id`, `label_id` | Remove a label |
| `work_items.list_labels` | `work_item_id` | List labels on an issue |

## Label Management MCP Tools

| Tool | Params | Description |
|------|--------|-------------|
| `labels.list` | -- | List all workspace labels |
| `labels.list_by_project` | `project_id` | List labels for a project |
| `labels.create` | `name`, `color` | Create a label |
| `labels.update` | `label_id` | Update name, color, or description |
| `labels.delete` | `label_id` | Delete a label |

## Next Steps

- [Issues Overview](./index) -- Full issue field reference
- [Workflow States](./workflow) -- Issue lifecycle management
- [Sprint Planning](./sprints) -- Organize labeled issues into sprints
