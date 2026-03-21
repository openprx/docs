---
title: 훅
description: 8가지 수명주기 이벤트, 셸 훅 실행, WASM 플러그인 콜백, HTTP API 관리, 관찰성 및 자동화를 위한 이벤트 버스 통합을 갖춘 이벤트 기반 확장 시스템입니다.
---

# 훅

PRX 훅은 에이전트 실행 중 수명주기 이벤트에 반응할 수 있는 이벤트 기반 확장 시스템을 제공합니다. 에이전트 루프의 모든 중요한 순간 -- 턴 시작, LLM 호출, 도구 호출, 오류 발생 -- 은 훅 이벤트를 방출합니다. `hooks.json` 설정 파일, WASM 플러그인 매니페스트, 또는 HTTP API를 통해 이 이벤트에 액션을 연결합니다.

훅은 설계상 **발사 후 잊기**(fire-and-forget)입니다. 에이전트 루프를 차단하지 않고, 실행 흐름을 수정하지 않으며, 대화에 데이터를 주입하지 않습니다. 따라서 핵심 에이전트 파이프라인에 지연이나 실패 모드를 도입하지 않고 감사 로깅, 메트릭 수집, 외부 알림, 부작용 자동화에 이상적입니다.

세 가지 훅 실행 백엔드가 있습니다:

- **셸 훅** -- 이벤트 페이로드를 환경 변수, 임시 파일 또는 stdin을 통해 전달하면서 외부 명령을 실행합니다. `hooks.json`에서 설정됩니다.
- **WASM 플러그인 훅** -- WASM 플러그인이 내보낸 `on-event` 함수를 호출합니다. 플러그인의 `plugin.toml` 매니페스트에서 선언됩니다.
- **이벤트 버스 훅** -- 내부 이벤트 버스의 `prx.lifecycle.<event>` 토픽에 발행합니다. 항상 활성; 설정 불필요.

## 훅 이벤트

PRX는 8가지 수명주기 이벤트를 방출합니다. 각 이벤트는 컨텍스트별 필드가 포함된 JSON 페이로드를 운반합니다.

| 이벤트 | 방출 시점 | 페이로드 필드 |
|--------|----------|--------------|
| `agent_start` | 에이전트 루프가 새 턴을 시작할 때 | `agent` (string), `session` (string) |
| `agent_end` | 에이전트 루프가 턴을 완료할 때 | `success` (bool), `messages_count` (number) |
| `llm_request` | LLM 프로바이더에 요청을 보내기 전 | `provider` (string), `model` (string), `messages_count` (number) |
| `llm_response` | LLM 응답을 받은 후 | `provider` (string), `model` (string), `duration_ms` (number), `success` (bool) |
| `tool_call_start` | 도구 실행 시작 전 | `tool` (string), `arguments` (object) |
| `tool_call` | 도구 실행 완료 후 | `tool` (string), `success` (bool), `output` (string) |
| `turn_complete` | 전체 턴 완료 (모든 도구 해결) | _(빈 객체)_ |
| `error` | 실행 중 오류 발생 | `component` (string), `message` (string) |

### 페이로드 스키마

모든 페이로드는 JSON 객체입니다. 최상위 구조는 이벤트별 필드를 래핑합니다:

```json
{
  "event": "llm_response",
  "timestamp": "2026-03-21T08:15:30.123Z",
  "session_id": "sess_abc123",
  "payload": {
    "provider": "openai",
    "model": "gpt-4o",
    "duration_ms": 1842,
    "success": true
  }
}
```

`event`, `timestamp`, `session_id` 필드는 모든 훅 이벤트에 존재합니다. `payload` 객체는 위 테이블에 설명된 대로 이벤트 유형에 따라 달라집니다.

## 설정

셸 훅은 워크스페이스 디렉토리(`config.toml`과 같은 디렉토리)에 배치된 `hooks.json` 파일에서 설정됩니다. PRX는 이 파일의 변경을 감시하고 재시작 없이 설정을 **핫 리로드**합니다.

### 기본 구조

```json
{
  "hooks": {
    "<event_name>": [
      {
        "command": "/path/to/script",
        "args": ["--flag", "value"],
        "env": {
          "CUSTOM_VAR": "value"
        },
        "cwd": "/working/directory",
        "timeout_ms": 5000,
        "stdin_json": true
      }
    ]
  }
}
```

