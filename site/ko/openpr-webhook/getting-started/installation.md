---
title: 설치
description: "Rust 툴체인으로 소스에서 OpenPR-Webhook 빌드. 의존성, 설정 파일, 실행, 로깅, systemd 서비스 설정."
---

# 설치

## 사전 요구사항

- Rust 툴체인 (edition 2024 이상)
- 웹훅 이벤트를 전송할 수 있는 실행 중인 OpenPR 인스턴스

## 소스에서 빌드

저장소를 복제하고 릴리스 모드로 빌드합니다:

```bash
git clone https://github.com/openprx/openpr-webhook.git
cd openpr-webhook
cargo build --release
```

바이너리는 `target/release/openpr-webhook`에 생성됩니다.

## 의존성

OpenPR-Webhook은 다음 핵심 라이브러리를 기반으로 합니다:

| 크레이트 | 목적 |
|---------|------|
| `axum` 0.8 | HTTP 서버 프레임워크 |
| `tokio` 1 | 비동기 런타임 |
| `reqwest` 0.12 | 웹훅 전달 및 콜백을 위한 HTTP 클라이언트 |
| `hmac` + `sha2` | HMAC-SHA256 서명 검증 |
| `toml` 0.8 | 설정 파싱 |
| `tokio-tungstenite` 0.28 | 터널 모드를 위한 WebSocket 클라이언트 |
| `tracing` | 구조화된 로깅 |

## 설정 파일

`config.toml` 파일을 생성합니다. 서비스는 시작 시 이 파일을 로드합니다. 전체 스키마는 [설정 레퍼런스](../configuration/index.md)를 참조하세요.

최소 예제:

```toml
[server]
listen = "0.0.0.0:9000"

[security]
webhook_secrets = ["your-hmac-secret"]

[[agents]]
id = "notify"
name = "Notification Bot"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/..."
```

## 실행

```bash
# 기본: 현재 디렉토리에서 config.toml 로드
./target/release/openpr-webhook

# 커스텀 설정 경로 지정
./target/release/openpr-webhook /etc/openpr-webhook/config.toml
```

## 로깅

로깅은 `RUST_LOG` 환경 변수로 제어됩니다. 기본 레벨은 `openpr_webhook=info`입니다.

```bash
# 디버그 로깅
RUST_LOG=openpr_webhook=debug ./target/release/openpr-webhook

# 트레이스 레벨 로깅 (매우 자세함)
RUST_LOG=openpr_webhook=trace ./target/release/openpr-webhook
```

## 헬스 체크

서비스는 서버 실행 중 `ok`를 반환하는 `GET /health` 엔드포인트를 노출합니다:

```bash
curl http://localhost:9000/health
# ok
```

## Systemd 서비스 (선택적)

Linux 프로덕션 배포의 경우:

```ini
[Unit]
Description=OpenPR Webhook Dispatcher
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/openpr-webhook /etc/openpr-webhook/config.toml
Restart=always
RestartSec=5
Environment=RUST_LOG=openpr_webhook=info

[Install]
WantedBy=multi-user.target
```

## 다음 단계

- [빠른 시작](quickstart.md) -- 첫 번째 에이전트 설정 및 엔드투엔드 테스트
- [설정 레퍼런스](../configuration/index.md) -- 전체 TOML 스키마 문서
