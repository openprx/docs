---
title: CrowdSec 통합
description: "Bouncer 모드, AppSec 모드, 로그 푸셔를 포함한 PRX-WAF CrowdSec 위협 인텔리전스 통합 가이드."
---

# CrowdSec 통합

PRX-WAF는 [CrowdSec](https://www.crowdsec.net/)과 통합하여 커뮤니티 기반 위협 인텔리전스를 활용합니다. 세 가지 통합 모드를 지원합니다.

## 통합 모드

### 1. Bouncer 모드 (권장)

PRX-WAF가 CrowdSec LAPI에서 결정을 가져와 IP를 차단하거나 캡차를 적용합니다:

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key  = "your-bouncer-api-key"
update_interval_secs = 60
fallback_action = "log"    # LAPI 접근 불가 시: log | block | allow
```

결정 유형:
- `ban` → 요청을 403으로 차단
- `captcha` → JavaScript 챌린지 제공
- `throttle` → 속도 제한 적용

### 2. AppSec 모드

각 요청을 실시간으로 CrowdSec AppSec 컴포넌트로 전달합니다:

```toml
[crowdsec]
enabled = true
mode = "appsec"
lapi_url = "http://127.0.0.1:8080"
api_key  = "your-appsec-api-key"
appsec_url = "http://127.0.0.1:7422"
```

AppSec 모드에서 PRX-WAF는 각 요청에 대해 CrowdSec에 쿼리하여 실시간으로 차단 결정을 받습니다.

### 3. 로그 푸셔 모드

PRX-WAF 보안 이벤트를 CrowdSec LAPI로 전송합니다:

```toml
[crowdsec]
enabled = true
mode = "log_pusher"
lapi_url = "http://127.0.0.1:8080"
api_key  = "your-pusher-api-key"
push_interval_secs = 30
```

## 설정

### CrowdSec 설치

```bash
# Debian/Ubuntu
curl -s https://packagecloud.io/install/repositories/crowdsec/crowdsec/script.deb.sh | sudo bash
sudo apt install crowdsec
```

### Bouncer 키 생성

```bash
sudo cscli bouncers add prx-waf
# API 키 저장 (한 번만 표시됨)
```

### CrowdSec 연결 테스트

```bash
prx-waf crowdsec test
```

성공 응답:

```
CrowdSec LAPI 연결 상태: OK
활성 결정: 1,247
마지막 업데이트: 2분 전
```

## CLI 명령어

| 명령어 | 설명 |
|--------|------|
| `prx-waf crowdsec status` | 통합 상태 표시 |
| `prx-waf crowdsec decisions` | LAPI의 활성 결정 나열 |
| `prx-waf crowdsec test` | LAPI 연결 테스트 |
| `prx-waf crowdsec setup` | 인터랙티브 설정 마법사 실행 |

### 예제

```bash
# 상태 확인
prx-waf crowdsec status

# 활성 차단/캡차 결정 나열
prx-waf crowdsec decisions

# LAPI 연결 테스트
prx-waf crowdsec test

# 설정 마법사 실행
prx-waf crowdsec setup
```

## REST API 통합

관리자 API를 통해 CrowdSec 상태 접근:

```bash
# 연결 상태
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9527/api/crowdsec/status

# 응답:
{
  "connected": true,
  "mode": "bouncer",
  "decisions_count": 1247,
  "last_update": "2026-03-20T14:30:00Z"
}

# 활성 결정 나열
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9527/api/crowdsec/decisions

# 연결 테스트
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:9527/api/crowdsec/test
```

## 고급 설정

### 결정 캐싱

로컬에서 결정을 캐시하여 LAPI 쿼리 빈도를 줄입니다:

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key  = "your-api-key"
cache_decisions = true
cache_ttl_secs = 300    # 5분
update_interval_secs = 60
```

### 폴백 동작

LAPI에 접근할 수 없을 때 동작 설정:

```toml
[crowdsec]
fallback_action = "log"    # log (권장) | block | allow
```

## 다음 단계

- [관리자 UI](../admin-ui/) — 대시보드에서 CrowdSec 상태 모니터링
- [문제 해결](../troubleshooting/) — CrowdSec 연결 문제 해결
- [설정 레퍼런스](../configuration/reference) — CrowdSec 설정 옵션
