---
title: 벡터 검색 및 텍스트 처리
description: PRX 메모리의 임베딩 기반 벡터 검색, 텍스트 청킹 전략, 토픽 추출, 콘텐츠 필터링입니다.
---

# 벡터 검색 및 텍스트 처리

PRX에는 시맨틱 메모리 검색을 지원하는 텍스트 처리 파이프라인이 포함되어 있습니다. 이 파이프라인은 텍스트 청킹, 벡터 임베딩, 토픽 추출, 콘텐츠 필터링을 처리하여 원시 대화 텍스트를 검색 가능하고 정리된 메모리 항목으로 변환합니다.

## 아키텍처

텍스트 처리 파이프라인은 각각 독립적으로 설정할 수 있는 네 단계로 구성됩니다:

```
Raw Text
  │
  ▼
┌──────────┐    ┌───────────┐    ┌───────────┐    ┌──────────┐
│ Chunker  │───►│ Embedder  │───►│  Topic    │───►│ Filter   │
│          │    │           │    │ Extractor │    │          │
└──────────┘    └───────────┘    └───────────┘    └──────────┘
  텍스트를        각 청크를         토픽별로          저장할 가치가
  청크로 분할     벡터화           분류              있는지 결정
```

## 벡터 검색

벡터 검색은 시맨틱 유사도 검색을 가능하게 합니다 -- 정확한 단어가 다르더라도 쿼리와 개념적으로 관련된 메모리를 찾습니다.

### 작동 방식

1. **인덱싱** -- 각 메모리 청크가 밀집 벡터로 임베딩됩니다 (예: 768 차원)
2. **저장** -- 벡터가 벡터 인덱스에 저장됩니다 (sqlite-vec, pgvector 또는 인메모리)
3. **쿼리** -- 검색 쿼리가 동일한 모델로 임베딩됩니다
4. **검색** -- 인덱스가 코사인 유사도로 Top-K 벡터를 반환합니다
5. **재순위** -- 선택적으로 크로스 인코더를 사용하여 더 높은 정밀도로 결과를 재순위합니다

### 설정

```toml
[memory.vector]
enabled = true
index_type = "sqlite-vec"       # "sqlite-vec", "pgvector" 또는 "memory"
similarity_metric = "cosine"    # "cosine", "dot_product" 또는 "euclidean"
top_k = 10
similarity_threshold = 0.5
rerank = false
rerank_model = "cross-encoder/ms-marco-MiniLM-L-6-v2"
```

### 인덱스 유형

| 인덱스 유형 | 스토리지 | 지속성 | 최적 용도 |
|------------|---------|--------|----------|
| `sqlite-vec` | 로컬 파일 | 예 | 단일 사용자, 로컬 배포 |
| `pgvector` | PostgreSQL | 예 | 다중 사용자, 프로덕션 배포 |
| `memory` | 인프로세스 | 아니요 (세션만) | 테스트 및 임시 세션 |

### 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `true` | 벡터 검색 활성화 또는 비활성화 |
| `index_type` | `String` | `"sqlite-vec"` | 벡터 인덱스 백엔드 |
| `similarity_metric` | `String` | `"cosine"` | 유사도 비교를 위한 거리 메트릭 |
| `top_k` | `usize` | `10` | 쿼리당 반환할 결과 수 |
| `similarity_threshold` | `f64` | `0.5` | 결과에 포함할 최소 유사도 점수 (0.0--1.0) |
| `rerank` | `bool` | `false` | 정밀도 향상을 위한 크로스 인코더 재순위 활성화 |
| `rerank_model` | `String` | `""` | 크로스 인코더 모델명 (`rerank = true`일 때만 사용) |
| `ef_search` | `usize` | `64` | HNSW 검색 파라미터 (높을수록 = 더 정확, 느림) |

## 텍스트 청킹

임베딩 전에 긴 텍스트를 더 작은 청크로 분할해야 합니다. PRX는 토큰 인식과 시맨틱 두 가지 청킹 전략을 제공합니다.

### 토큰 인식 청킹

토큰 인식 청킹은 각 청크가 임베딩 모델의 컨텍스트 윈도우 내에 맞도록 토큰 경계에서 텍스트를 분할합니다. 단어 중간에서 자르지 않도록 단어와 문장 경계를 준수합니다.

