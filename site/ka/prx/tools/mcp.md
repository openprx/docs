---
title: MCP ინტეგრაცია
description: Model Context Protocol client for connecting to external MCP servers via stdio or HTTP transports with dynamic tool discovery and namespacing.
---

# MCP Integration

PRX implements a Model Context Protocol (MCP) client that connects to external MCP servers and exposes their tools to the agent. MCP is an open protocol that standardizes how LLM applications communicate with external tool providers, enabling PRX to integrate with a growing ecosystem of MCP-compatible servers for file systems, databases, APIs, and more.

The `mcp` tool is feature-gated and requires `mcp.enabled = true` with at least one server defined. PRX supports both stdio transport (local process communication) and HTTP transport (remote server communication). Tools from MCP servers are dynamically discovered at runtime via the `tools/list` protocol method and are namespaced to avoid collisions with built-in tools.

PRX also supports workspace-local `mcp.json` discovery, following the same format used by VS Code and Claude Desktop, making it easy to share MCP server configurations across tools.

## კონფიგურაცია

### Server Definitions in config.toml

Define MCP servers under the `[mcp.servers]` section:

```toml
[mcp]
enabled = true

# ── Stdio transport (local process) ──────────────────────────
[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
enabled = true
startup_timeout_ms = 10000
request_timeout_ms = 30000
tool_name_prefix = "fs"

[mcp.servers.github]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_xxxxxxxxxxxx" }
tool_name_prefix = "gh"

[mcp.servers.sqlite]
transport = "stdio"
command = "uvx"
args = ["mcp-server-sqlite", "--db-path", "/home/user/data.db"]
tool_name_prefix = "sql"

# ── HTTP transport (remote server) ───────────────────────────
[mcp.servers.remote-api]
transport = "http"
url = "https://mcp.example.com/sse"
request_timeout_ms = 60000
tool_name_prefix = "api"

[mcp.servers.streamable]
transport = "streamable_http"
url = "http://localhost:8090/mcp"
request_timeout_ms = 30000
```

### Per-Server Configuration

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | Enable or disable this server |
| `transport` | `string` | `"stdio"` | Transport type: `"stdio"`, `"http"`, `"streamable_http"` |
| `command` | `string` | -- | Command for stdio transport (e.g., `"npx"`, `"uvx"`, `"node"`) |
| `args` | `string[]` | `[]` | Arguments for the stdio command |
| `url` | `string` | -- | URL for HTTP transport |
| `env` | `map` | `{}` | Environment variables for stdio process |
| `startup_timeout_ms` | `u64` | `10000` | Maximum time to wait for server startup |
| `request_timeout_ms` | `u64` | `30000` | Per-request timeout |
| `tool_name_prefix` | `string` | `"mcp"` | Prefix for tool names (e.g., `"fs"` results in `"fs_read_file"`) |
| `allow_tools` | `string[]` | `[]` | Tool allowlist (empty = allow all discovered tools) |
| `deny_tools` | `string[]` | `[]` | Tool denylist (takes precedence over allowlist) |

### Workspace-local mcp.json

PRX discovers MCP servers from a workspace-local `mcp.json` file, following the same format as VS Code and Claude Desktop:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./my-mcp-server/index.js"],
      "env": { "API_KEY": "..." }
    },
    "python-tools": {
      "command": "python3",
      "args": ["-m", "my_mcp_module"],
      "env": {}
    }
  }
}
```

Place this file in the workspace root directory. PRX checks for `mcp.json` on startup and when tools are refreshed.

**Safe launcher whitelist**: Commands in `mcp.json` are restricted to a whitelist of safe launchers:

| Launcher | Language / Platform |
|----------|-------------------|
| `npx` | Node.js (npm) |
| `node` | Node.js |
| `python` | Python |
| `python3` | Python 3 |
| `uvx` | Python (uv) |
| `uv` | Python (uv) |
| `deno` | Deno |
| `bun` | Bun |
| `docker` | Docker |
| `cargo` | Rust |
| `go` | Go |
| `ruby` | Ruby |
| `php` | PHP |
| `dotnet` | .NET |
| `java` | Java |

Commands not in this whitelist are rejected to prevent arbitrary command execution through `mcp.json` files.

## გამოყენება

### Dynamic Tool Discovery

MCP tools are discovered automatically when the MCP client connects to servers. The agent sees them as regular tools in its tool registry:

```
Available MCP tools:
  fs_read_file          - Read the contents of a file
  fs_write_file         - Write content to a file
  fs_list_directory     - List directory contents
  gh_create_issue       - Create a GitHub issue
  gh_search_code        - Search code on GitHub
  sql_query             - Execute a SQL query
  sql_list_tables       - List database tables
