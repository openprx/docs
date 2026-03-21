---
title: 이벤트 버스
description: PRX의 토픽 기반 pub/sub, 와일드카드 구독, 전달 보장이 포함된 플러그인 간 이벤트 버스입니다.
---

# 이벤트 버스

PRX 이벤트 버스는 토픽 기반 발행/구독 메커니즘을 통해 플러그인과 호스트 시스템 간의 통신을 가능하게 합니다. 플러그인은 이벤트를 발행하고, 토픽을 구독하고, 생명주기 이벤트에 반응할 수 있으며 -- 이 모든 것이 컴포넌트 간 직접 결합 없이 이루어집니다.

## 개요

이벤트 버스는 다음을 제공합니다:

- **토픽 기반 라우팅** -- 이벤트가 계층적 토픽에 발행되고 매칭되는 구독자에게 전달
- **와일드카드 구독** -- glob 스타일 패턴으로 전체 토픽 하위 트리 구독
- **페이로드 제한** -- 리소스 남용 방지를 위한 이벤트 페이로드당 최대 64 KB
- **재귀 보호** -- 무한 루프 방지를 위한 이벤트 트리거 이벤트 최대 8레벨 깊이
- **최대 1회 전달** -- 이벤트가 지속성이나 재시도 없이 구독자에게 전달

## 토픽 구조

토픽은 `prx.` 네임스페이스 하위의 계층적 점 구분 명명 규칙을 따릅니다:

```
prx.<category>.<event>
```

### 내장 토픽

| 토픽 | 발행자 | 설명 |
|------|--------|------|
| `prx.lifecycle.started` | 호스트 | PRX가 시작되고 모든 컴포넌트가 초기화됨 |
| `prx.lifecycle.stopping` | 호스트 | PRX가 종료 중; 플러그인은 정리해야 함 |
| `prx.lifecycle.config_reloaded` | 호스트 | 설정이 핫 리로드됨 |
| `prx.session.created` | 호스트 | 새 에이전트 세션이 생성됨 |
| `prx.session.terminated` | 호스트 | 에이전트 세션이 종료됨 |
| `prx.session.message` | 호스트 | 세션에서 메시지가 전송 또는 수신됨 |
| `prx.channel.connected` | 호스트 | 채널이 연결을 수립함 |
| `prx.channel.disconnected` | 호스트 | 채널의 연결이 끊어짐 |
| `prx.channel.error` | 호스트 | 채널에서 오류가 발생함 |
| `prx.tool.before_execute` | 호스트 | 도구가 실행되려 함 (가로챌 수 있음) |
| `prx.tool.after_execute` | 호스트 | 도구 실행이 완료됨 |
| `prx.plugin.loaded` | 호스트 | 플러그인이 로드됨 |
| `prx.plugin.unloaded` | 호스트 | 플러그인이 언로드됨 |
| `prx.evolution.proposed` | 호스트 | 자기 진화 제안이 생성됨 |
| `prx.evolution.applied` | 호스트 | 자기 진화 변경이 적용됨 |
| `prx.evolution.rolled_back` | 호스트 | 자기 진화 변경이 롤백됨 |
| `prx.memory.stored` | 호스트 | 메모리 항목이 저장됨 |
| `prx.memory.recalled` | 호스트 | 컨텍스트를 위해 메모리가 리콜됨 |
| `prx.cron.tick` | 호스트 | 크론 하트비트가 발생함 |

### 사용자 정의 토픽

플러그인은 자체 네임스페이스 하위의 사용자 정의 토픽에 발행할 수 있습니다:

```
prx.plugin.<plugin_name>.<event>
```

예를 들어, 날씨 플러그인은 다음과 같이 발행할 수 있습니다:

```
prx.plugin.weather.forecast_updated
prx.plugin.weather.alert_issued
```

## 구독 패턴

### 정확한 매칭

단일 특정 토픽을 구독합니다:

```rust
event_bus.subscribe("prx.session.created", handler);
```

### 와일드카드 매칭

`*` (단일 레벨) 또는 `**` (다중 레벨)을 사용하여 하위 트리의 모든 토픽을 구독합니다:

