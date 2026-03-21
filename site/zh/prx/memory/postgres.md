---
title: PostgreSQL 记忆后端
description: 使用 PostgreSQL 的远程数据库记忆存储，适合多用户服务器部署。
---

# PostgreSQL 记忆后端

PostgreSQL 后端将记忆存储在远程 PostgreSQL 数据库中，支持多用户和多 Agent 实例共享记忆。这是服务器部署的推荐后端。

## 概述

PostgreSQL 后端提供：

- 多个 PRX 实例间的共享记忆
- 通过 `tsvector` 和 `pg_trgm` 实现全文搜索
- 行级安全实现多租户隔离
- 适合大规模部署的水平扩展能力

## 配置

```toml
[memory]
backend = "postgres"

[memory.postgres]
url = "postgresql://prx:password@localhost:5432/prx_memory"
max_connections = 5
schema = "memory"
```

## 多用户隔离

当多个用户共享 PostgreSQL 记忆后端时，每个用户的记忆通过用户 ID 隔离。后端对所有操作使用参数化查询以防止 SQL 注入。

## 迁移

PostgreSQL 后端包含自动模式迁移，在启动时运行。无需手动迁移步骤。

## 相关页面

- [记忆系统概览](./)
- [SQLite 后端](./sqlite) -- 用于本地部署
- [记忆维护](./hygiene)
