---
title: 检索增强生成 (RAG)
description: PRX 如何通过 embeddings 和 memory search 将相关上下文注入 LLM 提示词，实现知识增强。
---

# 检索增强生成 (RAG)

PRX 内置 RAG（Retrieval-Augmented Generation）管道，在每次 LLM 调用前自动检索相关上下文并注入提示词。通过结合向量嵌入和记忆系统，Agent 能够利用大规模知识库回答问题，同时保持响应的准确性和时效性。

## 概述

RAG 解决 LLM 的两个核心限制：

- **知识截止** -- LLM 训练数据有截止日期，RAG 提供最新信息
- **上下文窗口** -- 无法将所有知识塞入 prompt，RAG 只检索相关片段

### 工作流程

```
用户输入
  │
  ├─ 1. 查询理解
  │     提取关键词、意图、实体
  │
  ├─ 2. 检索阶段
  │     ├─ 向量检索：embedding similarity search (Top-K)
  │     ├─ 关键词检索：FTS5 / pg_trgm 全文搜索
  │     └─ 混合排序：RRF (Reciprocal Rank Fusion) 合并结果
  │
  ├─ 3. 重排序 (可选)
  │     使用 cross-encoder 或 LLM 对候选结果重新打分
  │
  ├─ 4. 上下文组装
  │     将检索到的文本片段格式化为 system prompt 的一部分
  │
  └─ 5. LLM 生成
        带有检索上下文的完整 prompt 发送给 LLM
```

## 分块策略

将文档拆分为适合检索的片段（chunk）是 RAG 的关键步骤。

### 支持的分块方法

| 方法 | 适用场景 | 配置键 |
|------|---------|--------|
| 固定大小 | 通用文本 | `fixed_size` |
| 段落分割 | 结构化文档 | `paragraph` |
| 递归分割 | Markdown / 代码 | `recursive` |
| 语义分割 | 精确度优先 | `semantic` |

### 分块配置

```toml
[memory.rag.chunking]
# 分块方法: "fixed_size" | "paragraph" | "recursive" | "semantic"
method = "recursive"

# 每个 chunk 的目标 token 数
chunk_size = 512

# chunk 之间的重叠 token 数（保持上下文连续性）
chunk_overlap = 64

# 递归分割的分隔符优先级
separators = ["\n## ", "\n### ", "\n\n", "\n", ". "]
```

## 检索管道

### 向量检索

基于语义相似度的检索，利用 embedding 模型：

```toml
[memory.rag.retrieval]
# 主检索方式
method = "hybrid"  # "vector" | "keyword" | "hybrid"

[memory.rag.retrieval.vector]
# 返回的最大结果数
top_k = 10

# 相似度阈值（低于此值的结果被过滤）
similarity_threshold = 0.4

# embedding 提供商配置（复用 memory.embeddings）
# 参见 /zh/prx/memory/embeddings
```

### 关键词检索

基于精确关键词匹配的补充检索：

```toml
[memory.rag.retrieval.keyword]
# 使用的搜索引擎（跟随 memory backend）
# sqlite -> FTS5, postgres -> pg_trgm + tsvector
enabled = true
top_k = 10
```

### 混合检索与排序

```toml
[memory.rag.retrieval.hybrid]
# 向量检索权重
vector_weight = 0.7

# 关键词检索权重
keyword_weight = 0.3

# 合并算法: "rrf" (Reciprocal Rank Fusion) | "weighted_sum"
fusion_method = "rrf"

# RRF 参数 k
rrf_k = 60
```

## 重排序

对初步检索结果进行精细化排序：

```toml
[memory.rag.reranking]
enabled = false

# 重排序方法: "cross_encoder" | "llm" | "cohere"
method = "cross_encoder"

# Cross-encoder 模型
[memory.rag.reranking.cross_encoder]
provider = "ollama"
model = "bge-reranker-v2-m3"

# 重排序后保留的 Top-N
top_n = 5
```

## 上下文注入

检索到的内容如何注入 LLM 提示词：

```toml
[memory.rag.injection]
# 注入位置: "system" | "user" | "assistant"
position = "system"

# 上下文模板
template = """
以下是与用户问题相关的参考资料，请基于这些资料回答：

{context}

注意：如果参考资料中没有相关信息，请明确说明。
"""

# 最大注入 token 数（防止超出上下文窗口）
max_tokens = 4096

# 是否包含来源引用
include_sources = true
```

## 完整配置示例

```toml
[memory]
backend = "embeddings"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768

[memory.rag]
enabled = true

[memory.rag.chunking]
method = "recursive"
chunk_size = 512
chunk_overlap = 64

[memory.rag.retrieval]
method = "hybrid"

[memory.rag.retrieval.vector]
top_k = 10
similarity_threshold = 0.4

[memory.rag.retrieval.keyword]
enabled = true
top_k = 10

[memory.rag.retrieval.hybrid]
vector_weight = 0.7
keyword_weight = 0.3
fusion_method = "rrf"

[memory.rag.reranking]
enabled = false

[memory.rag.injection]
position = "system"
max_tokens = 4096
include_sources = true
```

## 使用方法

### CLI 命令

```bash
# 导入文档到 RAG 知识库
prx rag ingest /path/to/docs/

# 导入单个文件
prx rag ingest README.md

# 查询测试（不经过 LLM，仅检索）
prx rag search "如何配置 webhook"

# 查看知识库统计
prx rag stats

# 清理过期的 chunk
prx rag prune --older-than 30d
```

### 对话中使用

RAG 在对话中自动工作，无需手动触发：

```
用户: PRX 支持哪些消息渠道？

Agent: （自动检索相关文档片段）
根据参考资料，PRX 支持以下消息渠道：
- Telegram Bot
- Matrix
- Slack (webhook)
- Discord
- Email (IMAP/SMTP)
...
[来源: channels/index.md, channels/telegram.md]
```

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `rag.enabled` | bool | `false` | 启用 RAG 管道 |
| `rag.chunking.method` | string | `"recursive"` | 分块方法 |
| `rag.chunking.chunk_size` | u32 | `512` | 每 chunk token 数 |
| `rag.chunking.chunk_overlap` | u32 | `64` | chunk 重叠 token 数 |
| `rag.retrieval.method` | string | `"hybrid"` | 检索方式 |
| `rag.retrieval.vector.top_k` | u32 | `10` | 向量检索返回数 |
| `rag.retrieval.vector.similarity_threshold` | f64 | `0.4` | 相似度阈值 |
| `rag.reranking.enabled` | bool | `false` | 启用重排序 |
| `rag.injection.position` | string | `"system"` | 注入位置 |
| `rag.injection.max_tokens` | u32 | `4096` | 最大注入 token 数 |

## 安全性

- **数据隔离** -- 每个工作区的知识库互相隔离，不会交叉检索
- **权限控制** -- 导入文档和查询统计受角色权限限制
- **本地处理** -- 使用本地 embedding 模型（如 Ollama）时，文档不离开本机
- **敏感过滤** -- 可配置正则表达式过滤包含密钥、密码等敏感内容的 chunk

## 相关文档

- [记忆系统概览](./)
- [向量嵌入后端](./embeddings)
- [SQLite 后端](./sqlite)
- [PostgreSQL 后端](./postgres)
- [记忆维护](./hygiene)
