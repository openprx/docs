---
title: Google Gemini
description: PRX에서 Google Gemini를 LLM 프로바이더로 설정합니다
---

# Google Gemini

> API 키, Gemini CLI OAuth 토큰, 최대 2M 토큰의 긴 컨텍스트 윈도우를 지원하는 Google Generative Language API를 통해 Gemini 모델에 접근합니다.

## 사전 요구 사항

- [aistudio.google.com](https://aistudio.google.com/app/apikey)에서 발급받은 Google AI Studio API 키, **또는**
- Gemini CLI 설치 및 인증 (`gemini` 명령), **또는**
- `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY` 환경 변수

## 빠른 설정

### 1. API 키 발급

**옵션 A: API 키 (대부분의 사용자에게 권장)**

1. [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)를 방문합니다
2. **Create API key**를 클릭합니다
3. 키를 복사합니다

**옵션 B: Gemini CLI (기존 사용자를 위한 제로 설정)**

이미 Gemini CLI를 사용하고 있다면 PRX가 `~/.gemini/oauth_creds.json`에서 OAuth 토큰을 자동으로 감지합니다. 추가 설정이 필요 없습니다.

### 2. 설정

```toml
[default]
provider = "gemini"
model = "gemini-2.5-flash"

[providers.gemini]
api_key = "${GEMINI_API_KEY}"
```

또는 환경 변수를 설정합니다:

```bash
export GEMINI_API_KEY="AIza..."
```

### 3. 확인

```bash
prx doctor models
```

## 사용 가능한 모델

| 모델 | 컨텍스트 | 비전 | 도구 사용 | 참고 |
|------|---------|------|----------|------|
| `gemini-2.5-pro` | 1M | 예 | 예 | 가장 강력한 Gemini 모델 |
| `gemini-2.5-flash` | 1M | 예 | 예 | 빠르고 비용 효율적 |
| `gemini-2.0-flash` | 1M | 예 | 예 | 이전 세대 flash |
| `gemini-1.5-pro` | 2M | 예 | 예 | 가장 긴 컨텍스트 윈도우 |
| `gemini-1.5-flash` | 1M | 예 | 예 | 이전 세대 |

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `api_key` | string | 선택사항 | Google AI API 키 (`AIza...`) |
| `model` | string | `gemini-2.5-flash` | 사용할 기본 모델 |

## 기능

### 다중 인증 방법

PRX는 다음 우선순위로 Gemini 자격 증명을 확인합니다:

| 우선순위 | 소스 | 작동 방식 |
|---------|------|----------|
| 1 | 설정의 명시적 API 키 | 공개 API에 `?key=` 쿼리 파라미터로 전송 |
| 2 | `GEMINI_API_KEY` 환경 변수 | 위와 동일 |
| 3 | `GOOGLE_API_KEY` 환경 변수 | 위와 동일 |
| 4 | Gemini CLI OAuth 토큰 | 내부 Code Assist API에 `Authorization: Bearer`로 전송 |

### Gemini CLI OAuth 통합

Gemini CLI (`gemini` 명령)로 인증한 경우 PRX는 자동으로:

1. `~/.gemini/oauth_creds.json`을 읽습니다
2. 토큰 만료를 확인합니다 (만료된 토큰은 경고와 함께 건너뜀)
3. 적절한 엔벨로프 포맷을 사용하여 Google의 내부 Code Assist API (`cloudcode-pa.googleapis.com`)로 요청을 라우팅합니다

이를 통해 기존 Gemini CLI 사용자는 추가 설정 없이 PRX를 사용할 수 있습니다.

### 긴 컨텍스트 윈도우

Gemini 모델은 매우 긴 컨텍스트 윈도우를 지원합니다 (Gemini 1.5 Pro의 경우 최대 2M 토큰). PRX는 기본적으로 `maxOutputTokens`를 8192로 설정합니다. 전체 대화 기록이 올바른 역할 매핑 (`user`/`model`)으로 `contents`에 전송됩니다.

### 시스템 지시사항

시스템 프롬프트는 Gemini의 네이티브 `systemInstruction` 필드를 사용하여 전송됩니다 (일반 메시지가 아님). 이를 통해 모델이 올바르게 처리합니다.

### 자동 모델명 포맷팅

PRX는 필요시 모델명에 `models/`를 자동으로 추가합니다. `gemini-2.5-flash`와 `models/gemini-2.5-flash` 모두 올바르게 작동합니다.

## 프로바이더 별칭

다음 이름은 모두 Gemini 프로바이더로 해석됩니다:

- `gemini`
- `google`
- `google-gemini`

## 문제 해결

### "Gemini API key not found"

PRX가 인증 정보를 찾지 못했습니다. 옵션:

1. `GEMINI_API_KEY` 환경 변수 설정
2. `gemini` CLI를 실행하여 인증 (토큰이 자동으로 재사용됨)
3. [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)에서 API 키 발급
4. `prx onboard`를 실행하여 대화형으로 설정

### "400 Bad Request: API key not valid" (Gemini CLI 사용 시)

Gemini CLI의 OAuth 토큰이 공개 API 엔드포인트로 전송될 때 발생합니다. PRX는 OAuth 토큰을 내부 `cloudcode-pa.googleapis.com` 엔드포인트로 자동 라우팅하여 이를 처리합니다. 이 오류가 표시되면 최신 버전의 PRX를 사용하고 있는지 확인하세요.

### "Gemini CLI OAuth token expired"

`gemini` CLI를 다시 실행하여 토큰을 갱신하세요. PRX는 Gemini CLI 토큰을 자동으로 갱신하지 않습니다 (Anthropic OAuth 토큰과 달리).

### 403 Forbidden

API 키에 Generative Language API가 활성화되어 있지 않을 수 있습니다. [Google Cloud Console](https://console.cloud.google.com/)로 이동하여 프로젝트에 **Generative Language API**를 활성화하세요.
