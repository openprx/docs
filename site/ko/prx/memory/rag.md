---
title: 검색 증강 생성 (RAG)
description: PRX가 임베딩과 메모리 검색을 사용하여 생성 전 LLM 프롬프트에 관련 컨텍스트를 주입하는 방법입니다.
---

# 검색 증강 생성 (RAG)

PRX는 에이전트의 메모리 및 지식 저장소에서 관련 컨텍스트로 LLM 응답을 향상시키기 위해 검색 증강 생성 (RAG)을 구현합니다. LLM의 파라메트릭 지식에만 의존하는 대신 RAG는 관련 문서를 검색하여 프롬프트에 주입합니다 -- 환각을 줄이고 응답을 사실적이고 최신의 정보에 기반시킵니다.

## 개요

RAG 파이프라인은 에이전트 루프의 모든 LLM 호출 전에 실행됩니다:

```
User Message
    │
    ▼
┌──────────────────────────┐
│  1. Query Formulation     │  사용자 메시지 + 대화 컨텍스트에서
│                           │  검색어 추출
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  2. Embedding Generation  │  설정된 임베딩 프로바이더를 사용하여
│                           │  쿼리를 벡터로 변환
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  3. Memory Search         │  메모리 백엔드를 통해 검색:
│                           │  벡터 유사도 + 전체 텍스트
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  4. Relevance Filtering   │  결과를 점수화하고 관련성
│                           │  임계값 이상으로 필터링
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  5. Context Injection     │  결과를 포맷하고 시스템 프롬프트 /
│                           │  컨텍스트 윈도우에 주입
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  6. LLM Generation        │  모델이 전체 컨텍스트를 사용하여
│                           │  응답 생성
└──────────────────────────┘
```

## 설정

`config.toml`에서 RAG를 활성화합니다:

```toml
[memory]
backend = "embeddings"  # RAG는 embeddings 백엔드가 필요합니다

[memory.embeddings]
# 임베딩 프로바이더: "openai" | "ollama" | "local"
provider = "openai"
model = "text-embedding-3-small"
dimensions = 1536

# 벡터 저장소 백엔드
vector_store = "sqlite"  # "sqlite" | "postgres" | "qdrant"

[rag]
enabled = true

# 컨텍스트에 주입할 최대 검색 청크 수.
max_results = 10

# 청크가 포함되기 위한 최소 관련성 점수 (0.0~1.0).
relevance_threshold = 0.3

# RAG 컨텍스트에 할당된 최대 총 토큰.
# 컨텍스트 윈도우 오버플로를 방지합니다.
max_context_tokens = 4000

# max_context_tokens를 초과할 때 포함할 청크를
# 선택하는 전략.
# "top_k" -- 가장 높은 관련성 점수 우선
# "mmr" -- 최대 마진 관련성 (다양성 + 관련성)
selection_strategy = "top_k"
```

### 임베딩 프로바이더

PRX는 여러 임베딩 프로바이더를 지원합니다:

| 프로바이더 | 모델 | 차원 | 참고 |
|-----------|------|------|------|
| OpenAI | text-embedding-3-small | 1536 | 최고의 품질/비용 비율 |
| OpenAI | text-embedding-3-large | 3072 | 최고 품질 |
| Ollama | nomic-embed-text | 768 | 로컬, API 비용 없음 |
| Ollama | mxbai-embed-large | 1024 | 로컬, 더 높은 품질 |
| Local | fastembed | 384 | 번들됨, 네트워크 불필요 |

임베딩 프로바이더 설정:

```toml
# OpenAI 임베딩
[memory.embeddings]
provider = "openai"
model = "text-embedding-3-small"
api_key = "${OPENAI_API_KEY}"

# Ollama 임베딩 (로컬)
[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
endpoint = "http://localhost:11434"

# 내장 로컬 임베딩 (외부 서비스 불필요)
[memory.embeddings]
provider = "local"
model = "fastembed"
```

## 청킹 전략

문서가 임베딩되고 검색되기 전에 더 작은 청크로 분할되어야 합니다. PRX는 여러 청킹 전략을 지원합니다:

| 전략 | 설명 | 최적 용도 |
|------|------|----------|
| `fixed_size` | 겹침이 있는 고정 토큰 수로 분할 | 균일한 문서 |
| `sentence` | 문장 경계에서 분할 | 산문 및 자연 텍스트 |
| `paragraph` | 문단 경계에서 분할 | 구조화된 문서 |
| `semantic` | 임베딩을 사용하여 토픽 경계에서 분할 | 길고 다양한 문서 |
| `recursive` | 계층적 분할 (제목 > 문단 > 문장) | Markdown/코드 |

