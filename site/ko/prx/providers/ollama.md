---
title: Ollama
description: 로컬 및 셀프 호스팅 LLM 추론을 위해 PRX에서 Ollama를 LLM 프로바이더로 설정합니다
---

# Ollama

> Ollama로 LLM을 로컬 또는 셀프 호스팅 인프라에서 실행합니다. 비전, 네이티브 도구 호출, 추론 모델, Ollama Cloud를 통한 선택적 클라우드 라우팅을 지원합니다.

## 사전 요구 사항

- [Ollama](https://ollama.com/)가 로컬에 설치 및 실행 중, **또는**
- 네트워크 접근이 가능한 원격 Ollama 인스턴스

## 빠른 설정

### 1. Ollama 설치

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# 서버 시작
ollama serve
```

### 2. 모델 다운로드

```bash
ollama pull qwen3
```

### 3. 설정

```toml
[default]
provider = "ollama"
model = "qwen3"
```

로컬 사용에는 API 키가 필요하지 않습니다.

### 4. 확인

```bash
prx doctor models
```

## 사용 가능한 모델

Ollama를 통해 사용 가능한 모든 모델을 사용할 수 있습니다. 인기 있는 선택:

| 모델 | 파라미터 | 비전 | 도구 사용 | 참고 |
|------|---------|------|----------|------|
| `qwen3` | 8B | 아니요 | 예 | 뛰어난 다국어 코딩 모델 |
| `qwen2.5-coder` | 7B | 아니요 | 예 | 코드 전문화 |
| `llama3.1` | 8B/70B/405B | 아니요 | 예 | Meta의 오픈 모델 계열 |
| `mistral-nemo` | 12B | 아니요 | 예 | 효율적인 추론 |
| `deepseek-r1` | 7B/14B/32B | 아니요 | 예 | 추론 모델 |
| `llava` | 7B/13B | 예 | 아니요 | 비전 + 언어 |
| `gemma2` | 9B/27B | 아니요 | 예 | Google의 오픈 모델 |
| `codellama` | 7B/13B/34B | 아니요 | 아니요 | 코드 전문화 Llama |

`ollama list`를 실행하여 설치된 모델을 확인하세요.

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `api_key` | string | 선택사항 | 원격/클라우드 Ollama 인스턴스용 API 키 |
| `api_url` | string | `http://localhost:11434` | Ollama 서버 기본 URL |
| `model` | string | 필수 | 모델명 (예: `qwen3`, `llama3.1:70b`) |
| `reasoning` | bool | 선택사항 | 추론 모델용 `think` 모드 활성화 |

## 기능

### 로컬 사용 시 제로 설정

Ollama를 로컬에서 실행할 때 API 키나 특별한 설정이 필요하지 않습니다. PRX는 자동으로 `http://localhost:11434`에 연결합니다.

### 네이티브 도구 호출

PRX는 Ollama의 네이티브 `/api/chat` 도구 호출 지원을 사용합니다. 도구 정의가 요청 본문에 전송되며 호환 모델 (qwen2.5, llama3.1, mistral-nemo 등)이 구조화된 `tool_calls`를 반환합니다.

PRX는 모델의 특이한 동작도 처리합니다:
- **중첩된 도구 호출**: `{"name": "tool_call", "arguments": {"name": "shell", ...}}`를 자동으로 언래핑
- **접두사가 붙은 이름**: `tool.shell`이 `shell`로 정규화
- **도구 결과 매핑**: 도구 호출 ID가 추적되고 후속 도구 결과 메시지의 `tool_name` 필드에 매핑

### 비전 지원

비전 지원 모델 (예: LLaVA)은 Ollama의 네이티브 `images` 필드를 통해 이미지를 수신합니다. PRX는 `[IMAGE:...]` 마커에서 base64 이미지 데이터를 자동으로 추출하고 별도의 이미지 항목으로 전송합니다.

### 추론 모드

추론 모델 (QwQ, DeepSeek-R1 등)의 경우 `think` 파라미터를 활성화합니다:

```toml
[providers.ollama]
reasoning = true
```

이는 요청에 `"think": true`를 전송하여 모델의 내부 추론 과정을 활성화합니다. 모델이 빈 콘텐츠와 함께 `thinking` 필드만 반환하면 PRX는 우아한 폴백 메시지를 제공합니다.

### 원격 및 클라우드 인스턴스

원격 Ollama 서버에 연결하려면:

```toml
[providers.ollama]
api_url = "https://my-ollama-server.example.com:11434"
api_key = "${OLLAMA_API_KEY}"
```

인증은 비로컬 엔드포인트 (호스트가 `localhost`, `127.0.0.1` 또는 `::1`이 아닌 경우)에서만 전송됩니다.

### 클라우드 라우팅

모델명에 `:cloud`를 추가하여 원격 Ollama 인스턴스를 통한 라우팅을 강제합니다:

```bash
prx chat --model "qwen3:cloud"
```

클라우드 라우팅 요구 사항:
- 비로컬 `api_url`
- `api_key` 설정

### 연장된 타임아웃

Ollama 요청은 로컬 하드웨어에서의 잠재적으로 느린 추론을 고려하여 300초 타임아웃을 사용합니다 (클라우드 프로바이더의 120초와 비교).

## 문제 해결

### "Is Ollama running?"

가장 일반적인 오류입니다. 해결 방법:
- 서버 시작: `ollama serve`
- 포트 접근 가능 여부 확인: `curl http://localhost:11434`
- 사용자 정의 포트를 사용하는 경우 설정에서 `api_url`을 업데이트

### 모델을 찾을 수 없음

먼저 모델을 다운로드하세요:
```bash
ollama pull qwen3
```

### 빈 응답

일부 추론 모델은 최종 응답 없이 `thinking` 콘텐츠만 반환할 수 있습니다. 이는 일반적으로 모델이 조기에 중단되었음을 의미합니다. 시도:
- 요청을 다시 전송
- 다른 모델 사용
- 모델이 잘 지원하지 않는 경우 추론 모드 비활성화

### 도구 호출이 작동하지 않음

모든 Ollama 모델이 도구 호출을 지원하는 것은 아닙니다. 잘 작동하는 것으로 알려진 모델:
- `qwen2.5` / `qwen3`
- `llama3.1`
- `mistral-nemo`
- `command-r`

### 클라우드 라우팅 오류

- "requested cloud routing, but Ollama endpoint is local": `api_url`을 원격 서버로 설정
- "requested cloud routing, but no API key is configured": `api_key` 또는 `OLLAMA_API_KEY` 설정
