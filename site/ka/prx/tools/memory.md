---
title: მეხსიერების ინსტრუმენტები
description: Five tools for storing, retrieving, searching, and managing the agent's persistent long-term memory with category support and ACL enforcement.
---

# Memory Tools

PRX provides five memory tools that give agents the ability to persist knowledge across conversations, recall relevant context, and manage their long-term memory store. These tools bridge the gap between ephemeral LLM context windows and persistent agent knowledge.

The memory system supports three built-in categories -- `core` (permanent facts), `daily` (session-scoped notes), and `conversation` (chat context) -- plus custom user-defined categories. Each tool is ACL-aware: when memory access control is enabled, operations are restricted based on per-principal access rules.

Memory tools are registered in the `all_tools()` registry and are always available when the agent is running with the full tool set. They work with any of the five memory storage backends (Markdown, SQLite, PostgreSQL, Embeddings, or in-memory).

## კონფიგურაცია

Memory tools are configured through the `[memory]` section:

```toml
[memory]
backend = "sqlite"              # "markdown" | "sqlite" | "postgres" | "embeddings" | "memory"
auto_save = true                # Auto-save conversation input to memory
acl_enabled = false             # Enable access control lists
max_recall_items = 20           # Maximum items returned by recall/search
recall_relevance_threshold = 0.3  # Minimum relevance score for recall

# Optional: Embedding-based semantic search
embedding_provider = "openai"
embedding_model = "text-embedding-3-small"
embedding_dimensions = 1536
vector_weight = 0.7             # Weight for vector similarity in hybrid search
keyword_weight = 0.3            # Weight for BM25 keyword search
min_relevance_score = 0.4       # Minimum score to include in results

# Memory hygiene (automatic cleanup)
hygiene_enabled = true
archive_after_days = 7
purge_after_days = 30
conversation_retention_days = 3
daily_retention_days = 7
```

## Tool Reference

### memory_store

Stores a fact, preference, note, or piece of knowledge in long-term memory.

