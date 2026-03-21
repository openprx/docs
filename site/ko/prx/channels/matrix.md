---
title: Matrix
description: 종단 간 암호화를 지원하여 PRX를 Matrix에 연결합니다
---

# Matrix

> 선택적 종단 간 암호화(E2EE)와 룸 기반 메시징을 갖춘 Client-Server API를 사용하여 PRX를 Matrix 네트워크에 연결합니다.

## 사전 요구 사항

- Matrix 홈서버 (예: [matrix.org](https://matrix.org) 또는 자체 호스팅 Synapse/Dendrite)
- 액세스 토큰이 있는 홈서버의 봇 계정
- 봇이 수신할 룸 ID
- `channel-matrix` 기능 플래그로 빌드된 PRX

## 빠른 설정

### 1. 봇 계정 생성

홈서버에서 봇용 계정을 생성합니다. Element 또는 커맨드 라인을 사용할 수 있습니다:

```bash
# 홈서버 API에 curl 사용
curl -X POST "https://matrix.org/_matrix/client/v3/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "prx-bot", "password": "secure-password", "auth": {"type": "m.login.dummy"}}'
```

### 2. 액세스 토큰 획득

```bash
curl -X POST "https://matrix.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{"type": "m.login.password", "user": "prx-bot", "password": "secure-password"}'
```

### 3. 봇을 룸에 초대

Matrix 클라이언트에서 봇이 작동할 룸에 봇 계정을 초대합니다. 룸 ID를 기록합니다 (형식: `!abc123:matrix.org`).

### 4. 설정

```toml
[channels_config.matrix]
homeserver = "https://matrix.org"
access_token = "syt_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
room_id = "!abc123def456:matrix.org"
allowed_users = ["@alice:matrix.org", "@bob:matrix.org"]
```

### 5. 확인

```bash
prx channel doctor matrix
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `homeserver` | `String` | *필수* | Matrix 홈서버 URL (예: `"https://matrix.org"`) |
| `access_token` | `String` | *필수* | 봇 계정의 Matrix 액세스 토큰 |
| `user_id` | `String` | `null` | Matrix 사용자 ID (예: `"@bot:matrix.org"`). 세션 복원에 사용됩니다 |
| `device_id` | `String` | `null` | Matrix 기기 ID. E2EE 세션 연속성에 사용됩니다 |
| `room_id` | `String` | *필수* | 수신할 룸 ID (예: `"!abc123:matrix.org"`) |
| `allowed_users` | `[String]` | `[]` | 허용된 Matrix 사용자 ID. 비어 있으면 = 모두 거부. `"*"` = 모두 허용 |

## 기능

- **종단 간 암호화** -- Vodozemac이 포함된 matrix-sdk를 사용하여 암호화된 룸을 지원합니다
- **룸 기반 메시징** -- 특정 Matrix 룸에서 수신하고 응답합니다
- **메시지 리액션** -- 수신 확인 및 완료를 위해 메시지에 리액션합니다
- **읽음 확인** -- 처리된 메시지에 대해 읽음 확인을 전송합니다
- **세션 지속성** -- 재시작 후에도 E2EE 연속성을 위해 암호화 세션을 로컬에 저장합니다
- **홈서버 불문** -- 모든 Matrix 홈서버 (Synapse, Dendrite, Conduit 등)에서 작동합니다

## 제한 사항

- 현재 단일 룸에서만 수신합니다 (`room_id`로 설정)
- 컴파일 시 `channel-matrix` 기능 플래그가 필요합니다
- E2EE 키 백업 및 교차 서명 검증은 아직 지원되지 않습니다
- 메시지 양이 많은 대규모 룸에서는 리소스 사용량이 증가할 수 있습니다
- 봇이 수신하기 전에 룸에 초대되어야 합니다

## 문제 해결

### 암호화된 룸에서 봇이 응답하지 않음
- 적절한 E2EE 세션 관리를 위해 `user_id`와 `device_id`가 설정되어 있는지 확인합니다
- 로컬 암호화 저장소를 삭제하고 재시작하여 암호화 세션을 재설정합니다
- 봇 계정이 룸 멤버에 의해 검증/신뢰되었는지 확인합니다

### "Room not found" 오류
- 룸 ID 형식이 올바른지 확인합니다 (`!` 접두사, `:homeserver` 접미사)
- 봇이 룸에 초대되어 참여했는지 확인합니다
- 룸 별칭 (예: `#room:matrix.org`)은 지원되지 않습니다; 룸 ID를 사용하세요

### 액세스 토큰 거부
- 액세스 토큰이 만료될 수 있습니다; 로그인 API를 통해 새 토큰을 생성합니다
- 토큰이 올바른 홈서버에 속하는지 확인합니다