```toml
[memory.chunker]
strategy = "token"
max_tokens = 512
overlap_tokens = 64
tokenizer = "cl100k_base"     # OpenAI 호환 토크나이저
```

알고리즘:

1. 설정된 토크나이저를 사용하여 입력 텍스트를 토큰화합니다
2. 최대 `max_tokens` 토큰의 청크로 분할합니다
3. 각 청크는 경계에서 컨텍스트를 보존하기 위해 이전 청크와 `overlap_tokens`만큼 겹칩니다
4. 청크 경계는 가능하면 문장이나 문단 구분에 맞추어 조정됩니다

### 시맨틱 청킹

시맨틱 청킹은 임베딩 유사도를 사용하여 텍스트에서 자연스러운 토픽 경계를 찾습니다. 고정된 토큰 수로 분할하는 대신 토픽이 변경되는 지점을 감지합니다.

```toml
[memory.chunker]
strategy = "semantic"
max_tokens = 1024
min_tokens = 64
breakpoint_threshold = 0.3
```

알고리즘:

1. 텍스트를 문장으로 분할합니다
2. 각 문장의 임베딩을 계산합니다
3. 연속된 문장 간 코사인 유사도를 계산합니다
4. 유사도가 `breakpoint_threshold` 이하로 떨어지면 청크 경계를 삽입합니다
5. 작은 청크 (`min_tokens` 이하)를 인접 청크와 병합합니다

### 청킹 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `strategy` | `String` | `"token"` | 청킹 전략: `"token"` 또는 `"semantic"` |
| `max_tokens` | `usize` | `512` | 청크당 최대 토큰 |
| `overlap_tokens` | `usize` | `64` | 연속 청크 간 겹침 (토큰 전략만) |
| `tokenizer` | `String` | `"cl100k_base"` | 토큰 카운팅을 위한 토크나이저명 |
| `min_tokens` | `usize` | `64` | 청크당 최소 토큰 (시맨틱 전략만) |
| `breakpoint_threshold` | `f64` | `0.3` | 토픽 경계의 유사도 하락 임계값 (시맨틱 전략만) |

### 전략 선택

| 기준 | 토큰 인식 | 시맨틱 |
|------|----------|--------|
| 속도 | 빠름 (청킹 중 임베딩 호출 없음) | 느림 (문장별 임베딩 필요) |
| 품질 | 균일한 콘텐츠에 적합 | 다중 토픽 문서에 더 적합 |
| 예측 가능성 | 일관된 청크 크기 | 가변 청크 크기 |
| 사용 사례 | 채팅 로그, 짧은 메시지 | 긴 문서, 회의 노트 |

## 토픽 추출

PRX는 메모리 항목에서 자동으로 토픽을 추출하여 카테고리로 정리합니다. 토픽은 특정 도메인 내에서 필터링된 검색을 가능하게 하여 검색을 개선합니다.

### 작동 방식

1. 청킹 후 각 청크가 토픽 키워드와 시맨틱 콘텐츠에 대해 분석됩니다
2. 토픽 추출기가 설정 가능한 분류 체계에서 하나 이상의 토픽 레이블을 할당합니다
3. 토픽이 메모리 항목과 함께 메타데이터로 저장됩니다
4. 리콜 시 쿼리가 선택적으로 토픽별로 필터링하여 결과를 좁힐 수 있습니다

### 설정

```toml
[memory.topics]
enabled = true
max_topics_per_entry = 3
taxonomy = "auto"               # "auto", "fixed" 또는 "hybrid"
custom_topics = []              # taxonomy = "fixed" 또는 "hybrid"일 때만 사용
min_confidence = 0.6
```

### 분류 체계 모드

| 모드 | 설명 |
|------|------|
| `auto` | 콘텐츠에서 토픽이 동적으로 생성됩니다. 필요에 따라 새 토픽이 생성됩니다. |
| `fixed` | `custom_topics`의 토픽만 할당됩니다. 어떤 토픽과도 일치하지 않는 콘텐츠는 미분류로 남습니다. |
| `hybrid` | `custom_topics`를 선호하지만 콘텐츠가 기존 레이블과 일치하지 않으면 새 토픽을 생성합니다. |

