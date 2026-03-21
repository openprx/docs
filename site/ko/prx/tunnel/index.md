---
title: 터널 & NAT 트래버설
description: 외부 웹훅, 채널, 서비스에 로컬 에이전트 인스턴스를 노출하기 위한 PRX 터널링 시스템 개요입니다.
---

# 터널 & NAT 트래버설

PRX 에이전트는 종종 인바운드 연결을 수신해야 합니다 -- GitHub의 웹훅 콜백, Telegram 업데이트, Slack 이벤트 또는 노드 간 통신. NAT 또는 방화벽 뒤에서 실행할 때, 터널 서브시스템은 터널 프로바이더로의 아웃바운드 연결을 설정하고 공개 URL을 로컬 PRX 인스턴스에 매핑하여 자동 인그레스를 제공합니다.

## 터널링이 중요한 이유

많은 PRX 기능에는 공개적으로 접근 가능한 엔드포인트가 필요합니다:

- **웹훅 채널** -- Telegram, Discord, Slack, GitHub 모두 사용자가 제공한 URL로 이벤트를 푸시합니다. 공개 엔드포인트 없이는 이러한 채널이 에이전트에 메시지를 전달할 수 없습니다.
- **OAuth2 콜백** -- 프로바이더 인증 플로우가 브라우저를 로컬 URL로 리디렉션합니다. 터널은 PRX가 프라이빗 네트워크에서 실행되는 경우에도 이를 가능하게 합니다.
- **노드 간 통신** -- 분산 PRX 배포에서 노드가 서로에게 도달해야 합니다. 터널은 다른 네트워크에 있는 노드를 연결합니다.
- **MCP 서버 호스팅** -- PRX가 외부 클라이언트를 위한 MCP 서버로 동작할 때, 터널이 공개 엔드포인트를 제공합니다.

## 지원 백엔드

PRX는 4개의 터널 백엔드와 no-op 폴백을 내장하고 있습니다:

| 백엔드 | 프로바이더 | 무료 티어 | 커스텀 도메인 | 인증 필요 | 제로 트러스트 |
|--------|-----------|-----------|--------------|-----------|-------------|
| [Cloudflare Tunnel](./cloudflare) | Cloudflare | 예 | 예 (존 필요) | 예 (`cloudflared`) | 예 |
| [Tailscale Funnel](./tailscale) | Tailscale | 예 (개인) | MagicDNS 경유 | 예 (Tailscale 계정) | 예 |
| [ngrok](./ngrok) | ngrok | 예 (제한적) | 예 (유료) | 예 (인증 토큰) | 아니오 |
| 커스텀 명령 | 모든 | 다양 | 다양 | 다양 | 다양 |
| None | -- | -- | -- | -- | -- |

## 아키텍처

터널 서브시스템은 `Tunnel` 트레이트를 중심으로 구축됩니다:

```rust
#[async_trait]
pub trait Tunnel: Send + Sync {
    /// Start the tunnel and return the public URL.
    async fn start(&mut self) -> Result<String>;

    /// Stop the tunnel and clean up resources.
    async fn stop(&mut self) -> Result<()>;

    /// Check if the tunnel is healthy and the public URL is reachable.
    async fn health_check(&self) -> Result<bool>;
}
```

각 백엔드가 이 트레이트를 구현합니다. `TunnelProcess` 구조체는 기본 자식 프로세스(예: `cloudflared`, `tailscale`, `ngrok`)를 관리합니다 -- 스폰, stdout/stderr 캡처, 정상적인 종료, 실패 시 자동 재시작을 처리합니다.

```
┌─────────────────────────────────────────────┐
│                PRX 게이트웨이                  │
│            (localhost:8080)                   │
└──────────────────┬──────────────────────────┘
                   │ (로컬)
┌──────────────────▼──────────────────────────┐
│              TunnelProcess                   │
│  ┌──────────────────────────────────┐       │
│  │  cloudflared / tailscale / ngrok │       │
│  │  (자식 프로세스)                  │       │
│  └──────────────┬───────────────────┘       │
└─────────────────┼───────────────────────────┘
                  │ (아웃바운드 TLS)
┌─────────────────▼───────────────────────────┐
│         터널 프로바이더 에지 네트워크           │
│    https://your-agent.example.com            │
└──────────────────────────────────────────────┘
```

## 설정

`config.toml`에서 터널을 설정합니다:

```toml
[tunnel]
# 백엔드 선택: "cloudflare" | "tailscale" | "ngrok" | "custom" | "none"
backend = "cloudflare"

# 터널이 트래픽을 전달할 로컬 주소.
# 게이트웨이 리슨 주소와 일치해야 합니다.
local_addr = "127.0.0.1:8080"

# 상태 점검 간격(초). `max_failures`회 연속 상태 점검이
# 실패하면 터널이 재시작됩니다.
health_check_interval_secs = 30
max_failures = 3

# 자동 감지: backend = "auto"이면 PRX가 사용 가능한
# 터널 바이너리를 순서대로 탐색합니다: cloudflared, tailscale, ngrok.
# 아무것도 찾지 못하면 경고와 함께 "none"으로 폴백합니다.
```

