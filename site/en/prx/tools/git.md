---
title: Git Operations
description: Version control tool supporting status, diff, commit, push, pull, log, and branch operations on workspace repositories.
---

# Git Operations

The `git_operations` tool provides PRX agents with version control capabilities through a unified interface. Rather than requiring the agent to invoke `git` commands through the shell tool (which is subject to sandbox restrictions), `git_operations` offers a structured, safe API for the most common Git workflows: checking status, viewing diffs, creating commits, pushing, pulling, viewing history, and managing branches.

The tool operates on the workspace repository, which is typically the project directory where the agent is working. It is registered in the `all_tools()` registry and is always available when the agent runs with the full tool set.

By providing Git as a first-class tool rather than a shell command, PRX can apply fine-grained security policies, validate arguments, and produce structured output that the LLM can parse reliably.

## Configuration

The `git_operations` tool does not have a dedicated configuration section. Its behavior is controlled by the workspace path and the security policy:

```toml
# Tool policy for git operations
[security.tool_policy.tools]
git_operations = "allow"    # "allow" | "deny" | "supervised"
```

The workspace repository is determined by the current working directory of the agent session. If the agent is launched from within a Git repository, that repository is used. Otherwise, the tool returns an error indicating no repository is found.

## Usage

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

Returns structured output showing:
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

Create a commit with a message:

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

Push commits to the remote repository:

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

Pull changes from the remote repository:

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

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `operation` | `string` | Yes | -- | Git operation: `"status"`, `"diff"`, `"commit"`, `"push"`, `"pull"`, `"log"`, `"branch"` |
| `message` | `string` | Conditional | -- | Commit message (required for `"commit"` operation) |
| `args` | `array` | No | `[]` | Additional arguments passed to the Git command |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` if the Git operation completed successfully |
| `output` | `string` | Git command output (status text, diff content, log entries, etc.) |
| `error` | `string?` | Error message if the operation failed |

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

## Security

### Compared to Shell

Using `git_operations` instead of running `git` through the `shell` tool provides several security advantages:

- **Argument validation**: Parameters are validated before execution, preventing injection attacks
- **Structured output**: Results are parsed and returned in a predictable format
- **No shell expansion**: Arguments are passed directly to Git without shell interpretation
- **Fine-grained policy**: `git_operations` can be allowed while `shell` is denied or supervised

### Destructive Operation Protection

The tool includes safeguards against common destructive operations:

- **Force push**: `--force` and `--force-with-lease` arguments are logged with warnings
- **Branch deletion**: `-D` (force delete) operations are flagged in the audit log
- **Reset operations**: Hard resets are not directly exposed through the tool

For maximum safety, mark `git_operations` as supervised:

```toml
[security.tool_policy.tools]
git_operations = "supervised"
```

### Credential Handling

The `git_operations` tool uses the system's Git credential storage (credential helper, SSH keys, etc.). It does not expose or log credentials. Remote operations (push, pull) rely on the pre-configured Git credentials on the host.

### Audit Logging

All Git operations are recorded in the audit log when enabled:

- Operation type (status, commit, push, etc.)
- Arguments
- Success/failure status
- Commit SHA (for commit operations)

## Related

- [Shell Execution](/en/prx/tools/shell) -- alternative for advanced Git commands
- [File Operations](/en/prx/tools/file-operations) -- read/write files in the repository
- [Sessions & Agents](/en/prx/tools/sessions) -- delegate Git tasks to specialized agents
- [Policy Engine](/en/prx/security/policy-engine) -- access control for Git operations
- [Tools Overview](/en/prx/tools/) -- all tools and registry system