각 이벤트 이름은 훅 액션 배열에 매핑됩니다. 여러 액션을 같은 이벤트에 연결할 수 있으며, 동시에 독립적으로 실행됩니다.

### 전체 예시

```json
{
  "hooks": {
    "agent_start": [
      {
        "command": "/usr/local/bin/notify",
        "args": ["--channel", "ops", "--title", "Agent Started"],
        "timeout_ms": 3000
      }
    ],
    "llm_response": [
      {
        "command": "python3",
        "args": ["/opt/hooks/log_latency.py"],
        "stdin_json": true,
        "timeout_ms": 2000
      }
    ],
    "tool_call": [
      {
        "command": "/opt/hooks/audit_tool_usage.sh",
        "env": {
          "LOG_DIR": "/var/log/prx/audit"
        },
        "timeout_ms": 5000
      }
    ],
    "error": [
      {
        "command": "curl",
        "args": [
          "-X", "POST",
          "-H", "Content-Type: application/json",
          "-d", "@-",
          "https://hooks.slack.com/services/T00/B00/xxxxx"
        ],
        "stdin_json": true,
        "timeout_ms": 10000
      }
    ]
  }
}
```

## 훅 액션 필드

각 훅 액션 객체는 다음 필드를 지원합니다:

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `command` | string | 예 | -- | 실행 파일의 절대 경로 또는 정리된 PATH에서 찾을 수 있는 명령 이름 |
| `args` | string[] | 아니오 | `[]` | 명령에 전달되는 인자 |
| `env` | object | 아니오 | `{}` | 정리된 실행 환경에 병합되는 추가 환경 변수 |
| `cwd` | string | 아니오 | 워크스페이스 디렉토리 | 스폰된 프로세스의 작업 디렉토리 |
| `timeout_ms` | number | 아니오 | `30000` | 최대 실행 시간(밀리초). 이 제한을 초과하면 프로세스가 종료됨(SIGKILL) |
| `stdin_json` | bool | 아니오 | `false` | `true`일 때 전체 이벤트 페이로드 JSON이 stdin을 통해 프로세스에 파이프됨 |

### `command`에 대한 참고

