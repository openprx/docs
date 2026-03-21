---
title: 记忆工具
description: PRX 的记忆工具集提供长期记忆的存储、检索、搜索和管理能力，支持分类管理和 ACL 访问控制。
---

# 记忆工具

记忆工具是 PRX Agent 持久化知识管理的核心。通过 5 个专用工具——`memory_store`、`memory_forget`、`memory_get`、`memory_recall`、`memory_search`——Agent 可以存储事实和偏好、按键检索特定记忆、通过语义相似度回忆相关知识，以及对记忆库进行全文搜索。

PRX 的记忆系统采用分类架构，将记忆划分为 `core`（核心/永久）、`daily`（会话/每日）、`conversation`（对话上下文）三个内置分类，同时支持用户自定义分类。不同分类的记忆具有不同的生命周期和访问策略。

当启用 ACL 时，记忆工具会执行严格的访问控制——限制哪些 Agent 或会话可以读取或修改特定记忆条目，防止跨 Agent 信息泄露。`memory_recall` 工具在 ACL 模式下会被完全禁用，因为其语义搜索特性难以精确控制访问边界。

## 配置

在 `config.toml` 中配置记忆系统：

```toml
[memory]
# 存储后端："markdown" | "sqlite" | "postgres"
backend = "markdown"

# 记忆文件路径（markdown 后端）
path = "~/.prx/memory"

# ACL 访问控制
acl_enabled = false       # 启用后限制跨 Agent 记忆访问

# 向量嵌入（用于语义搜索）
[memory.embeddings]
enabled = true
provider = "ollama"       # "ollama" | "openai" | "local"
model = "nomic-embed-text"
dimensions = 768
```

记忆工具的策略控制：

```toml
[security.tool_policy.tools]
memory_store = "allow"
memory_forget = "supervised"  # 删除操作建议监督
memory_get = "allow"
memory_recall = "allow"
memory_search = "allow"
```

## 工具详解

### memory_store — 存储记忆

将事实、偏好或笔记持久化到长期记忆中。

```json
{
  "tool": "memory_store",
  "arguments": {
    "key": "user_preference_language",
    "content": "用户偏好使用中文交流，技术术语保留英文。",
    "category": "core",
    "tags": ["preference", "language"]
  }
}
```

### memory_forget — 删除记忆

从长期记忆中移除特定条目。

```json
{
  "tool": "memory_forget",
  "arguments": {
    "key": "outdated_api_endpoint"
  }
}
```

### memory_get — 检索记忆

按键精确检索单个记忆条目。

```json
{
  "tool": "memory_get",
  "arguments": {
    "key": "user_preference_language"
  }
}
```

### memory_recall — 回忆记忆

通过关键词或语义相似度模糊查找相关记忆。**注意：当 `memory.acl_enabled = true` 时此工具被禁用。**

```json
{
  "tool": "memory_recall",
  "arguments": {
    "query": "用户的编程语言偏好",
    "limit": 5
  }
}
```

### memory_search — 搜索记忆

对记忆条目进行全文搜索和/或向量搜索。

```json
{
  "tool": "memory_search",
  "arguments": {
    "query": "项目部署",
    "category": "core",
    "limit": 10,
    "search_type": "hybrid"
  }
}
```

## 参数

### memory_store 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `key` | string | 是 | — | 记忆条目的唯一标识符 |
| `content` | string | 是 | — | 记忆内容 |
| `category` | string | 否 | `"core"` | 分类：`core`、`daily`、`conversation` 或自定义 |
| `tags` | string[] | 否 | `[]` | 标签列表，用于过滤和检索 |
| `metadata` | object | 否 | `{}` | 附加元数据（键值对） |

### memory_forget 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `key` | string | 是 | 要删除的记忆条目的键 |

### memory_get 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `key` | string | 是 | 要检索的记忆条目的键 |

