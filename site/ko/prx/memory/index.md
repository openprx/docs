---
title: 메모리 시스템
description: 영구 에이전트 컨텍스트를 위한 5개 스토리지 백엔드를 갖춘 PRX 메모리 시스템의 개요입니다.
---

# 메모리 시스템

PRX는 에이전트가 대화 간에 컨텍스트를 유지하고 리콜할 수 있게 하는 유연한 메모리 시스템을 제공합니다. 메모리 시스템은 다양한 배포 시나리오에 최적화된 5개의 스토리지 백엔드를 지원합니다.

## 개요

메모리 시스템은 세 가지 주요 기능을 수행합니다:

- **리콜** -- 각 LLM 호출 전에 관련 과거 상호 작용과 팩트를 검색합니다
- **저장** -- 대화에서 추출한 중요한 정보를 유지합니다
- **압축** -- 컨텍스트 제한에 맞추기 위해 오래된 메모리를 요약하고 압축합니다

## 스토리지 백엔드

| 백엔드 | 지속성 | 검색 | 최적 용도 |
|--------|--------|------|----------|
| [Markdown](./markdown) | 파일 기반 | 전체 텍스트 grep | 단일 사용자 CLI, 버전 관리 메모리 |
| [SQLite](./sqlite) | 로컬 데이터베이스 | FTS5 전체 텍스트 | 로컬 배포, 소규모 팀 |
| [PostgreSQL](./postgres) | 원격 데이터베이스 | pg_trgm + FTS | 다중 사용자 서버 배포 |
| [Embeddings](./embeddings) | 벡터 저장소 | 시맨틱 유사도 | RAG 스타일 검색, 대규모 지식 베이스 |
| In-memory | 없음 (세션만) | 선형 스캔 | 임시 세션, 테스트 |

## 설정

`config.toml`에서 메모리 백엔드를 선택하고 설정합니다:

```toml
[memory]
backend = "sqlite"  # "markdown" | "sqlite" | "postgres" | "embeddings" | "memory"
max_recall_items = 20
recall_relevance_threshold = 0.3

[memory.sqlite]
path = "~/.local/share/openprx/memory.db"

[memory.postgres]
url = "postgresql://user:pass@localhost/prx"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768
```

## 메모리 생명주기

1. **추출** -- 각 대화 턴 후 시스템이 핵심 팩트를 추출합니다
2. **중복 제거** -- 새 팩트를 기존 메모리와 비교합니다
3. **저장** -- 고유한 팩트를 설정된 백엔드에 유지합니다
4. **리콜** -- 각 LLM 호출 전에 관련 메모리를 검색합니다
5. **정리** -- 주기적 유지보수가 오래된 항목을 압축하고 정리합니다

## 관련 페이지

- [Markdown 백엔드](./markdown)
- [SQLite 백엔드](./sqlite)
- [PostgreSQL 백엔드](./postgres)
- [Embeddings 백엔드](./embeddings)
- [메모리 정리](./hygiene)
