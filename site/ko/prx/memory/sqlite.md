---
title: SQLite 메모리 백엔드
description: FTS5 전체 텍스트 검색을 갖춘 SQLite를 사용하는 로컬 데이터베이스 메모리 스토리지입니다.
---

# SQLite 메모리 백엔드

SQLite 백엔드는 FTS5 전체 텍스트 검색 인덱싱을 갖춘 로컬 SQLite 데이터베이스에 메모리를 저장합니다. 모든 것을 로컬에 유지하면서 빠른 검색과 구조화된 스토리지를 제공합니다.

## 개요

SQLite는 PRX의 기본 메모리 백엔드입니다. 성능, 기능, 단순성 사이에서 좋은 균형을 제공합니다:

- FTS5 확장을 통한 전체 텍스트 검색
- 안정적인 쓰기를 위한 ACID 트랜잭션
- 무 설정 (단일 파일 데이터베이스)
- 수만 개의 메모리 항목에 대해 효율적

## 스키마

SQLite 백엔드는 다음 핵심 테이블을 사용합니다:

- `memories` -- 메타데이터와 함께 개별 메모리 항목을 저장합니다
- `memories_fts` -- 전체 텍스트 검색을 위한 FTS5 가상 테이블
- `topics` -- 메모리 조직을 위한 토픽 분류

## 설정

```toml
[memory]
backend = "sqlite"

[memory.sqlite]
path = "~/.local/share/openprx/memory.db"
journal_mode = "wal"
busy_timeout_ms = 5000
```

## 전체 텍스트 검색

FTS5 인덱스는 모든 메모리 항목에 대한 순위 전체 텍스트 검색을 가능하게 합니다. 쿼리는 다음을 지원합니다:

- 불리언 연산자 (AND, OR, NOT)
- 따옴표로 구문 매칭
- 별표로 접두사 매칭
- 열별 검색

## 관련 페이지

- [메모리 시스템 개요](./)
- [PostgreSQL 백엔드](./postgres) -- 다중 사용자 배포용
- [메모리 정리](./hygiene)
