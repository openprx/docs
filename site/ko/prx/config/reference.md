---
title: 설정 레퍼런스
description: PRX의 모든 설정 섹션 및 옵션에 대한 전체 필드별 레퍼런스입니다.
---

# 설정 레퍼런스

이 페이지는 PRX `config.toml`의 모든 설정 섹션과 필드를 문서화합니다. 기본값이 표시된 필드는 생략할 수 있으며, PRX가 기본값을 사용합니다.

## 최상위 (기본 설정)

이 필드들은 `config.toml`의 루트 수준에 위치하며, 어떤 섹션 헤더에도 속하지 않습니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `default_provider` | `string` | `"openrouter"` | 프로바이더 ID 또는 별칭 (예: `"anthropic"`, `"openai"`, `"ollama"`) |
| `default_model` | `string` | `"anthropic/claude-sonnet-4.6"` | 선택된 프로바이더를 통해 라우팅되는 모델 식별자 |
| `default_temperature` | `float` | `0.7` | 샘플링 온도 (0.0--2.0). 낮을수록 더 결정적 |
| `api_key` | `string?` | `null` | 선택된 프로바이더의 API 키. 프로바이더별 환경 변수로 재정의 가능 |
| `api_url` | `string?` | `null` | 프로바이더 API의 기본 URL 재정의 (예: 원격 Ollama 엔드포인트) |

```toml
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7
api_key = "sk-ant-..."
```

## `[gateway]`

웹훅 엔드포인트, 페어링, 웹 API를 위한 HTTP 게이트웨이 서버입니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `host` | `string` | `"127.0.0.1"` | 바인드 주소. 공개 접근을 위해 `"0.0.0.0"` 사용 |
| `port` | `u16` | `16830` | 수신 포트 |
| `require_pairing` | `bool` | `true` | API 요청을 수락하기 전에 디바이스 페어링 필요 |
| `allow_public_bind` | `bool` | `false` | 터널 없이 비로컬호스트 바인딩 허용 |
| `pair_rate_limit_per_minute` | `u32` | `5` | 클라이언트당 분당 최대 페어링 요청 |
| `webhook_rate_limit_per_minute` | `u32` | `60` | 클라이언트당 분당 최대 웹훅 요청 |
| `api_rate_limit_per_minute` | `u32` | `120` | 인증된 토큰당 분당 최대 API 요청 |
| `trust_forwarded_headers` | `bool` | `false` | `X-Forwarded-For` / `X-Real-IP` 헤더 신뢰 (리버스 프록시 뒤에서만 활성화) |
| `request_timeout_secs` | `u64` | `300` | HTTP 핸들러 타임아웃(초) |
| `idempotency_ttl_secs` | `u64` | `300` | 웹훅 멱등성 키 TTL |

```toml
[gateway]
host = "127.0.0.1"
port = 16830
require_pairing = true
api_rate_limit_per_minute = 120
```

::: warning
`host` 또는 `port` 변경은 전체 재시작이 필요합니다. 이 값들은 서버 시작 시 바인딩되며 핫 리로드가 불가능합니다.
:::

## `[channels_config]`

최상위 채널 설정입니다. 개별 채널은 중첩 하위 섹션입니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `cli` | `bool` | `true` | 대화형 CLI 채널 활성화 |
| `message_timeout_secs` | `u64` | `300` | 메시지당 처리 타임아웃 (LLM + 도구) |

### `[channels_config.telegram]`

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `bot_token` | `string` | *(필수)* | @BotFather에서 받은 Telegram Bot API 토큰 |
| `allowed_users` | `string[]` | `[]` | 허용된 Telegram 사용자 ID 또는 사용자 이름. 비어 있으면 = 모두 거부 |
| `mention_only` | `bool` | `false` | 그룹에서 봇을 @멘션한 메시지에만 응답 |
| `stream_mode` | `"off" \| "partial"` | `"off"` | 스트리밍 모드: `off`는 완전한 응답 전송, `partial`은 초안을 점진적으로 편집 |
| `draft_update_interval_ms` | `u64` | `1000` | 초안 편집 간 최소 간격(속도 제한 보호) |
| `interrupt_on_new_message` | `bool` | `false` | 같은 사용자가 새 메시지를 보내면 진행 중인 응답 취소 |

