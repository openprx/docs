---
title: 설정
description: PRX 설정 시스템 개요 -- 핫 리로드, 분할 파일, CLI 도구, 스키마 내보내기를 지원하는 TOML 기반 설정입니다.
---

# 설정

PRX는 핫 리로드를 지원하는 TOML 기반 설정 시스템을 사용합니다. 모든 설정은 단일 파일(선택적 분할 프래그먼트 포함)에 위치하며, 대부분의 변경 사항은 데몬을 재시작하지 않아도 즉시 적용됩니다.

## 설정 파일 위치

기본 설정 파일의 위치:

```
~/.openprx/config.toml
```

PRX는 다음 순서로 설정 디렉터리를 결정합니다:

1. `OPENPRX_CONFIG_DIR` 환경 변수 (설정된 경우)
2. `OPENPRX_WORKSPACE` 환경 변수 (설정된 경우)
3. 활성 워크스페이스 마커 (`~/.openprx/active_workspace.toml`)
4. `~/.openprx/` (기본값)

워크스페이스 디렉터리(메모리, 세션, 데이터가 저장되는 곳)의 기본값은 `~/.openprx/workspace/`입니다.

## TOML 형식

PRX 설정은 [TOML](https://toml.io/)을 사용합니다 -- 최소한의 사람이 읽기 쉬운 형식입니다. 다음은 최소한의 동작 가능한 설정입니다:

```toml
# Provider and model selection
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7

# API key (or use ANTHROPIC_API_KEY env var)
api_key = "sk-ant-..."

# Memory backend
[memory]
backend = "sqlite"
auto_save = true

# Gateway server
[gateway]
port = 16830
host = "127.0.0.1"
```

## 설정 섹션

설정은 다음과 같은 최상위 섹션으로 구성됩니다:

| 섹션 | 용도 |
|------|------|
| *(최상위)* | 기본 프로바이더, 모델, 온도, API 키 |
| `[gateway]` | HTTP 게이트웨이: 호스트, 포트, 페어링, 속도 제한 |
| `[channels_config]` | 메시징 채널: Telegram, Discord, Slack 등 |
| `[channels_config.telegram]` | Telegram 봇 구성 |
| `[channels_config.discord]` | Discord 봇 구성 |
| `[memory]` | 메모리 백엔드 및 임베딩 설정 |
| `[router]` | 휴리스틱 LLM 라우터 및 Automix |
| `[security]` | 샌드박스, 리소스 제한, 감사 로깅 |
| `[autonomy]` | 자율성 수준 및 도구 범위 규칙 |
| `[observability]` | 메트릭 및 추적 백엔드 |
| `[mcp]` | Model Context Protocol 서버 통합 |
| `[browser]` | 브라우저 자동화 도구 설정 |
| `[web_search]` | 웹 검색 및 페치 도구 설정 |
| `[xin]` | Xin 자율 작업 엔진 |
| `[reliability]` | 재시도 및 대체 프로바이더 체인 |
| `[cost]` | 지출 제한 및 모델 가격 |
| `[cron]` | 스케줄된 작업 정의 |
| `[self_system]` | 자기 진화 엔진 제어 |
| `[proxy]` | HTTP/HTTPS/SOCKS5 프록시 설정 |
| `[secrets]` | 암호화된 자격 증명 저장소 |
| `[auth]` | 외부 자격 증명 가져오기 (Codex CLI 등) |
| `[storage]` | 영구 저장소 프로바이더 |
| `[tunnel]` | 공개 터널 노출 |
| `[nodes]` | 원격 노드 프록시 구성 |

필드별 전체 문서는 [설정 레퍼런스](/ko/prx/config/reference)를 참조하세요.

## 분할 설정 파일

복잡한 배포의 경우 PRX는 `config.toml` 옆의 `config.d/` 디렉터리 아래에 프래그먼트 파일로 설정을 분할하는 것을 지원합니다:

```
~/.openprx/
  config.toml          # 메인 설정 (최상위 + 재정의)
  config.d/
    channels.toml      # [channels_config] 섹션
    memory.toml        # [memory] 및 [storage] 섹션
    security.toml      # [security] 및 [autonomy] 섹션
    agents.toml        # [agents] 및 [sessions_spawn] 섹션
    identity.toml      # [identity] 및 [identity_bindings] 섹션
    network.toml       # [gateway], [tunnel], [proxy] 섹션
    scheduler.toml     # [scheduler], [cron], [heartbeat] 섹션
```

프래그먼트 파일은 `config.toml` 위에 병합됩니다 (프래그먼트가 우선). 파일은 알파벳순으로 로드됩니다.

## 편집 방법

### 대화형 마법사

온보딩 마법사가 프로바이더 선택, 채널 설정, 메모리 구성을 안내합니다:

```bash
prx onboard
```

### CLI 설정 명령

명령줄에서 설정을 확인하고 수정합니다:

```bash
# 현재 설정 표시
prx config show

# 특정 값 수정
prx config set default_provider anthropic
prx config set default_model "anthropic/claude-sonnet-4-6"

# 수동 다시 로드 트리거
prx config reload
```

### 직접 편집

텍스트 에디터로 `~/.openprx/config.toml`을 엽니다. 변경 사항은 파일 감시자에 의해 자동으로 감지되며 1초 이내에 적용됩니다 ([핫 리로드](/ko/prx/config/hot-reload) 참조).

### 스키마 내보내기

에디터 자동 완성 및 유효성 검사를 위해 전체 설정 스키마를 JSON Schema로 내보냅니다:

```bash
prx config schema
```

VS Code, IntelliJ 또는 TOML 스키마 유효성 검사를 지원하는 모든 에디터에서 사용할 수 있는 JSON Schema 문서를 출력합니다.

## 핫 리로드

대부분의 설정 변경은 PRX를 재시작하지 않아도 즉시 적용됩니다. 파일 감시자는 1초 디바운스 창을 사용하며 파싱이 성공하면 라이브 설정을 원자적으로 교체합니다. 새 파일에 구문 오류가 있으면 이전 설정이 유지되고 경고가 기록됩니다.

재시작이 필요한 항목에 대한 자세한 내용은 [핫 리로드](/ko/prx/config/hot-reload)를 참조하세요.

## 다음 단계

- [설정 레퍼런스](/ko/prx/config/reference) -- 필드별 전체 문서
- [핫 리로드](/ko/prx/config/hot-reload) -- 라이브 변경 vs 재시작 필요 항목
- [환경 변수](/ko/prx/config/environment) -- 환경 변수, API 키, `.env` 지원
- [LLM 프로바이더](/ko/prx/providers/) -- 프로바이더별 설정
