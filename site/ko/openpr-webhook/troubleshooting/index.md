---
title: 문제 해결
description: "OpenPR-Webhook의 일반적인 문제 해결. 401 서명 오류, 이벤트 필터링, CLI 에이전트, 터널 연결, 콜백 실패."
---

# 문제 해결

## 일반적인 문제

### 웹훅 POST에서 401 Unauthorized

**증상:** 모든 웹훅 요청이 HTTP 401을 반환합니다.

**원인:**

1. **서명 헤더 누락.** 요청에는 `X-Webhook-Signature` 또는 `X-OpenPR-Signature` 헤더가 `sha256={hex-digest}` 형식으로 포함되어야 합니다.

2. **잘못된 시크릿.** HMAC-SHA256 다이제스트는 `security.webhook_secrets`의 시크릿 중 하나와 일치해야 합니다. 전송 측과 수신 측이 동일한 시크릿 문자열을 사용하는지 확인하세요.

3. **본문 불일치.** 서명은 원시 요청 본문에 대해 계산됩니다. 프록시나 미들웨어가 본문을 수정하면(예: JSON 재인코딩) 서명이 일치하지 않습니다.

**디버그:**

```bash
# Enable debug logging
RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml

# Temporarily allow unsigned requests for testing
# (config.toml)
[security]
allow_unsigned = true
```

### 이벤트가 무시됨 (not_bot_task)

**증상:** 응답이 `{"status": "ignored", "reason": "not_bot_task"}`입니다.

**원인:** 웹훅 페이로드에 `bot_context.is_bot_task = true`가 없습니다. OpenPR-Webhook은 봇 태스크로 명시적으로 표시된 이벤트만 처리합니다.

**해결:** OpenPR 플랫폼이 웹훅 페이로드에 봇 컨텍스트를 포함하도록 설정되어 있는지 확인하세요:

```json
{
  "event": "issue.updated",
  "bot_context": {
    "is_bot_task": true,
    "bot_name": "my-agent",
    "bot_agent_type": "cli"
  },
  "data": { ... }
}
```

### 에이전트를 찾을 수 없음

**증상:** 응답이 `{"status": "no_agent", "bot_name": "..."}` 입니다.

**원인:** 설정된 에이전트 중 페이로드의 `bot_name` 또는 `bot_agent_type`과 일치하는 것이 없습니다.

**해결:**

1. `bot_name` 값과 일치하는 `id` 또는 `name`을 가진 에이전트가 설정되어 있는지 확인
2. 에이전트의 `agent_type`이 `bot_agent_type`과 일치하는지 확인
3. 에이전트 이름 매칭은 대소문자를 무시하지만 `id` 매칭은 정확합니다

### CLI 에이전트가 "disabled" 반환

**증상:** CLI 디스패치가 `"cli disabled by feature flag or safe mode"`를 반환합니다.

**원인:**

1. `features.cli_enabled`가 `true`로 설정되지 않음
2. `OPENPR_WEBHOOK_SAFE_MODE` 환경 변수가 설정됨

**해결:**

```toml
[features]
cli_enabled = true
```

그리고 안전 모드가 활성화되지 않았는지 확인하세요:

```bash
echo $OPENPR_WEBHOOK_SAFE_MODE
# Should be empty or unset
```

### CLI 실행기 "not allowed"

**증상:** 오류 메시지 `"executor not allowed: {name}"`.

**원인:** CLI 에이전트 설정의 `executor` 필드에 화이트리스트에 없는 값이 있습니다.

**허용된 실행기:**
- `codex`
- `claude-code`
- `opencode`

다른 값은 보안상의 이유로 거부됩니다.

### 터널 연결 실패

**증상:** 로그 메시지에 `tunnel connect failed: ...`가 반복적으로 표시됩니다.

**원인:**

1. **잘못된 URL.** 터널 URL은 `wss://` 또는 `ws://`로 시작해야 합니다.
2. **네트워크 문제.** 컨트롤 플레인 서버에 접근할 수 있는지 확인하세요.
3. **인증 실패.** `tunnel.auth_token`이 올바른지 확인하세요.
4. **필수 필드 누락.** `tunnel.agent_id`와 `tunnel.auth_token`은 비어있지 않아야 합니다.

