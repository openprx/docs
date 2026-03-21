---
title: LINQ
description: Linq Partner API를 통해 PRX를 iMessage, RCS, SMS에 연결합니다
---

# LINQ

> 멀티 프로토콜 모바일 메시징을 위해 Linq Partner V3 API를 통해 PRX를 iMessage, RCS, SMS 메시징에 연결합니다.

## 사전 요구 사항

- API 접근이 가능한 [Linq](https://linqapp.com) Partner 계정
- Linq API 토큰
- 메시지 전송을 위해 Linq를 통해 프로비저닝된 전화번호

## 빠른 설정

### 1. API 자격 증명 획득

1. [linqapp.com](https://linqapp.com)에서 Linq Partner 계정에 가입합니다
2. 파트너 대시보드에서 **API Token**을 획득합니다
3. 계정에 할당된 발신용 **전화번호**를 기록합니다

### 2. 설정

```toml
[channels_config.linq]
api_token = "your-linq-api-token"
from_phone = "+15551234567"
allowed_senders = ["+1987654321"]
```

### 3. 웹훅 설정

Linq가 PRX의 게이트웨이 엔드포인트로 웹훅 이벤트를 전송하도록 설정합니다:

```
POST https://your-prx-domain.com/linq
```

### 4. 확인

```bash
prx channel doctor linq
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `api_token` | `String` | *필수* | Linq Partner API 토큰 (Bearer 인증으로 사용) |
| `from_phone` | `String` | *필수* | 발신 전화번호 (E.164 형식, 예: `"+15551234567"`) |
| `signing_secret` | `String` | `null` | HMAC 서명 검증을 위한 웹훅 서명 시크릿 |
| `allowed_senders` | `[String]` | `[]` | E.164 형식의 허용된 발신자 전화번호. `"*"` = 모두 허용 |

## 기능

- **멀티 프로토콜 메시징** -- 단일 통합을 통해 iMessage, RCS, SMS로 송수신합니다
- **웹훅 기반 전달** -- Linq의 HTTP 웹훅 푸시로 메시지를 수신합니다
- **이미지 지원** -- 수신 이미지 첨부를 처리하고 이미지 마커로 렌더링합니다
- **발신/수신 감지** -- 자체 발신 메시지를 자동으로 필터링합니다
- **서명 검증** -- `signing_secret`으로 선택적 HMAC 웹훅 서명 검증
- **E.164 전화번호 필터링** -- 특정 발신자 전화번호로 접근을 제한합니다

## 제한 사항

- 웹훅 전달을 위해 공개 접근 가능한 HTTPS 엔드포인트가 필요합니다
- Linq Partner API 접근은 파트너 계정이 필요합니다 (일반 소비자 계정이 아님)
- 메시지 전달은 수신자의 메시징 프로토콜에 따라 다릅니다 (iMessage, RCS 또는 SMS 폴백)
- 인라인 첨부의 경우 이미지 MIME 유형만 처리됩니다; 다른 미디어 유형은 건너뜁니다
- API 속도 제한은 Linq Partner 티어에 따라 다릅니다

## 문제 해결

### 웹훅 이벤트가 수신되지 않음
- 웹훅 URL이 공개 접근 가능하고 `https://your-domain/linq`를 가리키는지 확인합니다
- Linq 파트너 대시보드에서 웹훅 전달 로그와 오류를 확인합니다
- PRX 게이트웨이가 실행 중이고 올바른 포트에서 수신하고 있는지 확인합니다

### 메시지를 전송하지만 답장이 실패함
- `api_token`이 유효하고 만료되지 않았는지 확인합니다
- `from_phone`이 Linq 계정에서 유효하고 프로비저닝된 전화번호인지 확인합니다
- 오류 세부 사항에 대해 Linq API 응답을 검토합니다

### 봇이 자체 메시지에 답장함
- 이 현상은 발생하지 않아야 합니다; PRX가 `is_from_me`와 `direction` 필드를 사용하여 발신 메시지를 자동으로 필터링합니다
- 발생하는 경우 웹훅 페이로드 형식이 예상되는 Linq V3 구조와 일치하는지 확인합니다