```toml
[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["alice", "bob"]
mention_only = true
stream_mode = "partial"
```

### `[channels_config.discord]`

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `bot_token` | `string` | *(필수)* | Developer Portal에서 받은 Discord 봇 토큰 |
| `guild_id` | `string?` | `null` | 단일 길드(서버)로 제한 |
| `allowed_users` | `string[]` | `[]` | 허용된 Discord 사용자 ID. 비어 있으면 = 모두 거부 |
| `listen_to_bots` | `bool` | `false` | 다른 봇의 메시지 처리 (자신의 메시지는 항상 무시) |
| `mention_only` | `bool` | `false` | @멘션에만 응답 |

```toml
[channels_config.discord]
bot_token = "MTIz..."
guild_id = "987654321"
allowed_users = ["111222333"]
mention_only = true
```

### `[channels_config.slack]`

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `bot_token` | `string` | *(필수)* | Slack 봇 OAuth 토큰 (`xoxb-...`) |
| `app_token` | `string?` | `null` | Socket Mode용 앱 수준 토큰 (`xapp-...`) |
| `channel_id` | `string?` | `null` | 단일 채널로 제한 |
| `allowed_users` | `string[]` | `[]` | 허용된 Slack 사용자 ID. 비어 있으면 = 모두 거부 |
| `mention_only` | `bool` | `false` | 그룹에서 @멘션에만 응답 |

### `[channels_config.lark]`

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `app_id` | `string` | *(필수)* | Lark/Feishu 앱 ID |
| `app_secret` | `string` | *(필수)* | Lark/Feishu 앱 시크릿 |
| `encrypt_key` | `string?` | `null` | 이벤트 암호화 키 |
| `verification_token` | `string?` | `null` | 이벤트 검증 토큰 |
| `allowed_users` | `string[]` | `[]` | 허용된 사용자 ID. 비어 있으면 = 모두 거부 |
| `use_feishu` | `bool` | `false` | Lark(국제)가 아닌 Feishu(중국) API 엔드포인트 사용 |
| `receive_mode` | `"websocket" \| "webhook"` | `"websocket"` | 메시지 수신 모드 |
| `port` | `u16?` | `null` | 웹훅 수신 포트 (웹훅 모드에서만) |
| `mention_only` | `bool` | `false` | @멘션에만 응답 |

PRX는 다음 추가 채널도 지원합니다 (`[channels_config.*]`에서 구성):

- **Matrix** -- `homeserver`, `access_token`, 허용 목록
- **Signal** -- signal-cli REST API를 통해
- **WhatsApp** -- Cloud API 또는 Web 모드
- **iMessage** -- macOS 전용, 연락처 허용 목록
- **DingTalk** -- `client_id` / `client_secret`으로 Stream Mode
- **QQ** -- `app_id` / `app_secret`으로 공식 Bot SDK
- **Email** -- IMAP/SMTP
- **IRC** -- 서버, 채널, 닉네임
- **Mattermost** -- URL + 봇 토큰
- **Nextcloud Talk** -- 기본 URL + 앱 토큰
- **Webhook** -- 일반 수신 웹훅

## `[memory]`

