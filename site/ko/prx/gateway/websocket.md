---
title: WebSocket
description: 실시간 스트리밍 에이전트 상호 작용을 위한 WebSocket 인터페이스입니다.
---

# WebSocket

PRX 게이트웨이는 에이전트 세션과의 실시간 양방향 통신을 위한 WebSocket 엔드포인트를 제공합니다. 이를 통해 스트리밍 응답, 실시간 도구 실행 업데이트, 대화형 대화가 가능합니다.

## 연결

다음 WebSocket 엔드포인트에 연결합니다:

```
ws://127.0.0.1:3120/ws/sessions/:id
```

## 메시지 프로토콜

메시지는 `type` 필드를 포함하는 JSON 객체로 교환됩니다:

### 클라이언트에서 서버로

- `message` -- 사용자 메시지 전송
- `cancel` -- 현재 에이전트 작업 취소
- `ping` -- 연결 유지 핑

### 서버에서 클라이언트로

- `token` -- 스트리밍 응답 토큰
- `tool_call` -- 에이전트가 도구를 호출 중
- `tool_result` -- 도구 실행 완료
- `done` -- 에이전트 응답 완료
- `error` -- 오류 발생
- `pong` -- 연결 유지 응답

## 설정

```toml
[gateway.websocket]
max_connections = 100
ping_interval_secs = 30
max_message_size_kb = 1024
```

## 관련 페이지

- [게이트웨이 개요](./)
- [HTTP API](./http-api)
