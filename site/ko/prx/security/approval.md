---
title: 승인 워크플로우
description: PRX가 실행 전에 사람의 승인이 필요한 감독된 도구 호출을 처리하는 방법입니다.
---

# 승인 워크플로우

도구의 보안 정책이 `"supervised"`로 설정되면 PRX는 실행을 일시 중지하고 도구 호출을 실행하기 전에 사람의 승인을 기다립니다. 이는 셸 명령, 파일 쓰기, 네트워크 요청 또는 되돌릴 수 없는 결과를 초래할 수 있는 모든 작업에 대한 중요한 안전 레이어를 제공합니다.

## 개요

승인 워크플로우는 에이전트 루프와 도구 실행 사이에 위치합니다:

```
Agent Loop
    │
    ├── LLM emits tool call: shell("rm -rf /tmp/data")
    │
    ▼
┌───────────────────────────────────┐
│        Policy Engine              │
│                                   │
│  Tool: "shell"                    │
│  Policy: "supervised"             │
│  Action: REQUIRE APPROVAL         │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│      Approval Request             │
│                                   │
│  Pending...                       │
│  ├── Notify supervisor            │
│  ├── Wait for response            │
│  └── Timeout after N seconds      │
└───────────────┬───────────────────┘
                │
         ┌──────┴──────┐
         │             │
    ┌────▼────┐   ┌────▼────┐
    │ Approved│   │ Denied  │
    │         │   │         │
    │ Execute │   │ Return  │
    │ tool    │   │ error   │
    └─────────┘   └─────────┘
```

## 설정

### 도구 정책 설정

`config.toml`에서 승인이 필요한 도구를 설정합니다:

```toml
[security.tool_policy]
# 모든 도구의 기본 정책.
# "allow" -- 즉시 실행
# "deny" -- 실행 완전 차단
# "supervised" -- 실행 전 승인 필요
default = "allow"

# 도구별 정책 재정의.
[security.tool_policy.tools]
shell = "supervised"
file_write = "supervised"
http_request = "supervised"
git_operations = "allow"
memory_store = "allow"
browser = "deny"

# 그룹 수준 정책.
[security.tool_policy.groups]
sessions = "allow"
automation = "supervised"
```

### 승인 설정

```toml
[security.approval]
# 응답을 기다리는 타임아웃 (초).
timeout_secs = 300

# 승인 타임아웃 시 조치: "deny" 또는 "allow".
# "deny"가 안전한 기본값 -- 응답 없는 요청은 거부됩니다.
on_timeout = "deny"

# 승인 요청을 위한 알림 채널.
# 감독자에게 이 채널을 통해 알림이 전송됩니다.
notify_channel = "telegram"

# 감독자 사용자 ID 또는 식별자.
# 이 사용자만 요청을 승인하거나 거부할 수 있습니다.
supervisor_id = "admin"

# 자동 승인 패턴: 이 패턴과 일치하는 도구 호출은
# 사람의 개입 없이 자동으로 승인됩니다.
# 주의하여 사용하세요.
[[security.approval.auto_approve]]
tool = "shell"
command_pattern = "^(ls|cat|head|tail|wc|grep|find|echo) "

[[security.approval.auto_approve]]
tool = "file_write"
path_pattern = "^/tmp/"
```

## 승인 흐름

### 단계 1: 정책 확인

에이전트가 도구 호출을 발생시키면 정책 엔진이 평가합니다:

1. 도구별 정책 확인 (`security.tool_policy.tools.<name>`)
2. 도구별 정책이 없으면 그룹 정책 확인 (`security.tool_policy.groups.<group>`)
3. 그룹 정책이 없으면 기본 정책 사용 (`security.tool_policy.default`)

해석된 정책이 `"supervised"`이면 승인 흐름이 트리거됩니다.

### 단계 2: 자동 승인 확인

감독자에게 알리기 전에 PRX는 요청이 `auto_approve` 패턴과 일치하는지 확인합니다. 자동 승인 규칙은 정규식 패턴을 사용하여 도구 인수와 매칭합니다:

| 필드 | 설명 |
|------|------|
| `tool` | 규칙이 적용되는 도구명 |
| `command_pattern` | 셸 명령에 대해 매칭되는 정규식 패턴 (`shell` 도구용) |
| `path_pattern` | 파일 경로에 대해 매칭되는 정규식 패턴 (`file_write`, `file_read`용) |
| `url_pattern` | URL에 대해 매칭되는 정규식 패턴 (`http_request`용) |
| `args_pattern` | 전체 JSON 인수에 대해 매칭되는 정규식 패턴 |

일치하는 항목이 발견되면 요청이 자동 승인되고 실행이 즉시 진행됩니다. 이는 과도한 승인 피로를 유발하는 안전한 읽기 전용 명령에 유용합니다.

### 단계 3: 알림

