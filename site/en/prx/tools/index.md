---
title: Tools Overview
description: PRX provides 46+ built-in tools organized into 12 categories. Tools are capabilities that the agent can invoke during agentic loops to interact with the OS, network, memory, and external services.
---

# Tools Overview

Tools are the capabilities that a PRX agent can invoke during its reasoning loop. When the LLM decides it needs to perform an action -- run a command, read a file, search the web, store a memory -- it calls a tool by name with structured JSON arguments. PRX executes the tool, applies security policies, and returns the result to the LLM for the next reasoning step.

PRX ships with **46+ built-in tools** across 12 categories, from basic file I/O to browser automation, multi-agent delegation, and MCP protocol integration.

## Tool Architecture

Every tool implements the `Tool` trait:

```rust
#[async_trait]
pub trait Tool: Send + Sync {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn parameters_schema(&self) -> serde_json::Value;
    async fn execute(&self, args: serde_json::Value) -> Result<ToolResult>;
}
```

Each tool provides a JSON Schema for its parameters, which is sent to the LLM as a function definition. The LLM generates structured calls, and PRX validates arguments against the schema before execution.

## Tool Registry: `default_tools()` vs `all_tools()`

PRX uses a two-tier registry system:

### `default_tools()` -- Minimal Core (3 tools)

The minimal tool set for lightweight or restricted agents. Always available, no extra configuration required:

| Tool | Description |
|------|-------------|
| `shell` | Shell command execution with sandbox isolation |
| `file_read` | Read file contents (ACL-aware) |
| `file_write` | Write file contents |

### `all_tools()` -- Full Registry (46+ tools)

The complete tool set, assembled based on your configuration. Tools are conditionally registered depending on which features are enabled:

- **Always registered**: core tools, memory, cron, scheduling, git, vision, nodes, pushover, canvas, proxy config, schema
- **Conditionally registered**: browser (requires `browser.enabled`), HTTP requests (requires `http_request.enabled`), web search (requires `web_search.enabled`), web fetch (requires `web_search.fetch_enabled` + `browser.allowed_domains`), MCP (requires `mcp.enabled`), Composio (requires API key), delegate/agents_list (requires agent definitions)

## Category Reference

### Core (3 tools) -- Always Available

The foundation tools present in both `default_tools()` and `all_tools()`.

| Tool | Description |
|------|-------------|
| `shell` | Execute shell commands with configurable sandbox isolation (Landlock/Firejail/Bubblewrap/Docker). 60s timeout, 1MB output cap, sanitized environment. |
| `file_read` | Read file contents with path validation. When memory ACL is enabled, blocks access to memory markdown files to enforce access control. |
| `file_write` | Write content to files. Subject to security policy checks. |

### Memory (5 tools)

Long-term memory operations for storing, retrieving, and managing the agent's persistent knowledge.

| Tool | Description |
|------|-------------|
| `memory_store` | Store facts, preferences, or notes in long-term memory. Supports categories: `core` (permanent), `daily` (session), `conversation` (chat context), or custom. |
| `memory_forget` | Remove specific entries from long-term memory. |
| `memory_get` | Retrieve a specific memory entry by key. ACL-aware when enabled. |
| `memory_recall` | Recall memories by keyword or semantic similarity. Disabled when memory ACL is enabled. |
| `memory_search` | Full-text and vector search across memory entries. ACL-aware when enabled. |

### Cron / Scheduling (9 tools)

Time-based task automation and the Xin scheduling engine.

| Tool | Description |
|------|-------------|
| `cron` | Legacy cron entry point -- create or manage scheduled tasks. |
| `cron_add` | Add a new cron job with cron expression, command, and optional description. |
| `cron_list` | List all registered cron jobs with their schedules and status. |
| `cron_remove` | Remove a cron job by ID. |
| `cron_update` | Update an existing cron job's schedule, command, or settings. |
| `cron_run` | Manually trigger a cron job immediately. |
| `cron_runs` | View execution history and logs of cron job runs. |
| `schedule` | Schedule a one-shot or recurring task with natural language time expressions. |
| `xin` | The Xin scheduling engine -- advanced task scheduling with dependency chains and conditional execution. |

### Browser / Vision (5 tools)

Web automation and image processing. Browser tools require `[browser] enabled = true`.

