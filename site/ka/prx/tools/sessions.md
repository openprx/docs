---
title: Sessions & Agents
description: Multi-agent orchestration tools for spawning sub-agents, delegating tasks, and managing concurrent sessions in PRX.
---

# Sessions & Agents

PRX provides eight tools for multi-agent orchestration, enabling a parent agent to spawn child agents, delegate tasks to specialized agents, and manage concurrent sessions. This is the foundation of PRX's parallel task decomposition architecture, where complex tasks are broken into subtasks handled by independent agent instances.

The sessions tools (`sessions_spawn`, `sessions_send`, `sessions_list`, `sessions_history`, `session_status`, `subagents`) manage the lifecycle of sub-agent sessions. The agent delegation tools (`delegate`, `agents_list`) enable task routing to named agents with their own provider, model, and tool configuration.

Sessions tools are registered in the `all_tools()` registry and are always available. The `delegate` and `agents_list` tools are conditionally registered only when agent definitions exist in the configuration.

## კონფიგურაცია

### Sub-agent Concurrency

```toml
[agent.subagents]
max_concurrent = 4          # Maximum simultaneous sub-agents
max_depth = 3               # Maximum nesting depth (sub-agents spawning sub-agents)
max_total_spawns = 20       # Total spawn budget per root session
child_timeout_secs = 300    # Timeout for individual child execution
```

### Delegate Agent Definitions

Named agents are defined under `[agents.*]` sections:

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a research assistant. Find accurate, up-to-date information."
agentic = true
max_iterations = 10
allowed_tools = ["web_search_tool", "web_fetch", "file_read", "memory_store"]

[agents.coder]
provider = "openai"
model = "gpt-4o"
system_prompt = "You are a code generation specialist. Write clean, well-tested code."
agentic = true
max_iterations = 15
allowed_tools = ["shell", "file_read", "file_write", "git_operations"]

