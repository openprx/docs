---
title: DNS 프록시
description: adblock 필터링, IOC 도메인 피드, 사용자 정의 차단 목록을 전체 쿼리 로깅이 포함된 단일 리졸버에 결합하는 로컬 DNS 프록시를 실행합니다.
---

# DNS 프록시

`sd dns-proxy` 명령어는 DNS 쿼리를 가로채고 업스트림 리졸버에 전달하기 전에 세 가지 엔진을 통해 필터링하는 로컬 DNS 프록시 서버를 시작합니다:

1. **Adblock 엔진** -- 필터 목록에서 광고, 트래커, 악성 도메인 차단
2. **IOC 도메인 피드** -- 위협 인텔리전스 침해 지표의 도메인 차단
3. **사용자 정의 DNS 차단 목록** -- 사용자 정의 목록의 도메인 차단

어떤 필터와 일치하는 쿼리는 `0.0.0.0` (NXDOMAIN)으로 응답됩니다. 다른 모든 쿼리는 설정된 업스트림 DNS 서버로 전달됩니다. 모든 쿼리와 해결 상태는 JSONL 파일에 로깅됩니다.

## 빠른 시작

```bash
# 기본값으로 DNS 프록시 시작 (127.0.0.1:53 수신, 업스트림 8.8.8.8:53)
sudo sd dns-proxy
```

::: tip
프록시는 기본적으로 포트 53에서 수신하며, 이는 루트 권한이 필요합니다. 비특권 테스트를 위해 `--listen 127.0.0.1:5353`과 같이 높은 포트를 사용하세요.
:::

## 명령어 옵션

```bash
sd dns-proxy [OPTIONS]
```

| 옵션 | 기본값 | 설명 |
|--------|---------|-------------|
| `--listen` | `127.0.0.1:53` | 수신할 주소와 포트 |
| `--upstream` | `8.8.8.8:53` | 차단되지 않은 쿼리를 전달할 업스트림 DNS 서버 |
| `--log-path` | `/tmp/prx-sd-dns.log` | JSONL 쿼리 로그 파일 경로 |

## 사용 예제

### 기본 사용법

기본 주소에서 Google DNS를 업스트림으로 프록시를 시작합니다:

```bash
sudo sd dns-proxy
```

출력:

```
>>> DNS 프록시 시작 중 (listen=127.0.0.1:53, upstream=8.8.8.8:53, log=/tmp/prx-sd-dns.log)
>>> 필터 엔진: adblock + dns_blocklist + ioc_domains
>>> 중지하려면 Ctrl+C를 누르세요.
```

### 사용자 정의 수신 주소와 업스트림

Cloudflare DNS를 업스트림으로 사용하고 사용자 정의 포트에서 수신:

```bash
sudo sd dns-proxy --listen 127.0.0.1:5353 --upstream 1.1.1.1:53
```

### 사용자 정의 로그 경로

쿼리 로그를 특정 위치에 작성합니다:

```bash
sudo sd dns-proxy --log-path /var/log/prx-sd/dns-queries.jsonl
```

### Adblock과 결합

DNS 프록시는 `~/.prx-sd/adblock/`에서 adblock 필터 목록을 자동으로 로드합니다. 최상의 커버리지를 위해:

```bash
# 1단계: adblock 목록 활성화 및 동기화
sudo sd adblock enable
sd adblock sync

# 2단계: DNS 프록시 시작 (adblock 규칙을 자동으로 가져옴)
sudo sd dns-proxy
```

프록시는 `sd adblock`에서 사용하는 동일한 캐시된 필터 목록을 읽습니다. `sd adblock add`를 통해 추가된 모든 목록은 프록시를 재시작한 후 자동으로 사용할 수 있습니다.

## 프록시를 사용하도록 시스템 설정

### Linux (systemd-resolved)

`/etc/systemd/resolved.conf`를 편집합니다:

```ini
[Resolve]
DNS=127.0.0.1
```

그런 다음 재시작합니다:

```bash
sudo systemctl restart systemd-resolved
```

### Linux (resolv.conf)

```bash
echo "nameserver 127.0.0.1" | sudo tee /etc/resolv.conf
```

### macOS

```bash
sudo networksetup -setdnsservers Wi-Fi 127.0.0.1
```

되돌리려면:

```bash
sudo networksetup -setdnsservers Wi-Fi empty
```

::: warning
모든 DNS 트래픽을 로컬 프록시로 리디렉션하면 프록시가 중지될 경우 원래 설정을 복원하거나 프록시를 재시작할 때까지 DNS 해결이 실패합니다.
:::

## 로그 형식

DNS 프록시는 설정된 로그 경로에 JSONL(줄당 하나의 JSON 객체)을 작성합니다. 각 항목에는 다음이 포함됩니다:

```json
{
  "timestamp": "2026-03-20T14:30:00.123Z",
  "query": "ads.example.com",
  "type": "A",
  "action": "blocked",
  "filter": "adblock",
  "upstream_ms": null
}
```

```json
{
  "timestamp": "2026-03-20T14:30:00.456Z",
  "query": "docs.example.com",
  "type": "A",
  "action": "forwarded",
  "filter": null,
  "upstream_ms": 12
}
```

| 필드 | 설명 |
|-------|-------------|
| `timestamp` | 쿼리의 ISO 8601 타임스탬프 |
| `query` | 조회된 도메인 이름 |
| `type` | DNS 레코드 유형 (A, AAAA, CNAME 등) |
| `action` | `blocked` 또는 `forwarded` |
| `filter` | 일치한 필터: `adblock`, `ioc`, `blocklist` 또는 `null` |
| `upstream_ms` | 업스트림 DNS로의 왕복 시간 (차단된 경우 null) |

## 아키텍처

```
클라이언트 DNS 쿼리 (포트 53)
        |
        v
  +------------------+
  |  sd dns-proxy     |
  |                  |
  |  1. Adblock      |---> 차단됨? --> 0.0.0.0으로 응답
  |  2. IOC 도메인   |---> 차단됨? --> 0.0.0.0으로 응답
  |  3. DNS 차단 목록 |---> 차단됨? --> 0.0.0.0으로 응답
  |                  |
  |  차단되지 않음:  |
  |  업스트림으로    |---> 업스트림 DNS (예: 8.8.8.8)
  |  전달           |<--- 응답
  |                  |
  |  JSONL에 로깅    |
  +------------------+
        |
        v
  클라이언트가 응답 받음
```

## 서비스로 실행

DNS 프록시를 영구 systemd 서비스로 실행하려면:

```bash
# systemd 유닛 파일 생성
sudo tee /etc/systemd/system/prx-sd-dns.service << 'EOF'
[Unit]
Description=PRX-SD DNS Proxy
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/sd dns-proxy --listen 127.0.0.1:53 --upstream 8.8.8.8:53 --log-path /var/log/prx-sd/dns-queries.jsonl
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 활성화 및 시작
sudo systemctl daemon-reload
sudo systemctl enable --now prx-sd-dns
```

::: tip
완전히 관리된 백그라운드 환경을 위해 실시간 파일 모니터링, 자동 시그니처 업데이트를 결합하고 DNS 프록시 기능을 포함하도록 확장할 수 있는 `sd daemon`을 사용하는 것을 고려하세요.
:::

## 다음 단계

- 포괄적인 도메인 차단을 위해 [Adblock 필터 목록](./adblock) 설정
- DNS 필터링과 함께 파일 시스템 보호를 위해 [실시간 모니터링](../realtime/) 설정
- 프록시 관련 설정은 [설정 레퍼런스](../configuration/reference) 검토
