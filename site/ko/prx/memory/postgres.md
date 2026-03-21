---
title: PostgreSQL 메모리 백엔드
description: 다중 사용자 서버 배포를 위한 PostgreSQL을 사용하는 원격 데이터베이스 메모리 스토리지입니다.
---

# PostgreSQL 메모리 백엔드

PostgreSQL 백엔드는 원격 PostgreSQL 데이터베이스에 메모리를 저장하여 여러 사용자와 에이전트 인스턴스 간 공유 메모리를 가능하게 합니다. 서버 배포에 권장되는 백엔드입니다.

## 개요

PostgreSQL 백엔드는 다음을 제공합니다:

- 여러 PRX 인스턴스 간 공유 메모리
- `tsvector`와 `pg_trgm`을 통한 전체 텍스트 검색
- 멀티 테넌트 격리를 위한 행 수준 보안
- 대규모 배포를 위한 수평 확장성

## 설정

```toml
[memory]
backend = "postgres"

[memory.postgres]
url = "postgresql://prx:password@localhost:5432/prx_memory"
max_connections = 5
schema = "memory"
```

## 다중 사용자 격리

여러 사용자가 PostgreSQL 메모리 백엔드를 공유하는 경우 각 사용자의 메모리는 사용자 ID로 격리됩니다. 백엔드는 SQL 인젝션을 방지하기 위해 모든 작업에 파라미터화된 쿼리를 사용합니다.

## 마이그레이션

PostgreSQL 백엔드에는 시작 시 실행되는 자동 스키마 마이그레이션이 포함됩니다. 수동 마이그레이션 단계가 필요하지 않습니다.

## 관련 페이지

- [메모리 시스템 개요](./)
- [SQLite 백엔드](./sqlite) -- 로컬 배포용
- [메모리 정리](./hygiene)
