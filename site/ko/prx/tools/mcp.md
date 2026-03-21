---
title: MCP 통합
description: stdio 또는 HTTP 전송을 통해 외부 MCP 서버에 연결하는 Model Context Protocol 클라이언트로, 동적 도구 검색과 네임스페이싱을 지원합니다.
---

# MCP 통합

PRX는 외부 MCP 서버에 연결하고 해당 도구를 에이전트에 노출하는 Model Context Protocol (MCP) 클라이언트를 구현합니다. MCP는 LLM 애플리케이션이 외부 도구 프로바이더와 통신하는 방법을 표준화하는 개방형 프로토콜로, PRX가 파일 시스템, 데이터베이스, API 등을 위한 MCP 호환 서버의 성장하는 생태계와 통합할 수 있게 합니다.

`mcp` 도구는 기능 게이트가 적용되며 `mcp.enabled = true`와 최소 하나의 서버가 정의되어야 합니다. PRX는 stdio 전송(로컬 프로세스 통신)과 HTTP 전송(원격 서버 통신)을 모두 지원합니다. MCP 서버의 도구는 `tools/list` 프로토콜 메서드를 통해 런타임에 동적으로 검색되며, 내장 도구와의 충돌을 피하기 위해 네임스페이스가 지정됩니다.

PRX는 VS Code 및 Claude Desktop에서 사용하는 것과 동일한 형식을 따르는 워크스페이스 로컬 `mcp.json` 검색도 지원하여 도구 간 MCP 서버 설정을 쉽게 공유할 수 있습니다.

## 설정

### config.toml의 서버 정의

`[mcp.servers]` 섹션에서 MCP 서버를 정의합니다:

```toml
[mcp]
enabled = true

# ── Stdio 전송 (로컬 프로세스) ──────────────────────────
[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
enabled = true
startup_timeout_ms = 10000
request_timeout_ms = 30000
tool_name_prefix = "fs"

[mcp.servers.github]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_xxxxxxxxxxxx" }
tool_name_prefix = "gh"

[mcp.servers.sqlite]
transport = "stdio"
command = "uvx"
args = ["mcp-server-sqlite", "--db-path", "/home/user/data.db"]
tool_name_prefix = "sql"

# ── HTTP 전송 (원격 서버) ───────────────────────────
[mcp.servers.remote-api]
transport = "http"
url = "https://mcp.example.com/sse"
request_timeout_ms = 60000
tool_name_prefix = "api"

[mcp.servers.streamable]
transport = "streamable_http"
url = "http://localhost:8090/mcp"
request_timeout_ms = 30000
```

### 서버별 설정

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `true` | 이 서버 활성화 또는 비활성화 |
| `transport` | `string` | `"stdio"` | 전송 유형: `"stdio"`, `"http"`, `"streamable_http"` |
| `command` | `string` | -- | stdio 전송용 명령 (예: `"npx"`, `"uvx"`, `"node"`) |
| `args` | `string[]` | `[]` | stdio 명령의 인자 |
| `url` | `string` | -- | HTTP 전송용 URL |
| `env` | `map` | `{}` | stdio 프로세스의 환경 변수 |
| `startup_timeout_ms` | `u64` | `10000` | 서버 시작을 기다리는 최대 시간 |
| `request_timeout_ms` | `u64` | `30000` | 요청별 타임아웃 |
| `tool_name_prefix` | `string` | `"mcp"` | 도구 이름의 접두사 (예: `"fs"`이면 `"fs_read_file"`) |
| `allow_tools` | `string[]` | `[]` | 도구 허용 목록 (비어있으면 검색된 모든 도구 허용) |
| `deny_tools` | `string[]` | `[]` | 도구 거부 목록 (허용 목록보다 우선) |

### 워크스페이스 로컬 mcp.json

