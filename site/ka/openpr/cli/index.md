---
title: CLI ცნობარი
---

# CLI ცნობარი

OpenPR-ს `openpr-mcp` ბინარში ჩაშენებული ბრძანებ-ხაზ-ინტერფეისი აქვს. MCP სერვერის გარდა, ის პროექტების, work item-ების, კომენტარების, ეტიკეტების, sprint-ების და სხვა ტერმინალიდან პირდაპირ მართვის ბრძანებებს გვაძლევს.

## ინსტალაცია

CLI `mcp-server` crate-ის ნაწილია. Build-ის შემდეგ ბინარი `openpr-mcp` ეწოდება.

```bash
cargo build --release -p mcp-server
```

## გლობალური ნიშნები

ეს ნიშნები ყველა ბრძანებაზე გამოიყენება:

| ნიშანი | აღწერა | ნაგულისხმევი |
|------|-------------|---------|
| `--api-url <URL>` | API სერვერ-endpoint | `http://localhost:8080` |
| `--bot-token <TOKEN>` | ავთენტ-ტოკენი (`opr_` პრეფიქსი) | -- |
| `--workspace-id <UUID>` | ოპერაციებისთვის სამუშაო სივრც-კონტექსტი | -- |
| `--format json\|table` | გამოსავლის ფორმატი | `table` |

ეს გარემო-ცვლადებითაც შეიძლება დაყენდეს:

```bash
export OPENPR_API_URL=http://localhost:8080
export OPENPR_BOT_TOKEN=opr_your_token_here
export OPENPR_WORKSPACE_ID=your-workspace-uuid
```

## ბრძანებები

### serve -- MCP სერვერის გაშვება

MCP სერვერის გაშვება AI ინსტრუმენტ-ინტეგრაციისთვის.

```bash
# HTTP transport (default)
openpr-mcp serve --transport http --port 8090

# Stdio transport (for direct integration)
openpr-mcp serve --transport stdio
```

### projects -- პროექტ-მართვა

```bash
# List all projects in the workspace
openpr-mcp projects list --format table

# Get details of a specific project
openpr-mcp projects get <project_id>

# Create a new project
openpr-mcp projects create --name "My Project" --key "MP"
```

### work-items -- Work Item-მართვა

```bash
# List work items with filters
openpr-mcp work-items list --project-id <id> --state todo
openpr-mcp work-items list --project-id <id> --state in_progress --assignee-id <user_id>

# Get a specific work item
openpr-mcp work-items get <id>

# Create a work item
openpr-mcp work-items create --project-id <id> --title "Fix bug" --state todo
openpr-mcp work-items create --project-id <id> --title "New feature" --state backlog --priority high

# Update a work item
openpr-mcp work-items update <id> --state in_progress --assignee-id <user_id>
openpr-mcp work-items update <id> --state done --priority low

# Search work items by text
openpr-mcp work-items search --query "authentication"
```

### comments -- კომენტარ-მართვა

```bash
# List comments on a work item
openpr-mcp comments list --work-item-id <id>

# Add a comment
openpr-mcp comments create --work-item-id <id> --content "Fixed in commit abc123"
```

### labels -- ეტიკეტ-მართვა

```bash
# List workspace-level labels
openpr-mcp labels list --workspace

# List project-level labels
openpr-mcp labels list --project-id <id>
```

### sprints -- Sprint-მართვა

```bash
# List sprints for a project
openpr-mcp sprints list --project-id <id>
```

### search -- გლობალური ძებნა

```bash
# Search across all entities
openpr-mcp search --query "bug"
```

### files -- ფაილ-დანართები

```bash
# Upload a file to a work item
openpr-mcp files upload --work-item-id <id> --path ./screenshot.png
```

## გამოყენებ-მაგალითები

### ტიპური სამუშაო ნაკადი

```bash
# Set up credentials
export OPENPR_API_URL=https://openpr.example.com
export OPENPR_BOT_TOKEN=opr_abc123
export OPENPR_WORKSPACE_ID=550e8400-e29b-41d4-a716-446655440000

# List projects
openpr-mcp projects list

# View todo items for a project
openpr-mcp work-items list --project-id <id> --state todo --format table

# Pick up a work item
openpr-mcp work-items update <item_id> --state in_progress --assignee-id <your_user_id>

# Add a comment when done
openpr-mcp comments create --work-item-id <item_id> --content "Completed. See PR #42."

# Mark as done
openpr-mcp work-items update <item_id> --state done
```

### JSON გამოსავალი სკრიპტებისთვის

`--format json` გამოიყენე `jq`-ზე ან სხვა ინსტრუმენტებზე მილ-გასაშვებლად:

```bash
# Get all in-progress items as JSON
openpr-mcp work-items list --project-id <id> --state in_progress --format json

# Count items by state
openpr-mcp work-items list --project-id <id> --format json | jq '.[] | .state' | sort | uniq -c
```

## იხ. ასევე

- [MCP სერვერი](../mcp-server/) -- AI-აგენტებისთვის MCP ინსტრუმენტ-ინტეგრაცია
- [API ცნობარი](../api/) -- სრული REST API დოკ
- [სამუშაო ნაკად-სტატუსები](../issues/workflow) -- issue სტატუს-მართვა და custom სამუშაო ნაკადები
