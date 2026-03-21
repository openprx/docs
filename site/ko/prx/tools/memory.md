---
title: 메모리 도구
description: 카테고리 지원과 ACL 강제를 갖춘 에이전트의 영구 장기 메모리를 저장, 검색, 관리하기 위한 5개 도구입니다.
---

# 메모리 도구

PRX는 에이전트에 대화 간 지식 영속성, 관련 컨텍스트 회상, 장기 메모리 저장소 관리 기능을 제공하는 5개의 메모리 도구를 제공합니다. 이 도구들은 일시적인 LLM 컨텍스트 윈도우와 영구 에이전트 지식 사이의 간격을 연결합니다.

메모리 시스템은 세 가지 내장 카테고리 -- `core` (영구 사실), `daily` (세션 범위 노트), `conversation` (대화 컨텍스트) -- 와 사용자 정의 카테고리를 지원합니다. 각 도구는 ACL 인식: 메모리 접근 제어가 활성화되면 주체별 접근 규칙에 따라 작업이 제한됩니다.

메모리 도구는 `all_tools()` 레지스트리에 등록되며 에이전트가 전체 도구 세트로 실행될 때 항상 사용할 수 있습니다. 5개의 메모리 저장 백엔드(Markdown, SQLite, PostgreSQL, Embeddings, 인메모리) 중 어느 것과도 작동합니다.

## 설정

메모리 도구는 `[memory]` 섹션을 통해 설정됩니다:

```toml
[memory]
backend = "sqlite"              # "markdown" | "sqlite" | "postgres" | "embeddings" | "memory"
auto_save = true                # 대화 입력을 메모리에 자동 저장
acl_enabled = false             # 접근 제어 목록 활성화
max_recall_items = 20           # recall/search에서 반환하는 최대 항목 수
recall_relevance_threshold = 0.3  # recall을 위한 최소 관련성 점수

# 선택적: 임베딩 기반 시맨틱 검색
embedding_provider = "openai"
embedding_model = "text-embedding-3-small"
embedding_dimensions = 1536
vector_weight = 0.7             # 하이브리드 검색에서 벡터 유사도 가중치
keyword_weight = 0.3            # BM25 키워드 검색 가중치
min_relevance_score = 0.4       # 결과에 포함할 최소 점수

# 메모리 정리 (자동 클린업)
hygiene_enabled = true
archive_after_days = 7
purge_after_days = 30
conversation_retention_days = 3
daily_retention_days = 7
```

## 도구 참조

### memory_store

사실, 선호도, 노트 또는 지식을 장기 메모리에 저장합니다.

