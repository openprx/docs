---
title: Shell 命令执行
description: PRX 的 shell 工具通过沙箱隔离安全地执行操作系统命令，支持 Landlock、Firejail、Bubblewrap 和 Docker 四种沙箱后端。
---

# Shell 命令执行

`shell` 是 PRX 的核心工具之一，属于 `default_tools()` 集合，始终可用且无需额外配置。它允许 Agent 在受控的沙箱环境中执行操作系统命令，是 Agent 与底层系统交互的主要入口。

Shell 工具的设计理念是"安全优先"。每次命令执行都经过环境变量净化、沙箱隔离、超时控制和输出限制四层防护，确保即使 LLM 生成了恶意或不当的命令，系统也不会受到损害。

作为 Agent 推理循环中使用频率最高的工具，`shell` 在性能和安全性之间做了精心的平衡。它支持从零依赖的内核级隔离（Landlock）到完整容器隔离（Docker）等多种沙箱后端，用户可以根据部署环境和安全需求自由选择。

## 配置

在 `config.toml` 中配置 shell 工具的沙箱行为：

```toml
[security.sandbox]
enabled = true           # None = 自动检测, true = 强制启用, false = 禁用
backend = "auto"         # "auto" | "landlock" | "firejail" | "bubblewrap" | "docker" | "none"

# 自定义 Firejail 参数（仅当 backend = "firejail" 时生效）
firejail_args = ["--net=none", "--noroot", "--caps.drop=all"]

# Docker 沙箱参数（仅当 backend = "docker" 时生效）
docker_image = "prx-sandbox:latest"
docker_args = ["--network=none", "--read-only"]
```

使用工具策略对 shell 进行访问控制：

```toml
[security.tool_policy.tools]
shell = "supervised"     # "allow" | "deny" | "supervised"
```

当设置为 `supervised` 时，Agent 每次调用 shell 都需要用户审批后才能执行。

## 沙箱后端

PRX 支持四种沙箱后端加一个无操作回退：

| 后端 | 平台 | 隔离级别 | 依赖 | 说明 |
|------|------|----------|------|------|
| Landlock | Linux 5.13+ | 文件系统 | 无（内核 LSM） | 内核原生，零开销，无需 root |
| Firejail | Linux | 全面隔离 | firejail 包 | 网络、文件系统、PID 命名空间隔离 |
| Bubblewrap | Linux, macOS | 命名空间 | bubblewrap 包 | 用户命名空间隔离，轻量 |
| Docker | 任意 | 容器级 | Docker daemon | 完整容器隔离，最强安全性 |
| None | 任意 | 仅应用层 | 无 | 无 OS 级隔离，仅依赖 PRX 应用层限制 |

### 自动检测顺序

当 `backend = "auto"` 时，PRX 按以下顺序探测可用后端：

1. **Landlock** — 检测内核是否支持 Landlock LSM
2. **Firejail** — 检测 `firejail` 二进制是否存在
3. **Bubblewrap** — 检测 `bwrap` 二进制是否存在
4. **Docker** — 检测 Docker daemon 是否运行
5. **None** — 所有后端不可用时回退，并输出警告日志

## 使用方法

Agent 通过 JSON 结构调用 shell 工具：

```json
{
  "tool": "shell",
  "arguments": {
    "command": "ls -la /home/user/projects",
    "timeout": 30
  }
}
```

在 CLI 交互中，Agent 会自动决定何时需要执行 shell 命令。例如：

```
用户: 查看当前目录下有哪些文件

Agent: 我来查看当前目录的内容。
[调用 shell: ls -la]
当前目录包含以下文件：
- config.toml (配置文件)
- src/ (源代码目录)
- Cargo.toml (项目清单)
...
```

### 实际场景示例

```bash
# Agent 执行代码编译
shell: cargo build --release

# Agent 查看系统信息
shell: uname -a && free -h

# Agent 搜索文件内容
shell: grep -rn "TODO" src/

# Agent 运行测试
shell: cargo test -- --nocapture
```

## 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `command` | string | 是 | — | 要执行的 shell 命令 |
| `timeout` | integer | 否 | 60 | 命令超时时间（秒），最大 60 秒 |
| `working_dir` | string | 否 | 工作目录 | 命令执行的工作目录 |

### 执行限制

| 限制项 | 值 | 说明 |
|--------|-----|------|
| 默认超时 | 60 秒 | 超时后进程被强制终止 |
| 输出上限 | 1 MB | 标准输出 + 标准错误的总大小 |
| 环境变量 | 白名单制 | 仅传递安全的系统变量 |

## 环境变量净化

Shell 工具对子进程的环境变量实施严格的白名单策略。只有以下变量会传递给命令：

| 变量 | 用途 |
|------|------|
| `PATH` | 可执行文件搜索路径 |
| `HOME` | 用户主目录 |
| `TERM` | 终端类型 |
| `LANG` | 语言区域设置 |
| `LC_ALL` | 区域设置覆盖 |
| `LC_CTYPE` | 字符分类区域 |
| `USER` | 当前用户名 |
| `SHELL` | 默认 shell |
| `TMPDIR` | 临时文件目录 |

以下类型的变量会被自动剥离，**永远不会**暴露给子进程：

- API 密钥和令牌（`*_API_KEY`、`*_TOKEN`、`*_SECRET`）
- 动态链接注入（`LD_PRELOAD`、`DYLD_INSERT_LIBRARIES`）
- 运行时劫持（`NODE_OPTIONS`、`PYTHONPATH`、`RUBYOPT`）
- 数据库凭据（`DATABASE_URL`、`REDIS_URL`）

## 安全性

### 多层防护架构

Shell 工具的安全防护分为四个层次：

1. **安全策略层** — 每次调用前检查工具策略（allow/deny/supervised）
2. **环境净化层** — 剥离所有敏感环境变量
3. **沙箱隔离层** — OS 级进程隔离（文件系统、网络、PID）
4. **资源限制层** — 超时控制和输出大小限制

### 攻击面分析

| 攻击向量 | 防御措施 |
|----------|----------|
| 命令注入 | LLM 生成的命令经安全策略审查 |
| 环境变量泄露 | 白名单制，仅传递系统变量 |
| 文件系统逃逸 | 沙箱限制可访问的目录 |
| 网络外联 | Firejail/Docker 支持网络隔离 |
| 资源耗尽 | 60 秒超时 + 1MB 输出上限 |
| 权限提升 | `--noroot`（Firejail）/ `--cap-drop`（Docker） |

### 监督模式

在高安全性场景下，建议将 shell 设为 `supervised` 模式：

```toml
[security.tool_policy.tools]
shell = "supervised"
```

此模式下，Agent 每次调用 shell 都会暂停并等待人工审批。审批者可以看到完整的命令内容，决定是否允许执行。这对于生产环境或处理敏感数据时非常有用。

### 资源约束

通过 `[security.resources]` 配置全局资源限制：

```toml
[security.resources]
max_memory_mb = 512      # 最大内存使用
max_cpu_percent = 80     # 最大 CPU 使用率
max_open_files = 256     # 最大打开文件数
```

## 相关文档

- [工具概览](/zh/prx/tools/) — 所有工具的分类参考
- [安全策略](/zh/prx/security/policy-engine/) — 工具策略管道详解
- [沙箱](/zh/prx/security/sandbox/) — 沙箱后端的深入配置
- [配置参考](/zh/prx/config/reference/) — 完整的 config.toml 参考
