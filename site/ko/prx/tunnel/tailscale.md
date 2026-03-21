---
title: Tailscale Funnel
description: Tailscale 메시 네트워크를 통해 Tailscale Funnel을 사용하여 PRX 에이전트를 인터넷에 노출합니다.
---

# Tailscale Funnel

Tailscale Funnel을 사용하면 Tailscale의 릴레이 인프라를 통해 로컬 PRX 인스턴스를 공개 인터넷에 노출할 수 있습니다. 서드파티 에지 네트워크가 필요한 기존 터널과 달리, Funnel은 기존 Tailscale 메시를 활용합니다 -- PRX 노드가 이미 Tailscale을 통해 통신하는 경우 탁월한 선택입니다.

## 개요

Tailscale은 PRX 연결을 위한 두 가지 보완적인 기능을 제공합니다:

| 기능 | 범위 | 사용 사례 |
|------|------|----------|
| **Tailscale Serve** | 프라이빗 (테일넷 전용) | Tailscale 네트워크의 다른 디바이스에 PRX 노출 |
| **Tailscale Funnel** | 공개 (인터넷) | 외부 웹훅과 서비스에 PRX 노출 |

PRX는 웹훅 인그레스에 Funnel을, 테일넷 내 노드 간 통신에 Serve를 사용합니다.

### Funnel 작동 방식

```
외부 서비스 (GitHub, Telegram 등)
         │
         ▼ HTTPS
┌─────────────────────┐
│  Tailscale DERP 릴레이│
│  (Tailscale 인프라)   │
└────────┬────────────┘
         │ WireGuard
┌────────▼────────────┐
│  tailscaled          │
│  (사용자 머신)        │
└────────┬────────────┘
         │ localhost
┌────────▼────────────┐
│  PRX 게이트웨이       │
│  (127.0.0.1:8080)   │
└─────────────────────┘
```

트래픽은 Tailscale MagicDNS 호스트명(예: `prx-host.tailnet-name.ts.net`)으로 도착하고, WireGuard를 통해 Tailscale의 DERP 릴레이 네트워크로 라우팅된 후, 로컬 PRX 게이트웨이로 전달됩니다.

## 사전 요구사항

1. PRX가 실행되는 머신에 Tailscale 설치 및 인증
2. 테일넷에 대해 Tailscale Funnel 활성화 (관리자 승인 필요)
3. 머신의 Tailscale 노드가 ACL 정책에서 Funnel 기능을 보유해야 함

### Tailscale 설치

```bash
# Debian / Ubuntu
curl -fsSL https://tailscale.com/install.sh | sh

# macOS
brew install tailscale

# 인증
sudo tailscale up
```

### ACL 정책에서 Funnel 활성화

Funnel은 테일넷의 ACL 정책에서 명시적으로 허용되어야 합니다. Tailscale ACL 파일(관리 콘솔 경유)에 다음을 추가합니다:

```json
{
  "nodeAttrs": [
    {
      "target": ["autogroup:member"],
      "attr": ["funnel"]
    }
  ]
}
```

이렇게 하면 모든 멤버에게 Funnel 기능이 부여됩니다. 더 엄격하게 제어하려면 `autogroup:member`를 특정 사용자나 태그로 교체합니다:

```json
{
  "target": ["tag:prx-agent"],
  "attr": ["funnel"]
}
```

## 설정

### 기본 Funnel 설정

```toml
[tunnel]
backend = "tailscale"
local_addr = "127.0.0.1:8080"

[tunnel.tailscale]
# Funnel은 서비스를 공개 인터넷에 노출합니다.
# false로 설정하면 Serve를 사용합니다 (테일넷 전용 접근).
funnel = true

# Funnel을 통해 노출할 포트. Tailscale Funnel은
# 포트 443, 8443, 10000을 지원합니다.
port = 443

# HTTPS는 Funnel에 필수입니다. Tailscale이
# Let's Encrypt를 통해 자동으로 인증서를 프로비저닝합니다.
```

### 테일넷 전용 (Serve) 설정

공개 노출 없이 프라이빗 노드 간 통신을 위해:

```toml
[tunnel]
backend = "tailscale"
local_addr = "127.0.0.1:8080"

[tunnel.tailscale]
funnel = false
port = 443
```

