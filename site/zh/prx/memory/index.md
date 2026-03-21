---
title: 记忆系统
description: PRX 记忆系统概览，支持 5 种存储后端，实现 Agent 持久上下文。
---

# 记忆系统

PRX 提供灵活的记忆系统，使 Agent 能够在对话之间持久化和回忆上下文。记忆系统支持 5 种存储后端，每种都针对不同的部署场景进行了优化。

## 概述

记忆系统提供三个核心功能：

- **回忆** -- 在每次 LLM 调用前检索相关的历史交互和事实
- **存储** -- 持久化从对话中提取的重要信息
- **压缩** -- 总结和压缩旧记忆以适应上下文限制

## 存储后端

| 后端 | 持久性 | 搜索方式 | 最适场景 |
|------|--------|---------|---------|
| [Markdown](./markdown) | 文件存储 | 全文 grep | 单用户 CLI，版本控制记忆 |
| [SQLite](./sqlite) | 本地数据库 | FTS5 全文搜索 | 本地部署，小团队 |
| [PostgreSQL](./postgres) | 远程数据库 | pg_trgm + FTS | 多用户服务器部署 |
| [向量嵌入](./embeddings) | 向量存储 | 语义相似度 | RAG 检索，大型知识库 |
| 内存 | 无（仅会话期间） | 线性扫描 | 临时会话，测试 |

## 配置

在 `config.toml` 中选择和配置记忆后端：

```toml
[memory]
backend = "sqlite"  # "markdown" | "sqlite" | "postgres" | "embeddings" | "memory"
max_recall_items = 20
recall_relevance_threshold = 0.3

[memory.sqlite]
path = "~/.local/share/openprx/memory.db"

[memory.postgres]
url = "postgresql://user:pass@localhost/prx"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768
```

## 记忆生命周期

1. **提取** -- 每个对话轮次后，系统提取关键事实
2. **去重** -- 新事实与现有记忆进行比较
3. **存储** -- 唯一的事实被持久化到配置的后端
4. **回忆** -- 每次 LLM 调用前，检索相关记忆
5. **维护** -- 定期维护压缩和清理过期条目

## 相关页面

- [Markdown 后端](./markdown)
- [SQLite 后端](./sqlite)
- [PostgreSQL 后端](./postgres)
- [向量嵌入后端](./embeddings)
- [记忆维护](./hygiene)
