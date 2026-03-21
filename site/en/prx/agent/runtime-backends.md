---
title: Runtime Backends
description: Pluggable execution backends in PRX -- Native, Docker, and WASM runtimes for tool and command execution.
---

# Runtime Backends

PRX supports multiple execution backends for running tools, commands, and external processes. The runtime subsystem abstracts away the execution environment behind the `RuntimeAdapter` trait, allowing you to switch between local process execution, Docker containers, and WebAssembly sandboxes without changing your agent configuration.

## Overview

When an agent executes a tool that requires running an external command (shell scripts, MCP servers, skill integrations), the runtime backend determines how that command is executed:

| Backend | Isolation | Overhead | Use Case |
|---------|-----------|----------|----------|
| **Native** | Process-level | Minimal | Development, trusted environments |
| **Docker** | Container-level | Moderate | Production, untrusted tools, reproducibility |
| **WASM** | Sandbox-level | Low | Portable skills, maximum isolation, plugin system |

```
Agent Loop
    │
    ├── Tool Call: "shell" with command "ls -la"
    │
    ▼
┌───────────────────────────────────┐
│         RuntimeAdapter            │
│  ┌─────────┬─────────┬─────────┐ │
│  │ Native  │ Docker  │  WASM   │ │
│  │ Runtime │ Runtime │ Runtime │ │
│  └────┬────┴────┬────┴────┬────┘ │
└───────┼─────────┼─────────┼──────┘
        │         │         │
   ┌────▼────┐ ┌──▼───┐ ┌──▼────┐
   │ Process │ │ ctr  │ │ wasmr │
   │ spawn   │ │ exec │ │ exec  │
   └─────────┘ └──────┘ └───────┘
```

## RuntimeAdapter Trait

All backends implement the `RuntimeAdapter` trait:

```rust
#[async_trait]
pub trait RuntimeAdapter: Send + Sync {
    async fn execute(&self, command: &str, args: &[String],
        env: &HashMap<String, String>, working_dir: Option<&Path>,
        timeout: Duration) -> Result<ExecutionOutput>;
    async fn is_available(&self) -> bool;
    fn name(&self) -> &str;
}
```

`ExecutionOutput` contains `stdout`, `stderr`, `exit_code`, and `duration`.

## Configuration

Select and configure the runtime backend in `config.toml`:

```toml
[runtime]
# Backend selection: "native" | "docker" | "wasm" | "auto"
backend = "auto"

# Global execution timeout (can be overridden per-tool).
default_timeout_secs = 60

# Maximum output size captured from stdout/stderr.
max_output_bytes = 1048576  # 1 MB

# Environment variable whitelist. Only these variables are
# passed to child processes (all backends).
env_whitelist = ["PATH", "HOME", "TERM", "LANG", "USER"]
```

### Auto-Detection

When `backend = "auto"`, PRX selects the runtime based on availability:

1. If Docker is running and accessible, use Docker
2. If a WASM runtime is available, use WASM for compatible tools
3. Fall back to Native

The auto-detection runs once at startup and logs the selected backend.

## Native Runtime

The Native runtime spawns commands as local child processes using `tokio::process::Command`. It is the simplest and fastest backend, with no additional dependencies.

### Configuration

```toml
[runtime]
backend = "native"

[runtime.native]
# Shell to use for command execution.
shell = "/bin/bash"

# Additional environment variables to set.
[runtime.native.env]
RUSTFLAGS = "-D warnings"
```

### Characteristics

| Property | Value |
|----------|-------|
| Isolation | Process-level only (inherits user permissions) |
| Startup time | < 10ms |
| Filesystem access | Full (limited by user permissions and sandbox) |
| Network access | Full (limited by sandbox) |
| Dependencies | None |
| Platform | All (Linux, macOS, Windows) |

### Security Considerations

The Native runtime provides no isolation beyond standard Unix process boundaries. Commands run with the same permissions as the PRX process. Always combine with the [sandbox subsystem](/en/prx/security/sandbox) when running untrusted commands:

```toml
[runtime]
backend = "native"

[security.sandbox]
backend = "bubblewrap"
allow_network = false
writable_paths = ["/tmp"]
```

## Docker Runtime

The Docker runtime executes commands inside ephemeral containers. Each execution creates a new container, runs the command, captures output, and destroys the container.

