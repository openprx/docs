---
title: QQ
description: Bot API를 통해 PRX를 QQ 인스턴트 메시징에 연결합니다
---

# QQ

> 개인 메시지, 그룹 채팅, 길드, 미디어 첨부를 지원하는 공식 Bot API를 사용하여 PRX를 QQ에 연결합니다.

## 사전 요구 사항

- QQ 계정 (개인 또는 기업)
- [QQ Open Platform](https://q.qq.com/)에 등록된 봇 애플리케이션
- 개발자 콘솔의 App ID 및 App Secret
- 봇이 승인 및 배포되어야 합니다 (테스트용 샌드박스 모드 사용 가능)

## 빠른 설정

### 1. QQ 봇 생성

1. [QQ Open Platform](https://q.qq.com/)에 접속하여 QQ 계정으로 로그인합니다
2. "Applications"로 이동하여 새 봇 애플리케이션을 생성합니다
3. 봇 이름, 설명, 아바타를 입력합니다
4. "Development Settings"에서 **App ID**와 **App Secret**을 복사합니다
5. 봇의 인텐트 (봇이 수신할 메시지 유형)를 설정합니다
6. 테스트를 위해 지정된 테스트 길드로 봇을 제한하는 샌드박스 모드를 활성화합니다

### 2. 설정

PRX 설정 파일에 다음을 추가합니다:

```toml
[channels_config.qq]
app_id = "102012345"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["user_openid_1", "user_openid_2"]
sandbox = true
```

봇이 프로덕션 사용 승인을 받으면 `sandbox = false`로 설정합니다.

### 3. 확인

```bash
prx channel doctor qq
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `app_id` | `String` | *필수* | QQ Open Platform 개발자 콘솔의 Application ID |
| `app_secret` | `String` | *필수* | 개발자 콘솔의 Application Secret |
| `allowed_users` | `[String]` | `[]` | 허용된 사용자 OpenID. 비어 있으면 = 페어링 모드. `"*"` = 모두 허용 |
| `sandbox` | `bool` | `false` | true일 때 테스트용 샌드박스 게이트웨이에 연결합니다 |
| `intents` | `[String]` | `["guilds", "guild_messages", "direct_messages"]` | 구독할 이벤트 인텐트 |
| `stream_mode` | `String` | `"none"` | 스트리밍 모드: `"none"` 또는 `"typing"`. typing 모드는 생성 중 타이핑 표시를 전송합니다 |
| `interrupt_on_new_message` | `bool` | `false` | true일 때 동일 발신자의 새 메시지가 진행 중인 요청을 취소합니다 |
| `mention_only` | `bool` | `false` | true일 때 그룹 또는 길드 채널에서 @멘션에만 응답합니다. DM은 항상 처리됩니다 |
| `ack_reactions` | `bool` | *상속* | 전역 `ack_reactions` 설정의 오버라이드. 미설정 시 `[channels_config].ack_reactions`로 폴백됩니다 |

## 작동 방식

PRX는 WebSocket 기반 이벤트 스트림을 사용하여 QQ Bot API에 연결합니다. 연결 생명주기는 다음과 같습니다:

1. **인증** -- PRX가 OAuth2 클라이언트 자격 증명을 통해 App ID와 App Secret으로 액세스 토큰을 획득합니다
2. **게이트웨이 검색** -- 봇이 QQ API에서 WebSocket 게이트웨이 URL을 요청합니다
3. **세션 설정** -- 액세스 토큰으로 게이트웨이에 WebSocket 연결을 엽니다
4. **인텐트 구독** -- 봇이 수신하려는 이벤트 유형을 선언합니다
5. **이벤트 루프** -- 수신 메시지가 PRX 에이전트 루프로 전달되고, 응답은 REST API를 통해 전송됩니다

```
QQ Gateway (WSS) ──► PRX Channel Handler ──► Agent Loop
                                                │
QQ REST API ◄───── Reply with message ◄────────┘
```

## 기능

- **길드 및 그룹 메시징** -- QQ 길드 (채널)과 그룹 채팅의 메시지에 응답합니다
- **다이렉트 메시지** -- 사용자와의 1:1 개인 대화를 처리합니다
- **페어링 모드** -- 허용된 사용자가 설정되지 않은 경우 안전한 일회용 코드 바인딩
- **미디어 첨부** -- 이미지, 파일, 리치 미디어 카드의 송수신을 지원합니다
- **Markdown 응답** -- QQ 봇은 응답에서 Markdown 포맷팅의 하위 집합을 지원합니다
- **확인 리액션** -- 활성화 시 수신 확인을 위해 수신 메시지에 리액션합니다
- **샌드박스 모드** -- 프로덕션 배포 전 격리된 길드 환경에서 봇을 테스트합니다
- **자동 토큰 갱신** -- 만료 전 자동으로 액세스 토큰을 갱신합니다
- **크로스 플랫폼** -- QQ 데스크톱, 모바일, QQ for Linux에서 작동합니다

## 메시지 유형

QQ Bot API는 여러 메시지 콘텐츠 유형을 지원합니다:

| 유형 | 방향 | 설명 |
|------|------|------|
| Text | 송신 / 수신 | 일반 텍스트 메시지, 최대 2,048자 |
| Markdown | 송신 | QQ의 Markdown 하위 집합으로 포맷팅된 텍스트 |
| Image | 송신 / 수신 | 이미지 첨부 (JPEG, PNG, GIF) |
| File | 수신 | 사용자의 파일 첨부 |
| Rich embed | 송신 | 제목, 설명, 썸네일이 있는 구조화된 카드 메시지 |
| Ark template | 송신 | QQ의 Ark 시스템을 사용한 템플릿 기반 리치 메시지 |

## 인텐트

인텐트는 봇이 수신하는 이벤트를 제어합니다. 사용 가능한 인텐트:

| 인텐트 | 이벤트 | 참고 |
|--------|--------|------|
| `guilds` | 길드 생성, 수정, 삭제 | 길드 메타데이터 변경 |
| `guild_members` | 멤버 추가, 수정, 제거 | 상위 권한 필요 |
| `guild_messages` | 길드 텍스트 채널의 메시지 | 가장 일반적인 인텐트 |
| `guild_message_reactions` | 길드의 리액션 추가/제거 | 이모지 리액션 |
| `direct_messages` | 봇과의 개인 DM | 항상 권장 |
| `group_and_c2c` | 그룹 채팅 및 C2C 메시지 | 별도 승인 필요 |
| `interaction` | 버튼 클릭 및 인터랙션 | 대화형 메시지 컴포넌트용 |

## 제한 사항

- QQ Bot API는 지역 제한이 있으며 봇은 주로 중국 본토에서 사용 가능합니다
- 샌드박스 모드는 소수의 멤버가 있는 단일 테스트 길드로 봇을 제한합니다
- 프로덕션 봇은 QQ Open Platform 심사팀의 승인이 필요합니다
- 그룹 채팅 및 C2C 메시징은 별도의 권한 신청이 필요합니다
- 파일 업로드는 첨부당 20 MB로 제한됩니다
- QQ에 의해 콘텐츠 검수가 적용되며 금지된 콘텐츠를 포함하는 메시지는 자동으로 삭제됩니다
- 속도 제한이 적용됩니다: 길드당 초당 약 5개 메시지, DM의 경우 초당 2개
- 봇은 대화를 먼저 시작할 수 없으며 사용자 또는 관리자가 먼저 봇을 추가해야 합니다

## 문제 해결

### 봇이 QQ 게이트웨이에 연결되지 않음

- `prx channel doctor qq`로 `app_id`와 `app_secret`이 올바른지 확인합니다
- 샌드박스 모드를 사용하는 경우 `sandbox = true`가 설정되어 있는지 확인합니다 (샌드박스와 프로덕션은 서로 다른 게이트웨이를 사용합니다)
- `api.sgroup.qq.com` 및 WebSocket 게이트웨이로의 아웃바운드 연결이 차단되지 않는지 확인합니다

### 봇이 연결되지만 메시지를 수신하지 않음

- 사용 사례에 맞는 올바른 `intents`가 설정되어 있는지 확인합니다
- 길드 채널에서 봇이 길드 관리자에 의해 "메시지 수신" 권한을 부여받아야 할 수 있습니다
- 발신 사용자의 OpenID가 `allowed_users`에 있는지 확인하거나 `allowed_users = ["*"]`를 설정합니다

### 답장이 전달되지 않음

- QQ는 콘텐츠 검수를 적용합니다; PRX 로그에서 API의 거부 응답을 확인합니다
- 봇이 대상 길드 또는 그룹에서 "메시지 전송" 권한을 가지고 있는지 확인합니다
- DM 답장의 경우 사용자가 먼저 봇에 메시지를 보내 대화를 열어야 합니다

### 토큰 갱신 실패

- 개발자 콘솔에서 App Secret이 변경되었을 수 있습니다; 새 시크릿으로 설정을 업데이트합니다
- 네트워크 문제로 토큰 갱신이 방해될 수 있습니다; `bots.qq.com`과의 연결을 확인합니다

## 관련 페이지

- [채널 개요](./)
- [DingTalk](./dingtalk) -- DingTalk 플랫폼에 대한 유사한 설정
- [Lark](./lark) -- Lark / Feishu에 대한 유사한 설정
- [보안: 페어링](../security/pairing) -- 일회용 바인드 코드 페어링에 대한 자세한 내용
