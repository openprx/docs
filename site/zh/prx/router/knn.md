---
title: KNN 路由
description: 基于历史查询嵌入的 K 近邻语义相似度 LLM 路由。
---

# KNN 路由

KNN（K 近邻）路由使用语义相似度将传入查询与已知最优模型分配的历史查询数据库进行匹配。这实现了随时间改进的学习型路由。

## 工作原理

1. **嵌入查询** -- 将传入查询转换为向量嵌入
2. **KNN 搜索** -- 在嵌入存储中找到 K 个最相似的历史查询
3. **投票** -- 聚合 K 个邻居的模型分配
4. **选择** -- 选择得票最多的模型（按相似度加权）

## 训练数据

KNN 路由器从以下来源构建数据集：

- 带有质量评分的 Agent 会话日志
- 提示词进化的 A/B 测试结果
- 手动反馈和更正

## 配置

```toml
[router]
strategy = "knn"

[router.knn]
k = 5
embedding_provider = "ollama"
embedding_model = "nomic-embed-text"
min_similarity = 0.6
min_dataset_size = 100
fallback_strategy = "heuristic"
```

## 冷启动

当训练数据不足（低于 `min_dataset_size`）时，KNN 路由器回退到启发式策略。

## 相关页面

- [路由器概览](./)
- [启发式路由](./heuristic)
- [Automix 路由](./automix)
- [向量嵌入记忆](/zh/prx/memory/embeddings)