**디버그:**

```bash
# Test WebSocket connectivity manually
# (requires wscat or websocat)
wscat -c wss://control.example.com/ws -H "Authorization: Bearer your-token"
```

### 터널이 계속 재연결됨

**증상:** 로그에 루프에서 `tunnel disconnected, reconnecting in Ns`가 표시됩니다.

**정상 동작:** 터널은 지수 백오프(최대 `tunnel_reconnect_backoff_max_secs`)로 자동 재연결합니다. 연결 끊김 이유에 대한 컨트롤 플레인 로그를 확인하세요.

**튜닝:**

```toml
[tunnel]
reconnect_secs = 3        # Base retry interval
heartbeat_secs = 20       # Keep-alive interval

[runtime]
tunnel_reconnect_backoff_max_secs = 120  # Max backoff
```

### 콜백 실패

**증상:** 로그에 `start callback failed: ...` 또는 `final callback failed: ...`가 표시됩니다.

**원인:**

1. **callback_enabled가 false.** 콜백은 `features.callback_enabled = true`가 필요합니다.
2. **잘못된 callback_url.** URL에 접근할 수 있는지 확인하세요.
3. **인증 실패.** 콜백 엔드포인트에 인증이 필요한 경우 `callback_token`을 설정하세요.
4. **타임아웃.** 기본 HTTP 타임아웃은 15초입니다. `runtime.http_timeout_secs`로 늘리세요.

### OpenClaw/Custom 에이전트 실행 오류

**증상:** 응답에 `exec_error: ...` 또는 `error: ...`가 포함됩니다.

**원인:**

1. **바이너리를 찾을 수 없음.** `command` 경로가 존재하고 실행 가능한지 확인하세요.
2. **권한 거부됨.** openpr-webhook 프로세스에 실행 권한이 있어야 합니다.
3. **의존성 누락.** CLI 도구에 다른 프로그램이나 라이브러리가 필요할 수 있습니다.

**디버그:**

```bash
# Test the command manually
/usr/local/bin/openclaw --channel signal --target "+1234567890" --message "test"
```

## 진단 체크리스트

1. **서비스 헬스 확인:**
   ```bash
   curl http://localhost:9000/health
   # Should return: ok
   ```

2. **로드된 에이전트 확인:**
   시작 로그에서 `Loaded N agent(s)`를 확인합니다.

3. **디버그 로깅 활성화:**
   ```bash
   RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml
   ```

4. **서명 수동 확인:**
   ```bash
   echo -n '{"event":"test"}' | openssl dgst -sha256 -hmac "your-secret"
   ```

5. **서명되지 않은 요청으로 테스트 (개발 전용):**
   ```toml
   [security]
   allow_unsigned = true
   ```

6. **안전 모드 상태 확인:**
   ```bash
   # If set, tunnel/cli/callback are force-disabled
   echo $OPENPR_WEBHOOK_SAFE_MODE
   ```

## 로그 메시지 레퍼런스

| 로그 레벨 | 메시지 | 의미 |
|----------|---------|------|
| INFO | `Loaded N agent(s)` | 설정이 성공적으로 로드됨 |
| INFO | `openpr-webhook listening on ...` | 서버가 시작됨 |
| INFO | `Received webhook event: ...` | 인바운드 이벤트가 파싱됨 |
| INFO | `Dispatching to agent: ...` | 에이전트가 매칭되어 디스패치 중 |
| INFO | `tunnel connected: ...` | WSS 터널이 연결됨 |
| WARN | `Invalid webhook signature` | 서명 검증 실패 |
| WARN | `No agent for bot_name=...` | 매칭되는 에이전트 없음 |
| WARN | `tunnel disconnected, reconnecting` | 터널 연결 끊김 |
| WARN | `tunnel using insecure ws:// transport` | TLS 미사용 |
| ERROR | `tunnel connect failed: ...` | WebSocket 연결 오류 |
| ERROR | `openclaw failed: ...` | OpenClaw 명령이 0이 아닌 값을 반환 |