```

### Tool Namespacing

Each MCP server's tools are prefixed with the configured `tool_name_prefix` to avoid name collisions:

- Server `filesystem` with prefix `"fs"` exposes `fs_read_file`, `fs_write_file`, etc.
- Server `github` with prefix `"gh"` exposes `gh_create_issue`, `gh_search_code`, etc.
- Server `sqlite` with prefix `"sql"` exposes `sql_query`, `sql_list_tables`, etc.

If two servers expose a tool with the same base name, the prefix distinguishes them.

### Tool Refresh

The `mcp` tool supports a `refresh()` hook that re-discovers tools before each agent turn. This means:

- New tools added to an MCP server become available without restarting PRX
- Removed tools are no longer offered to the LLM
- Tool schema changes are reflected immediately

### Agent Invocation

The agent invokes MCP tools the same way as built-in tools:

```json
{
  "name": "gh_create_issue",
  "arguments": {
    "owner": "openprx",
    "repo": "prx",
    "title": "Add support for MCP resource subscriptions",
    "body": "PRX should support MCP resource change notifications..."
  }
}
```

PRX routes this call to the appropriate MCP server, sends the request via the configured transport, and returns the result to the LLM.

## Transport Details

### Stdio Transport

The stdio transport spawns the MCP server as a child process and communicates via stdin/stdout using JSON-RPC:

```
PRX Process
    │
    ├── stdin  ──→ MCP Server Process
    └── stdout ←── MCP Server Process
```

- Server is started on first use (lazy initialization) or at daemon startup
- Process lifecycle is managed by PRX (auto-restart on crash)
- stderr output from the server is captured for diagnostics

### HTTP Transport

The HTTP transport connects to a remote MCP server via HTTP:

```
PRX  ──HTTP/SSE──→  Remote MCP Server
```

- Supports Server-Sent Events (SSE) for streaming responses
- Connection is established on first tool call
- Supports authentication via headers (configurable per-server)

### Streamable HTTP Transport

The streamable HTTP transport uses the newer MCP streamable HTTP protocol:

```
PRX  ──HTTP POST──→  MCP Server (streamable)
     ←──Streaming──
```

This transport is more efficient than SSE for bidirectional communication and is the recommended transport for new MCP server implementations.

## Parameters

The MCP tool itself does not have fixed parameters. Each MCP server exposes its own tools with their own parameter schemas, discovered via the `tools/list` protocol method. The parameters are defined by the individual MCP server implementations.

The MCP meta-tool (used for management) supports:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | No | -- | Management action: `"status"`, `"refresh"`, `"servers"` |

## უსაფრთხოება

### Environment Variable Sanitization

PRX automatically strips dangerous environment variables from MCP server processes to prevent injection attacks:

| Stripped Variable | Risk |
|------------------|------|
| `LD_PRELOAD` | Library injection (Linux) |
| `DYLD_INSERT_LIBRARIES` | Library injection (macOS) |
| `NODE_OPTIONS` | Node.js runtime manipulation |
| `PYTHONPATH` | Python module path hijacking |
| `PYTHONSTARTUP` | Python startup script injection |
| `RUBYOPT` | Ruby runtime options injection |
| `PERL5OPT` | Perl runtime options injection |

Only the explicitly configured `env` variables plus safe system variables are passed to the child process.

### Command Whitelist for mcp.json

The `mcp.json` file format is convenient but potentially dangerous. PRX mitigates this by restricting commands to a whitelist of known-safe launchers. This prevents a malicious `mcp.json` from executing arbitrary binaries.

### Tool Allow/Deny Lists

Per-server tool filtering controls which tools are exposed to the agent:

```toml
[mcp.servers.filesystem]
# Only expose these tools
allow_tools = ["read_file", "list_directory"]
# Block these tools even if discovered
deny_tools = ["write_file", "delete_file"]
```

The deny list takes precedence over the allow list. This enables a defense-in-depth approach where you can allow all tools by default but explicitly block dangerous ones.

### Network Isolation

For stdio transport servers, the server process inherits the sandbox configuration. If the sandbox blocks network access, the MCP server also cannot make network requests.

For HTTP transport servers, the remote server's security is outside PRX's control. Ensure HTTP transport URLs point to trusted servers only.

### Policy Engine

MCP tools are governed by the security policy engine:

```toml
[security.tool_policy.tools]
mcp = "allow"           # Allow all MCP tools globally
fs_write_file = "deny"  # Block specific MCP tools by prefixed name
```

### Audit Logging

All MCP tool invocations are recorded in the audit log, including:

- Server name and tool name
- Arguments (with sensitive values redacted)
- Response status
- Execution time

## დაკავშირებული

- [Configuration Reference](/ka/prx/config/reference) -- `[mcp]` and `[mcp.servers]` settings
- [Tools Overview](/ka/prx/tools/) -- built-in tools and MCP integration overview
- [Security Sandbox](/ka/prx/security/sandbox) -- sandbox for MCP server processes
- [Secrets Management](/ka/prx/security/secrets) -- encrypted storage for MCP server credentials
- [Shell Execution](/ka/prx/tools/shell) -- alternative for running tools via shell commands
