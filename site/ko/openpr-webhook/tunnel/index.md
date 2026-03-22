---
title: WSS 터널
description: "OpenPR-Webhook WSS 터널(Phase B). NAT/방화벽 환경에서 컨트롤 플레인으로부터 태스크를 푸시 방식으로 수신하는 WebSocket 연결."
---

# WSS 터널

WSS 터널(Phase B)은 OpenPR-Webhook에서 컨트롤 플레인 서버로의 능동적인 WebSocket 연결을 제공합니다. 인바운드 HTTP 웹훅을 기다리는 대신, 터널을 통해 컨트롤 플레인이 영구적인 연결을 통해 에이전트에게 직접 태스크를 푸시할 수 있습니다.

이는 웹훅 서비스가 NAT 또는 방화벽 뒤에서 실행되어 인바운드 HTTP 요청을 받을 수 없을 때 특히 유용합니다.

## 동작 방식

```
Control Plane (wss://...)
    ^         |
    |         | task.dispatch
    |         v
+-------------------+
| openpr-webhook    |
|   tunnel client   |
|                   |
| task.ack  ------->|
| heartbeat ------->|
| task.result ----->|
+-------------------+
    |
    v
  CLI agent (codex / claude-code / opencode)
```

1. OpenPR-Webhook은 컨트롤 플레인 URL로 WebSocket 연결을 엽니다
2. `Authorization` 헤더의 Bearer 토큰을 사용하여 인증합니다
3. 연결을 유지하기 위해 주기적인 하트비트 메시지를 전송합니다
4. 컨트롤 플레인으로부터 `task.dispatch` 메시지를 수신합니다
5. 즉시 `task.ack`로 확인합니다
6. CLI 에이전트를 통해 비동기적으로 태스크를 실행합니다
7. 실행이 완료되면 `task.result`를 보냅니다

## 터널 활성화

터널은 **두 가지**가 활성화되어야 합니다:

1. 기능 플래그: `features.tunnel_enabled = true`
2. 터널 섹션: `tunnel.enabled = true`

두 조건이 모두 true여야 하며 `OPENPR_WEBHOOK_SAFE_MODE`가 설정되어 있지 않아야 합니다.

```toml
[features]
tunnel_enabled = true
cli_enabled = true  # Usually needed for task execution

[tunnel]
enabled = true
url = "wss://control.example.com/ws/agent"
agent_id = "my-webhook-agent"
auth_token = "your-bearer-token"
reconnect_secs = 3
heartbeat_secs = 20
```

## 메시지 엔벨로프 형식

모든 터널 메시지는 표준 엔벨로프를 사용합니다:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "heartbeat",
  "ts": 1711234567,
  "agent_id": "my-webhook-agent",
  "payload": { "alive": true },
  "sig": "sha256=abc123..."
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (UUID) | 고유 메시지 식별자 |
| `type` | String | 메시지 타입 (아래 참조) |
| `ts` | Integer | Unix 타임스탬프 (초) |
| `agent_id` | String | 전송 에이전트 ID |
| `payload` | Object | 타입별 페이로드 |
| `sig` | String (선택적) | 엔벨로프의 HMAC-SHA256 서명 |

## 메시지 타입

### 아웃바운드 (에이전트 → 컨트롤 플레인)

| 타입 | 시점 | 페이로드 |
|------|------|---------|
| `heartbeat` | N초마다 | `{"alive": true}` |
| `task.ack` | 태스크 수신 즉시 | `{"run_id": "...", "issue_id": "...", "status": "accepted"}` |
| `task.result` | 태스크 완료 후 | `{"run_id": "...", "issue_id": "...", "status": "success/failed", "summary": "..."}` |
| `error` | 프로토콜 오류 시 | `{"reason": "invalid_json/missing_signature/bad_signature", "msg_id": "..."}` |

### 인바운드 (컨트롤 플레인 → 에이전트)

