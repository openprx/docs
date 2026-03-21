---
title: 크론 도구
description: 크론 표현식과 Xin 자율 작업 엔진을 사용하여 예약 작업을 생성, 관리, 실행하기 위한 9개 도구입니다.
---

# 크론 도구

PRX는 전통적인 크론 작업 관리와 고급 Xin 스케줄링 엔진을 포함하는 시간 기반 작업 자동화를 위한 9개 도구를 제공합니다. 이 도구들을 통해 에이전트는 예약 작업을 생성하고, 작업 이력을 검사하고, 수동 실행을 트리거하고, 반복 일정에 따라 백그라운드 작업을 조율할 수 있습니다.

크론 도구는 두 시스템으로 나뉩니다: 크론 표현식을 사용하는 표준 예약 작업을 위한 **크론 하위 시스템**과 의존성 체인, 조건부 실행, 자기 진화 파이프라인과의 통합을 갖춘 고급 작업 스케줄링을 위한 **Xin 엔진**입니다.

모든 크론 및 스케줄링 도구는 `all_tools()` 레지스트리에 등록되며 데몬이 실행 중일 때 사용할 수 있습니다.

## 설정

### 크론 시스템

```toml
[cron]
enabled = true
timezone = "UTC"           # 크론 표현식의 타임존

# 내장 예약 작업 정의
[[cron.tasks]]
name = "daily-report"
schedule = "0 9 * * *"     # 매일 09:00 UTC
action = "agent"
prompt = "Generate a daily summary report and send it to the user."

[[cron.tasks]]
name = "memory-cleanup"
schedule = "0 3 * * *"     # 매일 03:00 UTC
action = "agent"
prompt = "Run memory hygiene: archive old daily entries and compact core memories."

[[cron.tasks]]
name = "repo-check"
schedule = "*/30 * * * *"  # 30분마다
action = "shell"
command = "cd /home/user/project && git fetch --all"
```

### Xin 엔진

```toml
[xin]
enabled = true
interval_minutes = 5            # 틱 간격 (분, 최소 1)
max_concurrent = 4              # 틱당 최대 동시 작업 실행
max_tasks = 128                 # 스토어의 최대 총 작업 수
stale_timeout_minutes = 60      # 실행 중인 작업이 오래된 것으로 표시되기까지의 분
builtin_tasks = true            # 내장 시스템 작업 자동 등록
evolution_integration = false   # Xin이 진화/적합도 스케줄을 관리하도록 허용
```

## 도구 참조

### cron_add

크론 표현식, 명령어 또는 프롬프트, 선택적 설명으로 새 크론 작업을 추가합니다.

