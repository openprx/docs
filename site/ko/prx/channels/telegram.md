---
title: Telegram
description: Bot API를 통해 PRX를 Telegram에 연결합니다
---

# Telegram

> DM, 그룹, 스트리밍 응답, 미디어 첨부를 지원하는 공식 Bot API를 사용하여 PRX를 Telegram에 연결합니다.

## 사전 요구 사항

- Telegram 계정
- [@BotFather](https://t.me/BotFather)에서 받은 봇 토큰
- 허용할 사용자의 Telegram 사용자 ID 또는 사용자 이름

## 빠른 설정

### 1. 봇 생성

1. Telegram을 열고 [@BotFather](https://t.me/BotFather)에게 메시지를 보냅니다
2. `/newbot`을 보내고 프롬프트에 따라 봇 이름을 지정합니다
3. 봇 토큰을 복사합니다 (형식: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### 2. 설정

PRX 설정 파일에 다음을 추가합니다:

```toml
[channels_config.telegram]
bot_token = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
allowed_users = ["123456789", "your_username"]
```

`allowed_users`를 비워두면 PRX는 **페어링 모드**에 진입하여 일회용 바인드 코드를 생성합니다. Telegram 계정에서 `/bind <code>`를 보내 페어링합니다.

### 3. 확인

```bash
prx channel doctor telegram
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `bot_token` | `String` | *필수* | @BotFather에서 받은 Telegram Bot API 토큰 |
| `allowed_users` | `[String]` | `[]` | Telegram 사용자 ID 또는 사용자 이름. 비어 있으면 = 페어링 모드. `"*"` = 모두 허용 |
| `stream_mode` | `String` | `"none"` | 스트리밍 모드: `"none"`, `"edit"` 또는 `"typing"`. edit 모드는 응답 메시지를 점진적으로 업데이트합니다 |
| `draft_update_interval_ms` | `u64` | `500` | 속도 제한을 피하기 위한 초안 메시지 편집 간 최소 간격(ms) |
| `interrupt_on_new_message` | `bool` | `false` | true이면 같은 발신자의 새 메시지가 진행 중인 요청을 취소합니다 |
| `mention_only` | `bool` | `false` | true이면 그룹에서 @멘션에만 응답합니다. DM은 항상 처리됩니다 |
| `ack_reactions` | `bool` | *상속* | 전역 `ack_reactions` 설정의 재정의. 설정하지 않으면 `[channels_config].ack_reactions`로 대체됩니다 |

## 기능

- **다이렉트 메시지 및 그룹 채팅** -- DM과 그룹 대화에 응답합니다
- **스트리밍 응답** -- 점진적 메시지 편집으로 생성되는 응답을 표시합니다
- **페어링 모드** -- 허용된 사용자가 구성되지 않은 경우 안전한 일회용 코드 바인딩
- **미디어 첨부** -- 문서, 사진, 캡션을 처리합니다
- **긴 메시지 분할** -- Telegram의 4096자 제한을 초과하는 응답을 단어 경계에서 자동 분할합니다
- **확인 리액션** -- 수신 확인을 위해 수신 메시지에 리액션합니다
- **음성 전사** -- STT가 구성된 경우 음성 메시지를 전사합니다

## 제한 사항

- Telegram은 텍스트 메시지를 4,096자로 제한합니다 (PRX가 자동으로 긴 메시지를 분할)
- Bot API 폴링은 웹훅 모드에 비해 약간의 지연이 있습니다
- 봇은 대화를 먼저 시작할 수 없습니다; 사용자가 봇에게 먼저 메시지를 보내야 합니다
- Bot API를 통한 파일 업로드는 50 MB로 제한됩니다

## 문제 해결

### 봇이 메시지에 응답하지 않음
- `prx channel doctor telegram`으로 봇 토큰이 올바른지 확인합니다
- 발신자의 사용자 ID 또는 사용자 이름이 `allowed_users`에 있는지 확인합니다
- `allowed_users`가 비어 있으면 먼저 `/bind <code>`로 페어링합니다

### 스트리밍 시 속도 제한 오류
- `draft_update_interval_ms`를 늘립니다 (예: `1000` 이상)
- Telegram은 메시지 편집에 채팅별 속도 제한을 적용합니다

### 봇이 DM에서는 응답하지만 그룹에서는 응답하지 않음
- `mention_only`가 `false`로 설정되어 있는지 확인하거나 봇을 @멘션합니다
- BotFather에서 "Group Privacy" 모드를 비활성화하여 봇이 모든 그룹 메시지를 볼 수 있도록 합니다
