---
title: 도구 개요
description: PRX는 12개 카테고리에 걸쳐 46개 이상의 내장 도구를 제공합니다. 도구는 에이전트가 에이전틱 루프에서 OS, 네트워크, 메모리, 외부 서비스와 상호작용하기 위해 호출할 수 있는 기능입니다.
---

# 도구 개요

도구는 PRX 에이전트가 추론 루프에서 호출할 수 있는 기능입니다. LLM이 작업을 수행해야 한다고 판단하면 -- 명령어 실행, 파일 읽기, 웹 검색, 메모리 저장 등 -- 구조화된 JSON 인자와 함께 이름으로 도구를 호출합니다. PRX는 도구를 실행하고, 보안 정책을 적용하며, 다음 추론 단계를 위해 결과를 LLM에 반환합니다.

PRX는 기본 파일 I/O부터 브라우저 자동화, 멀티 에이전트 위임, MCP 프로토콜 통합까지 12개 카테고리에 걸쳐 **46개 이상의 내장 도구**를 제공합니다.

## 도구 아키텍처

모든 도구는 `Tool` 트레이트를 구현합니다:

```rust
#[async_trait]
pub trait Tool: Send + Sync {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn parameters_schema(&self) -> serde_json::Value;
    async fn execute(&self, args: serde_json::Value) -> Result<ToolResult>;
}
```

각 도구는 파라미터에 대한 JSON Schema를 제공하며, 이는 함수 정의로 LLM에 전송됩니다. LLM은 구조화된 호출을 생성하고, PRX는 실행 전에 스키마에 대해 인자를 검증합니다.

## 도구 레지스트리: `default_tools()` vs `all_tools()`

PRX는 2단계 레지스트리 시스템을 사용합니다:

### `default_tools()` -- 최소 핵심 (3개 도구)

경량 또는 제한된 에이전트를 위한 최소 도구 세트입니다. 항상 사용 가능하며, 추가 설정이 필요 없습니다:

| 도구 | 설명 |
|------|------|
| `shell` | 샌드박스 격리를 사용한 셸 명령 실행 |
| `file_read` | 파일 내용 읽기 (ACL 인식) |
| `file_write` | 파일 내용 쓰기 |

### `all_tools()` -- 전체 레지스트리 (46개 이상 도구)

설정에 따라 조립되는 완전한 도구 세트입니다. 활성화된 기능에 따라 도구가 조건부로 등록됩니다:

- **항상 등록**: 핵심 도구, 메모리, 크론, 스케줄링, git, 비전, 노드, pushover, 캔버스, 프록시 설정, 스키마
- **조건부 등록**: 브라우저 (`browser.enabled` 필요), HTTP 요청 (`http_request.enabled` 필요), 웹 검색 (`web_search.enabled` 필요), 웹 페치 (`web_search.fetch_enabled` + `browser.allowed_domains` 필요), MCP (`mcp.enabled` 필요), Composio (API 키 필요), delegate/agents_list (에이전트 정의 필요)

## 카테고리 참조

### 핵심 (3개 도구) -- 항상 사용 가능

`default_tools()`와 `all_tools()` 모두에 존재하는 기본 도구입니다.

| 도구 | 설명 |
|------|------|
| `shell` | 설정 가능한 샌드박스 격리(Landlock/Firejail/Bubblewrap/Docker)로 셸 명령을 실행합니다. 60초 타임아웃, 1MB 출력 제한, 환경 정리. |
| `file_read` | 경로 검증으로 파일 내용을 읽습니다. 메모리 ACL이 활성화되면 접근 제어를 강제하기 위해 메모리 마크다운 파일 접근을 차단합니다. |
| `file_write` | 파일에 내용을 씁니다. 보안 정책 검사를 받습니다. |

### 메모리 (5개 도구)

에이전트의 영구 지식을 저장, 검색, 관리하기 위한 장기 메모리 작업입니다.

| 도구 | 설명 |
|------|------|
| `memory_store` | 사실, 선호도 또는 노트를 장기 메모리에 저장합니다. 카테고리 지원: `core` (영구), `daily` (세션), `conversation` (대화 컨텍스트), 또는 사용자 정의. |
| `memory_forget` | 장기 메모리에서 특정 항목을 제거합니다. |
| `memory_get` | 키로 특정 메모리 항목을 검색합니다. 활성화 시 ACL 인식. |
| `memory_recall` | 키워드 또는 시맨틱 유사도로 메모리를 회상합니다. 메모리 ACL이 활성화되면 비활성화됩니다. |
| `memory_search` | 메모리 항목에 대한 전문 및 벡터 검색. 활성화 시 ACL 인식. |

