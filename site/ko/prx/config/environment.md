---
title: 환경 변수
description: PRX 설정을 위한 환경 변수 -- API 키, 경로, 런타임 재정의를 설명합니다.
---

# 환경 변수

PRX는 API 키, 설정 경로, 런타임 재정의를 위한 환경 변수를 읽습니다. 환경 변수는 API 키와 같은 보안에 민감한 필드에 대해 `config.toml`의 값보다 우선합니다.

## 설정 경로

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `OPENPRX_CONFIG_DIR` | `~/.openprx` | 설정 디렉터리를 재정의합니다. PRX는 이 디렉터리 내에서 `config.toml`과 `config.d/`를 찾습니다 |
| `OPENPRX_WORKSPACE` | `~/.openprx/workspace` | 워크스페이스 디렉터리(메모리, 세션, 데이터)를 재정의합니다 |

`OPENPRX_CONFIG_DIR`이 설정된 경우 `OPENPRX_WORKSPACE`와 활성 워크스페이스 마커보다 우선합니다.

설정 디렉터리 결정 순서:

1. `OPENPRX_CONFIG_DIR` (최우선)
2. `OPENPRX_WORKSPACE`
3. 활성 워크스페이스 마커 (`~/.openprx/active_workspace.toml`)
4. `~/.openprx/` (기본값)

## 프로바이더 API 키

각 프로바이더에는 전용 환경 변수가 있습니다. PRX는 `config.toml`의 `api_key` 필드로 대체하기 전에 이를 먼저 확인합니다.

### 주요 프로바이더

| 변수 | 프로바이더 |
|------|-----------|
| `ANTHROPIC_API_KEY` | Anthropic (Claude) |
| `OPENAI_API_KEY` | OpenAI |
| `GEMINI_API_KEY` | Google Gemini |
| `GOOGLE_API_KEY` | Google Gemini (대안) |
| `OPENROUTER_API_KEY` | OpenRouter |
| `OLLAMA_API_KEY` | Ollama (보통 불필요) |
| `GLM_API_KEY` | Zhipu GLM |
| `ZAI_API_KEY` | Z.AI |
| `MINIMAX_API_KEY` | Minimax |
| `MOONSHOT_API_KEY` | Moonshot |
| `DASHSCOPE_API_KEY` | Alibaba Qwen (DashScope) |

### OAuth 토큰

일부 프로바이더는 API 키에 추가로(또는 대신) OAuth 인증을 지원합니다:

| 변수 | 프로바이더 | 설명 |
|------|-----------|------|
| `ANTHROPIC_OAUTH_TOKEN` | Anthropic | Claude Code OAuth 토큰 |
| `CLAUDE_CODE_ACCESS_TOKEN` | Anthropic | Claude Code 액세스 토큰 (대안) |
| `CLAUDE_CODE_REFRESH_TOKEN` | Anthropic | 자동 갱신을 위한 Claude Code 리프레시 토큰 |
| `MINIMAX_OAUTH_TOKEN` | Minimax | Minimax OAuth 액세스 토큰 |
| `MINIMAX_OAUTH_REFRESH_TOKEN` | Minimax | Minimax OAuth 리프레시 토큰 |
| `MINIMAX_OAUTH_CLIENT_ID` | Minimax | OAuth 클라이언트 ID 재정의 |
| `MINIMAX_OAUTH_REGION` | Minimax | OAuth 리전 (`global` 또는 `cn`) |
| `QWEN_OAUTH_TOKEN` | Qwen | Qwen OAuth 액세스 토큰 |
| `QWEN_OAUTH_REFRESH_TOKEN` | Qwen | Qwen OAuth 리프레시 토큰 |
| `QWEN_OAUTH_CLIENT_ID` | Qwen | Qwen OAuth 클라이언트 ID 재정의 |
| `QWEN_OAUTH_RESOURCE_URL` | Qwen | Qwen OAuth 리소스 URL 재정의 |

### 호환/서드파티 프로바이더

| 변수 | 프로바이더 |
|------|-----------|
| `GROQ_API_KEY` | Groq |
| `MISTRAL_API_KEY` | Mistral |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `XAI_API_KEY` | xAI (Grok) |
| `TOGETHER_API_KEY` | Together AI |
| `FIREWORKS_API_KEY` | Fireworks AI |
| `PERPLEXITY_API_KEY` | Perplexity |
| `COHERE_API_KEY` | Cohere |
| `NVIDIA_API_KEY` | NVIDIA NIM |
| `VENICE_API_KEY` | Venice |
| `LLAMACPP_API_KEY` | llama.cpp server |
| `KIMI_CODE_API_KEY` | Kimi Code (Moonshot) |
| `QIANFAN_API_KEY` | Baidu Qianfan |
| `CLOUDFLARE_API_KEY` | Cloudflare AI |
| `VERCEL_API_KEY` | Vercel AI |

