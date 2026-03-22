---
title: 설정 개요
description: "TOML 파일과 데이터베이스 레이어를 포함한 PRX-WAF 두 레이어 설정 시스템 개요."
---

# 설정 개요

PRX-WAF는 두 레이어 설정 시스템을 사용합니다:

1. **TOML 파일** (`configs/default.toml`) — 서버, 데이터베이스, 네트워크 설정
2. **데이터베이스** — 규칙 활성화/비활성화, IP 규칙, 동적 설정 (관리자 UI 또는 API로 변경)

## 설정 로드

```bash
# 특정 설정 파일 사용
prx-waf -c configs/production.toml run

# 기본 위치: configs/default.toml
prx-waf run
```

## 최소 설정

```toml
[proxy]
listen = "0.0.0.0:8080"

[api]
listen = "127.0.0.1:9527"

[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

이 최소 설정으로:
- WAF는 포트 8080에서 수신
- 관리자 API는 포트 9527에서 수신
- PostgreSQL 연결은 지정된 URL 사용

## 프로덕션 설정 예제

```toml
[proxy]
listen = "0.0.0.0:8080"
worker_threads = 8

[api]
listen = "127.0.0.1:9527"
jwt_secret = "your-secure-random-secret-here"

[storage]
database_url = "postgresql://prx_waf:secure_password@db:5432/prx_waf"
max_connections = 20

[cache]
enabled = true
max_size_mb = 256
default_ttl_secs = 300

[http3]
enabled = true
listen = "0.0.0.0:443"

[http3.acme]
enabled = true
email = "admin@example.com"
domains = ["app.example.com"]

[rules]
dir = "rules/"
hot_reload = true
reload_debounce_ms = 500
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
paranoia_level = 1

[security]
block_response_code = 403
block_response_body = "Request blocked by PRX-WAF"
rate_limit_response_code = 429

[[hosts]]
host = "app.example.com"
upstream = "http://127.0.0.1:3000"
```

## 환경 변수

민감한 값은 환경 변수를 사용합니다:

```bash
export PRX_WAF_DB_URL="postgresql://prx_waf:secret@db:5432/prx_waf"
export PRX_WAF_JWT_SECRET="your-secret"
```

TOML 설정에서 참조:

```toml
[storage]
database_url = "${PRX_WAF_DB_URL}"

[api]
jwt_secret = "${PRX_WAF_JWT_SECRET}"
```

## 설정 검증

서버를 시작하기 전에 설정 파일을 검증합니다:

```bash
prx-waf -c configs/production.toml validate
```

## 다음 단계

- [설정 레퍼런스](./reference) — 모든 TOML 설정 키
- [설치 가이드](../getting-started/installation) — 초기 설정
- [문제 해결](../troubleshooting/) — 일반적인 설정 문제
