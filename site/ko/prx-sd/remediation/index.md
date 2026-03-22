---
title: 위협 대응
description: "자동 위협 수정, 대응 정책, 지속성 정리, 네트워크 격리 설정."
---

# 위협 대응

PRX-SD의 수정 엔진은 단순한 탐지를 넘어 자동화된 위협 대응을 제공합니다. 위협이 식별되면 설정된 정책에 따라 로깅에서 전체 네트워크 격리까지 단계적인 조치를 취할 수 있습니다.

## 대응 유형

| 조치 | 설명 | 되돌릴 수 있음 | 루트 필요 |
|--------|-------------|-----------|--------------|
| **보고** | 탐지를 로깅하고 계속 진행합니다. 파일에 대한 조치는 없습니다. | 해당 없음 | 아니오 |
| **격리** | 파일을 암호화하여 격리 저장소로 이동합니다. | 예 | 아니오 |
| **차단** | fanotify를 통해 파일 접근/실행을 거부합니다 (Linux 실시간 전용). | 예 | 예 |
| **종료** | 악성 파일을 생성했거나 사용 중인 프로세스를 종료합니다. | 아니오 | 예 |
| **정리** | 원본을 보존하면서 파일에서 악성 내용을 제거합니다 (예: Office 문서에서 매크로 제거). | 부분적 | 아니오 |
| **삭제** | 디스크에서 악성 파일을 영구적으로 삭제합니다. | 아니오 | 아니오 |
| **격리** | 방화벽 규칙을 사용하여 머신의 모든 네트워크 접근을 차단합니다. | 예 | 예 |
| **차단 목록** | 향후 스캔을 위해 로컬 차단 목록에 파일 해시를 추가합니다. | 예 | 아니오 |

## 정책 설정

### sd policy 명령어 사용

```bash
# 현재 정책 표시
sd policy show

# 악성 탐지에 대한 정책 설정
sd policy set on_malicious quarantine

# 의심스러운 탐지에 대한 정책 설정
sd policy set on_suspicious report

# 기본값으로 재설정
sd policy reset
```

### 예제 출력

```bash
sd policy show
```

```
위협 대응 정책
  on_malicious:    quarantine
  on_suspicious:   report
  blocklist_auto:  true
  notify_webhook:  true
  notify_email:    false
  clean_persistence: true
  network_isolate:   false
```

### 설정 파일

`~/.prx-sd/config.toml`에서 정책 설정:

```toml
[policy]
on_malicious = "quarantine"     # report | quarantine | block | kill | clean | delete
on_suspicious = "report"        # report | quarantine | block
blocklist_auto = true           # 악성 해시를 로컬 차단 목록에 자동 추가
clean_persistence = true        # 악성 탐지 시 지속성 메커니즘 제거
network_isolate = false         # 심각한 위협에 대한 네트워크 격리 활성화

[policy.notify]
webhook = true
email = false

[policy.escalation]
# 동일한 위협이 다시 나타나면 더 강한 조치로 에스컬레이션
enabled = true
max_reappearances = 3
escalate_to = "delete"
```

::: tip
`on_malicious`와 `on_suspicious` 정책은 서로 다른 조치 세트를 허용합니다. `kill`과 `delete` 같은 파괴적인 조치는 `on_malicious`에서만 사용할 수 있습니다.
:::

## 지속성 정리

`clean_persistence`가 활성화되면 PRX-SD는 악성코드가 설치했을 수 있는 지속성 메커니즘을 검색하고 제거합니다. 이 기능은 위협을 격리하거나 삭제한 후 자동으로 실행됩니다.

### Linux 지속성 지점

| 위치 | 기법 | 정리 조치 |
|----------|-----------|----------------|
| `/etc/cron.d/`, `/var/spool/cron/` | Cron 작업 | 악성 cron 항목 제거 |
| `/etc/systemd/system/` | systemd 서비스 | 악성 유닛 비활성화 및 제거 |
| `~/.config/systemd/user/` | 사용자 systemd 서비스 | 비활성화 및 제거 |
| `~/.bashrc`, `~/.profile` | 셸 RC 주입 | 주입된 줄 제거 |
| `~/.ssh/authorized_keys` | SSH 백도어 키 | 비인가 키 제거 |
| `/etc/ld.so.preload` | LD_PRELOAD 하이재킹 | 악성 프리로드 항목 제거 |
| `/etc/init.d/` | SysV init 스크립트 | 악성 스크립트 제거 |

