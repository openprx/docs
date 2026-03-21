---
title: 配置参考
description: PRX-Memory 所有环境变量的完整参考，涵盖传输、存储、嵌入、重排序、治理和可观测性。
---

# 配置参考

PRX-Memory 完全通过环境变量配置。本页按类别记录每个变量。

## 传输

| 变量 | 取值 | 默认值 | 说明 |
|------|------|-------|------|
| `PRX_MEMORYD_TRANSPORT` | `stdio`、`http` | `stdio` | 服务器传输模式 |
| `PRX_MEMORY_HTTP_ADDR` | `host:port` | `127.0.0.1:8787` | HTTP 服务器绑定地址 |

## 存储

| 变量 | 取值 | 默认值 | 说明 |
|------|------|-------|------|
| `PRX_MEMORY_BACKEND` | `json`、`sqlite`、`lancedb` | `json` | 存储后端 |
| `PRX_MEMORY_DB` | 文件/目录路径 | -- | 数据库文件或目录路径 |

## 嵌入

| 变量 | 取值 | 默认值 | 说明 |
|------|------|-------|------|
| `PRX_EMBED_PROVIDER` | `openai-compatible`、`jina`、`gemini` | -- | 嵌入供应商 |
| `PRX_EMBED_API_KEY` | API 密钥字符串 | -- | 嵌入供应商 API 密钥 |
| `PRX_EMBED_MODEL` | 模型名称 | 供应商特定 | 嵌入模型名称 |
| `PRX_EMBED_BASE_URL` | URL | 供应商特定 | 自定义 API 端点 URL |

### 供应商备用密钥

如果未设置 `PRX_EMBED_API_KEY`，系统会检查以下供应商专用密钥：

| 供应商 | 备用密钥 |
|--------|---------|
| `jina` | `JINA_API_KEY` |
| `gemini` | `GEMINI_API_KEY` |

## 重排序

| 变量 | 取值 | 默认值 | 说明 |
|------|------|-------|------|
| `PRX_RERANK_PROVIDER` | `jina`、`cohere`、`pinecone`、`pinecone-compatible`、`none` | `none` | 重排序供应商 |
| `PRX_RERANK_API_KEY` | API 密钥字符串 | -- | 重排序供应商 API 密钥 |
| `PRX_RERANK_MODEL` | 模型名称 | 供应商特定 | 重排序模型名称 |
| `PRX_RERANK_ENDPOINT` | URL | 供应商特定 | 自定义重排序端点 |
| `PRX_RERANK_API_VERSION` | 版本字符串 | -- | API 版本（仅 pinecone-compatible） |

### 供应商备用密钥

如果未设置 `PRX_RERANK_API_KEY`，系统会检查以下供应商专用密钥：

| 供应商 | 备用密钥 |
|--------|---------|
| `jina` | `JINA_API_KEY` |
| `cohere` | `COHERE_API_KEY` |
| `pinecone` | `PINECONE_API_KEY` |

## 标准化

| 变量 | 取值 | 默认值 | 说明 |
|------|------|-------|------|
| `PRX_MEMORY_STANDARD_PROFILE` | `zero-config`、`governed` | `zero-config` | 标准化配置文件 |
| `PRX_MEMORY_DEFAULT_PROJECT_TAG` | 标签字符串 | `prx-memory` | 默认项目标签 |
| `PRX_MEMORY_DEFAULT_TOOL_TAG` | 标签字符串 | `mcp` | 默认工具标签 |
| `PRX_MEMORY_DEFAULT_DOMAIN_TAG` | 标签字符串 | `general` | 默认领域标签 |

## 流式会话

| 变量 | 取值 | 默认值 | 说明 |
|------|------|-------|------|
| `PRX_MEMORY_STREAM_SESSION_TTL_MS` | 毫秒 | `300000` | 流式会话存活时间 |

## 可观测性

### 基数控制

| 变量 | 默认值 | 说明 |
|------|-------|------|
| `PRX_METRICS_MAX_RECALL_SCOPE_LABELS` | `32` | 指标中最大不同作用域标签数 |
| `PRX_METRICS_MAX_RECALL_CATEGORY_LABELS` | `32` | 指标中最大不同分类标签数 |
| `PRX_METRICS_MAX_RERANK_PROVIDER_LABELS` | `16` | 最大不同重排序供应商标签数 |

### 告警阈值

| 变量 | 默认值 | 说明 |
|------|-------|------|
| `PRX_ALERT_TOOL_ERROR_RATIO_WARN` | `0.05` | 工具错误率警告阈值 |
| `PRX_ALERT_TOOL_ERROR_RATIO_CRIT` | `0.20` | 工具错误率严重阈值 |
| `PRX_ALERT_REMOTE_WARNING_RATIO_WARN` | `0.25` | 远程警告率警告阈值 |
| `PRX_ALERT_REMOTE_WARNING_RATIO_CRIT` | `0.60` | 远程警告率严重阈值 |

## 示例：最小配置

```bash
PRX_MEMORYD_TRANSPORT=stdio
PRX_MEMORY_DB=./data/memory-db.json
```

## 示例：完整生产配置

```bash
# 传输
PRX_MEMORYD_TRANSPORT=http
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787

# 存储
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db

# 嵌入
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# 重排序
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5

# 治理
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend

# 会话
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000

# 可观测性
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.03
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.15
```

## 下一步

- [安装](../getting-started/installation) -- 构建和安装 PRX-Memory
- [MCP 集成](../mcp/) -- 配置你的 MCP 客户端
- [故障排除](../troubleshooting/) -- 常见配置问题