| Tool | Description |
|------|-------------|
| `browser` | Full browser automation with pluggable backends (agent-browser CLI, Rust-native, computer-use sidecar). Supports navigation, form filling, clicking, screenshots, and OS-level actions. |
| `browser_open` | Simple URL opening in the browser. Domain-restricted via `browser.allowed_domains`. |
| `screenshot` | Capture screenshots of the current screen or specific windows. |
| `image` | Process and transform images (resize, crop, convert formats). |
| `image_info` | Extract metadata and dimensions from image files. |

### Network (4 tools)

HTTP requests, web search, web fetching, and MCP protocol integration.

| Tool | Description |
|------|-------------|
| `http_request` | Make HTTP requests to APIs. Deny-by-default: only `allowed_domains` are reachable. Configurable timeout and max response size. |
| `web_search_tool` | Search the web via DuckDuckGo (free, no key) or Brave Search (requires API key). |
| `web_fetch` | Fetch and extract content from web pages. Requires `web_search.fetch_enabled` and `browser.allowed_domains` to be set. |
| `mcp` | Model Context Protocol client -- connect to external MCP servers (stdio or HTTP transports) and invoke their tools. Supports workspace-local `mcp.json` discovery. |

### Messaging (2 tools)

Send messages back through communication channels.

| Tool | Description |
|------|-------------|
| `message_send` | Send a message (text, media, voice) to any configured channel and recipient. Automatically routes to the active channel. |
| `gateway` | Low-level gateway access for sending raw messages through the Axum HTTP/WebSocket gateway. |

### Sessions / Agents (8 tools)

Multi-agent orchestration: spawn sub-agents, delegate tasks, and manage concurrent sessions.

| Tool | Description |
|------|-------------|
| `sessions_spawn` | Spawn an async sub-agent that runs in the background. Returns immediately with a run ID; result is auto-announced on completion. Supports `history` and `steer` actions. |
| `sessions_send` | Send a message to a running sub-agent session. |
| `sessions_list` | List all active sub-agent sessions with status. |
| `sessions_history` | View the conversation log of a sub-agent run. |
| `session_status` | Check the status of a specific session. |
| `subagents` | Manage the sub-agent pool -- list, stop, or inspect sub-agents. |
| `agents_list` | List all configured delegate agents with their models and capabilities. Only registered when agents are defined in config. |
| `delegate` | Delegate a task to a named agent with its own provider, model, and tool set. Supports fallback credentials and isolated agentic loops. |

### Remote Devices (2 tools)

Interact with remote nodes and push notifications.

| Tool | Description |
|------|-------------|
| `nodes` | Manage and communicate with remote PRX nodes in a distributed deployment. |
| `pushover` | Send push notifications via the Pushover service. |

### Git (1 tool)

Version control operations.

| Tool | Description |
|------|-------------|
| `git_operations` | Perform Git operations (status, diff, commit, push, pull, log, branch) on the workspace repository. |

### Config (2 tools)

Runtime configuration management.

| Tool | Description |
|------|-------------|
| `config_reload` | Hot-reload the PRX configuration file without restarting the process. |
| `proxy_config` | View and modify proxy/network configuration at runtime. |

### Third-party Integration (1 tool)

External platform connectors.

| Tool | Description |
|------|-------------|
| `composio` | Connect to 250+ apps and services via the Composio platform. Requires a Composio API key. |

### Rendering (2 tools)

Content generation and output formatting.

| Tool | Description |
|------|-------------|
| `canvas` | Render structured content (tables, charts, diagrams) for visual output. |
| `tts` | Text-to-Speech -- convert text to a voice message and send it to the current conversation. Handles MP3 generation, M4A conversion, and delivery automatically. |

### Admin (1 tool)

Internal schema and diagnostics.

| Tool | Description |
|------|-------------|
| `schema` | JSON Schema cleaning and normalization for cross-provider LLM compatibility. Resolves `$ref`, flattens unions, strips unsupported keywords. |

## Full Tools Matrix

