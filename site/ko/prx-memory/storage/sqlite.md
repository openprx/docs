---
title: SQLite 스토리지
description: "벡터 컬럼과 인덱스 쿼리가 있는 PRX-Memory SQLite 스토리지 백엔드 설정 및 튜닝."
---

# SQLite 스토리지

SQLite 백엔드는 ACID 트랜잭션, 인덱스 쿼리, 내장 벡터 컬럼 지원이 있는 강력한 파일 기반 스토리지 엔진을 제공합니다. 최대 100,000개 메모리를 처리하는 프로덕션 배포에 권장되는 백엔드입니다.

## 설정

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

데이터베이스 파일은 첫 번째 실행 시 자동으로 생성됩니다. 모든 테이블, 인덱스, 벡터 컬럼은 PRX-Memory가 초기화합니다.

## 스키마 개요

SQLite 백엔드는 메모리를 구조화된 스키마에 저장합니다:

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | TEXT | 고유 메모리 식별자 |
| `text` | TEXT | 메모리 내용 |
| `scope` | TEXT | 메모리 범위 (global, project 등) |
| `tags` | TEXT | 태그의 JSON 배열 |
| `importance` | REAL | 중요도 점수 (0.0--1.0) |
| `created_at` | TEXT | ISO 8601 타임스탬프 |
| `updated_at` | TEXT | ISO 8601 타임스탬프 |
| `embedding` | BLOB | 벡터 임베딩 (활성화된 경우) |
| `metadata` | TEXT | 추가 JSON 메타데이터 |

## 벡터 스토리지

임베딩이 활성화되면 벡터 데이터는 메모리 항목과 동일한 테이블의 BLOB 컬럼에 저장됩니다. 이 코로케이션으로 쿼리가 단순화되고 조인 오버헤드를 방지합니다.

벡터 유사도 검색은 저장된 벡터에 대한 브루트 포스 코사인 유사도 계산을 사용합니다. 100,000개 항목 미만의 데이터셋의 경우 1초 미만의 쿼리 시간을 제공합니다 (벤치마크 기준 p95 123ms 미만).

## 유지 관리

### 압축

시간이 지남에 따라 삭제 및 업데이트로 인해 조각난 공간이 생길 수 있습니다. `memory_compact`를 사용하여 공간을 회수합니다:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_compact",
    "arguments": {}
  }
}
```

### 백업

SQLite 데이터베이스 파일은 서버가 중지된 동안 단순히 파일을 복사하여 백업할 수 있습니다:

```bash
cp ./data/memory.db ./data/memory.db.backup
```

::: warning
서버가 실행 중일 때 데이터베이스 파일을 복사하지 마세요. SQLite는 WAL(Write-Ahead Logging)을 사용하며 쓰기 중 파일 복사는 손상된 백업을 생성할 수 있습니다. 먼저 서버를 중지하거나 안전한 내보내기를 위해 `memory_export` 도구를 사용하세요.
:::

### JSON에서 마이그레이션

JSON 백엔드에서 SQLite로 마이그레이션하려면:

1. `memory_export`를 사용하여 메모리를 내보냅니다.
2. 백엔드 설정을 SQLite로 변경합니다.
3. `memory_import`를 사용하여 내보낸 데이터를 가져옵니다.

또는 직접 마이그레이션을 위해 `memory_migrate` 도구를 사용합니다.

## 다음 단계

- [벡터 검색](./vector-search) -- 내부적으로 유사도 검색이 작동하는 방법
- [스토리지 개요](./index) -- 모든 백엔드 비교
- [설정 레퍼런스](../configuration/) -- 모든 환경 변수