### memory_recall 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `query` | string | 是 | — | 搜索查询（关键词或自然语言） |
| `limit` | integer | 否 | `5` | 返回结果数量上限 |

### memory_search 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `query` | string | 是 | — | 搜索查询 |
| `category` | string | 否 | — | 按分类过滤 |
| `tags` | string[] | 否 | — | 按标签过滤 |
| `limit` | integer | 否 | `10` | 返回结果数量上限 |
| `search_type` | string | 否 | `"hybrid"` | 搜索类型：`text`（全文）、`vector`（向量）、`hybrid`（混合） |

## 记忆分类

| 分类 | 生命周期 | 用途 | 示例 |
|------|----------|------|------|
| `core` | 永久 | 用户偏好、长期知识、系统事实 | 用户偏好中文交流 |
| `daily` | 会话级 | 当天的上下文信息、临时备忘 | 今天的工作计划 |
| `conversation` | 对话级 | 当前对话的上下文 | 正在讨论的代码文件 |
| 自定义 | 用户定义 | 按项目或领域组织 | `project_alpha`、`research` |

### 分类的存储结构

以 Markdown 后端为例，记忆按分类存储在不同文件中：

```
~/.prx/memory/
├── core.md            # 永久记忆
├── daily.md           # 会话记忆
├── conversation.md    # 对话记忆
├── project_alpha.md   # 自定义分类
└── .embeddings/       # 向量嵌入缓存
    ├── core.bin
    └── daily.bin
```

## 安全性

### ACL 访问控制

当 `memory.acl_enabled = true` 时，记忆系统强制执行访问控制：

| 工具 | ACL 行为 |
|------|----------|
| `memory_store` | 记录创建者信息，设置默认访问权限 |
| `memory_forget` | 仅允许创建者或管理员删除 |
| `memory_get` | 检查请求者是否有权访问该条目 |
| `memory_recall` | **完全禁用**（从工具注册表中移除） |
| `memory_search` | 搜索结果仅返回请求者有权访问的条目 |

ACL 禁用 `memory_recall` 的原因：语义相似度搜索的模糊性使其难以精确控制信息边界。攻击者可能通过构造特定查询来探测不应访问的记忆内容。

### 文件读取保护

当 ACL 启用时，`file_read` 工具会阻止直接读取记忆文件：

```
# 以下操作会被拒绝
file_read: ~/.prx/memory/core.md  → 拒绝（ACL 保护）

# Agent 必须通过记忆工具访问
memory_get: key="user_preference"  → 允许（经过 ACL 检查）
```

### 多 Agent 记忆隔离

在多 Agent 场景下，ACL 确保每个 Agent 只能访问自己的记忆：

```
Agent-A (memory_get: key="secret") → 允许（自己的记忆）
Agent-B (memory_get: key="secret") → 拒绝（Agent-A 的记忆）
```

### 敏感信息保护

建议不要在记忆中存储以下敏感信息：

- 密码和 API 密钥
- 私钥和证书
- 个人身份信息（PII）
- 金融账户信息

如果必须存储，建议使用自定义分类并配合 ACL 限制访问：

```json
{
  "tool": "memory_store",
  "arguments": {
    "key": "api_config",
    "content": "API 端点: https://api.example.com (密钥通过环境变量提供)",
    "category": "secrets",
    "tags": ["sensitive"]
  }
}
```

## 相关文档

- [工具概览](/zh/prx/tools/) — 所有工具的分类参考
- [记忆系统概览](/zh/prx/memory/) — 记忆架构和后端选择
- [Markdown 后端](/zh/prx/memory/markdown/) — Markdown 存储后端详解
- [SQLite 后端](/zh/prx/memory/sqlite/) — SQLite 存储后端详解
- [向量嵌入](/zh/prx/memory/embeddings/) — 语义搜索和嵌入配置
- [文件操作](/zh/prx/tools/file-operations/) — file_read 的 ACL 集成说明