### 대체

| 변수 | 설명 |
|------|------|
| `API_KEY` | 프로바이더별 변수가 설정되지 않았을 때 사용되는 일반 대체 |

## 도구 및 채널 변수

| 변수 | 설명 |
|------|------|
| `BRAVE_API_KEY` | Brave Search API 키 (`[web_search]`에서 `provider = "brave"`인 경우) |
| `GITHUB_TOKEN` | GitHub 개인 액세스 토큰 (스킬 및 통합에서 사용) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Google Cloud ADC 파일 경로 (서비스 계정을 통한 Gemini) |

## 런타임 변수

| 변수 | 설명 |
|------|------|
| `OPENPRX_VERSION` | 보고되는 버전 문자열 재정의 |
| `OPENPRX_AUTOSTART_CHANNELS` | `"1"`로 설정하면 부팅 시 채널 리스너 자동 시작 |
| `OPENPRX_EVOLUTION_CONFIG` | 진화 설정 경로 재정의 |
| `OPENPRX_EVOLUTION_DEBUG_RAW` | 원시 진화 디버그 로깅 활성화 |

## 설정 내 변수 치환

PRX는 `config.toml` 내에서 `${VAR_NAME}` 구문을 기본적으로 확장하지 **않습니다**. 그러나 다음 접근 방식으로 환경 변수 치환을 달성할 수 있습니다:

### 1. 환경 변수 직접 사용

API 키의 경우 PRX가 자동으로 해당 환경 변수를 확인합니다. 설정 파일에서 참조할 필요가 없습니다:

```toml
# api_key가 필요 없음 -- PRX가 ANTHROPIC_API_KEY를 자동으로 확인함
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
```

### 2. 셸 래퍼 사용

`envsubst` 또는 유사한 도구를 사용하여 템플릿에서 `config.toml`을 생성합니다:

```bash
envsubst < config.toml.template > ~/.openprx/config.toml
```

### 3. 시크릿이 포함된 분할 설정 사용

시크릿을 배포 시 환경 변수에서 생성되는 별도 파일에 보관합니다:

```bash
# 시크릿 프래그먼트 생성
cat > ~/.openprx/config.d/secrets.toml << EOF
api_key = "$ANTHROPIC_API_KEY"

[channels_config.telegram]
bot_token = "$TELEGRAM_BOT_TOKEN"
EOF
```

## `.env` 파일 지원

PRX는 `.env` 파일을 자동으로 로드하지 않습니다. `.env` 파일 지원이 필요하면 다음 접근 방식 중 하나를 사용하세요:

### systemd 사용

서비스 유닛에 `EnvironmentFile`을 추가합니다:

```ini
[Service]
EnvironmentFile=/opt/openprx/.env
ExecStart=/usr/local/bin/openprx
```

### 셸 래퍼 사용

PRX 시작 전에 `.env` 파일을 소싱합니다:

```bash
#!/bin/bash
set -a
source /opt/openprx/.env
set +a
exec openprx
```

### direnv 사용

[direnv](https://direnv.net/)를 사용하는 경우 작업 디렉터리에 `.envrc` 파일을 배치합니다:

```bash
# .envrc
export ANTHROPIC_API_KEY="sk-ant-..."
export TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
```

## 보안 권장 사항

- **API 키를 버전 관리에 커밋하지 마세요.** 환경 변수 또는 암호화된 시크릿을 사용하세요.
- PRX의 `[secrets]` 하위 시스템은 `config.toml`의 민감한 필드를 ChaCha20-Poly1305로 암호화합니다. `[secrets] encrypt = true`로 활성화합니다 (기본적으로 활성화).
- PRX와 함께 제공되는 `.dockerignore`는 컨테이너 빌드에서 `.env` 및 `.env.*` 파일을 제외합니다.
- 감사 로그는 API 키와 토큰을 자동으로 수정합니다.
- `OPENPRX_CONFIG_DIR`을 사용하여 공유 디렉터리를 가리킬 때 적절한 파일 권한(`chmod 600 config.toml`)을 확인하세요.
