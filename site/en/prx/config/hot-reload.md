---
title: Hot Reload
description: How PRX applies configuration changes without restart -- what is hot-reloadable, what requires a restart, and how the file watcher works.
---

# Hot Reload

PRX supports hot-reloading most configuration changes. When you edit `config.toml` (or any fragment in `config.d/`), the changes are detected and applied within seconds -- no restart required.

## How It Works

PRX uses a three-layer mechanism for live configuration updates:

1. **File Watcher** -- A `notify` file system watcher monitors the configuration directory (both `config.toml` and the entire `config.d/` tree) for write events.

2. **Debounce** -- Events are debounced with a 1-second window to coalesce rapid successive writes (e.g., from editors that write-then-rename).

3. **Atomic Swap** -- On detecting a change, PRX:
   - Computes a SHA-256 fingerprint of the new configuration
   - Compares it against the last known fingerprint (skips if identical)
   - Parses the new TOML into a `Config` struct
   - On success: atomically publishes the new config via `ArcSwap` (lock-free)
   - On failure: retains the previous config and logs a warning

The `SharedConfig` type (`Arc<ArcSwap<Config>>`) ensures that all components reading the config get a consistent snapshot with zero contention. Readers call `.load_full()` to get an `Arc<Config>` snapshot that remains valid even if the config is swapped during use.

## What Is Hot-Reloadable

The following changes take effect immediately (within ~1 second):

| Category | Examples |
|----------|---------|
| **Provider settings** | `default_provider`, `default_model`, `default_temperature`, `api_key`, `api_url` |
| **Channel settings** | Telegram `allowed_users`, Discord `mention_only`, Slack `channel_id`, etc. |
| **Memory settings** | `backend`, `auto_save`, `embedding_provider`, retention periods |
| **Router settings** | `enabled`, weights (`alpha`/`beta`/`gamma`/`delta`/`epsilon`), Automix thresholds |
| **Security settings** | Sandbox backend, resource limits, audit configuration |
| **Autonomy settings** | Scope rules, autonomy levels |
| **MCP settings** | Server definitions, timeouts, tool allowlists |
| **Web search settings** | `enabled`, `provider`, `max_results` |
| **Browser settings** | `enabled`, `allowed_domains` |
| **Xin settings** | `enabled`, `interval_minutes`, task limits |
| **Cost settings** | `daily_limit_usd`, `monthly_limit_usd`, pricing |
| **Reliability settings** | `max_retries`, `fallback_providers` |
| **Observability settings** | `backend`, OTLP endpoint |
| **Proxy settings** | Proxy URLs, no-proxy lists, scope |

## What Requires a Restart

A small number of settings are bound at startup and cannot be changed at runtime:

| Setting | Reason |
|---------|--------|
| `[gateway] host` | TCP listener is bound once at startup |
| `[gateway] port` | TCP listener is bound once at startup |
| `[tunnel]` settings | Tunnel connections are established at startup |
| Channel bot tokens | Bot connections (Telegram long-poll, Discord gateway, Slack socket) are initialized once |

For these settings, you must restart the PRX daemon:

```bash
# If running as a systemd service
sudo systemctl restart openprx

# If running in foreground
# Stop with Ctrl+C, then start again
prx
```

## CLI Reload Command

You can manually trigger a configuration reload without editing the file:

```bash
prx config reload
```

This is equivalent to the file watcher detecting a change. It re-reads and re-parses the configuration files and atomically swaps the live config. This is useful when:

- You have modified the file but the watcher missed the event (rare)
- You want to force a reload after updating environment variables
- You are scripting configuration changes

## Error Handling

If the new configuration file contains errors:

- **TOML syntax errors** -- The parser rejects the file. The previous config is retained. A warning is logged with the parse error details.
- **Invalid field values** -- Validation catches issues like `confidence_threshold > 1.0` or empty `premium_model_id` when Automix is enabled. The previous config is retained.
- **Missing file** -- If `config.toml` is deleted, the watcher logs an error but the in-memory config continues to work.

In all error cases, PRX continues operating with the last known good configuration. No data is lost and no service interruption occurs.

## Monitoring Reloads

The `HotReloadManager` maintains a monotonic `reload_version` counter that increments on each successful reload. You can check the current version via the gateway status endpoint:

```bash
curl http://localhost:16830/api/status
```

The response includes the current reload count, helping you verify that your changes have been applied.

## Split File Reloads

When using split configuration files (`config.d/*.toml`), the watcher monitors the entire `config.d/` directory recursively. A change to any `.toml` fragment triggers a full re-merge and reload of all configuration. This means:

- Editing `config.d/channels.toml` reloads the entire config (not just channels)
- Adding or removing a fragment file triggers a reload
- The merge order is alphabetical by filename, with fragments taking precedence over `config.toml`
