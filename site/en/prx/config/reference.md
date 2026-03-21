---
title: Configuration Reference
description: Complete field-by-field reference for all PRX configuration sections and options.
---

# Configuration Reference

This page documents every configuration section and field in PRX's `config.toml`. Fields marked with a default value can be omitted -- PRX will use the default.

## Top-level (Default Settings)

These fields appear at the root level of `config.toml`, outside any section header.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `default_provider` | `string` | `"openrouter"` | Provider ID or alias (e.g., `"anthropic"`, `"openai"`, `"ollama"`) |
| `default_model` | `string` | `"anthropic/claude-sonnet-4.6"` | Model identifier routed through the selected provider |
| `default_temperature` | `float` | `0.7` | Sampling temperature (0.0--2.0). Lower = more deterministic |
| `api_key` | `string?` | `null` | API key for the selected provider. Overridden by provider-specific env vars |
| `api_url` | `string?` | `null` | Base URL override for the provider API (e.g., remote Ollama endpoint) |

```toml
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7
api_key = "sk-ant-..."
```

## `[gateway]`

HTTP gateway server for webhook endpoints, pairing, and the web API.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `host` | `string` | `"127.0.0.1"` | Bind address. Use `"0.0.0.0"` for public access |
| `port` | `u16` | `16830` | Listen port |
| `require_pairing` | `bool` | `true` | Require device pairing before accepting API requests |
| `allow_public_bind` | `bool` | `false` | Allow binding to non-localhost without a tunnel |
| `pair_rate_limit_per_minute` | `u32` | `5` | Max pairing requests per minute per client |
| `webhook_rate_limit_per_minute` | `u32` | `60` | Max webhook requests per minute per client |
| `api_rate_limit_per_minute` | `u32` | `120` | Max API requests per minute per authenticated token |
| `trust_forwarded_headers` | `bool` | `false` | Trust `X-Forwarded-For` / `X-Real-IP` headers (enable behind reverse proxy only) |
| `request_timeout_secs` | `u64` | `300` | HTTP handler timeout in seconds |
| `idempotency_ttl_secs` | `u64` | `300` | TTL for webhook idempotency keys |

```toml
[gateway]
host = "127.0.0.1"
port = 16830
require_pairing = true
api_rate_limit_per_minute = 120
```

::: warning
Changing `host` or `port` requires a full restart. These values are bound at server startup and cannot be hot-reloaded.
:::

## `[channels_config]`

Top-level channel configuration. Individual channels are nested subsections.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `cli` | `bool` | `true` | Enable the interactive CLI channel |
| `message_timeout_secs` | `u64` | `300` | Per-message processing timeout (LLM + tools) |

### `[channels_config.telegram]`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `bot_token` | `string` | *(required)* | Telegram Bot API token from @BotFather |
| `allowed_users` | `string[]` | `[]` | Allowed Telegram user IDs or usernames. Empty = deny all |
| `mention_only` | `bool` | `false` | In groups, only respond to messages that @-mention the bot |
| `stream_mode` | `"off" \| "partial"` | `"off"` | Streaming mode: `off` sends complete response, `partial` edits a draft progressively |
| `draft_update_interval_ms` | `u64` | `1000` | Minimum interval between draft edits (rate limit protection) |
| `interrupt_on_new_message` | `bool` | `false` | Cancel in-flight response when the same user sends a new message |

```toml
[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["alice", "bob"]
mention_only = true
stream_mode = "partial"
```

### `[channels_config.discord]`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `bot_token` | `string` | *(required)* | Discord bot token from Developer Portal |
| `guild_id` | `string?` | `null` | Restrict to a single guild (server) |
| `allowed_users` | `string[]` | `[]` | Allowed Discord user IDs. Empty = deny all |
| `listen_to_bots` | `bool` | `false` | Process messages from other bots (own messages always ignored) |
| `mention_only` | `bool` | `false` | Only respond to @-mentions |

```toml
[channels_config.discord]
bot_token = "MTIz..."
guild_id = "987654321"
allowed_users = ["111222333"]
mention_only = true
```

