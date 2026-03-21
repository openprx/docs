---
title: Cron 시스템
description: 예약 작업 실행 및 하트비트 모니터링을 위한 PRX cron 시스템의 개요입니다.
---

# Cron 시스템

PRX cron 시스템은 데몬의 예약 작업 실행을 제공합니다. 반복 유지보수 작업, 하트비트 모니터링, 사용자 정의 예약 작업을 처리합니다.

## 개요

cron 시스템은 PRX 데몬의 일부로 실행되며 다음을 관리합니다:

- **하트비트** -- 주기적 상태 확인 및 상태 보고
- **유지보수 작업** -- 메모리 정리, 로그 순환, 캐시 정리
- **사용자 작업** -- 사용자 정의 예약 에이전트 액션

## 아키텍처

```
┌─────────────────────────┐
│     Cron Scheduler       │
│                          │
│  ┌────────────────────┐  │
│  │  Heartbeat (30s)   │  │
│  ├────────────────────┤  │
│  │  Memory Hygiene    │  │
│  ├────────────────────┤  │
│  │  Log Rotation      │  │
│  ├────────────────────┤  │
│  │  User Tasks        │  │
│  └────────────────────┘  │
└─────────────────────────┘
```

## 설정

```toml
[cron]
enabled = true
timezone = "UTC"

[[cron.tasks]]
name = "daily-report"
schedule = "0 9 * * *"  # cron 표현식
action = "agent"
prompt = "Generate a daily summary report"
```

## 관련 페이지

- [하트비트](./heartbeat)
- [내장 작업](./tasks)
