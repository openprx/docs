---
title: 세션 및 에이전트
description: PRX에서 서브 에이전트 스폰, 작업 위임, 동시 세션 관리를 위한 멀티 에이전트 오케스트레이션 도구입니다.
---

# 세션 및 에이전트

PRX는 부모 에이전트가 자식 에이전트를 스폰하고, 전문 에이전트에 작업을 위임하며, 동시 세션을 관리할 수 있는 멀티 에이전트 오케스트레이션을 위한 8개 도구를 제공합니다. 이것은 복잡한 작업이 독립적인 에이전트 인스턴스에 의해 처리되는 하위 작업으로 분해되는 PRX의 병렬 작업 분해 아키텍처의 기반입니다.

세션 도구(`sessions_spawn`, `sessions_send`, `sessions_list`, `sessions_history`, `session_status`, `subagents`)는 서브 에이전트 세션의 수명주기를 관리합니다. 에이전트 위임 도구(`delegate`, `agents_list`)는 자체 프로바이더, 모델, 도구 설정을 가진 명명된 에이전트로의 작업 라우팅을 가능하게 합니다.

세션 도구는 `all_tools()` 레지스트리에 등록되며 항상 사용할 수 있습니다. `delegate`와 `agents_list` 도구는 설정에 에이전트 정의가 존재할 때만 조건부로 등록됩니다.

## 설정

### 서브 에이전트 동시성

```toml
[agent.subagents]
max_concurrent = 4          # 최대 동시 서브 에이전트
max_depth = 3               # 최대 중첩 깊이 (서브 에이전트가 서브 에이전트를 스폰)
max_total_spawns = 20       # 루트 세션당 총 스폰 예산
child_timeout_secs = 300    # 개별 자식 실행 타임아웃
```

### 위임 에이전트 정의

명명된 에이전트는 `[agents.*]` 섹션에서 정의됩니다:

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a research assistant. Find accurate, up-to-date information."
agentic = true
max_iterations = 10
allowed_tools = ["web_search_tool", "web_fetch", "file_read", "memory_store"]

[agents.coder]
provider = "openai"
model = "gpt-4o"
system_prompt = "You are a code generation specialist. Write clean, well-tested code."
agentic = true
max_iterations = 15
allowed_tools = ["shell", "file_read", "file_write", "git_operations"]