### `[channels_config.slack]`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `bot_token` | `string` | *(required)* | Slack bot OAuth token (`xoxb-...`) |
| `app_token` | `string?` | `null` | App-level token for Socket Mode (`xapp-...`) |
| `channel_id` | `string?` | `null` | Restrict to a single channel |
| `allowed_users` | `string[]` | `[]` | Allowed Slack user IDs. Empty = deny all |
| `mention_only` | `bool` | `false` | Only respond to @-mentions in groups |

### `[channels_config.lark]`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `app_id` | `string` | *(required)* | Lark/Feishu App ID |
| `app_secret` | `string` | *(required)* | Lark/Feishu App Secret |
| `encrypt_key` | `string?` | `null` | Event encryption key |
| `verification_token` | `string?` | `null` | Event verification token |
| `allowed_users` | `string[]` | `[]` | Allowed user IDs. Empty = deny all |
| `use_feishu` | `bool` | `false` | Use Feishu (China) API endpoints instead of Lark (international) |
| `receive_mode` | `"websocket" \| "webhook"` | `"websocket"` | Message receive mode |
| `port` | `u16?` | `null` | Webhook listen port (only for webhook mode) |
| `mention_only` | `bool` | `false` | Only respond to @-mentions |

PRX also supports these additional channels (configured under `[channels_config.*]`):

- **Matrix** -- `homeserver`, `access_token`, room allowlists
- **Signal** -- via signal-cli REST API
- **WhatsApp** -- Cloud API or Web mode
- **iMessage** -- macOS only, contact allowlists
- **DingTalk** -- Stream Mode with `client_id` / `client_secret`
- **QQ** -- Official Bot SDK with `app_id` / `app_secret`
- **Email** -- IMAP/SMTP
- **IRC** -- Server, channel, nick
- **Mattermost** -- URL + bot token
- **Nextcloud Talk** -- base URL + app token
- **Webhook** -- Generic inbound webhooks

## `[memory]`

Memory backend for conversation history, knowledge, and embeddings.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `backend` | `string` | `"sqlite"` | Backend type: `"sqlite"`, `"lucid"`, `"postgres"`, `"markdown"`, `"none"` |
| `auto_save` | `bool` | `true` | Automatically save user conversation input to memory |
| `acl_enabled` | `bool` | `false` | Enable memory access control lists |
| `hygiene_enabled` | `bool` | `true` | Run periodic archiving and retention cleanup |
| `archive_after_days` | `u32` | `7` | Archive daily/session files older than this |
| `purge_after_days` | `u32` | `30` | Purge archived files older than this |
| `conversation_retention_days` | `u32` | `3` | SQLite: prune conversation rows older than this |
| `daily_retention_days` | `u32` | `7` | SQLite: prune daily rows older than this |
| `embedding_provider` | `string` | `"none"` | Embedding provider: `"none"`, `"openai"`, `"custom:<URL>"` |
| `embedding_model` | `string` | `"text-embedding-3-small"` | Embedding model name |
| `embedding_dimensions` | `usize` | `1536` | Embedding vector dimensions |
| `vector_weight` | `f64` | `0.7` | Weight for vector similarity in hybrid search (0.0--1.0) |
| `keyword_weight` | `f64` | `0.3` | Weight for BM25 keyword search (0.0--1.0) |
| `min_relevance_score` | `f64` | `0.4` | Minimum hybrid score to include memory in context |
| `embedding_cache_size` | `usize` | `10000` | Max embedding cache entries before LRU eviction |
| `snapshot_enabled` | `bool` | `false` | Export core memories to `MEMORY_SNAPSHOT.md` |
| `snapshot_on_hygiene` | `bool` | `false` | Run snapshot during hygiene passes |
| `auto_hydrate` | `bool` | `true` | Auto-load from snapshot when `brain.db` is missing |

```toml
[memory]
backend = "sqlite"
auto_save = true
embedding_provider = "openai"
embedding_model = "text-embedding-3-small"
embedding_dimensions = 1536
vector_weight = 0.7
keyword_weight = 0.3
```

## `[router]`

