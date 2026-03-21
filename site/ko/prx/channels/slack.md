---
title: Slack
description: Bot API와 Socket Mode를 통해 PRX를 Slack에 연결합니다
---

# Slack

> OAuth 토큰, 실시간 이벤트를 위한 Socket Mode, 스레드 대화 지원을 사용하여 PRX를 Slack에 연결합니다.

## 사전 요구 사항

- 앱을 설치할 권한이 있는 Slack 워크스페이스
- [api.slack.com/apps](https://api.slack.com/apps)에서 생성된 Slack 앱
- 봇 토큰(`xoxb-...`)과 선택적으로 Socket Mode용 앱 수준 토큰(`xapp-...`)

## 빠른 설정

### 1. Slack 앱 생성

1. [api.slack.com/apps](https://api.slack.com/apps)로 이동하여 "Create New App"을 클릭합니다
2. "From scratch"를 선택하고 워크스페이스를 선택합니다
3. "OAuth & Permissions"에서 다음 봇 스코프를 추가합니다:
   - `chat:write`, `channels:history`, `groups:history`, `im:history`, `mpim:history`
   - `files:read`, `files:write`, `reactions:write`, `users:read`
4. 워크스페이스에 앱을 설치하고 **Bot User OAuth Token**(`xoxb-...`)을 복사합니다

### 2. Socket Mode 활성화 (권장)

1. "Socket Mode"에서 활성화하고 `connections:write` 스코프로 앱 수준 토큰(`xapp-...`)을 생성합니다
2. "Event Subscriptions"에서 구독: `message.channels`, `message.groups`, `message.im`, `message.mpim`

### 3. 설정

```toml
[channels_config.slack]
bot_token = "xoxb-your-bot-token-here"
app_token = "xapp-your-app-token-here"
allowed_users = ["U01ABCDEF"]
```

### 4. 확인

```bash
prx channel doctor slack
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `bot_token` | `String` | *필수* | Slack 봇 OAuth 토큰 (`xoxb-...`) |
| `app_token` | `String` | `null` | Socket Mode용 앱 수준 토큰 (`xapp-...`). 이것이 없으면 폴링으로 대체됩니다 |
| `channel_id` | `String` | `null` | 봇을 단일 채널로 제한합니다. 생략하거나 `"*"`로 설정하면 모든 채널에서 수신합니다 |
| `allowed_users` | `[String]` | `[]` | Slack 사용자 ID. 비어 있으면 = 모두 거부. `"*"` = 모두 허용 |
| `interrupt_on_new_message` | `bool` | `false` | true이면 같은 발신자의 새 메시지가 진행 중인 요청을 취소합니다 |
| `thread_replies` | `bool` | `true` | true이면 원래 스레드에서 응답합니다. false이면 채널 루트에 응답합니다 |
| `mention_only` | `bool` | `false` | true이면 @멘션에만 응답합니다. DM은 항상 처리됩니다 |

## 기능

- **Socket Mode** -- 공개 URL 없이 실시간 이벤트 전달 (`app_token` 필요)
- **스레드 응답** -- 원래 스레드 내에서 자동으로 응답합니다
- **파일 첨부** -- 텍스트 파일을 다운로드하여 인라인합니다; 5 MB까지 이미지를 처리합니다
- **사용자 표시 이름** -- Slack 사용자 ID를 표시 이름으로 해석하며 캐싱합니다 (6시간 TTL)
- **멀티 채널 지원** -- 여러 채널에서 수신하거나 하나로 제한합니다
- **타이핑 표시** -- 응답 생성 중 타이핑 상태를 표시합니다
- **중단 지원** -- 사용자가 후속 메시지를 보내면 진행 중인 요청을 취소합니다

## 제한 사항

- Slack 메시지는 40,000자로 제한됩니다 (보통 문제가 되지 않음)
- 파일 다운로드는 텍스트의 경우 256 KB, 이미지의 경우 5 MB로 제한됩니다
- 메시지당 최대 8개의 파일 첨부를 처리합니다
- Socket Mode는 앱 수준 토큰에 `connections:write` 스코프가 필요합니다
- Socket Mode(`app_token`) 없이는 더 높은 지연시간의 폴링으로 대체됩니다

## 문제 해결

### 봇이 메시지를 수신하지 않음
- Socket Mode가 활성화되어 있고 `app_token`이 올바른지 확인합니다
- "Event Subscriptions"에 필요한 `message.*` 이벤트가 포함되어 있는지 확인합니다
- 봇이 채널에 초대되었는지 확인합니다 (`/invite @botname`)

### 응답이 스레드 대신 채널로 이동
- `thread_replies`가 `false`로 설정되지 않았는지 확인합니다
- 스레드 응답은 원본 메시지에 `thread_ts`가 있어야 합니다

### 파일 첨부가 처리되지 않음
- 봇에 `files:read` 스코프가 있는지 확인합니다
- `text/*` 및 일반적인 이미지 MIME 타입만 지원됩니다
- 크기 제한을 초과하는 파일은 조용히 건너뜁니다
