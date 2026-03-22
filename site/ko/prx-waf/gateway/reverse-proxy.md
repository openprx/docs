---
title: 리버스 프록시 설정
description: "호스트 설정, 로드 밸런싱, 요청 헤더 조작, IP 허용/차단 목록을 포함한 PRX-WAF 리버스 프록시 설정 가이드."
---

# 리버스 프록시 설정

이 페이지는 PRX-WAF 리버스 프록시를 설정하여 웹 애플리케이션을 보호하는 방법을 설명합니다.

## 기본 호스트 설정

각 보호된 애플리케이션은 TOML 설정에서 `[[hosts]]` 블록으로 정의됩니다:

```toml
[[hosts]]
host = "app.example.com"          # 들어오는 Host 헤더
upstream = "http://127.0.0.1:3000"  # 백엔드 서버
```

여러 호스트:

```toml
[[hosts]]
host = "app.example.com"
upstream = "http://127.0.0.1:3000"

[[hosts]]
host = "api.example.com"
upstream = "http://127.0.0.1:4000"

[[hosts]]
host = "admin.example.com"
upstream = "http://127.0.0.1:5000"
```

## 로드 밸런싱

단일 호스트에 여러 업스트림 서버:

```toml
[[hosts]]
host = "app.example.com"
upstream = [
  "http://10.0.0.1:3000",
  "http://10.0.0.2:3000",
  "http://10.0.0.3:3000"
]
load_balance = "round_robin"      # round_robin | least_conn | ip_hash
health_check_path = "/health"
health_check_interval_secs = 10
```

## 요청 헤더 조작

업스트림으로 전달하기 전에 헤더 수정:

```toml
[[hosts]]
host = "app.example.com"
upstream = "http://127.0.0.1:3000"

[hosts.request_headers]
# 헤더 추가 (존재하지 않으면)
add = {
  "X-Forwarded-For" = "$client_ip",
  "X-Real-IP" = "$client_ip",
  "X-Forwarded-Proto" = "$scheme",
  "X-Request-ID" = "$request_id"
}

# 헤더 설정 (항상 덮어씀)
set = {
  "Host" = "internal.backend.local"
}

# 업스트림으로 전달하기 전에 헤더 제거
remove = ["X-Powered-By", "Server", "X-ASP-Net-Version"]
```

사용 가능한 변수:
- `$client_ip` — 클라이언트 IP 주소
- `$scheme` — `http` 또는 `https`
- `$host` — 원래 Host 헤더
- `$request_id` — 고유 요청 ID (UUID v4)

## IP 허용/차단 목록

### 정적 IP 규칙

```toml
[[hosts]]
host = "app.example.com"
upstream = "http://127.0.0.1:3000"

# 내부 IP 허용 (WAF 검사 건너뜀)
allow_ips = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]

# 알려진 악성 IP 차단
block_ips = ["1.2.3.4", "5.6.7.0/24"]
```

### API를 통한 동적 IP 규칙

```bash
# IP 허용 추가
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "203.0.113.0/24", "action": "allow", "note": "Office network"}'

# IP 차단 추가
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "1.2.3.4", "action": "block", "note": "Known attacker"}'

# 모든 IP 규칙 나열
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/rules/ip
```

## 응답 헤더

업스트림에서 클라이언트로 보내기 전에 응답 헤더 수정:

```toml
[[hosts]]
host = "app.example.com"
upstream = "http://127.0.0.1:3000"

[hosts.response_headers]
add = {
  "Strict-Transport-Security" = "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options" = "nosniff",
  "X-Frame-Options" = "SAMEORIGIN"
}
remove = ["X-Powered-By", "Server"]
```

## 경로별 규칙

특정 경로 패턴에 다른 설정 적용:

```toml
[[hosts]]
host = "app.example.com"
upstream = "http://127.0.0.1:3000"

[[hosts.paths]]
pattern = "/api/*"
rate_limit = { requests_per_minute = 100, burst = 20 }

[[hosts.paths]]
pattern = "/admin/*"
allow_ips = ["10.0.0.0/8"]    # 관리자 경로는 내부 전용
```

## 타임아웃 및 재시도

```toml
[[hosts]]
host = "app.example.com"
upstream = "http://127.0.0.1:3000"
connect_timeout_ms = 5000
read_timeout_ms = 30000
retry_on_failure = true
max_retries = 3
```

## 다음 단계

- [SSL/TLS](./ssl-tls) — HTTPS 및 HTTP/3 활성화
- [게이트웨이 개요](./index) — 로드 밸런싱 및 캐싱
- [사용자 정의 규칙](../rules/custom-rules) — 경로별 WAF 규칙 추가
