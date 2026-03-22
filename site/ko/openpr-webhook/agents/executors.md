---
title: 실행기 레퍼런스
description: "openclaw, openprx, webhook, custom, cli 등 OpenPR-Webhook의 5가지 실행기 타입 상세 문서."
---

# 실행기 레퍼런스

이 페이지는 5가지 실행기 타입 모두를 설정 필드, 동작, 예제와 함께 상세하게 문서화합니다.

## openclaw

Signal/Telegram과 같은 메시징 플랫폼으로 OpenClaw CLI 도구를 통해 알림을 전송합니다.

**동작 방식:** `--channel`, `--target`, `--message` 인수와 함께 OpenClaw 바이너리를 호출하는 셸 명령을 구성합니다.

**설정:**

```toml
[[agents]]
id = "my-openclaw"
name = "Signal Notifier"
agent_type = "openclaw"
message_template = "[{project}] {key}: {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"   # Path to the OpenClaw binary
channel = "signal"                     # Channel: "signal" or "telegram"
target = "+1234567890"                 # Phone number, group ID, or channel name
```

**필드:**

| 필드 | 필수 | 설명 |
|------|------|------|
| `command` | 예 | OpenClaw CLI 바이너리 경로 |
| `channel` | 예 | 메시징 채널 (`signal`, `telegram`) |
| `target` | 예 | 수신자 식별자 (전화번호, 그룹 ID 등) |

---

## openprx

OpenPRX 메시징 인프라를 통해 메시지를 전송합니다. 두 가지 모드를 지원합니다: HTTP API(Signal 데몬) 또는 CLI 명령.

**모드 1: Signal API (권장)**

signal-cli REST API 데몬에 JSON POST를 전송합니다:

```toml
[[agents]]
id = "my-openprx"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"  # signal-cli REST API base URL
account = "+1234567890"                 # Sender phone number
target = "+0987654321"                  # Recipient phone number or UUID
channel = "signal"                      # Default: "signal"
```

Signal API로 전송되는 HTTP 요청:

```
POST {signal_api}/api/v1/send/{account}
Content-Type: application/json

{
  "recipients": ["{target}"],
  "message": "..."
}
```

**모드 2: CLI 명령**

`signal_api`가 설정되지 않은 경우 셸 명령 실행으로 폴백합니다:

```toml
[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"
```

**필드:**

| 필드 | 필수 | 설명 |
|------|------|------|
| `signal_api` | 아니오 | Signal 데몬 HTTP API 기본 URL |
| `account` | 아니오 | 계정 전화번호 (`signal_api`와 함께 사용) |
| `target` | 예 | 수신자 전화번호 또는 UUID |
| `channel` | 아니오 | 채널 이름 (기본값: `signal`) |
| `command` | 아니오 | CLI 명령 (`signal_api`가 설정되지 않은 경우 폴백) |

`signal_api` 또는 `command` 중 하나 이상을 제공해야 합니다.

---

## webhook

전체 웹훅 페이로드를 HTTP 엔드포인트로 그대로 전달합니다. Slack, Discord, 커스텀 API와 통합하거나 다른 웹훅 서비스로 체이닝할 때 유용합니다.

**동작 방식:** 원본 페이로드와 함께 설정된 URL로 JSON POST를 전송합니다. 선택적으로 HMAC-SHA256으로 아웃바운드 요청에 서명합니다.

```toml
[[agents]]
id = "slack-forward"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-signing-secret"  # Optional: sign outbound requests
```

**필드:**

| 필드 | 필수 | 설명 |
|------|------|------|
| `url` | 예 | 목적지 URL |
| `secret` | 아니오 | 아웃바운드 서명을 위한 HMAC-SHA256 시크릿 (`X-Webhook-Signature` 헤더로 전송) |

`secret`이 설정되면, 아웃바운드 요청에는 수신 측이 진위성을 검증할 수 있도록 JSON 본문에 대해 계산된 `X-Webhook-Signature: sha256=...` 헤더가 포함됩니다.

---

## custom

형식화된 메시지를 인수로 전달하여 임의 셸 명령을 실행합니다. 커스텀 통합, 로깅, 또는 외부 스크립트 트리거에 유용합니다.

**동작 방식:** `sh -c '{command} "{message}"'`를 실행하며, `{message}`는 특수 문자가 이스케이프된 렌더링된 템플릿입니다.

```toml
[[agents]]
id = "custom-logger"
name = "Log to File"
agent_type = "custom"
message_template = "{event} | {key} | {title}"

[agents.custom]
command = "/usr/local/bin/log-event.sh"
args = ["--format", "json"]  # Optional additional arguments
```

