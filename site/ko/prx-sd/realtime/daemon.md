---
title: 데몬 프로세스
description: 자동 시그니처 업데이트와 지속적인 파일 모니터링으로 PRX-SD를 백그라운드 데몬으로 실행합니다.
---

# 데몬 프로세스

`sd daemon` 명령어는 실시간 파일 모니터링과 자동 시그니처 업데이트를 결합한 장기 실행 백그라운드 프로세스로 PRX-SD를 시작합니다. 이것은 지속적인 보호가 필요한 서버와 워크스테이션에서 PRX-SD를 실행하는 권장 방법입니다.

## 사용법

```bash
sd daemon [SUBCOMMAND] [OPTIONS]
```

### 서브 커맨드

| 서브 커맨드 | 설명 |
|------------|-------------|
| `start` | 데몬 시작 (서브 커맨드 없으면 기본값) |
| `stop` | 실행 중인 데몬 중지 |
| `restart` | 데몬 중지 및 재시작 |
| `status` | 데몬 상태 및 통계 표시 |

## 옵션 (start)

| 플래그 | 축약 | 기본값 | 설명 |
|------|-------|---------|-------------|
| `--watch` | `-w` | `/home,/tmp` | 모니터링할 쉼표로 구분된 경로 |
| `--update-hours` | `-u` | `6` | 자동 시그니처 업데이트 간격 (시간) |
| `--no-update` | | `false` | 자동 시그니처 업데이트 비활성화 |
| `--block` | `-b` | `false` | 블록 모드 활성화 (Linux fanotify) |
| `--auto-quarantine` | `-q` | `false` | 위협 자동 격리 |
| `--pid-file` | | `~/.prx-sd/sd.pid` | PID 파일 위치 |
| `--log-file` | | `~/.prx-sd/daemon.log` | 로그 파일 위치 |
| `--log-level` | `-l` | `info` | 로그 상세도: `trace`, `debug`, `info`, `warn`, `error` |
| `--config` | `-c` | `~/.prx-sd/config.toml` | 설정 파일 경로 |

## 데몬이 관리하는 것

시작 시 `sd daemon`은 두 가지 서브시스템을 시작합니다:

1. **파일 모니터** -- 파일 시스템 이벤트를 위해 설정된 경로를 감시하고 새로 생성되거나 수정된 파일을 스캔합니다. 동일한 경로로 `sd monitor`를 실행하는 것과 동일합니다.
2. **업데이트 스케줄러** -- 주기적으로 새로운 위협 시그니처(해시 데이터베이스, YARA 규칙, IOC 피드)를 확인하고 다운로드합니다. 설정된 간격으로 `sd update`를 실행하는 것과 동일합니다.

## 기본 모니터링 경로

`--watch`가 지정되지 않으면 데몬은 다음을 모니터링합니다:

| 플랫폼 | 기본 경로 |
|----------|--------------|
| Linux | `/home`, `/tmp` |
| macOS | `/Users`, `/tmp`, `/private/tmp` |
| Windows | `C:\Users`, `C:\Windows\Temp` |

설정 파일 또는 `--watch`로 이 기본값을 재정의합니다:

```bash
sd daemon start --watch /home,/tmp,/var/www,/opt
```

## 상태 확인

`sd daemon status`(또는 단축형 `sd status`)를 사용하여 데몬 상태를 봅니다:

```bash
sd status
```

```
PRX-SD 데몬 상태
  상태:          실행 중 (PID 48231)
  업타임:         3일, 14시간, 22분
  감시 경로:  /home, /tmp
  스캔된 파일:  12,847개
  발견된 위협:  3개 (2개 격리됨, 1개 보고됨)
  마지막 업데이트:    2026-03-21 08:00:12 UTC (시그니처 v2026.0321.1)
  다음 업데이트:    2026-03-21 14:00:12 UTC
  메모리 사용량:   42 MB
```

## systemd 통합 (Linux)

자동 시작을 위한 systemd 서비스 만들기:

```ini
[Unit]
Description=PRX-SD Antivirus Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
ExecStart=/usr/local/bin/sd daemon start
ExecStop=/usr/local/bin/sd daemon stop
ExecReload=/bin/kill -HUP $MAINPID
PIDFile=/var/lib/prx-sd/sd.pid
Restart=on-failure
RestartSec=10
User=root

# 보안 강화
NoNewPrivileges=yes
ProtectSystem=strict
ReadWritePaths=/var/lib/prx-sd /home /tmp

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-sd
sudo systemctl status prx-sd
sudo journalctl -u prx-sd -f
```

::: tip
데몬은 fanotify 블록 모드를 사용하기 위해 root가 필요합니다. 비블록 모니터링의 경우 감시된 경로에 대한 읽기 접근 권한이 있는 비특권 사용자로 실행할 수 있습니다.
:::

## launchd 통합 (macOS)

`/Library/LaunchDaemons/com.openprx.sd.plist`에 런치 데몬 plist 만들기:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.openprx.sd</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/sd</string>
        <string>daemon</string>
        <string>start</string>
        <string>--watch</string>
        <string>/Users,/tmp</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/prx-sd.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/prx-sd.log</string>
</dict>
</plist>
```

```bash
sudo launchctl load /Library/LaunchDaemons/com.openprx.sd.plist
sudo launchctl list | grep openprx
```

## 시그널

| 시그널 | 동작 |
|--------|----------|
| `SIGHUP` | 전체 재시작 없이 설정 재로드 및 감시 재시작 |
| `SIGTERM` | 정상적인 종료 -- 현재 스캔 완료, 로그 플러시 |
| `SIGINT` | `SIGTERM`과 동일 |
| `SIGUSR1` | 즉시 시그니처 업데이트 트리거 |

```bash
# 즉시 업데이트 강제
kill -USR1 $(cat ~/.prx-sd/sd.pid)
```

## 예제

```bash
# 기본값으로 데몬 시작
sd daemon start

# 사용자 정의 감시 경로와 4시간 업데이트 주기로 시작
sd daemon start --watch /home,/tmp,/var/www --update-hours 4

# 블록 모드와 자동 격리로 시작
sudo sd daemon start --block --auto-quarantine

# 데몬 상태 확인
sd status

# 데몬 재시작
sd daemon restart

# 데몬 중지
sd daemon stop
```

::: warning
데몬 중지는 모든 실시간 보호를 비활성화합니다. 데몬이 중지된 동안 발생하는 파일 시스템 이벤트는 소급하여 스캔되지 않습니다.
:::

## 다음 단계

- [파일 모니터링](./monitor) -- 상세 모니터링 설정
- [랜섬웨어 보호](./ransomware) -- 행동 랜섬웨어 탐지
- [시그니처 업데이트](/ko/prx-sd/signatures/update) -- 수동 시그니처 업데이트
- [웹훅 알림](/ko/prx-sd/alerts/webhook) -- 위협 발견 시 알림 받기