### Configuration

```toml
[runtime]
backend = "docker"

[runtime.docker]
image = "debian:bookworm-slim"
socket = "/var/run/docker.sock"
memory_limit = "256m"
cpu_limit = "1.0"
pids_limit = 100
network = "none"          # "none" | "bridge" | "host"
mount_workspace = true
workspace_mount_path = "/workspace"
auto_pull = true
auto_remove = true
```

Startup time is 500ms-2s depending on image. Filesystem access is limited to the container plus explicitly mounted volumes.

### Security

The Docker runtime provides strong isolation by default: network isolation (`network = "none"`), resource limits (memory/CPU/PID), read-only root filesystem, no privileged mode, and automatic container removal after execution. Per-tool image overrides are supported via `[runtime.docker.tool_images]`.

## WASM Runtime

The WASM (WebAssembly) runtime executes tools compiled to `.wasm` modules. WASM provides portable, sandboxed execution with fine-grained capability control via WASI (WebAssembly System Interface).

### Configuration

```toml
[runtime]
backend = "wasm"

[runtime.wasm]
# WASM runtime engine: "wasmtime" | "wasmer"
engine = "wasmtime"

# Directory containing .wasm modules.
module_path = "~/.local/share/openprx/wasm/"

# WASI capabilities granted to WASM modules.
[runtime.wasm.capabilities]
filesystem_read = ["/workspace"]
filesystem_write = ["/tmp"]
network = false
env_vars = ["HOME", "USER"]

# Maximum execution time for a single WASM call.
timeout_secs = 30

# Maximum memory allocation for WASM modules.
max_memory_mb = 128
```

### Characteristics

| Property | Value |
|----------|-------|
| Isolation | WASM sandbox (capability-based) |
| Startup time | 10-50ms |
| Filesystem access | WASI pre-opened directories only |
| Network access | Configurable via WASI |
| Dependencies | `wasmtime` or `wasmer` runtime (conditional compile) |
| Platform | All (WASM is platform-independent) |

### Conditional Compilation

The WASM runtime is conditionally compiled behind a feature flag:

```bash
# Build PRX with WASM support
cargo build --release --features wasm-runtime
```

Without the feature flag, the WASM backend is not available and `backend = "auto"` will skip it.

### Plugin System

The WASM runtime powers PRX's plugin system. Skills distributed as `.wasm` modules can be loaded dynamically without trusting native code. Register WASM tools in `config.toml` under `[tools.custom.<name>]` with `type = "wasm"` and a `module` path.

## Factory Function

PRX uses a factory function (`create_runtime`) to select the backend at startup. It matches the configured `backend` string to the appropriate `RuntimeAdapter` implementation and validates that the backend is available (e.g., Docker daemon running, WASM engine compiled in).

## Comparison Matrix

| Feature | Native | Docker | WASM |
|---------|--------|--------|------|
| Setup complexity | None | Docker daemon | Feature flag + modules |
| Startup latency | < 10ms | 500ms - 2s | 10-50ms |
| Isolation strength | Low | High | High |
| Resource control | OS limits | cgroups | WASM memory limits |
| Network isolation | Via sandbox | Built-in | WASI capability |
| Filesystem isolation | Via sandbox | Built-in | WASI pre-opens |
| Portability | Platform-native | OCI images | Platform-independent |
| Tool compatibility | All | All (with image) | WASM-compiled only |

## Security Notes

- The runtime backend is a defense layer, not a replacement for the [sandbox](/en/prx/security/sandbox). Both systems work together -- the runtime provides the execution environment, the sandbox adds OS-level restrictions.
- Docker runtime requires access to the Docker socket, which itself is a privileged resource. Run PRX under a dedicated service account.
- WASM modules have no ambient authority. Every capability (filesystem, network, environment) must be explicitly granted.
- The `env_whitelist` setting applies to all backends. API keys and secrets are never passed to tool execution environments.

## Related Pages

- [Agent Runtime Architecture](/en/prx/agent/runtime)
- [Sandbox](/en/prx/security/sandbox)
- [Skillforge](/en/prx/tools/skillforge)
- [Session Worker](/en/prx/agent/session-worker)
- [Tools Overview](/en/prx/tools/)