PRX는 VS Code 및 Claude Desktop과 동일한 형식을 따르는 워크스페이스 로컬 `mcp.json` 파일에서 MCP 서버를 검색합니다:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./my-mcp-server/index.js"],
      "env": { "API_KEY": "..." }
    },
    "python-tools": {
      "command": "python3",
      "args": ["-m", "my_mcp_module"],
      "env": {}
    }
  }
}
```

이 파일을 워크스페이스 루트 디렉토리에 배치합니다. PRX는 시작 시와 도구가 새로고침될 때 `mcp.json`을 확인합니다.

**안전한 런처 화이트리스트**: `mcp.json`의 명령은 안전한 런처 화이트리스트로 제한됩니다:

| 런처 | 언어 / 플랫폼 |
|------|---------------|
| `npx` | Node.js (npm) |
| `node` | Node.js |
| `python` | Python |
| `python3` | Python 3 |
| `uvx` | Python (uv) |
| `uv` | Python (uv) |
| `deno` | Deno |
| `bun` | Bun |
| `docker` | Docker |
| `cargo` | Rust |
| `go` | Go |
| `ruby` | Ruby |
| `php` | PHP |
| `dotnet` | .NET |
| `java` | Java |

이 화이트리스트에 없는 명령은 `mcp.json` 파일을 통한 임의 명령 실행을 방지하기 위해 거부됩니다.

## 사용법

### 동적 도구 검색

MCP 도구는 MCP 클라이언트가 서버에 연결할 때 자동으로 검색됩니다. 에이전트는 도구 레지스트리의 일반 도구로 봅니다:

```
사용 가능한 MCP 도구:
  fs_read_file          - 파일 내용 읽기
  fs_write_file         - 파일에 내용 쓰기
  fs_list_directory     - 디렉토리 내용 나열
  gh_create_issue       - GitHub 이슈 생성
  gh_search_code        - GitHub에서 코드 검색
  sql_query             - SQL 쿼리 실행
  sql_list_tables       - 데이터베이스 테이블 나열
```

### 도구 네임스페이싱

각 MCP 서버의 도구는 이름 충돌을 피하기 위해 설정된 `tool_name_prefix`가 접두사로 붙습니다:

- 접두사 `"fs"`인 서버 `filesystem`은 `fs_read_file`, `fs_write_file` 등을 노출
- 접두사 `"gh"`인 서버 `github`은 `gh_create_issue`, `gh_search_code` 등을 노출
- 접두사 `"sql"`인 서버 `sqlite`은 `sql_query`, `sql_list_tables` 등을 노출

두 서버가 같은 기본 이름의 도구를 노출하면 접두사로 구분됩니다.

### 도구 새로고침

`mcp` 도구는 각 에이전트 턴 전에 도구를 재검색하는 `refresh()` 훅을 지원합니다. 이는 다음을 의미합니다:

- MCP 서버에 추가된 새 도구가 PRX 재시작 없이 사용 가능
- 제거된 도구는 더 이상 LLM에 제공되지 않음
- 도구 스키마 변경이 즉시 반영됨

### 에이전트 호출

에이전트는 내장 도구와 동일한 방식으로 MCP 도구를 호출합니다:

```json
{
  "name": "gh_create_issue",
  "arguments": {
    "owner": "openprx",
    "repo": "prx",
    "title": "Add support for MCP resource subscriptions",
    "body": "PRX should support MCP resource change notifications..."
  }
}
```

PRX는 이 호출을 적절한 MCP 서버로 라우팅하고, 설정된 전송을 통해 요청을 보내며, 결과를 LLM에 반환합니다.

## 전송 상세

### Stdio 전송

Stdio 전송은 MCP 서버를 자식 프로세스로 스폰하고 JSON-RPC를 사용하여 stdin/stdout을 통해 통신합니다:

```
PRX 프로세스
    │
    ├── stdin  ──→ MCP 서버 프로세스
    └── stdout ←── MCP 서버 프로세스
```

- 서버는 첫 사용 시(지연 초기화) 또는 데몬 시작 시 시작됨
- 프로세스 수명주기는 PRX가 관리(크래시 시 자동 재시작)
- 서버의 stderr 출력은 진단을 위해 캡처됨

### HTTP 전송

HTTP 전송은 HTTP를 통해 원격 MCP 서버에 연결합니다:

```
PRX  ──HTTP/SSE──→  원격 MCP 서버
```

- 스트리밍 응답을 위한 Server-Sent Events (SSE) 지원
- 첫 도구 호출 시 연결 설정
- 서버별 설정 가능한 헤더를 통한 인증 지원

### Streamable HTTP 전송

Streamable HTTP 전송은 최신 MCP streamable HTTP 프로토콜을 사용합니다:

```
PRX  ──HTTP POST──→  MCP 서버 (streamable)
     ←──Streaming──
