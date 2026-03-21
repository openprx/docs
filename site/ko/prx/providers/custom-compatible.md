---
title: Custom Compatible
description: PRX에서 OpenAI 호환 API 엔드포인트를 LLM 프로바이더로 설정합니다
---

# Custom Compatible

> PRX를 OpenAI Chat Completions 포맷을 따르는 모든 LLM API에 연결합니다. LiteLLM, vLLM, Groq, Mistral, xAI, Venice, Vercel AI, Cloudflare AI, HuggingFace Inference 및 기타 OpenAI 호환 서비스와 호환됩니다.

## 사전 요구 사항

- OpenAI Chat Completions 포맷 (`/v1/chat/completions` 또는 `/chat/completions`)을 구현하는 실행 중인 LLM API
- API 키 (서비스에서 요구하는 경우)

## 빠른 설정

### 1. 엔드포인트 확인

API의 기본 URL과 인증 방법을 확인합니다. 예시:

- Groq: `https://api.groq.com/openai/v1`
- Mistral: `https://api.mistral.ai/v1`
- xAI: `https://api.x.ai/v1`
- 로컬 vLLM: `http://localhost:8000/v1`
- LiteLLM 프록시: `http://localhost:4000`

### 2. 설정

```toml
[default]
provider = "compatible"
model = "your-model-name"

[providers.compatible]
api_key = "${YOUR_API_KEY}"
api_url = "https://api.your-provider.com/v1"
```

### 3. 확인

```bash
prx doctor models
```

## 내장 호환 프로바이더

PRX에는 인기 있는 OpenAI 호환 서비스에 대한 사전 설정된 별칭이 포함되어 있습니다:

| 프로바이더명 | 별칭 | 기본 URL | 인증 방식 |
|------------|------|---------|----------|
| Venice | `venice` | `https://api.venice.ai` | Bearer |
| Vercel AI | `vercel`, `vercel-ai` | `https://api.vercel.ai` | Bearer |
| Cloudflare AI | `cloudflare`, `cloudflare-ai` | `https://gateway.ai.cloudflare.com/v1` | Bearer |
| Groq | `groq` | `https://api.groq.com/openai/v1` | Bearer |
| Mistral | `mistral` | `https://api.mistral.ai/v1` | Bearer |
| xAI | `xai`, `grok` | `https://api.x.ai/v1` | Bearer |
| Qianfan | `qianfan`, `baidu` | `https://aip.baidubce.com` | Bearer |
| Synthetic | `synthetic` | `https://api.synthetic.com` | Bearer |
| OpenCode Zen | `opencode`, `opencode-zen` | `https://opencode.ai/zen/v1` | Bearer |
| LiteLLM | `litellm`, `lite-llm` | 설정 가능 | Bearer |
| vLLM | `vllm`, `v-llm` | 설정 가능 | Bearer |
| HuggingFace | `huggingface`, `hf` | 설정 가능 | Bearer |

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `api_key` | string | 선택사항 | API 인증 키 |
| `api_url` | string | 필수 | API 엔드포인트의 기본 URL |
| `model` | string | 필수 | 사용할 모델명/ID |
| `auth_style` | string | `"bearer"` | 인증 헤더 스타일 (아래 참조) |

### 인증 스타일

| 스타일 | 헤더 포맷 | 사용처 |
|--------|----------|--------|
| `bearer` | `Authorization: Bearer <key>` | 대부분의 프로바이더 (기본값) |
| `x-api-key` | `x-api-key: <key>` | 일부 중국 프로바이더 |
| `custom` | 사용자 정의 헤더명 | 특수한 경우 |

## 기능

### 자동 엔드포인트 감지

PRX는 기본 URL에 `/chat/completions`를 자동으로 추가합니다. 엔드포인트 경로를 포함할 필요가 없습니다:

```toml
# 올바름 - PRX가 /chat/completions를 추가
api_url = "https://api.groq.com/openai/v1"

# 역시 올바름 - 명시적 경로도 작동
api_url = "https://api.groq.com/openai/v1/chat/completions"
```

### Responses API 폴백

OpenAI의 최신 Responses API를 지원하는 프로바이더의 경우 `/v1/chat/completions`가 404를 반환하면 PRX는 `/v1/responses`로 폴백할 수 있습니다. 기본적으로 활성화되어 있지만 지원하지 않는 프로바이더 (예: GLM/Zhipu)에 대해서는 비활성화할 수 있습니다.

### 네이티브 도구 호출

