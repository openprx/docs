---
title: Operations sur les fichiers
description: Le fichier_read and file_write tools provide filesystem access with path validation, memory ACL enforcement, and security policy integration.
---

# File Operations

PRX fournit deux outils principaux d'operations sur les fichiers -- `file_read` et `file_write` -- that are part of the minimal `default_tools()` set. These tools sont toujours disponibles, require pas de configuration supplementaire, et form the foundation of la reponse de l'agent ability to interact avec le local filesystem.

Les deux outils sont soumis au moteur de politiques de securite. Path validation garantit l'agent ne peut que access files within allowed directories. When memory ACL est active, `file_read` additionally bloque access to memory markdown files pour empecher l'agent from bypassing access control by reading memory storage directly.

Contrairement a l'outil `shell`, les operations sur les fichiers ne lancent pas de processus externes. They sont implementes as direct Rust I/O operations within the PRX process, les rendant faster and easier to audit than equivalent shell commands like `cat` or `echo >`.

## Configuration

Les operations sur les fichiers n'ont pas de section de configuration dediee. Their behavior is controlled via le moteur de politiques de securite and memory ACL settings:

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

## Utilisation

### file_read

The `file_read` tool reads file contents and retourne lem comme un string. It est le principal way l'agent inspects files during its reasoning loop.

```json
{
  "name": "file_read",
  "arguments": {
    "path": "/home/user/project/src/main.rs"
  }
}
```

L'agent typically uses `file_read` to:

- Inspect source code before making modifications
- Read fichier de configurations to understand system state
- Check log files for error messages
- Review documentation or README files

### file_write

The `file_write` tool writes content vers un file, creating it if it ne fait pas exist or overwriting its contents if it does.

```json
{
  "name": "file_write",
  "arguments": {
    "path": "/home/user/project/src/config.toml",
    "content": "[server]\nport = 8080\nhost = \"0.0.0.0\"\n"
  }
}
```

L'agent typically uses `file_write` to:

- Create new source files or fichier de configurations
- Modify existing files (after reading them with `file_read`)
- Write generated reports or summaries
- Save processed data to disk

## Parametres

### file_read Parameters

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `path` | `string` | Oui | -- | Absolute or relative path to le fichier to read |

**Retours:**

| Champ | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` if le fichier was read successfully |
| `output` | `string` | Le fichier contents comme un UTF-8 string |
| `error` | `string?` | Error message si le read failed (file not found, permission denied, ACL blocked, etc.) |

### file_write Parameters

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `path` | `string` | Oui | -- | Absolute or relative path to le fichier to write |
| `content` | `string` | Oui | -- | The content to write to le fichier |

**Retours:**

| Champ | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` if le fichier was written successfully |
| `output` | `string` | Confirmation message (e.g., "File written: /path/to/file") |
| `error` | `string?` | Error message si le write failed (permission denied, path blocked, etc.) |

## Path Validation

Les deux outils perform path validation before executing the I/O operation:

1. **Path normalization** -- relative paths sont resolus against the current working directory. Symlinks sont resolus to detect path traversal.
2. **Policy check** -- le chemin resolu est verifie par rapport a the politique de securite rules. Si aucun rule explicitly permet au path and la valeur par defaut action is `deny`, the operation est bloque.
3. **Special path blocking** -- certain paths are always blocked independamment de policy:
   - `/proc/`, `/sys/` (Linux kernel interfaces)
   - Device files in `/dev/` (except `/dev/null`, `/dev/urandom`)
   - Memory storage files when `memory.acl_enabled = true`

### Path Traversal Prevention

L'outil resout les liens symboliques et normalise `..` composants avant de verifier les politiques. Cela empeche un attaquant from using symlinks or relative path tricks to escape allowed directories:

```
# These are all resolved and checked:
/home/user/workspace/../../../etc/passwd  →  /etc/passwd  →  DENIED
/home/user/workspace/link-to-etc          →  /etc/        →  DENIED (if symlink)
```

## Memory ACL Enforcement

When `memory.acl_enabled = true` dans la configuration, the `file_read` tool applique additional restrictions:

- **Memory files blocked**: `file_read` refuses to read markdown files stocke dans the memory directory (typically `~/.local/share/openprx/memory/`). Cela empeche l'agent from bypassing memory access control by reading the raw storage files.
- **Memory recall disabled**: L'outil `memory_recall` est entierement retire du registre d'outils when ACL est active.
- **Targeted access only**: L'agent must use `memory_get` or `memory_search` with proper ACL checks to access memory content.

```toml
[memory]
acl_enabled = true    # Activates file_read restrictions on memory paths
```

This separation garantit that meme si l'agent knows the physical location of memory files, it ne peut pas read them outside the controlled memory API.

## Securite

### Moteur de politiques Integration

Every `file_read` and `file_write` call passes via le moteur de politiques de securite avant l'execution. The moteur de politiques evaluates rules in order:

1. Per-tool policy (`security.tool_policy.tools.file_read`)
2. Path-based rules (`security.policy.rules` with matching `paths` patterns)
3. Defaut action (`security.policy.default_action`)

### Journalisation d'audit

When journalisation d'audit est active, every file operation est enregistre with:

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

La valeur par defaut politique de securite bloque access to common sensitive paths:

- SSH keys (`~/.ssh/`)
- Environment files (`.env`, `.env.local`)
- Git credentials (`.git-credentials`)
- Shell history (`.bash_history`, `.zsh_history`)
- System password files (`/etc/shadow`)

These defaults peut etre overridden with explicit allow rules, mais this is strongly discouraged in production.

### Binary File Handling

The `file_read` tool reads files as UTF-8 strings. Binary files will produce garbled output ou encoding errors. L'agent is expected to use the `shell` tool avec unppropriate commands (e.g., `xxd`, `file`, `hexdump`) for binary file inspection.

## Voir aussi

- [Shell Execution](/fr/prx/tools/shell) -- command execution tool (alternative for binary files)
- [Memory Tools](/fr/prx/tools/memory) -- controlled memory access with ACL
- [Moteur de politiques](/fr/prx/security/policy-engine) -- path-based access control rules
- [Configuration Reference](/fr/prx/config/reference) -- memory and security settings
- [Tools Overview](/fr/prx/tools/) -- tous les outils et systeme de registre
