---
title: API 레퍼런스
description: PRX 게이트웨이의 완전한 REST API 레퍼런스 -- 세션, 채널, 훅, MCP, 플러그인, 스킬, 상태, 설정, 로그.
---

# API 레퍼런스

이 페이지는 PRX 게이트웨이가 노출하는 모든 REST API 엔드포인트를 문서화합니다. API는 Axum 기반으로 구축되며 요청과 응답 본문에 JSON을 사용합니다. 모든 엔드포인트는 `/api/v1` 접두사가 붙습니다.

## 기본 URL

```
http://127.0.0.1:3120/api/v1
```

호스트와 포트는 설정 가능합니다:

```toml
[gateway]
host = "127.0.0.1"
port = 3120
```

## 인증

별도로 명시되지 않는 한 모든 API 엔드포인트는 Bearer 토큰이 필요합니다.

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3120/api/v1/status
```

토큰 생성:

```bash
prx auth token
```

## 세션

에이전트 세션 관리 -- 생성, 목록 조회, 상세 조회, 종료.

### POST /api/v1/sessions

새 에이전트 세션을 생성합니다.

**요청:**

```json
{
  "channel": "api",
  "user_id": "user_123",
  "metadata": {
    "source": "web-app"
  }
}
```

**응답 (201):**

```json
{
  "id": "sess_abc123",
  "channel": "api",
  "user_id": "user_123",
  "status": "active",
  "created_at": "2026-03-21T10:00:00Z",
  "metadata": {
    "source": "web-app"
  }
}
```

### GET /api/v1/sessions

활성 세션 목록을 조회합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `status` | `String` | `"active"` | 상태별 필터: `"active"`, `"idle"`, `"terminated"` |
| `channel` | `String` | *전체* | 채널 이름별 필터 |
| `limit` | `usize` | `50` | 반환할 최대 결과 수 |
| `offset` | `usize` | `0` | 페이지네이션 오프셋 |

**응답 (200):**

```json
{
  "sessions": [
    {
      "id": "sess_abc123",
      "channel": "api",
      "user_id": "user_123",
      "status": "active",
      "created_at": "2026-03-21T10:00:00Z",
      "last_activity": "2026-03-21T10:15:00Z"
    }
  ],
  "total": 1
}
```

### GET /api/v1/sessions/:id

특정 세션의 상세 정보를 조회합니다.

**응답 (200):**

```json
{
  "id": "sess_abc123",
  "channel": "api",
  "user_id": "user_123",
  "status": "active",
  "created_at": "2026-03-21T10:00:00Z",
  "last_activity": "2026-03-21T10:15:00Z",
  "turn_count": 12,
  "token_usage": {
    "input": 4500,
    "output": 3200
  },
  "metadata": {
    "source": "web-app"
  }
}
```

### DELETE /api/v1/sessions/:id

세션을 종료합니다.

**응답 (204):** 콘텐츠 없음.

## 채널

메시징 채널 연결을 조회하고 관리합니다.

### GET /api/v1/channels

설정된 모든 채널과 연결 상태를 조회합니다.

**응답 (200):**

```json
{
  "channels": [
    {
      "name": "telegram",
      "status": "connected",
      "connected_at": "2026-03-21T08:00:00Z",
      "active_sessions": 3
    },
    {
      "name": "discord",
      "status": "disconnected",
      "error": "Invalid bot token"
    }
  ]
}
```

### POST /api/v1/channels/:name/restart

특정 채널 연결을 재시작합니다.

**응답 (200):**

```json
{
  "name": "telegram",
  "status": "reconnecting"
}
```

### GET /api/v1/channels/:name/health

특정 채널의 상태를 확인합니다.

**응답 (200):**

```json
{
  "name": "telegram",
  "healthy": true,
  "latency_ms": 45,
  "last_message_at": "2026-03-21T10:14:55Z"
}
```

## 훅

외부 통합을 위한 웹훅 엔드포인트를 관리합니다.

### GET /api/v1/hooks

등록된 웹훅을 조회합니다.

**응답 (200):**

```json
{
  "hooks": [
    {
      "id": "hook_001",
      "url": "https://example.com/webhook",
      "events": ["session.created", "session.terminated"],
      "active": true,
      "created_at": "2026-03-20T12:00:00Z"
    }
  ]
}
```

### POST /api/v1/hooks

새 웹훅을 등록합니다.

**요청:**

```json
{
  "url": "https://example.com/webhook",
  "events": ["session.created", "message.received"],
  "secret": "whsec_xxxxxxxxxxx"
}
```

**응답 (201):**

```json
{
  "id": "hook_002",
  "url": "https://example.com/webhook",
  "events": ["session.created", "message.received"],
  "active": true,
  "created_at": "2026-03-21T10:20:00Z"
}
```

### DELETE /api/v1/hooks/:id

웹훅을 제거합니다.

**응답 (204):** 콘텐츠 없음.

## MCP

Model Context Protocol 서버 연결을 관리합니다.

### GET /api/v1/mcp

연결된 MCP 서버를 조회합니다.

**응답 (200):**

```json
{
  "servers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "status": "connected",
      "tools": ["read_file", "write_file", "list_directory"],
      "connected_at": "2026-03-21T08:00:00Z"
    }
  ]
}
```

### POST /api/v1/mcp/:name/reconnect

MCP 서버에 재연결합니다.

**응답 (200):**

```json
{
  "name": "filesystem",
  "status": "reconnecting"
}
```

## 플러그인

WASM 플러그인을 관리합니다.

### GET /api/v1/plugins

설치된 플러그인과 상태를 조회합니다.

**응답 (200):**

```json
{
  "plugins": [
    {
      "name": "weather",
      "version": "1.2.0",
      "status": "loaded",
      "capabilities": ["tool:get_weather", "tool:get_forecast"],
      "memory_usage_bytes": 2097152
    }
  ]
}
```

### POST /api/v1/plugins/:name/reload

플러그인을 리로드합니다 (언로드 후 다시 로드).

**응답 (200):**

```json
{
  "name": "weather",
  "status": "loaded",
  "version": "1.2.0"
}
```

### POST /api/v1/plugins/:name/disable

플러그인을 언로드하지 않고 비활성화합니다.

**응답 (200):**

```json
{
  "name": "weather",
  "status": "disabled"
}
```

## 스킬

등록된 에이전트 스킬을 조회합니다.

### GET /api/v1/skills

사용 가능한 모든 스킬을 조회합니다.

**응답 (200):**

```json
{
  "skills": [
    {
      "name": "code_review",
      "source": "builtin",
      "description": "Review code changes and provide feedback",
      "triggers": ["/review", "review this"]
    },
    {
      "name": "summarize",
      "source": "plugin:productivity",
      "description": "Summarize long text or conversations",
      "triggers": ["/summarize", "tldr"]
    }
  ]
}
```

## 상태

시스템 상태 및 건강 정보.

### GET /api/v1/status

전체 시스템 상태를 조회합니다.

**응답 (200):**

```json
{
  "status": "healthy",
  "version": "0.12.0",
  "uptime_secs": 86400,
  "active_sessions": 5,
  "channels": {
    "connected": 3,
    "total": 4
  },
  "plugins": {
    "loaded": 2,
    "total": 2
  },
  "memory": {
    "backend": "sqlite",
    "entries": 1542
  },
  "provider": {
    "name": "anthropic",
    "model": "claude-sonnet-4-20250514"
  }
}
```

### GET /api/v1/status/health

경량 상태 확인 (로드 밸런서 프로브에 적합).

**응답 (200):**

```json
{
  "healthy": true
}
```

## 설정

런타임 설정을 읽고 업데이트합니다.

### GET /api/v1/config

현재 런타임 설정을 조회합니다 (시크릿은 마스킹됨).

**응답 (200):**

```json
{
  "agent": {
    "max_turns": 50,
    "max_tool_calls_per_turn": 10,
    "session_timeout_secs": 3600
  },
  "memory": {
    "backend": "sqlite"
  },
  "channels_config": {
    "telegram": {
      "bot_token": "***REDACTED***",
      "allowed_users": ["123456789"]
    }
  }
}
```

### PATCH /api/v1/config

런타임에 설정 값을 업데이트합니다. 변경 사항은 핫 리로드를 통해 적용됩니다.

**요청:**

```json
{
  "agent.max_turns": 100,
  "memory.top_k": 15
}
```

**응답 (200):**

```json
{
  "updated": ["agent.max_turns", "memory.top_k"],
  "reload_required": false
}
```

일부 설정 변경은 전체 재시작이 필요하며 핫 리로드할 수 없습니다. 응답에서 `"reload_required": true`로 이를 표시합니다.

## 로그

에이전트 로그 및 진단을 조회합니다.

### GET /api/v1/logs

최근 로그 항목을 스트리밍하거나 조회합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `level` | `String` | `"info"` | 최소 로그 수준: `"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"` |
| `module` | `String` | *전체* | 모듈 이름별 필터 (예: `"agent"`, `"channel::telegram"`) |
| `since` | `String` | *1시간 전* | ISO 8601 타임스탬프 또는 기간 (예: `"1h"`, `"30m"`) |
| `limit` | `usize` | `100` | 반환할 최대 항목 수 |
| `stream` | `bool` | `false` | true일 때 Server-Sent Events 스트림을 반환합니다 |

**응답 (200):**

```json
{
  "entries": [
    {
      "timestamp": "2026-03-21T10:15:30.123Z",
      "level": "info",
      "module": "agent::loop",
      "message": "Tool call completed: shell (45ms)",
      "session_id": "sess_abc123"
    }
  ],
  "total": 1
}
```

### GET /api/v1/logs/stream

실시간 로그 테일링을 위한 Server-Sent Events 스트림.

```bash
curl -N -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/logs/stream?level=info
```

## 오류 응답

모든 엔드포인트는 일관된 형식으로 오류를 반환합니다:

```json
{
  "error": {
    "code": "not_found",
    "message": "Session sess_xyz not found",
    "details": null
  }
}
```

| HTTP 상태 | 오류 코드 | 설명 |
|-----------|----------|------|
| 400 | `bad_request` | 잘못된 요청 파라미터 또는 본문 |
| 401 | `unauthorized` | Bearer 토큰 누락 또는 무효 |
| 403 | `forbidden` | 토큰에 필요한 권한이 없음 |
| 404 | `not_found` | 리소스가 존재하지 않음 |
| 409 | `conflict` | 리소스 상태 충돌 (예: 이미 종료된 세션) |
| 429 | `rate_limited` | 요청이 너무 많음; 표시된 지연 후 재시도 |
| 500 | `internal_error` | 예상치 못한 서버 오류 |

## 속도 제한

API는 토큰당 속도 제한을 적용합니다:

| 엔드포인트 그룹 | 제한 |
|----------------|------|
| 세션 (쓰기) | 10 요청/초 |
| 세션 (읽기) | 50 요청/초 |
| 설정 (쓰기) | 5 요청/초 |
| 기타 모든 엔드포인트 | 30 요청/초 |

속도 제한 헤더가 모든 응답에 포함됩니다:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1711015230
```

## 관련 페이지

- [게이트웨이 개요](./)
- [HTTP API](./http-api) -- HTTP API 계층 개요
- [WebSocket](./websocket) -- 실시간 WebSocket API
- [웹훅](./webhooks) -- 아웃바운드 웹훅 설정
- [미들웨어](./middleware) -- 요청/응답 미들웨어 파이프라인
