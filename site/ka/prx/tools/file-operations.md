---
title: ფაილის ოპერაციები
description: The file_read and file_write tools provide filesystem access with path validation, memory ACL enforcement, and security policy integration.
---

# File Operations

PRX provides two core file operation tools -- `file_read` and `file_write` -- that are part of the minimal `default_tools()` set. These tools are always available, require no additional configuration, and form the foundation of the agent's ability to interact with the local filesystem.

Both tools are subject to the security policy engine. Path validation ensures the agent can only access files within allowed directories. When memory ACL is enabled, `file_read` additionally blocks access to memory markdown files to prevent the agent from bypassing access control by reading memory storage directly.

Unlike the `shell` tool, file operations do not spawn external processes. They are implemented as direct Rust I/O operations within the PRX process, making them faster and easier to audit than equivalent shell commands like `cat` or `echo >`.

## კონფიგურაცია

File operations do not have a dedicated configuration section. Their behavior is controlled through the security policy engine and memory ACL settings:

```toml
# Memory ACL affects file_read behavior
[memory]
acl_enabled = false    # When true, file_read blocks access to memory files

# Security policy can restrict file access paths
[security.tool_policy.tools]
file_read = "allow"    # "allow" | "deny" | "supervised"
file_write = "allow"

# Path-based policy rules
[[security.policy.rules]]
name = "allow-workspace-read"
action = "allow"
tools = ["file_read"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "allow-workspace-write"
action = "allow"
tools = ["file_write"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "block-sensitive-paths"
action = "deny"
tools = ["file_read", "file_write"]
paths = ["/etc/shadow", "/root/**", "**/.ssh/**", "**/.env"]
```

## გამოყენება

### file_read

The `file_read` tool reads file contents and returns them as a string. It is the primary way the agent inspects files during its reasoning loop.

```json
{
  "name": "file_read",
  "arguments": {
    "path": "/home/user/project/src/main.rs"
  }
}
```

The agent typically uses `file_read` to:

- Inspect source code before making modifications
- Read configuration files to understand system state
- Check log files for error messages
- Review documentation or README files

### file_write

The `file_write` tool writes content to a file, creating it if it does not exist or overwriting its contents if it does.

```json
{
  "name": "file_write",
  "arguments": {
    "path": "/home/user/project/src/config.toml",
    "content": "[server]\nport = 8080\nhost = \"0.0.0.0\"\n"
  }
}
```

The agent typically uses `file_write` to:

- Create new source files or configuration files
- Modify existing files (after reading them with `file_read`)
- Write generated reports or summaries
- Save processed data to disk

## Parameters

### file_read Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `path` | `string` | Yes | -- | Absolute or relative path to the file to read |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` if the file was read successfully |
| `output` | `string` | The file contents as a UTF-8 string |
| `error` | `string?` | Error message if the read failed (file not found, permission denied, ACL blocked, etc.) |

### file_write Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `path` | `string` | Yes | -- | Absolute or relative path to the file to write |
| `content` | `string` | Yes | -- | The content to write to the file |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` if the file was written successfully |
| `output` | `string` | Confirmation message (e.g., "File written: /path/to/file") |
| `error` | `string?` | Error message if the write failed (permission denied, path blocked, etc.) |

## Path Validation

Both tools perform path validation before executing the I/O operation:

1. **Path normalization** -- relative paths are resolved against the current working directory. Symlinks are resolved to detect path traversal.
2. **Policy check** -- the resolved path is checked against the security policy rules. If no rule explicitly allows the path and the default action is `deny`, the operation is blocked.
3. **Special path blocking** -- certain paths are always blocked regardless of policy:
   - `/proc/`, `/sys/` (Linux kernel interfaces)
   - Device files in `/dev/` (except `/dev/null`, `/dev/urandom`)
   - Memory storage files when `memory.acl_enabled = true`

### Path Traversal Prevention

The tools resolve symlinks and normalize `..` components before checking policies. This prevents an attacker from using symlinks or relative path tricks to escape allowed directories:

```
# These are all resolved and checked:
/home/user/workspace/../../../etc/passwd  →  /etc/passwd  →  DENIED
/home/user/workspace/link-to-etc          →  /etc/        →  DENIED (if symlink)
```

## Memory ACL Enforcement

When `memory.acl_enabled = true` in the configuration, the `file_read` tool enforces additional restrictions:

- **Memory files blocked**: `file_read` refuses to read markdown files stored in the memory directory (typically `~/.local/share/openprx/memory/`). This prevents the agent from bypassing memory access control by reading the raw storage files.
- **Memory recall disabled**: The `memory_recall` tool is removed from the tool registry entirely when ACL is enabled.
- **Targeted access only**: The agent must use `memory_get` or `memory_search` with proper ACL checks to access memory content.

```toml
[memory]
acl_enabled = true    # Activates file_read restrictions on memory paths
```

This separation ensures that even if the agent knows the physical location of memory files, it cannot read them outside the controlled memory API.

## უსაფრთხოება

### Policy Engine Integration

Every `file_read` and `file_write` call passes through the security policy engine before execution. The policy engine evaluates rules in order:

1. Per-tool policy (`security.tool_policy.tools.file_read`)
2. Path-based rules (`security.policy.rules` with matching `paths` patterns)
3. Default action (`security.policy.default_action`)

### Audit Logging

When audit logging is enabled, every file operation is recorded with:

- Timestamp
- Tool name (`file_read` or `file_write`)
- Resolved file path
- Success/failure status
- Error reason (if denied or failed)

```toml
[security.audit]
enabled = true
log_path = "audit.log"
```

### Sensitive File Protection

The default security policy blocks access to common sensitive paths:

- SSH keys (`~/.ssh/`)
- Environment files (`.env`, `.env.local`)
- Git credentials (`.git-credentials`)
- Shell history (`.bash_history`, `.zsh_history`)
- System password files (`/etc/shadow`)

These defaults can be overridden with explicit allow rules, but this is strongly discouraged in production.

### Binary File Handling

The `file_read` tool reads files as UTF-8 strings. Binary files will produce garbled output or encoding errors. The agent is expected to use the `shell` tool with appropriate commands (e.g., `xxd`, `file`, `hexdump`) for binary file inspection.

## დაკავშირებული

- [Shell Execution](/ka/prx/tools/shell) -- command execution tool (alternative for binary files)
- [Memory Tools](/ka/prx/tools/memory) -- controlled memory access with ACL
- [Policy Engine](/ka/prx/security/policy-engine) -- path-based access control rules
- [Configuration Reference](/ka/prx/config/reference) -- memory and security settings
- [Tools Overview](/ka/prx/tools/) -- all tools and registry system