### 크론 / 스케줄링 (9개 도구)

시간 기반 작업 자동화 및 Xin 스케줄링 엔진입니다.

| 도구 | 설명 |
|------|------|
| `cron` | 레거시 크론 진입점 -- 예약 작업 생성 또는 관리. |
| `cron_add` | 크론 표현식, 명령어, 선택적 설명으로 새 크론 작업을 추가합니다. |
| `cron_list` | 일정과 상태와 함께 등록된 모든 크론 작업을 나열합니다. |
| `cron_remove` | ID로 크론 작업을 제거합니다. |
| `cron_update` | 기존 크론 작업의 일정, 명령어 또는 설정을 업데이트합니다. |
| `cron_run` | 크론 작업을 즉시 수동으로 트리거합니다. |
| `cron_runs` | 크론 작업 실행 이력과 로그를 봅니다. |
| `schedule` | 자연어 시간 표현으로 일회성 또는 반복 작업을 예약합니다. |
| `xin` | Xin 스케줄링 엔진 -- 의존성 체인과 조건부 실행을 갖춘 고급 작업 스케줄링. |

### 브라우저 / 비전 (5개 도구)

웹 자동화 및 이미지 처리. 브라우저 도구는 `[browser] enabled = true`가 필요합니다.

| 도구 | 설명 |
|------|------|
| `browser` | 플러거블 백엔드(agent-browser CLI, Rust 네이티브, computer-use 사이드카)를 사용한 전체 브라우저 자동화. 내비게이션, 폼 입력, 클릭, 스크린샷, OS 레벨 작업을 지원합니다. |
| `browser_open` | 브라우저에서 간단한 URL 열기. `browser.allowed_domains`로 도메인 제한. |
| `screenshot` | 현재 화면 또는 특정 창의 스크린샷을 캡처합니다. |
| `image` | 이미지 처리 및 변환 (리사이즈, 크롭, 포맷 변환). |
| `image_info` | 이미지 파일에서 메타데이터와 크기를 추출합니다. |

### 네트워크 (4개 도구)

HTTP 요청, 웹 검색, 웹 페치, MCP 프로토콜 통합입니다.

| 도구 | 설명 |
|------|------|
| `http_request` | API에 HTTP 요청을 보냅니다. 거부 기본: `allowed_domains`만 접근 가능. 설정 가능한 타임아웃과 최대 응답 크기. |
| `web_search_tool` | DuckDuckGo (무료, 키 불필요) 또는 Brave Search (API 키 필요)를 통해 웹을 검색합니다. |
| `web_fetch` | 웹 페이지에서 콘텐츠를 가져오고 추출합니다. `web_search.fetch_enabled`와 `browser.allowed_domains` 설정이 필요합니다. |
| `mcp` | Model Context Protocol 클라이언트 -- 외부 MCP 서버(stdio 또는 HTTP 전송)에 연결하여 도구를 호출합니다. 워크스페이스 로컬 `mcp.json` 검색을 지원합니다. |

### 메시징 (2개 도구)

통신 채널을 통해 메시지를 보냅니다.

| 도구 | 설명 |
|------|------|
| `message_send` | 설정된 채널과 수신자에게 메시지(텍스트, 미디어, 음성)를 보냅니다. 활성 채널로 자동 라우팅합니다. |
| `gateway` | Axum HTTP/WebSocket 게이트웨이를 통한 원시 메시지 전송을 위한 저수준 게이트웨이 접근. |

### 세션 / 에이전트 (8개 도구)

멀티 에이전트 오케스트레이션: 서브 에이전트 스폰, 작업 위임, 동시 세션 관리.

| 도구 | 설명 |
|------|------|
| `sessions_spawn` | 백그라운드에서 실행되는 비동기 서브 에이전트를 스폰합니다. 실행 ID와 함께 즉시 반환; 완료 시 자동 알림. `history`와 `steer` 액션을 지원합니다. |
| `sessions_send` | 실행 중인 서브 에이전트 세션에 메시지를 보냅니다. |
| `sessions_list` | 상태와 함께 모든 활성 서브 에이전트 세션을 나열합니다. |
| `sessions_history` | 서브 에이전트 실행의 대화 로그를 봅니다. |
| `session_status` | 특정 세션의 상태를 확인합니다. |
| `subagents` | 서브 에이전트 풀 관리 -- 서브 에이전트 나열, 중지 또는 검사. |
| `agents_list` | 모델과 기능과 함께 설정된 모든 위임 에이전트를 나열합니다. 설정에 에이전트가 정의된 경우에만 등록됩니다. |
| `delegate` | 자체 프로바이더, 모델, 도구 세트를 가진 명명된 에이전트에 작업을 위임합니다. 대체 자격 증명과 격리된 에이전틱 루프를 지원합니다. |

