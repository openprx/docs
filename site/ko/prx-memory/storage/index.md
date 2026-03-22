---
title: 스토리지 백엔드
description: "PRX-Memory 스토리지 백엔드 개요. JSON 파일 기반 스토리지, 벡터 확장이 있는 SQLite, 선택적 LanceDB 포함."
---

# 스토리지 백엔드

PRX-Memory는 메모리와 벡터 임베딩을 영속화하기 위한 여러 스토리지 백엔드를 지원합니다. `prx-memory-storage` 크레이트는 모든 백엔드가 구현하는 통합 인터페이스를 제공합니다.

## 사용 가능한 백엔드

| 백엔드 | 설정 값 | 벡터 지원 | 영속성 | 적합한 용도 |
|--------|--------|----------|-------|-----------|
| JSON | `json` | 항목에 임베딩 | 파일 기반 | 개발, 소규모 데이터셋 |
| SQLite | `sqlite` | 내장 벡터 컬럼 | 파일 기반 | 프로덕션, 중규모 데이터셋 |
| LanceDB | `lancedb` | 네이티브 벡터 인덱스 | 디렉토리 기반 | 대규모 데이터셋, 빠른 ANN 검색 |

::: tip 기본 백엔드
기본 백엔드는 JSON(`PRX_MEMORY_BACKEND=json`)으로 추가 설정이 필요 없습니다. 프로덕션 배포에는 SQLite를 권장합니다.
:::

## JSON 백엔드

가장 단순한 백엔드로 모든 메모리를 단일 JSON 파일에 저장합니다. 개발, 테스트, 소규모 메모리 세트(10,000개 항목 미만)에 이상적입니다.

```bash
PRX_MEMORY_BACKEND=json
PRX_MEMORY_DB=./data/memory-db.json
```

**장점:**
- 제로 설정 -- 파일 경로만 지정.
- 사람이 읽을 수 있음 -- 모든 텍스트 편집기로 검사 및 편집 가능.
- 이식성 -- 파일을 복사하여 전체 메모리 데이터베이스를 이동.

**한계:**
- 시작 시 전체 파일이 메모리에 로드됨.
- 쓰기 작업이 전체 파일을 다시 씀.
- 인덱스 벡터 검색 없음 -- 유사도를 위한 브루트 포스 스캔.

## SQLite 백엔드

SQLite는 ACID 트랜잭션, 인덱스 쿼리, 효율적인 유사도 검색을 위한 내장 벡터 컬럼 지원을 제공합니다.

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

상세 설정은 [SQLite 스토리지](./sqlite)를 참조하세요.

## LanceDB 백엔드 (선택적)

LanceDB는 열 형식 스토리지가 있는 네이티브 근사 최근접 이웃(ANN) 벡터 검색을 제공합니다. `lancedb-backend` 기능 플래그로 활성화합니다:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

```bash
PRX_MEMORY_BACKEND=lancedb
PRX_MEMORY_DB=./data/lancedb
```

::: warning 기능 플래그 필요
LanceDB 지원은 기본 빌드에 포함되지 않습니다. 컴파일 시 `lancedb-backend` 기능 플래그를 활성화해야 합니다.
:::

## 백엔드 선택

| 시나리오 | 권장 백엔드 |
|---------|-----------|
| 로컬 개발 | JSON |
| 10만 항목 미만의 프로덕션 | SQLite |
| 10만 항목 초과의 프로덕션 | LanceDB |
| 사람이 읽을 수 있는 스토리지 필요 | JSON |
| ACID 트랜잭션 필요 | SQLite |
| 빠른 ANN 벡터 검색 필요 | LanceDB |

## 스토리지 작업

PRX-Memory는 스토리지 유지 관리를 위한 도구를 제공합니다:

| 도구 | 설명 |
|------|------|
| `memory_export` | 모든 메모리를 이식 가능한 형식으로 내보내기 |
| `memory_import` | 내보내기에서 메모리 가져오기 |
| `memory_migrate` | 스토리지 백엔드 간 마이그레이션 |
| `memory_compact` | 스토리지 최적화 및 공간 회수 |
| `memory_reembed` | 새 모델로 모든 메모리 재임베딩 |

## 다음 단계

- [SQLite 스토리지](./sqlite) -- SQLite 설정 및 튜닝
- [벡터 검색](./vector-search) -- 벡터 유사도 검색 작동 방식
- [설정 레퍼런스](../configuration/) -- 모든 환경 변수
