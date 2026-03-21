---
title: Signal
description: signal-cli를 통해 PRX를 Signal에 연결합니다
---

# Signal

> DM과 그룹에서 암호화된 메시징을 위해 signal-cli 데몬의 JSON-RPC 및 SSE API를 사용하여 PRX를 Signal에 연결합니다.

## 사전 요구 사항

- Signal에 등록된 전화번호
- [signal-cli](https://github.com/AsamK/signal-cli) 설치 및 등록 완료
- HTTP API가 활성화된 데몬 모드로 실행 중인 signal-cli

## 빠른 설정

### 1. signal-cli 설치 및 등록

```bash
# signal-cli 설치 (최신 버전은 https://github.com/AsamK/signal-cli 참조)
# 전화번호 등록
signal-cli -u +1234567890 register
signal-cli -u +1234567890 verify <verification-code>
```

### 2. signal-cli 데몬 시작

```bash
signal-cli -u +1234567890 daemon --http localhost:8686
```

### 3. 설정

```toml
[channels_config.signal]
http_url = "http://127.0.0.1:8686"
account = "+1234567890"
allowed_from = ["+1987654321", "*"]
```

### 4. 확인

```bash
prx channel doctor signal
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `http_url` | `String` | *필수* | signal-cli HTTP 데몬의 기본 URL (예: `"http://127.0.0.1:8686"`) |
| `account` | `String` | *필수* | signal-cli 계정의 E.164 전화번호 (예: `"+1234567890"`) |
| `group_id` | `String` | `null` | 그룹별 메시지 필터. `null` = 모두 수락(DM 및 그룹). `"dm"` = DM만 수락. 특정 그룹 ID = 해당 그룹만 |
| `allowed_from` | `[String]` | `[]` | E.164 형식의 허용된 발신자 전화번호. `"*"` = 모두 허용 |
| `ignore_attachments` | `bool` | `false` | 첨부만 있는(텍스트 본문 없는) 메시지를 건너뜁니다 |
| `ignore_stories` | `bool` | `false` | 수신 스토리 메시지를 건너뜁니다 |

## 기능

- **종단 간 암호화** -- 모든 메시지가 Signal Protocol로 암호화됩니다
- **DM 및 그룹 지원** -- 다이렉트 메시지와 그룹 대화를 모두 처리합니다
- **SSE 이벤트 스트림** -- 실시간 전달을 위해 `/api/v1/events`에서 Server-Sent Events로 수신합니다
- **JSON-RPC 전송** -- `/api/v1/rpc`에서 JSON-RPC로 응답을 전송합니다
- **유연한 그룹 필터링** -- 모든 메시지, DM만 또는 특정 그룹을 수락합니다
- **첨부 처리** -- 선택적으로 첨부만 있는 메시지를 처리하거나 건너뜁니다

## 제한 사항

- signal-cli가 별도의 데몬 프로세스로 실행되어야 합니다
- signal-cli가 유효한 전화번호로 등록 및 인증되어야 합니다
- 하나의 signal-cli 인스턴스는 하나의 전화번호를 지원합니다
- 그룹 메시지 전송은 signal-cli 계정이 그룹의 멤버여야 합니다
- signal-cli는 자체 리소스 요구 사항이 있는 Java 애플리케이션입니다

## 문제 해결

### signal-cli에 연결할 수 없음
- signal-cli 데몬이 실행 중인지 확인합니다: `curl http://127.0.0.1:8686/api/v1/about`
- `http_url`이 데몬의 바인드 주소 및 포트와 일치하는지 확인합니다
- 방화벽 규칙이 연결을 차단하지 않는지 확인합니다

### 그룹의 메시지가 무시됨
- `group_id` 필터를 확인합니다 -- `"dm"`으로 설정되면 그룹 메시지가 제외됩니다
- 특정 그룹 ID로 설정되면 해당 그룹의 메시지만 수락됩니다
- 모든 메시지를 수락하려면 `group_id`를 `null`로 설정하거나 생략합니다

### 첨부만 있는 메시지가 건너뜀
- `ignore_attachments = true`일 때 예상되는 동작입니다
- 첨부만 있는 메시지를 처리하려면 `ignore_attachments = false`로 설정합니다
