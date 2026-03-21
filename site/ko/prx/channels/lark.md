---
title: Lark / Feishu
description: PRX를 Lark (국제) 또는 Feishu (중국) IM에 연결합니다
---

# Lark / Feishu

> WebSocket 장기 연결 또는 HTTP 웹훅 이벤트 전달을 사용하는 Open Platform API를 통해 PRX를 Lark (국제) 또는 Feishu (중국 본토)에 연결합니다.

## 사전 요구 사항

- Lark 또는 Feishu 테넌트 (조직)
- [Lark 개발자 콘솔](https://open.larksuite.com/app) 또는 [Feishu 개발자 콘솔](https://open.feishu.cn/app)에서 생성된 앱
- 개발자 콘솔의 App ID, App Secret, Verification Token

## 빠른 설정

### 1. 봇 앱 생성

1. 개발자 콘솔에서 새 Custom App을 생성합니다
2. "Credentials"에서 **App ID**와 **App Secret**을 복사합니다
3. "Event Subscriptions"에서 **Verification Token**을 복사합니다
4. 봇 기능을 추가하고 권한을 설정합니다:
   - `im:message`, `im:message.group_at_msg`, `im:message.p2p_msg`

### 2. 설정

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
verification_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["ou_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"]
```

Feishu (중국)의 경우:

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
verification_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
use_feishu = true
allowed_users = ["*"]
```

### 3. 확인

```bash
prx channel doctor lark
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `app_id` | `String` | *필수* | Lark/Feishu 개발자 콘솔의 App ID |
| `app_secret` | `String` | *필수* | 개발자 콘솔의 App Secret |
| `verification_token` | `String` | `null` | 웹훅 검증을 위한 Verification Token |
| `encrypt_key` | `String` | `null` | 웹훅 메시지 복호화를 위한 Encrypt Key |
| `allowed_users` | `[String]` | `[]` | 허용된 사용자 ID 또는 Union ID. 비어 있으면 = 모두 거부. `"*"` = 모두 허용 |
| `mention_only` | `bool` | `false` | true일 때 그룹에서 @멘션에만 응답합니다. DM은 항상 처리됩니다 |
| `use_feishu` | `bool` | `false` | true일 때 Lark (국제) 대신 Feishu (중국) API 엔드포인트를 사용합니다 |
| `receive_mode` | `String` | `"websocket"` | 이벤트 수신 모드: `"websocket"` (기본값, 공개 URL 불필요) 또는 `"webhook"` |
| `port` | `u16` | `null` | 웹훅 모드 전용 HTTP 포트. `receive_mode = "webhook"`일 때 필수이며 websocket에서는 무시됩니다 |

## 기능

- **WebSocket 장기 연결** -- 공개 URL 없이 실시간 이벤트를 위한 영구 WSS 연결 (기본 모드)
- **HTTP 웹훅 모드** -- 필요한 환경을 위한 HTTP 콜백을 통한 대체 이벤트 전달
- **Lark 및 Feishu 지원** -- Lark (국제)과 Feishu (중국) 간 API 엔드포인트를 자동으로 전환합니다
- **확인 리액션** -- 수신 메시지에 로케일에 맞는 리액션으로 응답합니다 (zh-CN, zh-TW, en, ja)
- **DM 및 그룹 메시징** -- 개인 채팅과 그룹 대화를 모두 처리합니다
- **테넌트 액세스 토큰 관리** -- 테넌트 액세스 토큰을 자동으로 획득하고 갱신합니다
- **메시지 중복 제거** -- 30분 윈도우 내에서 WebSocket 메시지의 이중 전달을 방지합니다

## 제한 사항

- WebSocket 모드는 Lark/Feishu 서버로의 안정적인 아웃바운드 연결이 필요합니다
- 웹훅 모드는 공개 접근 가능한 HTTPS 엔드포인트가 필요합니다
- 봇이 그룹 메시지를 수신하려면 그룹에 추가되어야 합니다
- Feishu와 Lark는 서로 다른 API 도메인을 사용합니다; `use_feishu`가 테넌트 지역과 일치하는지 확인하세요
- 테넌트의 관리자 정책에 따라 기업 앱 승인이 필요할 수 있습니다

## 문제 해결

### 봇이 메시지를 수신하지 않음
- websocket 모드에서 `open.larksuite.com` (또는 `open.feishu.cn`)으로의 아웃바운드 연결이 허용되는지 확인합니다
- 앱에 필요한 `im:message` 권한이 있고 승인/배포되었는지 확인합니다
- 봇이 그룹에 추가되었거나 사용자가 봇과 DM을 시작했는지 확인합니다

### 웹훅 이벤트에서 "Verification failed"
- `verification_token`이 개발자 콘솔의 값과 일치하는지 확인합니다
- `encrypt_key`를 사용하는 경우 콘솔 설정과 정확히 일치하는지 확인합니다

### 잘못된 API 지역
- Feishu (중국) 테넌트를 사용하는 경우 `use_feishu = true`를 설정합니다
- Lark (국제) 테넌트를 사용하는 경우 `use_feishu = false` (기본값)인지 확인합니다
