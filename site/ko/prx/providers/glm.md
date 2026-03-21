---
title: GLM (Zhipu AI)
description: PRX에서 GLM 및 관련 중국 AI 프로바이더 (Minimax, Moonshot, Qwen, Z.AI)를 설정합니다
---

# GLM (Zhipu AI)

> 통합 설정을 통해 Zhipu GLM 모델과 중국 AI 프로바이더 계열에 접근합니다. Minimax, Moonshot (Kimi), Qwen (DashScope), Z.AI에 대한 별칭을 포함합니다.

## 사전 요구 사항

- [open.bigmodel.cn](https://open.bigmodel.cn/)에서 발급받은 Zhipu AI API 키 (GLM 모델용), **또는**
- 사용하려는 특정 프로바이더의 API 키 (Minimax, Moonshot, Qwen 등)

## 빠른 설정

### 1. API 키 발급

1. [open.bigmodel.cn](https://open.bigmodel.cn/)에서 가입합니다
2. API Keys 섹션으로 이동합니다
3. 새 키를 생성합니다 (포맷: `id.secret`)

### 2. 설정

```toml
[default]
provider = "glm"
model = "glm-4-plus"

[providers.glm]
api_key = "${GLM_API_KEY}"
```

또는 환경 변수를 설정합니다:

```bash
export GLM_API_KEY="abc123.secretXYZ"
```

### 3. 확인

```bash
prx doctor models
```

## 사용 가능한 모델

### GLM 모델

| 모델 | 컨텍스트 | 비전 | 도구 사용 | 참고 |
|------|---------|------|----------|------|
| `glm-4-plus` | 128K | 예 | 예 | 가장 강력한 GLM 모델 |
| `glm-4` | 128K | 예 | 예 | 표준 GLM-4 |
| `glm-4-flash` | 128K | 예 | 예 | 빠르고 비용 효율적 |
| `glm-4v` | 128K | 예 | 예 | 비전 최적화 |

### 별칭 프로바이더

PRX는 OpenAI 호환 인터페이스를 통해 라우팅되는 별칭으로 이러한 프로바이더도 지원합니다:

| 프로바이더 | 별칭명 | 기본 URL | 주요 모델 |
|-----------|--------|---------|----------|
| **Minimax** | `minimax`, `minimax-intl`, `minimax-cn` | `api.minimax.io/v1` (국제), `api.minimaxi.com/v1` (중국) | `MiniMax-Text-01`, `abab6.5s` |
| **Moonshot** | `moonshot`, `kimi`, `moonshot-intl`, `kimi-cn` | `api.moonshot.ai/v1` (국제), `api.moonshot.cn/v1` (중국) | `moonshot-v1-128k`, `moonshot-v1-32k` |
| **Qwen** | `qwen`, `dashscope`, `qwen-intl`, `qwen-us` | `dashscope.aliyuncs.com` (중국), `dashscope-intl.aliyuncs.com` (국제) | `qwen-max`, `qwen-plus`, `qwen-turbo` |
| **Z.AI** | `zai`, `z.ai`, `zai-cn` | `api.z.ai/api/coding/paas/v4` (글로벌), `open.bigmodel.cn/api/coding/paas/v4` (중국) | Z.AI 코딩 모델 |

## 설정 레퍼런스

### GLM (네이티브 프로바이더)

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `api_key` | string | 필수 | `id.secret` 포맷의 GLM API 키 |
| `model` | string | 필수 | GLM 모델명 |

### 별칭 프로바이더 (OpenAI 호환)

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `api_key` | string | 필수 | 프로바이더별 API 키 |
| `api_url` | string | 자동 감지 | 기본 URL 재정의 |
| `model` | string | 필수 | 모델명 |

## 기능

### JWT 인증

GLM은 일반 API 키 대신 JWT 기반 인증을 사용합니다. PRX는 자동으로:

1. API 키를 `id`와 `secret` 컴포넌트로 분리합니다
2. 다음을 포함하는 JWT 토큰을 생성합니다:
   - 헤더: `{"alg":"HS256","typ":"JWT","sign_type":"SIGN"}`
   - 페이로드: `{"api_key":"<id>","exp":<expiry_ms>,"timestamp":<now_ms>}`
   - 서명: 시크릿 키를 사용한 HMAC-SHA256
3. JWT를 3분간 캐시합니다 (토큰은 3.5분에 만료)
4. `Authorization: Bearer <jwt>`로 전송합니다

### 리전별 엔드포인트

대부분의 별칭 프로바이더는 국제 및 중국 본토 엔드포인트를 모두 제공합니다:

```toml
# 국제 (대부분의 기본값)
provider = "moonshot-intl"

# 중국 본토
provider = "moonshot-cn"

# 명시적 리전 변형
provider = "qwen-us"      # 미국 리전
provider = "qwen-intl"    # 국제
provider = "qwen-cn"      # 중국 본토
```

### Minimax OAuth 지원

Minimax는 OAuth 토큰 인증을 지원합니다:

```bash
export MINIMAX_OAUTH_TOKEN="..."
export MINIMAX_OAUTH_REFRESH_TOKEN="..."
```

API 키 인증 대신 OAuth를 사용하려면 `provider = "minimax-oauth"` 또는 `provider = "minimax-oauth-cn"`을 설정합니다.

### Qwen OAuth 및 코딩 모드

Qwen은 추가 접근 모드를 제공합니다:

- **Qwen OAuth**: OAuth 기반 접근을 위해 `provider = "qwen-oauth"` 또는 `provider = "qwen-code"`
- **Qwen Coding**: 코딩 전문 API 엔드포인트를 위해 `provider = "qwen-coding"` 또는 `provider = "dashscope-coding"`

## 프로바이더 별칭 레퍼런스

| 별칭 | 해석 대상 | 엔드포인트 |
|------|----------|----------|
| `glm`, `zhipu`, `glm-global`, `zhipu-global` | GLM (글로벌) | `api.z.ai/api/paas/v4` |
| `glm-cn`, `zhipu-cn`, `bigmodel` | GLM (중국) | `open.bigmodel.cn/api/paas/v4` |
| `minimax`, `minimax-intl`, `minimax-global` | MiniMax (국제) | `api.minimax.io/v1` |
| `minimax-cn`, `minimaxi` | MiniMax (중국) | `api.minimaxi.com/v1` |
| `moonshot`, `kimi`, `moonshot-cn`, `kimi-cn` | Moonshot (중국) | `api.moonshot.cn/v1` |
| `moonshot-intl`, `kimi-intl`, `kimi-global` | Moonshot (국제) | `api.moonshot.ai/v1` |
| `qwen`, `dashscope`, `qwen-cn` | Qwen (중국) | `dashscope.aliyuncs.com` |
| `qwen-intl`, `dashscope-intl` | Qwen (국제) | `dashscope-intl.aliyuncs.com` |
| `qwen-us`, `dashscope-us` | Qwen (미국) | `dashscope-us.aliyuncs.com` |
| `zai`, `z.ai` | Z.AI (글로벌) | `api.z.ai/api/coding/paas/v4` |
| `zai-cn`, `z.ai-cn` | Z.AI (중국) | `open.bigmodel.cn/api/coding/paas/v4` |

## 문제 해결

### "GLM API key not set or invalid format"

GLM API 키는 `id.secret` 포맷이어야 합니다 (정확히 하나의 점 포함). 키 포맷을 확인하세요:
```
abc123.secretXYZ  # 올바름
abc123secretXYZ   # 잘못됨 - 점 누락
```

### JWT 생성 실패

시스템 시계가 정확한지 확인하세요. JWT 토큰에는 타임스탬프가 포함되며 3.5분 후에 만료됩니다.

### MiniMax "role: system" 거부됨

MiniMax는 `role: system` 메시지를 허용하지 않습니다. PRX는 MiniMax 프로바이더를 사용할 때 시스템 메시지 내용을 첫 번째 사용자 메시지에 자동으로 병합합니다.

### Qwen/DashScope 타임아웃

Qwen의 DashScope API는 HTTP/1.1을 요구합니다 (HTTP/2가 아님). PRX는 DashScope 엔드포인트에 대해 HTTP/1.1을 자동으로 강제합니다. 타임아웃이 발생하면 네트워크가 HTTP/1.1 연결을 허용하는지 확인하세요.

### 리전 엔드포인트 오류

연결 오류가 발생하면 리전 엔드포인트를 전환해 보세요:
- 중국 사용자: `*-cn` 변형 사용
- 국제 사용자: `*-intl` 또는 기본 변형 사용
- 미국 기반 사용자: Qwen의 경우 `qwen-us` 시도