대화 기록, 지식, 임베딩을 위한 메모리 백엔드입니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `backend` | `string` | `"sqlite"` | 백엔드 유형: `"sqlite"`, `"lucid"`, `"postgres"`, `"markdown"`, `"none"` |
| `auto_save` | `bool` | `true` | 사용자 대화 입력을 메모리에 자동 저장 |
| `acl_enabled` | `bool` | `false` | 메모리 접근 제어 목록 활성화 |
| `hygiene_enabled` | `bool` | `true` | 주기적 아카이브 및 보존 정리 실행 |
| `archive_after_days` | `u32` | `7` | 이보다 오래된 일일/세션 파일을 아카이브 |
| `purge_after_days` | `u32` | `30` | 이보다 오래된 아카이브 파일을 삭제 |
| `conversation_retention_days` | `u32` | `3` | SQLite: 이보다 오래된 대화 행 정리 |
| `daily_retention_days` | `u32` | `7` | SQLite: 이보다 오래된 일일 행 정리 |
| `embedding_provider` | `string` | `"none"` | 임베딩 프로바이더: `"none"`, `"openai"`, `"custom:<URL>"` |
| `embedding_model` | `string` | `"text-embedding-3-small"` | 임베딩 모델 이름 |
| `embedding_dimensions` | `usize` | `1536` | 임베딩 벡터 차원 수 |
| `vector_weight` | `f64` | `0.7` | 하이브리드 검색에서 벡터 유사도 가중치 (0.0--1.0) |
| `keyword_weight` | `f64` | `0.3` | BM25 키워드 검색 가중치 (0.0--1.0) |
| `min_relevance_score` | `f64` | `0.4` | 컨텍스트에 메모리를 포함하기 위한 최소 하이브리드 점수 |
| `embedding_cache_size` | `usize` | `10000` | LRU 제거 전 최대 임베딩 캐시 항목 |
| `snapshot_enabled` | `bool` | `false` | 핵심 메모리를 `MEMORY_SNAPSHOT.md`로 내보내기 |
| `snapshot_on_hygiene` | `bool` | `false` | 정리 패스 중 스냅샷 실행 |
| `auto_hydrate` | `bool` | `true` | `brain.db`가 없을 때 스냅샷에서 자동 로드 |

```toml
[memory]
backend = "sqlite"
auto_save = true
embedding_provider = "openai"
embedding_model = "text-embedding-3-small"
embedding_dimensions = 1536
vector_weight = 0.7
keyword_weight = 0.3
```

## `[router]`

멀티 모델 배포를 위한 휴리스틱 LLM 라우터입니다. 능력, Elo 등급, 비용, 지연시간을 결합한 가중 공식으로 후보 모델의 점수를 매깁니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `false` | 휴리스틱 라우팅 활성화 |
| `alpha` | `f32` | `0.0` | 유사도 점수 가중치 |
| `beta` | `f32` | `0.5` | 능력 점수 가중치 |
| `gamma` | `f32` | `0.3` | Elo 점수 가중치 |
| `delta` | `f32` | `0.1` | 비용 페널티 계수 |
| `epsilon` | `f32` | `0.1` | 지연시간 페널티 계수 |
| `knn_enabled` | `bool` | `false` | 기록에서 KNN 시맨틱 라우팅 활성화 |
| `knn_min_records` | `usize` | `10` | KNN이 라우팅에 영향을 미치기 전 최소 기록 수 |
| `knn_k` | `usize` | `7` | 투표를 위한 최근접 이웃 수 |

### `[router.automix]`

적응형 에스컬레이션 정책: 저렴한 모델로 시작하고, 신뢰도가 떨어지면 프리미엄 모델로 에스컬레이션합니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `false` | Automix 에스컬레이션 활성화 |
| `confidence_threshold` | `f32` | `0.7` | 신뢰도가 이 이하로 떨어지면 에스컬레이션 (0.0--1.0) |
| `cheap_model_tiers` | `string[]` | `[]` | "저렴한 우선" 모델 티어 |
| `premium_model_id` | `string` | `""` | 에스컬레이션에 사용되는 모델 |

```toml
[router]
enabled = true
beta = 0.5
gamma = 0.3
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

## `[security]`

OS 수준 보안: 샌드박싱, 리소스 제한, 감사 로깅입니다.

### `[security.sandbox]`

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool?` | `null` (자동 감지) | 샌드박스 격리 활성화 |
| `backend` | `string` | `"auto"` | 백엔드: `"auto"`, `"landlock"`, `"firejail"`, `"bubblewrap"`, `"docker"`, `"none"` |
| `firejail_args` | `string[]` | `[]` | 사용자 지정 Firejail 인수 |