```json
{
  "name": "cron_add",
  "arguments": {
    "name": "backup-workspace",
    "schedule": "0 2 * * *",
    "action": "shell",
    "command": "tar czf /tmp/workspace-$(date +%Y%m%d).tar.gz /home/user/workspace",
    "description": "Daily workspace backup at 2 AM"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `name` | `string` | 예 | -- | 크론 작업의 고유 이름 |
| `schedule` | `string` | 예 | -- | 크론 표현식 (5필드: 분 시 일 월 요일) |
| `action` | `string` | 예 | -- | 액션 유형: `"shell"` (명령 실행) 또는 `"agent"` (에이전트 프롬프트 실행) |
| `command` | `string` | 조건부 | -- | 셸 명령 (`action = "shell"`일 때 필수) |
| `prompt` | `string` | 조건부 | -- | 에이전트 프롬프트 (`action = "agent"`일 때 필수) |
| `description` | `string` | 아니오 | -- | 사람이 읽을 수 있는 설명 |

### cron_list

일정, 상태, 다음 실행 시간과 함께 등록된 모든 크론 작업을 나열합니다.

```json
{
  "name": "cron_list",
  "arguments": {}
}
```

파라미터 필요 없음. 모든 크론 작업의 테이블을 반환합니다.

### cron_remove

이름 또는 ID로 크론 작업을 제거합니다.

```json
{
  "name": "cron_remove",
  "arguments": {
    "name": "backup-workspace"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `name` | `string` | 예 | -- | 제거할 크론 작업의 이름 또는 ID |

### cron_update

기존 크론 작업의 일정, 명령어 또는 설정을 업데이트합니다.

```json
{
  "name": "cron_update",
  "arguments": {
    "name": "backup-workspace",
    "schedule": "0 4 * * *",
    "description": "Daily workspace backup at 4 AM (shifted)"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `name` | `string` | 예 | -- | 업데이트할 크론 작업의 이름 |
| `schedule` | `string` | 아니오 | -- | 새 크론 표현식 |
| `command` | `string` | 아니오 | -- | 새 셸 명령 |
| `prompt` | `string` | 아니오 | -- | 새 에이전트 프롬프트 |
| `description` | `string` | 아니오 | -- | 새 설명 |

### cron_run

정상 일정 외에 크론 작업을 즉시 수동으로 트리거합니다.

```json
{
  "name": "cron_run",
  "arguments": {
    "name": "daily-report"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `name` | `string` | 예 | -- | 트리거할 크론 작업의 이름 |

### cron_runs

크론 작업 실행 이력과 로그를 봅니다. 타임스탬프, 상태, 출력과 함께 과거 실행을 표시합니다.

```json
{
  "name": "cron_runs",
  "arguments": {
    "name": "daily-report",
    "limit": 10
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `name` | `string` | 아니오 | -- | 작업 이름으로 필터링. 생략 시 최근 모든 실행을 표시. |
| `limit` | `integer` | 아니오 | `20` | 반환할 이력 항목의 최대 수 |

### schedule

자연어 시간 표현으로 일회성 또는 반복 작업을 예약합니다. 원시 크론 표현식보다 상위 수준의 인터페이스입니다.

```json
{
  "name": "schedule",
  "arguments": {
    "when": "in 30 minutes",
    "action": "agent",
    "prompt": "Check if the deployment completed and report the status."
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `when` | `string` | 예 | -- | 자연어 시간 표현 (예: `"in 30 minutes"`, `"tomorrow at 9am"`, `"every Monday at 10:00"`) |
| `action` | `string` | 예 | -- | 액션 유형: `"shell"` 또는 `"agent"` |
| `command` | `string` | 조건부 | -- | 셸 명령 (`"shell"` 액션용) |
| `prompt` | `string` | 조건부 | -- | 에이전트 프롬프트 (`"agent"` 액션용) |

### cron (레거시)

하위 호환성을 위한 레거시 크론 진입점입니다. 액션 인자에 따라 적절한 크론 도구로 라우팅합니다.

```json
{
  "name": "cron",
  "arguments": {
    "action": "list"
  }
}
```

### xin

의존성 체인과 조건부 실행을 갖춘 고급 작업 자동화를 위한 Xin 스케줄링 엔진입니다.

```json
{
  "name": "xin",
  "arguments": {
    "action": "status"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `action` | `string` | 예 | -- | 액션: `"status"`, `"tasks"`, `"run"`, `"pause"`, `"resume"` |

## 크론 표현식 형식

PRX는 표준 5필드 크론 표현식을 사용합니다:

```
┌───────────── 분 (0-59)
│ ┌───────────── 시 (0-23)
│ │ ┌───────────── 일 (1-31)
│ │ │ ┌───────────── 월 (1-12)
│ │ │ │ ┌───────────── 요일 (0-7, 0과 7 = 일요일)
│ │ │ │ │
* * * * *
```

**예시:**

| 표현식 | 설명 |
|--------|------|
| `0 9 * * *` | 매일 오전 9:00 |
| `*/15 * * * *` | 15분마다 |
| `0 9 * * 1-5` | 평일 오전 9:00 |
| `0 0 1 * *` | 매월 1일 자정 |
| `30 8,12,18 * * *` | 매일 8:30, 12:30, 18:30 |

## Xin 엔진

Xin 엔진은 단순한 크론 타이밍을 넘어서는 고급 작업 스케줄러입니다:

- **의존성 체인**: 작업이 다른 작업의 성공적 완료에 의존할 수 있음
- **조건부 실행**: 지정된 조건이 충족될 때만 작업 실행
- **내장 작업**: `builtin_tasks = true`일 때 시스템 유지보수 작업(하트비트, 메모리 정리, 로그 로테이션)이 자동 등록
- **진화 통합**: `evolution_integration = true`일 때 Xin이 자기 진화 및 적합도 검사 일정을 관리
- **오래된 항목 감지**: `stale_timeout_minutes`보다 오래 실행되는 작업은 오래된 것으로 표시되어 정리 가능
- **동시 실행**: 여러 작업이 `max_concurrent`로 제한되어 병렬 실행 가능

## 사용법

### CLI 크론 관리

```bash
# 모든 크론 작업 나열
prx cron list

# 새 크론 작업 추가
prx cron add --name "check-updates" --schedule "0 */6 * * *" --action agent --prompt "Check for package updates"

# 작업 수동 트리거
prx cron run daily-report

# 실행 이력 보기
prx cron runs --name daily-report --limit 5

# 작업 제거
prx cron remove check-updates
```

### Xin 상태

```bash
# Xin 엔진 상태 확인
prx xin status

# 모든 Xin 작업 나열
prx xin tasks
```

## 보안

### 셸 명령 샌드박싱

`action = "shell"`인 크론 작업은 `shell` 도구와 동일한 샌드박스를 통해 실행됩니다. 설정된 샌드박스 백엔드(Landlock, Firejail, Bubblewrap, Docker)가 예약된 명령에 적용됩니다.

### 에이전트 프롬프트 안전

`action = "agent"`인 크론 작업은 설정된 프롬프트로 새 에이전트 세션을 스폰합니다. 에이전트 세션은 데몬의 보안 정책, 도구 제한, 리소스 제한을 상속합니다.

### 정책 엔진

크론 도구는 보안 정책 엔진의 적용을 받습니다:

```toml
[security.tool_policy.groups]
automation = "allow"

[security.tool_policy.tools]
cron_add = "supervised"    # 새 작업 추가 시 승인 필요
cron_remove = "supervised" # 작업 제거 시 승인 필요
cron_run = "allow"         # 수동 트리거 허용
```

### 감사 로깅

모든 크론 작업은 감사 로그에 기록됩니다: 작업 생성, 수정, 삭제, 수동 트리거, 실행 결과.

### 리소스 제한

예약 작업은 데몬의 리소스 제한을 공유합니다. Xin 엔진의 `max_concurrent` 설정은 너무 많은 동시 작업으로 인한 리소스 고갈을 방지합니다.

## 관련 페이지

- [크론 시스템](/ko/prx/cron/) -- 아키텍처 및 내장 작업
- [크론 하트비트](/ko/prx/cron/heartbeat) -- 상태 모니터링
- [크론 작업](/ko/prx/cron/tasks) -- 내장 유지보수 작업
- [자기 진화](/ko/prx/self-evolution/) -- Xin 진화 통합
- [셸 실행](/ko/prx/tools/shell) -- 셸 기반 크론 작업의 샌드박스
- [설정 참조](/ko/prx/config/reference) -- `[cron]` 및 `[xin]` 설정
- [도구 개요](/ko/prx/tools/) -- 모든 도구 및 레지스트리 시스템
