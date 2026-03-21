---
title: Backends d'execution
description: Pluggable execution backends in PRX -- Native, Docker, and WASM runtimes for tool and command execution.
---

# Runtime Backends

PRX prend en charge plusieurs backends d'execution pour executer des outils, des commandes et des processus externes. Le runtime subsystem abstracts away the execution environment behind the `RuntimeAdapter` trait, allowing you to switch between local process execution, Docker containers, and WebAssembly sandboxes without changing your agent configuration.

## Apercu

Lorsqu'un agent execute un outil qui necessite l'execution d'une commande externe (shell scripts, MCP servers, skill integrations), le runtime backend determine how that command is executed:

| Backend | Isolation | Surcharge | Use Case |
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

Select and configure le runtime backend in `config.toml`:

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

When `backend = "auto"`, PRX selects le runtime based on availability:

1. Si Docker est en cours d'execution et accessible, utiliser Docker
2. Si un WASM runtime est disponible, use WASM for compatible tools
3. Fall back to Native

The auto-detection runs once au demarrage and logs the selected backend.

## Native Runtime

The Native runtime lance commands as local processus enfants using `tokio::process::Command`. It est le plus simple and fastest backend, sans additional dependencies.

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

| Property | Valeur |
|----------|-------|
| Isolation | Process-level only (herite de user permissions) |
| Startup time | < 10ms |
| Filesystem access | Full (limited by user permissions and sandbox) |
| Network access | Full (limited by sandbox) |
| Dependencies | Aucun |
| Plateforme | All (Linux, macOS, Windows) |

### Securite Considerations

The Native runtime ne fournit aucune isolation au-dela des limites de processus Unix standard. Les commandes s'executent avec les memes permissions comme le PRX process. Always combine avec le [sandbox subsystem](/fr/prx/security/sandbox) when running untrusted commands:

```toml
[runtime]
backend = "native"

[security.sandbox]
backend = "bubblewrap"
allow_network = false
writable_paths = ["/tmp"]
```

## Docker Runtime

Le runtime Docker execute les commandes dans des conteneurs ephemeres. Chaque execution cree un nouveau conteneur, runs la commande, captures output, and destroys the container.

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

Startup time is 500ms-2s en fonction de image. Filesystem access is limited vers le container plus explicitly mounted volumes.

### Securite

Le runtime Docker fournit une forte isolation par defaut: isolation reseau (`network = "none"`), resource limits (memory/CPU/PID), read-only root filesystem, no privileged mode, and automatic container removal apres l'execution. Per-tool image overrides sont pris en charge via `[runtime.docker.tool_images]`.

## WASM Runtime

Le runtime WASM (WebAssembly) execute des outils compiles en `.wasm` modules. WASM fournit une execution portable et sandbox with fine-grained capability control via WASI (WebAssembly System Interface).

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

| Property | Valeur |
|----------|-------|
| Isolation | WASM sandbox (capability-based) |
| Startup time | 10-50ms |
| Filesystem access | WASI pre-opened directories only |
| Network access | Configurable via WASI |
| Dependencies | `wasmtime` or `wasmer` runtime (conditional compile) |
| Plateforme | All (WASM is platform-independent) |

### Conditional Compilation

The WASM runtime is conditionally compiled behind a feature flag:

```bash
# Build PRX with WASM support
cargo build --release --features wasm-runtime
```

Without the feature flag, the WASM backend n'est pas disponible and `backend = "auto"` will skip it.

### Plugin System

The WASM runtime powers PRX's plugin system. Skills distributed as `.wasm` modules peut etre loaded dynamically without trusting native code. Register WASM tools in `config.toml` under `[tools.custom.<name>]` with `type = "wasm"` and a `module` path.

## Factory Function

PRX utilise a factory function (`create_runtime`) to select le backend au demarrage. It matches the configured `backend` string vers le appropriate `RuntimeAdapter` implementation and valide that le backend est disponible (e.g., Docker daemon running, WASM engine compiled in).

## Comparison Matrix

| Feature | Native | Docker | WASM |
|---------|--------|--------|------|
| Setup complexity | Aucun | Docker daemon | Feature flag + modules |
| Startup latency | < 10ms | 500ms - 2s | 10-50ms |
| Isolation strength | Low | High | High |
| Resource control | OS limits | cgroups | WASM memory limits |
| Network isolation | Via sandbox | Built-in | WASI capability |
| Filesystem isolation | Via sandbox | Built-in | WASI pre-opens |
| Portability | Plateforme-native | OCI images | Plateforme-independent |
| Tool compatibility | All | All (with image) | WASM-compiled uniquement |

## Securite Nontes

- Le runtime backend is a defense layer, not a replacement pour le [sandbox](/fr/prx/security/sandbox). Both systems work together -- le runtime provides the execution environment, le sandbox adds OS-level restrictions.
- Docker runtime necessite access vers le Docker socket, which itself is a privileged resource. Run PRX under a dedicated service account.
- WASM modules have no ambient authority. Every capability (filesystem, network, environment) doit etre explicitement accorde.
- The `env_whitelist` setting applies to all backends. API keys and secrets are never passed to execution d'outil environments.

## Voir aussi Pages

- [Agent Runtime Architecture](/fr/prx/agent/runtime)
- [Sandbox](/fr/prx/security/sandbox)
- [Skillforge](/fr/prx/tools/skillforge)
- [Session Worker](/fr/prx/agent/session-worker)
- [Tools Overview](/fr/prx/tools/)
