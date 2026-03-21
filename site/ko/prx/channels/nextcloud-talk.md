---
title: Nextcloud Talk
description: OCS API를 통해 PRX를 Nextcloud Talk에 연결합니다
---

# Nextcloud Talk

> 자체 호스팅 팀 메시징을 위해 OCS API와 웹훅 기반 메시지 전달을 사용하여 PRX를 Nextcloud Talk에 연결합니다.

## 사전 요구 사항

- Talk 앱이 활성화된 Nextcloud 인스턴스 (버전 25 이상 권장)
- OCS API 인증을 위한 봇 앱 토큰
- 수신 메시지 전달을 위한 웹훅 설정

## 빠른 설정

### 1. 봇 앱 토큰 생성

Nextcloud에서 앱 비밀번호를 생성합니다:
1. **설정 > 보안 > 기기 및 세션**으로 이동합니다
2. 설명적인 이름 (예: "PRX Bot")으로 새 앱 비밀번호를 생성합니다
3. 생성된 토큰을 복사합니다

또는 Nextcloud Talk Bot API (Nextcloud 27 이상)의 경우:
1. `occ`를 사용하여 봇을 등록합니다: `php occ talk:bot:setup "PRX" <secret> <webhook-url>`

### 2. 설정

```toml
[channels_config.nextcloud_talk]
base_url = "https://cloud.example.com"
app_token = "xxxxx-xxxxx-xxxxx-xxxxx-xxxxx"
allowed_users = ["admin", "alice"]
```

### 3. 웹훅 설정

Nextcloud Talk 봇이 PRX의 게이트웨이 엔드포인트로 웹훅 이벤트를 전송하도록 설정합니다:

```
POST https://your-prx-domain.com/nextcloud-talk
```

### 4. 확인

```bash
prx channel doctor nextcloud_talk
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `base_url` | `String` | *필수* | Nextcloud 기본 URL (예: `"https://cloud.example.com"`) |
| `app_token` | `String` | *필수* | OCS API Bearer 인증을 위한 봇 앱 토큰 |
| `webhook_secret` | `String` | `null` | HMAC-SHA256 웹훅 서명 검증을 위한 공유 시크릿. `ZEROCLAW_NEXTCLOUD_TALK_WEBHOOK_SECRET` 환경 변수로도 설정 가능 |
| `allowed_users` | `[String]` | `[]` | 허용된 Nextcloud 액터 ID. 비어 있으면 = 모두 거부. `"*"` = 모두 허용 |

## 기능

- **웹훅 기반 전달** -- Nextcloud Talk의 HTTP 웹훅 푸시로 메시지를 수신합니다
- **OCS API 응답** -- Nextcloud Talk OCS REST API를 통해 응답을 전송합니다
- **HMAC-SHA256 검증** -- `webhook_secret`으로 선택적 웹훅 서명 검증
- **다중 페이로드 형식** -- 레거시/커스텀 형식과 Activity Streams 2.0 형식 (Nextcloud Talk 봇 웹훅)을 모두 지원합니다
- **자체 호스팅** -- 모든 데이터를 자체 인프라에 유지하면서 모든 Nextcloud 인스턴스에서 작동합니다

## 제한 사항

- 웹훅 전달을 위해 공개 접근 가능한 HTTPS 엔드포인트 (또는 리버스 프록시)가 필요합니다
- Nextcloud Talk 봇 API는 Nextcloud 27 이상에서 사용 가능합니다; 이전 버전은 커스텀 웹훅 설정이 필요합니다
- 봇이 메시지를 수신하려면 Talk 룸에 등록되어야 합니다
- 파일 및 미디어 첨부 처리는 현재 지원되지 않습니다
- 밀리초 타임스탬프를 사용하는 웹훅 페이로드는 자동으로 초 단위로 정규화됩니다

## 문제 해결

### 웹훅 이벤트가 수신되지 않음
- 웹훅 URL이 공개 접근 가능하고 `https://your-domain/nextcloud-talk`을 가리키는지 확인합니다
- 봇이 Talk 룸에 등록되어 있는지 확인합니다
- Nextcloud 서버 로그에서 웹훅 전달 오류를 확인합니다

### 서명 검증 실패
- `webhook_secret`이 봇 등록 시 사용된 시크릿과 일치하는지 확인합니다
- 시크릿은 설정 파일 또는 `ZEROCLAW_NEXTCLOUD_TALK_WEBHOOK_SECRET` 환경 변수로 설정할 수 있습니다

### 답장이 게시되지 않음
- `base_url`이 올바르고 PRX 서버에서 접근 가능한지 확인합니다
- `app_token`이 룸에서 메시지를 게시할 권한이 있는지 확인합니다
- OCS API 응답에서 인증 또는 권한 오류를 검토합니다
