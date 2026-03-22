---
title: 설정 레퍼런스
description: "전송, 스토리지, 임베딩, 리랭킹, 거버넌스, 관찰 가능성을 포함한 모든 PRX-Memory 환경 변수의 완전한 레퍼런스."
---

# 설정 레퍼런스

PRX-Memory는 환경 변수를 통해 완전히 설정됩니다. 이 페이지는 카테고리별로 그룹화된 모든 변수를 문서화합니다.

## 전송

| 변수 | 값 | 기본값 | 설명 |
|------|-----|--------|------|
| `PRX_MEMORYD_TRANSPORT` | `stdio`, `http` | `stdio` | 서버 전송 모드 |
| `PRX_MEMORY_HTTP_ADDR` | `host:port` | `127.0.0.1:8787` | HTTP 서버 바인드 주소 |

## 스토리지

| 변수 | 값 | 기본값 | 설명 |
|------|-----|--------|------|
| `PRX_MEMORY_BACKEND` | `json`, `sqlite`, `lancedb` | `json` | 스토리지 백엔드 |
| `PRX_MEMORY_DB` | 파일/디렉토리 경로 | -- | 데이터베이스 파일 또는 디렉토리 경로 |

## 임베딩

| 변수 | 값 | 기본값 | 설명 |
|------|-----|--------|------|
| `PRX_EMBED_PROVIDER` | `openai-compatible`, `jina`, `gemini` | -- | 임베딩 프로바이더 |
| `PRX_EMBED_API_KEY` | API 키 문자열 | -- | 임베딩 프로바이더 API 키 |
| `PRX_EMBED_MODEL` | 모델 이름 | 프로바이더별 | 임베딩 모델 이름 |
| `PRX_EMBED_BASE_URL` | URL | 프로바이더별 | 커스텀 API 엔드포인트 URL |

### 프로바이더 폴백 키

`PRX_EMBED_API_KEY`가 설정되지 않으면 시스템은 다음 프로바이더별 키를 확인합니다:

| 프로바이더 | 폴백 키 |
|-----------|--------|
| `jina` | `JINA_API_KEY` |
| `gemini` | `GEMINI_API_KEY` |

## 리랭킹

| 변수 | 값 | 기본값 | 설명 |
|------|-----|--------|------|
| `PRX_RERANK_PROVIDER` | `jina`, `cohere`, `pinecone`, `pinecone-compatible`, `none` | `none` | 리랭크 프로바이더 |
| `PRX_RERANK_API_KEY` | API 키 문자열 | -- | 리랭크 프로바이더 API 키 |
| `PRX_RERANK_MODEL` | 모델 이름 | 프로바이더별 | 리랭크 모델 이름 |
| `PRX_RERANK_ENDPOINT` | URL | 프로바이더별 | 커스텀 리랭크 엔드포인트 |
| `PRX_RERANK_API_VERSION` | 버전 문자열 | -- | API 버전 (pinecone-compatible만) |

### 프로바이더 폴백 키

`PRX_RERANK_API_KEY`가 설정되지 않으면 시스템은 다음 프로바이더별 키를 확인합니다:

| 프로바이더 | 폴백 키 |
|-----------|--------|
| `jina` | `JINA_API_KEY` |
| `cohere` | `COHERE_API_KEY` |
| `pinecone` | `PINECONE_API_KEY` |

## 표준화

| 변수 | 값 | 기본값 | 설명 |
|------|-----|--------|------|
| `PRX_MEMORY_STANDARD_PROFILE` | `zero-config`, `governed` | `zero-config` | 표준화 프로파일 |
| `PRX_MEMORY_DEFAULT_PROJECT_TAG` | 태그 문자열 | `prx-memory` | 기본 프로젝트 태그 |
| `PRX_MEMORY_DEFAULT_TOOL_TAG` | 태그 문자열 | `mcp` | 기본 도구 태그 |
| `PRX_MEMORY_DEFAULT_DOMAIN_TAG` | 태그 문자열 | `general` | 기본 도메인 태그 |

## 스트리밍 세션

| 변수 | 값 | 기본값 | 설명 |
|------|-----|--------|------|
| `PRX_MEMORY_STREAM_SESSION_TTL_MS` | 밀리초 | `300000` | 스트림 세션 유효 시간 |

## 관찰 가능성

### 카디널리티 제어

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PRX_METRICS_MAX_RECALL_SCOPE_LABELS` | `32` | 메트릭에서 최대 고유 범위 레이블 수 |
| `PRX_METRICS_MAX_RECALL_CATEGORY_LABELS` | `32` | 메트릭에서 최대 고유 카테고리 레이블 수 |
| `PRX_METRICS_MAX_RERANK_PROVIDER_LABELS` | `16` | 최대 고유 리랭크 프로바이더 레이블 수 |

### 알림 임계값

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PRX_ALERT_TOOL_ERROR_RATIO_WARN` | `0.05` | 도구 오류 비율 경고 임계값 |
| `PRX_ALERT_TOOL_ERROR_RATIO_CRIT` | `0.20` | 도구 오류 비율 위험 임계값 |
| `PRX_ALERT_REMOTE_WARNING_RATIO_WARN` | `0.25` | 원격 경고 비율 경고 임계값 |
| `PRX_ALERT_REMOTE_WARNING_RATIO_CRIT` | `0.60` | 원격 경고 비율 위험 임계값 |

## 예제: 최소 설정

```bash
PRX_MEMORYD_TRANSPORT=stdio
PRX_MEMORY_DB=./data/memory-db.json
```

## 예제: 전체 프로덕션 설정

```bash
# Transport
PRX_MEMORYD_TRANSPORT=http
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787

# Storage
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db

# Embedding
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# Reranking
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5

# Governance
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend

# Sessions
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000

# Observability
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.03
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.15
```

## 다음 단계

- [설치](../getting-started/installation) -- PRX-Memory 빌드 및 설치
- [MCP 통합](../mcp/) -- MCP 클라이언트 설정
- [문제 해결](../troubleshooting/) -- 일반적인 설정 문제
