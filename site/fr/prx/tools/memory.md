---
title: Outils memoire
description: Five tools for storing, retrieving, searching, and managing l'agent's persistent long-term memory with category support and ACL enforcement.
---

# Memory Tools

PRX fournit cinq outils de memoire qui donnent aux agents la capacite de persister les connaissances entre les conversations, recall relevant context, et manage their long-term memory store. These tools bridge the gap between ephemeral LLM context windows et persistent agent knowledge.

Le systeme de memoire prend en charge trois categories integrees -- `core` (faits permanents), `daily` (notes de portee session), and `conversation` (chat context) -- plus custom user-defined categories. Chaque outil is ACL-aware: when memory access control est active, operations are restricted based on per-principal access rules.

Les outils memoire sont enregistres dans le `all_tools()` registry and sont toujours disponibles lorsque l'agent est en cours d'execution avec le full tool set. They work avec unny of the five memory storage backends (Markdown, SQLite, PostgreSQL, Embeddings, or in-memory).

## Configuration

Les outils memoire sont configures via le `[memory]` section:

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

## Reference des outils

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

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `key` | `string` | Oui | -- | Unique identifier for this memory entry |
| `value` | `string` | Oui | -- | The content to store |
| `category` | `string` | Non | `"core"` | Category: `"core"`, `"daily"`, `"conversation"`, or custom |

**Categories:**

| Category | Retention | Objectif |
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

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `key` | `string` | Oui | -- | La cle of the memory entry to remove |

### memory_get

Retrieves a specific memory entry by its exact key. ACL-aware lorsqu'active.

```json
{
  "name": "memory_get",
  "arguments": {
    "key": "user_timezone"
  }
}
```

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `key` | `string` | Oui | -- | The exact key to look up |

Retourne la valeur stockee si trouvee, ou une erreur si la cle n'existe pas ou si l'acces est refuse par les ACL.

### memory_recall

Recalls memories by keyword ou semantic similarity. Retourne le most relevant entries matching the query. Cet outil is **completely disabled** when `memory.acl_enabled = true` -- it is removed from le registre d'outils.

```json
{
  "name": "memory_recall",
  "arguments": {
    "query": "user preferences about coding style"
  }
}
```

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `query` | `string` | Oui | -- | The search query (keywords or natural language) |
| `max_results` | `integer` | Non | `20` | Maximum number of entries to retour |

### memory_search

Full-text and vector search pour tous les memory entries. Unlike `memory_recall`, cet outil remains available when ACL est active, but it applique per-principal access restrictions on le resultats.

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

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `query` | `string` | Oui | -- | The search query |
| `category` | `string` | Non | -- | Filter results vers un specific category |
| `max_results` | `integer` | Non | `20` | Maximum number of entries to retour |

When embedding search is configured, `memory_search` performs hybrid search combining:

- **Vector similarity** (weighted by `vector_weight`) -- semantic matching via embeddings
- **BM25 keyword search** (weighted by `keyword_weight`) -- traditional full-text matching

Les resultats en dessous de `min_relevance_score` sont filtres out.

## Utilisation

### Typical Memory Workflow

During a conversation, l'agent uses memory tools in a natural cycle:

1. **Recall at start**: Before responding, le systeme recalls relevant memories to inject context
2. **Store during conversation**: When l'utilisateur shares important information, l'agent stocke it
3. **Search on demand**: When l'agent needs specific past knowledge, it recherche memory
4. **Forget on request**: When l'utilisateur asks to remove information, l'agent forgets it

### CLI Interaction

Memory state peut etre inspected from la commande line:

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

In a multi-tour conversation:

```
User: I prefer 4-space indentation in all my code.
Agent: [calls memory_store with key="code_style_indent", value="User prefers 4-space indentation", category="core"]
       Got it, I'll remember that you prefer 4-space indentation.

User: What are my coding preferences?
Agent: [calls memory_search with query="coding preferences"]
       Based on what I remember, you prefer 4-space indentation in all your code.
```

## Securite

### ACL Enforcement

When `memory.acl_enabled = true`, the systeme de memoire applique access control:

| Tool | ACL Behavior |
|------|-------------|
| `memory_store` | Stores entries avec le current principal's ownership |
| `memory_forget` | Only allows forgetting entries owned par le current principal |
| `memory_get` | Only retours entries the current principal hcomme unccess to |
| `memory_recall` | **Completely disabled** (removed from registre d'outils) |
| `memory_search` | Retours only entries the current principal hcomme unccess to |

The `memory_recall` tool est desactive under ACL because its broad keyword matching could leak information across principal boundaries. The more targeted `memory_get` et `memory_search` tools enforce per-entry access checks.

### file_read Interaction

When ACL est active, the `file_read` tool egalement bloque access to memory storage files (markdown files in the memory directory). Cela empeche l'agent from bypassing ACL by reading raw memory files from disk.

### Sensitive Data Handling

Memory entries may contain sensitive user information. Consider these practices:

- Use `core` category sparingly for truly permanent knowledge
- Enable `hygiene_enabled` to automatically prune old entries
- Enable `acl_enabled` in multi-user deployments
- Review memory contents periodically via `prx memory list`
- Use `memory_forget` to remove sensitive entries when no longer needed

### Audit Trail

All memory operations sont enregistres dans le journal d'audit when `security.audit.enabled = true`, incluant l'outil name, key, category, and success/failure status.

## Voir aussi

- [Memory System](/fr/prx/memory/) -- architecture and storage backends
- [Markdown Backend](/fr/prx/memory/markdown) -- file-based memory storage
- [SQLite Backend](/fr/prx/memory/sqlite) -- local database storage
- [PostgreSQL Backend](/fr/prx/memory/postgres) -- remote database storage
- [Embeddings](/fr/prx/memory/embeddings) -- vector search configuration
- [Memory Hygiene](/fr/prx/memory/hygiene) -- automatic cleanup and archival
- [File Operations](/fr/prx/tools/file-operations) -- ACL interaction with file_read
- [Tools Overview](/fr/prx/tools/) -- tous les outils et systeme de registre
