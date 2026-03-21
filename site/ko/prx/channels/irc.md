---
title: IRC
description: TLS를 통해 PRX를 IRC에 연결합니다
---

# IRC

> 채널, DM, 다양한 인증 방법을 지원하며 TLS를 통해 PRX를 Internet Relay Chat (IRC) 서버에 연결합니다.

## 사전 요구 사항

- 연결할 IRC 서버 (예: Libera.Chat, OFTC 또는 사설 서버)
- 봇의 닉네임
- TLS가 활성화된 IRC 서버 (포트 6697이 표준)

## 빠른 설정

### 1. 서버 선택 및 닉네임 등록 (선택)

Libera.Chat 같은 공개 네트워크에서는 봇의 닉네임을 NickServ에 등록할 수 있습니다:

```
/msg NickServ REGISTER <password> <email>
```

### 2. 설정

```toml
[channels_config.irc]
server = "irc.libera.chat"
port = 6697
nickname = "prx-bot"
channels = ["#my-channel"]
allowed_users = ["mynick", "*"]
```

NickServ 인증을 사용하는 경우:

```toml
[channels_config.irc]
server = "irc.libera.chat"
port = 6697
nickname = "prx-bot"
channels = ["#my-channel", "#another-channel"]
allowed_users = ["*"]
nickserv_password = "your-nickserv-password"
```

### 3. 확인

```bash
prx channel doctor irc
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `server` | `String` | *필수* | IRC 서버 호스트명 (예: `"irc.libera.chat"`) |
| `port` | `u16` | `6697` | IRC 서버 포트 (TLS의 경우 6697) |
| `nickname` | `String` | *필수* | IRC 네트워크에서의 봇 닉네임 |
| `username` | `String` | *nickname* | IRC 사용자명 (미설정 시 닉네임이 기본값) |
| `channels` | `[String]` | `[]` | 연결 시 참여할 IRC 채널 (예: `["#channel1", "#channel2"]`) |
| `allowed_users` | `[String]` | `[]` | 허용된 닉네임 (대소문자 구분 없음). 비어 있으면 = 모두 거부. `"*"` = 모두 허용 |
| `server_password` | `String` | `null` | 서버 비밀번호 (ZNC 같은 바운서용) |
| `nickserv_password` | `String` | `null` | 닉네임 인증을 위한 NickServ IDENTIFY 비밀번호 |
| `sasl_password` | `String` | `null` | IRCv3 인증을 위한 SASL PLAIN 비밀번호 |
| `verify_tls` | `bool` | `true` | 서버의 TLS 인증서를 검증합니다 |

## 기능

- **TLS 암호화** -- 모든 연결이 보안을 위해 TLS를 사용합니다
- **다중 인증 방법** -- 서버 비밀번호, NickServ IDENTIFY, SASL PLAIN (IRCv3)을 지원합니다
- **멀티 채널 지원** -- 여러 채널에 동시에 참여하여 응답합니다
- **채널 및 DM 지원** -- 채널 PRIVMSG와 다이렉트 메시지를 모두 처리합니다
- **일반 텍스트 출력** -- 응답이 자동으로 IRC에 맞게 조정됩니다 (마크다운, 코드 펜스 없음)
- **스마트 메시지 분할** -- 긴 메시지가 IRC의 줄 길이 제한을 준수하며 분할됩니다
- **연결 유지** -- 서버 PING 메시지에 응답하고 끊어진 연결을 감지합니다 (5분 읽기 타임아웃)
- **단조 메시지 ID** -- 버스트 트래픽에서 고유한 메시지 순서를 보장합니다

## 제한 사항

- IRC는 일반 텍스트만 지원합니다; 마크다운, HTML, 리치 포맷팅은 지원되지 않습니다
- 메시지는 IRC 줄 길이 제한 (일반적으로 프로토콜 오버헤드 포함 512 바이트)의 적용을 받습니다
- 내장 미디어 또는 파일 공유 기능이 없습니다
- 서버가 타임아웃 내에 PING 응답을 받지 못하면 연결이 끊어질 수 있습니다
- 일부 IRC 네트워크는 봇의 속도를 제한할 수 있는 flood 방지 조치가 있습니다
- 닉네임 변경 및 네트워크 분리 후 재연결은 처리되지만 잠시 중단될 수 있습니다

## 문제 해결

### IRC 서버에 연결할 수 없음
- `server` 호스트명과 `port`가 올바른지 확인합니다
- 포트 6697 (TLS)이 방화벽에 의해 차단되지 않는지 확인합니다
- 자체 서명 인증서를 사용하는 경우 `verify_tls = false`를 설정합니다

### 봇이 채널에 참여하지만 응답하지 않음
- 발신자의 닉네임이 `allowed_users`에 있는지 확인합니다 (대소문자 구분 없음)
- 테스트를 위해 `allowed_users = ["*"]`를 설정하여 모든 사용자를 허용합니다
- 봇에 채널에서 발언 권한이 있는지 확인합니다 (음소거 또는 차단되지 않음)

### NickServ 인증 실패
- `nickserv_password`가 올바른지 확인합니다
- 봇 닉네임이 식별하기 전에 NickServ에 등록되어 있어야 합니다
- 일부 네트워크는 NickServ 대신 SASL 인증을 요구합니다; 이 경우 `sasl_password`를 사용하세요
