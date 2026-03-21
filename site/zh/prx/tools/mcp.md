---
title: MCP 集成
description: PRX 实现了 Model Context Protocol (MCP) 客户端，支持连接外部 MCP 服务器并动态发现和调用其工具。
---

# MCP 集成

PRX 内置 MCP（Model Context Protocol）客户端，能够连接外部 MCP 服务器并将其提供的工具暴露给 Agent。MCP 是由 Anthropic 提出的开放协议，定义了 AI 模型与外部工具/数据源之间的标准化通信方式。通过 MCP 集成，PRX 的工具生态可以无限扩展——任何实现了 MCP 协议的服务器都可以作为 PRX 的工具来源。

PRX 支持两种 MCP 传输方式：**stdio**（标准输入/输出，本地进程通信）和 **Streamable HTTP**（通过 HTTP/SSE 与远程服务器通信）。工具发现通过 MCP 的 `tools/list` 方法动态完成——Agent 启动时自动连接配置的 MCP 服务器，获取其提供的工具列表，并在每个推理轮次前刷新。

PRX 还支持工作区本地的 `mcp.json` 自动发现机制，与 VS Code 和 Claude Desktop 的格式兼容。

## 配置

### config.toml 中配置 MCP

```toml
[mcp]
enabled = true

# stdio 传输 — 本地进程
[mcp.servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
transport = "stdio"

# stdio 传输 — 带环境变量
[mcp.servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
transport = "stdio"
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_xxxxxxxxxxxx" }

# stdio 传输 — Python 服务器
[mcp.servers.database]
command = "python3"
args = ["-m", "mcp_server_sqlite", "--db-path", "/home/user/data.db"]
transport = "stdio"

# Streamable HTTP 传输 — 远程服务器
[mcp.servers.remote-api]
url = "https://mcp.example.com/sse"
transport = "streamable_http"

# HTTP 传输 — 带认证
[mcp.servers.private-api]
url = "https://internal-mcp.company.com/sse"
transport = "streamable_http"
headers = { Authorization = "Bearer token123" }
```

### 工作区本地 mcp.json

在项目根目录创建 `mcp.json` 文件：

```json
{
  "mcpServers": {
    "project-tools": {
      "command": "node",
      "args": ["./tools/mcp-server/index.js"],
      "env": {
        "PROJECT_ROOT": "/home/user/project"
      }
    },
    "lint-server": {
      "command": "python3",
      "args": ["-m", "lint_mcp_server"],
      "env": {
        "CONFIG_PATH": "./lint.config.json"
      }
    }
  }
}
```

PRX 在初始化时会自动扫描工作区目录下的 `mcp.json` 文件。

### 工具策略

```toml
[security.tool_policy.tools]
mcp = "allow"              # 允许 MCP 工具调用
```

## 使用方法

### 调用 MCP 工具

当 MCP 服务器连接后，其工具会自动注册到 PRX 的工具列表中。Agent 可以像调用内置工具一样调用 MCP 工具：

```json
{
  "tool": "mcp",
  "arguments": {
    "server": "filesystem",
    "tool": "read_file",
    "arguments": {
      "path": "/home/user/docs/README.md"
    }
  }
}
```

### 列出 MCP 服务器和工具

```json
{
  "tool": "mcp",
  "arguments": {
    "action": "list_servers"
  }
}
```

返回：

```json
{
  "servers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "status": "connected",
      "tools": [
        {"name": "read_file", "description": "Read a file's contents"},
        {"name": "write_file", "description": "Write content to a file"},
        {"name": "list_directory", "description": "List directory contents"}
      ]
    },
    {
      "name": "github",
      "transport": "stdio",
      "status": "connected",
      "tools": [
        {"name": "create_issue", "description": "Create a GitHub issue"},
        {"name": "search_repos", "description": "Search repositories"},
        {"name": "get_pull_request", "description": "Get PR details"}
      ]
    }
  ]
}
```

### 刷新工具列表

手动触发工具重新发现：

```json
{
  "tool": "mcp",
  "arguments": {
    "action": "refresh"
  }
}
```

### 典型工作流

```
用户: 在 GitHub 上创建一个 issue 报告这个 bug

Agent:
1. [mcp: github/create_issue]
   server: "github"
   tool: "create_issue"
   arguments: {
     "repo": "openprx/prx",
     "title": "Bug: 配置热重载后记忆工具失效",
     "body": "## 复现步骤\n1. 修改 config.toml...",
     "labels": ["bug"]
   }

2. 已创建 issue #123: Bug: 配置热重载后记忆工具失效
```