```toml
[rag.chunking]
strategy = "recursive"

# 토큰 단위의 대상 청크 크기.
chunk_size = 512

# 인접 청크 간 겹침 (경계에서 컨텍스트 손실 방지).
chunk_overlap = 64

# recursive 전략: 우선순위 순서의 구분자.
separators = ["\n## ", "\n### ", "\n\n", "\n", ". "]
```

## 검색 파이프라인

### 단계 1-3: 쿼리, 임베딩, 검색

RAG 모듈은 사용자의 최신 메시지에서 검색 쿼리를 추출하고 (`query_reformulation = true`로 선택적으로 LLM을 통해 재구성), 임베딩 프로바이더를 사용하여 벡터로 변환하고, 모든 메모리 백엔드를 동시에 검색합니다 -- 벡터 유사도 (코사인)와 전체 텍스트 검색 (FTS5/pg_trgm). 결과가 병합되고 중복이 제거됩니다.

### 단계 4: 관련성 필터링

각 결과는 0.0과 1.0 사이의 관련성 점수를 받습니다. `relevance_threshold` 이하의 결과는 폐기됩니다. 점수는 다음을 고려합니다:

- 벡터 코사인 유사도 (주요 신호)
- 전체 텍스트 매치 점수 (부스트 요인)
- 최신성 (최신 메모리가 약간의 부스트를 받음)
- 소스 우선순위 (핵심 메모리가 대화보다 높게 순위)

### 단계 5: 컨텍스트 주입

필터링된 결과가 구조화된 XML 태그 (`<context><memory source="..." relevance="...">`)로 포맷되어 LLM 프롬프트에 주입됩니다. 주입된 총 컨텍스트는 컨텍스트 윈도우 오버플로를 방지하기 위해 `max_context_tokens`로 제한됩니다.

## 선택 전략

### Top-K

기본 전략입니다. `max_context_tokens` 내에 맞는 가장 높은 점수의 K개 청크를 선택합니다. 단순하고 예측 가능하지만 여러 청크가 같은 토픽을 다룰 때 중복된 결과를 반환할 수 있습니다.

### 최대 마진 관련성 (MMR)

MMR은 관련성과 다양성의 균형을 맞춥니다. 쿼리와 관련이 있으면서 이미 선택된 청크와 다른 청크를 반복적으로 선택합니다:

```toml
[rag]
selection_strategy = "mmr"

# Lambda는 관련성-다양성 트레이드오프를 제어합니다.
# 1.0 = 순수 관련성 (top_k와 동일)
# 0.0 = 순수 다양성
mmr_lambda = 0.7
```

MMR은 지식 베이스에 겹치거나 중복되는 정보가 포함된 경우 권장됩니다.

## 문서 인덱싱

### 자동 인덱싱

`memory_store` 도구를 통해 저장된 메모리는 자동으로 임베딩되고 인덱싱됩니다. 추가 설정이 필요하지 않습니다.

### 수동 문서 수집

대량 문서 수집의 경우 CLI를 사용합니다:

```bash
# 단일 파일 또는 디렉터리 인덱싱
prx rag index /path/to/document.md
prx rag index /path/to/docs/ --recursive

# 모든 문서 재인덱싱 (임베딩 재구성)
prx rag reindex
```

지원 형식: Markdown (`.md`), 일반 텍스트 (`.txt`), PDF (`.pdf`), HTML (`.html`), 소스 코드 (`.rs`, `.py`, `.js`).

## 성능 튜닝

| 파라미터 | 권장 |
|----------|------|
| `chunk_size` | Q&A의 경우 256-512 토큰, 요약의 경우 512-1024 |
| `chunk_overlap` | chunk_size의 10-20% |
| `max_results` | 대부분의 사용 사례에서 5-15 |
| `relevance_threshold` | 0.3-0.5 (품질에 따라 조정) |

## 보안 참고

- RAG 컨텍스트가 LLM 프롬프트에 주입됩니다. 에이전트가 접근할 권한이 없는 한 저장된 문서에 민감한 데이터가 포함되지 않도록 하세요.
- `memory.acl_enabled = true`일 때 RAG는 접근 제어 목록을 준수합니다. 현재 주체가 접근할 수 있는 메모리만 검색됩니다.
- 임베딩 API 호출은 문서 내용을 임베딩 프로바이더에 전송합니다. 민감한 데이터의 경우 로컬 임베딩 프로바이더 (`ollama` 또는 `local`)를 사용하세요.

## 관련 페이지

- [메모리 시스템](/ko/prx/memory/)
- [Embeddings](/ko/prx/memory/embeddings)
- [벡터 검색](/ko/prx/memory/vector-search)
- [SQLite 백엔드](/ko/prx/memory/sqlite)
- [PostgreSQL 백엔드](/ko/prx/memory/postgres)
