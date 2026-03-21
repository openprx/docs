---
title: Git Operations
description: Version control tool supporting status, diff, commit, push, pull, log, and branch operations on workspace repositories.
---

# Git Operations

L'outil `git_operations` fournit aux agents PRX des capacites de controle de version via une interface unifiee. Rather than requiring l'agent to invoke `git` commands via le shell tool (which est soumis a sandbox restrictions), `git_operations` offers a structured, safe API pour le most common Git workflows: checking status, viewing diffs, creating commits, pushing, pulling, viewing history, and managing branches.

L'outil opere sur le depot de l'espace de travail, which is generalement the project directory where l'agent is working. It est enregistre dans le registre `all_tools()` et est toujours disponible when l'agent runs avec le full tool set.

By providing Git comme un first-class tool plutot que a shell command, PRX can apply fine-grained security policies, validate arguments, and produce structured output that le LLM can parse reliably.

## Configuration

L'outil `git_operations` n'a pas de section de configuration dediee. Son comportement est controle par the espace de travail path and the politique de securite:

```toml
# Tool policy for git operations
[security.tool_policy.tools]
git_operations = "allow"    # "allow" | "deny" | "supervised"
```

Le depot de l'espace de travail est determine par le repertoire de travail courant of l'session d'agent. If l'agent is launched from within a Git repository, that repository is used. Otherwise, l'outil retours an error indicating no repository is found.

## Utilisation

The `git_operations` tool accepts an `operation` parameter that specifies the Git action to perform:

### status

Check the current repository status (staged, unstaged, untracked files):

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "status"
  }
}
```

Retours structured output showing:
- Current branch name
- Files staged for commit
- Modified but unstaged files
- Untracked files
- Upstream tracking status

### diff

View changes in the working tree or between commits:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "diff"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "diff",
    "args": ["--staged"]
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "diff",
    "args": ["HEAD~3..HEAD"]
  }
}
```

### commit

Create a commit avec un message:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "commit",
    "message": "fix: resolve race condition in session cleanup"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "commit",
    "message": "feat: add web search provider selection",
    "args": ["--all"]
  }
}
```

### push

Push commits vers le remote repository:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "push"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "push",
    "args": ["origin", "feature/web-search"]
  }
}
```

### pull

Pull changes depuis le remote repository:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "pull"
  }
}
```

### log

View commit history:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "log",
    "args": ["--oneline", "-20"]
  }
}
```

### branch

List, create, or switch branches:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "branch"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "branch",
    "args": ["feature/new-tool"]
  }
}
```

## Parametres

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `operation` | `string` | Oui | -- | Git operation: `"status"`, `"diff"`, `"commit"`, `"push"`, `"pull"`, `"log"`, `"branch"` |
| `message` | `string` | Conditional | -- | Commit message (required for `"commit"` operation) |
| `args` | `array` | Non | `[]` | Additional arguments passed vers le Git command |

**Retours:**

| Champ | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` si le Git operation completed successfully |
| `output` | `string` | Git command output (status text, diff content, log entries, etc.) |
| `error` | `string?` | Error message si le operation failed |

## Common Workflows

### Feature Branch Workflow

A typical agent-driven feature branch workflow:

```
1. [git_operations] operation="branch", args=["feature/add-search"]
2. [file_write] write new files
3. [git_operations] operation="status"  -- verify changes
4. [git_operations] operation="diff"    -- review changes
5. [git_operations] operation="commit", message="feat: add search functionality", args=["--all"]
6. [git_operations] operation="push", args=["-u", "origin", "feature/add-search"]
```

### Code Review Preparation

Inspect changes before committing:

```
1. [git_operations] operation="status"
2. [git_operations] operation="diff", args=["--staged"]
3. [git_operations] operation="log", args=["--oneline", "-5"]
4. Agent reviews the diff and suggests improvements
```

### Conflict Resolution

Check for and resolve merge conflicts:

```
1. [git_operations] operation="pull"
2. If conflicts: [git_operations] operation="status"
3. [file_read] read conflicted files
4. [file_write] resolve conflicts
5. [git_operations] operation="commit", message="merge: resolve conflicts in config.toml"
```

## Securite

### Compared to Shell

Using `git_operations` au lieu de running `git` via le `shell` tool provides several security advantages:

- **Argument validation**: Parameters are valide avant l'execution, preventing injection attacks
- **Structured output**: Results are parsed and retournes in a predictable format
- **Non shell expansion**: Arguments sont transmis directly to Git without shell interpretation
- **Fine-grained policy**: `git_operations` peut etre allowed tandis que `shell` is denied or supervised

### Destructive Operation Protection

L'outil includes safeguards against common destructive operations:

- **Force push**: `--force` and `--force-with-lease` arguments sont journalises avec des avertissements
- **Branch deletion**: `-D` (force delete) operations are flagged in the journal d'audit
- **Reset operations**: Hard resets are pas directement expose through l'outil

For maximum safety, mark `git_operations` as supervised:

```toml
[security.tool_policy.tools]
git_operations = "supervised"
```

### Credential Handling

The `git_operations` tool uses le systeme's Git credential storage (credential helper, SSH keys, etc.). It ne fait pas expose or log credentials. Remote operations (push, pull) rely sur le pre-configured Git credentials on l'hote.

### Journalisation d'audit

All Git operations sont enregistres dans le journal d'audit lorsqu'active:

- Operation type (status, commit, push, etc.)
- Arguments
- Success/failure status
- Commit SHA (for commit operations)

## Voir aussi

- [Shell Execution](/fr/prx/tools/shell) -- alternative for advanced Git commands
- [File Operations](/fr/prx/tools/file-operations) -- read/write files in the repository
- [Sessions & Agents](/fr/prx/tools/sessions) -- delegate Git tasks to specialized agents
- [Moteur de politiques](/fr/prx/security/policy-engine) -- access control for Git operations
- [Tools Overview](/fr/prx/tools/) -- tous les outils et systeme de registre