## 参数

### mcp 工具参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 条件 | 管理操作：`list_servers`、`refresh`（与 `server`/`tool` 互斥） |
| `server` | string | 条件 | MCP 服务器名称（调用工具时必填） |
| `tool` | string | 条件 | MCP 工具名称（调用工具时必填） |
| `arguments` | object | 否 | 传递给 MCP 工具的参数 |

## MCP 传输协议

### stdio 传输

stdio 传输通过标准输入/输出与本地进程通信：

```
PRX ──stdin──→ MCP Server Process
PRX ←─stdout── MCP Server Process
```

- **优势**: 简单、低延迟、无网络依赖
- **限制**: 仅限本地进程
- **适用**: 本地工具服务器（文件系统、数据库、CLI 封装）

### Streamable HTTP 传输

Streamable HTTP 传输通过 HTTP + Server-Sent Events 与远程服务器通信：

```
PRX ──HTTP POST──→ MCP Server (远程)
PRX ←───SSE────── MCP Server (远程)
```

- **优势**: 支持远程服务器、跨网络通信
- **限制**: 需要网络连接、延迟较高
- **适用**: 远程 API 服务、云端工具、共享工具服务器

## 动态工具发现

MCP 工具发现流程：

```
PRX 启动
  │
  ├─ 读取 config.toml 中的 [mcp.servers.*]
  ├─ 扫描工作区 mcp.json
  │
  ├─ 对每个服务器：
  │     ├─ 建立连接（stdio 启动进程 / HTTP 连接）
  │     ├─ 调用 tools/list 获取工具列表
  │     └─ 注册工具到 Agent 的工具集
  │
  └─ 每个推理轮次前：
        └─ refresh() → 重新调用 tools/list（检测新增/移除的工具）
```

### 工具命名空间

MCP 工具以服务器名称为命名空间，避免不同服务器的工具名冲突：

- `filesystem/read_file` — 来自 filesystem 服务器的 read_file
- `github/create_issue` — 来自 github 服务器的 create_issue
- `database/query` — 来自 database 服务器的 query

## 安全性

### 命令白名单

`mcp.json` 中定义的 MCP 服务器只能使用白名单内的启动命令：

```
npx, node, python, python3, uvx, uv, deno, bun,
docker, cargo, go, ruby, php, dotnet, java
```

不在白名单中的命令会被拒绝，防止通过 `mcp.json` 执行任意程序。

### 环境变量净化

MCP 服务器进程的环境变量会经过净化。以下危险变量被自动剥离：

| 变量 | 风险 | 说明 |
|------|------|------|
| `LD_PRELOAD` | 动态库注入 | Linux 共享库劫持 |
| `DYLD_INSERT_LIBRARIES` | 动态库注入 | macOS 共享库劫持 |
| `NODE_OPTIONS` | 运行时劫持 | Node.js 启动参数注入 |
| `PYTHONPATH` | 模块劫持 | Python 模块搜索路径注入 |
| `RUBYOPT` | 运行时劫持 | Ruby 启动参数注入 |

### API 密钥保护

通过 `env` 配置传递给 MCP 服务器的 API 密钥不会暴露给 Agent。Agent 只知道可以调用哪些工具，但无法访问服务器进程的环境变量。

### 远程服务器信任

连接远程 MCP 服务器时需要特别谨慎：

- 仅连接受信任的服务器
- 使用 HTTPS 加密传输
- 通过 `headers` 配置进行认证
- 审查远程服务器提供的工具列表

```toml
# 远程服务器建议使用认证
[mcp.servers.private-api]
url = "https://mcp.internal.company.com/sse"
transport = "streamable_http"
headers = { Authorization = "Bearer secure-token-123" }
```

### 工具调用审计

所有 MCP 工具调用都记录在审计日志中：

```
[2024-01-15T10:30:00Z] tool=mcp server=github tool=create_issue status=success
[2024-01-15T10:30:05Z] tool=mcp server=filesystem tool=read_file status=success path="/docs/README.md"
```

## 相关文档

- [工具概览](/zh/prx/tools/) — 所有工具的分类参考
- [配置参考](/zh/prx/config/reference/) — 完整 config.toml 参考
- [安全策略](/zh/prx/security/policy-engine/) — 工具策略管道详解
- [Shell 命令执行](/zh/prx/tools/shell/) — 环境变量净化机制
