---
title: OAuth2 흐름
description: LLM 프로바이더 인증을 위해 PRX가 지원하는 OAuth2 인증 흐름입니다.
---

# OAuth2 흐름

PRX는 브라우저 기반 인증을 지원하는 프로바이더를 위한 OAuth2 인증 흐름을 구현합니다. 이를 통해 사용자가 API 키를 수동으로 관리하지 않고도 인증할 수 있습니다.

## 지원 흐름

### Authorization Code Flow

Anthropic (Claude Code), Google Gemini CLI, Minimax에서 사용됩니다:

1. PRX가 프로바이더의 인증 URL로 브라우저를 엽니다
2. 사용자가 권한을 부여합니다
3. 프로바이더가 PRX의 로컬 콜백 서버로 리디렉션합니다
4. PRX가 인증 코드를 액세스 및 리프레시 토큰으로 교환합니다
5. 토큰이 향후 사용을 위해 안전하게 저장됩니다

### Device Code Flow

GitHub Copilot에서 사용됩니다:

1. PRX가 프로바이더에 디바이스 코드를 요청합니다
2. 사용자가 URL을 방문하여 디바이스 코드를 입력합니다
3. PRX가 인증 완료를 폴링합니다
4. 인증되면 토큰이 수신되어 저장됩니다

## 토큰 관리

PRX는 다음을 자동으로 처리합니다:

- 반복 인증을 피하기 위한 토큰 캐싱
- 액세스 토큰 만료 시 리프레시 토큰 순환
- 토큰의 안전한 저장 (저장 시 암호화)

## 설정

```toml
[auth.oauth2]
redirect_port = 8400
token_cache_path = "~/.local/share/openprx/tokens"
auto_refresh = true
```

## CLI 명령

```bash
prx auth login anthropic    # Anthropic OAuth2 흐름 시작
prx auth login copilot      # Copilot 디바이스 코드 흐름 시작
prx auth status              # 모든 프로바이더의 인증 상태 표시
prx auth logout anthropic   # Anthropic 토큰 취소
```

## 관련 페이지

- [인증 개요](./)
- [프로바이더 프로필](./profiles)
