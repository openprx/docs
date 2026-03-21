---
title: prx daemon
description: 게이트웨이, 채널, 크론 스케줄러, 자기 진화 엔진을 포함한 전체 PRX 런타임을 시작합니다.
---

# prx daemon

전체 PRX 런타임을 시작합니다. 데몬 프로세스는 HTTP/WebSocket 게이트웨이, 메시징 채널 연결, 크론 스케줄러, 자기 진화 엔진 등 모든 장기 실행 하위 시스템을 관리합니다.

## 사용법

```bash
prx daemon [OPTIONS]
```

## 옵션

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--config` | `-c` | `~/.config/prx/config.toml` | 설정 파일 경로 |
| `--port` | `-p` | `3120` | 게이트웨이 수신 포트 |
| `--host` | `-H` | `127.0.0.1` | 게이트웨이 바인드 주소 |
| `--log-level` | `-l` | `info` | 로그 상세도: `trace`, `debug`, `info`, `warn`, `error` |
| `--no-evolution` | | `false` | 자기 진화 엔진 비활성화 |
| `--no-cron` | | `false` | 크론 스케줄러 비활성화 |
| `--no-gateway` | | `false` | HTTP/WS 게이트웨이 비활성화 |
| `--pid-file` | | | 지정된 파일에 PID 기록 |

## 데몬이 시작하는 항목

실행 시 `prx daemon`은 다음 하위 시스템을 순서대로 초기화합니다:

1. **설정 로더** -- 설정 파일을 읽고 유효성을 검사합니다
2. **메모리 백엔드** -- 구성된 메모리 저장소(markdown, SQLite 또는 PostgreSQL)에 연결합니다
3. **게이트웨이 서버** -- 구성된 호스트와 포트에서 HTTP/WebSocket 서버를 시작합니다
4. **채널 관리자** -- 활성화된 모든 메시징 채널(Telegram, Discord, Slack 등)을 연결합니다
5. **크론 스케줄러** -- 스케줄된 작업을 로드하고 활성화합니다
6. **자기 진화 엔진** -- L1/L2/L3 진화 파이프라인을 시작합니다 (활성화된 경우)

## 예시

```bash
# 기본 설정으로 시작
prx daemon

# 모든 인터페이스에서 포트 8080으로 바인드
prx daemon --host 0.0.0.0 --port 8080

# 디버그 로깅으로 시작
prx daemon --log-level debug

# 진화 없이 시작 (디버깅에 유용)
prx daemon --no-evolution

# 사용자 지정 설정 파일 사용
prx daemon --config /etc/prx/production.toml
```

## 시그널

데몬은 런타임 제어를 위한 Unix 시그널에 응답합니다:

| 시그널 | 동작 |
|--------|------|
| `SIGHUP` | 재시작 없이 설정 파일을 다시 로드합니다. 채널과 크론 작업이 새 설정에 맞게 조정됩니다. |
| `SIGTERM` | 정상 종료. 진행 중인 요청을 완료하고, 채널을 깔끔하게 연결 해제하며, 대기 중인 메모리 쓰기를 플러시합니다. |
| `SIGINT` | `SIGTERM`과 동일합니다 (Ctrl+C). |

```bash
# 재시작 없이 설정 다시 로드
kill -HUP $(cat /var/run/prx.pid)

# 정상 종료
kill -TERM $(cat /var/run/prx.pid)
```

## systemd 서비스로 실행

프로덕션에서 데몬을 실행하는 권장 방법은 systemd를 사용하는 것입니다. [`prx service install`](./service)을 사용하여 유닛 파일을 자동으로 생성하고 설치하거나 수동으로 생성할 수 있습니다:

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

# Hardening
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/prx /var/log/prx

[Install]
WantedBy=multi-user.target
```

```bash
# 서비스 설치 및 시작
prx service install
prx service start

# 또는 수동으로
sudo systemctl enable --now prx
```

## 로깅

데몬은 기본적으로 stderr에 로그를 출력합니다. systemd 환경에서는 로그가 journal에 의해 캡처됩니다:

```bash
# 데몬 로그 실시간 추적
journalctl -u prx -f

# 최근 1시간의 로그 표시
journalctl -u prx --since "1 hour ago"
```

로그 수집기와의 통합을 위해 설정 파일에 `log_format = "json"`을 추가하여 구조화된 JSON 로깅을 설정합니다.

## 상태 점검

데몬이 실행 중일 때 [`prx doctor`](./doctor)를 사용하거나 게이트웨이 상태 엔드포인트를 조회합니다:

```bash
# CLI 진단
prx doctor

# HTTP 상태 엔드포인트
curl http://127.0.0.1:3120/health
```

## 관련 문서

- [prx gateway](./gateway) -- 채널이나 크론 없는 독립형 게이트웨이
- [prx service](./service) -- systemd/OpenRC 서비스 관리
- [prx doctor](./doctor) -- 데몬 진단
- [설정 개요](/ko/prx/config/) -- 설정 파일 레퍼런스
- [자기 진화 개요](/ko/prx/self-evolution/) -- 진화 엔진 상세 정보
