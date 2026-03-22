---
title: SSL/TLS 및 HTTP/3
description: "Let's Encrypt ACME 자동 인증서, 수동 인증서, HTTP/3 QUIC, Docker HTTPS 설정을 포함한 PRX-WAF SSL/TLS 설정 가이드."
---

# SSL/TLS 및 HTTP/3

PRX-WAF는 Let's Encrypt를 통한 자동 TLS 인증서와 수동 인증서 설정을 모두 지원합니다.

## Let's Encrypt (ACME) 자동 인증서

```toml
[http3]
enabled = true
listen = "0.0.0.0:443"

[http3.acme]
enabled = true
email = "admin@example.com"
domains = ["app.example.com", "api.example.com"]
cache_dir = "/etc/prx-waf/acme-cache"
```

### 사전 요구사항

- 포트 80이 인터넷에서 접근 가능해야 합니다 (HTTP-01 챌린지용)
- 도메인이 서버의 공개 IP를 가리켜야 합니다

### Let's Encrypt와 함께 HTTPS 활성화

```bash
# 1. ACME 설정으로 서버 시작
prx-waf -c configs/default.toml run

# 인증서는 시작 시 자동으로 요청됨
# 갱신은 자동으로 처리됨 (만료 30일 전)
```

## 수동 인증서

기존 인증서 또는 자체 서명 인증서를 사용합니다:

```toml
[http3]
enabled = true
listen = "0.0.0.0:443"
cert_pem = "/etc/prx-waf/tls/cert.pem"
key_pem  = "/etc/prx-waf/tls/key.pem"
```

### 자체 서명 인증서 생성 (개발용)

```bash
openssl req -x509 -newkey rsa:4096 \
  -keyout /etc/prx-waf/tls/key.pem \
  -out /etc/prx-waf/tls/cert.pem \
  -days 365 -nodes \
  -subj "/CN=localhost"
```

## HTTP/3 (QUIC)

HTTP/3는 TLS가 활성화될 때 자동으로 제공됩니다:

```toml
[http3]
enabled = true
listen = "0.0.0.0:443"
quic_listen = "0.0.0.0:443"    # QUIC은 UDP 사용
```

::: tip
HTTP/3는 QUIC/UDP를 사용합니다. 방화벽에서 UDP 포트 443을 허용해야 합니다.
:::

## HTTP에서 HTTPS로 리디렉션

모든 HTTP 트래픽을 HTTPS로 자동 리디렉션합니다:

```toml
[proxy]
listen = "0.0.0.0:8080"
redirect_http_to_https = true    # 8080에서 443으로 리디렉션
```

## Docker를 사용한 HTTPS

Docker Compose를 사용할 때 인증서를 마운트합니다:

```yaml
services:
  prx-waf:
    image: ghcr.io/openprx/prx-waf:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./configs:/app/configs
      - ./tls:/etc/prx-waf/tls    # 인증서 마운트
      - acme-cache:/etc/prx-waf/acme-cache

volumes:
  acme-cache:
```

## 인증서 관리

관리자 UI에서 인증서 상태를 확인합니다:

- **관리자 UI** → **SSL 인증서** → 만료 날짜 및 자동 갱신 상태 확인

또는 인증서를 수동으로 검증합니다:

```bash
openssl x509 -in /etc/prx-waf/tls/cert.pem -text -noout | grep -A2 "Validity"
openssl x509 -in /etc/prx-waf/tls/cert.pem -text -noout | grep "Subject Alternative Name" -A1
```

## TLS 버전 및 암호

```toml
[http3]
tls_min_version = "1.2"    # 1.2 또는 1.3
tls_ciphers = [
  "TLS_AES_128_GCM_SHA256",
  "TLS_AES_256_GCM_SHA384",
  "TLS_CHACHA20_POLY1305_SHA256"
]
```

## 다음 단계

- [리버스 프록시 설정](./reverse-proxy) — 호스트 및 업스트림 설정
- [설정 레퍼런스](../configuration/reference) — 모든 TLS 설정
- [문제 해결](../troubleshooting/) — SSL 인증서 문제 해결