### `[security.resources]`

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `max_memory_mb` | `u32` | `512` | 명령당 최대 메모리 (MB) |
| `max_cpu_time_seconds` | `u64` | `60` | 명령당 최대 CPU 시간 |
| `max_subprocesses` | `u32` | `10` | 최대 하위 프로세스 수 |
| `memory_monitoring` | `bool` | `true` | 메모리 사용 모니터링 활성화 |

### `[security.audit]`

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `true` | 감사 로깅 활성화 |
| `log_path` | `string` | `"audit.log"` | 감사 로그 파일 경로 (설정 디렉터리 기준 상대 경로) |
| `max_size_mb` | `u32` | `100` | 로테이션 전 최대 로그 크기 |
| `sign_events` | `bool` | `false` | 변조 방지를 위한 HMAC 이벤트 서명 |

```toml
[security.sandbox]
backend = "landlock"

[security.resources]
max_memory_mb = 1024
max_cpu_time_seconds = 120

[security.audit]
enabled = true
sign_events = true
```

## `[observability]`

메트릭 및 분산 추적 백엔드입니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `backend` | `string` | `"none"` | 백엔드: `"none"`, `"log"`, `"prometheus"`, `"otel"` |
| `otel_endpoint` | `string?` | `null` | OTLP 엔드포인트 URL (예: `"http://localhost:4318"`) |
| `otel_service_name` | `string?` | `null` | OTel 수집기의 서비스 이름 (기본값: `"prx"`) |

```toml
[observability]
backend = "otel"
otel_endpoint = "http://localhost:4318"
otel_service_name = "prx-production"
```

## `[mcp]`

[Model Context Protocol](https://modelcontextprotocol.io/) 서버 통합입니다. PRX는 MCP 클라이언트로서 추가 도구를 위해 외부 MCP 서버에 연결합니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `false` | MCP 클라이언트 통합 활성화 |

### `[mcp.servers.<name>]`

각 이름 지정 서버는 `[mcp.servers]` 아래의 하위 섹션입니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `true` | 서버별 활성화 스위치 |
| `transport` | `"stdio" \| "http"` | `"stdio"` | 전송 유형 |
| `command` | `string?` | `null` | stdio 모드의 명령 |
| `args` | `string[]` | `[]` | stdio 모드의 명령 인수 |
| `url` | `string?` | `null` | HTTP 전송의 URL |
| `env` | `map<string, string>` | `{}` | stdio 모드의 환경 변수 |
| `startup_timeout_ms` | `u64` | `10000` | 시작 타임아웃 |
| `request_timeout_ms` | `u64` | `30000` | 요청별 타임아웃 |
| `tool_name_prefix` | `string` | `"mcp"` | 노출된 도구 이름의 접두사 |
| `allow_tools` | `string[]` | `[]` | 도구 허용 목록 (비어 있으면 = 모두) |
| `deny_tools` | `string[]` | `[]` | 도구 거부 목록 |

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]