```json
{
  "name": "memory_store",
  "arguments": {
    "key": "user_timezone",
    "value": "The user is located in UTC+8 (Asia/Shanghai)",
    "category": "core"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `key` | `string` | Yes | -- | Unique identifier for this memory entry |
| `value` | `string` | Yes | -- | The content to store |
| `category` | `string` | No | `"core"` | Category: `"core"`, `"daily"`, `"conversation"`, or custom |

**Categories:**

| Category | Retention | Purpose |
|----------|-----------|---------|
| `core` | Permanent (until explicitly forgotten) | Fundamental facts, user preferences, system configuration |
| `daily` | Session-scoped, archived after `archive_after_days` | Today's tasks, context, session notes |
| `conversation` | Short-lived, pruned after `conversation_retention_days` | Current chat context, references |
| Custom | Follows `daily` retention rules | User-defined categories for domain-specific knowledge |

### memory_forget

Removes a specific entry from long-term memory by key.

```json
{
  "name": "memory_forget",
  "arguments": {
    "key": "user_timezone"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `key` | `string` | Yes | -- | The key of the memory entry to remove |

### memory_get

Retrieves a specific memory entry by its exact key. ACL-aware when enabled.

```json
{
  "name": "memory_get",
  "arguments": {
    "key": "user_timezone"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `key` | `string` | Yes | -- | The exact key to look up |

Returns the stored value if found, or an error if the key does not exist or access is denied by ACL.

### memory_recall

Recalls memories by keyword or semantic similarity. Returns the most relevant entries matching the query. This tool is **completely disabled** when `memory.acl_enabled = true` -- it is removed from the tool registry.

```json
{
  "name": "memory_recall",
  "arguments": {
    "query": "user preferences about coding style"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | `string` | Yes | -- | The search query (keywords or natural language) |
| `max_results` | `integer` | No | `20` | Maximum number of entries to return |

### memory_search

Full-text and vector search across all memory entries. Unlike `memory_recall`, this tool remains available when ACL is enabled, but it enforces per-principal access restrictions on the results.

```json
{
  "name": "memory_search",
  "arguments": {
    "query": "project deadlines",
    "category": "daily",
    "max_results": 10
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | `string` | Yes | -- | The search query |
| `category` | `string` | No | -- | Filter results to a specific category |
| `max_results` | `integer` | No | `20` | Maximum number of entries to return |

When embedding search is configured, `memory_search` performs hybrid search combining:

- **Vector similarity** (weighted by `vector_weight`) -- semantic matching via embeddings
- **BM25 keyword search** (weighted by `keyword_weight`) -- traditional full-text matching

Results below `min_relevance_score` are filtered out.

## გამოყენება

### Typical Memory Workflow

During a conversation, the agent uses memory tools in a natural cycle:

1. **Recall at start**: Before responding, the system recalls relevant memories to inject context
2. **Store during conversation**: When the user shares important information, the agent stores it
3. **Search on demand**: When the agent needs specific past knowledge, it searches memory
4. **Forget on request**: When the user asks to remove information, the agent forgets it

### CLI Interaction

Memory state can be inspected from the command line:

```bash
# View memory statistics
prx memory stats

# List all memory entries in a category
prx memory list --category core

# Search memory from CLI
prx memory search "project deadlines"

# Export memory to a file
prx memory export --format json > memories.json
```

### Agent Usage Example

In a multi-turn conversation:

```
User: I prefer 4-space indentation in all my code.
Agent: [calls memory_store with key="code_style_indent", value="User prefers 4-space indentation", category="core"]
       Got it, I'll remember that you prefer 4-space indentation.

User: What are my coding preferences?
Agent: [calls memory_search with query="coding preferences"]
       Based on what I remember, you prefer 4-space indentation in all your code.
```

## უსაფრთხოება

### ACL Enforcement

When `memory.acl_enabled = true`, the memory system enforces access control:

| Tool | ACL Behavior |
|------|-------------|
| `memory_store` | Stores entries with the current principal's ownership |
| `memory_forget` | Only allows forgetting entries owned by the current principal |
| `memory_get` | Only returns entries the current principal has access to |
| `memory_recall` | **Completely disabled** (removed from tool registry) |
| `memory_search` | Returns only entries the current principal has access to |

The `memory_recall` tool is disabled under ACL because its broad keyword matching could leak information across principal boundaries. The more targeted `memory_get` and `memory_search` tools enforce per-entry access checks.

### file_read Interaction

When ACL is enabled, the `file_read` tool also blocks access to memory storage files (markdown files in the memory directory). This prevents the agent from bypassing ACL by reading raw memory files from disk.

### Sensitive Data Handling

Memory entries may contain sensitive user information. Consider these practices:

- Use `core` category sparingly for truly permanent knowledge
- Enable `hygiene_enabled` to automatically prune old entries
- Enable `acl_enabled` in multi-user deployments
- Review memory contents periodically via `prx memory list`
- Use `memory_forget` to remove sensitive entries when no longer needed

### Audit Trail

All memory operations are recorded in the audit log when `security.audit.enabled = true`, including the tool name, key, category, and success/failure status.

## დაკავშირებული

- [Memory System](/ka/prx/memory/) -- architecture and storage backends
- [Markdown Backend](/ka/prx/memory/markdown) -- file-based memory storage
- [SQLite Backend](/ka/prx/memory/sqlite) -- local database storage
- [PostgreSQL Backend](/ka/prx/memory/postgres) -- remote database storage
- [Embeddings](/ka/prx/memory/embeddings) -- vector search configuration
- [Memory Hygiene](/ka/prx/memory/hygiene) -- automatic cleanup and archival
- [File Operations](/ka/prx/tools/file-operations) -- ACL interaction with file_read
- [Tools Overview](/ka/prx/tools/) -- all tools and registry system
