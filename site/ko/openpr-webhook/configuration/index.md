---
title: 설정 레퍼런스
description: "OpenPR-Webhook의 전체 TOML 설정 스키마. 서버, 보안, 기능 플래그, 런타임, WSS 터널, 에이전트 설정."
---

# 설정 레퍼런스

OpenPR-Webhook은 단일 TOML 설정 파일을 사용합니다. 기본적으로 현재 디렉토리에서 `config.toml`을 찾습니다. 첫 번째 커맨드라인 인수로 커스텀 경로를 지정할 수 있습니다.

## 전체 스키마

```toml
# ─── Server ───────────────────────────────────────────────
[server]
listen = "0.0.0.0:9000"               # Bind address and port

# ─── Security ─────────────────────────────────────────────
[security]
webhook_secrets = ["secret1", "secret2"]  # HMAC-SHA256 secrets (supports rotation)
allow_unsigned = false                     # Allow unsigned webhook requests (default: false)

# ─── Feature Flags ────────────────────────────────────────
[features]
tunnel_enabled = false                 # Enable WSS tunnel subsystem (default: false)
cli_enabled = false                    # Enable CLI agent executor (default: false)
callback_enabled = false               # Enable state-transition callbacks (default: false)

# ─── Runtime Tuning ───────────────────────────────────────
[runtime]
cli_max_concurrency = 1               # Max concurrent CLI tasks (default: 1)
http_timeout_secs = 15                 # HTTP client timeout (default: 15)
tunnel_reconnect_backoff_max_secs = 60 # Max tunnel reconnect backoff (default: 60)

# ─── WSS Tunnel ───────────────────────────────────────────
[tunnel]
enabled = false                        # Enable this tunnel instance (default: false)
url = "wss://control.example.com/ws"   # WebSocket URL
agent_id = "my-agent"                  # Agent identifier
auth_token = "bearer-token"            # Bearer auth token
reconnect_secs = 3                     # Base reconnect interval (default: 3)
heartbeat_secs = 20                    # Heartbeat interval (default: 20, min: 3)
hmac_secret = "envelope-signing-key"   # Envelope HMAC signing secret
require_inbound_sig = false            # Require inbound message signatures (default: false)

# ─── Agents ───────────────────────────────────────────────

# --- OpenClaw Agent ---
[[agents]]
id = "notify-signal"
name = "Signal Notifier"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "signal"
target = "+1234567890"

# --- OpenPRX Agent (HTTP API mode) ---
[[agents]]
id = "openprx-signal"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"
account = "+1234567890"
target = "+0987654321"
channel = "signal"

# --- OpenPRX Agent (CLI mode) ---
[[agents]]
id = "openprx-cli"
name = "OpenPRX CLI"
agent_type = "openprx"

[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"

# --- Webhook Agent ---
[[agents]]
id = "forward-slack"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-hmac-secret"        # Optional: sign outbound requests

# --- Custom Agent ---
[[agents]]
id = "custom-script"
name = "Custom Script"
agent_type = "custom"
message_template = "{event}|{key}|{title}"

[agents.custom]
command = "/usr/local/bin/handle-event.sh"
args = ["--format", "json"]

# --- CLI Agent ---
[[agents]]
id = "ai-coder"
name = "AI Coder"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 900
max_output_chars = 12000
prompt_template = "Fix issue {issue_id}: {title}\nContext: {reason}"
update_state_on_start = "in_progress"
update_state_on_success = "done"
update_state_on_fail = "todo"
callback = "mcp"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"
skip_callback_state = false               # AI가 MCP를 통해 상태 관리 시 true로 설정
# mcp_instructions = "..."               # 커스텀 MCP 지침 (기본값 덮어씀)
# mcp_config_path = "/path/to/mcp.json"  # claude-code --mcp-config 경로

[agents.cli.env_vars]                      # 에이전트별 환경 변수
# OPENPR_API_URL = "http://localhost:3000"
# OPENPR_BOT_TOKEN = "opr_xxx"
```

## 섹션 레퍼런스

### `[server]`

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `listen` | String | 예 | -- | `host:port` 형식의 TCP 바인드 주소 |

### `[security]`

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `webhook_secrets` | 문자열 배열 | 아니오 | `[]` | 인바운드 검증을 위한 유효한 HMAC-SHA256 시크릿 목록. 여러 시크릿은 키 순환을 지원합니다. |
| `allow_unsigned` | Boolean | 아니오 | `false` | 서명 검증 없이 서명되지 않은 요청을 허용합니다. **프로덕션에 권장하지 않습니다.** |

