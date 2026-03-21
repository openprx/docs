---
title: OpenRouter
description: PRX에서 OpenRouter를 LLM 프로바이더로 설정합니다
---

# OpenRouter

> 단일 API 키와 통합 인터페이스를 통해 여러 프로바이더 (OpenAI, Anthropic, Google, Meta, Mistral 등)의 200+ 모델에 접근합니다.

## 사전 요구 사항

- [openrouter.ai](https://openrouter.ai/)에서 발급받은 OpenRouter API 키

## 빠른 설정

### 1. API 키 발급

1. [openrouter.ai](https://openrouter.ai/)에서 가입합니다
2. 대시보드에서 **Keys**로 이동합니다
3. **Create Key**를 클릭하고 복사합니다 (`sk-or-`로 시작)

### 2. 설정

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[providers.openrouter]
api_key = "${OPENROUTER_API_KEY}"
```

또는 환경 변수를 설정합니다:

```bash
export OPENROUTER_API_KEY="sk-or-..."
```

### 3. 확인

```bash
prx doctor models
```

## 사용 가능한 모델

OpenRouter는 수백 개의 모델에 대한 접근을 제공합니다. 인기 있는 옵션:

| 모델 | 프로바이더 | 컨텍스트 | 비전 | 도구 사용 | 참고 |
|------|-----------|---------|------|----------|------|
| `anthropic/claude-sonnet-4` | Anthropic | 200K | 예 | 예 | Claude Sonnet 4 |
| `anthropic/claude-opus-4` | Anthropic | 200K | 예 | 예 | Claude Opus 4 |
| `openai/gpt-4o` | OpenAI | 128K | 예 | 예 | GPT-4o |
| `openai/o3` | OpenAI | 128K | 예 | 예 | 추론 모델 |
| `google/gemini-2.5-pro` | Google | 1M | 예 | 예 | Gemini Pro |
| `google/gemini-2.5-flash` | Google | 1M | 예 | 예 | Gemini Flash |
| `meta-llama/llama-3.1-405b-instruct` | Meta | 128K | 아니요 | 예 | 가장 큰 오픈 모델 |
| `deepseek/deepseek-chat` | DeepSeek | 128K | 아니요 | 예 | DeepSeek V3 |
| `mistralai/mistral-large` | Mistral | 128K | 아니요 | 예 | Mistral Large |
| `x-ai/grok-2` | xAI | 128K | 아니요 | 예 | Grok 2 |

전체 모델 목록은 [openrouter.ai/models](https://openrouter.ai/models)에서 확인하세요.

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `api_key` | string | 필수 | OpenRouter API 키 (`sk-or-...`) |
| `model` | string | 필수 | `provider/model` 포맷의 모델 ID |

## 기능

### 통합 다중 프로바이더 접근

단일 OpenRouter API 키로 OpenAI, Anthropic, Google, Meta, Mistral, Cohere 등 다양한 프로바이더의 모델에 접근할 수 있습니다. 여러 API 키를 관리할 필요가 없어집니다.

### OpenAI 호환 API

OpenRouter는 `https://openrouter.ai/api/v1/chat/completions`에 OpenAI 호환 Chat Completions API를 노출합니다. PRX는 다음과 함께 요청을 전송합니다:

- 인증을 위한 `Authorization: Bearer <key>`
- 앱 식별을 위한 `HTTP-Referer: https://github.com/theonlyhennygod/openprx`
- 앱명 표시를 위한 `X-Title: OpenPRX`

### 네이티브 도구 호출

도구는 OpenAI의 네이티브 함수 호출 포맷으로 전송됩니다. 프로바이더는 `tool_choice: "auto"`를 지원하며 다중 턴 도구 상호작용을 위한 `tool_call_id` 매핑을 포함한 구조화된 도구 호출 응답을 올바르게 처리합니다.

### 다중 턴 대화 기록

전체 대화 기록이 올바른 구조화 포맷팅으로 보존됩니다:
- 도구 호출이 포함된 어시스턴트 메시지는 `tool_calls` 배열로 직렬화
- 도구 결과 메시지에는 `tool_call_id` 참조 포함
- 시스템, 사용자, 어시스턴트 메시지는 직접 전달

### 연결 워밍업

시작 시 PRX는 `https://openrouter.ai/api/v1/auth/key`로 경량 요청을 보내 API 키를 확인하고 TLS/HTTP2 연결 풀을 수립합니다.

### 모델 라우팅

OpenRouter는 API 수준에서 모델 라우팅과 폴백을 지원합니다. PRX의 내장 `fallback_providers`를 클라이언트 측 폴백으로도 사용할 수 있습니다:

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[reliability]
fallback_providers = ["openai"]
```

## 기본 프로바이더

OpenRouter는 PRX의 기본 프로바이더입니다. 설정에 `provider`가 지정되지 않으면 PRX는 OpenRouter를 기본값으로 사용합니다.

## 문제 해결

### "OpenRouter API key not set"

`OPENROUTER_API_KEY` 환경 변수를 설정하거나 `config.toml`의 `[providers.openrouter]` 아래에 `api_key`를 추가하세요. `prx onboard`를 실행하여 대화형으로 설정할 수도 있습니다.

### 402 Payment Required

OpenRouter 계정의 크레딧이 부족합니다. [openrouter.ai/credits](https://openrouter.ai/credits)에서 크레딧을 추가하세요.

### 모델별 오류

OpenRouter의 서로 다른 모델은 다른 기능과 레이트 리밋을 가집니다. 특정 모델이 오류를 반환하면:
- 모델이 도구 호출을 지원하는지 확인 (모든 모델이 지원하지는 않음)
- OpenRouter에서 모델이 더 이상 사용되지 않는지 확인
- 다른 모델 변형 시도

### 느린 응답

OpenRouter는 기본 프로바이더로 라우팅합니다. 응답 시간은 다음에 따라 다릅니다:
- 모델 프로바이더의 현재 부하
- 프로바이더까지의 지리적 거리
- 모델 크기와 컨텍스트 길이

OpenRouter가 느린 경우 직접 프로바이더 연결로 장애 조치하기 위해 `fallback_providers` 사용을 고려하세요.

### 레이트 리밋

OpenRouter는 기본 프로바이더 제한 외에 자체 레이트 리밋이 있습니다. 레이트 리밋이 발생하면:
- [openrouter.ai/usage](https://openrouter.ai/usage)에서 사용량 확인
- 더 높은 제한을 위해 플랜 업그레이드
- 자동 백오프 재시도를 위해 PRX의 reliable provider 래퍼 사용
