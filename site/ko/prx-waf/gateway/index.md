---
title: Pingora 게이트웨이
description: "HTTP/1.1, HTTP/2, HTTP/3(QUIC), 로드 밸런싱, 응답 캐싱, 리버스 터널을 포함한 PRX-WAF Pingora 기반 게이트웨이 개요."
---

# Pingora 게이트웨이

PRX-WAF는 클라우드플레어의 프로덕션 트래픽을 처리하는 전투 검증된 Rust HTTP 프레임워크인 [Pingora](https://github.com/cloudflare/pingora)를 기반으로 구축되었습니다.

## 프로토콜 지원

| 프로토콜 | 지원 여부 | 비고 |
|---------|---------|------|
| HTTP/1.1 | 예 | 기본값 |
| HTTP/2 | 예 | TLS를 통한 자동 협상 |
| HTTP/3 (QUIC) | 예 | 명시적 설정 필요 |
| WebSocket | 예 | HTTP/1.1을 통한 투명한 프록시 |

## 리버스 프록시

게이트웨이는 들어오는 요청을 WAF 파이프라인을 통해 필터링한 후 업스트림 서버로 전달합니다:

```
클라이언트 → [PRX-WAF + 탐지] → 업스트림 (백엔드 서버)
```

### 기본 호스트 설정

```toml
[proxy]
listen = "0.0.0.0:8080"

[[hosts]]
host = "app.example.com"
upstream = "http://127.0.0.1:3000"

[[hosts]]
host = "api.example.com"
upstream = "http://127.0.0.1:4000"
```

## 로드 밸런싱

여러 업스트림 서버 간의 로드 밸런싱:

```toml
[[hosts]]
host = "app.example.com"
upstream = ["http://10.0.0.1:3000", "http://10.0.0.2:3000", "http://10.0.0.3:3000"]
load_balance = "round_robin"    # round_robin, least_conn, ip_hash
health_check_path = "/health"
health_check_interval_secs = 10
```

지원되는 로드 밸런싱 알고리즘:

| 알고리즘 | 설명 |
|---------|------|
| `round_robin` | 순환 방식으로 요청 분산 (기본값) |
| `least_conn` | 활성 연결이 가장 적은 서버로 전송 |
| `ip_hash` | 동일한 클라이언트 IP는 항상 동일 서버로 |

## 응답 캐싱

자주 요청되는 콘텐츠에 대한 메모리 내 캐싱:

```toml
[cache]
enabled = true
max_size_mb = 256
default_ttl_secs = 300    # 5분

[[hosts]]
host = "app.example.com"
upstream = "http://127.0.0.1:3000"
cache_responses = true
cache_ttl_secs = 600    # 10분
```

캐시 가능한 응답:
- GET 및 HEAD 요청
- 2xx 상태 코드
- `Cache-Control: no-store`가 없는 응답

## 요청 헤더

업스트림으로 전달하기 전에 요청 헤더 추가, 수정, 제거:

```toml
[[hosts]]
host = "app.example.com"
upstream = "http://127.0.0.1:3000"

[hosts.request_headers]
add = { "X-Forwarded-For" = "$client_ip", "X-Real-IP" = "$client_ip" }
set = { "Host" = "internal.backend.local" }
remove = ["X-Powered-By", "Server"]
```

## 리버스 터널

WAF를 공용 진입점으로, 개인 백엔드를 NAT 뒤에 배치합니다:

```toml
[[hosts]]
host = "app.example.com"
tunnel = true
tunnel_endpoint = "wss://backend-agent.internal:8443"
```

## 타임아웃 설정

```toml
[proxy]
connect_timeout_ms = 5000      # 업스트림 연결 타임아웃
read_timeout_ms = 30000        # 응답 읽기 타임아웃
write_timeout_ms = 30000       # 요청 쓰기 타임아웃
idle_timeout_ms = 60000        # 유휴 연결 타임아웃
```

## 다음 단계

- [리버스 프록시 설정](./reverse-proxy) — 호스트 설정, 요청 헤더, IP 규칙
- [SSL/TLS](./ssl-tls) — HTTPS 및 HTTP/3 활성화
- [설정 레퍼런스](../configuration/reference) — 모든 게이트웨이 설정
