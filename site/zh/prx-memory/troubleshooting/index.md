---
title: 故障排除
description: PRX-Memory 常见问题和解决方案，涵盖配置、嵌入、重排序、存储和 MCP 集成。
---

# 故障排除

本页涵盖运行 PRX-Memory 时常见的问题及其原因和解决方案。

## 配置问题

### "PRX_EMBED_API_KEY is not configured"

**原因：** 请求了远程语义召回但未设置嵌入 API 密钥。

**解决方案：** 设置嵌入供应商和 API 密钥：

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_api_key
```

或使用供应商专用备用密钥：

```bash
JINA_API_KEY=your_api_key
```

::: tip
如果不需要语义搜索，PRX-Memory 可以在不配置嵌入的情况下仅使用词法匹配工作。
:::

### "Unsupported rerank provider"

**原因：** `PRX_RERANK_PROVIDER` 变量包含无法识别的值。

**解决方案：** 使用支持的值之一：

```bash
PRX_RERANK_PROVIDER=jina        # 或 cohere、pinecone、pinecone-compatible、none
```

### "Unsupported embed provider"

**原因：** `PRX_EMBED_PROVIDER` 变量包含无法识别的值。

**解决方案：** 使用支持的值之一：

```bash
PRX_EMBED_PROVIDER=openai-compatible  # 或 jina、gemini
```

## 会话问题

### "session_expired"

**原因：** HTTP 流式会话超过了 TTL 而未被续期。

**解决方案：** 在过期前续期会话，或增加 TTL：

```bash
# 续期会话
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"

# 或增加 TTL（默认：300000ms = 5 分钟）
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000
```

## 存储问题

### 找不到数据库文件

**原因：** `PRX_MEMORY_DB` 中指定的路径不存在或不可写。

**解决方案：** 确保目录存在且路径正确：

```bash
mkdir -p ./data
PRX_MEMORY_DB=./data/memory-db.json
```

::: tip
使用绝对路径以避免工作目录变更引起的问题。
:::

### 大型 JSON 数据库加载缓慢

**原因：** JSON 后端在启动时将整个文件加载到内存中。对于超过 10,000 条的数据库，这可能很慢。

**解决方案：** 迁移到 SQLite 后端：

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

使用 `memory_migrate` 工具转移现有数据。

## 可观测性问题

### 指标基数溢出告警

**原因：** 召回作用域、分类或重排序供应商维度中有过多不同的标签值。

**解决方案：** 增加基数限制或归一化你的输入：

```bash
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_METRICS_MAX_RECALL_CATEGORY_LABELS=64
PRX_METRICS_MAX_RERANK_PROVIDER_LABELS=32
```

超过限制时，新的标签值会被静默丢弃，并计入 `prx_memory_metrics_label_overflow_total`。

### 告警阈值过于敏感

**原因：** 默认告警阈值在初始部署期间可能触发误报。

**解决方案：** 根据你预期的错误率调整阈值：

```bash
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.10
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.30
```

## 构建问题

### LanceDB 特性不可用

**原因：** 编译时未启用 `lancedb-backend` 特性。

**解决方案：** 使用特性标志重新构建：

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

### Linux 上的编译错误

**原因：** 缺少构建原生代码所需的系统依赖。

**解决方案：** 安装构建依赖：

```bash
# Debian/Ubuntu
sudo apt install -y build-essential pkg-config libssl-dev

# Fedora
sudo dnf install -y gcc openssl-devel pkg-config
```

## 健康检查

使用 HTTP 健康端点验证服务器运行正常：

```bash
curl -sS http://127.0.0.1:8787/health
```

检查指标了解运行状态：

```bash
curl -sS http://127.0.0.1:8787/metrics/summary
```

## 验证命令

运行完整的验证套件以确认安装正确：

```bash
# 多客户端验证
./scripts/run_multi_client_validation.sh

# 压力测试（60 秒，4 QPS）
./scripts/run_soak_http.sh 60 4
```

## 获取帮助

- **仓库：** [github.com/openprx/prx-memory](https://github.com/openprx/prx-memory)
- **Issues：** [github.com/openprx/prx-memory/issues](https://github.com/openprx/prx-memory/issues)
- **文档：** [docs/README.md](https://github.com/openprx/prx-memory/blob/main/docs/README.md)
