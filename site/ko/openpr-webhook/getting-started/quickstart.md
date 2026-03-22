---
title: 빠른 시작
description: "간단한 웹훅 전달 에이전트로 OpenPR-Webhook을 설정하고 시뮬레이션 이벤트로 테스트하는 단계별 가이드."
---

# 빠른 시작

이 가이드는 간단한 웹훅 전달 에이전트로 OpenPR-Webhook을 설정하고 시뮬레이션 이벤트로 엔드투엔드 테스트하는 과정을 안내합니다.

## 1단계: 설정 파일 생성

`config.toml` 파일을 생성합니다:

```toml
[server]
listen = "0.0.0.0:9000"

[security]
webhook_secrets = ["my-test-secret"]

[[agents]]
id = "echo-agent"
name = "Echo Agent"
agent_type = "webhook"

[agents.webhook]
url = "https://httpbin.org/post"
```

이 설정은:

- 포트 9000에서 수신 대기
- 시크릿 `my-test-secret`을 사용하여 HMAC-SHA256 서명 요구
- 테스트를 위해 봇 이벤트를 httpbin.org로 라우팅

## 2단계: 서비스 시작

```bash
./target/release/openpr-webhook config.toml
```

다음이 표시되어야 합니다:

```
INFO openpr_webhook: Loaded 1 agent(s)
INFO openpr_webhook: tunnel subsystem disabled (feature flag or safe mode)
INFO openpr_webhook: openpr-webhook listening on 0.0.0.0:9000
```

## 3단계: 테스트 이벤트 전송

테스트 페이로드에 대한 HMAC-SHA256 서명을 생성하고 전송합니다:

```bash
# The test payload
PAYLOAD='{"event":"issue.updated","bot_context":{"is_bot_task":true,"bot_name":"echo-agent","bot_agent_type":"webhook"},"data":{"issue":{"id":"42","key":"PROJ-42","title":"Fix login bug"}},"actor":{"name":"alice"},"project":{"name":"backend"}}'

# Compute HMAC-SHA256 signature
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

# Send the webhook
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

예상 응답:

```json
{
  "status": "dispatched",
  "agent": "echo-agent",
  "result": "webhook: 200 OK"
}
```

## 4단계: 필터링 테스트

`bot_context.is_bot_task = true`가 없는 이벤트는 무시됩니다:

```bash
PAYLOAD='{"event":"issue.created","data":{"issue":{"id":"1"}}}'
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

응답:

```json
{
  "status": "ignored",
  "reason": "not_bot_task"
}
```

## 5단계: 서명 거부 테스트

잘못된 서명은 HTTP 401을 반환합니다:

```bash
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=invalid" \
  -d '{"event":"test"}'
```

응답: `401 Unauthorized`

## 에이전트 매칭 이해

`is_bot_task = true`인 웹훅 이벤트가 도착하면 서비스는 다음 로직으로 에이전트를 매칭합니다:

1. **이름으로** -- `bot_context.bot_name`이 에이전트의 `id` 또는 `name`과 일치하면 (대소문자 무시)
2. **타입 폴백** -- 이름 매칭이 없으면, `agent_type`이 `bot_context.bot_agent_type`과 일치하는 첫 번째 에이전트 사용

에이전트가 매칭되지 않으면 응답에 `"status": "no_agent"`가 포함됩니다.

## 다음 단계

- [에이전트 타입](../agents/index.md) -- 5가지 에이전트 타입 모두 알아보기
- [실행기 레퍼런스](../agents/executors.md) -- 각 실행기 심층 분석
- [설정 레퍼런스](../configuration/index.md) -- 전체 TOML 스키마
