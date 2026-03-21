---
title: Discord
description: 봇 애플리케이션을 통해 PRX를 Discord에 연결합니다
---

# Discord

> 서버와 DM에서 실시간 메시징을 위한 Gateway WebSocket을 사용하는 봇 애플리케이션으로 PRX를 Discord에 연결합니다.

## 사전 요구 사항

- Discord 계정
- [Developer Portal](https://discord.com/developers/applications)에서 봇 사용자가 생성된 Discord 애플리케이션
- 적절한 권한으로 서버에 초대된 봇

## 빠른 설정

### 1. 봇 애플리케이션 생성

1. [Discord Developer Portal](https://discord.com/developers/applications)로 이동합니다
2. "New Application"을 클릭하고 이름을 지정합니다
3. "Bot" 섹션으로 이동하여 "Add Bot"을 클릭합니다
4. 봇 토큰을 복사합니다
5. "Privileged Gateway Intents"에서 **Message Content Intent**를 활성화합니다

### 2. 봇 초대

"OAuth2 > URL Generator"에서 초대 URL을 생성합니다:
- Scopes: `bot`
- Permissions: `Send Messages`, `Read Message History`, `Add Reactions`, `Attach Files`

### 3. 설정

```toml
[channels_config.discord]
bot_token = "MTIzNDU2Nzg5.XXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
allowed_users = ["123456789012345678"]
```

### 4. 확인

```bash
prx channel doctor discord
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `bot_token` | `String` | *필수* | Developer Portal에서 받은 Discord 봇 토큰 |
| `guild_id` | `String` | `null` | 봇을 단일 서버로 제한하기 위한 선택적 길드(서버) ID |
| `allowed_users` | `[String]` | `[]` | Discord 사용자 ID. 비어 있으면 = 모두 거부. `"*"` = 모두 허용 |
| `listen_to_bots` | `bool` | `false` | true이면 다른 봇의 메시지를 처리합니다 (자신의 메시지는 항상 무시) |
| `mention_only` | `bool` | `false` | true이면 봇을 @멘션한 메시지에만 응답합니다 |

## 기능

- **Gateway WebSocket** -- Discord의 Gateway API를 통한 실시간 메시지 전달
- **서버 및 DM 지원** -- 길드 채널과 다이렉트 메시지에서 응답합니다
- **텍스트 첨부 처리** -- `text/*` 첨부를 자동으로 가져와 인라인합니다
- **길드 제한** -- `guild_id`로 선택적으로 봇을 단일 서버로 제한합니다
- **봇 간 통신** -- 멀티 봇 워크플로를 위해 `listen_to_bots`를 활성화합니다
- **타이핑 표시** -- 응답 생성 중 타이핑 상태를 표시합니다

## 제한 사항

- Discord 메시지는 2,000자로 제한됩니다 (PRX가 자동으로 긴 응답을 분할)
- `text/*` MIME 타입 첨부만 가져와 인라인됩니다; 다른 파일 유형은 건너뜁니다
- 봇이 메시지 텍스트를 읽으려면 "Message Content Intent"가 활성화되어야 합니다
- Discord Gateway에 대한 안정적인 WebSocket 연결이 필요합니다

## 문제 해결

### 봇이 온라인이지만 응답하지 않음
- Developer Portal의 Bot 설정에서 "Message Content Intent"가 활성화되어 있는지 확인합니다
- 발신자의 Discord 사용자 ID가 `allowed_users`에 있는지 확인합니다
- 채널에서 봇에 `Send Messages` 및 `Read Message History` 권한이 있는지 확인합니다

### 봇이 일부 채널에서만 작동함
- `guild_id`가 설정된 경우 봇은 해당 특정 서버에서만 응답합니다
- 각 채널에 대해 올바른 권한으로 봇이 초대되었는지 확인합니다

### 다른 봇의 메시지가 무시됨
- 다른 봇 계정의 메시지를 처리하려면 `listen_to_bots = true`로 설정합니다
- 피드백 루프를 방지하기 위해 봇은 항상 자신의 메시지를 무시합니다
