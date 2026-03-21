---
title: 미들웨어
description: 인증, 속도 제한, CORS, 로깅을 위한 게이트웨이 미들웨어 스택입니다.
---

# 미들웨어

PRX 게이트웨이는 인증, 속도 제한, CORS, 요청 로깅과 같은 횡단 관심사를 처리하기 위해 조합 가능한 미들웨어 스택을 사용합니다.

## 미들웨어 스택

요청은 순서대로 미들웨어 스택을 통과합니다:

1. **요청 로깅** -- 타이밍과 함께 수신 요청을 로깅합니다
2. **CORS** -- 교차 출처 리소스 공유 헤더를 처리합니다
3. **인증** -- Bearer 토큰 또는 API 키를 검증합니다
4. **속도 제한** -- 클라이언트별 요청 제한을 적용합니다
5. **요청 라우팅** -- 적절한 핸들러로 디스패치합니다

## 인증 미들웨어

```toml
[gateway.auth]
enabled = true
method = "bearer"  # "bearer" | "api_key" | "none"
token_secret = "your-secret-key"
```

## 속도 제한

```toml
[gateway.rate_limit]
enabled = true
requests_per_minute = 60
burst_size = 10
```

## CORS

```toml
[gateway.cors]
allowed_origins = ["https://app.example.com"]
allowed_methods = ["GET", "POST", "PUT", "DELETE"]
allowed_headers = ["Authorization", "Content-Type"]
max_age_secs = 86400
```

## 요청 로깅

모든 API 요청은 메서드, 경로, 상태 코드, 응답 시간과 함께 로깅됩니다. 로그 수준을 설정할 수 있습니다:

```toml
[gateway.logging]
level = "info"  # "debug" | "info" | "warn" | "error"
format = "json"  # "json" | "pretty"
```

## 관련 페이지

- [게이트웨이 개요](./)
- [HTTP API](./http-api)
- [보안](/ko/prx/security/)