### 원격 디바이스 (2개 도구)

원격 노드 및 푸시 알림과 상호작용합니다.

| 도구 | 설명 |
|------|------|
| `nodes` | 분산 배포에서 원격 PRX 노드를 관리하고 통신합니다. |
| `pushover` | Pushover 서비스를 통해 푸시 알림을 보냅니다. |

### Git (1개 도구)

버전 관리 작업입니다.

| 도구 | 설명 |
|------|------|
| `git_operations` | 워크스페이스 저장소에서 Git 작업(status, diff, commit, push, pull, log, branch)을 수행합니다. |

### 설정 (2개 도구)

런타임 설정 관리입니다.

| 도구 | 설명 |
|------|------|
| `config_reload` | 프로세스를 재시작하지 않고 PRX 설정 파일을 핫 리로드합니다. |
| `proxy_config` | 런타임에 프록시/네트워크 설정을 보고 수정합니다. |

### 서드파티 통합 (1개 도구)

외부 플랫폼 커넥터입니다.

| 도구 | 설명 |
|------|------|
| `composio` | Composio 플랫폼을 통해 250개 이상의 앱과 서비스에 연결합니다. Composio API 키가 필요합니다. |

### 렌더링 (2개 도구)

콘텐츠 생성 및 출력 포맷팅입니다.

| 도구 | 설명 |
|------|------|
| `canvas` | 시각적 출력을 위한 구조화된 콘텐츠(테이블, 차트, 다이어그램)를 렌더링합니다. |
| `tts` | 텍스트 음성 변환 -- 텍스트를 음성 메시지로 변환하여 현재 대화에 보냅니다. MP3 생성, M4A 변환, 전달을 자동으로 처리합니다. |

### 관리자 (1개 도구)

내부 스키마 및 진단입니다.

| 도구 | 설명 |
|------|------|
| `schema` | 크로스 프로바이더 LLM 호환성을 위한 JSON Schema 정리 및 정규화. `$ref` 해결, union 평탄화, 지원되지 않는 키워드 제거. |

## 전체 도구 매트릭스

| 도구 | 카테고리 | 기본 | 조건 |
|------|----------|------|------|
| `shell` | 핵심 | 예 | 항상 |
| `file_read` | 핵심 | 예 | 항상 |
| `file_write` | 핵심 | 예 | 항상 |
| `memory_store` | 메모리 | -- | `all_tools()` |
| `memory_forget` | 메모리 | -- | `all_tools()` |
| `memory_get` | 메모리 | -- | `all_tools()` |
| `memory_recall` | 메모리 | -- | `all_tools()`, `memory.acl_enabled = true`일 때 비활성화 |
| `memory_search` | 메모리 | -- | `all_tools()` |
| `cron` | 크론 | -- | `all_tools()` |
| `cron_add` | 크론 | -- | `all_tools()` |
| `cron_list` | 크론 | -- | `all_tools()` |
| `cron_remove` | 크론 | -- | `all_tools()` |
| `cron_update` | 크론 | -- | `all_tools()` |
| `cron_run` | 크론 | -- | `all_tools()` |
| `cron_runs` | 크론 | -- | `all_tools()` |
| `schedule` | 스케줄링 | -- | `all_tools()` |
| `xin` | 스케줄링 | -- | `all_tools()` |
| `browser` | 브라우저 | -- | `browser.enabled = true` |
| `browser_open` | 브라우저 | -- | `browser.enabled = true` |
| `screenshot` | 비전 | -- | `all_tools()` |
| `image` | 비전 | -- | `all_tools()` (암시적, ImageTool 경유) |
| `image_info` | 비전 | -- | `all_tools()` |
| `http_request` | 네트워크 | -- | `http_request.enabled = true` |
| `web_search_tool` | 네트워크 | -- | `web_search.enabled = true` |
| `web_fetch` | 네트워크 | -- | `web_search.fetch_enabled = true` + `browser.allowed_domains` |
| `mcp` | 네트워크 | -- | `mcp.enabled = true` + 서버 정의 |
| `message_send` | 메시징 | -- | 채널 활성 (게이트웨이 수준에서 등록) |
| `gateway` | 메시징 | -- | `all_tools()` |
| `sessions_spawn` | 세션 | -- | `all_tools()` |
| `sessions_send` | 세션 | -- | `all_tools()` |
| `sessions_list` | 세션 | -- | `all_tools()` |
| `sessions_history` | 세션 | -- | `all_tools()` |
| `session_status` | 세션 | -- | `all_tools()` |
| `subagents` | 세션 | -- | `all_tools()` |
| `agents_list` | 에이전트 | -- | `[agents.*]` 섹션 정의 |
| `delegate` | 에이전트 | -- | `[agents.*]` 섹션 정의 |
| `nodes` | 원격 | -- | `all_tools()` |
| `pushover` | 원격 | -- | `all_tools()` |
| `git_operations` | Git | -- | `all_tools()` |
| `config_reload` | 설정 | -- | `all_tools()` |
| `proxy_config` | 설정 | -- | `all_tools()` |
| `composio` | 서드파티 | -- | `composio.api_key` 설정 |
| `canvas` | 렌더링 | -- | `all_tools()` |
| `tts` | 렌더링 | -- | 채널 활성 (게이트웨이 수준에서 등록) |
| `schema` | 관리자 | -- | 내부 (스키마 정규화 모듈) |

