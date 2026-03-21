---
title: Lucid 记忆后端
description: 基于 Lucid.so 的云端 AI 记忆层，提供托管式语义记忆存储与检索。
---

# Lucid 记忆后端

Lucid 后端将记忆存储委托给 [Lucid.so](https://lucid.so) 云端 AI 记忆服务。相比本地后端，Lucid 提供托管式基础设施、跨设备同步和高级语义检索能力。

## 概述

Lucid 是一个专为 AI Agent 设计的外部记忆层服务。PRX 通过 Lucid REST API 与其集成，将记忆的存储、索引和检索操作委托给 Lucid 云端处理：

- **云端托管** -- 无需本地数据库维护，由 Lucid 管理存储和索引
- **语义检索** -- Lucid 内置 Embedding 模型，自动对记忆进行语义索引
- **跨设备同步** -- 同一账户下的多个 PRX 实例共享记忆
- **自动归类** -- Lucid 自动提取主题和实体，组织记忆结构
- **访问控制** -- 基于 API Key 的租户隔离

## 与本地后端对比

| 特性 | Lucid | SQLite | PostgreSQL | Embedding |
|------|-------|--------|------------|-----------|
| 部署方式 | 云端 SaaS | 本地文件 | 本地/远程数据库 | 本地/远程 |
| 语义搜索 | 内置 | 需配合 Embedding | 需 pgvector | 内置 |
| 跨设备同步 | 原生支持 | 不支持 | 需共享数据库 | 需共享存储 |
| 全文搜索 | 内置 | FTS5 | pg_trgm | 不支持 |
| 自动归类 | 内置 | 不支持 | 不支持 | 不支持 |
| 数据主权 | 第三方托管 | 完全本地 | 自主控制 | 自主控制 |
| 离线可用 | 否 | 是 | 视部署 | 视部署 |
| 配置复杂度 | 低（仅需 API Key） | 低（零配置） | 中 | 中 |

## 配置

### 基础配置

```toml
[memory]
backend = "lucid"

[memory.lucid]
api_key = "luc_xxxxxxxxxxxxxxxxxxxx"
api_url = "https://api.lucid.so/v1"
namespace = "default"
```

### 完整配置

```toml
[memory]
backend = "lucid"

[memory.lucid]
api_key = "luc_xxxxxxxxxxxxxxxxxxxx"
api_url = "https://api.lucid.so/v1"
namespace = "default"
timeout_secs = 30
max_retries = 3
batch_size = 50
sync_interval_secs = 60
```

也可以通过环境变量设置 API Key：

```bash
export OPENPRX_LUCID_API_KEY="luc_xxxxxxxxxxxxxxxxxxxx"
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `api_key` | String | 必填 | Lucid API Key（从 Lucid 控制台获取） |
| `api_url` | String | `"https://api.lucid.so/v1"` | Lucid API 端点 URL |
| `namespace` | String | `"default"` | 记忆命名空间，用于隔离不同 Agent 的记忆 |
| `timeout_secs` | u64 | `30` | API 请求超时（秒） |
| `max_retries` | u32 | `3` | 请求失败时的最大重试次数 |
| `batch_size` | usize | `50` | 批量写入时每批记忆条目数 |
| `sync_interval_secs` | u64 | `60` | 本地缓存与云端同步的间隔（秒） |

## 使用方法

### 获取 API Key

1. 访问 [Lucid.so](https://lucid.so) 并注册账户
2. 在控制台创建新项目
3. 在 **API Keys** 页面生成密钥（格式：`luc_...`）
4. 将密钥配置到 PRX

### 命名空间隔离

使用命名空间可以在同一 Lucid 账户下隔离不同 Agent 或用途的记忆：

```toml
# 工作 Agent 记忆
[memory.lucid]
namespace = "work-agent"

# 个人助手记忆
# [memory.lucid]
# namespace = "personal-assistant"
```

### 切换到 Lucid

从其他后端迁移到 Lucid：

```bash
# 导出现有记忆
prx memory export --format json > memories.json

# 切换后端配置到 lucid
# 然后导入
prx memory import memories.json
```

## API 交互流程

```
PRX Agent                     Lucid API
    │                            │
    ├─── POST /memories ────────►│  存储新记忆
    │◄── 200 {id, topics} ──────┤
    │                            │
    ├─── POST /recall ──────────►│  语义检索
    │    {query, top_k, filters} │
    │◄── 200 [{memory, score}] ──┤
    │                            │
    ├─── DELETE /memories/:id ──►│  删除记忆
    │◄── 204 ───────────────────┤
    │                            │
```

## 限制

- 需要网络连接，离线时无法访问记忆
- 记忆数据存储在第三方服务上，需评估数据隐私合规
- API 调用有速率限制（具体限制取决于 Lucid 订阅计划）
- 免费计划有存储容量上限
- 网络延迟高于本地后端（SQLite/Markdown）

## 故障排除

**连接失败**

1. 检查 `api_key` 是否有效
2. 确认网络可访问 `api.lucid.so`
3. 如果使用代理，在 `[proxy]` 中配置

**记忆未同步**

- 检查 `sync_interval_secs` 设置
- 确认 `namespace` 在多个实例间一致
- 查看 PRX 日志中的 Lucid 相关错误

**检索结果不理想**

- Lucid 语义搜索依赖其内置 Embedding 模型，无法自定义
- 尝试调整查询措辞以提高匹配质量
- 确认记忆已成功存储（检查 Lucid 控制台）

## 相关文档

- [记忆系统概览](./)
- [SQLite 后端](./sqlite) -- 本地替代方案
- [PostgreSQL 后端](./postgres) -- 自托管数据库方案
- [向量嵌入后端](./embeddings) -- 本地语义搜索方案
- [向量搜索与文本处理](./vector-search)
- [记忆维护](./hygiene)