### 토픽 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `true` | 토픽 추출 활성화 또는 비활성화 |
| `max_topics_per_entry` | `usize` | `3` | 메모리 항목당 최대 토픽 레이블 |
| `taxonomy` | `String` | `"auto"` | 분류 체계 모드: `"auto"`, `"fixed"` 또는 `"hybrid"` |
| `custom_topics` | `[String]` | `[]` | fixed/hybrid 분류 체계를 위한 사용자 정의 토픽 레이블 |
| `min_confidence` | `f64` | `0.6` | 토픽 할당을 위한 최소 신뢰도 점수 (0.0--1.0) |

## 콘텐츠 필터링

모든 메시지가 장기 메모리에 저장할 가치가 있는 것은 아닙니다. 콘텐츠 필터는 자동 저장 휴리스틱을 적용하여 어떤 콘텐츠를 유지하고 어떤 것을 버릴지 결정합니다.

### 자동 저장 휴리스틱

필터는 각 후보 메모리 항목을 여러 기준에 대해 평가합니다:

| 휴리스틱 | 설명 | 가중치 |
|----------|------|--------|
| **정보 밀도** | 고유 토큰 대 총 토큰 비율. 저밀도 텍스트 (예: "ok", "thanks")는 필터링됨 | 높음 |
| **참신성** | 기존 메모리와의 유사도. 이미 저장된 것과 너무 유사한 콘텐츠는 건너뜀 | 높음 |
| **관련성** | 사용자의 알려진 관심사 및 활성 토픽과의 시맨틱 유사도 | 중간 |
| **실행 가능성** | 행동 항목, 결정, 약속의 존재 (예: "I will...", "let's do...") | 중간 |
| **최신성 편향** | 최근 컨텍스트가 단기 관련성에 대해 더 높게 가중됨 | 낮음 |

가중 합으로 복합 점수가 계산됩니다. `autosave_threshold` 이하로 점수가 매겨진 항목은 유지되지 않습니다.

### 설정

```toml
[memory.filter]
enabled = true
autosave_threshold = 0.4
novelty_threshold = 0.85        # 기존 메모리와 85% 이상 유사하면 건너뜀
min_length = 20                 # 20자보다 짧은 항목 건너뜀
max_length = 10000              # 10,000자보다 긴 항목 자름
exclude_patterns = [
    "^(ok|thanks|got it|sure)$",
    "^\\s*$",
]
```

### 필터 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `true` | 콘텐츠 필터링 활성화 또는 비활성화 |
| `autosave_threshold` | `f64` | `0.4` | 메모리를 유지하기 위한 최소 복합 점수 (0.0--1.0) |
| `novelty_threshold` | `f64` | `0.85` | 중복 제거 전 기존 메모리와의 최대 유사도 |
| `min_length` | `usize` | `20` | 메모리 항목의 최소 문자 길이 |
| `max_length` | `usize` | `10000` | 최대 문자 길이 (더 긴 항목은 잘림) |
| `exclude_patterns` | `[String]` | `[]` | 절대 저장하지 않아야 할 콘텐츠의 정규식 패턴 |

## 전체 파이프라인 예제

네 단계를 모두 결합하는 완전한 설정:

```toml
[memory]
backend = "embeddings"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768

[memory.vector]
enabled = true
index_type = "sqlite-vec"
top_k = 10
similarity_threshold = 0.5

[memory.chunker]
strategy = "semantic"
max_tokens = 1024
min_tokens = 64
breakpoint_threshold = 0.3

[memory.topics]
enabled = true
taxonomy = "hybrid"
custom_topics = ["coding", "architecture", "debugging", "planning"]

[memory.filter]
enabled = true
autosave_threshold = 0.4
novelty_threshold = 0.85
```

## 관련 페이지

- [메모리 시스템 개요](./)
- [Embeddings 백엔드](./embeddings) -- 임베딩 프로바이더 설정
- [SQLite 백엔드](./sqlite) -- sqlite-vec 인덱스를 위한 로컬 스토리지
- [PostgreSQL 백엔드](./postgres) -- pgvector 인덱스를 위한 스토리지
- [메모리 정리](./hygiene) -- 압축 및 정리 전략
