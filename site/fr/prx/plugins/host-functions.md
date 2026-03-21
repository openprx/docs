---
title: Fonctions hote
description: Reference for fonctions hote available to PRX WASM plugins.
---

# Host Functions

Host functions are l'API surface expose by PRX to WASM plugins. They provide controlled access to host capabilities like HTTP requests, file operations, et agent state.

## Available Host Functions

### HTTP

| Function | Description | Permission |
|----------|-------------|-----------|
| `http_request(method, url, headers, body)` | Make an HTTP request | `net.http` |
| `http_get(url)` | Shorthand for GET request | `net.http` |
| `http_post(url, body)` | Shorthand for POST request | `net.http` |

### Filesystem

| Function | Description | Permission |
|----------|-------------|-----------|
| `fs_read(path)` | Read a file | `fs.read` |
| `fs_write(path, data)` | Write a file | `fs.write` |
| `fs_list(path)` | List directory contents | `fs.read` |

### Agent State

| Function | Description | Permission |
|----------|-------------|-----------|
| `memory_get(key)` | Read depuis ungent memory | `agent.memory.read` |
| `memory_set(key, value)` | Write to agent memory | `agent.memory.write` |
| `config_get(key)` | Read plugin configuration | `agent.config` |

### Logging

| Function | Description | Permission |
|----------|-------------|-----------|
| `log_info(msg)` | Log at info level | Always allowed |
| `log_warn(msg)` | Log at warn level | Always allowed |
| `log_error(msg)` | Log at error level | Always allowed |

## Permission Manifest

Chaque plugin declares required permissions in its manifest:

```toml
[permissions]
net.http = ["api.example.com"]
fs.read = ["/data/*"]
agent.memory.read = true
```

## Voir aussi Pages

- [Plugin Architecture](./architecture)
- [PDK Reference](./pdk)
- [Security Sandbox](/fr/prx/security/sandbox)