```json
{
  "name": "memory_store",
  "arguments": {
    "key": "user_timezone",
    "value": "The user is located in UTC+8 (Asia/Shanghai)",
    "category": "core"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `key` | `string` | 예 | -- | 이 메모리 항목의 고유 식별자 |
| `value` | `string` | 예 | -- | 저장할 내용 |
| `category` | `string` | 아니오 | `"core"` | 카테고리: `"core"`, `"daily"`, `"conversation"`, 또는 사용자 정의 |

**카테고리:**

| 카테고리 | 보존 기간 | 용도 |
|----------|-----------|------|
| `core` | 영구 (명시적으로 잊기 전까지) | 기본 사실, 사용자 선호도, 시스템 설정 |
| `daily` | 세션 범위, `archive_after_days` 후 아카이브 | 오늘의 작업, 컨텍스트, 세션 노트 |
| `conversation` | 단기, `conversation_retention_days` 후 정리 | 현재 대화 컨텍스트, 참조 |
| 사용자 정의 | `daily` 보존 규칙 따름 | 도메인별 지식을 위한 사용자 정의 카테고리 |

### memory_forget

키로 장기 메모리에서 특정 항목을 제거합니다.

```json
{
  "name": "memory_forget",
  "arguments": {
    "key": "user_timezone"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `key` | `string` | 예 | -- | 제거할 메모리 항목의 키 |

### memory_get

정확한 키로 특정 메모리 항목을 검색합니다. 활성화 시 ACL 인식.

```json
{
  "name": "memory_get",
  "arguments": {
    "key": "user_timezone"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `key` | `string` | 예 | -- | 조회할 정확한 키 |

키가 존재하면 저장된 값을 반환하고, 키가 존재하지 않거나 ACL에 의해 접근이 거부되면 오류를 반환합니다.

### memory_recall

키워드 또는 시맨틱 유사도로 메모리를 회상합니다. 쿼리와 매칭되는 가장 관련성 높은 항목을 반환합니다. 이 도구는 `memory.acl_enabled = true`일 때 **완전히 비활성화됩니다** -- 도구 레지스트리에서 제거됩니다.

```json
{
  "name": "memory_recall",
  "arguments": {
    "query": "user preferences about coding style"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `query` | `string` | 예 | -- | 검색 쿼리 (키워드 또는 자연어) |
| `max_results` | `integer` | 아니오 | `20` | 반환할 최대 항목 수 |

### memory_search

모든 메모리 항목에 대한 전문 및 벡터 검색. `memory_recall`과 달리 이 도구는 ACL이 활성화될 때도 사용 가능하지만 결과에 주체별 접근 제한을 강제합니다.

```json
{
  "name": "memory_search",
  "arguments": {
    "query": "project deadlines",
    "category": "daily",
    "max_results": 10
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `query` | `string` | 예 | -- | 검색 쿼리 |
| `category` | `string` | 아니오 | -- | 특정 카테고리로 결과 필터링 |
| `max_results` | `integer` | 아니오 | `20` | 반환할 최대 항목 수 |

임베딩 검색이 설정되면 `memory_search`는 다음을 결합하는 하이브리드 검색을 수행합니다:

- **벡터 유사도** (`vector_weight`로 가중) -- 임베딩을 통한 시맨틱 매칭
- **BM25 키워드 검색** (`keyword_weight`로 가중) -- 전통적 전문 매칭

`min_relevance_score` 미만의 결과는 필터링됩니다.

## 사용법

### 일반적인 메모리 워크플로우

대화 중 에이전트는 자연스러운 주기로 메모리 도구를 사용합니다:

1. **시작 시 회상**: 응답 전에 시스템이 관련 메모리를 회상하여 컨텍스트를 주입
2. **대화 중 저장**: 사용자가 중요한 정보를 공유하면 에이전트가 저장
3. **필요 시 검색**: 에이전트가 특정 과거 지식이 필요하면 메모리 검색
4. **요청 시 잊기**: 사용자가 정보 제거를 요청하면 에이전트가 잊기

### CLI 상호작용

명령줄에서 메모리 상태를 검사할 수 있습니다:

```bash
# 메모리 통계 보기
prx memory stats

# 카테고리의 모든 메모리 항목 나열
prx memory list --category core

# CLI에서 메모리 검색
prx memory search "project deadlines"

# 메모리를 파일로 내보내기
prx memory export --format json > memories.json
```

### 에이전트 사용 예시

다중 턴 대화에서:

```
사용자: 모든 코드에서 4칸 들여쓰기를 선호합니다.
에이전트: [memory_store를 key="code_style_indent", value="사용자가 4칸 들여쓰기를 선호함", category="core"로 호출]
       알겠습니다, 4칸 들여쓰기를 선호하신다는 것을 기억하겠습니다.

사용자: 내 코딩 선호도가 뭐였지?
에이전트: [memory_search를 query="coding preferences"로 호출]
       기억하기로는, 모든 코드에서 4칸 들여쓰기를 선호하십니다.
```

## 보안

### ACL 강제

`memory.acl_enabled = true`일 때 메모리 시스템은 접근 제어를 강제합니다:

| 도구 | ACL 동작 |
|------|----------|
| `memory_store` | 현재 주체의 소유권으로 항목 저장 |
| `memory_forget` | 현재 주체가 소유한 항목만 잊기 허용 |
| `memory_get` | 현재 주체가 접근 가능한 항목만 반환 |
| `memory_recall` | **완전히 비활성화** (도구 레지스트리에서 제거) |
| `memory_search` | 현재 주체가 접근 가능한 항목만 반환 |

`memory_recall` 도구는 ACL에서 비활성화됩니다. 광범위한 키워드 매칭이 주체 경계를 넘어 정보를 유출할 수 있기 때문입니다. 더 타겟된 `memory_get`과 `memory_search` 도구는 항목별 접근 검사를 강제합니다.

### file_read 상호작용

ACL이 활성화되면 `file_read` 도구도 메모리 저장소 파일(메모리 디렉토리의 마크다운 파일) 접근을 차단합니다. 이는 에이전트가 디스크에서 원시 메모리 파일을 읽어 ACL을 우회하는 것을 방지합니다.

### 민감한 데이터 처리

메모리 항목은 민감한 사용자 정보를 포함할 수 있습니다. 다음 관행을 고려하세요:

- `core` 카테고리는 진정으로 영구적인 지식에만 절약적으로 사용
- `hygiene_enabled`를 활성화하여 오래된 항목을 자동으로 정리
- 다중 사용자 배포에서 `acl_enabled` 활성화
- `prx memory list`를 통해 정기적으로 메모리 내용 검토
- 더 이상 필요하지 않을 때 `memory_forget`을 사용하여 민감한 항목 제거

### 감사 추적

`security.audit.enabled = true`일 때 모든 메모리 작업이 감사 로그에 기록됩니다. 도구 이름, 키, 카테고리, 성공/실패 상태를 포함합니다.

## 관련 페이지

- [메모리 시스템](/ko/prx/memory/) -- 아키텍처 및 저장 백엔드
- [Markdown 백엔드](/ko/prx/memory/markdown) -- 파일 기반 메모리 저장
- [SQLite 백엔드](/ko/prx/memory/sqlite) -- 로컬 데이터베이스 저장
- [PostgreSQL 백엔드](/ko/prx/memory/postgres) -- 원격 데이터베이스 저장
- [임베딩](/ko/prx/memory/embeddings) -- 벡터 검색 설정
- [메모리 정리](/ko/prx/memory/hygiene) -- 자동 클린업 및 아카이브
- [파일 작업](/ko/prx/tools/file-operations) -- file_read와의 ACL 상호작용
- [도구 개요](/ko/prx/tools/) -- 모든 도구 및 레지스트리 시스템
