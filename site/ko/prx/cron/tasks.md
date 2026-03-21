---
title: 내장 작업
description: PRX cron 시스템의 내장 예약 작업 레퍼런스입니다.
---

# 내장 작업

PRX는 일상적인 유지보수를 처리하는 여러 내장 cron 작업을 포함합니다. 이 작업들은 cron 시스템이 활성화되면 자동으로 실행됩니다.

## 작업 레퍼런스

| 작업 | 기본 스케줄 | 설명 |
|------|-----------|------|
| `heartbeat` | 30초마다 | 시스템 상태 확인 |
| `memory-hygiene` | 매일 3:00 | 메모리 항목 압축 및 정리 |
| `log-rotation` | 매일 0:00 | 오래된 로그 파일 순환 및 압축 |
| `cache-cleanup` | 매시간 | 만료된 캐시 항목 제거 |
| `metrics-export` | 5분마다 | 설정된 백엔드로 메트릭 내보내기 |
| `signature-update` | 6시간마다 | 위협 시그니처 업데이트 (PRX-SD 통합이 활성화된 경우) |

## 설정

각 내장 작업은 개별적으로 활성화/비활성화하고 다시 예약할 수 있습니다:

```toml
[cron.builtin.memory_hygiene]
enabled = true
schedule = "0 3 * * *"

[cron.builtin.log_rotation]
enabled = true
schedule = "0 0 * * *"
max_log_age_days = 30

[cron.builtin.cache_cleanup]
enabled = true
schedule = "0 * * * *"
```

## 사용자 정의 작업

내장 작업 외에도 스케줄에 따라 프롬프트를 실행하는 사용자 정의 에이전트 작업을 정의할 수 있습니다:

```toml
[[cron.tasks]]
name = "weekly-cleanup"
schedule = "0 2 * * 0"  # 일요일 오전 2:00
action = "agent"
prompt = "Review and archive old conversation logs"
timeout_secs = 300
```

## 관련 페이지

- [Cron 시스템 개요](./)
- [하트비트](./heartbeat)
- [메모리 정리](/ko/prx/memory/hygiene)
