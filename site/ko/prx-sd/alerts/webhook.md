---
title: 웹훅 알림
description: PRX-SD에서 위협 탐지, 격리 이벤트 및 스캔 결과에 대한 웹훅 알림을 설정합니다.
---

# 웹훅 알림

PRX-SD는 위협이 탐지되거나, 파일이 격리되거나, 스캔이 완료될 때 웹훅 엔드포인트에 실시간 알림을 보낼 수 있습니다. 웹훅은 Slack, Discord, Microsoft Teams, PagerDuty 또는 사용자 정의 HTTP 엔드포인트와 통합됩니다.

## 사용법

```bash
sd webhook <SUBCOMMAND> [OPTIONS]
```

### 서브 커맨드

| 서브 커맨드 | 설명 |
|------------|-------------|
| `add` | 새 웹훅 엔드포인트 등록 |
| `remove` | 등록된 웹훅 제거 |
| `list` | 등록된 모든 웹훅 나열 |
| `test` | 웹훅에 테스트 알림 전송 |

## 웹훅 추가

```bash
sd webhook add [OPTIONS] <URL>
```

| 플래그 | 축약 | 기본값 | 설명 |
|------|-------|---------|-------------|
| `--format` | `-f` | `generic` | 페이로드 형식: `slack`, `discord`, `teams`, `generic` |
| `--name` | `-n` | 자동 | 이 웹훅의 사람이 읽을 수 있는 이름 |
| `--events` | `-e` | 전체 | 알림을 받을 이벤트의 쉼표로 구분된 목록 |
| `--secret` | `-s` | | 페이로드 검증을 위한 HMAC-SHA256 서명 비밀 |
| `--min-severity` | | `suspicious` | 트리거할 최소 심각도: `suspicious`, `malicious` |

### 지원되는 이벤트

| 이벤트 | 설명 |
|-------|-------------|
| `threat_detected` | 악성 또는 의심스러운 파일이 발견됨 |
| `file_quarantined` | 파일이 격리로 이동됨 |
| `scan_completed` | 스캔 작업이 완료됨 |
| `update_completed` | 시그니처 업데이트 완료 |
| `ransomware_alert` | 랜섬웨어 동작이 탐지됨 |
| `daemon_status` | 데몬이 시작, 중지 또는 오류를 만남 |

### 예제

```bash
# Slack 웹훅 추가
sd webhook add --format slack --name "security-alerts" \
  "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"

# Discord 웹훅 추가
sd webhook add --format discord --name "av-alerts" \
  "https://discord.com/api/webhooks/1234567890/abcdefg"

# HMAC 서명이 있는 일반 웹훅 추가
sd webhook add --format generic --secret "my-signing-secret" \
  --name "siem-ingest" "https://siem.example.com/api/v1/alerts"

# 악성 전용 알림을 위한 웹훅 추가
sd webhook add --format slack --min-severity malicious \
  --events threat_detected,ransomware_alert \
  "https://hooks.slack.com/services/T00000/B00000/CRITICAL"
```

## 웹훅 목록

```bash
sd webhook list
```

```
등록된 웹훅 (3개)

이름              형식     이벤트              최소 심각도  URL
security-alerts   slack    전체                suspicious    https://hooks.slack.com/...XXXX
av-alerts         discord  전체                suspicious    https://discord.com/...defg
siem-ingest       generic  전체                suspicious    https://siem.example.com/...
```

## 웹훅 제거

```bash
# 이름으로 제거
sd webhook remove security-alerts

# URL로 제거
sd webhook remove "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
```

## 웹훅 테스트

연결을 확인하기 위해 테스트 알림을 전송합니다:

```bash
# 특정 웹훅 테스트
sd webhook test security-alerts

# 모든 웹훅 테스트
sd webhook test --all
```

테스트는 형식과 전달을 확인할 수 있도록 샘플 위협 탐지 페이로드를 전송합니다.

## 페이로드 형식

### 일반 형식

기본 `generic` 형식은 HTTP POST를 통해 JSON 페이로드를 전송합니다:

```json
{
  "event": "threat_detected",
  "timestamp": "2026-03-21T10:15:32Z",
  "hostname": "web-server-01",
  "threat": {
    "file": "/tmp/payload.exe",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
    "size": 245760,
    "severity": "malicious",
    "detection": {
      "engine": "yara",
      "rule": "Win_Trojan_AgentTesla",
      "source": "neo23x0/signature-base"
    }
  },
  "action_taken": "quarantined",
  "quarantine_id": "a1b2c3d4"
}
```

일반 페이로드에 포함된 헤더:

```
Content-Type: application/json
User-Agent: PRX-SD/1.0
X-PRX-SD-Event: threat_detected
X-PRX-SD-Signature: sha256=<HMAC signature>  (비밀이 설정된 경우)
```

### Slack 형식

Slack 웹훅은 색상 코딩된 심각도가 있는 형식화된 메시지를 받습니다:

```json
{
  "attachments": [{
    "color": "#ff0000",
    "title": "Threat Detected: Win_Trojan_AgentTesla",
    "fields": [
      {"title": "File", "value": "/tmp/payload.exe", "short": false},
      {"title": "Severity", "value": "MALICIOUS", "short": true},
      {"title": "Action", "value": "Quarantined", "short": true},
      {"title": "Host", "value": "web-server-01", "short": true},
      {"title": "SHA-256", "value": "`e3b0c44298fc...`", "short": false}
    ],
    "ts": 1742554532
  }]
}
```

### Discord 형식

Discord 웹훅은 embeds 형식을 사용합니다:

```json
{
  "embeds": [{
    "title": "Threat Detected",
    "description": "**Win_Trojan_AgentTesla** found in `/tmp/payload.exe`",
    "color": 16711680,
    "fields": [
      {"name": "Severity", "value": "MALICIOUS", "inline": true},
      {"name": "Action", "value": "Quarantined", "inline": true},
      {"name": "Host", "value": "web-server-01", "inline": true}
    ],
    "timestamp": "2026-03-21T10:15:32Z"
  }]
}
```

## 설정 파일

웹훅은 `~/.prx-sd/config.toml`에서도 설정할 수 있습니다:

```toml
[[webhook]]
name = "security-alerts"
url = "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
format = "slack"
events = ["threat_detected", "ransomware_alert", "file_quarantined"]
min_severity = "suspicious"

[[webhook]]
name = "siem-ingest"
url = "https://siem.example.com/api/v1/alerts"
format = "generic"
secret = "my-hmac-secret"
events = ["threat_detected"]
min_severity = "malicious"
```

::: tip
웹훅 비밀은 설정 파일에 암호화되어 저장됩니다. 설정 파일을 직접 편집하는 것보다 `sd webhook add --secret`을 사용하여 안전하게 설정하세요.
:::

## 재시도 동작

실패한 웹훅 전달은 지수 백오프로 재시도됩니다:

| 시도 | 지연 |
|---------|-------|
| 1번째 재시도 | 5초 |
| 2번째 재시도 | 30초 |
| 3번째 재시도 | 5분 |
| 4번째 재시도 | 30분 |
| (포기) | 이벤트가 전달 불가로 로깅됨 |

## 다음 단계

- [이메일 알림](./email) -- 이메일 알림 설정
- [예약 스캔](./schedule) -- 반복 스캔 작업 설정
- [위협 대응](/ko/prx-sd/remediation/) -- 자동화된 수정 설정
- [데몬](/ko/prx-sd/realtime/daemon) -- 알림과 함께 백그라운드 모니터링
