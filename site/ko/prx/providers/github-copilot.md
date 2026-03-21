---
title: GitHub Copilot
description: PRX에서 GitHub Copilot을 LLM 프로바이더로 설정합니다
---

# GitHub Copilot

> 자동 OAuth 디바이스 플로우 인증과 토큰 관리가 지원되는 Copilot API를 통해 GitHub Copilot Chat 모델에 접근합니다.

## 사전 요구 사항

- 활성 **Copilot Individual**, **Copilot Business** 또는 **Copilot Enterprise** 구독이 있는 GitHub 계정
- 선택적으로 GitHub 개인 액세스 토큰 (그렇지 않으면 대화형 디바이스 플로우 로그인 사용)

## 빠른 설정

### 1. 인증

첫 사용 시 PRX는 GitHub의 디바이스 코드 플로우를 통해 인증하도록 안내합니다:

```
GitHub Copilot authentication is required.
Visit: https://github.com/login/device
Code: XXXX-XXXX
Waiting for authorization...
```

또는 GitHub 토큰을 직접 제공합니다:

```bash
export GITHUB_TOKEN="ghp_..."
```

### 2. 설정

```toml
[default]
provider = "copilot"
model = "gpt-4o"
```

### 3. 확인

```bash
prx doctor models
```

## 사용 가능한 모델

GitHub Copilot은 선별된 모델 세트에 대한 접근을 제공합니다. 사용 가능한 모델은 Copilot 구독 티어에 따라 다릅니다:

| 모델 | 컨텍스트 | 비전 | 도구 사용 | 참고 |
|------|---------|------|----------|------|
| `gpt-4o` | 128K | 예 | 예 | 기본 Copilot 모델 |
| `gpt-4o-mini` | 128K | 예 | 예 | 더 빠르고 비용 효율적 |
| `claude-sonnet-4` | 200K | 예 | 예 | Copilot Enterprise에서 사용 가능 |
| `o3-mini` | 128K | 아니요 | 예 | 추론 모델 |

모델 가용성은 GitHub Copilot 플랜과 GitHub의 현재 모델 제공에 따라 다를 수 있습니다.

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `api_key` | string | 선택사항 | GitHub 개인 액세스 토큰 (`ghp_...` 또는 `gho_...`) |
| `model` | string | `gpt-4o` | 사용할 기본 모델 |

## 기능

### 제로 설정 인증

Copilot 프로바이더는 VS Code의 Copilot 확장과 동일한 OAuth 디바이스 코드 플로우를 구현합니다:

1. **디바이스 코드 요청**: PRX가 GitHub에 디바이스 코드를 요청
2. **사용자 인증**: `github.com/login/device`를 방문하여 코드 입력
3. **토큰 교환**: GitHub OAuth 토큰이 단기 Copilot API 키로 교환
4. **자동 캐싱**: 토큰이 보안 파일 권한 (0600)으로 `~/.config/openprx/copilot/`에 캐시됨
5. **자동 갱신**: 만료된 Copilot API 키는 재인증 없이 자동으로 다시 교환됨

### 보안 토큰 저장

토큰은 엄격한 보안으로 저장됩니다:
- 디렉터리: `~/.config/openprx/copilot/` (0700 권한)
- 파일: `access-token`과 `api-key.json` (0600 권한)
- 비 Unix 플랫폼에서는 표준 파일 생성이 사용됩니다

### 동적 API 엔드포인트

Copilot API 키 응답에는 실제 API 엔드포인트를 지정하는 `endpoints.api` 필드가 포함됩니다. PRX는 이를 준수하며, 엔드포인트가 지정되지 않은 경우 `https://api.githubcopilot.com`으로 폴백합니다.

### 네이티브 도구 호출

도구는 Copilot Chat Completions API (`/chat/completions`)를 통해 OpenAI 호환 포맷으로 전송됩니다. 프로바이더는 자동 도구 선택을 위한 `tool_choice: "auto"`를 지원합니다.

### 에디터 헤더

요청에는 표준 Copilot 에디터 식별 헤더가 포함됩니다:
- `Editor-Version: vscode/1.85.1`
- `Editor-Plugin-Version: copilot/1.155.0`
- `User-Agent: GithubCopilot/1.155.0`

## 문제 해결

### "Failed to get Copilot API key (401/403)"

GitHub OAuth 토큰이 만료되었거나 Copilot 구독이 비활성 상태일 수 있습니다:
- GitHub 계정에 활성 Copilot 구독이 있는지 확인하세요
- PRX는 401/403 시 캐시된 액세스 토큰을 자동으로 지우고 디바이스 플로우 로그인을 다시 안내합니다

### "Timed out waiting for GitHub authorization"

디바이스 코드 플로우에는 15분 타임아웃이 있습니다. 만료되면:
- PRX 명령을 다시 실행하여 새 코드를 받으세요
- 올바른 URL을 방문하고 표시된 코드를 정확히 입력했는지 확인하세요

### "GitHub device authorization expired"

디바이스 코드가 만료되었습니다. 명령을 다시 시도하면 새 인증 플로우가 시작됩니다.

### 모델을 사용할 수 없음

사용 가능한 모델은 Copilot 구독 티어에 따라 다릅니다:
- **Copilot Individual**: GPT-4o, GPT-4o-mini
- **Copilot Business/Enterprise**: Claude 등 추가 모델 포함 가능

[github.com/settings/copilot](https://github.com/settings/copilot)에서 구독을 확인하세요.

### 레이트 리밋

GitHub Copilot은 OpenAI와 별개의 자체 레이트 리밋이 있습니다. 레이트 리밋이 발생하면 PRX 설정에서 `fallback_providers`를 사용하여 다른 프로바이더로 폴백하는 것을 고려하세요.
