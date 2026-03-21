---
title: MCP Server
description: OpenPR includes a built-in MCP server with 34 tools across HTTP, stdio, and SSE transports. Integrate AI assistants like Claude, Codex, and Cursor with your project management.
---

# MCP Server

OpenPR includes a built-in **MCP (Model Context Protocol) server** that exposes 34 tools for AI assistants to manage projects, issues, sprints, labels, comments, proposals, and files. The server supports three transport protocols simultaneously.

## Transport Protocols

| Protocol | Use Case | Endpoint |
|----------|----------|----------|
| **HTTP** | Web integrations, OpenClaw plugins | `POST /mcp/rpc` |
| **stdio** | Claude Desktop, Codex, local CLI | stdin/stdout JSON-RPC |
| **SSE** | Streaming clients, real-time UIs | `GET /sse` + `POST /messages` |

::: tip Multi-Protocol
In HTTP mode, all three protocols are available on a single port: `/mcp/rpc` (HTTP), `/sse` + `/messages` (SSE), and `/health` (health check).
:::

## Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENPR_API_URL` | Yes | API server base URL | `http://localhost:3000` |
| `OPENPR_BOT_TOKEN` | Yes | Bot token with `opr_` prefix | `opr_abc123...` |
| `OPENPR_WORKSPACE_ID` | Yes | Default workspace UUID | `e5166fd1-...` |

### Claude Desktop / Cursor / Codex (stdio)

Add to your MCP client configuration:

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

### HTTP Mode

```bash
# Start the MCP server
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090

# Verify
curl -X POST http://localhost:8090/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### SSE Mode

```bash
# 1. Connect SSE stream (returns session endpoint)
curl -N -H "Accept: text/event-stream" http://localhost:8090/sse
# -> event: endpoint
# -> data: /messages?session_id=<uuid>

# 2. POST request to the returned endpoint
curl -X POST "http://localhost:8090/messages?session_id=<uuid>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"projects.list","arguments":{}}}'
# -> Response arrives via SSE stream as event: message
```

### Docker Compose

```yaml
mcp-server:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: mcp-server
  environment:
    - OPENPR_API_URL=http://api:8080
    - OPENPR_BOT_TOKEN=opr_your_token
    - OPENPR_WORKSPACE_ID=your-workspace-uuid
  ports:
    - "8090:8090"
  command: ["./mcp-server", "--transport", "http", "--bind-addr", "0.0.0.0:8090"]
```

## Tool Reference (34 Tools)

### Projects (5)

| Tool | Required Params | Description |
|------|-----------------|-------------|
| `projects.list` | -- | List all projects in workspace |
| `projects.get` | `project_id` | Get project details with issue counts |
| `projects.create` | `key`, `name` | Create a project |
| `projects.update` | `project_id` | Update name/description |
| `projects.delete` | `project_id` | Delete a project |

### Work Items / Issues (11)

| Tool | Required Params | Description |
|------|-----------------|-------------|
| `work_items.list` | `project_id` | List issues in a project |
| `work_items.get` | `work_item_id` | Get issue by UUID |
| `work_items.get_by_identifier` | `identifier` | Get by human ID (e.g., `API-42`) |
| `work_items.create` | `project_id`, `title` | Create issue with optional state, priority, description, assignee_id, due_at, attachments |
| `work_items.update` | `work_item_id` | Update any field |
| `work_items.delete` | `work_item_id` | Delete an issue |
| `work_items.search` | `query` | Full-text search across all projects |
| `work_items.add_label` | `work_item_id`, `label_id` | Add one label |
| `work_items.add_labels` | `work_item_id`, `label_ids` | Add multiple labels |
| `work_items.remove_label` | `work_item_id`, `label_id` | Remove a label |
| `work_items.list_labels` | `work_item_id` | List labels on an issue |

### Comments (3)

| Tool | Required Params | Description |
|------|-----------------|-------------|
| `comments.create` | `work_item_id`, `content` | Create comment with optional attachments |
| `comments.list` | `work_item_id` | List comments on an issue |
| `comments.delete` | `comment_id` | Delete a comment |

### Files (1)

| Tool | Required Params | Description |
|------|-----------------|-------------|
| `files.upload` | `filename`, `content_base64` | Upload file (base64), returns URL and filename |

### Labels (5)

| Tool | Required Params | Description |
|------|-----------------|-------------|
| `labels.list` | -- | List all workspace labels |
| `labels.list_by_project` | `project_id` | List labels for a project |
| `labels.create` | `name`, `color` | Create label (color: hex, e.g., `#2563eb`) |
| `labels.update` | `label_id` | Update name/color/description |
| `labels.delete` | `label_id` | Delete a label |

### Sprints (4)

| Tool | Required Params | Description |
|------|-----------------|-------------|
| `sprints.list` | `project_id` | List sprints in a project |
| `sprints.create` | `project_id`, `name` | Create sprint with optional start_date, end_date |
| `sprints.update` | `sprint_id` | Update name/dates/status |
| `sprints.delete` | `sprint_id` | Delete a sprint |

### Proposals (3)

| Tool | Required Params | Description |
|------|-----------------|-------------|
| `proposals.list` | `project_id` | List proposals with optional status filter |
| `proposals.get` | `proposal_id` | Get proposal details |
| `proposals.create` | `project_id`, `title`, `description` | Create a governance proposal |

### Members & Search (2)

| Tool | Required Params | Description |
|------|-----------------|-------------|
| `members.list` | -- | List workspace members and roles |
| `search.all` | `query` | Global search across projects, issues, comments |

## Response Format

All MCP tool responses follow this structure:

### Success

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### Error

```json
{
  "code": 400,
  "message": "error description"
}
```

## Bot Token Authentication

The MCP server authenticates via **bot tokens** (prefix `opr_`). Create bot tokens in **Workspace Settings** > **Bot Tokens**.

Each bot token:
- Has a display name (shown in activity feeds)
- Is scoped to one workspace
- Creates a `bot_mcp` user entity for audit trail integrity
- Supports all read/write operations available to workspace members

## Agent Integration

For coding agents, OpenPR provides:

- **AGENTS.md** (`apps/mcp-server/AGENTS.md`) -- Workflow patterns and tool examples for agents.
- **Skill Package** (`skills/openpr-mcp/SKILL.md`) -- Governed skill with workflow templates and scripts.

Recommended agent workflow:
1. Load `AGENTS.md` for tool semantics.
2. Use `tools/list` to enumerate available tools at runtime.
3. Follow workflow patterns: search -> create -> label -> comment.

## Next Steps

- [API Overview](../api/) -- REST API reference
- [Members & Permissions](../workspace/members) -- Bot token management
- [Configuration](../configuration/) -- All environment variables
