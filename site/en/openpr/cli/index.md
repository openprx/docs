# CLI Reference

OpenPR includes a command-line interface built into the `openpr-mcp` binary. In addition to running the MCP server, it provides commands for managing projects, work items, comments, labels, sprints, and more directly from the terminal.

## Installation

The CLI is available as part of the `mcp-server` crate. After building, the binary is named `openpr-mcp`.

```bash
cargo build --release -p mcp-server
```

## Global Flags

These flags apply to all commands:

| Flag | Description | Default |
|------|-------------|---------|
| `--api-url <URL>` | API server endpoint | `http://localhost:8080` |
| `--bot-token <TOKEN>` | Authentication token (prefix `opr_`) | -- |
| `--workspace-id <UUID>` | Workspace context for operations | -- |
| `--format json\|table` | Output format | `table` |

You can also set these via environment variables:

```bash
export OPENPR_API_URL=http://localhost:8080
export OPENPR_BOT_TOKEN=opr_your_token_here
export OPENPR_WORKSPACE_ID=your-workspace-uuid
```

## Commands

### serve -- Start MCP Server

Run the MCP server for AI tool integration.

```bash
# HTTP transport (default)
openpr-mcp serve --transport http --port 8090

# Stdio transport (for direct integration)
openpr-mcp serve --transport stdio
```

### projects -- Project Management

```bash
# List all projects in the workspace
openpr-mcp projects list --format table

# Get details of a specific project
openpr-mcp projects get <project_id>

# Create a new project
openpr-mcp projects create --name "My Project" --key "MP"
```

### work-items -- Work Item Management

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

### comments -- Comment Management

```bash
# List comments on a work item
openpr-mcp comments list --work-item-id <id>

# Add a comment
openpr-mcp comments create --work-item-id <id> --content "Fixed in commit abc123"
```

### labels -- Label Management

```bash
# List workspace-level labels
openpr-mcp labels list --workspace

# List project-level labels
openpr-mcp labels list --project-id <id>
```

### sprints -- Sprint Management

```bash
# List sprints for a project
openpr-mcp sprints list --project-id <id>
```

### search -- Global Search

```bash
# Search across all entities
openpr-mcp search --query "bug"
```

### files -- File Attachments

```bash
# Upload a file to a work item
openpr-mcp files upload --work-item-id <id> --path ./screenshot.png
```

## Usage Examples

### Typical Workflow

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

### JSON Output for Scripting

Use `--format json` to get machine-readable output suitable for piping to `jq` or other tools:

```bash
# Get all in-progress items as JSON
openpr-mcp work-items list --project-id <id> --state in_progress --format json

# Count items by state
openpr-mcp work-items list --project-id <id> --format json | jq '.[] | .state' | sort | uniq -c
```

## See Also

- [MCP Server](../mcp-server/) -- MCP tool integration for AI agents
- [API Reference](../api/) -- Full REST API documentation
- [Workflow States](../issues/workflow) -- Issue state management and custom workflows
