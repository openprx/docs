---
title: 支持的嵌入模型
description: PRX-Memory 支持的嵌入模型，包括 OpenAI 兼容、Jina 和 Gemini 供应商及配置详情。
---

# 支持的嵌入模型

PRX-Memory 支持三个嵌入供应商系列。每个供应商通过 `prx-memory-embed` crate 的统一适配器接口连接。

## OpenAI 兼容

任何遵循 OpenAI 嵌入端点格式（`/v1/embeddings`）的 API 都可以使用。包括 OpenAI 本身、Azure OpenAI 和本地推理服务器。

```bash
PRX_EMBED_PROVIDER=openai-compatible
PRX_EMBED_API_KEY=your_openai_key
PRX_EMBED_MODEL=text-embedding-3-small
PRX_EMBED_BASE_URL=https://api.openai.com  # 可选
```

| 模型 | 维度 | 备注 |
|------|-----|------|
| `text-embedding-3-small` | 1536 | 质量和成本的良好平衡 |
| `text-embedding-3-large` | 3072 | 最高质量，成本较高 |
| `text-embedding-ada-002` | 1536 | 旧版模型 |

::: tip 本地推理
对于隐私敏感的部署，将 `PRX_EMBED_BASE_URL` 指向运行开源嵌入模型的本地推理服务器（例如通过 Ollama、vLLM 或 text-embeddings-inference）。
:::

## Jina AI

Jina 提供针对检索任务优化的高质量多语言嵌入模型。

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3
```

| 模型 | 维度 | 备注 |
|------|-----|------|
| `jina-embeddings-v3` | 1024 | 最新多语言模型 |
| `jina-embeddings-v2-base-en` | 768 | 英语优化 |
| `jina-embeddings-v2-base-code` | 768 | 代码优化 |

::: info 备用密钥
如果未设置 `PRX_EMBED_API_KEY`，系统会检查 `JINA_API_KEY` 作为备用。
:::

## Google Gemini

Gemini 嵌入模型通过 Google AI API 提供。

```bash
PRX_EMBED_PROVIDER=gemini
PRX_EMBED_API_KEY=your_gemini_key
PRX_EMBED_MODEL=text-embedding-004
```

| 模型 | 维度 | 备注 |
|------|-----|------|
| `text-embedding-004` | 768 | 当前推荐模型 |
| `embedding-001` | 768 | 旧版模型 |

::: info 备用密钥
如果未设置 `PRX_EMBED_API_KEY`，系统会检查 `GEMINI_API_KEY` 作为备用。
:::

## 选择模型

| 优先级 | 推荐模型 | 供应商 |
|--------|---------|--------|
| 最佳质量 | `text-embedding-3-large` | OpenAI 兼容 |
| 最适合代码 | `jina-embeddings-v2-base-code` | Jina |
| 多语言 | `jina-embeddings-v3` | Jina |
| 隐私/本地部署 | 任何本地模型通过 `openai-compatible` | 自托管 |
| 性价比 | `text-embedding-3-small` | OpenAI 兼容 |

## 切换模型

切换嵌入模型时，现有向量与新模型的向量空间不兼容。使用 `memory_reembed` 工具将所有存储的记忆用新模型重新嵌入：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_reembed",
    "arguments": {}
  }
}
```

::: warning
重新嵌入需要对每条存储的记忆进行 API 调用。对于大型数据库，这可能需要较长时间并产生 API 费用。请在低使用率时段计划重新嵌入。
:::

## 下一步

- [批量处理](./batch-processing) -- 高效的批量嵌入
- [重排序模型](../reranking/models) -- 第二阶段重排序模型选项
- [配置参考](../configuration/) -- 所有环境变量
