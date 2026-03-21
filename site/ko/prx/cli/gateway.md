---
title: prx gateway
description: 채널이나 크론 없이 독립형 HTTP/WebSocket 게이트웨이 서버를 시작합니다.
---

# prx gateway

독립형 프로세스로 HTTP/WebSocket 게이트웨이 서버를 시작합니다. [`prx daemon`](./daemon)과 달리 이 명령은 게이트웨이만 시작하며, 채널, 크론 스케줄러, 진화 엔진은 시작하지 않습니다.

전체 데몬 없이 PRX API를 노출하려는 배포나, 채널과 스케줄링을 별도의 프로세스로 실행하는 경우에 유용합니다.

## 사용법

```bash
prx gateway [OPTIONS]
```

## 옵션

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--config` | `-c` | `~/.config/prx/config.toml` | 설정 파일 경로 |
| `--port` | `-p` | `3120` | 수신 포트 |
| `--host` | `-H` | `127.0.0.1` | 바인드 주소 |
| `--log-level` | `-l` | `info` | 로그 상세도: `trace`, `debug`, `info`, `warn`, `error` |
| `--cors-origin` | | `*` | 허용된 CORS 출처 (쉼표 구분) |
| `--tls-cert` | | | TLS 인증서 파일 경로 |
| `--tls-key` | | | TLS 개인 키 파일 경로 |

## 엔드포인트

게이트웨이는 다음 엔드포인트 그룹을 노출합니다:

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/health` | GET | 상태 점검 (`200 OK` 반환) |
| `/api/v1/chat` | POST | 채팅 메시지 전송 |
| `/api/v1/chat/stream` | POST | 채팅 메시지 전송 (스트리밍 SSE) |
| `/api/v1/sessions` | GET, POST | 세션 관리 |
| `/api/v1/sessions/:id` | GET, DELETE | 개별 세션 작업 |
| `/api/v1/tools` | GET | 사용 가능한 도구 목록 |
| `/api/v1/memory` | GET, POST | 메모리 작업 |
| `/ws` | WS | 실시간 통신을 위한 WebSocket 엔드포인트 |
| `/webhooks/:channel` | POST | 채널용 수신 웹훅 수신기 |

전체 API 문서는 [게이트웨이 HTTP API](/ko/prx/gateway/http-api)와 [게이트웨이 WebSocket](/ko/prx/gateway/websocket)을 참조하세요.

## 예시

```bash
# 기본 포트에서 시작
prx gateway

# 모든 인터페이스에서 포트 8080으로 바인드
prx gateway --host 0.0.0.0 --port 8080

# TLS 사용
prx gateway --tls-cert /etc/prx/cert.pem --tls-key /etc/prx/key.pem

# CORS 제한
prx gateway --cors-origin "https://app.example.com,https://admin.example.com"

# 디버그 로깅
prx gateway --log-level debug
```

## 리버스 프록시 뒤에서 운영

프로덕션에서는 TLS 종료와 로드 밸런싱을 위해 게이트웨이를 리버스 프록시(Nginx, Caddy 등) 뒤에 배치합니다:

```
# Caddy 예시
api.example.com {
    reverse_proxy localhost:3120
}
```

```nginx
# Nginx 예시
server {
    listen 443 ssl;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3120;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 시그널

| 시그널 | 동작 |
|--------|------|
| `SIGHUP` | 설정 다시 로드 |
| `SIGTERM` | 정상 종료 (진행 중인 요청 완료) |

## 관련 문서

- [prx daemon](./daemon) -- 전체 런타임 (게이트웨이 + 채널 + 크론 + 진화)
- [게이트웨이 개요](/ko/prx/gateway/) -- 게이트웨이 아키텍처
- [게이트웨이 HTTP API](/ko/prx/gateway/http-api) -- REST API 레퍼런스
- [게이트웨이 WebSocket](/ko/prx/gateway/websocket) -- WebSocket 프로토콜
