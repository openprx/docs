---
title: OpenPR-Webhook
description: "OpenPR 플랫폼용 웹훅 이벤트 디스패처 서비스. HMAC-SHA256 서명 검증, 봇 태스크 필터링, 5가지 에이전트 타입 지원."
---

# OpenPR-Webhook

OpenPR-Webhook은 [OpenPR](https://github.com/openprx/openpr)을 위한 웹훅 이벤트 디스패처 서비스입니다. OpenPR 플랫폼으로부터 웹훅 이벤트를 수신하고, 봇 컨텍스트를 기반으로 필터링하며, 처리를 위해 하나 이상의 설정 가능한 에이전트로 라우팅합니다.

## 동작 방식

OpenPR에서 이벤트가 발생하면 (예: 이슈 생성 또는 업데이트), 플랫폼은 이 서비스로 웹훅 POST 요청을 보냅니다. OpenPR-Webhook은 다음을 수행합니다:

1. **요청 검증** -- HMAC-SHA256 서명 검증 사용
2. **이벤트 필터링** -- `bot_context.is_bot_task = true`인 이벤트만 처리
3. **에이전트 라우팅** -- 이름 또는 타입으로 설정된 에이전트에 이벤트 매칭
4. **디스패치** -- 에이전트 액션 실행 (메시지 전송, CLI 도구 호출, 다른 웹훅으로 전달 등)

## 아키텍처 개요

```
OpenPR Platform
    |
    | POST /webhook (HMAC-SHA256 signed)
    v
+-------------------+
| openpr-webhook    |
|                   |
| Signature verify  |
| Event filter      |
| Agent matching    |
+-------------------+
    |           |           |
    v           v           v
 openclaw    webhook     cli agent
 (Signal/    (HTTP       (codex /
  Telegram)  forward)    claude-code)
```

## 주요 기능

- 멀티 시크릿 순환 지원이 있는 수신 웹훅의 **HMAC-SHA256 서명 검증**
- **봇 태스크 필터링** -- 봇을 위한 것이 아닌 이벤트는 무시
- **5가지 에이전트/실행기 타입** -- openclaw, openprx, webhook, custom, cli
- 유연한 알림 형식을 위한 플레이스홀더 변수가 있는 **메시지 템플릿**
- **상태 전환** -- 태스크 시작, 성공, 실패 시 이슈 상태 자동 업데이트
- **WSS 터널** (Phase B) -- 푸시 기반 태스크 디스패치를 위해 컨트롤 플레인과의 능동적 WebSocket 연결
- **MCP 폐루프 자동화** -- AI 에이전트가 전체 이슈 컨텍스트를 읽고 OpenPR MCP 도구를 통해 결과를 다시 기록
- **에이전트별 환경 변수** -- 에이전트별로 `OPENPR_BOT_TOKEN`, `OPENPR_API_URL` 등을 주입
- **안전 우선 기본값** -- 위험한 기능(터널, cli, 콜백)은 기본적으로 비활성화되며, 기능 플래그와 안전 모드로 제어

## 지원 에이전트 타입

| 타입 | 목적 | 프로토콜 |
|------|------|----------|
| `openclaw` | OpenClaw CLI를 통해 Signal/Telegram으로 알림 전송 | 셸 명령 |
| `openprx` | OpenPRX Signal API 또는 CLI를 통해 메시지 전송 | HTTP API / Shell |
| `webhook` | 전체 이벤트 페이로드를 HTTP 엔드포인트로 전달 | HTTP POST |
| `custom` | 메시지를 인수로 임의 셸 명령 실행 | 셸 명령 |
| `cli` | 이슈에 대해 AI 코딩 에이전트(codex, claude-code, opencode) 실행 | 서브프로세스 |

## 빠른 링크

- [설치](getting-started/installation.md)
- [빠른 시작](getting-started/quickstart.md)
- [에이전트 타입](agents/index.md)
- [실행기 레퍼런스](agents/executors.md)
- [WSS 터널](tunnel/index.md)
- [설정 레퍼런스](configuration/index.md)
- [문제 해결](troubleshooting/index.md)

## 저장소

소스 코드: [github.com/openprx/openpr-webhook](https://github.com/openprx/openpr-webhook)

라이선스: MIT OR Apache-2.0