| 타입 | 목적 | 페이로드 |
|------|------|---------|
| `task.dispatch` | 이 에이전트에 태스크 할당 | `{"run_id": "...", "issue_id": "...", "agent": "...", "body": {...}}` |

## 태스크 디스패치 흐름

```
Control Plane                    openpr-webhook
    |                                 |
    |--- task.dispatch ------------->|
    |                                 |--- task.ack (immediate)
    |<--- task.ack ------------------|
    |                                 |
    |                                 |--- run CLI agent
    |                                 |    (async, up to timeout)
    |                                 |
    |<--- task.result ---------------|--- task.result
    |                                 |
```

`task.dispatch` 페이로드 필드:

| 필드 | 타입 | 설명 |
|------|------|------|
| `run_id` | String | 고유 실행 식별자 (없으면 자동 생성) |
| `issue_id` | String | 작업할 이슈 ID |
| `agent` | String (선택적) | 대상 에이전트 ID (없으면 첫 번째 `cli` 에이전트로 폴백) |
| `body` | Object | 디스패처에 전달할 전체 웹훅 페이로드 |

## HMAC 엔벨로프 서명

`tunnel.hmac_secret`이 설정되면 모든 아웃바운드 엔벨로프에 서명됩니다:

1. 엔벨로프가 `sig`를 `null`로 설정하여 JSON으로 직렬화됩니다
2. 시크릿을 사용하여 JSON 바이트에 대해 HMAC-SHA256이 계산됩니다
3. 서명이 `sig` 필드에 `sha256={hex}`로 설정됩니다

인바운드 메시지의 경우 `tunnel.require_inbound_sig = true`이면, 유효한 서명이 없는 메시지는 `error` 엔벨로프로 거부됩니다.

```toml
[tunnel]
hmac_secret = "shared-secret-with-control-plane"
require_inbound_sig = true
```

## 재연결 동작

터널 클라이언트는 연결이 끊어지면 자동으로 재연결합니다:

- 초기 재시도 지연: `reconnect_secs` (기본값: 3초)
- 백오프: 연속 실패마다 두 배로 증가
- 최대 백오프: `runtime.tunnel_reconnect_backoff_max_secs` (기본값: 60초)
- 성공적인 연결 시 기본 지연으로 리셋

## 동시성 제어

터널을 통한 CLI 태스크 실행은 `runtime.cli_max_concurrency`로 제한됩니다:

```toml
[runtime]
cli_max_concurrency = 2  # Allow 2 concurrent CLI tasks (default: 1)
```

동시성 제한을 초과하는 태스크는 세마포어 허가를 기다립니다. 이는 여러 태스크가 연속으로 디스패치될 때 시스템 과부하를 방지합니다.

## 설정 레퍼런스

| 필드 | 기본값 | 설명 |
|------|--------|------|
| `tunnel.enabled` | `false` | 터널 활성화/비활성화 |
| `tunnel.url` | -- | WebSocket URL (`wss://` 또는 `ws://`) |
| `tunnel.agent_id` | `openpr-webhook` | 에이전트 식별자 |
| `tunnel.auth_token` | -- | 인증용 Bearer 토큰 |
| `tunnel.reconnect_secs` | `3` | 기본 재연결 간격 |
| `tunnel.heartbeat_secs` | `20` | 하트비트 간격 (최소 3초) |
| `tunnel.hmac_secret` | -- | HMAC-SHA256 서명 시크릿 |
| `tunnel.require_inbound_sig` | `false` | 서명되지 않은 인바운드 메시지 거부 |

## 보안 참고 사항

- 프로덕션에서는 항상 `wss://`를 사용하세요. `ws://`를 사용하면 서비스가 경고를 로깅합니다.
- `auth_token`은 WebSocket 업그레이드 중에 HTTP 헤더로 전송됩니다; TLS를 사용하세요.
- 스푸핑된 태스크 디스패치를 방지하기 위해 `hmac_secret`과 함께 `require_inbound_sig`를 활성화하세요.