Heuristic LLM router for multi-model deployments. Scores candidate models using a weighted formula combining capability, Elo rating, cost, and latency.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | Enable heuristic routing |
| `alpha` | `f32` | `0.0` | Similarity score weight |
| `beta` | `f32` | `0.5` | Capability score weight |
| `gamma` | `f32` | `0.3` | Elo score weight |
| `delta` | `f32` | `0.1` | Cost penalty coefficient |
| `epsilon` | `f32` | `0.1` | Latency penalty coefficient |
| `knn_enabled` | `bool` | `false` | Enable KNN semantic routing from history |
| `knn_min_records` | `usize` | `10` | Minimum history records before KNN affects routing |
| `knn_k` | `usize` | `7` | Number of nearest neighbors for voting |

### `[router.automix]`

Adaptive escalation policy: start with a cheap model, escalate to premium when confidence drops.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | Enable Automix escalation |
| `confidence_threshold` | `f32` | `0.7` | Escalate when confidence falls below this (0.0--1.0) |
| `cheap_model_tiers` | `string[]` | `[]` | Model tiers considered "cheap-first" |
| `premium_model_id` | `string` | `""` | Model used for escalation |

```toml
[router]
enabled = true
beta = 0.5
gamma = 0.3
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

## `[security]`

OS-level security: sandboxing, resource limits, and audit logging.

### `[security.sandbox]`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool?` | `null` (auto-detect) | Enable sandbox isolation |
| `backend` | `string` | `"auto"` | Backend: `"auto"`, `"landlock"`, `"firejail"`, `"bubblewrap"`, `"docker"`, `"none"` |
| `firejail_args` | `string[]` | `[]` | Custom Firejail arguments |

### `[security.resources]`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `max_memory_mb` | `u32` | `512` | Maximum memory per command (MB) |
| `max_cpu_time_seconds` | `u64` | `60` | Maximum CPU time per command |
| `max_subprocesses` | `u32` | `10` | Maximum number of subprocesses |
| `memory_monitoring` | `bool` | `true` | Enable memory usage monitoring |

### `[security.audit]`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | Enable audit logging |
| `log_path` | `string` | `"audit.log"` | Path to audit log file (relative to config dir) |
| `max_size_mb` | `u32` | `100` | Maximum log size before rotation |
| `sign_events` | `bool` | `false` | Sign events with HMAC for tamper evidence |

```toml
[security.sandbox]
backend = "landlock"

[security.resources]
max_memory_mb = 1024
max_cpu_time_seconds = 120

[security.audit]
enabled = true
sign_events = true
```

## `[observability]`

Metrics and distributed tracing backend.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `backend` | `string` | `"none"` | Backend: `"none"`, `"log"`, `"prometheus"`, `"otel"` |
| `otel_endpoint` | `string?` | `null` | OTLP endpoint URL (e.g., `"http://localhost:4318"`) |
| `otel_service_name` | `string?` | `null` | Service name for OTel collector (defaults to `"prx"`) |

```toml
[observability]
backend = "otel"
otel_endpoint = "http://localhost:4318"
otel_service_name = "prx-production"
```

## `[mcp]`

[Model Context Protocol](https://modelcontextprotocol.io/) server integration. PRX acts as an MCP client, connecting to external MCP servers for additional tools.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | Enable MCP client integration |

### `[mcp.servers.<name>]`

Each named server is a subsection under `[mcp.servers]`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | Per-server enable switch |
| `transport` | `"stdio" \| "http"` | `"stdio"` | Transport type |
| `command` | `string?` | `null` | Command for stdio mode |
| `args` | `string[]` | `[]` | Command arguments for stdio mode |
| `url` | `string?` | `null` | URL for HTTP transport |
| `env` | `map<string, string>` | `{}` | Environment variables for stdio mode |
| `startup_timeout_ms` | `u64` | `10000` | Startup timeout |
| `request_timeout_ms` | `u64` | `30000` | Per-request timeout |
| `tool_name_prefix` | `string` | `"mcp"` | Prefix for exposed tool names |
| `allow_tools` | `string[]` | `[]` | Tool allowlist (empty = all) |
| `deny_tools` | `string[]` | `[]` | Tool denylist |

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]