[agents.reviewer]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a code reviewer. Focus on correctness, security, and style."
agentic = true
max_iterations = 5
allowed_tools = ["file_read", "shell"]
```

## 도구 참조

### sessions_spawn

백그라운드에서 실행되는 비동기 서브 에이전트를 스폰합니다. 실행 ID와 함께 즉시 반환됩니다. 자식이 완료되면 부모에 자동으로 알림됩니다.

```json
{
  "name": "sessions_spawn",
  "arguments": {
    "task": "Research the latest Rust async runtime benchmarks and summarize the findings.",
    "action": "spawn"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `task` | `string` | 예 | -- | 서브 에이전트의 작업 설명 / 시스템 프롬프트 |
| `action` | `string` | 아니오 | `"spawn"` | 액션: `"spawn"`, `"history"` (로그 보기), 또는 `"steer"` (리디렉션) |
| `allowed_tools` | `array` | 아니오 | 부모의 도구 | 서브 에이전트가 접근할 수 있는 도구의 하위 집합 |

### sessions_send

실행 중인 서브 에이전트 세션에 메시지를 보내 부모와 자식 간의 대화형 통신을 가능하게 합니다.

```json
{
  "name": "sessions_send",
  "arguments": {
    "session_id": "run_abc123",
    "message": "Focus on performance comparisons, not API differences."
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `session_id` | `string` | 예 | -- | 대상 서브 에이전트의 실행 ID |
| `message` | `string` | 예 | -- | 서브 에이전트에 보낼 메시지 |

### sessions_list

상태, 작업 설명, 경과 시간과 함께 모든 활성 서브 에이전트 세션을 나열합니다.

```json
{
  "name": "sessions_list",
  "arguments": {}
}
```

파라미터 필요 없음. 활성 세션 목록을 반환합니다.

### sessions_history

모든 도구 호출과 LLM 응답을 포함한 서브 에이전트 실행의 대화 로그를 봅니다.

```json
{
  "name": "sessions_history",
  "arguments": {
    "session_id": "run_abc123"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `session_id` | `string` | 예 | -- | 이력을 검색할 실행 ID |

### session_status

특정 세션의 상태를 확인합니다 (실행 중, 완료, 실패, 타임아웃).

```json
{
  "name": "session_status",
  "arguments": {
    "session_id": "run_abc123"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `session_id` | `string` | 예 | -- | 확인할 실행 ID |

### subagents

서브 에이전트 풀을 관리합니다 -- 실행 중인 서브 에이전트를 나열, 중지 또는 검사합니다.

```json
{
  "name": "subagents",
  "arguments": {
    "action": "list"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `action` | `string` | 예 | -- | 액션: `"list"`, `"stop"`, `"inspect"` |
| `session_id` | `string` | 조건부 | -- | `"stop"` 및 `"inspect"` 액션에 필수 |

### agents_list

모델, 기능, 허용된 도구와 함께 설정된 모든 위임 에이전트를 나열합니다. `[agents.*]` 섹션이 정의된 경우에만 등록됩니다.

```json
{
  "name": "agents_list",
  "arguments": {}
}
```

파라미터 필요 없음. 설정의 에이전트 정의를 반환합니다.

### delegate

자체 프로바이더, 모델, 도구 세트를 가진 명명된 에이전트에 작업을 위임합니다. 위임 에이전트는 격리된 에이전틱 루프를 실행하고 결과를 반환합니다.

```json
{
  "name": "delegate",
  "arguments": {
    "agent": "researcher",
    "task": "Find the top 5 Rust web frameworks by GitHub stars in 2026."
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `agent` | `string` | 예 | -- | 설정된 에이전트의 이름 (`[agents.*]`에서) |
| `task` | `string` | 예 | -- | 위임 에이전트의 작업 설명 |

## 사용 패턴

### 병렬 리서치

여러 주제를 동시에 리서치하기 위해 다수의 서브 에이전트 스폰:

```
부모: 프로젝트를 위한 3개 데이터베이스 엔진 비교가 필요함.

  [sessions_spawn] task="Research PostgreSQL strengths, weaknesses, and use cases"
  [sessions_spawn] task="Research SQLite strengths, weaknesses, and use cases"
  [sessions_spawn] task="Research DuckDB strengths, weaknesses, and use cases"

  [세 개 모두 완료 대기]
  [결과를 비교 테이블로 통합]
```

### 위임 코드 리뷰

특정 작업에 전문 위임 에이전트 사용:

```
부모: 이 풀 리퀘스트의 보안 이슈를 검토.

  [delegate] agent="reviewer", task="Review the diff in /tmp/pr-42.patch for security vulnerabilities"

  [reviewer 에이전트가 file_read와 shell 도구로 실행]
  [상세한 보안 리뷰 반환]
```

### 계층적 작업 분해

서브 에이전트가 자체 서브 에이전트를 스폰할 수 있음 (`max_depth`까지):

```
부모 에이전트
  ├── 리서치 에이전트
  │     ├── 웹 검색 서브 에이전트
  │     └── 문서 분석 서브 에이전트
  ├── 코드 생성 에이전트
  └── 테스트 에이전트
```

## 보안

### 깊이 및 동시성 제한

PRX는 리소스 고갈을 방지하기 위해 서브 에이전트 스폰에 엄격한 제한을 강제합니다:

- **max_concurrent**: 동시 실행 서브 에이전트 제한 (기본: 4)
- **max_depth**: 중첩 깊이 제한 (기본: 3). 최대 깊이에서 자식의 사용 가능한 도구에서 `sessions_spawn` 도구가 제거됩니다.
- **max_total_spawns**: 루트 세션당 총 스폰 수 제한 (기본: 20)
- **child_timeout_secs**: 타임아웃을 초과하는 서브 에이전트를 종료 (기본: 300초)

### 도구 제한

서브 에이전트는 부모의 샌드박스 정책을 상속하지만 제한된 도구 세트를 가질 수 있습니다:

```json
{
  "name": "sessions_spawn",
  "arguments": {
    "task": "Search the web for information",
    "allowed_tools": ["web_search_tool", "web_fetch"]
  }
}
```

위임 에이전트는 설정에서 명시적으로 정의된 도구를 가집니다. `allowed_tools` 목록 외부의 도구에 접근할 수 없습니다.

### 자격 증명 격리

위임 에이전트는 부모와 다른 프로바이더와 API 키를 사용할 수 있습니다:

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
# 프로바이더의 설정된 API 키 사용
```

이를 통해 작업 요구사항에 따라 다른 LLM 프로바이더로 작업을 라우팅할 수 있으며, 각 프로바이더의 자격 증명은 격리됩니다.

### 정책 엔진

세션 및 에이전트 도구는 정책 엔진의 적용을 받습니다:

```toml
[security.tool_policy.groups]
sessions = "allow"

[security.tool_policy.tools]
delegate = "supervised"    # 위임에 승인 필요
```

## 관련 페이지

- [서브 에이전트](/ko/prx/agent/subagents) -- 서브 에이전트 아키텍처 및 스폰 모델
- [에이전트 런타임](/ko/prx/agent/runtime) -- 에이전트 실행 아키텍처
- [에이전트 루프](/ko/prx/agent/loop) -- 핵심 실행 주기
- [세션 워커](/ko/prx/agent/session-worker) -- 세션을 위한 프로세스 격리
- [설정 참조](/ko/prx/config/reference) -- 에이전트 및 서브에이전트 설정
- [도구 개요](/ko/prx/tools/) -- 모든 도구 및 레지스트리 시스템
