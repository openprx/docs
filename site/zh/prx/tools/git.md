---
title: Git 操作
description: PRX 的 git_operations 工具提供完整的 Git 版本控制操作能力，支持状态查看、差异比较、提交、推送和分支管理。
---

# Git 操作

`git_operations` 工具为 PRX Agent 提供结构化的 Git 版本控制操作能力。与通过 `shell` 工具直接执行 `git` 命令不同，`git_operations` 提供了类型安全的参数接口和标准化的输出格式，使 Agent 能够更可靠地进行版本控制操作。

该工具支持 Git 的常用操作：查看仓库状态、比较差异、创建提交、推送和拉取远程变更、查看提交日志以及分支管理。所有操作都在工作区仓库的上下文中执行，Agent 无需关心仓库路径等底层细节。

`git_operations` 在 `all_tools()` 模式下始终可用，无需额外配置。但可以通过工具策略限制 Agent 的 Git 操作权限。

## 配置

`git_operations` 工具默认无需特殊配置。通过工具策略控制访问权限：

```toml
[security.tool_policy.tools]
git_operations = "allow"       # "allow" | "deny" | "supervised"
```

建议在不同场景下使用不同策略：

```toml
# 代码审查 Agent — 仅读操作，建议 allow
[agents.reviewer]
allowed_tools = ["file_read", "git_operations"]

# 开发 Agent — 需要写操作，建议 supervised
[agents.developer]
allowed_tools = ["file_read", "file_write", "shell", "git_operations"]
```

在工作区级别配置 Git 行为：

```toml
[workspace]
path = "/home/user/projects/my-repo"  # 工作区路径
git_auto_commit = false                # 是否自动提交变更
git_branch_prefix = "prx/"            # Agent 创建分支时的前缀
```

## 使用方法

### 查看仓库状态

```json
{
  "tool": "git_operations",
  "arguments": {
    "action": "status"
  }
}
```

返回：

```json
{
  "branch": "main",
  "clean": false,
  "staged": ["src/main.rs"],
  "modified": ["src/config.rs", "Cargo.toml"],
  "untracked": ["src/new_module.rs"],
  "ahead": 2,
  "behind": 0
}
```

### 查看差异

```json
{
  "tool": "git_operations",
  "arguments": {
    "action": "diff",
    "target": "src/main.rs"
  }
}
```

### 暂存文件

```json
{
  "tool": "git_operations",
  "arguments": {
    "action": "add",
    "files": ["src/main.rs", "src/config.rs"]
  }
}
```

### 创建提交

```json
{
  "tool": "git_operations",
  "arguments": {
    "action": "commit",
    "message": "fix: 修复配置文件解析错误\n\n修正了 TOML 解析器在处理嵌套表时的类型转换问题。"
  }
}
```

### 推送到远程

```json
{
  "tool": "git_operations",
  "arguments": {
    "action": "push",
    "remote": "origin",
    "branch": "main"
  }
}
```

### 拉取远程变更

```json
{
  "tool": "git_operations",
  "arguments": {
    "action": "pull",
    "remote": "origin",
    "branch": "main"
  }
}
```

### 查看提交日志

```json
{
  "tool": "git_operations",
  "arguments": {
    "action": "log",
    "limit": 10
  }
}
```

### 分支管理

```json
// 列出分支
{
  "tool": "git_operations",
  "arguments": {
    "action": "branch",
    "sub_action": "list"
  }
}

// 创建新分支
{
  "tool": "git_operations",
  "arguments": {
    "action": "branch",
    "sub_action": "create",
    "name": "feature/new-tool"
  }
}

// 切换分支
{
  "tool": "git_operations",
  "arguments": {
    "action": "branch",
    "sub_action": "checkout",
    "name": "feature/new-tool"
  }
}
```

## 参数

### 通用参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型（见下表） |

### 操作类型及参数

