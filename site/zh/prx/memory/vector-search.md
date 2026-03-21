---
title: 向量搜索与文本处理
description: PRX 记忆系统的向量搜索引擎、文本分块策略、主题提取和内容过滤机制。
---

# 向量搜索与文本处理

PRX 记忆系统使用基于 Embedding 的向量搜索实现语义检索，并配合智能文本处理流水线完成分块、主题提取和内容过滤。本页描述这些子系统的技术细节。

## 概述

向量搜索与文本处理由四个核心模块组成：

- **Embedding 搜索引擎** -- 将查询和记忆转换为向量，通过余弦相似度检索
- **文本分块器** -- 将长文本切分为适合 Embedding 的语义单元
- **主题提取器** -- 从记忆中自动提取关键主题和实体
- **内容过滤器** -- 判断哪些内容值得保存为长期记忆

## 向量搜索引擎

### 工作原理

```
查询文本 → Embedding 模型 → 查询向量
                                │
                                ▼
                        余弦相似度计算
                                │
                                ▼
存储向量 ← Embedding 模型 ← 记忆文本    Top-K 结果
```

### 混合搜索

PRX 默认使用混合搜索策略，结合向量相似度和关键词 BM25 评分：

```
最终得分 = vector_weight × 向量相似度 + keyword_weight × BM25 分数
```

### 配置

```toml
[memory]
embedding_provider = "openai"
embedding_model = "text-embedding-3-small"
embedding_dimensions = 1536
vector_weight = 0.7
keyword_weight = 0.3
min_relevance_score = 0.4
embedding_cache_size = 10000
```

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `embedding_provider` | String | `"none"` | Embedding 提供商：`"none"` / `"openai"` / `"custom:URL"` |
| `embedding_model` | String | `"text-embedding-3-small"` | Embedding 模型名称 |
| `embedding_dimensions` | usize | `1536` | 向量维度 |
| `vector_weight` | f64 | `0.7` | 混合搜索中向量相似度权重（0.0 - 1.0） |
| `keyword_weight` | f64 | `0.3` | 混合搜索中关键词 BM25 权重（0.0 - 1.0） |
| `min_relevance_score` | f64 | `0.4` | 结果最低相关性分数阈值 |
| `embedding_cache_size` | usize | `10000` | Embedding 结果 LRU 缓存最大条目数 |

### 支持的 Embedding 提供商

| 提供商 | 模型 | 维度 | 说明 |
|--------|------|------|------|
| OpenAI | text-embedding-3-small | 1536 | 高性价比，推荐默认 |
| OpenAI | text-embedding-3-large | 3072 | 更高精度 |
| Ollama | nomic-embed-text | 768 | 本地运行，无 API 费用 |
| Custom | 自定义 | 自定义 | 任何 OpenAI 兼容接口 |

## 文本分块策略

记忆在存储前需要切分为适合 Embedding 的语义单元。PRX 支持两种分块策略：

### Token-Aware 分块

基于 Token 数量切分，保证每个块不超过 Embedding 模型的输入限制：

```toml
[memory.chunking]
strategy = "token_aware"
max_tokens = 512
overlap_tokens = 64
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `max_tokens` | usize | `512` | 每个块的最大 Token 数 |
| `overlap_tokens` | usize | `64` | 相邻块之间的重叠 Token 数，保留上下文连续性 |

特点：

- 切分精确，保证不超限
- 可能在句子中间切断
- 计算开销低

### 语义分块

基于文本的语义边界切分，优先在段落、句子或主题切换处分割：

```toml
[memory.chunking]
strategy = "semantic"
target_tokens = 256
max_tokens = 512
similarity_threshold = 0.5
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `target_tokens` | usize | `256` | 每个块的目标 Token 数 |
| `max_tokens` | usize | `512` | 每个块的硬上限 Token 数 |
| `similarity_threshold` | f64 | `0.5` | 相邻句子语义相似度阈值，低于此值时切分 |

特点：

- 块内容语义完整
- 需要额外的 Embedding 计算来判断边界
- 检索质量通常更高

### 策略选择建议

| 场景 | 推荐策略 | 原因 |
|------|----------|------|
| 对话记忆 | Token-Aware | 对话通常较短，分块需求简单 |
| 长文档/知识库 | 语义分块 | 保持段落完整性，检索更准确 |
| 低延迟场景 | Token-Aware | 计算开销更低 |
| 高精度场景 | 语义分块 | 语义完整性带来更好的检索质量 |

## 主题提取

PRX 自动从记忆条目中提取主题标签，用于分类、聚合和辅助检索。

### 提取方式

- **关键词提取** -- 基于 TF-IDF 提取高频关键词
- **实体识别** -- 识别人名、地名、组织名等命名实体
- **LLM 辅助** -- 可选使用 LLM 生成更准确的主题摘要

### 配置

```toml
[memory.topics]
enabled = true
method = "keyword"
max_topics_per_memory = 5
min_frequency = 2
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | bool | `true` | 启用主题提取 |
| `method` | String | `"keyword"` | 提取方式：`"keyword"` / `"entity"` / `"llm"` |
| `max_topics_per_memory` | usize | `5` | 每条记忆的最大主题数 |
| `min_frequency` | usize | `2` | 关键词模式下的最小词频阈值 |

## 内容过滤与自动保存

并非所有对话内容都应保存为长期记忆。PRX 使用启发式规则判断内容是否值得持久化。

### 过滤规则

自动保存启发式基于以下信号判断：

| 信号 | 权重 | 说明 |
|------|------|------|
| 事实性陈述 | 高 | 包含具体事实、偏好、数据点 |
| 指令/偏好 | 高 | "我喜欢..." "请总是..." 等用户偏好 |
| 闲聊/问候 | 低 | "你好" "谢谢" 等无实质内容 |
| 重复内容 | 跳过 | 与已有记忆语义重复的内容 |
| 过短内容 | 跳过 | 低于最小长度阈值的消息 |

### 配置

```toml
[memory]
auto_save = true

[memory.filter]
min_content_length = 20
dedup_similarity_threshold = 0.9
exclude_patterns = ["^(hi|hello|thanks|ok)$"]
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `min_content_length` | usize | `20` | 自动保存的最小内容字符数 |
| `dedup_similarity_threshold` | f64 | `0.9` | 去重相似度阈值，超过此值视为重复 |
| `exclude_patterns` | Vec\<String\> | `[]` | 排除匹配的正则表达式模式列表 |

## 使用方法

### 启用向量搜索

1. 配置 Embedding 提供商（需要 API Key 或本地 Ollama）
2. 设置 `embedding_provider` 为所选提供商
3. 重启 PRX 守护进程

```bash
# 验证向量搜索是否工作
prx memory search "上次讨论的项目进展"
```

### 手动触发重索引

当切换 Embedding 模型或维度后，需要重新索引现有记忆：

```bash
prx memory reindex
```

### 调试搜索质量

```bash
# 显示搜索过程中的评分细节
prx memory search "查询内容" --verbose
```

## 相关文档

- [记忆系统概览](./)
- [向量嵌入后端](./embeddings) -- Embedding 存储后端配置
- [Lucid 后端](./lucid) -- 云端语义记忆服务
- [记忆维护](./hygiene) -- 记忆清理与归档策略
- [完整配置参考](/zh/prx/config/reference)
