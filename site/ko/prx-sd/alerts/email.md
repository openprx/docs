---
title: 이메일 알림
description: PRX-SD에서 위협 탐지 및 스캔 결과에 대한 이메일 알림을 설정합니다.
---

# 이메일 알림

PRX-SD는 위협이 탐지되거나, 스캔이 완료되거나, 심각한 이벤트가 발생할 때 이메일 알림을 보낼 수 있습니다. 이메일 알림은 이메일이 주요 커뮤니케이션 채널인 환경이나 대기 중인 담당자에게 연락하기 위해 웹훅을 보완합니다.

## 사용법

```bash
sd email-alert <SUBCOMMAND> [OPTIONS]
```

### 서브 커맨드

| 서브 커맨드 | 설명 |
|------------|-------------|
| `configure` | SMTP 서버 및 수신자 설정 구성 |
| `test` | 설정을 확인하기 위한 테스트 이메일 전송 |
| `send` | 수동으로 알림 이메일 전송 |
| `status` | 현재 이메일 설정 상태 표시 |

## 이메일 설정

### 대화형 설정

```bash
sd email-alert configure
```

대화형 마법사는 다음을 묻습니다:

```
SMTP Server: smtp.gmail.com
SMTP Port [587]: 587
Use TLS [yes]: yes
Username: alerts@example.com
Password: ********
From Address [alerts@example.com]: prx-sd@example.com
From Name [PRX-SD]: PRX-SD Scanner
Recipients (comma-separated): security@example.com, oncall@example.com
Min Severity [suspicious]: malicious
```

### 명령줄 설정

```bash
sd email-alert configure \
  --smtp-server smtp.gmail.com \
  --smtp-port 587 \
  --tls true \
  --username alerts@example.com \
  --password "app-password-here" \
  --from "prx-sd@example.com" \
  --from-name "PRX-SD Scanner" \
  --to "security@example.com,oncall@example.com" \
  --min-severity malicious
```

### 설정 파일

이메일 설정은 `~/.prx-sd/config.toml`에 저장됩니다:

```toml
[email]
enabled = true
min_severity = "malicious"    # suspicious | malicious
events = ["threat_detected", "ransomware_alert", "scan_completed"]

[email.smtp]
server = "smtp.gmail.com"
port = 587
tls = true
username = "alerts@example.com"
# 비밀번호는 암호화되어 저장됨 - 설정하려면 'sd email-alert configure' 사용

[email.message]
from_address = "prx-sd@example.com"
from_name = "PRX-SD Scanner"
recipients = ["security@example.com", "oncall@example.com"]
subject_prefix = "[PRX-SD]"
```

::: tip
Gmail의 경우 계정 비밀번호 대신 앱 비밀번호를 사용하세요. Google 계정 > 보안 > 2단계 인증 > 앱 비밀번호로 이동하여 생성합니다.
:::

## 이메일 테스트

설정을 확인하기 위한 테스트 이메일을 전송합니다:

```bash
sd email-alert test
```

```
security@example.com, oncall@example.com에 테스트 이메일 전송 중...
  SMTP 연결:    OK (smtp.gmail.com:587, TLS)
  인증:          OK
  전달:          OK (Message-ID: <prx-sd-test-a1b2c3@example.com>)

테스트 이메일이 성공적으로 전송되었습니다.
```

## 수동 알림 전송

수동으로 알림 이메일을 트리거합니다 (통합 테스트 또는 발견 사항 전달에 유용):

```bash
# 특정 파일에 대한 알림 전송
sd email-alert send --file /tmp/suspicious_file --severity malicious \
  --message "Found during incident response investigation"

# 스캔 요약 전송
sd email-alert send --scan-report /tmp/scan-results.json
```

## 이메일 내용

### 위협 탐지 이메일

```
Subject: [PRX-SD] MALICIOUS: Win_Trojan_AgentTesla detected on web-server-01

PRX-SD Threat Detection Alert
==============================

Host:       web-server-01
Timestamp:  2026-03-21 10:15:32 UTC
Severity:   MALICIOUS

File:       /tmp/payload.exe
SHA-256:    e3b0c44298fc1c149afbf4c8996fb924...
Size:       240 KB
Type:       PE32 executable (GUI) Intel 80386, for MS Windows

Detection:  Win_Trojan_AgentTesla
Engine:     YARA (neo23x0/signature-base)

Action Taken: Quarantined (ID: a1b2c3d4)

---
PRX-SD Antivirus Engine | https://openprx.dev/prx-sd
```

### 스캔 요약 이메일

```
Subject: [PRX-SD] Scan Complete: 3 threats found in /home

PRX-SD Scan Report
===================

Host:           web-server-01
Scan Path:      /home
Started:        2026-03-21 10:00:00 UTC
Completed:      2026-03-21 10:12:45 UTC
Duration:       12 minutes 45 seconds

Files Scanned:  45,231
Threats Found:  3

Detections:
  1. /home/user/downloads/crack.exe
     Severity: MALICIOUS | Detection: Win_Trojan_Agent
     Action: Quarantined

  2. /home/user/.cache/tmp/loader.sh
     Severity: MALICIOUS | Detection: Linux_Backdoor_Generic
     Action: Quarantined

  3. /home/user/scripts/util.py
     Severity: SUSPICIOUS | Detection: Heuristic_HighEntropy
     Action: Reported

---
PRX-SD Antivirus Engine | https://openprx.dev/prx-sd
```

## 지원되는 이벤트

| 이벤트 | 기본 포함 | 설명 |
|-------|-----------------|-------------|
| `threat_detected` | 예 | 악성 또는 의심스러운 파일이 발견됨 |
| `ransomware_alert` | 예 | 랜섬웨어 동작이 탐지됨 |
| `scan_completed` | 아니오 | 스캔 작업이 완료됨 (위협이 발견된 경우에만) |
| `update_completed` | 아니오 | 시그니처 업데이트가 완료됨 |
| `update_failed` | 예 | 시그니처 업데이트가 실패함 |
| `daemon_error` | 예 | 데몬이 심각한 오류를 만남 |

어떤 이벤트가 이메일을 트리거하는지 설정합니다:

```toml
[email]
events = ["threat_detected", "ransomware_alert", "daemon_error"]
```

## 속도 제한

대규모 발생 시 이메일 홍수를 방지하려면:

```toml
[email.rate_limit]
max_per_hour = 10            # 시간당 최대 이메일 수
digest_mode = true           # 여러 알림을 단일 이메일로 일괄 처리
digest_interval_mins = 15    # 다이제스트 일괄 처리 창
```

`digest_mode`가 활성화되면 다이제스트 창 내의 알림이 개별 알림 대신 단일 요약 이메일로 결합됩니다.

## 상태 확인

```bash
sd email-alert status
```

```
이메일 알림 상태
  활성화됨:      true
  SMTP 서버:    smtp.gmail.com:587 (TLS)
  보내는 주소:  prx-sd@example.com
  수신자:        security@example.com, oncall@example.com
  최소 심각도:  malicious
  이벤트:        threat_detected, ransomware_alert, daemon_error
  마지막 전송:  2026-03-21 10:15:32 UTC
  오늘 이메일:  2개
```

## 다음 단계

- [웹훅 알림](./webhook) -- 실시간 웹훅 알림
- [예약 스캔](./schedule) -- 반복 스캔 자동화
- [위협 대응](/ko/prx-sd/remediation/) -- 자동화된 수정 정책
- [데몬](/ko/prx-sd/realtime/daemon) -- 알림과 함께 백그라운드 보호
