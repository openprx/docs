---
title: Sprint Management
description: Plan and track work in time-boxed iterations with OpenPR sprints. Create sprints, assign issues, and monitor progress.
---

# Sprint Management

Sprints are time-boxed iterations for organizing and tracking work. Each sprint belongs to a project and has a start date, end date, and a set of assigned issues.

## Creating a Sprint

### Via the Web UI

1. Navigate to your project.
2. Go to the **Sprints** section.
3. Click **New Sprint**.
4. Enter the sprint name, start date, and end date.

### Via the API

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/sprints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Sprint 1",
    "start_date": "2026-03-24",
    "end_date": "2026-04-07"
  }'
```

### Via MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "sprints.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "name": "Sprint 1",
      "start_date": "2026-03-24",
      "end_date": "2026-04-07"
    }
  }
}
```

## Sprint Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | string | Yes | Sprint name (e.g., "Sprint 1", "Q1 Week 3") |
| Start Date | date | No | Sprint start date |
| End Date | date | No | Sprint end date |
| Status | enum | Auto | Active, completed, or planned |

## Assigning Issues to Sprints

Assign issues to a sprint by updating the issue's `sprint_id`:

```bash
curl -X PATCH http://localhost:8080/api/issues/<issue_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"sprint_id": "<sprint_uuid>"}'
```

Or via the web UI, drag issues into the sprint section or use the issue detail panel.

## Sprint Planning Workflow

A typical sprint planning workflow:

1. **Create the sprint** with start and end dates.
2. **Review the backlog** -- identify issues to include.
3. **Move issues** from Backlog/To Do into the sprint.
4. **Set priorities** and assignees for sprint issues.
5. **Start the sprint** -- team begins work.
6. **Track progress** on the board and sprint view.
7. **Complete the sprint** -- review done/remaining items.

## MCP Tools

| Tool | Params | Description |
|------|--------|-------------|
| `sprints.list` | `project_id` | List sprints in a project |
| `sprints.create` | `project_id`, `name` | Create a sprint with optional dates |
| `sprints.update` | `sprint_id` | Update name, dates, or status |
| `sprints.delete` | `sprint_id` | Delete a sprint |

## Next Steps

- [Workflow States](./workflow) -- Understand issue state transitions
- [Labels](./labels) -- Categorize sprint issues
- [Issues Overview](./index) -- Full issue field reference