## 설정 참조

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `funnel` | boolean | `true` | `true`: 공개 Funnel, `false`: 테일넷 전용 Serve |
| `port` | integer | `443` | 공개 포트 (Funnel은 443, 8443, 10000 지원) |
| `tailscale_path` | string | `"tailscale"` | `tailscale` CLI 바이너리 경로 |
| `hostname` | string | 자동 감지 | MagicDNS 호스트명 재정의 |
| `reset_on_stop` | boolean | `true` | PRX 중지 시 Funnel/Serve 설정 제거 |
| `background` | boolean | `true` | `tailscale serve`를 백그라운드 모드로 실행 |

## PRX의 Tailscale 관리 방식

터널이 시작되면 PRX가 다음을 실행합니다:

```bash
# Funnel (공개)
tailscale funnel --bg --https=443 http://127.0.0.1:8080

# Serve (프라이빗)
tailscale serve --bg --https=443 http://127.0.0.1:8080
```

`--bg` 플래그는 `tailscaled` 데몬 내에서 serve/funnel을 백그라운드로 실행합니다. PRX는 자식 프로세스를 유지할 필요가 없습니다 -- `tailscaled`가 포워딩을 처리합니다.

PRX가 중지되면 다음을 실행하여 정리합니다:

```bash
tailscale funnel --https=443 off
# 또는
tailscale serve --https=443 off
```

이 동작은 `reset_on_stop` 파라미터로 제어됩니다.

## 공개 URL

Funnel의 공개 URL은 MagicDNS 패턴을 따릅니다:

```
https://<machine-name>.<tailnet-name>.ts.net
```

예를 들어, 머신 이름이 `prx-host`이고 테일넷이 `example`이면 URL은 다음과 같습니다:

```
https://prx-host.example.ts.net
```

PRX는 `tailscale status --json` 출력을 파싱하여 이 호스트명을 자동으로 감지하고 전체 공개 URL을 구성합니다.

## 상태 점검

PRX는 두 가지 점검으로 Tailscale 터널을 모니터링합니다:

1. **Tailscale 데몬 상태** -- `tailscale status --json`이 노드를 연결됨으로 보고해야 함
2. **Funnel 접근성** -- 공개 URL에 대한 HTTP GET이 2xx 응답을 반환해야 함

상태 점검이 실패하면 PRX가 `tailscale funnel` 명령을 다시 실행하여 Funnel을 재설정하려 시도합니다. `tailscaled` 자체가 다운된 경우 PRX가 오류를 로그하고 데몬이 복구될 때까지 터널을 비활성화합니다.

## ACL 고려사항

Tailscale ACL은 어떤 디바이스가 통신할 수 있고 어떤 디바이스가 Funnel을 사용할 수 있는지 제어합니다. PRX 배포를 위한 주요 고려사항:

### PRX 노드로 Funnel 제한

PRX 머신에 태그를 지정하고 Funnel 접근을 제한합니다:

```json
{
  "tagOwners": {
    "tag:prx-agent": ["autogroup:admin"]
  },
  "nodeAttrs": [
    {
      "target": ["tag:prx-agent"],
      "attr": ["funnel"]
    }
  ]
}
```

### 노드 간 트래픽 허용

분산 PRX 배포에서 PRX 노드 간 트래픽을 허용합니다:

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:prx-agent"],
      "dst": ["tag:prx-agent:443"]
    }
  ]
}
```

## 문제 해결

| 증상 | 원인 | 해결 방법 |
|------|------|----------|
| "Funnel not available" | ACL 정책에 funnel 속성 누락 | ACL에서 노드 또는 사용자에 `funnel` 속성 추가 |
| "not connected" 상태 | `tailscaled`가 실행되지 않음 | Tailscale 데몬 시작: `sudo tailscale up` |
| 인증서 오류 | DNS가 전파되지 않음 | MagicDNS 전파 대기 (보통 1분 이내) |
| 포트가 이미 사용 중 | 같은 포트에 다른 Serve/Funnel 존재 | 기존 것 제거: `tailscale funnel --https=443 off` |
| 502 Bad Gateway | PRX 게이트웨이가 리스닝하지 않음 | `local_addr`가 게이트웨이의 리슨 주소와 일치하는지 확인 |

## 관련 페이지

- [터널 개요](./)
- [Cloudflare Tunnel](./cloudflare)
- [ngrok](./ngrok)
- [노드 페어링](/ko/prx/nodes/pairing)
- [보안 개요](/ko/prx/security/)
