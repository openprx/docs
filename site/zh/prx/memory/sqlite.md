---
title: SQLite 记忆后端
description: 使用 SQLite 的本地数据库记忆存储，支持 FTS5 全文搜索。
---

# SQLite 记忆后端

SQLite 后端将记忆存储在本地 SQLite 数据库中，并使用 FTS5 全文搜索索引。它在保持本地化的同时提供结构化存储和快速检索。

## 概述

SQLite 是 PRX 的默认记忆后端。它在性能、功能和简洁性之间提供了良好的平衡：

- 通过 FTS5 扩展实现全文搜索
- ACID 事务保证可靠写入
- 零配置（单文件数据库）
- 适合数万条记忆条目

## 数据表结构

SQLite 后端使用以下核心表：

- `memories` -- 存储带有元数据的个人记忆条目
- `memories_fts` -- FTS5 虚拟表用于全文搜索
- `topics` -- 记忆组织的主题分类

## 配置

```toml
[memory]
backend = "sqlite"

[memory.sqlite]
path = "~/.local/share/openprx/memory.db"
journal_mode = "wal"
busy_timeout_ms = 5000
```

## 全文搜索

FTS5 索引支持跨所有记忆条目的排序全文搜索。查询支持：

- 布尔运算符（AND、OR、NOT）
- 引号内的短语匹配
- 星号前缀匹配
- 特定列搜索

## 相关页面

- [记忆系统概览](./)
- [PostgreSQL 后端](./postgres) -- 用于多用户部署
- [记忆维护](./hygiene)