**서명 검증**은 두 헤더를 순서대로 확인합니다:
1. `X-Webhook-Signature`
2. `X-OpenPR-Signature`

헤더 값은 `sha256={hex-digest}` 형식이어야 합니다. 서비스는 하나가 일치할 때까지 `webhook_secrets`의 각 시크릿을 시도합니다.

### `[features]`

모든 기능 플래그는 기본값이 `false`입니다. 이 심층 방어 방식은 위험한 기능이 명시적으로 활성화되도록 합니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `tunnel_enabled` | Boolean | `false` | WSS 터널 서브시스템 활성화 |
| `cli_enabled` | Boolean | `false` | CLI 에이전트 실행기 활성화 |
| `callback_enabled` | Boolean | `false` | 상태 전환 콜백 활성화 |

### `[runtime]`

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `cli_max_concurrency` | Integer | `1` | 최대 동시 CLI 에이전트 태스크 수 |
| `http_timeout_secs` | Integer | `15` | 아웃바운드 HTTP 요청 타임아웃 (웹훅 전달, 콜백, Signal API) |
| `tunnel_reconnect_backoff_max_secs` | Integer | `60` | 터널 재연결의 최대 백오프 간격 |

### `[tunnel]`

상세 문서는 [WSS 터널](../tunnel/index.md)을 참조하세요.

### `[[agents]]`

상세 문서는 [에이전트 타입](../agents/index.md) 및 [실행기 레퍼런스](../agents/executors.md)를 참조하세요.

## 환경 변수

| 변수 | 설명 |
|------|------|
| `OPENPR_WEBHOOK_SAFE_MODE` | `1`, `true`, `yes`, 또는 `on`으로 설정하면 설정에 관계없이 터널, CLI, 콜백 기능을 비활성화합니다. 긴급 잠금에 유용합니다. |
| `RUST_LOG` | 로그 상세도를 제어합니다. 기본값: `openpr_webhook=info`. 예시: `openpr_webhook=debug`, `openpr_webhook=trace` |

### 에이전트별 환경 변수

CLI 에이전트는 `[agents.cli.env_vars]`를 통해 커스텀 환경 변수 주입을 지원합니다. 이 변수들은 실행기 서브프로세스에 전달되며 MCP 인증 정보를 제공하는 데 유용합니다:

| 변수 | 설명 |
|------|------|
| `OPENPR_API_URL` | OpenPR API 기본 URL (MCP 서버가 사용) |
| `OPENPR_BOT_TOKEN` | 봇 인증 토큰 (`opr_` 접두사) |
| `OPENPR_WORKSPACE_ID` | 대상 워크스페이스 UUID |

## 안전 모드

`OPENPR_WEBHOOK_SAFE_MODE=1`을 설정하면 다음을 비활성화합니다:

- CLI 에이전트 실행 (`cli_enabled`가 강제로 `false`)
- 콜백 전송 (`callback_enabled`가 강제로 `false`)
- WSS 터널 (`tunnel_enabled`가 강제로 `false`)

위험하지 않은 에이전트(openclaw, openprx, webhook, custom)는 계속 정상적으로 작동합니다. 이를 통해 설정 파일을 수정하지 않고도 서비스를 빠르게 잠글 수 있습니다.

```bash
OPENPR_WEBHOOK_SAFE_MODE=1 ./openpr-webhook config.toml
```

## 최소 설정

가장 작은 유효한 설정:

```toml
[server]
listen = "0.0.0.0:9000"

[security]
allow_unsigned = true
```

이는 에이전트와 서명 검증이 없는 서비스를 시작합니다. 개발 용도로만 유용합니다.

## 프로덕션 체크리스트

- [ ] `webhook_secrets`에 최소 하나의 항목 설정
- [ ] `allow_unsigned = false` 설정
- [ ] 최소 하나의 에이전트 설정
- [ ] CLI 에이전트 사용 시: `cli_enabled = true` 설정 및 실행기 화이트리스트 검토
- [ ] 터널 사용 시: `wss://`(`ws://` 아님) 사용, `hmac_secret` 설정 및 `require_inbound_sig = true`
- [ ] `RUST_LOG=openpr_webhook=info` 설정 (성능을 위해 프로덕션에서 `debug`/`trace` 사용 금지)
- [ ] CLI 이외 기능 검증을 위해 처음에 `OPENPR_WEBHOOK_SAFE_MODE=1`로 실행 고려