`command` 필드는 실행 전에 보안 검증을 거칩니다. 셸 메타문자(`;`, `|`, `&`, `` ` ``, `$()`)를 포함하면 안 됩니다 -- 셸 인젝션을 방지하기 위해 거부됩니다. 셸 기능이 필요하면 스크립트 파일로 래핑하고 `command`가 해당 스크립트를 가리키도록 합니다.

상대 경로는 워크스페이스 디렉토리를 기준으로 해석됩니다. 그러나 예측 가능성을 위해 절대 경로를 권장합니다.

## 페이로드 전달

훅 액션은 세 가지 채널을 통해 동시에 이벤트 페이로드를 수신합니다. 이 중복성은 어떤 언어의 스크립트든 가장 편리한 방법으로 데이터에 접근할 수 있도록 합니다.

### 1. 환경 변수 (`ZERO_HOOK_PAYLOAD`)

페이로드 JSON 문자열이 `ZERO_HOOK_PAYLOAD` 환경 변수로 설정됩니다. 셸 스크립트에서 가장 간단한 접근 방법입니다:

```bash
#!/bin/bash
# 환경 변수에서 페이로드 읽기
echo "$ZERO_HOOK_PAYLOAD" | jq '.payload.tool'
```

**크기 제한**: 8 KB. 직렬화된 페이로드가 8 KB를 초과하면 환경 변수가 **설정되지 않으며** 페이로드는 임시 파일과 stdin 채널을 통해서만 사용할 수 있습니다.

### 2. 임시 파일 (`ZERO_HOOK_PAYLOAD_FILE`)

페이로드가 임시 파일에 기록되고 파일 경로가 `ZERO_HOOK_PAYLOAD_FILE` 환경 변수에 설정됩니다. 임시 파일은 훅 프로세스 종료 후 자동으로 삭제됩니다.

```python
import os, json

payload_file = os.environ["ZERO_HOOK_PAYLOAD_FILE"]
with open(payload_file) as f:
    data = json.load(f)
print(f"Tool: {data['payload']['tool']}, Success: {data['payload']['success']}")
```

이 채널은 크기 제한이 없으며 큰 페이로드(예: 상세 출력이 있는 `tool_call`)에 권장됩니다.

### 3. 표준 입력 (stdin)

훅 액션에서 `stdin_json`이 `true`로 설정되면 페이로드 JSON이 stdin을 통해 프로세스에 파이프됩니다. `curl -d @-`이나 `jq`처럼 기본적으로 stdin에서 읽는 명령에 유용합니다.

```bash
#!/bin/bash
# stdin에서 읽기 (훅 설정에서 stdin_json: true 필요)
read -r payload
echo "$payload" | jq -r '.payload.message'
```

## 환경 변수

모든 훅 프로세스는 `ZERO_HOOK_PAYLOAD`와 `ZERO_HOOK_PAYLOAD_FILE` 외에 다음 환경 변수를 수신합니다:

| 변수 | 설명 | 예시 |
|------|------|------|
| `ZERO_HOOK_EVENT` | 이 훅을 트리거한 이벤트 이름 | `tool_call` |
| `ZERO_HOOK_SESSION` | 현재 세션 식별자 | `sess_abc123` |
| `ZERO_HOOK_TIMESTAMP` | 이벤트의 ISO 8601 타임스탬프 | `2026-03-21T08:15:30.123Z` |
| `ZERO_HOOK_PAYLOAD` | JSON 문자열로서의 전체 페이로드 (>8 KB 시 생략) | `{"event":"tool_call",...}` |
| `ZERO_HOOK_PAYLOAD_FILE` | 페이로드를 포함하는 임시 파일 경로 | `/tmp/prx-hook-a1b2c3.json` |

실행 환경은 훅 프로세스 시작 전에 **정리**됩니다. 민감하고 위험한 환경 변수가 제거되며(아래 [보안](#보안) 참조), 위에 나열된 변수와 훅 액션의 `env` 재정의만 사용할 수 있습니다.

## WASM 플러그인 훅

WASM 플러그인은 PRX WIT (WebAssembly Interface Types) 인터페이스에 정의된 `on-event` 함수를 내보내 훅 이벤트를 구독할 수 있습니다.

### WIT 인터페이스

```wit
interface hooks {
    /// 구독된 이벤트가 발생할 때 호출됩니다.
    /// 성공 시 Ok(()), 실패 시 Err(message)를 반환합니다.
    on-event: func(event: string, payload-json: string) -> result<_, string>;
}
```

`event` 파라미터는 이벤트 이름(예: `"tool_call"`)이고, `payload-json`은 셸 훅이 수신하는 것과 동일한 JSON 문자열로 직렬화된 전체 페이로드입니다.

### 이벤트 구독 패턴

플러그인은 패턴 매칭을 사용하여 `plugin.toml` 매니페스트에서 수신할 이벤트를 선언합니다:

| 패턴 | 매칭 | 예시 |
|------|------|------|
| 정확한 매칭 | 하나의 특정 이벤트 | `"tool_call"` |
| 와일드카드 접미사 | 접두사에 매칭되는 모든 이벤트 | `"prx.lifecycle.*"` |
| 유니버설 | 모든 이벤트 | `"*"` |

### 플러그인 매니페스트 예시

```toml
[plugin]
name = "audit-logger"
version = "0.1.0"
description = "Logs all lifecycle events to an audit trail"

[[capabilities]]
type = "hook"
events = ["agent_start", "agent_end", "error"]

[[capabilities]]
type = "hook"
events = ["prx.lifecycle.*"]
```

단일 플러그인이 다른 이벤트 패턴으로 여러 `[[capabilities]]` 블록을 선언할 수 있습니다. 매칭된 모든 이벤트의 합집합이 플러그인이 수신하는 이벤트를 결정합니다.

### 실행 모델

WASM 플러그인 훅은 다른 플러그인 함수와 동일한 리소스 제한으로 WASM 샌드박스 내에서 실행됩니다. 적용 대상:

- **메모리 제한**: 플러그인의 리소스 설정에서 정의 (기본 64 MB)
- **실행 타임아웃**: 셸 훅의 `timeout_ms`와 동일 (기본 30초)
- **파일시스템 접근 없음**: WASI 기능을 통해 명시적으로 허용되지 않는 한
- **네트워크 접근 없음**: 기능 플래그를 통해 명시적으로 허용되지 않는 한

WASM 훅이 `Err(message)`를 반환하면 오류가 로그되지만 에이전트 루프에는 영향을 미치지 않습니다. 훅은 항상 발사 후 잊기입니다.

## 이벤트 버스 통합

모든 훅 이벤트는 셸이나 WASM 훅이 설정되어 있는지 여부에 관계없이 내부 이벤트 버스의 `prx.lifecycle.<event>` 토픽에 자동으로 발행됩니다.

### 토픽 형식

```
prx.lifecycle.agent_start
prx.lifecycle.agent_end
prx.lifecycle.llm_request
prx.lifecycle.llm_response
prx.lifecycle.tool_call_start
prx.lifecycle.tool_call
prx.lifecycle.turn_complete
prx.lifecycle.error
```

### 구독 유형

내부 컴포넌트와 플러그인은 세 가지 패턴을 사용하여 이벤트 버스 토픽을 구독할 수 있습니다:

- **정확한**: `prx.lifecycle.tool_call` -- `tool_call` 이벤트만 수신
- **와일드카드**: `prx.lifecycle.*` -- 모든 수명주기 이벤트 수신
- **계층적**: `prx.*` -- 모든 PRX 도메인 이벤트(수명주기, 메트릭 등) 수신

### 페이로드 제한

| 제약 | 값 |
|------|------|
| 최대 페이로드 크기 | 64 KB |
| 최대 재귀 깊이 | 8 레벨 |
| 디스패치 모델 | 발사 후 잊기 (비동기) |
| 전달 보장 | 최대 1회(at-most-once) |

훅 이벤트가 다른 훅 이벤트를 트리거하면(예: 훅 스크립트가 `tool_call`을 방출하는 도구를 호출) 재귀 카운터가 증가합니다. 8 레벨 깊이에서 추가 이벤트 방출은 무한 루프를 방지하기 위해 조용히 삭제됩니다.

## HTTP API

훅은 HTTP API를 통해 프로그래밍 방식으로 관리할 수 있습니다. 모든 엔드포인트는 인증이 필요하며 JSON 응답을 반환합니다.

### 모든 훅 나열

```
GET /api/hooks
```

응답:

```json
{
  "hooks": [
    {
      "id": "hook_01",
      "event": "error",
      "action": {
        "command": "/opt/hooks/notify_error.sh",
        "args": [],
        "timeout_ms": 5000,
        "stdin_json": false
      },
      "enabled": true,
      "created_at": "2026-03-20T10:00:00Z",
      "updated_at": "2026-03-20T10:00:00Z"
    }
  ]
}
```

### 훅 생성

```
POST /api/hooks
Content-Type: application/json

{
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency.py"],
    "stdin_json": true,
    "timeout_ms": 3000
  },
  "enabled": true
}
```

응답 (201 Created):

```json
{
  "id": "hook_02",
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency.py"],
    "stdin_json": true,
    "timeout_ms": 3000
  },
  "enabled": true,
  "created_at": "2026-03-21T08:00:00Z",
  "updated_at": "2026-03-21T08:00:00Z"
}
```

### 훅 업데이트

```
PUT /api/hooks/hook_02
Content-Type: application/json