### 백엔드별 설정

각 백엔드에는 자체 설정 섹션이 있습니다. 자세한 내용은 개별 백엔드 페이지를 참조하세요:

- [Cloudflare Tunnel](./cloudflare) -- `[tunnel.cloudflare]`
- [Tailscale Funnel](./tailscale) -- `[tunnel.tailscale]`
- [ngrok](./ngrok) -- `[tunnel.ngrok]`

### 커스텀 명령 백엔드

네이티브로 지원되지 않는 터널 프로바이더의 경우 `custom` 백엔드를 사용합니다:

```toml
[tunnel]
backend = "custom"

[tunnel.custom]
# 실행할 명령. local_addr에서 트래픽을 수신하고
# startup_timeout_secs 내에 공개 URL을 stdout에 출력해야 합니다.
command = "bore"
args = ["local", "8080", "--to", "bore.pub"]
startup_timeout_secs = 15

# 선택 사항: stdout에서 공개 URL을 추출하는 정규식.
# 첫 번째 캡처 그룹이 URL로 사용됩니다.
url_pattern = "listening at (https?://[\\S]+)"
```

## 자동 감지

`backend = "auto"`일 때, PRX는 `$PATH`에서 다음 순서로 터널 바이너리를 검색합니다:

1. `cloudflared` -- 제로 트러스트 기능으로 인해 선호됨
2. `tailscale` -- 프라이빗 메시 네트워킹으로 인해 선호됨
3. `ngrok` -- 널리 사용 가능하고 설정이 쉬움

아무것도 찾지 못하면 터널이 비활성화되고 PRX가 경고를 로그합니다. 터널이나 공개 IP 없이는 웹훅 의존 채널이 작동하지 않습니다.

## TunnelProcess 수명주기

`TunnelProcess` 구조체는 자식 프로세스 수명주기를 관리합니다:

| 단계 | 설명 |
|------|------|
| **스폰** | 설정된 인자로 터널 바이너리 시작 |
| **URL 추출** | stdout에서 공개 URL 파싱 (`startup_timeout_secs` 내) |
| **모니터링** | 공개 URL로의 HTTP GET을 통한 주기적 상태 점검 |
| **재시작** | `max_failures`회 연속 상태 점검 실패 시 중지 후 재시작 |
| **종료** | SIGTERM 전송, 5초 대기, 여전히 실행 중이면 SIGKILL |

## 환경 변수

터널 설정은 환경 변수로도 설정할 수 있으며, `config.toml`보다 우선합니다:

| 변수 | 설명 |
|------|------|
| `PRX_TUNNEL_BACKEND` | 터널 백엔드 재정의 |
| `PRX_TUNNEL_LOCAL_ADDR` | 로컬 포워딩 주소 재정의 |
| `PRX_TUNNEL_URL` | 터널 시작을 건너뛰고 이 URL 사용 |
| `CLOUDFLARE_TUNNEL_TOKEN` | Cloudflare Tunnel 토큰 |
| `NGROK_AUTHTOKEN` | ngrok 인증 토큰 |

`PRX_TUNNEL_URL` 설정은 이미 리버스 프록시나 로드 밸런서로 PRX를 공개적으로 노출한 경우에 유용합니다. 터널 서브시스템은 프로세스 관리를 건너뛰고 제공된 URL을 직접 사용합니다.

## 보안 고려사항

- **TLS 종료** -- 지원되는 모든 백엔드는 프로바이더 에지에서 TLS를 종료합니다. 프로바이더와 로컬 PRX 인스턴스 간의 트래픽은 암호화된 터널을 통해 전달됩니다.
- **접근 제어** -- Cloudflare와 Tailscale은 ID 기반 접근 정책을 지원합니다. 민감한 에이전트 엔드포인트를 노출할 때 이를 사용하세요.
- **자격 증명 저장** -- 터널 토큰과 인증 키는 PRX 시크릿 매니저에 저장됩니다. 버전 관리에 절대 커밋하지 마세요.
- **프로세스 격리** -- `TunnelProcess`는 별도의 자식 프로세스로 실행됩니다. PRX 에이전트 런타임과 메모리를 공유하지 않습니다.

## 문제 해결

| 증상 | 원인 | 해결 방법 |
|------|------|----------|
| 터널은 시작되지만 웹훅이 실패 | URL이 채널 설정에 전파되지 않음 | `tunnel.public_url`이 채널에서 사용되고 있는지 확인 |
| 터널이 반복적으로 재시작 | 상태 점검이 잘못된 엔드포인트에 접속 | `local_addr`가 게이트웨이 리슨 주소와 일치하는지 확인 |
| "binary not found" 오류 | 터널 CLI가 설치되지 않음 | 적절한 바이너리 설치 (`cloudflared`, `tailscale`, `ngrok`) |
| URL 추출 중 타임아웃 | 터널 바이너리 시작이 너무 오래 걸림 | `startup_timeout_secs` 증가 |

## 관련 페이지

- [Cloudflare Tunnel](./cloudflare)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [게이트웨이 설정](/ko/prx/gateway)
- [보안 개요](/ko/prx/security/)