### macOS 지속성 지점

| 위치 | 기법 | 정리 조치 |
|----------|-----------|----------------|
| `~/Library/LaunchAgents/` | LaunchAgent plists | 언로드 및 제거 |
| `/Library/LaunchDaemons/` | LaunchDaemon plists | 언로드 및 제거 |
| `~/Library/Application Support/` | 로그인 항목 | 악성 항목 제거 |
| `/Library/StartupItems/` | 시작 항목 | 제거 |
| `~/.zshrc`, `~/.bash_profile` | 셸 RC 주입 | 주입된 줄 제거 |
| Keychain | Keychain 남용 | 경고 (자동 정리 없음) |

### Windows 지속성 지점

| 위치 | 기법 | 정리 조치 |
|----------|-----------|----------------|
| `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` | 레지스트리 Run 키 | 악성 값 제거 |
| `HKLM\SYSTEM\CurrentControlSet\Services` | 악성 서비스 | 중지, 비활성화 및 제거 |
| `Startup` 폴더 | 시작 바로 가기 | 악성 바로 가기 제거 |
| Task Scheduler | 예약된 작업 | 악성 작업 삭제 |
| WMI 구독 | WMI 이벤트 소비자 | 악성 구독 제거 |

::: warning
지속성 정리는 시스템 설정 파일과 레지스트리 항목을 수정합니다. 각 작업 후 `~/.prx-sd/remediation.log`의 정리 로그를 검토하여 악성 항목만 제거되었는지 확인하세요.
:::

## 네트워크 격리

심각한 위협(활성 랜섬웨어, 데이터 유출)의 경우 PRX-SD는 머신을 네트워크에서 격리할 수 있습니다:

### Linux (iptables)

```bash
# PRX-SD는 격리 시 이 규칙들을 자동으로 추가합니다
iptables -I OUTPUT -j DROP
iptables -I INPUT -j DROP
iptables -I OUTPUT -d 127.0.0.1 -j ACCEPT
iptables -I INPUT -s 127.0.0.1 -j ACCEPT
```

### macOS (pf)

```bash
# PRX-SD는 pf 규칙을 설정합니다
echo "block all" | pfctl -f -
echo "pass on lo0" | pfctl -f -
pfctl -e
```

격리 해제:

```bash
sd isolate lift
```

::: warning
네트워크 격리는 SSH를 포함한 모든 네트워크 트래픽을 차단합니다. 자동 네트워크 격리를 활성화하기 전에 물리적 또는 대역 외 콘솔 접근이 가능한지 확인하세요.
:::

## 수정 로그

모든 수정 조치는 `~/.prx-sd/remediation.log`에 로깅됩니다:

```json
{
  "timestamp": "2026-03-21T10:15:32Z",
  "threat_id": "a1b2c3d4",
  "file": "/tmp/payload.exe",
  "detection": "Win_Trojan_AgentTesla",
  "severity": "malicious",
  "actions_taken": [
    {"action": "quarantine", "status": "success"},
    {"action": "blocklist", "status": "success"},
    {"action": "clean_persistence", "status": "success", "items_removed": 2}
  ]
}
```

## 예제

```bash
# 서버를 위한 공격적인 정책 설정
sd policy set on_malicious kill
sd policy set on_suspicious quarantine

# 워크스테이션을 위한 보수적인 정책 설정
sd policy set on_malicious quarantine
sd policy set on_suspicious report

# 명시적 수정으로 스캔
sd scan /tmp --on-malicious delete --on-suspicious quarantine

# 네트워크 격리 확인 및 해제
sd isolate status
sd isolate lift

# 수정 기록 보기
sd remediation log --last 50
sd remediation log --json > remediation_export.json
```

## 다음 단계

- [격리 관리](/ko/prx-sd/quarantine/) -- 격리된 파일 관리
- [랜섬웨어 보호](/ko/prx-sd/realtime/ransomware) -- 특수 랜섬웨어 대응
- [웹훅 알림](/ko/prx-sd/alerts/webhook) -- 수정 조치에 대한 알림
- [이메일 알림](/ko/prx-sd/alerts/email) -- 위협에 대한 이메일 알림