[agents.reviewer]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a code reviewer. Focus on correctness, security, and style."
agentic = true
max_iterations = 5
allowed_tools = ["file_read", "shell"]
```

## Tool Reference

### sessions_spawn

Spawns an asynchronous sub-agent that runs in the background. Returns immediately with a run ID. The parent is automatically notified when the child completes.

```json
{
  "name": "sessions_spawn",
  "arguments": {
    "task": "Research the latest Rust async runtime benchmarks and summarize the findings.",
    "action": "spawn"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `task` | `string` | Yes | -- | Task description / system prompt for the sub-agent |
| `action` | `string` | No | `"spawn"` | Action: `"spawn"`, `"history"` (view log), or `"steer"` (redirect) |
| `allowed_tools` | `array` | No | Parent's tools | Subset of tools the sub-agent can access |

### sessions_send

Sends a message to a running sub-agent session, enabling interactive communication between parent and child.

```json
{
  "name": "sessions_send",
  "arguments": {
    "session_id": "run_abc123",
    "message": "Focus on performance comparisons, not API differences."
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `session_id` | `string` | Yes | -- | The run ID of the target sub-agent |
| `message` | `string` | Yes | -- | Message to send to the sub-agent |

### sessions_list

Lists all active sub-agent sessions with their status, task description, and elapsed time.

```json
{
  "name": "sessions_list",
  "arguments": {}
}
```

No parameters required. Returns a list of active sessions.

### sessions_history

Views the conversation log of a sub-agent run, including all tool calls and LLM responses.

```json
{
  "name": "sessions_history",
  "arguments": {
    "session_id": "run_abc123"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `session_id` | `string` | Yes | -- | The run ID to retrieve history for |

### session_status

Checks the status of a specific session (running, completed, failed, timed out).

```json
{
  "name": "session_status",
  "arguments": {
    "session_id": "run_abc123"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `session_id` | `string` | Yes | -- | The run ID to check |

### subagents

Manages the sub-agent pool -- list, stop, or inspect running sub-agents.

```json
{
  "name": "subagents",
  "arguments": {
    "action": "list"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | Yes | -- | Action: `"list"`, `"stop"`, `"inspect"` |
| `session_id` | `string` | Conditional | -- | Required for `"stop"` and `"inspect"` actions |

### agents_list

Lists all configured delegate agents with their models, capabilities, and allowed tools. Only registered when `[agents.*]` sections are defined.

```json
{
  "name": "agents_list",
  "arguments": {}
}
```

No parameters required. Returns agent definitions from the configuration.

### delegate

Delegates a task to a named agent with its own provider, model, and tool set. The delegate agent runs an isolated agentic loop and returns the result.

```json
{
  "name": "delegate",
  "arguments": {
    "agent": "researcher",
    "task": "Find the top 5 Rust web frameworks by GitHub stars in 2026."
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `agent` | `string` | Yes | -- | Name of the configured agent (from `[agents.*]`) |
| `task` | `string` | Yes | -- | Task description for the delegate agent |

## Usage Patterns

### Parallel Research

Spawn multiple sub-agents to research different topics simultaneously:

```
Parent: I need a comparison of 3 database engines for our project.

  [sessions_spawn] task="Research PostgreSQL strengths, weaknesses, and use cases"
  [sessions_spawn] task="Research SQLite strengths, weaknesses, and use cases"
  [sessions_spawn] task="Research DuckDB strengths, weaknesses, and use cases"

  [waits for all three to complete]
  [synthesizes results into a comparison table]
```

### Delegated Code Review

Use specialized delegate agents for specific tasks:

```
Parent: Review this pull request for security issues.

  [delegate] agent="reviewer", task="Review the diff in /tmp/pr-42.patch for security vulnerabilities"

  [reviewer agent runs with file_read and shell tools]
  [returns detailed security review]
```

### Hierarchical Task Decomposition

Sub-agents can spawn their own sub-agents (up to `max_depth`):

```
Parent Agent
  ├── Research Agent
  │     ├── Web Search Sub-agent
  │     └── Document Analysis Sub-agent
  ├── Code Generation Agent
  └── Testing Agent
```

## უსაფრთხოება

### Depth and Concurrency Limits

PRX enforces hard limits on sub-agent spawning to prevent resource exhaustion:

- **max_concurrent**: Limits simultaneous running sub-agents (default: 4)
- **max_depth**: Limits nesting depth (default: 3). At maximum depth, the `sessions_spawn` tool is removed from the child's available tools.
- **max_total_spawns**: Limits the total number of spawns per root session (default: 20)
- **child_timeout_secs**: Kills sub-agents that exceed the timeout (default: 300 seconds)

### Tool Restrictions

Sub-agents inherit the parent's sandbox policy but can have a restricted tool set:

```json
{
  "name": "sessions_spawn",
  "arguments": {
    "task": "Search the web for information",
    "allowed_tools": ["web_search_tool", "web_fetch"]
  }
}
```

Delegate agents have their tools explicitly defined in the configuration. They cannot access tools outside their `allowed_tools` list.

### Credential Isolation

Delegate agents can use different providers and API keys from the parent:

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
# Uses the provider's configured API key
```

This allows routing tasks to different LLM providers based on the task requirements, with each provider's credentials isolated.

### Policy Engine

Session and agent tools are governed by the policy engine:

```toml
[security.tool_policy.groups]
sessions = "allow"

[security.tool_policy.tools]
delegate = "supervised"    # Require approval for delegation
```

## დაკავშირებული

- [Sub-agents](/ka/prx/agent/subagents) -- sub-agent architecture and spawning model
- [Agent Runtime](/ka/prx/agent/runtime) -- agent execution architecture
- [Agent Loop](/ka/prx/agent/loop) -- core execution cycle
- [Session Worker](/ka/prx/agent/session-worker) -- process isolation for sessions
- [Configuration Reference](/ka/prx/config/reference) -- agent and subagent settings
- [Tools Overview](/ka/prx/tools/) -- all tools and registry system
