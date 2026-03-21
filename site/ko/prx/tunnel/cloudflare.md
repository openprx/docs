---
title: Cloudflare Tunnel
description: cloudflared를 사용한 제로 트러스트 인그레스를 위해 PRX를 Cloudflare Tunnel과 통합합니다.
---

# Cloudflare Tunnel

Cloudflare Tunnel(이전 Argo Tunnel)은 PRX 인스턴스에서 Cloudflare의 에지 네트워크로의 암호화된 아웃바운드 전용 연결을 생성합니다. 공개 IP, 방화벽 포트 개방 또는 포트 포워딩이 필요하지 않습니다. Cloudflare가 TLS를 종료하고 터널을 통해 트래픽을 로컬 에이전트로 라우팅합니다.

## 개요

Cloudflare Tunnel은 프로덕션 PRX 배포에 권장되는 백엔드입니다. 다음을 제공합니다:

- **제로 트러스트 접근** -- Cloudflare Access와 통합하여 에이전트에 도달하기 전에 ID 인증을 요구
- **커스텀 도메인** -- 자동 HTTPS 인증서와 함께 자체 도메인 사용
- **DDoS 보호** -- 트래픽이 Cloudflare 네트워크를 통과하여 원본을 보호
- **높은 안정성** -- Cloudflare가 이중화를 위해 여러 에지 연결을 유지
- **무료 티어** -- Cloudflare Tunnel은 무료 플랜에서 사용 가능

## 사전 요구사항

1. Cloudflare 계정 (무료 티어로 충분)
2. PRX가 실행되는 머신에 `cloudflared` CLI 설치
3. Cloudflare 계정에 추가된 도메인 (명명된 터널용)

### cloudflared 설치

```bash
# Debian / Ubuntu
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-main.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] \
  https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared

# macOS
brew install cloudflared

# 바이너리 다운로드 (모든 플랫폼)
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

## 설정

### 퀵 터널 (도메인 불필요)

가장 간단한 설정은 Cloudflare의 퀵 터널을 사용하며, 무작위 `*.trycloudflare.com` 서브도메인이 할당됩니다. `cloudflared` 설치 외에 Cloudflare 계정 설정이 필요하지 않습니다:

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"

[tunnel.cloudflare]
# 퀵 터널 모드: 토큰 없음, 명명된 터널 없음.
# 시작할 때마다 무작위 trycloudflare.com URL이 할당됩니다.
mode = "quick"
```

퀵 터널은 개발과 테스트에 이상적입니다. 재시작할 때마다 URL이 변경되므로 웹훅 등록을 그에 맞게 업데이트해야 합니다.

### 명명된 터널 (영구 도메인)

프로덕션에서는 안정적인 호스트명으로 명명된 터널을 사용합니다:

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"

[tunnel.cloudflare]
mode = "named"

# `cloudflared tunnel create`에서 얻은 터널 토큰.
# CLOUDFLARE_TUNNEL_TOKEN 환경 변수로도 설정 가능합니다.
token = "eyJhIjoiNjY..."

# 이 터널로 라우팅되는 공개 호스트명.
# Cloudflare 대시보드 또는 cloudflared CLI에서 설정해야 합니다.
hostname = "agent.example.com"
```

### 명명된 터널 생성

```bash
# 1. Cloudflare 계정으로 cloudflared 인증
cloudflared tunnel login

# 2. 명명된 터널 생성
cloudflared tunnel create prx-agent
# 출력: Created tunnel prx-agent with id <TUNNEL_ID>

# 3. 터널을 가리키는 DNS 레코드 생성
cloudflared tunnel route dns prx-agent agent.example.com

