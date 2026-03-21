---
title: WhatsApp (Cloud API)
description: Business Cloud API를 통해 PRX를 WhatsApp에 연결합니다
---

# WhatsApp (Cloud API)

> WhatsApp Business 플랫폼과의 웹훅 기반 메시징을 위해 Meta Business Cloud API를 사용하여 PRX를 WhatsApp에 연결합니다.

## 사전 요구 사항

- [Meta Business 계정](https://business.facebook.com/)
- [Meta Developer Portal](https://developers.facebook.com/)에서 설정된 WhatsApp Business API 애플리케이션
- WhatsApp Business API의 전화번호 ID와 액세스 토큰
- 웹훅을 위한 공개 접근 가능한 HTTPS 엔드포인트

## 빠른 설정

### 1. WhatsApp Business API 설정

1. [Meta Developer Portal](https://developers.facebook.com/)로 이동하여 앱을 만듭니다
2. 앱에 "WhatsApp" 제품을 추가합니다
3. "WhatsApp > API Setup"에서 **Phone Number ID**를 확인하고 **Permanent Access Token**을 생성합니다

### 2. PRX 설정

```toml
[channels_config.whatsapp]
access_token = "EAAxxxxxxxxxxxxxxxxxxxxxxxx"
phone_number_id = "123456789012345"
verify_token = "my-secret-verify-token"
allowed_numbers = ["+1234567890"]
```

### 3. 웹훅 설정

1. Meta Developer Portal에서 "WhatsApp > Configuration"으로 이동합니다
2. 웹훅 URL을 `https://your-domain.com/whatsapp`으로 설정합니다
3. PRX에서 구성한 것과 동일한 `verify_token`을 입력합니다
4. `messages` 웹훅 필드를 구독합니다

### 4. 확인

```bash
prx channel doctor whatsapp
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `access_token` | `String` | *필수* | Meta Business API의 영구 액세스 토큰 |
| `phone_number_id` | `String` | *필수* | Meta Business API의 전화번호 ID. 이 필드가 있으면 Cloud API 모드가 선택됩니다 |
| `verify_token` | `String` | *필수* | 웹훅 검증 핸드셰이크를 위한 공유 시크릿 |
| `app_secret` | `String` | `null` | 웹훅 서명 검증(HMAC-SHA256)을 위한 앱 시크릿. `ZEROCLAW_WHATSAPP_APP_SECRET` 환경 변수로도 설정 가능 |
| `allowed_numbers` | `[String]` | `[]` | E.164 형식의 허용된 전화번호 (예: `"+1234567890"`). `"*"` = 모두 허용 |

## 기능

- **웹훅 기반 메시징** -- Meta 웹훅 푸시 알림으로 메시지를 수신합니다
- **E.164 전화번호 필터링** -- 특정 전화번호로 접근을 제한합니다
- **HTTPS 강제** -- 비 HTTPS URL을 통한 데이터 전송을 거부합니다
- **웹훅 서명 검증** -- `app_secret`으로 선택적 HMAC-SHA256 검증
- **텍스트 및 미디어 메시지** -- 수신 텍스트, 이미지 및 기타 미디어 유형을 처리합니다

## 제한 사항

- 웹훅 전달을 위해 공개 접근 가능한 HTTPS 엔드포인트가 필요합니다
- Meta의 Cloud API는 비즈니스 티어에 따른 속도 제한이 있습니다
- 24시간 메시징 윈도우: 사용자의 마지막 메시지로부터 24시간 이내에만 응답할 수 있습니다 (메시지 템플릿을 사용하지 않는 경우)
- 전화번호는 허용 목록에 E.164 형식이어야 합니다

## 문제 해결

### 웹훅 검증 실패
- PRX 설정의 `verify_token`이 Meta Developer Portal에 입력한 것과 정확히 일치하는지 확인합니다
- 웹훅 엔드포인트가 `hub.challenge` 매개변수로 GET 요청에 응답해야 합니다

### 메시지가 수신되지 않음
- 웹훅 구독에 `messages` 필드가 포함되어 있는지 확인합니다
- 웹훅 URL이 HTTPS를 통해 공개 접근 가능한지 확인합니다
- Meta Developer Portal에서 웹훅 전달 로그를 검토합니다

### "비 HTTPS를 통한 전송 거부" 오류
- 모든 WhatsApp Cloud API 통신은 HTTPS가 필요합니다
- PRX 게이트웨이가 TLS 종료 프록시(예: Caddy, SSL이 있는 Nginx) 뒤에 있는지 확인합니다

::: tip WhatsApp Web 모드
Meta Business API 설정이 필요 없는 네이티브 WhatsApp Web 클라이언트에 대해서는 [WhatsApp Web](./whatsapp-web)을 참조하세요.
:::