## 도구 활성화 및 비활성화

### 기능 게이트 도구

많은 도구는 해당 설정 섹션을 통해 활성화됩니다. `config.toml`에 다음을 추가합니다:

```toml
# ── 브라우저 도구 ──────────────────────────────────────────────
[browser]
enabled = true
allowed_domains = ["github.com", "stackoverflow.com", "*.openprx.dev"]
backend = "agent_browser"   # "agent_browser" | "rust_native" | "computer_use"

# ── HTTP 요청 도구 ─────────────────────────────────────────────
[http_request]
enabled = true
allowed_domains = ["api.github.com", "api.openai.com"]
max_response_size = 1000000  # 1MB
timeout_secs = 30

# ── 웹 검색 도구 ───────────────────────────────────────────────
[web_search]
enabled = true
provider = "duckduckgo"      # "duckduckgo" (무료) 또는 "brave" (API 키 필요)
# brave_api_key = "..."
max_results = 5
timeout_secs = 10

# web_fetch를 활성화하여 페이지 콘텐츠 추출도 가능:
fetch_enabled = true
fetch_max_chars = 50000

# ── Composio 통합 ────────────────────────────────────────────
[composio]
enabled = true
api_key = "your-composio-key"
entity_id = "default"
```

### 도구 정책 파이프라인

세밀한 제어를 위해 `[security.tool_policy]` 섹션을 사용하여 개별 도구나 그룹을 허용, 거부, 감독할 수 있습니다:

```toml
[security.tool_policy]
# 기본 정책: "allow", "deny", 또는 "supervised"
default = "allow"

# 그룹 수준 정책
[security.tool_policy.groups]
sessions = "allow"
automation = "allow"
hardware = "deny"

# 도구별 재정의 (최고 우선순위)
[security.tool_policy.tools]
shell = "supervised"     # 실행 전 승인 필요
gateway = "allow"
composio = "deny"        # API 키가 설정되어 있어도 Composio 비활성화
```

정책 해결 순서 (최고 우선순위 순):
1. 도구별 정책 (`security.tool_policy.tools.<name>`)
2. 그룹 정책 (`security.tool_policy.groups.<group>`)
3. 기본 정책 (`security.tool_policy.default`)

### 위임 에이전트 도구 제한

위임 에이전트를 설정할 때 접근할 수 있는 도구를 제한할 수 있습니다:

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a research assistant."
agentic = true
max_iterations = 10
allowed_tools = ["web_search_tool", "web_fetch", "file_read", "memory_store"]
```

## MCP 도구 통합

PRX는 Model Context Protocol (MCP) 클라이언트를 구현하여 외부 MCP 서버에 연결하고 해당 도구를 에이전트에 노출할 수 있습니다.

### 설정

`config.toml`에 MCP 서버를 정의합니다:

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
transport = "stdio"

[mcp.servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
transport = "stdio"
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_..." }

[mcp.servers.remote-api]
url = "https://mcp.example.com/sse"
transport = "streamable_http"
```

### 워크스페이스 로컬 `mcp.json`

