---
title: prx service
description: PRX를 시스템 서비스(systemd 또는 OpenRC)로 설치하고 관리합니다.
---

# prx service

PRX를 시스템 서비스로 설치, 시작, 중지하고 상태를 확인합니다. systemd(대부분의 Linux 배포판)와 OpenRC(Alpine, Gentoo)를 모두 지원합니다.

## 사용법

```bash
prx service <SUBCOMMAND> [OPTIONS]
```

## 하위 명령어

### `prx service install`

현재 init 시스템에 맞는 서비스 유닛 파일을 생성하고 설치합니다.

```bash
prx service install [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--config` | `-c` | `~/.config/prx/config.toml` | 서비스용 설정 파일 경로 |
| `--user` | `-u` | 현재 사용자 | 서비스를 실행할 사용자 |
| `--group` | `-g` | 현재 그룹 | 서비스를 실행할 그룹 |
| `--bin-path` | | 자동 감지 | `prx` 바이너리 경로 |
| `--enable` | | `false` | 부팅 시 서비스 자동 시작 활성화 |
| `--user-service` | | `false` | 사용자 수준 systemd 서비스로 설치 (sudo 불필요) |

```bash
# 시스템 서비스로 설치 (sudo 필요)
sudo prx service install --user prx --group prx --enable

# 사용자 서비스로 설치 (sudo 불필요)
prx service install --user-service --enable

# 사용자 지정 설정 경로로 설치
sudo prx service install --config /etc/prx/config.toml --user prx
```

install 명령이 수행하는 작업:

1. init 시스템 감지 (systemd 또는 OpenRC)
2. 적절한 서비스 파일 생성
3. 올바른 위치에 설치 (`/etc/systemd/system/prx.service` 또는 `/etc/init.d/prx`)
4. 선택적으로 부팅 시 서비스 활성화

### `prx service start`

PRX 서비스를 시작합니다.

```bash
prx service start
```

```bash
# 시스템 서비스
sudo prx service start

# 사용자 서비스
prx service start
```

### `prx service stop`

PRX 서비스를 정상 종료합니다.

```bash
prx service stop
```

```bash
sudo prx service stop
```

### `prx service status`

현재 서비스 상태를 표시합니다.

```bash
prx service status [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--json` | `-j` | `false` | JSON으로 출력 |

**출력 예시:**

```
 PRX Service Status
 ──────────────────
 State:      running
 PID:        12345
 Uptime:     3d 14h 22m
 Memory:     42 MB
 Init:       systemd
 Unit:       prx.service
 Enabled:    yes (start on boot)
 Config:     /etc/prx/config.toml
 Log:        journalctl -u prx
```

## 생성되는 유닛 파일

### systemd

생성되는 systemd 유닛 파일에는 프로덕션 보안 강화 지시문이 포함됩니다:

```ini
[Unit]
Description=PRX AI Agent Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
ExecStart=/usr/local/bin/prx daemon --config /etc/prx/config.toml
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5
User=prx
Group=prx
RuntimeDirectory=prx
StateDirectory=prx
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/prx /var/log/prx

[Install]
WantedBy=multi-user.target
```

### OpenRC

```bash
#!/sbin/openrc-run

name="PRX AI Agent Daemon"
command="/usr/local/bin/prx"
command_args="daemon --config /etc/prx/config.toml"
command_user="prx:prx"
pidfile="/run/prx.pid"
start_stop_daemon_args="--background --make-pidfile"

depend() {
    need net
    after firewall
}
```

## 사용자 수준 서비스

단일 사용자 배포의 경우 systemd 사용자 서비스로 설치합니다. root 권한이 필요하지 않습니다:

```bash
prx service install --user-service --enable

# systemctl --user로 관리
systemctl --user status prx
systemctl --user restart prx
journalctl --user -u prx -f
```

## 관련 문서

- [prx daemon](./daemon) -- 데몬 설정 및 시그널
- [prx doctor](./doctor) -- 서비스 상태 확인
- [설정 개요](/ko/prx/config/) -- 설정 파일 레퍼런스