| 操作 | 说明 | 额外参数 |
|------|------|----------|
| `status` | 查看仓库状态 | 无 |
| `diff` | 查看差异 | `target`（文件路径或分支名）、`staged`（是否仅显示暂存区差异） |
| `add` | 暂存文件 | `files`（文件路径列表） |
| `commit` | 创建提交 | `message`（提交消息，必填） |
| `push` | 推送 | `remote`（远程名）、`branch`（分支名） |
| `pull` | 拉取 | `remote`（远程名）、`branch`（分支名） |
| `log` | 提交日志 | `limit`（数量上限）、`since`（起始日期）、`author`（作者过滤） |
| `branch` | 分支管理 | `sub_action`（`list`/`create`/`checkout`/`delete`）、`name`（分支名） |

### diff 参数详情

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `target` | string | 否 | — | 比较目标（文件路径或分支名），省略时显示所有变更 |
| `staged` | boolean | 否 | `false` | 是否仅显示暂存区的差异 |

### log 参数详情

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `limit` | integer | 否 | `20` | 返回的最大提交数 |
| `since` | string | 否 | — | 起始日期（ISO 8601 格式） |
| `author` | string | 否 | — | 按作者名过滤 |

### branch 参数详情

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sub_action` | string | 是 | `list`（列出）、`create`（创建）、`checkout`（切换）、`delete`（删除） |
| `name` | string | 条件 | 分支名（`create`/`checkout`/`delete` 时必填） |

## 典型工作流

### Agent 辅助代码提交

```
用户: 提交当前的修改

Agent:
1. [git_operations: status]  → 查看哪些文件被修改
2. [git_operations: diff]    → 查看具体变更内容
3. 分析变更，生成提交消息
4. [git_operations: add]     → 暂存相关文件
5. [git_operations: commit]  → 创建提交
```

### Agent 辅助代码审查

```
用户: 审查 feature/auth 分支的变更

Agent:
1. [git_operations: diff, target="main..feature/auth"]  → 查看分支差异
2. [git_operations: log, branch="feature/auth"]          → 查看提交历史
3. [file_read: 修改的文件]                                → 详细审查代码
4. 输出审查意见
```

## 安全性

### 写操作风险

Git 的写操作（commit、push、branch delete）可能产生不可逆的影响。建议：

| 操作 | 风险级别 | 建议策略 |
|------|----------|----------|
| status / diff / log | 低 | `allow` |
| add | 低 | `allow` |
| commit | 中 | `supervised` |
| push | 高 | `supervised` |
| branch create | 低 | `allow` |
| branch delete | 高 | `supervised` |
| pull | 中 | `allow`（可能产生冲突） |

### Force Push 防护

`git_operations` 工具不支持 `--force` 参数，从根本上防止 force push 导致的代码丢失。如果确实需要 force push，用户必须通过 `shell` 工具手动执行。

### 凭据安全

Git 操作可能涉及远程仓库认证。PRX 使用系统的 Git 凭据管理（credential helper），不在命令行中传递密码或 token。环境变量净化确保 `GIT_TOKEN` 等变量不会泄露。

### 审计追踪

所有 Git 操作都记录在 PRX 审计日志中：

```
[2024-01-15T10:30:00Z] tool=git_operations action=status branch=main
[2024-01-15T10:30:05Z] tool=git_operations action=add files=["src/main.rs"]
[2024-01-15T10:30:10Z] tool=git_operations action=commit message="fix: ..."
[2024-01-15T10:30:15Z] tool=git_operations action=push remote=origin branch=main
```

## 相关文档

- [工具概览](/zh/prx/tools/) — 所有工具的分类参考
- [Shell 命令执行](/zh/prx/tools/shell/) — 直接执行 git 命令的替代方案
- [文件操作](/zh/prx/tools/file-operations/) — 文件读写工具
- [安全策略](/zh/prx/security/policy-engine/) — 工具策略管道详解
