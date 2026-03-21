---
title: OpenAI
description: PRX에서 OpenAI를 LLM 프로바이더로 설정합니다
---

# OpenAI

> 네이티브 함수 호출, 비전, 추론 모델 지원이 포함된 OpenAI Chat Completions API를 통해 GPT 모델에 접근합니다.

## 사전 요구 사항

- [platform.openai.com](https://platform.openai.com/)에서 발급받은 OpenAI API 키

## 빠른 설정

### 1. API 키 발급

1. [platform.openai.com](https://platform.openai.com/)에서 가입합니다
2. 왼쪽 사이드바에서 **API Keys**로 이동합니다
3. **Create new secret key**를 클릭하고 복사합니다 (`sk-`로 시작)

### 2. 설정

```toml
[default]
provider = "openai"
model = "gpt-4o"

[providers.openai]
api_key = "${OPENAI_API_KEY}"
```

또는 환경 변수를 설정합니다:

```bash
export OPENAI_API_KEY="sk-..."
```

### 3. 확인

```bash
prx doctor models
```

## 사용 가능한 모델

| 모델 | 컨텍스트 | 비전 | 도구 사용 | 참고 |
|------|---------|------|----------|------|
| `gpt-4o` | 128K | 예 | 예 | 최고의 범용 모델 |
| `gpt-4o-mini` | 128K | 예 | 예 | 더 작고 빠르며 저렴 |
| `gpt-4-turbo` | 128K | 예 | 예 | 이전 세대 플래그십 |
| `o3` | 128K | 예 | 예 | 추론 모델 |
| `o4-mini` | 128K | 예 | 예 | 더 작은 추론 모델 |
| `gpt-4` | 8K | 아니요 | 예 | 오리지널 GPT-4 |

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `api_key` | string | 필수 | OpenAI API 키 (`sk-...`) |
| `api_url` | string | `https://api.openai.com/v1` | 사용자 정의 API 기본 URL |
| `model` | string | `gpt-4o` | 사용할 기본 모델 |

## 기능

### 네이티브 함수 호출

PRX는 OpenAI의 네이티브 `function` 포맷으로 도구를 전송합니다. 도구 정의에는 `name`, `description`, `parameters` (JSON Schema)가 포함됩니다. 프로바이더는 자동 도구 선택을 위한 `tool_choice: "auto"`를 지원합니다.

### 비전

비전 지원 모델 (GPT-4o, GPT-4o-mini)은 대화에 포함된 이미지를 분석할 수 있습니다. 이미지는 표준 메시지 포맷을 통해 인라인으로 전송됩니다.

### 추론 모델 지원

추론 모델 (o1, o3, o4-mini)의 경우 PRX는 `reasoning_content` 폴백을 자동으로 처리합니다. 모델이 `content` 대신 `reasoning_content`로 출력을 반환하면 PRX는 추론 텍스트를 투명하게 추출합니다.

### 다중 턴 대화

전체 대화 기록이 보존되어 API에 전송됩니다. 시스템 프롬프트, 사용자 메시지, 어시스턴트 응답, 도구 호출/결과 쌍이 OpenAI의 네이티브 구조화 포맷으로 포함됩니다.

### 사용자 정의 기본 URL

프록시, Azure OpenAI 또는 OpenAI 호환 엔드포인트를 사용하려면:

```toml
[providers.openai]
api_key = "${OPENAI_API_KEY}"
api_url = "https://my-proxy.example.com/v1"
```

### 연결 워밍업

시작 시 PRX는 경량 `GET /models` 요청을 보내 TLS 및 HTTP/2 연결 풀을 수립하여 첫 번째 실제 요청의 지연 시간을 줄입니다.

## 문제 해결

### "OpenAI API key not set"

`OPENAI_API_KEY` 환경 변수를 설정하거나 `config.toml`의 `[providers.openai]`에 `api_key`를 추가하세요.

### 429 Rate Limit

OpenAI는 분당 토큰 및 요청 제한을 적용합니다. 해결 방법:
- 대기 후 재시도 (PRX는 reliable provider 래퍼로 이를 자동 처리)
- 더 높은 레이트 리밋을 위해 OpenAI 플랜 업그레이드
- 레이트 리밋 중 다른 프로바이더로 폴백하기 위해 `fallback_providers` 사용

### 추론 모델의 빈 응답

o1/o3/o4-mini를 사용할 때 빈 응답을 받는 경우 이는 모델의 출력이 전적으로 `reasoning_content`에 있을 때 예상되는 동작입니다. PRX는 `content`가 비어 있으면 자동으로 `reasoning_content`로 폴백합니다.