도구는 OpenAI의 표준 function-calling 포맷으로 전송됩니다:

```json
{
  "type": "function",
  "function": {
    "name": "tool_name",
    "description": "Tool description",
    "parameters": { "type": "object", "properties": {...} }
  }
}
```

프로바이더는 자동 도구 선택을 위한 `tool_choice: "auto"`를 지원하고 구조화된 `tool_calls` 응답을 올바르게 역직렬화합니다.

### 비전 지원

비전 지원 모델의 경우 메시지에 `[IMAGE:data:image/png;base64,...]` 마커로 포함된 이미지는 `image_url` 콘텐츠 블록이 포함된 OpenAI 비전 포맷으로 자동 변환됩니다.

### 스트리밍 지원

호환 프로바이더는 실시간 토큰 전달을 위한 SSE 스트리밍을 지원합니다. 스트림 이벤트는 다음을 지원하며 점진적으로 파싱됩니다:
- `delta.content` 텍스트 청크
- 점진적 도구 호출 구성을 위한 `delta.tool_calls`
- `[DONE]` 마커 감지
- 우아한 타임아웃 처리

### 시스템 메시지 병합

일부 프로바이더 (예: MiniMax)는 `role: system` 메시지를 거부합니다. PRX는 시스템 메시지 내용을 첫 번째 사용자 메시지에 자동으로 병합할 수 있습니다. 이는 알려진 비호환 프로바이더에 대해 기본적으로 활성화됩니다.

### HTTP/1.1 강제 모드

일부 프로바이더 (특히 DashScope/Qwen)는 HTTP/2 대신 HTTP/1.1을 요구합니다. PRX는 이러한 엔드포인트를 자동으로 감지하고 연결 안정성을 위해 HTTP/1.1을 강제합니다.

### 추론 콘텐츠 폴백

`content` 대신 `reasoning_content`로 출력을 반환하는 추론 모델의 경우 PRX는 자동으로 추론 텍스트를 추출하도록 폴백합니다.

## 고급 설정

### 로컬 LLM 서버 (vLLM, llama.cpp 등)

```toml
[default]
provider = "compatible"
model = "meta-llama/Llama-3.1-8B-Instruct"

[providers.compatible]
api_url = "http://localhost:8000/v1"
# 로컬 서버에는 api_key가 필요하지 않음
```

### LiteLLM 프록시

```toml
[default]
provider = "litellm"
model = "gpt-4o"

[providers.litellm]
api_key = "${LITELLM_API_KEY}"
api_url = "http://localhost:4000"
```

### 다중 사용자 정의 프로바이더

모델 라우터를 사용하여 여러 호환 프로바이더를 설정합니다:

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[[model_routes]]
pattern = "groq/*"
provider = "compatible"
api_url = "https://api.groq.com/openai/v1"
api_key = "${GROQ_API_KEY}"

[[model_routes]]
pattern = "mistral/*"
provider = "compatible"
api_url = "https://api.mistral.ai/v1"
api_key = "${MISTRAL_API_KEY}"
```

## 문제 해결

### 연결 거부

API 엔드포인트에 접근 가능한지 확인하세요:
```bash
curl -v https://api.your-provider.com/v1/models
```

### 401 Unauthorized

- API 키가 올바른지 확인합니다
- 인증 스타일이 프로바이더와 일치하는지 확인합니다 (Bearer vs x-api-key)
- 일부 프로바이더는 추가 헤더가 필요합니다; 사용 가능한 경우 명명된 프로바이더 별칭을 사용하세요

### "role: system" 거부됨

프로바이더가 시스템 메시지를 지원하지 않는 경우 PRX는 알려진 프로바이더에 대해 자동으로 처리합니다. 사용자 정의 엔드포인트의 경우 프로바이더 제한 사항입니다. 해결 방법: 시스템 지시사항을 첫 번째 사용자 메시지에 포함합니다.

### 스트리밍이 작동하지 않음

모든 OpenAI 호환 API가 스트리밍을 지원하는 것은 아닙니다. 스트리밍이 실패하면 PRX는 자동으로 비스트리밍 모드로 폴백합니다.

### 모델을 찾을 수 없음

프로바이더가 기대하는 정확한 모델명/ID를 확인하세요. 다른 프로바이더는 다른 명명 규칙을 사용합니다:
- Groq: `llama-3.3-70b-versatile`
- Mistral: `mistral-large-latest`
- xAI: `grok-2`

올바른 모델 식별자에 대해 프로바이더 문서를 확인하세요.
