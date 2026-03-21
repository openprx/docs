---
title: 인증
description: OAuth2 흐름 및 프로바이더 프로필을 포함한 PRX 인증 시스템의 개요입니다.
---

# 인증

PRX는 LLM 프로바이더, API 접근, 노드 간 통신을 위한 다양한 인증 메커니즘을 지원합니다. 인증 시스템은 OAuth2 흐름, API 키 관리, 프로바이더별 인증을 처리합니다.

## 개요

PRX의 인증은 여러 수준에서 작동합니다:

| 수준 | 메커니즘 | 목적 |
|------|----------|------|
| 프로바이더 인증 | OAuth2 / API 키 | LLM 프로바이더와 인증 |
| 게이트웨이 인증 | Bearer 토큰 | API 클라이언트 인증 |
| 노드 인증 | Ed25519 페어링 | 분산 노드 인증 |

## 프로바이더 인증

각 LLM 프로바이더는 자체 인증 방법을 가지고 있습니다:

- **API 키** -- 요청 헤더에 전달되는 정적 키 (대부분의 프로바이더)
- **OAuth2** -- 브라우저 기반 인증 흐름 (Anthropic, Google, GitHub Copilot)
- **AWS IAM** -- Bedrock을 위한 역할 기반 인증

## 설정

```toml
[auth]
default_method = "api_key"

[auth.oauth2]
redirect_port = 8400
token_cache_path = "~/.local/share/openprx/tokens"
```

## 관련 페이지

- [OAuth2 흐름](./oauth2)
- [프로바이더 프로필](./profiles)
- [시크릿 관리](/ko/prx/security/secrets)
