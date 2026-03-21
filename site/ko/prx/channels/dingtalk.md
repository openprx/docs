---
title: DingTalk
description: Stream Mode를 통해 PRX를 DingTalk (Alibaba)에 연결합니다
---

# DingTalk

> Alibaba 워크플레이스 플랫폼에서 실시간 봇 메시징을 위해 Stream Mode WebSocket API를 사용하여 PRX를 DingTalk에 연결합니다.

## 사전 요구 사항

- DingTalk 조직 (기업 또는 팀)
- [DingTalk 개발자 콘솔](https://open-dev.dingtalk.com/)에서 생성된 봇 애플리케이션
- 개발자 콘솔의 Client ID (AppKey) 및 Client Secret (AppSecret)

## 빠른 설정

### 1. DingTalk 봇 생성

1. [DingTalk Open Platform](https://open-dev.dingtalk.com/)에 접속하여 로그인합니다
2. 새 "기업 내부 애플리케이션" (또는 "H5 Micro Application")을 생성합니다
3. 애플리케이션에 "Robot" 기능을 추가합니다
4. "Credentials"에서 **Client ID** (AppKey)와 **Client Secret** (AppSecret)을 복사합니다
5. 봇 설정에서 "Stream Mode"를 활성화합니다

### 2. 설정

```toml
[channels_config.dingtalk]
client_id = "dingxxxxxxxxxxxxxxxxxx"
client_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["manager1234"]
```

### 3. 확인

```bash
prx channel doctor dingtalk
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `client_id` | `String` | *필수* | DingTalk 개발자 콘솔의 Client ID (AppKey) |
| `client_secret` | `String` | *필수* | 개발자 콘솔의 Client Secret (AppSecret) |
| `allowed_users` | `[String]` | `[]` | 허용된 DingTalk 직원 ID. 비어 있으면 = 모두 거부. `"*"` = 모두 허용 |

## 기능

- **Stream Mode WebSocket** -- 실시간 메시지 전달을 위한 DingTalk 게이트웨이와의 영구 WebSocket 연결
- **공개 URL 불필요** -- Stream Mode는 아웃바운드 연결을 설정하므로 인바운드 웹훅 설정이 필요 없습니다
- **개인 및 그룹 채팅** -- 1:1 대화와 그룹 채팅 메시지를 모두 처리합니다
- **세션 웹훅** -- DingTalk에서 제공하는 메시지별 세션 웹훅 URL을 통해 답장합니다
- **자동 게이트웨이 등록** -- DingTalk 게이트웨이에 등록하여 WebSocket 엔드포인트와 티켓을 획득합니다
- **대화 유형 감지** -- 개인 채팅과 그룹 대화를 구분합니다

## 제한 사항

- Stream Mode는 DingTalk 서버로의 안정적인 아웃바운드 WebSocket 연결이 필요합니다
- 답장은 메시지별 세션 웹훅을 사용하며, 즉시 사용하지 않으면 만료될 수 있습니다
- 봇이 그룹 채팅 메시지를 수신하려면 관리자가 그룹에 추가해야 합니다
- DingTalk API는 주로 중국어로 문서화되어 있으며 국제 지원이 제한적입니다
- 내부 애플리케이션 배포를 위해 기업 관리자 승인이 필요할 수 있습니다

## 문제 해결

### 봇이 DingTalk에 연결되지 않음
- `client_id`와 `client_secret`이 올바른지 확인합니다
- DingTalk 개발자 콘솔의 봇 설정에서 "Stream Mode"가 활성화되어 있는지 확인합니다
- DingTalk 서버로의 아웃바운드 연결이 방화벽에 의해 차단되지 않는지 확인합니다

### 메시지를 수신하지만 답장이 실패함
- 세션 웹훅은 메시지별이며 만료될 수 있으므로 답장을 신속히 전송해야 합니다
- 봇에 개발자 콘솔에서 필요한 API 권한이 있는지 확인합니다

### 그룹 메시지가 수신되지 않음
- 봇이 관리자에 의해 그룹에 명시적으로 추가되어야 합니다
- 발신자의 직원 ID가 `allowed_users`에 있는지 확인하거나 `allowed_users = ["*"]`를 설정합니다
