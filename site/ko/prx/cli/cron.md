---
title: prx cron
description: PRX 데몬에서 실행되는 스케줄된 크론 작업을 관리합니다.
---

# prx cron

PRX 크론 스케줄러에서 실행되는 스케줄된 작업을 관리합니다. 크론 작업은 정의된 스케줄에 따라 LLM 프롬프트, 셸 명령 또는 도구 호출을 실행할 수 있습니다.

## 사용법

```bash
prx cron <SUBCOMMAND> [OPTIONS]
```

## 하위 명령어

### `prx cron list`

구성된 모든 크론 작업과 상태를 나열합니다.

```bash
prx cron list [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--json` | `-j` | `false` | JSON으로 출력 |
| `--verbose` | `-v` | `false` | 스케줄 표현식을 포함한 전체 작업 세부 정보 표시 |

**출력 예시:**

```
 ID   Name               Schedule       Status    Last Run           Next Run
 1    daily-summary      0 9 * * *      active    2026-03-20 09:00   2026-03-21 09:00
 2    backup-memory      0 */6 * * *    active    2026-03-21 06:00   2026-03-21 12:00
 3    weekly-report      0 10 * * 1     paused    2026-03-17 10:00   --
```

### `prx cron add`

새 크론 작업을 추가합니다.

```bash
prx cron add [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--name` | `-n` | 필수 | 작업 이름 |
| `--schedule` | `-s` | 필수 | 크론 표현식 (5 또는 6 필드) |
| `--prompt` | `-p` | | 실행할 LLM 프롬프트 |
| `--command` | `-c` | | 실행할 셸 명령 |
| `--channel` | | | 출력을 전송할 채널 |
| `--provider` | `-P` | 설정 기본값 | 프롬프트 작업용 LLM 프로바이더 |
| `--model` | `-m` | 프로바이더 기본값 | 프롬프트 작업용 모델 |
| `--enabled` | | `true` | 작업 즉시 활성화 |

`--prompt` 또는 `--command` 중 하나를 반드시 제공해야 합니다.

```bash
# 일일 요약 스케줄
prx cron add \
  --name "daily-summary" \
  --schedule "0 9 * * *" \
  --prompt "Summarize the most important news today" \
  --channel telegram-main

# 백업 명령 스케줄
prx cron add \
  --name "backup-memory" \
  --schedule "0 */6 * * *" \
  --command "prx memory export --format json > /backup/memory-$(date +%Y%m%d%H%M).json"

# 매주 월요일 오전 10시 보고서
prx cron add \
  --name "weekly-report" \
  --schedule "0 10 * * 1" \
  --prompt "Generate a weekly activity report from memory" \
  --channel slack-team
```

### `prx cron remove`

ID 또는 이름으로 크론 작업을 제거합니다.

```bash
prx cron remove <ID|NAME> [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--force` | `-f` | `false` | 확인 프롬프트 건너뛰기 |

```bash
prx cron remove daily-summary
prx cron remove 1 --force
```

### `prx cron pause`

크론 작업을 일시 중지합니다. 작업은 구성된 상태로 유지되지만 재개할 때까지 실행되지 않습니다.

```bash
prx cron pause <ID|NAME>
```

```bash
prx cron pause weekly-report
```

### `prx cron resume`

일시 중지된 크론 작업을 재개합니다.

```bash
prx cron resume <ID|NAME>
```

```bash
prx cron resume weekly-report
```

## 크론 표현식 형식

PRX는 표준 5필드 크론 표현식을 사용합니다:

```
 ┌───────── 분 (0-59)
 │ ┌───────── 시 (0-23)
 │ │ ┌───────── 일 (1-31)
 │ │ │ ┌───────── 월 (1-12)
 │ │ │ │ ┌───────── 요일 (0-7, 0과 7 = 일요일)
 │ │ │ │ │
 * * * * *
```

일반적인 예시:

| 표현식 | 설명 |
|--------|------|
| `0 9 * * *` | 매일 오전 9시 |
| `*/15 * * * *` | 매 15분마다 |
| `0 */6 * * *` | 매 6시간마다 |
| `0 10 * * 1` | 매주 월요일 오전 10시 |
| `0 0 1 * *` | 매월 1일 자정 |

## 관련 문서

- [스케줄링 개요](/ko/prx/cron/) -- 크론 아키텍처 및 하트비트
- [크론 작업](/ko/prx/cron/tasks) -- 작업 유형 및 실행 세부 사항
- [prx daemon](./daemon) -- 크론 스케줄러를 실행하는 데몬