자동 승인 규칙이 일치하지 않으면 PRX는 승인 요청을 생성하고 감독자에게 알립니다:

```
[APPROVAL REQUIRED]

Tool: shell
Arguments: {"command": "rm -rf /tmp/data"}
Session: abc-123
Agent: default
Time: 2026-03-21 14:30:22 UTC

Reply with:
  /approve -- execute the tool call
  /deny -- reject the tool call
  /deny reason: <explanation> -- reject with reason
```

알림은 설정된 `notify_channel`을 통해 전송됩니다. 지원되는 채널:

| 채널 | 알림 방법 |
|------|----------|
| Telegram | 감독자의 채팅으로 메시지 |
| Discord | 감독자에게 DM |
| Slack | 감독자에게 DM |
| CLI | 터미널 프롬프트 (stdin) |
| Email | 설정된 주소로 이메일 |
| Webhook | 설정된 URL로 HTTP POST |

### 단계 4: 대기

감독자의 응답을 기다리는 동안 에이전트 루프가 일시 중지됩니다. 이 시간 동안:

- 에이전트는 도구를 실행할 수 없습니다 (현재 도구 호출이 차단)
- 다른 세션은 독립적으로 계속 운영됩니다
- 승인 요청에는 추적을 위한 고유 ID가 있습니다

### 단계 5: 해결

감독자는 다음 중 하나로 응답합니다:

| 응답 | 효과 |
|------|------|
| **승인** | 도구 호출이 정상적으로 실행되고 결과가 에이전트에 반환됩니다 |
| **거부** | 도구 호출이 거부되고 에이전트에 오류 메시지가 반환됩니다 |
| **사유와 함께 거부** | 거부와 동일하지만 에이전트가 적응할 수 있도록 오류 메시지에 사유가 포함됩니다 |
| **타임아웃** | `on_timeout` 조치가 적용됩니다 (기본값: deny) |

## 요청 생명주기

각 승인 요청은 다음 상태를 거칩니다:

```
PENDING → APPROVED → EXECUTED
       → DENIED
       → TIMED_OUT
       → CANCELLED (해결 전에 세션이 종료된 경우)
```

| 상태 | 설명 |
|------|------|
| `PENDING` | 감독자 응답 대기 중 |
| `APPROVED` | 감독자가 승인, 도구 실행 중 |
| `EXECUTED` | 승인 후 도구 실행 완료 |
| `DENIED` | 감독자가 명시적으로 요청 거부 |
| `TIMED_OUT` | `timeout_secs` 내에 응답 없음 |
| `CANCELLED` | 해결 전에 세션 종료 |

## 승인 인터페이스

CLI 모드에서는 승인 요청이 도구명, 인수, 위험 수준이 포함된 대화형 터미널 프롬프트로 나타납니다. 프로그래밍 방식 접근을 위해 PRX는 REST API를 노출합니다:

```bash
# 대기 중인 요청 목록 / 승인 / 거부
curl http://localhost:8080/api/approvals?status=pending
curl -X POST http://localhost:8080/api/approvals/{id}/approve
curl -X POST http://localhost:8080/api/approvals/{id}/deny \
  -d '{"reason": "Not permitted"}'
```

## 감사 추적

모든 승인 결정은 활동 로그에 기록됩니다. 필드: `request_id`, `tool`, `arguments`, `session_id`, `decision`, `decided_by`, `decided_at`, `reason`, `execution_result`. `prx audit approvals --last 50`으로 접근하거나 `--format json`으로 내보냅니다.

## 보안 참고

- **타임아웃 시 기본 거부** -- 프로덕션에서는 항상 `on_timeout = "deny"`를 설정하세요. 응답 없는 요청을 허용하면 감독의 목적이 무력화됩니다.
- **자동 승인은 신중하게** -- 지나치게 넓은 자동 승인 패턴은 승인 워크플로우를 우회할 수 있습니다. 구체적인 정규식 패턴을 사용하고 정기적으로 검토하세요.
- **감독자 인증** -- `notify_channel`이 감독자를 인증하는지 확인하세요. 손상된 알림 채널은 무단 승인을 허용할 수 있습니다.
- **레이트 리밋** -- 에이전트가 동일한 작업에 대해 반복적으로 승인 요청을 트리거하면 해당 도구의 정책을 `"deny"`로 업데이트하거나 더 구체적인 자동 승인 규칙을 추가하는 것을 고려하세요.
- **다중 감독자** -- 팀 배포에서는 여러 감독자를 설정하는 것을 고려하세요. 그 중 누구든 승인하거나 거부할 수 있습니다.

## 관련 페이지

- [보안 개요](/ko/prx/security/)
- [정책 엔진](/ko/prx/security/policy-engine)
- [샌드박스](/ko/prx/security/sandbox)
- [감사 로깅](/ko/prx/security/audit)
- [도구 개요](/ko/prx/tools/)
