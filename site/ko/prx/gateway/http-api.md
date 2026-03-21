---
title: HTTP API
description: PRX 게이트웨이의 RESTful HTTP API 레퍼런스입니다.
---

# HTTP API

PRX 게이트웨이는 에이전트 세션 관리, 메시지 전송, 시스템 상태 조회를 위한 RESTful HTTP API를 노출합니다.

## 기본 URL

기본적으로 API는 `http://127.0.0.1:3120/api/v1`에서 사용할 수 있습니다.

## 엔드포인트

### 세션

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/sessions` | 새 에이전트 세션 생성 |
| `GET` | `/sessions` | 활성 세션 목록 조회 |
| `GET` | `/sessions/:id` | 세션 상세 조회 |
| `DELETE` | `/sessions/:id` | 세션 종료 |

### 메시지

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/sessions/:id/messages` | 에이전트에 메시지 전송 |
| `GET` | `/sessions/:id/messages` | 메시지 기록 조회 |

### 시스템

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/health` | 상태 확인 |
| `GET` | `/info` | 시스템 정보 |
| `GET` | `/metrics` | Prometheus 메트릭 |

## 인증

API 요청은 Bearer 토큰이 필요합니다:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3120/api/v1/sessions
```

## 관련 페이지

- [게이트웨이 개요](./)
- [WebSocket](./websocket)
- [미들웨어](./middleware)