**필드:**

| 필드 | 필수 | 설명 |
|------|------|------|
| `command` | 예 | 실행 파일 또는 셸 명령 경로 |
| `args` | 아니오 | 추가 커맨드라인 인수 |

**보안 참고:** 커스텀 실행기는 셸 명령을 실행합니다. 명령 경로가 신뢰할 수 있고 사용자가 제어할 수 없는지 확인하세요.

---

## cli

이슈를 처리하기 위해 AI 코딩 에이전트를 실행합니다. 자동화된 코드 생성 및 이슈 해결을 위해 설계된 가장 강력한 실행기 타입입니다.

**필요:** 설정에서 `features.cli_enabled = true`. `OPENPR_WEBHOOK_SAFE_MODE=1`인 경우 차단됩니다.

**지원 실행기 (화이트리스트):**

| 실행기 | 바이너리 | 명령 패턴 |
|--------|--------|----------|
| `codex` | `codex` | `codex exec --full-auto "{prompt}"` |
| `claude-code` | `claude` | `claude --print --permission-mode bypassPermissions "{prompt}"` |
| `opencode` | `opencode` | `opencode run "{prompt}"` |

이 화이트리스트에 없는 실행기는 거부됩니다.

**설정:**

```toml
[features]
cli_enabled = true
callback_enabled = true  # Required for state transitions

[[agents]]
id = "my-coder"
name = "Code Agent"
agent_type = "cli"

[agents.cli]
executor = "claude-code"               # One of: codex, claude-code, opencode
workdir = "/opt/projects/backend"      # Working directory for the CLI tool
timeout_secs = 900                     # Timeout in seconds (default: 900)
max_output_chars = 12000               # Max chars to capture from stdout/stderr (default: 12000)
prompt_template = "Fix issue {issue_id}: {title}\nContext: {reason}"

# State transitions (requires callback_enabled)
update_state_on_start = "in_progress"  # Set issue state when task starts
update_state_on_success = "done"       # Set issue state on success
update_state_on_fail = "todo"          # Set issue state on failure/timeout

# Callback configuration
callback = "mcp"                       # Callback mode: "mcp" or "api"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"        # Optional Bearer token for callback
```

**필드:**

| 필드 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `executor` | 예 | -- | CLI 도구 이름 (`codex`, `claude-code`, `opencode`) |
| `workdir` | 아니오 | -- | 작업 디렉토리 |
| `timeout_secs` | 아니오 | 900 | 프로세스 타임아웃 |
| `max_output_chars` | 아니오 | 12000 | 출력 테일 캡처 제한 |
| `prompt_template` | 아니오 | `Fix issue {issue_id}: {title}\nContext: {reason}` | CLI 도구에 전송되는 프롬프트 |
| `update_state_on_start` | 아니오 | -- | 태스크 시작 시 이슈 상태 |
| `update_state_on_success` | 아니오 | -- | 성공 시 이슈 상태 |
| `update_state_on_fail` | 아니오 | -- | 실패 또는 타임아웃 시 이슈 상태 |
| `callback` | 아니오 | `mcp` | 콜백 프로토콜 (`mcp` 또는 `api`) |
| `callback_url` | 아니오 | -- | 콜백을 전송할 URL |
| `callback_token` | 아니오 | -- | 콜백 인증을 위한 Bearer 토큰 |

**프롬프트 템플릿 플레이스홀더 (cli 전용):**

| 플레이스홀더 | 출처 |
|------------|------|
| `{issue_id}` | `payload.data.issue.id` |
| `{title}` | `payload.data.issue.title` |
| `{reason}` | `payload.bot_context.trigger_reason` |

**콜백 페이로드 (MCP 모드):**

`callback = "mcp"`인 경우 서비스는 `callback_url`로 JSON-RPC 스타일 POST를 전송합니다:

```json
{
  "method": "issue.comment",
  "params": {
    "issue_id": "42",
    "run_id": "run-1711234567890",
    "executor": "claude-code",
    "status": "success",
    "summary": "cli execution completed",
    "exit_code": 0,
    "duration_ms": 45000,
    "stdout_tail": "...",
    "stderr_tail": "...",
    "state": "done"
  }
}
```

**상태 전환 수명주기:**

```
Event received
    |
    v
[update_state_on_start] --> issue state = "in_progress"
    |
    v
CLI tool runs (up to timeout_secs)
    |
    +-- success --> [update_state_on_success] --> issue state = "done"
    |
    +-- failure --> [update_state_on_fail] --> issue state = "todo"
    |
    +-- timeout --> [update_state_on_fail] --> issue state = "todo"
```
