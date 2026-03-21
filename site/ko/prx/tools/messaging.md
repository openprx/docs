---
title: 메시징
description: 자동 라우팅과 저수준 게이트웨이 접근을 갖춘 통신 채널을 통해 메시지를 보내기 위한 도구입니다.
---

# 메시징

PRX는 에이전트가 통신 채널을 통해 메시지를 다시 보낼 수 있게 하는 두 가지 메시징 도구를 제공합니다. `message_send` 도구는 설정된 채널과 수신자에게 텍스트, 미디어, 음성 메시지를 보내기 위한 상위 수준 인터페이스이고, `gateway` 도구는 원시 메시지 전달을 위한 Axum HTTP/WebSocket 게이트웨이에 대한 저수준 접근을 제공합니다.

메시징 도구는 게이트웨이 수준에서 등록되며 채널이 활성일 때 사용할 수 있습니다. `message_send` 도구는 메시지를 활성 채널(Telegram, Discord, Slack, CLI 등)로 자동 라우팅하고, `gateway` 도구는 고급 사용 사례를 위한 직접 게이트웨이 프로토콜 접근을 제공합니다.

이 도구들은 인바운드 채널 시스템을 보완합니다. 채널이 사용자로부터 메시지를 수신하고 에이전트로 라우팅하는 것을 처리하는 반면, 메시징 도구는 아웃바운드 방향 -- 에이전트가 생성한 콘텐츠를 사용자에게 보내는 것을 처리합니다.

## 설정

메시징 도구는 전용 설정 섹션이 없습니다. 가용성은 채널 및 게이트웨이 설정에 따라 달라집니다:

```toml
# 게이트웨이 설정 (메시징 도구가 이에 의존)
[gateway]
host = "127.0.0.1"
port = 16830

# 채널 설정 (message_send가 활성 채널로 라우팅)
[channels_config]
cli = true
message_timeout_secs = 300

[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["alice", "bob"]
stream_mode = "partial"
```

`message_send` 도구는 최소 하나의 채널이 활성일 때 사용 가능합니다. `gateway` 도구는 항상 `all_tools()`에 등록됩니다.

## 도구 참조

### message_send

설정된 채널과 수신자에게 메시지를 보냅니다. 도구는 현재 대화가 이루어지는 채널인 활성 채널로 자동 라우팅합니다.

**텍스트 메시지 전송:**

```json
{
  "name": "message_send",
  "arguments": {
    "text": "The build completed successfully. All 42 tests passed.",
    "channel": "telegram"
  }
}
```

**미디어 (이미지/파일) 전송:**

```json
{
  "name": "message_send",
  "arguments": {
    "media_path": "/tmp/screenshot.png",
    "caption": "Current dashboard state",
    "channel": "telegram"
  }
}
```

**음성 메시지 전송:**

