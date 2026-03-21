---
title: ngrok 통합
description: 빠른 개발과 웹훅 테스트를 위해 ngrok을 사용하여 PRX 에이전트를 인터넷에 노출합니다.
---

# ngrok 통합

ngrok은 로컬 PRX 인스턴스로의 보안 인그레스를 생성하는 인기 있는 터널링 서비스입니다. 웹훅과 외부 통합을 시작하는 가장 빠른 방법입니다 -- 단일 명령으로 로컬 에이전트를 가리키는 공개 HTTPS URL을 얻을 수 있습니다.

## 개요

ngrok은 다음에 가장 적합합니다:

- **개발 및 테스트** -- 계정 설정 없이 몇 초 만에 공개 URL 획득
- **웹훅 프로토타이핑** -- Telegram, Discord, GitHub 또는 Slack 통합을 빠르게 테스트
- **데모 및 프레젠테이션** -- 에이전트를 보여주기 위한 임시 공개 URL 공유
- **Cloudflare나 Tailscale을 사용할 수 없는 환경**

프로덕션 배포에는 더 나은 안정성, 커스텀 도메인, 제로 트러스트 접근 제어를 제공하는 [Cloudflare Tunnel](./cloudflare) 또는 [Tailscale Funnel](./tailscale)을 고려하세요.

## 사전 요구사항

1. PRX가 실행되는 머신에 ngrok CLI 설치
2. 인증 토큰이 있는 ngrok 계정 (무료 티어로 충분)

### ngrok 설치

```bash
# Debian / Ubuntu (snap 경유)
sudo snap install ngrok

# macOS
brew install ngrok

# 바이너리 다운로드 (모든 플랫폼)
# https://ngrok.com/download

# 인증 (최초 1회 설정)
ngrok config add-authtoken <YOUR_AUTH_TOKEN>
```