{
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency_v2.py"],
    "stdin_json": true,
    "timeout_ms": 5000
  },
  "enabled": true
}
```

응답 (200 OK): 업데이트된 훅 객체를 반환합니다.

### 훅 삭제

```
DELETE /api/hooks/hook_02
```

응답 (204 No Content): 성공 시 빈 본문.

### 훅 토글

```
PATCH /api/hooks/hook_01/toggle
```

응답 (200 OK):

```json
{
  "id": "hook_01",
  "enabled": false
}
```

이 엔드포인트는 `enabled` 상태를 전환합니다. 비활성화된 훅은 설정에 남아있지만 이벤트가 발생할 때 실행되지 않습니다.

## 보안

훅 실행은 권한 상승, 데이터 유출, 서비스 거부를 방지하기 위한 여러 보안 조치의 적용을 받습니다.

### 차단된 환경 변수

다음 환경 변수는 훅 실행 환경에서 제거되며 훅 액션의 `env` 필드를 통해 재정의할 수 없습니다:

| 변수 | 이유 |
|------|------|
| `LD_PRELOAD` | 라이브러리 인젝션 공격 벡터 |
| `LD_LIBRARY_PATH` | 라이브러리 검색 경로 조작 |
| `DYLD_INSERT_LIBRARIES` | macOS 라이브러리 인젝션 |
| `DYLD_LIBRARY_PATH` | macOS 라이브러리 경로 조작 |
| `PATH` | PATH 하이재킹 방지; 최소한의 안전한 PATH가 제공됨 |
| `HOME` | 홈 디렉토리 스푸핑 방지 |

### 입력 검증

- **널 바이트 거부**: `command`, `args`, `env` 키 또는 `env` 값에 널 바이트(`\0`)가 포함되면 거부됩니다. 이는 OS 수준에서 문자열을 잘라내는 널 바이트 인젝션 공격을 방지합니다.
- **셸 메타문자 거부**: `command` 필드는 `;`, `|`, `&`, `` ` ``, `$(` 또는 기타 셸 메타문자를 포함하면 안 됩니다. 이는 명령이 실수로 셸을 통해 전달되더라도 셸 인젝션을 방지합니다.
- **경로 탈출**: `cwd` 필드는 `..` 구성요소를 통해 워크스페이스 디렉토리를 벗어나지 않도록 검증됩니다.

