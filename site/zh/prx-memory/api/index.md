---
title: Rust API 参考
description: PRX-Memory Rust 库 API 参考，用于在你自己的 Rust 应用程序中嵌入记忆引擎。
---

# Rust API 参考

PRX-Memory 组织为一个包含七个 crate 的 Rust 工作区。每个 crate 提供聚焦的 API，可以独立使用或组合使用。

## Crate 概览

### prx-memory-core

核心领域原语，用于评分、进化和记忆条目表示。

```toml
[dependencies]
prx-memory-core = "0.1"
```

关键类型：
- 包含文本、作用域、标签、重要性和元数据的记忆条目结构体。
- 用于相关性排序的评分原语。
- 用于训练集/保留集接受测试的进化类型。

### prx-memory-embed

嵌入供应商抽象和适配器。

```toml
[dependencies]
prx-memory-embed = "0.1"
```

提供所有嵌入供应商都实现的异步 trait：

```rust
// 概念性 API（简化版）
#[async_trait]
pub trait EmbedProvider: Send + Sync {
    async fn embed(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>, EmbedError>;
}
```

内置实现：
- `OpenAiCompatibleProvider` -- 任何 OpenAI 兼容的嵌入 API
- `JinaProvider` -- Jina AI 嵌入
- `GeminiProvider` -- Google Gemini 嵌入

### prx-memory-rerank

重排序供应商抽象和适配器。

```toml
[dependencies]
prx-memory-rerank = "0.1"
```

提供重排序的异步 trait：

```rust
// 概念性 API（简化版）
#[async_trait]
pub trait RerankProvider: Send + Sync {
    async fn rerank(
        &self,
        query: &str,
        documents: &[&str],
    ) -> Result<Vec<RerankResult>, RerankError>;
}
```

内置实现：
- `JinaReranker`
- `CohereReranker`
- `PineconeReranker`

### prx-memory-ai

组合嵌入和重排序的统一供应商抽象。

```toml
[dependencies]
prx-memory-ai = "0.1"
```

此 crate 提供单一入口点，用于从环境变量配置嵌入和重排序供应商。

### prx-memory-skill

内置治理技能负载，用于 MCP 资源分发。

```toml
[dependencies]
prx-memory-skill = "0.1"
```

提供静态技能定义和负载模板，可通过 MCP 资源协议发现。

### prx-memory-storage

本地持久化存储引擎。

```toml
[dependencies]
prx-memory-storage = "0.1"

# 启用 LanceDB 支持
[dependencies]
prx-memory-storage = { version = "0.1", features = ["lancedb-backend"] }
```

提供以下存储 trait 实现：
- JSON 基于文件的存储
- SQLite 带向量列
- LanceDB（可选，需特性标志）

### prx-memory-mcp

结合所有其他 crate 的 MCP 服务器表面，生成可运行的守护进程。

```toml
[dependencies]
prx-memory-mcp = "0.1"
```

此 crate 通常不作为库依赖使用——它提供 `prx-memoryd` 二进制文件。

## 错误处理

所有 crate 使用 `thiserror` 定义类型化错误枚举。错误通过 `?` 操作符传播，在生产代码中从不转换为 panic。

```rust
// 错误模式示例
use thiserror::Error;

#[derive(Error, Debug)]
pub enum EmbedError {
    #[error("API request failed: {0}")]
    Request(#[from] reqwest::Error),
    #[error("API key not configured")]
    MissingApiKey,
    #[error("Unexpected response: {0}")]
    Response(String),
}
```

## 并发

- 同步互斥锁使用 `parking_lot::Mutex`（无中毒）。
- 异步互斥锁使用 `tokio::sync::Mutex`。
- `std::sync::Mutex` 在生产代码中被禁止。
- 共享不可变数据使用 `Arc<str>` 或 `Arc<T>`。

## 依赖

所有网络请求使用 `reqwest` 配合 `rustls-tls`（无 OpenSSL 依赖）。序列化使用 `serde` 和 `serde_json`。

## 下一步

- [嵌入模型](../embedding/models) -- 供应商专用配置
- [存储后端](../storage/) -- 存储 trait 实现
- [配置参考](../configuration/) -- 环境变量参考