[ngrok 대시보드](https://dashboard.ngrok.com/get-started/your-authtoken)에서 인증 토큰을 받을 수 있습니다.

## 설정

### 기본 설정

```toml
[tunnel]
backend = "ngrok"
local_addr = "127.0.0.1:8080"

[tunnel.ngrok]
# 인증 토큰. NGROK_AUTHTOKEN 환경 변수로도 설정 가능합니다.
# 생략하면 ngrok이 로컬 설정 파일의 토큰을 사용합니다.
authtoken = ""

# 터널 엔드포인트의 리전.
# 옵션: "us", "eu", "ap", "au", "sa", "jp", "in"
region = "us"
```

### 커스텀 도메인 (유료 플랜)

ngrok 유료 플랜은 영구 커스텀 도메인을 지원합니다:

```toml
[tunnel]
backend = "ngrok"
local_addr = "127.0.0.1:8080"

[tunnel.ngrok]
authtoken = "${NGROK_AUTHTOKEN}"

# 커스텀 도메인 (ngrok 유료 플랜 필요)
domain = "agent.example.com"

# 또는 고정 ngrok 서브도메인 사용 (일부 플랜에서 무료)
# subdomain = "my-prx-agent"
```

### 예약 도메인

무료 티어에서 안정적인 URL을 위해 ngrok은 예약 도메인을 제공합니다:

```toml
[tunnel.ngrok]
authtoken = "${NGROK_AUTHTOKEN}"

# ngrok이 할당한 예약 도메인 (예: "example-agent.ngrok-free.app")
domain = "example-agent.ngrok-free.app"
```

## 설정 참조

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `authtoken` | string | -- | ngrok 인증 토큰 |
| `region` | string | `"us"` | 터널 리전: `"us"`, `"eu"`, `"ap"`, `"au"`, `"sa"`, `"jp"`, `"in"` |
| `domain` | string | -- | 커스텀 도메인 또는 예약 도메인 (유료 기능) |
| `subdomain` | string | -- | `ngrok-free.app`의 고정 서브도메인 |
| `ngrok_path` | string | `"ngrok"` | `ngrok` 바이너리 경로 |
| `inspect` | boolean | `true` | ngrok 검사 대시보드 활성화 (localhost:4040) |
| `log_level` | string | `"info"` | ngrok 로그 수준: `"debug"`, `"info"`, `"warn"`, `"error"` |
| `metadata` | string | -- | 터널 세션에 첨부되는 임의 메타데이터 문자열 |
| `basic_auth` | string | -- | `user:password` 형식의 HTTP Basic Auth |
| `ip_restrictions` | list | `[]` | 허용된 CIDR 범위 목록 (예: `["203.0.113.0/24"]`) |
| `circuit_breaker` | float | -- | 서킷 브레이커를 트리거하는 오류율 임계값 (0.0-1.0) |
| `compression` | boolean | `false` | 응답 압축 활성화 |

## PRX의 ngrok 관리 방식

터널이 시작되면 PRX가 ngrok을 자식 프로세스로 스폰합니다:

```bash
ngrok http 127.0.0.1:8080 \
  --authtoken=<token> \
  --region=us \
  --log=stdout \
  --log-format=json
```

PRX는 ngrok 로컬 API(`http://127.0.0.1:4040/api/tunnels`)를 쿼리하여 할당된 공개 URL을 검색합니다. 이 URL은 저장되어 웹훅 등록과 채널 설정에 사용됩니다.

### URL 추출

ngrok은 포트 4040에서 로컬 API를 노출합니다. PRX는 타임아웃과 함께 이 엔드포인트를 폴링합니다:

```
GET http://localhost:4040/api/tunnels
```

응답에 공개 URL이 포함됩니다:

```json
{
  "tunnels": [
    {
      "public_url": "https://abc123.ngrok-free.app",
      "config": {
        "addr": "http://localhost:8080"
      }
    }
  ]
}
```

`startup_timeout_secs` 내에 API를 사용할 수 없으면 PRX가 stdout에서 URL을 파싱하는 것으로 폴백합니다.

## 무료 티어 제한

ngrok 무료 티어에는 알아야 할 여러 제한이 있습니다:

| 제한 | 무료 티어 | PRX에 미치는 영향 |
|------|-----------|-------------------|
| 동시 터널 | 1 | ngrok 계정당 하나의 PRX 인스턴스만 |
| 분당 연결 | 40 | 트래픽이 많은 웹훅이 스로틀될 수 있음 |
| 커스텀 도메인 | 사용 불가 | 재시작할 때마다 URL 변경 |
| IP 제한 | 사용 불가 | 소스 IP를 제한할 수 없음 |
| 대역폭 | 제한적 | 대용량 파일 전송이 스로틀될 수 있음 |
| 중간 페이지 | 첫 방문 시 표시 | 일부 웹훅 프로바이더에 간섭할 수 있음 |

중간 페이지(ngrok의 브라우저 경고 페이지)는 API/웹훅 트래픽에는 영향을 미치지 않습니다 -- 브라우저가 시작한 요청에만 나타납니다. 그러나 일부 웹훅 프로바이더가 이를 포함하는 응답을 거부할 수 있습니다. 프로덕션에는 유료 플랜이나 다른 백엔드를 사용하세요.

## ngrok 검사 대시보드

`inspect = true`(기본값)이면 ngrok이 `http://localhost:4040`에서 로컬 웹 대시보드를 실행합니다. 이 대시보드는 다음을 제공합니다:

- **요청 검사기** -- 헤더, 본문, 응답과 함께 모든 수신 요청 보기
- **리플레이** -- 디버깅을 위해 모든 요청을 재실행
- **터널 상태** -- 연결 상태, 리전, 공개 URL

이는 개발 중 웹훅 통합을 디버깅할 때 매우 유용합니다.

## 보안 고려사항

- **인증 토큰 보호** -- ngrok 인증 토큰은 계정에 대한 터널 생성 접근 권한을 부여합니다. PRX 시크릿 매니저에 저장하거나 `NGROK_AUTHTOKEN` 환경 변수로 전달하세요.
- **무료 티어 URL은 공개** -- URL이 있는 모든 사람이 에이전트에 접근할 수 있습니다. `basic_auth` 또는 `ip_restrictions`(유료)를 사용하여 접근을 제한하세요.
- **URL 교체** -- 무료 티어 URL은 재시작 시 변경됩니다. 웹훅 프로바이더가 이전 URL을 캐시하면 이벤트 전달에 실패합니다. 안정적인 URL을 위해 예약 도메인이나 다른 백엔드를 사용하세요.
- **TLS 종료** -- ngrok이 에지에서 TLS를 종료합니다. ngrok과 로컬 PRX 간의 트래픽은 ngrok의 인프라를 통해 전달됩니다.
- **데이터 검사** -- ngrok의 검사 대시보드는 요청/응답 본문을 표시합니다. 민감한 데이터가 전송되는 프로덕션에서는 `inspect = false`로 비활성화하세요.

## 웹훅 통합 패턴

개발을 위한 일반적인 패턴: ngrok으로 PRX를 시작하고, 웹훅 URL을 등록하고, 테스트합니다:

```bash
# 1. PRX 시작 (터널이 자동으로 시작)
prx start

# 2. PRX가 공개 URL을 로그
# [INFO] Tunnel started: https://abc123.ngrok-free.app

# 3. 서비스에 웹훅 URL 등록
# Telegram: https://abc123.ngrok-free.app/webhook/telegram
# GitHub:   https://abc123.ngrok-free.app/webhook/github

# 4. http://localhost:4040에서 요청 검사
```

## 다른 백엔드와의 비교

| 기능 | ngrok | Cloudflare Tunnel | Tailscale Funnel |
|------|-------|-------------------|------------------|
| 설정 시간 | 초 | 분 | 분 |
| 커스텀 도메인 | 유료 | 무료 (존 필요) | MagicDNS만 |
| 제로 트러스트 | 아니오 | 예 (Access) | 예 (ACL) |
| 무료 티어 | 예 (제한적) | 예 | 예 (개인) |
| 검사 대시보드 | 예 | 아니오 | 아니오 |
| 프로덕션 준비 | 유료 플랜 | 예 | 예 |

## 문제 해결

| 증상 | 원인 | 해결 방법 |
|------|------|----------|
| "authentication failed" | 유효하지 않거나 누락된 인증 토큰 | `ngrok config add-authtoken <token>` 실행 |
| URL이 감지되지 않음 | ngrok API가 :4040에서 응답하지 않음 | 포트 4040이 다른 프로세스에 의해 사용되고 있지 않은지 확인 |
| "tunnel session limit" | 무료 티어는 1개 터널 허용 | 다른 ngrok 세션 중지 또는 업그레이드 |
| 웹훅이 502 반환 | PRX 게이트웨이가 리스닝하지 않음 | `local_addr`가 게이트웨이와 일치하는지 확인 |
| 중간 페이지 표시 | 무료 티어 브라우저 경고 | `--domain` 사용 또는 유료 플랜으로 업그레이드 |
| 무작위 연결 끊김 | 무료 티어 연결 제한 | 업그레이드 또는 Cloudflare/Tailscale로 전환 |

## 관련 페이지

- [터널 개요](./)
- [Cloudflare Tunnel](./cloudflare)
- [Tailscale Funnel](./tailscale)
- [보안 개요](/ko/prx/security/)
