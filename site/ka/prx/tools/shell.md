---
title: Shell-ის შესრულება
description: The shell tool executes commands in sandboxed environments with configurable isolation backends, environment sanitization, timeout enforcement, and output limits.
---

# Shell Execution

The `shell` tool is one of the three core tools in PRX, available in both `default_tools()` and `all_tools()` registries. It provides OS-level command execution inside a configurable sandbox, ensuring that agent-initiated commands run under strict isolation, time limits, and output constraints.

When the LLM determines it needs to run a shell command -- installing a package, compiling code, querying system state, or running a script -- it invokes the `shell` tool with the command string. PRX wraps the execution in the configured sandbox backend, enforces a 60-second default timeout, caps output at 1 MB, and strips sensitive environment variables before spawning the child process.

The shell tool is typically the most powerful and most restricted tool in the PRX arsenal. It is the primary target of the security policy engine, and most deployments mark it as `supervised` to require human approval before execution.

## კონფიგურაცია

The shell tool itself has no dedicated configuration section. Its behavior is controlled through the security sandbox and resource limits:

```toml
[security.sandbox]
enabled = true
backend = "auto"         # "auto" | "landlock" | "firejail" | "bubblewrap" | "docker" | "none"

# Custom Firejail arguments (when backend = "firejail")
firejail_args = ["--net=none", "--noroot"]

[security.sandbox.docker]
image = "prx-sandbox:latest"
network = "none"
memory_limit = "256m"
cpu_limit = "1.0"

[security.sandbox.bubblewrap]
allow_network = false
writable_paths = ["/tmp"]
readonly_paths = ["/usr", "/lib"]

[security.resources]
max_memory_mb = 512
max_cpu_time_seconds = 60
max_subprocesses = 10
memory_monitoring = true
```

To mark the shell as supervised (requiring approval per invocation):

```toml
[security.tool_policy.tools]
shell = "supervised"
```

## Sandbox Backends

PRX supports five sandbox backends. When `backend = "auto"`, PRX probes for available backends in the following priority order and selects the first one found:

| Backend | Platform | Isolation Level | Overhead | Notes |
|---------|----------|----------------|----------|-------|
| **Landlock** | Linux (5.13+) | Filesystem LSM | Minimal | Kernel-native, no extra dependencies. Restricts filesystem paths at the kernel level. |
| **Firejail** | Linux | Full (network, filesystem, PID) | Low | User-space sandbox. Supports `--net=none` for network isolation, PID namespace, seccomp filtering. |
| **Bubblewrap** | Linux, macOS | Namespace-based | Low | Uses user namespaces. Configurable writable/readonly path lists. |
| **Docker** | Any | Full container | High | Runs commands inside a disposable container. Maximum isolation but highest latency. |
| **None** | Any | Application-layer only | None | No OS-level isolation. PRX still enforces timeout and output caps, but the process has full OS access. |

### Landlock

Landlock is a Linux Security Module available in kernel 5.13+. It restricts filesystem access at the kernel level without requiring root privileges. PRX uses Landlock to limit which paths the shell command can read from and write to.

### Firejail

Firejail provides comprehensive sandboxing via Linux namespaces and seccomp. Custom arguments can be passed through `firejail_args`:

```toml
[security.sandbox]
backend = "firejail"
firejail_args = ["--net=none", "--noroot", "--nosound", "--no3d"]
```

### Bubblewrap

Bubblewrap (`bwrap`) uses user namespaces to create minimal sandboxed environments. It is lighter than Firejail and works on some macOS configurations:

```toml
[security.sandbox.bubblewrap]
allow_network = false
writable_paths = ["/tmp", "/home/user/workspace"]
readonly_paths = ["/usr", "/lib", "/bin"]
```

### Docker

Docker provides full container isolation. Each command runs in a fresh container based on the configured image:

```toml
[security.sandbox.docker]
image = "prx-sandbox:latest"
network = "none"
memory_limit = "256m"
cpu_limit = "1.0"
```

## გამოყენება

The shell tool is invoked by the LLM during agentic loops. In agent conversations, the LLM generates a tool call like:

```json
{
  "name": "shell",
  "arguments": {
    "command": "ls -la /home/user/project"
  }
}
```

From the CLI, you can observe shell tool invocations in the agent output. The tool call shows the command being executed and the sandbox backend in use.

### Execution Flow

1. The LLM generates a `shell` tool call with a `command` argument
2. The security policy engine checks whether the call is allowed, denied, or requires supervision
3. If supervised, PRX prompts the user for approval before proceeding
4. The sandbox backend wraps the command in the appropriate isolation layer
5. Environment variables are sanitized (see below)
6. The command executes with a 60-second timeout
7. stdout and stderr are captured, truncated to 1 MB if necessary
8. The result is returned to the LLM as a `ToolResult` with success/failure status

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `command` | `string` | Yes | -- | The shell command to execute. Passed to `/bin/sh -c` (or equivalent). |

The tool returns a `ToolResult` containing:

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` if the command exited with code 0 |
| `output` | `string` | Combined stdout and stderr, truncated to 1 MB |
| `error` | `string?` | Error message if the command failed or timed out |

## Environment Sanitization

The shell tool only passes a strict whitelist of environment variables to child processes. This prevents accidental leakage of API keys, tokens, and secrets that may be present in the daemon's environment.

**Allowed environment variables:**

| Variable | Purpose |
|----------|---------|
| `PATH` | Executable search path |
| `HOME` | User home directory |
| `TERM` | Terminal type |
| `LANG` | Locale language |
| `LC_ALL` | Locale override |
| `LC_CTYPE` | Character type locale |
| `USER` | Current username |
| `SHELL` | Default shell path |
| `TMPDIR` | Temporary directory |

All other variables -- including `API_KEY`, `AWS_SECRET_ACCESS_KEY`, `GITHUB_TOKEN`, `OPENAI_API_KEY`, and any custom variables -- are stripped from the child process environment. This is a hard-coded security boundary that cannot be overridden through configuration.

## Resource Limits

| Limit | Default | Configurable | Description |
|-------|---------|-------------|-------------|
| Timeout | 60 seconds | `security.resources.max_cpu_time_seconds` | Maximum wall-clock time per command |
| Output size | 1 MB | -- | Maximum combined stdout + stderr |
| Memory | 512 MB | `security.resources.max_memory_mb` | Maximum memory usage per command |
| Subprocesses | 10 | `security.resources.max_subprocesses` | Maximum child processes spawned |

When a command exceeds the timeout, PRX sends SIGTERM followed by SIGKILL after a grace period. The tool result reports the timeout as an error.

When output exceeds 1 MB, it is truncated and a note is appended indicating the truncation.

## უსაფრთხოება

- **Sandbox isolation**: Commands run inside the configured sandbox backend, limiting filesystem, network, and process access
- **Environment sanitization**: Only 9 whitelisted environment variables are passed to child processes
- **Policy engine**: Every shell invocation passes through the security policy engine before execution
- **Audit logging**: All shell commands and their results are logged to the audit log when `security.audit.enabled = true`
- **Supervised mode**: The shell tool can be marked as `supervised` in the tool policy, requiring explicit user approval before each execution
- **Resource limits**: Hard limits on timeout, memory, output size, and subprocess count prevent resource exhaustion

### Threat Mitigation

The shell tool is the primary vector for prompt injection attacks. If an attacker can influence the LLM's reasoning (through malicious document content, for example), the shell tool is what they would use to execute commands. PRX mitigates this through:

1. **Sandbox confinement** -- even if a malicious command executes, it runs with restricted filesystem and network access
2. **Environment stripping** -- API keys and secrets are not available to the child process
3. **Supervision mode** -- a human-in-the-loop can review each command before execution
4. **Audit trail** -- all commands are logged for forensic review

## დაკავშირებული

- [Security Sandbox](/ka/prx/security/sandbox) -- detailed sandbox backend documentation
- [Policy Engine](/ka/prx/security/policy-engine) -- tool access control rules
- [Configuration Reference](/ka/prx/config/reference) -- `security.sandbox` and `security.resources` fields
- [Tools Overview](/ka/prx/tools/) -- all 46+ tools and registry system
