---
title: 存储后端
description: PRX-Memory 存储后端概述，包括基于 JSON 文件的存储、带向量扩展的 SQLite 和可选的 LanceDB。
---

# 存储后端

PRX-Memory 支持多种存储后端用于持久化记忆及其向量嵌入。`prx-memory-storage` crate 提供所有后端都实现的统一接口。

## 可用后端

| 后端 | 配置值 | 向量支持 | 持久化方式 | 最适合 |
|------|-------|---------|-----------|--------|
| JSON | `json` | 内嵌在条目中 | 基于文件 | 开发、小数据集 |
| SQLite | `sqlite` | 内置向量列 | 基于文件 | 生产、中等数据集 |
| LanceDB | `lancedb` | 原生向量索引 | 基于目录 | 大数据集、快速 ANN 搜索 |

::: tip 默认后端
默认后端是 JSON（`PRX_MEMORY_BACKEND=json`），无需额外设置。生产部署推荐使用 SQLite。
:::

## JSON 后端

最简单的后端将所有记忆存储在单个 JSON 文件中。适合开发、测试和小型记忆集（10,000 条以下）。

```bash
PRX_MEMORY_BACKEND=json
PRX_MEMORY_DB=./data/memory-db.json
```

**优势：**
- 零设置——只需指定文件路径。
- 人类可读——可以用任何文本编辑器查看和编辑。
- 可移植——复制文件即可迁移整个记忆数据库。

**局限：**
- 启动时将整个文件加载到内存中。
- 写操作重写整个文件。
- 无索引向量搜索——暴力扫描进行相似度计算。

## SQLite 后端

SQLite 提供 ACID 事务、索引查询和内置向量列支持，实现高效的相似度搜索。

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

详见 [SQLite 存储](./sqlite) 了解详细配置。

## LanceDB 后端（可选）

LanceDB 提供原生的近似最近邻（ANN）向量搜索和列式存储。使用 `lancedb-backend` 特性标志启用：

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

```bash
PRX_MEMORY_BACKEND=lancedb
PRX_MEMORY_DB=./data/lancedb
```

::: warning 需要特性标志
LanceDB 支持未包含在默认构建中。你必须在编译时启用 `lancedb-backend` 特性标志。
:::

## 选择后端

| 场景 | 推荐后端 |
|------|---------|
| 本地开发 | JSON |
| 生产环境，<100k 条目 | SQLite |
| 生产环境，>100k 条目 | LanceDB |
| 需要人类可读的存储 | JSON |
| 需要 ACID 事务 | SQLite |
| 需要快速 ANN 向量搜索 | LanceDB |

## 存储操作

PRX-Memory 提供存储维护工具：

| 工具 | 说明 |
|------|------|
| `memory_export` | 将所有记忆导出为可移植格式 |
| `memory_import` | 从导出数据导入记忆 |
| `memory_migrate` | 在存储后端之间迁移 |
| `memory_compact` | 优化存储并回收空间 |
| `memory_reembed` | 使用新模型重新嵌入所有记忆 |

## 下一步

- [SQLite 存储](./sqlite) -- SQLite 配置和调优
- [向量搜索](./vector-search) -- 向量相似度搜索的工作原理
- [配置参考](../configuration/) -- 所有环境变量