| Tool | Category | Default | Condition |
|------|----------|---------|-----------|
| `shell` | Core | Yes | Always |
| `file_read` | Core | Yes | Always |
| `file_write` | Core | Yes | Always |
| `memory_store` | Memory | -- | `all_tools()` |
| `memory_forget` | Memory | -- | `all_tools()` |
| `memory_get` | Memory | -- | `all_tools()` |
| `memory_recall` | Memory | -- | `all_tools()`, disabled when `memory.acl_enabled = true` |
| `memory_search` | Memory | -- | `all_tools()` |
| `cron` | Cron | -- | `all_tools()` |
| `cron_add` | Cron | -- | `all_tools()` |
| `cron_list` | Cron | -- | `all_tools()` |
| `cron_remove` | Cron | -- | `all_tools()` |
| `cron_update` | Cron | -- | `all_tools()` |
| `cron_run` | Cron | -- | `all_tools()` |
| `cron_runs` | Cron | -- | `all_tools()` |
| `schedule` | Scheduling | -- | `all_tools()` |
| `xin` | Scheduling | -- | `all_tools()` |
| `browser` | Browser | -- | `browser.enabled = true` |
| `browser_open` | Browser | -- | `browser.enabled = true` |
| `screenshot` | Vision | -- | `all_tools()` |
| `image` | Vision | -- | `all_tools()` (implicit, via ImageTool) |
| `image_info` | Vision | -- | `all_tools()` |
| `http_request` | Network | -- | `http_request.enabled = true` |
| `web_search_tool` | Network | -- | `web_search.enabled = true` |
| `web_fetch` | Network | -- | `web_search.fetch_enabled = true` + `browser.allowed_domains` |
| `mcp` | Network | -- | `mcp.enabled = true` + servers defined |
| `message_send` | Messaging | -- | Channel active (registered at gateway level) |
| `gateway` | Messaging | -- | `all_tools()` |
| `sessions_spawn` | Sessions | -- | `all_tools()` |
| `sessions_send` | Sessions | -- | `all_tools()` |
| `sessions_list` | Sessions | -- | `all_tools()` |
| `sessions_history` | Sessions | -- | `all_tools()` |
| `session_status` | Sessions | -- | `all_tools()` |
| `subagents` | Sessions | -- | `all_tools()` |
| `agents_list` | Agents | -- | `[agents.*]` sections defined |
| `delegate` | Agents | -- | `[agents.*]` sections defined |
| `nodes` | Remote | -- | `all_tools()` |
| `pushover` | Remote | -- | `all_tools()` |
| `git_operations` | Git | -- | `all_tools()` |
| `config_reload` | Config | -- | `all_tools()` |
| `proxy_config` | Config | -- | `all_tools()` |
| `composio` | Third-party | -- | `composio.api_key` set |
| `canvas` | Rendering | -- | `all_tools()` |
| `tts` | Rendering | -- | Channel active (registered at gateway level) |
| `schema` | Admin | -- | Internal (schema normalization module) |

## Enabling and Disabling Tools

### Feature-gated Tools

Many tools are enabled through their respective config sections. Add these to your `config.toml`:

```toml
# ── Browser tools ──────────────────────────────────────────────
[browser]
enabled = true
allowed_domains = ["github.com", "stackoverflow.com", "*.openprx.dev"]
backend = "agent_browser"   # "agent_browser" | "rust_native" | "computer_use"

# ── HTTP request tool ─────────────────────────────────────────
[http_request]
enabled = true
allowed_domains = ["api.github.com", "api.openai.com"]
max_response_size = 1000000  # 1MB
timeout_secs = 30

# ── Web search tool ───────────────────────────────────────────
[web_search]
enabled = true
provider = "duckduckgo"      # "duckduckgo" (free) or "brave" (requires API key)
# brave_api_key = "..."
max_results = 5
timeout_secs = 10

# Also enable web_fetch for page content extraction:
fetch_enabled = true
fetch_max_chars = 50000

# ── Composio integration ──────────────────────────────────────
[composio]
enabled = true
api_key = "your-composio-key"
entity_id = "default"
```

### Tool Policy Pipeline

For fine-grained control, use the `[security.tool_policy]` section to allow, deny, or supervise individual tools or groups:

```toml
[security.tool_policy]
# Default policy: "allow", "deny", or "supervised"
default = "allow"

# Group-level policies
[security.tool_policy.groups]
sessions = "allow"
automation = "allow"
hardware = "deny"

# Per-tool overrides (highest priority)
[security.tool_policy.tools]
shell = "supervised"     # Requires approval before execution
gateway = "allow"
composio = "deny"        # Disable Composio even if API key is set
```

Policy resolution order (highest priority first):
1. Per-tool policy (`security.tool_policy.tools.<name>`)
2. Group policy (`security.tool_policy.groups.<group>`)
3. Default policy (`security.tool_policy.default`)

### Delegate Agent Tool Restrictions

When configuring delegate agents, you can restrict which tools they can access:

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a research assistant."
agentic = true
max_iterations = 10
allowed_tools = ["web_search_tool", "web_fetch", "file_read", "memory_store"]
```

## MCP Tool Integration

PRX implements the Model Context Protocol (MCP) client, allowing it to connect to external MCP servers and expose their tools to the agent.

### Configuration

Define MCP servers in `config.toml`:

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
transport = "stdio"

[mcp.servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
transport = "stdio"
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_..." }

[mcp.servers.remote-api]
url = "https://mcp.example.com/sse"
transport = "streamable_http"
```

