---
title: "L1: 记忆进化"
description: PRX 第一层自进化，涵盖记忆压缩和主题聚类。
---

# L1: 记忆进化

L1 是频率最高、风险最低的自进化层。它作用于 Agent 的记忆系统，自动压缩冗余条目并按主题聚类相关记忆。

## 概述

L1 进化在每次会话后（或按可配置的计划）运行，执行以下操作：

- **压缩** -- 将多个相关记忆条目合并为简洁摘要
- **主题聚类** -- 按语义相似度对记忆进行分组
- **相关性评分** -- 根据访问频率调整记忆权重
- **清理** -- 移除已过期或被矛盾的记忆

## 工作原理

1. 会话结束后，L1 分析新存储的记忆
2. 使用嵌入相似度识别相关条目的集群
3. 超过大小阈值的集群被压缩为摘要
4. 根据回忆频率更新记忆相关性分数

## 配置

```toml
[self_evolution.l1]
enabled = true
schedule = "after_session"  # 或 "hourly", "daily"
compaction_threshold = 10
cluster_similarity = 0.8
min_access_count = 2
```

## 相关页面

- [自进化概览](./)
- [记忆维护](/zh/prx/memory/hygiene)
- [L2: 提示词优化](./l2-prompt)