```rust
// 모든 세션 이벤트
event_bus.subscribe("prx.session.*", handler);

// 모든 생명주기 이벤트
event_bus.subscribe("prx.lifecycle.*", handler);

// 특정 플러그인의 모든 이벤트
event_bus.subscribe("prx.plugin.weather.*", handler);

// 모든 이벤트 (아끼며 사용하세요)
event_bus.subscribe("prx.**", handler);
```

| 패턴 | 매칭됨 | 매칭되지 않음 |
|------|--------|-------------|
| `prx.session.*` | `prx.session.created`, `prx.session.terminated` | `prx.session.message.sent` |
| `prx.session.**` | `prx.session.created`, `prx.session.message.sent` | `prx.channel.connected` |
| `prx.*.connected` | `prx.channel.connected` | `prx.channel.error` |
| `prx.**` | `prx.` 하위의 모든 것 | `prx.` 네임스페이스 외부의 토픽 |

## 이벤트 구조

각 이벤트는 다음을 포함합니다:

| 필드 | 타입 | 설명 |
|------|------|------|
| `topic` | `String` | 전체 토픽 경로 (예: `prx.session.created`) |
| `payload` | `Vec<u8>` | 직렬화된 이벤트 데이터 (규약상 JSON, 최대 64 KB) |
| `source` | `String` | 발행자의 신원 (예: `host`, `plugin:weather`) |
| `timestamp` | `u64` | 밀리초 단위 Unix 타임스탬프 |
| `correlation_id` | `Option<String>` | 관련 이벤트 추적을 위한 선택적 ID |

### 페이로드 포맷

페이로드는 규약상 JSON으로 직렬화됩니다. 각 토픽은 자체 페이로드 스키마를 정의합니다. 예시:

**`prx.session.created`:**

```json
{
  "session_id": "sess_abc123",
  "channel": "telegram",
  "user_id": "user:telegram:123456789"
}
```

**`prx.tool.after_execute`:**

```json
{
  "session_id": "sess_abc123",
  "tool_name": "shell",
  "command": "ls -la /tmp",
  "duration_ms": 45,
  "success": true
}
```

## 설정

```toml
[plugins.event_bus]
enabled = true
max_payload_bytes = 65536           # 64 KB
max_recursion_depth = 8             # 무한 이벤트 루프 방지
max_subscribers_per_topic = 64      # 토픽당 구독자 제한
channel_capacity = 1024             # 내부 이벤트 큐 용량
delivery_timeout_ms = 5000          # 느린 구독자에 대한 타임아웃
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `true` | 이벤트 버스 활성화 또는 비활성화 |
| `max_payload_bytes` | `usize` | `65536` | 최대 이벤트 페이로드 크기 (64 KB) |
| `max_recursion_depth` | `u8` | `8` | 이벤트 트리거 이벤트 체인의 최대 깊이 |
| `max_subscribers_per_topic` | `usize` | `64` | 정확한 토픽당 최대 구독자 수 |
| `channel_capacity` | `usize` | `1024` | 이벤트 큐의 바운드 채널 용량 |
| `delivery_timeout_ms` | `u64` | `5000` | 구독자가 이벤트를 처리하기를 기다리는 최대 시간 |

## 플러그인에서 이벤트 버스 사용

### PDK (플러그인 개발 키트)

PRX PDK는 WASM 플러그인 내 이벤트 버스 상호작용을 위한 헬퍼 함수를 제공합니다:

```rust
use prx_pdk::event_bus;

// 이벤트 구독
event_bus::subscribe("prx.session.created", |event| {
    let payload: SessionCreated = serde_json::from_slice(&event.payload)?;
    log::info!("New session: {}", payload.session_id);
    Ok(())
})?;

// 이벤트 발행
let payload = serde_json::to_vec(&MyEvent { data: "hello" })?;
event_bus::publish("prx.plugin.my_plugin.my_event", &payload)?;
```

### 플러그인 매니페스트에서 구독

플러그인은 매니페스트 파일에 구독을 선언합니다:

```toml
# plugin.toml
[plugin]
name = "my-plugin"
version = "1.0.0"