### Workspace-local `mcp.json`

PRX also discovers MCP servers from a workspace-local `mcp.json` file, following the same format as VS Code and Claude Desktop:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./my-mcp-server/index.js"],
      "env": { "API_KEY": "..." }
    }
  }
}
```

Commands in `mcp.json` are restricted to a whitelist of safe launchers: `npx`, `node`, `python`, `python3`, `uvx`, `uv`, `deno`, `bun`, `docker`, `cargo`, `go`, `ruby`, `php`, `dotnet`, `java`.

### Dynamic Tool Discovery

MCP tools are discovered at runtime via the `tools/list` protocol method. Each MCP server's tools are namespaced and exposed to the LLM as callable functions. The `mcp` tool supports a `refresh()` hook that re-discovers tools before each agent turn.

Dangerous environment variables (`LD_PRELOAD`, `DYLD_INSERT_LIBRARIES`, `NODE_OPTIONS`, `PYTHONPATH`, etc.) are automatically stripped from MCP server processes.

## Security: Sandboxing and ACL

### Tool Sandboxing

The `shell` tool executes commands inside a configurable sandbox. PRX supports 4 sandbox backends plus a no-op fallback:

```toml
[security.sandbox]
enabled = true           # None = auto-detect, true/false = explicit
backend = "auto"         # "auto" | "landlock" | "firejail" | "bubblewrap" | "docker" | "none"

# Custom Firejail arguments (when backend = "firejail")
firejail_args = ["--net=none", "--noroot"]
```

| Backend | Platform | Isolation Level | Notes |
|---------|----------|-----------------|-------|
| Landlock | Linux (kernel LSM) | Filesystem | Kernel-native, no extra dependencies |
| Firejail | Linux | Full (network, filesystem, PID) | User-space, widely available |
| Bubblewrap | Linux, macOS | Namespace-based | User namespaces, lightweight |
| Docker | Any | Container | Full container isolation |
| None | Any | Application-layer only | No OS-level isolation |

Auto-detect mode (`backend = "auto"`) probes for available backends in order: Landlock, Firejail, Bubblewrap, Docker, then falls back to None with a warning.

### Shell Environment Sanitization

The `shell` tool only passes a strict whitelist of environment variables to child processes: `PATH`, `HOME`, `TERM`, `LANG`, `LC_ALL`, `LC_CTYPE`, `USER`, `SHELL`, `TMPDIR`. API keys, tokens, and secrets are never exposed.

### Memory ACL

When `memory.acl_enabled = true`, access control is enforced on memory operations:

- `file_read` blocks access to memory markdown files
- `memory_recall` is completely disabled (removed from tool registry)
- `memory_get` and `memory_search` enforce per-principal access restrictions

### Security Policy

Every tool call passes through the `SecurityPolicy` layer before execution. The policy engine can:

- Block operations based on tool policy rules
- Require supervisor approval for `supervised` tools
- Audit all tool invocations
- Enforce rate limits and resource constraints

```toml
[security.resources]
max_memory_mb = 512
max_cpu_percent = 80
max_open_files = 256
```

## Extending: Writing Custom Tools

To add a new tool:

1. Create a new module in `src/tools/` implementing the `Tool` trait
2. Register it in `all_tools_with_runtime_ext()` in `src/tools/mod.rs`
3. Add the `pub mod` and `pub use` entries in `mod.rs`

Example:

```rust
use super::traits::{Tool, ToolResult};
use async_trait::async_trait;
use serde_json::json;

pub struct MyTool { /* ... */ }

#[async_trait]
impl Tool for MyTool {
    fn name(&self) -> &str { "my_tool" }

    fn description(&self) -> &str {
        "Does something useful."
    }

    fn parameters_schema(&self) -> serde_json::Value {
        json!({
            "type": "object",
            "properties": {
                "input": { "type": "string", "description": "The input value" }
            },
            "required": ["input"]
        })
    }

    async fn execute(&self, args: serde_json::Value) -> anyhow::Result<ToolResult> {
        let input = args["input"].as_str().unwrap_or_default();
        Ok(ToolResult {
            success: true,
            output: format!("Processed: {input}"),
            error: None,
        })
    }
}
```

See `AGENTS.md` section 7.3 for the full change playbook.