[mcp.servers.remote-api]
transport = "http"
url = "http://localhost:8090/mcp"
request_timeout_ms = 60000
```

## `[browser]`

브라우저 자동화 도구 구성입니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `false` | `browser_open` 도구 활성화 |
| `allowed_domains` | `string[]` | `[]` | 허용된 도메인 (정확한 또는 하위 도메인 일치) |
| `session_name` | `string?` | `null` | 자동화를 위한 이름 지정 브라우저 세션 |

```toml
[browser]
enabled = true
allowed_domains = ["docs.rs", "github.com", "*.example.com"]
```

## `[web_search]`

웹 검색 및 URL 페치 도구 구성입니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `false` | `web_search` 도구 활성화 |
| `provider` | `string` | `"duckduckgo"` | 검색 프로바이더: `"duckduckgo"` (무료) 또는 `"brave"` (API 키 필요) |
| `brave_api_key` | `string?` | `null` | Brave Search API 키 |
| `max_results` | `usize` | `5` | 검색당 최대 결과 수 (1--10) |
| `timeout_secs` | `u64` | `15` | 요청 타임아웃 |
| `fetch_enabled` | `bool` | `true` | `web_fetch` 도구 활성화 |
| `fetch_max_chars` | `usize` | `10000` | `web_fetch`가 반환하는 최대 문자 수 |

```toml
[web_search]
enabled = true
provider = "brave"
brave_api_key = "BSA..."
max_results = 5
fetch_enabled = true
```

## `[xin]`

Xin(심/마음) 자율 작업 엔진 -- 진화, 적합도 검사, 정리 작업을 포함한 백그라운드 작업을 스케줄하고 실행합니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `false` | Xin 작업 엔진 활성화 |
| `interval_minutes` | `u32` | `5` | 틱 간격(분, 최소 1) |
| `max_concurrent` | `usize` | `4` | 틱당 최대 동시 작업 실행 수 |
| `max_tasks` | `usize` | `128` | 저장소의 최대 총 작업 수 |
| `stale_timeout_minutes` | `u32` | `60` | 실행 중인 작업이 오래됨으로 표시되기까지의 시간(분) |
| `builtin_tasks` | `bool` | `true` | 내장 시스템 작업 자동 등록 |
| `evolution_integration` | `bool` | `false` | Xin이 진화/적합도 스케줄링을 관리하도록 허용 |

```toml
[xin]
enabled = true
interval_minutes = 10
max_concurrent = 4
builtin_tasks = true
evolution_integration = true
```

## `[cost]`

비용 추적을 위한 지출 제한 및 모델별 가격입니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `false` | 비용 추적 활성화 |
| `daily_limit_usd` | `f64` | `10.0` | 일일 지출 한도(USD) |
| `monthly_limit_usd` | `f64` | `100.0` | 월간 지출 한도(USD) |
| `warn_at_percent` | `u8` | `80` | 지출이 한도의 이 비율에 도달하면 경고 |
| `allow_override` | `bool` | `false` | `--override` 플래그로 예산 초과 허용 |

```toml
[cost]
enabled = true
daily_limit_usd = 25.0
monthly_limit_usd = 500.0
warn_at_percent = 80
```

## `[reliability]`

복원력 있는 프로바이더 접근을 위한 재시도 및 대체 체인 구성입니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `max_retries` | `u32` | `3` | 일시적 장애에 대한 최대 재시도 횟수 |
| `fallback_providers` | `string[]` | `[]` | 순서가 지정된 대체 프로바이더 이름 목록 |

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

## `[secrets]`

ChaCha20-Poly1305를 사용하는 암호화된 자격 증명 저장소입니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `encrypt` | `bool` | `true` | 설정의 API 키 및 토큰에 대한 암호화 활성화 |

## `[auth]`

외부 자격 증명 가져오기 설정입니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `codex_auth_json_auto_import` | `bool` | `true` | Codex CLI `auth.json`에서 OAuth 자격 증명 자동 가져오기 |
| `codex_auth_json_path` | `string` | `"~/.codex/auth.json"` | Codex CLI 인증 파일 경로 |

## `[proxy]`

아웃바운드 HTTP/HTTPS/SOCKS5 프록시 구성입니다.

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `false` | 프록시 활성화 |
| `http_proxy` | `string?` | `null` | HTTP 프록시 URL |
| `https_proxy` | `string?` | `null` | HTTPS 프록시 URL |
| `all_proxy` | `string?` | `null` | 모든 스킴에 대한 대체 프록시 |
| `no_proxy` | `string[]` | `[]` | 우회 목록 (`NO_PROXY`와 동일한 형식) |
| `scope` | `string` | `"zeroclaw"` | 범위: `"environment"`, `"zeroclaw"`, `"services"` |
| `services` | `string[]` | `[]` | 범위가 `"services"`일 때 서비스 선택자 |

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1", "*.internal"]
scope = "zeroclaw"
```