[permissions]
event_bus_subscribe = [
    "prx.session.*",
    "prx.tool.after_execute",
]
event_bus_publish = [
    "prx.plugin.my_plugin.*",
]
```

호스트는 이러한 권한 선언을 강제합니다. 플러그인은 선언된 권한 외부의 토픽을 구독하거나 발행할 수 없습니다.

## 전달 보장

이벤트 버스는 **최대 1회** 전달을 제공합니다:

- 이벤트는 비동기적으로 모든 매칭 구독자에게 디스패치됩니다
- 구독자가 느리거나 응답이 없으면 `delivery_timeout_ms` 후 이벤트가 드롭됩니다
- 내부 이벤트 큐가 가득 차면 (`channel_capacity` 도달) 경고와 함께 새 이벤트가 드롭됩니다
- 지속성, 재시도 또는 확인 메커니즘이 없습니다

보장된 전달이 필요한 사용 사례의 경우 웹훅 시스템이나 외부 메시지 큐를 사용하는 것을 고려하세요.

## 재귀 보호

이벤트 핸들러가 다른 이벤트를 발행하면 체인이 생성됩니다. 이벤트 버스는 재귀 깊이를 추적하고 `max_recursion_depth`를 강제합니다:

```
prx.session.created           ← depth 0
  → handler publishes prx.plugin.audit.session_log    ← depth 1
    → handler publishes prx.plugin.metrics.counter     ← depth 2
      → ...
```

깊이가 제한을 초과하면 이벤트가 드롭되고 경고가 로그됩니다:

```
WARN event_bus: Recursion depth 8 exceeded for topic prx.plugin.metrics.counter, event dropped
```

## 도구 실행 가로채기

`prx.tool.before_execute` 이벤트는 가로채기를 지원합니다. 구독자는 도구 호출이 실행되기 전에 수정하거나 취소할 수 있습니다:

```rust
event_bus::subscribe("prx.tool.before_execute", |event| {
    let mut payload: ToolBeforeExecute = serde_json::from_slice(&event.payload)?;

    // 위험한 명령어 차단
    if payload.tool_name == "shell" && payload.args.contains("rm -rf") {
        return Err(EventBusError::Rejected("Dangerous command blocked".into()));
    }

    Ok(())
})?;
```

구독자가 오류를 반환하면 도구 실행이 취소되고 오류가 에이전트에 보고됩니다.

## 모니터링

### CLI

```bash
# 최근 이벤트 버스 활동 보기
prx events --tail 50

# 토픽 패턴으로 필터링
prx events --topic "prx.session.*"

# 이벤트 페이로드 표시
prx events --verbose

# 구독자 수 보기
prx events stats
```

### 메트릭

이벤트 버스는 Prometheus 메트릭을 노출합니다:

| 메트릭 | 타입 | 설명 |
|--------|------|------|
| `prx_event_bus_published_total` | Counter | 토픽별 총 발행 이벤트 수 |
| `prx_event_bus_delivered_total` | Counter | 구독자에게 전달된 총 이벤트 수 |
| `prx_event_bus_dropped_total` | Counter | 드롭된 이벤트 수 (큐 가득 참, 타임아웃, 재귀) |
| `prx_event_bus_delivery_duration_seconds` | Histogram | 구독자에게 이벤트를 전달하는 시간 |
| `prx_event_bus_subscribers` | Gauge | 토픽별 현재 구독자 수 |

## 제한 사항

- 최대 1회 전달은 큐가 가득 차거나 구독자가 느린 경우 이벤트가 손실될 수 있음을 의미합니다
- 이벤트 버스는 PRX 프로세스에 로컬입니다; 이벤트가 노드 간에 분산되지 않습니다
- 페이로드 크기는 64 KB로 제한됩니다; 큰 데이터는 내장하는 대신 ID로 참조해야 합니다
- 와일드카드 구독 (특히 `prx.**`)은 상당한 부하를 생성할 수 있습니다; 아끼며 사용하세요
- 플러그인 이벤트 핸들러는 WASM 샌드박스에서 실행되며 파일시스템이나 네트워크에 직접 접근할 수 없습니다
- 이벤트 순서는 최선의 노력입니다; 높은 부하에서 구독자가 순서 없이 이벤트를 수신할 수 있습니다

## 관련 페이지

- [플러그인 시스템 개요](./)
- [플러그인 아키텍처](./architecture) -- WASM 런타임과 호스트-게스트 경계
- [개발자 가이드](./developer-guide) -- PDK로 플러그인 빌드
- [호스트 함수](./host-functions) -- 플러그인에 사용 가능한 호스트 함수
- [웹훅](../gateway/webhooks) -- 외부 시스템에 대한 보장된 전달