```

이 전송은 양방향 통신에서 SSE보다 효율적이며 새 MCP 서버 구현에 권장되는 전송입니다.

## 파라미터

MCP 도구 자체에는 고정된 파라미터가 없습니다. 각 MCP 서버는 `tools/list` 프로토콜 메서드를 통해 검색되는 자체 파라미터 스키마를 가진 도구를 노출합니다. 파라미터는 개별 MCP 서버 구현에 의해 정의됩니다.

MCP 메타 도구(관리용)는 다음을 지원합니다:

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `action` | `string` | 아니오 | -- | 관리 액션: `"status"`, `"refresh"`, `"servers"` |

## 보안

### 환경 변수 정리

PRX는 인젝션 공격을 방지하기 위해 MCP 서버 프로세스에서 위험한 환경 변수를 자동으로 제거합니다:

| 제거된 변수 | 위험 |
|-------------|------|
| `LD_PRELOAD` | 라이브러리 인젝션 (Linux) |
| `DYLD_INSERT_LIBRARIES` | 라이브러리 인젝션 (macOS) |
| `NODE_OPTIONS` | Node.js 런타임 조작 |
| `PYTHONPATH` | Python 모듈 경로 하이재킹 |
| `PYTHONSTARTUP` | Python 시작 스크립트 인젝션 |
| `RUBYOPT` | Ruby 런타임 옵션 인젝션 |
| `PERL5OPT` | Perl 런타임 옵션 인젝션 |

명시적으로 설정된 `env` 변수와 안전한 시스템 변수만 자식 프로세스에 전달됩니다.

### mcp.json 명령 화이트리스트

`mcp.json` 파일 형식은 편리하지만 잠재적으로 위험합니다. PRX는 명령을 알려진 안전한 런처 화이트리스트로 제한하여 이를 완화합니다. 이는 악의적인 `mcp.json`이 임의의 바이너리를 실행하는 것을 방지합니다.

### 도구 허용/거부 목록

서버별 도구 필터링은 에이전트에 노출되는 도구를 제어합니다:

```toml
[mcp.servers.filesystem]
# 이 도구만 노출
allow_tools = ["read_file", "list_directory"]
# 검색되더라도 이 도구 차단
deny_tools = ["write_file", "delete_file"]
```

거부 목록은 허용 목록보다 우선합니다. 이는 기본적으로 모든 도구를 허용하되 위험한 도구를 명시적으로 차단하는 심층 방어 접근법을 가능하게 합니다.

### 네트워크 격리

stdio 전송 서버의 경우 서버 프로세스는 샌드박스 설정을 상속합니다. 샌드박스가 네트워크 접근을 차단하면 MCP 서버도 네트워크 요청을 할 수 없습니다.

HTTP 전송 서버의 경우 원격 서버의 보안은 PRX의 통제 밖입니다. HTTP 전송 URL이 신뢰할 수 있는 서버만 가리키도록 하세요.

### 정책 엔진

MCP 도구는 보안 정책 엔진의 적용을 받습니다:

```toml
[security.tool_policy.tools]
mcp = "allow"           # 전역적으로 모든 MCP 도구 허용
fs_write_file = "deny"  # 접두사 이름으로 특정 MCP 도구 차단
```

### 감사 로깅

모든 MCP 도구 호출이 감사 로그에 기록됩니다:

- 서버 이름 및 도구 이름
- 인자 (민감한 값은 수정됨)
- 응답 상태
- 실행 시간

## 관련 페이지

- [설정 참조](/ko/prx/config/reference) -- `[mcp]` 및 `[mcp.servers]` 설정
- [도구 개요](/ko/prx/tools/) -- 내장 도구 및 MCP 통합 개요
- [보안 샌드박스](/ko/prx/security/sandbox) -- MCP 서버 프로세스의 샌드박스
- [시크릿 관리](/ko/prx/security/secrets) -- MCP 서버 자격 증명의 암호화 저장
- [셸 실행](/ko/prx/tools/shell) -- 셸 명령을 통한 도구 실행의 대안
