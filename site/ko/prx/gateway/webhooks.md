---
title: 웹훅
description: PRX 이벤트 및 통합을 위한 아웃바운드 웹훅 알림입니다.
---

# 웹훅

PRX는 에이전트 이벤트를 외부 서비스에 알리기 위한 아웃바운드 웹훅을 지원합니다. 웹훅을 통해 CI/CD 시스템, 모니터링 도구, 사용자 정의 워크플로와 통합할 수 있습니다.

## 개요

설정되면 PRX는 특정 이벤트 발생 시 등록된 웹훅 URL로 HTTP POST 요청을 전송합니다:

- **session.created** -- 새 에이전트 세션이 시작됨
- **session.completed** -- 에이전트 세션이 완료됨
- **tool.executed** -- 도구가 호출되어 완료됨
- **error.occurred** -- 오류가 발생함

## 설정

```toml
[[gateway.webhooks]]
url = "https://example.com/webhook"
secret = "your-webhook-secret"
events = ["session.completed", "error.occurred"]
timeout_secs = 10
max_retries = 3
```

## 페이로드 형식

웹훅 페이로드는 표준 필드를 포함하는 JSON 객체입니다:

```json
{
  "event": "session.completed",
  "timestamp": "2026-03-21T10:00:00Z",
  "data": { }
}
```

## 서명 검증

각 웹훅 요청에는 설정된 시크릿으로 페이로드의 HMAC-SHA256 서명을 포함하는 `X-PRX-Signature` 헤더가 포함됩니다.

## 관련 페이지

- [게이트웨이 개요](./)
- [HTTP API](./http-api)
