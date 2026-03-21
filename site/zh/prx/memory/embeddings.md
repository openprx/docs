---
title: 向量嵌入记忆后端
description: 基于向量嵌入的语义记忆，支持 RAG 风格的检索。
---

# 向量嵌入记忆后端

向量嵌入后端将记忆存储为向量嵌入，实现语义相似度搜索。这是最强大的回忆机制，即使精确关键词不匹配，Agent 也能找到上下文相关的记忆。

## 概述

向量嵌入后端的工作方式：

- 将记忆文本转换为稠密向量表示
- 在本地或远程向量数据库中存储向量
- 通过与当前查询的余弦相似度检索记忆
- 支持多种嵌入提供商（Ollama、OpenAI 等）

## 工作原理

1. 存储记忆时，文本被发送到嵌入模型
2. 生成的向量与原始文本一起存储
3. 回忆时，当前上下文被嵌入并与存储的向量比较
4. 返回相似度最高的 Top-K 条记忆

## 配置

```toml
[memory]
backend = "embeddings"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768
top_k = 10
similarity_threshold = 0.5

[memory.embeddings.store]
type = "sqlite-vec"  # 或 "pgvector"
path = "~/.local/share/openprx/embeddings.db"
```

## 支持的嵌入提供商

| 提供商 | 模型 | 维度 |
|--------|------|------|
| Ollama | nomic-embed-text | 768 |
| OpenAI | text-embedding-3-small | 1536 |
| OpenAI | text-embedding-3-large | 3072 |

## 相关页面

- [记忆系统概览](./)
- [SQLite 后端](./sqlite)
- [记忆维护](./hygiene)
