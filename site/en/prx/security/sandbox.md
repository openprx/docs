---
title: Sandbox
description: Sandbox backends for isolating tool execution in PRX.
---

# Sandbox

The PRX sandbox provides process and filesystem isolation for tool execution. When an agent calls a tool that runs external commands, the sandbox ensures the command runs in a restricted environment.

## Sandbox Backends

PRX supports multiple sandbox backends:

| Backend | Platform | Isolation Level | Overhead |
|---------|----------|----------------|----------|
| **Docker** | Linux, macOS | Full container | High |
| **Bubblewrap** | Linux | Namespace + seccomp | Low |
| **Firejail** | Linux | Namespace + seccomp | Low |
| **Landlock** | Linux (5.13+) | Kernel LSM | Minimal |
| **None** | All | No isolation | None |

## Configuration

```toml
[security.sandbox]
backend = "bubblewrap"

[security.sandbox.docker]
image = "prx-sandbox:latest"
network = "none"
memory_limit = "256m"
cpu_limit = "1.0"

[security.sandbox.bubblewrap]
allow_network = false
writable_paths = ["/tmp"]
readonly_paths = ["/usr", "/lib"]
```

## How It Works

1. Agent requests a tool call (e.g., shell command execution)
2. Policy engine checks if the call is allowed
3. Sandbox wraps the execution in the configured backend
4. The tool runs with restricted filesystem and network access
5. Results are captured and returned to the agent

## Related Pages

- [Security Overview](./)
- [Policy Engine](./policy-engine)
- [Session Worker](/en/prx/agent/session-worker)
