---
title: Anthropic
description: PRX에서 Anthropic Claude를 LLM 프로바이더로 설정합니다
---

# Anthropic

> 네이티브 도구 사용, 비전, 프롬프트 캐싱, OAuth 토큰 자동 갱신이 지원되는 Anthropic Messages API를 통해 Claude 모델 (Opus, Sonnet, Haiku)에 접근합니다.

## 사전 요구 사항

- [console.anthropic.com](https://console.anthropic.com/)에서 발급받은 Anthropic API 키, **또는**
- Claude Code OAuth 토큰 (`~/.claude/.credentials.json`에서 자동 감지)

## 빠른 설정

### 1. API 키 발급

1. [console.anthropic.com](https://console.anthropic.com/)에서 가입합니다
2. 대시보드에서 **API Keys**로 이동합니다
3. **Create Key**를 클릭하고 키를 복사합니다 (`sk-ant-`로 시작)

### 2. 설정

```toml
[default]
provider = "anthropic"
model = "claude-sonnet-4-20250514"

[providers.anthropic]
api_key = "${ANTHROPIC_API_KEY}"
```

또는 환경 변수를 설정합니다:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. 확인

```bash
prx doctor models
```

## 사용 가능한 모델

| 모델 | 컨텍스트 | 비전 | 도구 사용 | 참고 |
|------|---------|------|----------|------|
| `claude-opus-4-20250514` | 200K | 예 | 예 | 가장 강력한 모델, 복잡한 추론에 최적 |
| `claude-sonnet-4-20250514` | 200K | 예 | 예 | 속도와 기능의 최적 균형 |
| `claude-haiku-3-5-20241022` | 200K | 예 | 예 | 가장 빠르고 비용 효율적 |
| `claude-sonnet-4-6` | 200K | 예 | 예 | 최신 Sonnet 릴리스 |
| `claude-opus-4-6` | 200K | 예 | 예 | 최신 Opus 릴리스 |

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `api_key` | string | 필수 | Anthropic API 키 (`sk-ant-...`) 또는 OAuth 토큰 |
| `api_url` | string | `https://api.anthropic.com` | 사용자 정의 API 기본 URL (프록시용) |
| `model` | string | `claude-sonnet-4-20250514` | 사용할 기본 모델 |

## 기능

### 네이티브 도구 호출

PRX는 Anthropic의 네이티브 포맷으로 `input_schema`와 함께 도구 정의를 전송하여 손실이 있는 OpenAI-Anthropic 포맷 변환을 방지합니다. 도구 결과는 `tool_result` 콘텐츠 블록으로 올바르게 래핑됩니다.

### 비전 (이미지 분석)

메시지에 `[IMAGE:data:image/png;base64,...]` 마커로 포함된 이미지는 올바른 `media_type`과 `source_type` 필드를 가진 Anthropic 네이티브 `image` 콘텐츠 블록으로 자동 변환됩니다. 최대 20 MB까지의 이미지가 지원됩니다 (이 크기를 초과하는 페이로드에 대해 경고가 로그됩니다).

### 프롬프트 캐싱

PRX는 비용과 지연 시간을 줄이기 위해 Anthropic의 임시 프롬프트 캐싱을 자동으로 적용합니다:

- ~1024 토큰 (3 KB) 이상의 **시스템 프롬프트**는 `cache_control` 블록을 받습니다
- 4개 이상의 비시스템 메시지가 있는 **대화**에서 마지막 메시지가 캐시됩니다
- **도구 정의**의 마지막 도구에 `cache_control: ephemeral`이 표시됩니다

설정이 필요 없으며 캐싱은 투명하게 적용됩니다.

### OAuth 토큰 자동 갱신

Claude Code 자격 증명을 사용할 때 PRX는 자동으로:

1. `~/.claude/.credentials.json`에서 캐시된 OAuth 토큰을 감지합니다
2. 만료 90초 전에 선제적으로 토큰을 갱신합니다
3. 401 응답 시 새 토큰으로 재시도합니다
4. 갱신된 자격 증명을 디스크에 다시 저장합니다

이를 통해 `prx`는 추가 설정 없이 기존 Claude Code 로그인을 활용할 수 있습니다.

### Claude Code 통합

PRX는 다음을 Anthropic 인증 소스로 인식합니다:

| 소스 | 감지 |
|------|------|
| 직접 API 키 | `sk-ant-api-...` 접두사, `x-api-key` 헤더로 전송 |
| OAuth 설정 토큰 | `sk-ant-oat01-...` 접두사, `anthropic-beta` 헤더와 함께 `Authorization: Bearer`로 전송 |
| Claude Code 캐시된 자격 증명 | `~/.claude/.credentials.json`의 `access_token` + `refresh_token` |
| 환경 변수 | `ANTHROPIC_API_KEY` |

### 사용자 정의 기본 URL

프록시나 대체 엔드포인트를 통해 라우팅하려면:

```toml
[providers.anthropic]
api_key = "${ANTHROPIC_API_KEY}"
api_url = "https://my-proxy.example.com"
```

## 프로바이더 별칭

다음 이름은 모두 Anthropic 프로바이더로 해석됩니다:

- `anthropic`
- `claude-code`
- `claude-cli`

## 문제 해결

### "Anthropic credentials not set"

PRX가 인증 정보를 찾지 못했습니다. 다음 중 하나가 설정되어 있는지 확인하세요:

1. `ANTHROPIC_API_KEY` 환경 변수
2. `[providers.anthropic]` 아래 `config.toml`의 `api_key`
3. Claude Code에서 생성된 유효한 `~/.claude/.credentials.json`

### 401 Unauthorized

- **API 키**: `sk-ant-api-`로 시작하고 만료되지 않았는지 확인합니다
- **OAuth 토큰**: `prx auth login --provider anthropic`을 실행하여 다시 인증하거나, Claude Code를 재시작하여 토큰을 갱신합니다
- **프록시 문제**: 사용자 정의 `api_url`을 사용하는 경우 프록시가 `x-api-key` 또는 `Authorization` 헤더를 올바르게 전달하는지 확인합니다

### 이미지 페이로드 크기 초과

Anthropic은 base64로 인코딩된 이미지를 20 MB 미만으로 권장합니다. 전송 전에 큰 이미지를 리사이즈하거나 압축하세요.

### 프롬프트 캐싱이 작동하지 않음

캐싱은 자동이지만 다음이 필요합니다:
- 시스템 프롬프트 > 3 KB (시스템 수준 캐싱 트리거)
- 4개 이상의 비시스템 메시지 (대화 캐싱 트리거)
- API 버전 `2023-06-01` (PRX가 자동으로 설정)