```json
{
  "name": "message_send",
  "arguments": {
    "voice_path": "/tmp/summary.mp3",
    "channel": "telegram"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `text` | `string` | 조건부 | -- | 텍스트 메시지 내용 (미디어/음성이 없을 때 필수) |
| `channel` | `string` | 아니오 | 활성 채널 | 대상 채널 이름 (생략 시 자동 감지) |
| `recipient` | `string` | 아니오 | 현재 사용자 | 수신자 식별자 (사용자 ID, 채팅 ID 등) |
| `media_path` | `string` | 아니오 | -- | 미디어 파일 경로 (이미지, 문서, 동영상) |
| `caption` | `string` | 아니오 | -- | 미디어 메시지 캡션 |
| `voice_path` | `string` | 아니오 | -- | 음성/오디오 파일 경로 |
| `reply_to` | `string` | 아니오 | -- | 답장할 메시지 ID (플랫폼별) |

### gateway

Axum HTTP/WebSocket 게이트웨이를 통한 원시 메시지 전송을 위한 저수준 게이트웨이 접근. 이 도구는 `message_send`가 불충분한 고급 사용 사례를 위한 것입니다.

```json
{
  "name": "gateway",
  "arguments": {
    "action": "send",
    "payload": {
      "type": "text",
      "content": "Raw gateway message",
      "target": "ws://localhost:16830/ws"
    }
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `action` | `string` | 예 | -- | 게이트웨이 액션: `"send"`, `"broadcast"`, `"status"` |
| `payload` | `object` | 조건부 | -- | 메시지 페이로드 (`"send"` 및 `"broadcast"`에 필수) |

## 사용법

### 자동 채널 라우팅

대부분의 경우 에이전트는 채널을 지정할 필요가 없습니다. 사용자가 Telegram을 통해 메시지를 보내면 에이전트의 응답은 자동으로 Telegram으로 라우팅됩니다:

```
사용자 (Telegram 경유): 날씨가 어때?
에이전트: [message_send를 text="현재 상하이 22도이고 맑습니다."로 호출]
       → 같은 채팅의 Telegram으로 자동 전송
```

### 크로스 채널 메시징

에이전트는 대화가 이루어지는 채널과 다른 채널로 메시지를 보낼 수 있습니다:

```json
{
  "name": "message_send",
  "arguments": {
    "text": "Build failed! Check CI logs.",
    "channel": "discord",
    "recipient": "111222333"
  }
}
```

이는 에이전트가 하나의 채널을 모니터링하고 다른 채널로 알림을 보내는 알림 워크플로우에 유용합니다.

### 미디어 전달

에이전트는 메시징 채널을 통해 파일, 이미지, 오디오를 보낼 수 있습니다:

1. 미디어 파일 생성 또는 다운로드
2. 임시 경로에 저장
3. `message_send`의 `media_path`로 전송

```
에이전트 사고: 사용자가 데이터 차트를 요청함.
  1. [shell] python3 generate_chart.py --output /tmp/chart.png
  2. [message_send] media_path="/tmp/chart.png", caption="월별 매출 차트"
```

### 음성 메시지

음성을 지원하는 채널(Telegram, WhatsApp, Discord)에서 에이전트는 오디오 메시지를 보낼 수 있습니다:

```
에이전트 사고: 사용자가 음성 요약을 요청함.
  1. [tts] text="오늘의 일일 요약입니다..." output="/tmp/summary.mp3"
  2. [message_send] voice_path="/tmp/summary.mp3"
```

## 채널 라우팅 상세

명시적 `channel` 파라미터 없이 `message_send`가 호출되면 PRX는 다음 로직으로 대상 채널을 결정합니다:

1. **활성 세션 채널**: 현재 에이전트 세션과 연결된 채널 (들어오는 메시지에 의해 세션이 생성될 때 설정)
2. **기본 채널**: 세션 채널이 설정되지 않으면 첫 번째 활성 채널로 대체
3. **CLI 대체**: 채널이 설정되지 않으면 stdout으로 출력

### 지원되는 채널 전송

| 채널 | 텍스트 | 미디어 | 음성 | 답장 |
|------|:------:|:------:|:----:|:----:|
| Telegram | 예 | 예 | 예 | 예 |
| Discord | 예 | 예 | 예 | 예 |
| Slack | 예 | 예 | 아니오 | 예 |
| WhatsApp | 예 | 예 | 예 | 예 |
| Signal | 예 | 예 | 아니오 | 예 |
| Matrix | 예 | 예 | 아니오 | 예 |
| Email | 예 | 예 (첨부) | 아니오 | 예 |
| CLI | 예 | 아니오 | 아니오 | 아니오 |

## 보안

### 채널 인증

아웃바운드 메시지는 인바운드 메시지와 동일한 채널 정책의 적용을 받습니다. 에이전트는 설정되고 활성인 채널에만 메시지를 보낼 수 있습니다. 설정되지 않은 채널로 보내려고 하면 오류가 반환됩니다.

### 수신자 검증

`recipient`가 지정되면 PRX는 대상 채널을 통해 수신자에 도달할 수 있는지 검증합니다. `allowed_users` 목록이 있는 채널의 경우 목록에 없는 수신자에게의 아웃바운드 메시지가 차단됩니다.

### 레이트 리밋

아웃바운드 메시지는 채널의 레이트 리밋(플랫폼별 설정)의 적용을 받습니다. 예를 들어, Telegram은 PRX가 자동 백오프로 준수하는 API 레이트 리밋을 강제합니다.

### 정책 엔진

메시징 도구는 보안 정책을 통해 제어할 수 있습니다:

```toml
[security.tool_policy.tools]
message_send = "allow"
gateway = "supervised"     # 원시 게이트웨이 접근에 승인 필요
```

### 감사 로깅

모든 아웃바운드 메시지가 감사 로그에 기록됩니다:

- 대상 채널 및 수신자
- 메시지 유형 (텍스트, 미디어, 음성)
- 타임스탬프
- 전달 상태

미디어 파일 경로는 로그되지만 파일 내용은 감사 로그에 저장되지 않습니다.

## 관련 페이지

- [채널 개요](/ko/prx/channels/) -- 지원되는 19개 메시징 플랫폼 전체
- [게이트웨이](/ko/prx/gateway/) -- HTTP API 및 WebSocket 아키텍처
- [게이트웨이 HTTP API](/ko/prx/gateway/http-api) -- REST API 엔드포인트
- [게이트웨이 WebSocket](/ko/prx/gateway/websocket) -- 실시간 스트리밍
- [렌더링 도구 (TTS)](/ko/prx/tools/media) -- 음성 메시지를 위한 텍스트 음성 변환
- [도구 개요](/ko/prx/tools/) -- 모든 도구 및 레지스트리 시스템
