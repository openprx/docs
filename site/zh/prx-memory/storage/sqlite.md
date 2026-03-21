---
title: SQLite 存储
description: 配置和调优 PRX-Memory 的 SQLite 存储后端，包含向量列和索引查询。
---

# SQLite 存储

SQLite 后端提供健壮的基于文件的存储引擎，具备 ACID 事务、索引查询和内置向量列支持。它是适用于最多 100,000 条记忆的生产部署推荐后端。

## 配置

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

数据库文件在首次运行时自动创建。所有表、索引和向量列由 PRX-Memory 初始化。

## Schema 概览

SQLite 后端以结构化 schema 存储记忆：

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | TEXT | 唯一记忆标识符 |
| `text` | TEXT | 记忆内容 |
| `scope` | TEXT | 记忆作用域（global、project 等） |
| `tags` | TEXT | 标签 JSON 数组 |
| `importance` | REAL | 重要性评分（0.0--1.0） |
| `created_at` | TEXT | ISO 8601 时间戳 |
| `updated_at` | TEXT | ISO 8601 时间戳 |
| `embedding` | BLOB | 向量嵌入（如果启用） |
| `metadata` | TEXT | 附加 JSON 元数据 |

## 向量存储

启用嵌入后，向量数据以 BLOB 列存储在与记忆条目相同的表中。这种共置简化了查询并避免了 JOIN 开销。

向量相似度搜索使用对存储向量的暴力余弦相似度计算。对于 100,000 条以下的数据集，这提供亚秒级查询时间（基于基准测试，p95 低于 123ms）。

## 维护

### 压缩

随时间推移，删除和更新可能留下碎片空间。使用 `memory_compact` 回收空间：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_compact",
    "arguments": {}
  }
}
```

### 备份

SQLite 数据库文件可以在服务器停止时通过简单复制进行备份：

```bash
cp ./data/memory.db ./data/memory.db.backup
```

::: warning
不要在服务器运行时复制数据库文件。SQLite 使用预写日志（WAL），在写入过程中复制文件可能产生损坏的备份。请先停止服务器，或使用 `memory_export` 工具进行安全导出。
:::

### 从 JSON 迁移

要从 JSON 后端迁移到 SQLite：

1. 使用 `memory_export` 导出你的记忆。
2. 将后端配置更改为 SQLite。
3. 使用 `memory_import` 导入导出的数据。

或使用 `memory_migrate` 工具进行直接迁移。

## 下一步

- [向量搜索](./vector-search) -- 相似度搜索的内部工作原理
- [存储概览](./index) -- 对比所有后端
- [配置参考](../configuration/) -- 所有环境变量
