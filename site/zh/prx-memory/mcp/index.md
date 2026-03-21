---
title: MCP 集成
description: PRX-Memory MCP 协议集成，支持的工具、资源、模板和传输模式。
---

# MCP 集成

PRX-Memory 作为原生 MCP（模型上下文协议）服务器构建。它将记忆操作作为 MCP 工具公开，将治理技能作为 MCP 资源公开，并提供用于标准化记忆交互的负载模板。

## 传输模式

### stdio

stdio 传输通过标准输入/输出通信，非常适合与 Claude Code、Codex 和 OpenClaw 等 MCP 客户端的直接集成。

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

### HTTP

HTTP 传输提供可通过网络访问的服务器，附带额外的运维端点。

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

HTTP 专用端点：

| 端点 | 说明 |
|------|------|
| `GET /health` | 健康检查 |
| `GET /metrics` | Prometheus 指标 |
| `GET /metrics/summary` | JSON 指标摘要 |
| `POST /mcp/session/renew` | 续期流式会话 |

## MCP 客户端配置

将 PRX-Memory 添加到你的 MCP 客户端配置文件中：

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/data/memory-db.json"
      }
    }
  }
}
```

::: tip
`command` 和 `PRX_MEMORY_DB` 都使用绝对路径，以避免路径解析问题。
:::

## MCP 工具

PRX-Memory 通过 MCP `tools/call` 接口公开以下工具：

### 核心记忆操作

| 工具 | 说明 |
|------|------|
| `memory_store` | 存储新的记忆条目，包含文本、作用域、标签和元数据 |
| `memory_recall` | 使用词法、向量和重排序搜索召回匹配查询的记忆 |
| `memory_update` | 更新已有的记忆条目 |
| `memory_forget` | 按 ID 删除记忆条目 |

### 批量操作

| 工具 | 说明 |
|------|------|
| `memory_export` | 将所有记忆导出为可移植的 JSON 格式 |
| `memory_import` | 从导出数据导入记忆 |
| `memory_migrate` | 在存储后端之间迁移 |
| `memory_reembed` | 使用当前嵌入模型重新嵌入所有记忆 |
| `memory_compact` | 压缩和优化存储 |

### 进化

| 工具 | 说明 |
|------|------|
| `memory_evolve` | 使用训练集/保留集接受测试和约束门控进化记忆 |

### 技能发现

| 工具 | 说明 |
|------|------|
| `memory_skill_manifest` | 返回治理技能的技能清单 |

## MCP 资源

PRX-Memory 将治理技能包作为 MCP 资源公开：

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/list", "params": {}}
```

读取特定资源：

```json
{"jsonrpc": "2.0", "id": 2, "method": "resources/read", "params": {"uri": "prx://skills/governance"}}
```

## 资源模板

负载模板帮助客户端构建标准化的记忆操作：

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/templates/list", "params": {}}
```

使用模板生成存储负载：

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "prx://templates/memory-store?text=陷阱:+始终处理错误&scope=global"
  }
}
```

## 流式会话

HTTP 传输支持 Server-Sent Events（SSE）用于流式响应。会话有可配置的 TTL：

```bash
PRX_MEMORY_STREAM_SESSION_TTL_MS=300000  # 5 分钟
```

在会话过期前续期：

```bash
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"
```

## 标准化配置文件

PRX-Memory 支持两种标准化配置文件，控制记忆条目的标记和验证方式：

| 配置文件 | 说明 |
|---------|------|
| `zero-config` | 最小约束，接受任何标签和作用域（默认） |
| `governed` | 严格的标签归一化、比例约束和质量约束 |

```bash
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend
```

## 下一步

- [快速上手](../getting-started/quickstart) -- 首次存储和召回操作
- [配置参考](../configuration/) -- 所有环境变量
- [故障排除](../troubleshooting/) -- 常见 MCP 问题