[mcp.servers.remote-api]
transport = "http"
url = "http://localhost:8090/mcp"
request_timeout_ms = 60000
```

## `[browser]`

Browser automation tool configuration.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | Enable the `browser_open` tool |
| `allowed_domains` | `string[]` | `[]` | Allowed domains (exact or subdomain match) |
| `session_name` | `string?` | `null` | Named browser session for automation |

```toml
[browser]
enabled = true
allowed_domains = ["docs.rs", "github.com", "*.example.com"]
```

## `[web_search]`

Web search and URL fetch tool configuration.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | Enable the `web_search` tool |
| `provider` | `string` | `"duckduckgo"` | Search provider: `"duckduckgo"` (free) or `"brave"` (API key required) |
| `brave_api_key` | `string?` | `null` | Brave Search API key |
| `max_results` | `usize` | `5` | Maximum results per search (1--10) |
| `timeout_secs` | `u64` | `15` | Request timeout |
| `fetch_enabled` | `bool` | `true` | Enable the `web_fetch` tool |
| `fetch_max_chars` | `usize` | `10000` | Max characters returned by `web_fetch` |

```toml
[web_search]
enabled = true
provider = "brave"
brave_api_key = "BSA..."
max_results = 5
fetch_enabled = true
```

## `[xin]`

Xin (heart/mind) autonomous task engine -- schedules and executes background tasks including evolution, fitness checks, and hygiene operations.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | Enable the Xin task engine |
| `interval_minutes` | `u32` | `5` | Tick interval in minutes (minimum 1) |
| `max_concurrent` | `usize` | `4` | Maximum concurrent task executions per tick |
| `max_tasks` | `usize` | `128` | Maximum total tasks in the store |
| `stale_timeout_minutes` | `u32` | `60` | Minutes before a running task is marked stale |
| `builtin_tasks` | `bool` | `true` | Auto-register built-in system tasks |
| `evolution_integration` | `bool` | `false` | Let Xin manage evolution/fitness scheduling |

```toml
[xin]
enabled = true
interval_minutes = 10
max_concurrent = 4
builtin_tasks = true
evolution_integration = true
```

## `[cost]`

Spending limits and per-model pricing for cost tracking.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | Enable cost tracking |
| `daily_limit_usd` | `f64` | `10.0` | Daily spending limit in USD |
| `monthly_limit_usd` | `f64` | `100.0` | Monthly spending limit in USD |
| `warn_at_percent` | `u8` | `80` | Warn when spending reaches this percentage of limit |
| `allow_override` | `bool` | `false` | Allow requests to exceed budget with `--override` flag |

```toml
[cost]
enabled = true
daily_limit_usd = 25.0
monthly_limit_usd = 500.0
warn_at_percent = 80
```

## `[reliability]`

Retry and fallback chain configuration for resilient provider access.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `max_retries` | `u32` | `3` | Maximum retry attempts for transient failures |
| `fallback_providers` | `string[]` | `[]` | Ordered list of fallback provider names |

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

## `[secrets]`

Encrypted credential store using ChaCha20-Poly1305.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `encrypt` | `bool` | `true` | Enable encryption for API keys and tokens in config |

## `[auth]`

External credential import settings.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `codex_auth_json_auto_import` | `bool` | `true` | Auto-import OAuth credentials from Codex CLI `auth.json` |
| `codex_auth_json_path` | `string` | `"~/.codex/auth.json"` | Path to Codex CLI auth file |

## `[proxy]`

Outbound HTTP/HTTPS/SOCKS5 proxy configuration.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | Enable proxy |
| `http_proxy` | `string?` | `null` | HTTP proxy URL |
| `https_proxy` | `string?` | `null` | HTTPS proxy URL |
| `all_proxy` | `string?` | `null` | Fallback proxy for all schemes |
| `no_proxy` | `string[]` | `[]` | Bypass list (same format as `NO_PROXY`) |
| `scope` | `string` | `"zeroclaw"` | Scope: `"environment"`, `"zeroclaw"`, `"services"` |
| `services` | `string[]` | `[]` | Service selectors when scope is `"services"` |

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1", "*.internal"]
scope = "zeroclaw"
```
