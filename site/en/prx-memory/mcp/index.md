---
title: MCP Integration
description: PRX-Memory MCP protocol integration, supported tools, resources, templates, and transport modes.
---

# MCP Integration

PRX-Memory is built as a native MCP (Model Context Protocol) server. It exposes memory operations as MCP tools, governance skills as MCP resources, and payload templates for standardized memory interactions.

## Transport Modes

### stdio

The stdio transport communicates over standard input/output, making it ideal for direct integration with MCP clients like Claude Code, Codex, and OpenClaw.

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

### HTTP

The HTTP transport provides a network-accessible server with additional operational endpoints.

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

HTTP-only endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /metrics` | Prometheus metrics |
| `GET /metrics/summary` | JSON metrics summary |
| `POST /mcp/session/renew` | Renew streaming session |

## MCP Client Configuration

Add PRX-Memory to your MCP client's configuration file:

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/data/memory-db.json"
      }
    }
  }
}
```

::: tip
Use absolute paths for both `command` and `PRX_MEMORY_DB` to avoid path resolution issues.
:::

## MCP Tools

PRX-Memory exposes the following tools through the MCP `tools/call` interface:

### Core Memory Operations

| Tool | Description |
|------|-------------|
| `memory_store` | Store a new memory entry with text, scope, tags, and metadata |
| `memory_recall` | Recall memories matching a query using lexical, vector, and reranked search |
| `memory_update` | Update an existing memory entry |
| `memory_forget` | Delete a memory entry by ID |

### Bulk Operations

| Tool | Description |
|------|-------------|
| `memory_export` | Export all memories to a portable JSON format |
| `memory_import` | Import memories from an export |
| `memory_migrate` | Migrate between storage backends |
| `memory_reembed` | Re-embed all memories with the current embedding model |
| `memory_compact` | Compact and optimize storage |

### Evolution

| Tool | Description |
|------|-------------|
| `memory_evolve` | Evolve memory using train/holdout acceptance with constraint gating |

### Skill Discovery

| Tool | Description |
|------|-------------|
| `memory_skill_manifest` | Return the skill manifest for governance skills |

## MCP Resources

PRX-Memory exposes governance skill packages as MCP resources:

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/list", "params": {}}
```

Read a specific resource:

```json
{"jsonrpc": "2.0", "id": 2, "method": "resources/read", "params": {"uri": "prx://skills/governance"}}
```

## Resource Templates

Payload templates help clients construct standardized memory operations:

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/templates/list", "params": {}}
```

Use a template to generate a store payload:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "prx://templates/memory-store?text=Pitfall:+always+handle+errors&scope=global"
  }
}
```

## Streaming Sessions

The HTTP transport supports Server-Sent Events (SSE) for streaming responses. Sessions have a configurable TTL:

```bash
PRX_MEMORY_STREAM_SESSION_TTL_MS=300000  # 5 minutes
```

Renew a session before it expires:

```bash
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"
```

## Standardization Profiles

PRX-Memory supports two standardization profiles that control how memory entries are tagged and validated:

| Profile | Description |
|---------|-------------|
| `zero-config` | Minimal constraints, accepts any tags and scopes (default) |
| `governed` | Strict tag normalization, ratio bounds, and quality constraints |

```bash
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend
```

## Next Steps

- [Quick Start](../getting-started/quickstart) -- First store and recall operations
- [Configuration Reference](../configuration/) -- All environment variables
- [Troubleshooting](../troubleshooting/) -- Common MCP issues