# 4. 터널 토큰 가져오기 (config.toml용)
cloudflared tunnel token prx-agent
# 출력: eyJhIjoiNjY...
```

## 설정 참조

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `mode` | string | `"quick"` | `"quick"`: 무작위 URL, `"named"`: 영구 호스트명 |
| `token` | string | -- | 명명된 터널 토큰 (`mode = "named"`에 필수) |
| `hostname` | string | -- | 명명된 터널의 공개 호스트명 |
| `cloudflared_path` | string | `"cloudflared"` | `cloudflared` 바이너리 경로 |
| `protocol` | string | `"auto"` | 전송 프로토콜: `"auto"`, `"quic"`, `"http2"` |
| `edge_ip_version` | string | `"auto"` | 에지 연결 IP 버전: `"auto"`, `"4"`, `"6"` |
| `retries` | integer | `5` | 포기 전 연결 재시도 횟수 |
| `grace_period_secs` | integer | `30` | 활성 연결 종료 전 대기 시간(초) |
| `metrics_port` | integer | -- | 설정 시 이 포트에서 `cloudflared` 메트릭 노출 |
| `log_level` | string | `"info"` | `cloudflared` 로그 수준: `"debug"`, `"info"`, `"warn"`, `"error"` |

## 제로 트러스트 접근

Cloudflare Access는 터널 앞에 ID 레이어를 추가합니다. 사용자는 PRX 인스턴스에 도달하기 전에 인증(SSO, 이메일 OTP 또는 서비스 토큰을 통해)해야 합니다.

### 접근 정책 설정

1. Cloudflare Zero Trust 대시보드로 이동
2. 터널 호스트명에 대한 Access 애플리케이션 생성
3. 원하는 ID 요구사항으로 Access 정책 추가

```
Cloudflare Access 정책 예시:
  애플리케이션: agent.example.com
  규칙: 허용
  포함:
    - 이메일 끝: @yourcompany.com
    - 서비스 토큰: prx-webhook-token
```

서비스 토큰은 대화형 인증을 수행할 수 없는 자동화된 웹훅 발신자(GitHub, Slack)에 유용합니다. 웹훅 프로바이더의 헤더에 토큰을 설정합니다:

```
CF-Access-Client-Id: <client-id>
CF-Access-Client-Secret: <client-secret>
```

## 상태 점검

PRX는 다음을 통해 Cloudflare Tunnel 상태를 모니터링합니다:

1. `cloudflared` 자식 프로세스가 실행 중인지 확인
2. 공개 URL에 HTTP GET을 보내고 2xx 응답을 확인
3. `cloudflared` 메트릭 파싱 (`metrics_port`가 설정된 경우) 연결 상태 확인

터널이 비정상이 되면 PRX가 경고를 로그하고 `cloudflared` 재시작을 시도합니다. 재시작은 지수 백오프 전략을 따릅니다: 5초, 10초, 20초, 40초, 최대 시도 간 5분.

## 로그 및 디버깅

`cloudflared` stdout과 stderr은 `TunnelProcess`에 의해 캡처되고 `DEBUG` 수준으로 PRX 로그에 기록됩니다. 상세도를 높이려면:

```toml
[tunnel.cloudflare]
log_level = "debug"
```

일반적인 로그 메시지와 의미:

| 로그 메시지 | 의미 |
|-------------|------|
| `Connection registered` | Cloudflare 에지에 터널 설정됨 |
| `Retrying connection` | 에지 연결이 끊어져 재연결 시도 중 |
| `Serve tunnel error` | 치명적 오류, 터널이 재시작됨 |
| `Registered DNS record` | DNS 라우트가 성공적으로 생성됨 |

## 예시: 전체 프로덕션 설정

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"
health_check_interval_secs = 30
max_failures = 3

[tunnel.cloudflare]
mode = "named"
token = "${CLOUDFLARE_TUNNEL_TOKEN}"
hostname = "agent.mycompany.com"
protocol = "quic"
retries = 5
grace_period_secs = 30
log_level = "info"
```

```bash
# 환경 변수로 토큰 설정
export CLOUDFLARE_TUNNEL_TOKEN="eyJhIjoiNjY..."

# PRX 시작 -- 터널이 자동으로 시작됨
prx start
```

## 보안 참고

- 터널 토큰은 명명된 터널에 대한 전체 접근 권한을 부여합니다. PRX 시크릿 매니저에 저장하거나 환경 변수로 전달하세요. 버전 관리에 절대 커밋하지 마세요.
- 퀵 터널은 Access 정책을 지원하지 않습니다. 프로덕션에는 명명된 터널을 사용하세요.
- `cloudflared`는 PRX와 동일한 사용자 권한의 자식 프로세스로 실행됩니다. 최소 권한의 전용 서비스 계정으로 PRX를 실행하는 것을 고려하세요.
- `cloudflared`와 Cloudflare 에지 간의 모든 트래픽은 TLS 1.3 또는 QUIC으로 암호화됩니다.

## 관련 페이지

- [터널 개요](./)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [보안 개요](/ko/prx/security/)
- [시크릿 관리](/ko/prx/security/secrets)