### 타임아웃 강제

모든 훅 프로세스는 설정된 `timeout_ms`(기본 30초)의 적용을 받습니다. 프로세스가 이 제한을 초과하면:

1. 프로세스에 `SIGTERM`이 전송됨
2. 5초 유예 기간 후 `SIGKILL`이 전송됨
3. 훅이 내부 메트릭에서 타임아웃으로 표시됨
4. 에이전트 루프는 **영향받지 않음**

### 리소스 격리

훅 프로세스는 샌드박스 백엔드가 활성일 때 셸 도구 실행과 동일한 cgroup 및 네임스페이스 제한을 상속합니다. Docker 샌드박스 모드에서는 훅이 기본적으로 네트워크 접근 없이 별도의 컨테이너에서 실행됩니다.

## 예시

### 감사 로깅 훅

컴플라이언스 감사를 위해 모든 도구 호출을 파일에 기록:

```json
{
  "hooks": {
    "tool_call": [
      {
        "command": "/opt/hooks/audit_log.sh",
        "env": {
          "AUDIT_LOG": "/var/log/prx/tool_audit.jsonl"
        },
        "timeout_ms": 2000
      }
    ]
  }
}
```

`/opt/hooks/audit_log.sh`:

```bash
#!/bin/bash
echo "$ZERO_HOOK_PAYLOAD" >> "$AUDIT_LOG"
```

### 오류 알림 훅

오류 이벤트를 Slack 채널에 전송:

```json
{
  "hooks": {
    "error": [
      {
        "command": "curl",
        "args": [
          "-s", "-X", "POST",
          "-H", "Content-Type: application/json",
          "-d", "@-",
          "https://hooks.slack.com/services/T00/B00/xxxxx"
        ],
        "stdin_json": true,
        "timeout_ms": 10000
      }
    ]
  }
}
```

### LLM 지연 메트릭 훅

모니터링 대시보드를 위한 LLM 응답 시간 추적:

```json
{
  "hooks": {
    "llm_response": [
      {
        "command": "python3",
        "args": ["/opt/hooks/metrics.py"],
        "stdin_json": true,
        "timeout_ms": 3000
      }
    ]
  }
}
```

`/opt/hooks/metrics.py`:

```python
import sys, json

data = json.load(sys.stdin)
payload = data["payload"]
provider = payload["provider"]
model = payload["model"]
duration = payload["duration_ms"]
success = payload["success"]

# StatsD, Prometheus pushgateway 또는 메트릭 백엔드에 푸시
print(f"prx.llm.duration,provider={provider},model={model} {duration}")
print(f"prx.llm.success,provider={provider},model={model} {1 if success else 0}")
```

### 세션 수명주기 추적

사용량 분석을 위한 에이전트 세션 시작 및 종료 추적:

```json
{
  "hooks": {
    "agent_start": [
      {
        "command": "/opt/hooks/session_tracker.sh",
        "args": ["start"],
        "timeout_ms": 2000
      }
    ],
    "agent_end": [
      {
        "command": "/opt/hooks/session_tracker.sh",
        "args": ["end"],
        "timeout_ms": 2000
      }
    ]
  }
}
```

## 관련 페이지

- [셸 실행](/ko/prx/tools/shell) -- 훅이 자주 래핑하는 셸 도구
- [MCP 통합](/ko/prx/tools/mcp) -- `tool_call` 이벤트를 방출하는 외부 도구 프로토콜
- [플러그인](/ko/prx/plugins/) -- 훅 기능을 포함하는 WASM 플러그인 시스템
- [관찰성](/ko/prx/observability/) -- 훅을 보완하는 메트릭 및 트레이싱
- [보안](/ko/prx/security/) -- 훅 실행을 관장하는 샌드박스 및 정책 엔진
