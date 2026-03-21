---
title: 快速上手
description: 5 分钟内使用 stdio 或 HTTP 传输运行 PRX-Memory，存储你的第一条记忆并通过语义搜索召回。
---

# 快速上手

本指南将带你完成构建 PRX-Memory、运行守护进程以及执行首次存储和召回操作的全过程。

## 1. 构建守护进程

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build -p prx-memory-mcp --bin prx-memoryd
```

## 2. 启动服务器

### 选项 A：stdio 传输

用于直接 MCP 客户端集成：

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

### 选项 B：HTTP 传输

用于带有健康检查和指标的网络访问：

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

验证服务器正在运行：

```bash
curl -sS http://127.0.0.1:8787/health
```

## 3. 配置你的 MCP 客户端

将 PRX-Memory 添加到你的 MCP 客户端配置中。例如，在 Claude Code 或 Codex 中：

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memory/target/release/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/prx-memory/data/memory-db.json"
      }
    }
  }
}
```

::: tip
将 `/path/to/prx-memory` 替换为你克隆仓库的实际路径。
:::

## 4. 存储一条记忆

通过 MCP 客户端或直接通过 JSON-RPC 发送 `memory_store` 工具调用：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_store",
    "arguments": {
      "text": "SQL 查询必须使用参数化查询以防止注入攻击",
      "scope": "global",
      "tags": ["security", "sql", "best-practice"]
    }
  }
}
```

## 5. 召回记忆

使用 `memory_recall` 检索相关记忆：

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "memory_recall",
    "arguments": {
      "query": "SQL 安全最佳实践",
      "scope": "global",
      "limit": 5
    }
  }
}
```

系统使用词法匹配、重要性评分和时效性的组合返回按相关性排序的记忆。

## 6. 启用语义搜索（可选）

要使用基于向量的语义召回，配置嵌入供应商：

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_jina_api_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

启用嵌入后，召回查询除了词法匹配外还使用向量相似度，显著提高自然语言查询的检索质量。

## 7. 启用重排序（可选）

添加重排器以进一步提高检索精度：

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_embed_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_RERANK_PROVIDER=cohere \
PRX_RERANK_API_KEY=your_cohere_key \
PRX_RERANK_MODEL=rerank-v3.5 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

## 可用的 MCP 工具

| 工具 | 说明 |
|------|------|
| `memory_store` | 存储一条新的记忆条目 |
| `memory_recall` | 通过查询召回记忆 |
| `memory_update` | 更新已有的记忆条目 |
| `memory_forget` | 删除一条记忆条目 |
| `memory_export` | 导出所有记忆 |
| `memory_import` | 从导出数据导入记忆 |
| `memory_migrate` | 迁移存储格式 |
| `memory_reembed` | 使用新模型重新嵌入记忆 |
| `memory_compact` | 压缩和优化存储 |
| `memory_evolve` | 通过保留集验证进化记忆 |
| `memory_skill_manifest` | 发现可用的技能 |

## 下一步

- [嵌入引擎](../embedding/) -- 探索嵌入供应商和批量处理
- [重排序](../reranking/) -- 配置第二阶段重排序
- [存储后端](../storage/) -- 在 JSON 和 SQLite 存储之间选择
- [配置参考](../configuration/) -- 所有环境变量
