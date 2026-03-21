---
title: Sessions & Agents
description: Multi-agent orchestration tools for spawning sub-agents, delegating tasks, and managing concurrent sessions in PRX.
---

# Sessions & Agents

PRX fournit huit outils pour l'orchestration multi-agents, permettant a un agent parent de lancer child agents, delegate tasks to specialized agents, et manage concurrent sessions. This is the foundation of PRX's parallel task decomposition architecture, where complex tasks are broken into subtasks gere par independent agent instances.

The sessions tools (`sessions_spawn`, `sessions_send`, `sessions_list`, `sessions_history`, `session_status`, `subagents`) manage the lifecycle of sub-session d'agents. L'agent delegation tools (`delegate`, `agents_list`) enable task routing to named agents with their own fournisseur, model, et tool configuration.

Sessions tools sont enregistres dans le `all_tools()` registry and sont toujours disponibles. The `delegate` and `agents_list` tools are conditionally registered only when agent definitions exist dans la configuration.

## Configuration

### Sub-agent Concurrency

```toml
[agent.subagents]
max_concurrent = 4          # Maximum simultaneous sub-agents
max_depth = 3               # Maximum nesting depth (sub-agents spawning sub-agents)
max_total_spawns = 20       # Total spawn budget per root session
child_timeout_secs = 300    # Timeout for individual child execution
```

### Delegate Agent Definitions

Named agents sont definis under `[agents.*]` sections:

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

## Reference des outils

### sessions_spawn

Spawns an asynchronous sub-agent qui s'execute in the background. Retours immediately avec un run ID. The parent est automatiquement notified lorsque le child completes.

```json
{
  "name": "sessions_spawn",
  "arguments": {
    "task": "Research the latest Rust async runtime benchmarks and summarize the findings.",
    "action": "spawn"
  }
}
```

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `task` | `string` | Oui | -- | Task description / system prompt pour le sub-agent |
| `action` | `string` | Non | `"spawn"` | Action: `"spawn"`, `"history"` (view log), or `"steer"` (redirect) |
| `allowed_tools` | `array` | Non | Parent's tools | Subset of tools the sub-agent can access |

### sessions_send

Sends a message vers un running sub-session d'agent, enabling interactive communication between parent and child.

```json
{
  "name": "sessions_send",
  "arguments": {
    "session_id": "run_abc123",
    "message": "Focus on performance comparisons, not API differences."
  }
}
```

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `session_id` | `string` | Oui | -- | The run ID of the target sub-agent |
| `message` | `string` | Oui | -- | Message to send vers le sub-agent |

### sessions_list

Lists tous les actifs sub-session d'agents with their status, task description, and elapsed time.

```json
{
  "name": "sessions_list",
  "arguments": {}
}
```

Non parameters required. Retours a list of active sessions.

### sessions_history

Views the conversation log of a sub-agent run, incluant all appels d'outils and LLM responses.

```json
{
  "name": "sessions_history",
  "arguments": {
    "session_id": "run_abc123"
  }
}
```

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `session_id` | `string` | Oui | -- | The run ID pour recuperer history for |

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

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `session_id` | `string` | Oui | -- | The run ID pour verifier |

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

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | Oui | -- | Action: `"list"`, `"stop"`, `"inspect"` |
| `session_id` | `string` | Conditional | -- | Requis for `"stop"` and `"inspect"` actions |

### agents_list

Lists tous les configures delegate agents with their models, capabilities, and allowed tools. Only registered when `[agents.*]` sections sont definis.

```json
{
  "name": "agents_list",
  "arguments": {}
}
```

Non parameters required. Retours agent definitions from la configuration.

### delegate

Delegates a task vers un named agent with its own fournisseur, model, and tool set. The delegate agent runs an isolated agentic loop and retours le resultat.

```json
{
  "name": "delegate",
  "arguments": {
    "agent": "researcher",
    "task": "Find the top 5 Rust web frameworks by GitHub stars in 2026."
  }
}
```

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `agent` | `string` | Oui | -- | Name of the configured agent (from `[agents.*]`) |
| `task` | `string` | Oui | -- | Task description pour le delegate agent |

## Utilisation Patterns

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

Sub-agents can spawn their own sub-agents (jusqu'a `max_depth`):

```
Parent Agent
  ├── Research Agent
  │     ├── Web Search Sub-agent
  │     └── Document Analysis Sub-agent
  ├── Code Generation Agent
  └── Testing Agent
```

## Securite

### Depth and Concurrency Limites

PRX applique hard limits on sub-agent lancement de pour empecher epuisement des ressources:

- **max_concurrent**: Limites simultaneous running sub-agents (par defaut : 4)
- **max_depth**: Limites nesting depth (par defaut : 3). At maximum depth, the `sessions_spawn` tool is removed depuis le child's available tools.
- **max_total_lance**: Limites the total number of lance per root session (par defaut : 20)
- **child_timeout_secs**: Kills sub-agents that exceed the timeout (par defaut : 300 seconds)

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

Delegate agents have their tools explicitly defini dans la configuration. They ne peut pcomme unccess tools outside their `allowed_tools` list.

### Credential Isolation

Delegate agents can use different fournisseurs and API keys depuis le parent:

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
# Uses the provider's configured API key
```

This allows routing tasks to different LLM fournisseurs based sur le task requirements, with each fournisseur's credentials isolated.

### Moteur de politiques

Session and agent tools sont gouvernes par le moteur de politiques:

```toml
[security.tool_policy.groups]
sessions = "allow"

[security.tool_policy.tools]
delegate = "supervised"    # Require approval for delegation
```

## Voir aussi

- [Sub-agents](/fr/prx/agent/subagents) -- sub-agent architecture and lancement de model
- [Agent Runtime](/fr/prx/agent/runtime) -- execution de l'agent architecture
- [Agent Loop](/fr/prx/agent/loop) -- core execution cycle
- [Session Worker](/fr/prx/agent/session-worker) -- process isolation for sessions
- [Configuration Reference](/fr/prx/config/reference) -- agent and subagent settings
- [Tools Overview](/fr/prx/tools/) -- tous les outils et systeme de registre