PRX는 VS Code 및 Claude Desktop과 동일한 형식을 따르는 워크스페이스 로컬 `mcp.json` 파일에서도 MCP 서버를 검색합니다:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./my-mcp-server/index.js"],
      "env": { "API_KEY": "..." }
    }
  }
}
```

`mcp.json`의 명령어는 안전한 런처 화이트리스트로 제한됩니다: `npx`, `node`, `python`, `python3`, `uvx`, `uv`, `deno`, `bun`, `docker`, `cargo`, `go`, `ruby`, `php`, `dotnet`, `java`.

### 동적 도구 검색

MCP 도구는 `tools/list` 프로토콜 메서드를 통해 런타임에 검색됩니다. 각 MCP 서버의 도구는 네임스페이스가 지정되어 LLM에 호출 가능한 함수로 노출됩니다. `mcp` 도구는 각 에이전트 턴 전에 도구를 재검색하는 `refresh()` 훅을 지원합니다.

위험한 환경 변수(`LD_PRELOAD`, `DYLD_INSERT_LIBRARIES`, `NODE_OPTIONS`, `PYTHONPATH` 등)는 MCP 서버 프로세스에서 자동으로 제거됩니다.

## 보안: 샌드박싱과 ACL

### 도구 샌드박싱

`shell` 도구는 설정 가능한 샌드박스 내에서 명령을 실행합니다. PRX는 4개의 샌드박스 백엔드와 no-op 대체를 지원합니다:

```toml
[security.sandbox]
enabled = true           # None = 자동 감지, true/false = 명시적
backend = "auto"         # "auto" | "landlock" | "firejail" | "bubblewrap" | "docker" | "none"

# 커스텀 Firejail 인자 (backend = "firejail"일 때)
firejail_args = ["--net=none", "--noroot"]
```

| 백엔드 | 플랫폼 | 격리 수준 | 참고 |
|--------|--------|-----------|------|
| Landlock | Linux (커널 LSM) | 파일시스템 | 커널 네이티브, 추가 의존성 없음 |
| Firejail | Linux | 전체 (네트워크, 파일시스템, PID) | 유저 스페이스, 널리 사용 가능 |
| Bubblewrap | Linux, macOS | 네임스페이스 기반 | 유저 네임스페이스, 경량 |
| Docker | 모든 플랫폼 | 컨테이너 | 완전한 컨테이너 격리 |
| None | 모든 플랫폼 | 애플리케이션 계층만 | OS 수준 격리 없음 |

자동 감지 모드(`backend = "auto"`)는 사용 가능한 백엔드를 순서대로 탐색합니다: Landlock, Firejail, Bubblewrap, Docker, 그리고 경고와 함께 None으로 대체합니다.

### 셸 환경 정리

`shell` 도구는 자식 프로세스에 엄격한 화이트리스트의 환경 변수만 전달합니다: `PATH`, `HOME`, `TERM`, `LANG`, `LC_ALL`, `LC_CTYPE`, `USER`, `SHELL`, `TMPDIR`. API 키, 토큰, 시크릿은 절대 노출되지 않습니다.

### 메모리 ACL

`memory.acl_enabled = true`일 때, 메모리 작업에 접근 제어가 적용됩니다:

- `file_read`는 메모리 마크다운 파일 접근을 차단합니다
- `memory_recall`은 완전히 비활성화됩니다 (도구 레지스트리에서 제거)
- `memory_get`과 `memory_search`는 주체별 접근 제한을 강제합니다

### 보안 정책

모든 도구 호출은 실행 전에 `SecurityPolicy` 계층을 통과합니다. 정책 엔진은:

- 도구 정책 규칙에 따라 작업을 차단할 수 있음
- `supervised` 도구에 대해 감독자 승인을 요구할 수 있음
- 모든 도구 호출을 감사할 수 있음
- 레이트 리밋과 리소스 제약을 강제할 수 있음

```toml
[security.resources]
max_memory_mb = 512
max_cpu_percent = 80
max_open_files = 256
```

## 확장: 커스텀 도구 작성

새 도구를 추가하려면:

1. `src/tools/`에 `Tool` 트레이트를 구현하는 새 모듈을 생성합니다
2. `src/tools/mod.rs`의 `all_tools_with_runtime_ext()`에 등록합니다
3. `mod.rs`에 `pub mod` 및 `pub use` 항목을 추가합니다

예시:

```rust
use super::traits::{Tool, ToolResult};
use async_trait::async_trait;
use serde_json::json;

pub struct MyTool { /* ... */ }

#[async_trait]
impl Tool for MyTool {
    fn name(&self) -> &str { "my_tool" }

    fn description(&self) -> &str {
        "Does something useful."
    }

    fn parameters_schema(&self) -> serde_json::Value {
        json!({
            "type": "object",
            "properties": {
                "input": { "type": "string", "description": "The input value" }
            },
            "required": ["input"]
        })
    }

    async fn execute(&self, args: serde_json::Value) -> anyhow::Result<ToolResult> {
        let input = args["input"].as_str().unwrap_or_default();
        Ok(ToolResult {
            success: true,
            output: format!("Processed: {input}"),
            error: None,
        })
    }
}
```

자세한 변경 플레이북은 `AGENTS.md` 섹션 7.3을 참조하세요.
