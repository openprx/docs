---
title: 에이전트 타입
description: "OpenPR-Webhook의 5가지 에이전트 타입. openclaw, openprx, webhook, custom, cli 에이전트 설정 및 메시지 템플릿."
---

# 에이전트 타입

에이전트는 OpenPR-Webhook의 핵심 디스패치 단위입니다. 각 에이전트는 매칭된 웹훅 이벤트를 처리하는 방법을 정의합니다. 단일 배포에 여러 에이전트를 설정할 수 있으며, 이벤트는 웹훅 페이로드의 `bot_context`에 따라 적절한 에이전트로 라우팅됩니다.

## 개요

| 타입 | 사용 사례 | 기능 플래그 필요 |
|------|----------|----------------|
| `openclaw` | OpenClaw CLI를 사용하여 Signal/Telegram으로 알림 전송 | 없음 |
| `openprx` | OpenPRX Signal API 또는 CLI를 통해 메시지 전송 | 없음 |
| `webhook` | HTTP 엔드포인트(Slack, Discord 등)로 이벤트 전달 | 없음 |
| `custom` | 임의 셸 명령 실행 | 없음 |
| `cli` | AI 코딩 에이전트(codex, claude-code, opencode) 실행 | 예 (`cli_enabled`) |

## 에이전트 설정 구조

모든 에이전트에는 다음 공통 필드가 있습니다:

```toml
[[agents]]
id = "unique-id"              # Unique identifier, used for matching
name = "Human-Readable Name"  # Display name, also used for matching
agent_type = "openclaw"       # One of: openclaw, openprx, webhook, custom, cli
message_template = "..."      # Optional: custom message format
```

그런 다음 `agent_type`에 따라 타입별 설정 블록을 제공합니다:

- openclaw 에이전트의 경우 `[agents.openclaw]`
- openprx 에이전트의 경우 `[agents.openprx]`
- webhook 에이전트의 경우 `[agents.webhook]`
- custom 에이전트의 경우 `[agents.custom]`
- cli 에이전트의 경우 `[agents.cli]`

## 메시지 템플릿

`message_template` 필드는 웹훅 페이로드의 값으로 대체되는 플레이스홀더를 지원합니다:

| 플레이스홀더 | 출처 | 예시 |
|------------|------|------|
| `{event}` | `payload.event` | `issue.updated` |
| `{title}` | `payload.data.issue.title` | `Fix login bug` |
| `{key}` | `payload.data.issue.key` | `PROJ-42` |
| `{issue_id}` | `payload.data.issue.id` | `123` |
| `{reason}` | `payload.bot_context.trigger_reason` | `assigned_to_bot` |
| `{actor}` | `payload.actor.name` | `alice` |
| `{project}` | `payload.project.name` | `backend` |
| `{workspace}` | `payload.workspace.name` | `IM` |
| `{state}` | `payload.data.issue.state` | `in_progress` |
| `{priority}` | `payload.data.issue.priority` | `high` |
| `{url}` | 파생 | `issue/123` |

기본 템플릿 (openclaw, openprx, webhook, custom용):

```
[{project}] {event}: {key} {title}
{actor} | Trigger: {reason}
```

## 에이전트 매칭 로직

`bot_context.is_bot_task = true`인 웹훅 이벤트가 도착하면:

1. 서비스는 `bot_context.bot_name`과 `bot_context.bot_agent_type`을 추출합니다
2. `id` 또는 `name`(대소문자 무시)이 `bot_name`과 일치하는 에이전트를 검색합니다
3. 이름 매칭이 없으면 `agent_type`이 `bot_agent_type`과 일치하는 첫 번째 에이전트로 폴백합니다
4. 에이전트가 전혀 매칭되지 않으면 이벤트는 수신 확인되지만 디스패치되지 않습니다

## 멀티 에이전트 예제

```toml
# Agent 1: Notification via Telegram
[[agents]]
id = "notify-tg"
name = "Telegram Notifier"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "telegram"
target = "@my-channel"

# Agent 2: Forward to Slack
[[agents]]
id = "notify-slack"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"

# Agent 3: AI coding agent
[[agents]]
id = "coder"
name = "Code Agent"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 600
update_state_on_start = "in_progress"
update_state_on_success = "done"
update_state_on_fail = "todo"
```

이 설정에서 OpenPR은 웹훅 페이로드의 `bot_name` 필드를 설정하여 다른 이벤트를 다른 에이전트로 라우팅할 수 있습니다.

## 다음 단계

- [실행기 레퍼런스](executors.md) -- 각 실행기 타입의 상세 문서
- [설정 레퍼런스](../configuration/index.md) -- 전체 TOML 스키마
