---
title: Mattermost
description: REST API를 통해 PRX를 Mattermost에 연결합니다
---

# Mattermost

> 오픈소스 자체 호스팅 Slack 대안에서 메시징을 위해 REST API v4를 사용하여 PRX를 Mattermost에 연결합니다.

## 사전 요구 사항

- Mattermost 서버 (자체 호스팅 또는 클라우드)
- 개인 액세스 토큰이 있는 Mattermost 봇 계정
- 봇이 작동할 채널에 초대

## 빠른 설정

### 1. 봇 계정 생성

1. **System Console > Integrations > Bot Accounts**에서 봇 계정을 활성화합니다
2. **Integrations > Bot Accounts > Add Bot Account**로 이동합니다
3. 사용자명, 표시 이름, 역할을 설정합니다
4. 생성된 **Access Token**을 복사합니다

또는 일반 사용자 계정을 생성하고 **Profile > Security > Personal Access Tokens**에서 개인 액세스 토큰을 생성합니다.

### 2. 설정

```toml
[channels_config.mattermost]
url = "https://mattermost.example.com"
bot_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
channel_id = "abc123def456ghi789"
allowed_users = ["user123456"]
```

### 3. 확인

```bash
prx channel doctor mattermost
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `url` | `String` | *필수* | Mattermost 서버 URL (예: `"https://mattermost.example.com"`) |
| `bot_token` | `String` | *필수* | 봇 액세스 토큰 또는 개인 액세스 토큰 |
| `channel_id` | `String` | `null` | 봇을 단일 채널로 제한하기 위한 선택적 채널 ID |
| `allowed_users` | `[String]` | `[]` | 허용된 Mattermost 사용자 ID. 비어 있으면 = 모두 거부. `"*"` = 모두 허용 |
| `thread_replies` | `bool` | `true` | true일 때 원본 게시물에 스레드로 답장합니다. false일 때 채널 루트에 답장합니다 |
| `mention_only` | `bool` | `false` | true일 때 봇을 @멘션하는 메시지에만 응답합니다 |

## 기능

- **REST API v4** -- 메시지 송수신을 위해 표준 Mattermost API를 사용합니다
- **스레드 답장** -- 원래 스레드 내에서 자동으로 답장합니다
- **타이핑 표시** -- 응답 생성 중 타이핑 상태를 표시합니다
- **자체 호스팅 친화적** -- 외부 종속성 없이 모든 Mattermost 배포에서 작동합니다
- **채널 제한** -- `channel_id`로 봇을 단일 채널로 제한할 수 있습니다
- **멘션 필터링** -- 바쁜 채널에서 @멘션에만 응답합니다

## 제한 사항

- 메시지 전달에 WebSocket 대신 폴링을 사용하여 약간의 지연이 있습니다
- 봇이 메시지를 읽고 보내려면 채널의 멤버여야 합니다
- 봇 계정은 Mattermost System Console에서 시스템 관리자가 활성화해야 합니다
- 파일 첨부 처리는 현재 지원되지 않습니다
- URL의 후행 슬래시는 자동으로 제거됩니다

## 문제 해결

### 봇이 응답하지 않음
- `url`에 후행 슬래시가 없는지 확인합니다 (자동 제거되지만 재확인)
- 봇 토큰이 유효한지 확인합니다: `curl -H "Authorization: Bearer <token>" https://your-mm.com/api/v4/users/me`
- 봇이 채널에 추가되었는지 확인합니다

### 답장이 잘못된 위치에 게시됨
- `thread_replies = true`이면 원본 게시물의 `root_id`에 스레드로 답장합니다
- 원본 메시지가 스레드에 없으면 새 스레드가 생성됩니다
- 항상 채널 루트에 게시하려면 `thread_replies = false`를 설정합니다

### 봇이 채널의 모든 메시지에 응답함
- @멘션 시에만 응답하려면 `mention_only = true`를 설정합니다
- 또는 `channel_id`로 전용 채널로 제한합니다
