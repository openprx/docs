---
title: Rust API 레퍼런스
description: "자체 Rust 애플리케이션에 메모리 엔진을 임베딩하기 위한 PRX-Memory Rust 라이브러리 API 레퍼런스."
---

# Rust API 레퍼런스

PRX-Memory는 7개의 크레이트로 구성된 Rust 워크스페이스로 조직되어 있습니다. 각 크레이트는 독립적으로 사용하거나 함께 구성할 수 있는 집중된 API를 제공합니다.

## 크레이트 개요

### prx-memory-core

점수 산정, 진화, 메모리 항목 표현을 위한 핵심 도메인 프리미티브.

```toml
[dependencies]
prx-memory-core = "0.1"
```

주요 타입:
- 텍스트, 범위, 태그, 중요도, 메타데이터가 있는 메모리 항목 구조체.
- 관련성 랭킹을 위한 점수 프리미티브.
- 훈련/홀드아웃 수락 테스트를 위한 진화 타입.

### prx-memory-embed

임베딩 프로바이더 추상화 및 어댑터.

```toml
[dependencies]
prx-memory-embed = "0.1"
```

모든 임베딩 프로바이더가 구현하는 비동기 트레이트를 제공합니다:

```rust
// Conceptual API (simplified)
#[async_trait]
pub trait EmbedProvider: Send + Sync {
    async fn embed(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>, EmbedError>;
}
```

내장 구현:
- `OpenAiCompatibleProvider` -- OpenAI 호환 임베딩 API
- `JinaProvider` -- Jina AI 임베딩
- `GeminiProvider` -- Google Gemini 임베딩

### prx-memory-rerank

리랭크 프로바이더 추상화 및 어댑터.

```toml
[dependencies]
prx-memory-rerank = "0.1"
```

리랭킹을 위한 비동기 트레이트를 제공합니다:

```rust
// Conceptual API (simplified)
#[async_trait]
pub trait RerankProvider: Send + Sync {
    async fn rerank(
        &self,
        query: &str,
        documents: &[&str],
    ) -> Result<Vec<RerankResult>, RerankError>;
}
```

내장 구현:
- `JinaReranker`
- `CohereReranker`
- `PineconeReranker`

### prx-memory-ai

임베딩과 리랭킹을 구성하는 통합 프로바이더 추상화.

```toml
[dependencies]
prx-memory-ai = "0.1"
```

이 크레이트는 환경 변수에서 임베딩 및 리랭킹 프로바이더를 설정하기 위한 단일 진입점을 제공합니다.

### prx-memory-skill

MCP 리소스 배포를 위한 내장 거버넌스 스킬 페이로드.

```toml
[dependencies]
prx-memory-skill = "0.1"
```

MCP 리소스 프로토콜을 통해 검색 가능한 정적 스킬 정의 및 페이로드 템플릿을 제공합니다.

### prx-memory-storage

로컬 영구 스토리지 엔진.

```toml
[dependencies]
prx-memory-storage = "0.1"

# With LanceDB support
[dependencies]
prx-memory-storage = { version = "0.1", features = ["lancedb-backend"] }
```

다음을 위한 스토리지 트레이트 구현을 제공합니다:
- JSON 파일 기반 스토리지
- 벡터 컬럼이 있는 SQLite
- LanceDB (선택적, 기능 플래그 뒤에)

### prx-memory-mcp

다른 모든 크레이트를 실행 가능한 데몬으로 결합하는 MCP 서버 서페이스.

```toml
[dependencies]
prx-memory-mcp = "0.1"
```

이 크레이트는 일반적으로 라이브러리 의존성으로 사용되지 않습니다 -- `prx-memoryd` 바이너리를 제공합니다.

## 오류 처리

모든 크레이트는 타입이 지정된 오류 열거형을 위해 `thiserror`를 사용합니다. 오류는 `?` 연산자를 사용하여 전파되며 프로덕션 코드에서 패닉으로 변환되지 않습니다.

```rust
// Example error pattern
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

## 동시성

- 동기 뮤텍스는 `parking_lot::Mutex`를 사용합니다 (포이즈닝 없음).
- 비동기 뮤텍스는 `tokio::sync::Mutex`를 사용합니다.
- `std::sync::Mutex`는 프로덕션 코드에서 금지됩니다.
- 공유 불변 데이터는 `Arc<str>` 또는 `Arc<T>`를 사용합니다.

## 의존성

모든 네트워크 요청은 `rustls-tls`가 있는 `reqwest`를 사용합니다 (OpenSSL 의존성 없음). 직렬화는 `serde` 및 `serde_json`을 사용합니다.

## 다음 단계

- [임베딩 모델](../embedding/models) -- 프로바이더별 설정
- [스토리지 백엔드](../storage/) -- 스토리지 트레이트 구현
- [설정 레퍼런스](../configuration/) -- 환경 변수 레퍼런스
