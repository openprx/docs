---
title: LLM 프로바이더
description: 기능 매트릭스, 설정, 폴백 체인, 라우팅을 포함한 PRX가 지원하는 9개 이상의 LLM 프로바이더 개요입니다.
---

# LLM 프로바이더

PRX는 **프로바이더**를 통해 대규모 언어 모델에 연결합니다 -- `Provider` 트레이트를 구현하는 플러그 가능한 백엔드입니다. 각 프로바이더는 특정 LLM API에 대한 인증, 요청 포맷팅, 스트리밍, 오류 분류를 처리합니다.

PRX는 9개의 내장 프로바이더, 서드파티 서비스를 위한 OpenAI 호환 엔드포인트, 폴백 체인 및 지능형 라우팅 인프라를 제공합니다.

## 기능 매트릭스

| 프로바이더 | 주요 모델 | 스트리밍 | 비전 | 도구 사용 | OAuth | 셀프 호스팅 |
|-----------|----------|---------|------|----------|-------|------------|
| [Anthropic](/ko/prx/providers/anthropic) | Claude Opus 4, Claude Sonnet 4 | 예 | 예 | 예 | 예 (Claude Code) | 아니요 |
| [OpenAI](/ko/prx/providers/openai) | GPT-4o, o1, o3 | 예 | 예 | 예 | 아니요 | 아니요 |
| [Google Gemini](/ko/prx/providers/google-gemini) | Gemini 2.0 Flash, Gemini 1.5 Pro | 예 | 예 | 예 | 예 (Gemini CLI) | 아니요 |
| [OpenAI Codex](/ko/prx/providers/openai-codex) | Codex 모델 | 예 | 아니요 | 예 | 예 | 아니요 |
| [GitHub Copilot](/ko/prx/providers/github-copilot) | Copilot Chat 모델 | 예 | 아니요 | 예 | 예 (Device Flow) | 아니요 |
| [Ollama](/ko/prx/providers/ollama) | Llama 3, Mistral, Qwen, 모든 GGUF | 예 | 모델에 따라 다름 | 예 | 아니요 | 예 |
| [AWS Bedrock](/ko/prx/providers/aws-bedrock) | Claude, Titan, Llama | 예 | 모델에 따라 다름 | 모델에 따라 다름 | AWS IAM | 아니요 |
| [GLM](/ko/prx/providers/glm) | GLM-4, Zhipu, Minimax, Moonshot, Qwen, Z.AI | 예 | 모델에 따라 다름 | 모델에 따라 다름 | 예 (Minimax/Qwen) | 아니요 |
| [OpenRouter](/ko/prx/providers/openrouter) | 여러 벤더의 200+ 모델 | 예 | 모델에 따라 다름 | 모델에 따라 다름 | 아니요 | 아니요 |
| [Custom Compatible](/ko/prx/providers/custom-compatible) | 모든 OpenAI 호환 API | 예 | 엔드포인트에 따라 다름 | 엔드포인트에 따라 다름 | 아니요 | 예 |

## 빠른 설정

프로바이더는 `~/.config/openprx/config.toml` (또는 `~/.openprx/config.toml`)에서 설정합니다. 최소한 기본 프로바이더를 설정하고 API 키를 제공합니다:

```toml
# 기본 프로바이더 및 모델 선택
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7

# API 키 (ANTHROPIC_API_KEY 환경 변수로도 설정 가능)
api_key = "sk-ant-..."
```

Ollama와 같은 셀프 호스팅 프로바이더의 경우 엔드포인트를 지정합니다:

```toml
default_provider = "ollama"
default_model = "llama3:70b"
api_url = "http://localhost:11434"
```

각 프로바이더는 다음 순서로 API 키를 확인합니다:

1. `config.toml`의 `api_key` 필드
2. 프로바이더별 환경 변수 (예: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`)
3. 일반 `API_KEY` 환경 변수

지원되는 변수의 전체 목록은 [환경 변수](/ko/prx/config/environment)를 참조하세요.

## ReliableProvider를 사용한 폴백 체인

PRX는 프로바이더 호출을 다음을 제공하는 `ReliableProvider` 레이어로 래핑합니다:

- **자동 재시도** -- 일시적 실패 (5xx, 429 레이트 리밋, 네트워크 타임아웃)에 대한 지수 백오프
- **폴백 체인** -- 주 프로바이더가 실패하면 체인의 다음 프로바이더로 요청이 자동 라우팅
- **재시도 불가 오류 감지** -- 유효하지 않은 API 키 (401/403)와 알 수 없는 모델 (404)과 같은 클라이언트 오류는 재시도를 낭비하지 않고 빠르게 실패

`[reliability]` 섹션에서 안정성을 설정합니다:

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

주 프로바이더 (예: Anthropic)가 일시적 오류를 반환하면 PRX는 백오프와 함께 최대 `max_retries`번까지 재시도합니다. 모든 재시도가 소진되면 첫 번째 폴백 프로바이더로 넘어갑니다. 폴백 체인은 성공적인 응답이 있거나 모든 프로바이더가 소진될 때까지 계속됩니다.

### 오류 분류

ReliableProvider는 오류를 두 가지 범주로 분류합니다:

- **재시도 가능**: HTTP 5xx, 429 (레이트 리밋), 408 (타임아웃), 네트워크 오류
- **재시도 불가**: HTTP 4xx (429/408 제외), 유효하지 않은 API 키, 알 수 없는 모델, 잘못된 응답

재시도 불가 오류는 재시도를 건너뛰고 즉시 다음 프로바이더로 넘어가 낭비되는 지연을 방지합니다.

## 라우터 통합

고급 다중 모델 설정의 경우 PRX는 다음을 기반으로 요청별로 최적의 프로바이더와 모델을 선택하는 휴리스틱 LLM 라우터를 지원합니다:

- **기능 점수** -- 쿼리 복잡도를 모델 강점에 매칭
- **Elo 레이팅** -- 시간 경과에 따른 모델 성능 추적
- **비용 최적화** -- 간단한 쿼리에 저렴한 모델 선호
- **지연 시간 가중치** -- 응답 시간 고려
- **KNN 시맨틱 라우팅** -- 유사성 기반 라우팅을 위한 과거 쿼리 임베딩 사용
- **Automix 에스컬레이션** -- 저렴한 모델로 시작하고 신뢰도가 낮으면 프리미엄 모델로 에스컬레이션

```toml
[router]
enabled = true
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

전체 세부 정보는 [라우터 설정](/ko/prx/router/)을 참조하세요.

## 프로바이더 페이지

- [Anthropic (Claude)](/ko/prx/providers/anthropic)
- [OpenAI](/ko/prx/providers/openai)
- [Google Gemini](/ko/prx/providers/google-gemini)
- [OpenAI Codex](/ko/prx/providers/openai-codex)
- [GitHub Copilot](/ko/prx/providers/github-copilot)
- [Ollama](/ko/prx/providers/ollama)
- [AWS Bedrock](/ko/prx/providers/aws-bedrock)
- [GLM (Zhipu / Minimax / Moonshot / Qwen / Z.AI)](/ko/prx/providers/glm)
- [OpenRouter](/ko/prx/providers/openrouter)
- [Custom Compatible 엔드포인트](/ko/prx/providers/custom-compatible)
