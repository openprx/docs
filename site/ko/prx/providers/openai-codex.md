---
title: OpenAI Codex
description: PRX에서 OpenAI Codex (GitHub Copilot OAuth2 플로우)를 LLM 프로바이더로 설정합니다
---

# OpenAI Codex

> GitHub Copilot의 OAuth2 인증 플로우를 사용하는 ChatGPT Responses API를 통해 OpenAI의 Codex 모델에 접근합니다. 추론 기능과 네이티브 도구 호출이 포함된 GPT-5.x Codex 모델에 대한 접근을 제공합니다.

## 사전 요구 사항

- ChatGPT Plus, Team 또는 Enterprise 구독
- 기존 Codex CLI 또는 GitHub Copilot OAuth2 토큰, **또는** `prx auth login` 플로우를 실행할 의향

## 빠른 설정

### 1. 인증

```bash
prx auth login --provider openai-codex
```

GitHub OAuth 디바이스 플로우를 시작하고 토큰을 `~/.openprx/`에 저장합니다.

### 2. 설정

```toml
[default]
provider = "openai-codex"
model = "gpt-5.3-codex"
```

### 3. 확인

```bash
prx doctor models
```

## 사용 가능한 모델

| 모델 | 컨텍스트 | 비전 | 도구 사용 | 참고 |
|------|---------|------|----------|------|
| `gpt-5.3-codex` | 128K | 예 | 예 | 최신 Codex 모델, 최고 기능 |
| `gpt-5.2-codex` | 128K | 예 | 예 | 이전 세대 Codex |
| `gpt-5.1-codex` | 128K | 예 | 예 | 안정 Codex 릴리스 |
| `gpt-5.1-codex-mini` | 128K | 예 | 예 | 더 작고 빠른 Codex 변형 |
| `gpt-5-codex` | 128K | 예 | 예 | 1세대 Codex 5 |
| `o3` | 128K | 예 | 예 | OpenAI 추론 모델 |
| `o4-mini` | 128K | 예 | 예 | 더 작은 추론 모델 |

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `model` | string | `gpt-5.3-codex` | 사용할 기본 Codex 모델 |

설정에 API 키가 필요하지 않습니다. 인증은 `~/.openprx/`에 저장된 OAuth 플로우를 통해 처리됩니다.

## 기능

### Responses API

Chat Completions API를 사용하는 표준 OpenAI 프로바이더와 달리 Codex 프로바이더는 더 새로운 Responses API (`/codex/responses`)를 사용하며 다음을 지원합니다:

- 실시간 델타 텍스트 이벤트가 포함된 SSE 스트리밍
- 도구 사용을 위한 구조화된 `function_call` 출력 항목
- 추론 노력 제어 (`minimal` / `low` / `medium` / `high` / `xhigh`)
- 응답 메타데이터의 추론 요약

### 자동 추론 노력

PRX는 모델에 따라 추론 노력을 자동으로 조정합니다:

| 모델 | `minimal` | `xhigh` |
|------|-----------|---------|
| `gpt-5.2-codex` / `gpt-5.3-codex` | `low`로 클램핑 | 허용 |
| `gpt-5.1` | 허용 | `high`로 클램핑 |
| `gpt-5.1-codex-mini` | `medium`으로 클램핑 | `high`로 클램핑 |

`ZEROCLAW_CODEX_REASONING_EFFORT` 환경 변수로 재정의합니다.

### 네이티브 도구 호출

도구 정의는 `type: "function"`, `name`, `description`, `parameters`가 포함된 Responses API 포맷으로 전송됩니다. 점이 포함된 도구명 (예: `email.execute`)은 자동으로 밑줄 (`email_execute`)로 치환되며 결과에서 원래 이름을 복원하는 역매핑이 적용됩니다.

### OAuth2 토큰 관리

PRX는 전체 OAuth2 생명주기를 관리합니다:

1. **로그인**: `prx auth login --provider openai-codex`로 디바이스 코드 플로우 시작
2. **토큰 저장**: 토큰이 `~/.openprx/`에 암호화되어 저장
3. **자동 갱신**: 만료된 액세스 토큰이 저장된 리프레시 토큰으로 자동 갱신
4. **Codex CLI 가져오기**: 기존 Codex CLI 설치가 있으면 PRX가 토큰을 자동으로 가져올 수 있음

### 스트림 처리

프로바이더는 다음을 지원하는 SSE 스트림을 처리합니다:
- 유휴 타임아웃 (기본 45초, `ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS`로 설정 가능)
- 최대 응답 크기 (4 MB)
- `[DONE]` 마커와 터미널 응답 이벤트의 우아한 처리
- 자동 콘텐츠 타입 감지 (SSE vs JSON)

## 환경 변수

| 변수 | 설명 |
|------|------|
| `ZEROCLAW_CODEX_REASONING_EFFORT` | 추론 노력 재정의 (`minimal` / `low` / `medium` / `high` / `xhigh`) |
| `ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS` | 스트림 유휴 타임아웃 (초, 기본값: 45, 최소: 5) |

## 문제 해결

### "OpenAI Codex auth profile not found"

`prx auth login --provider openai-codex`를 실행하여 인증하세요. ChatGPT 구독이 필요합니다.

### "OpenAI Codex account id not found"

JWT 토큰에 계정 ID가 포함되어 있지 않습니다. `prx auth login --provider openai-codex`로 다시 인증하세요.

### 스트림 타임아웃 오류

`provider_response_timeout kind=stream_idle_timeout`이 표시되면 모델 응답이 너무 오래 걸리는 것입니다. 옵션:
- 타임아웃 증가: `export ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS=120`
- `gpt-5.1-codex-mini`와 같은 더 빠른 모델 사용

### "payload_too_large" 오류

응답이 4 MB를 초과했습니다. 이는 일반적으로 비정상적으로 큰 모델 응답을 나타냅니다. 요청을 더 작은 부분으로 나누어 보세요.
