---
title: 파일 모니터링
description: 위협이 디스크에 나타나는 즉시 탐지하기 위한 sd monitor를 사용한 실시간 파일 시스템 모니터링.
---

# 파일 모니터링

`sd monitor` 명령어는 파일 시스템 활동을 위해 디렉토리를 감시하고 실시간으로 새로 생성되거나 수정된 파일을 스캔합니다. 이것은 악성코드가 실행되기 전에 디스크에 착지하는 순간 잡는 기본 방법입니다.

## 사용법

```bash
sd monitor [OPTIONS] [PATHS...]
```

경로가 지정되지 않으면 `sd monitor`는 현재 작업 디렉토리를 감시합니다.

## 옵션

| 플래그 | 축약 | 기본값 | 설명 |
|------|-------|---------|-------------|
| `--recursive` | `-r` | `true` | 디렉토리를 재귀적으로 감시 |
| `--block` | `-b` | `false` | 스캔 완료까지 파일 실행 차단 (Linux 전용) |
| `--daemon` | `-d` | `false` | 백그라운드 데몬 프로세스로 실행 |
| `--pid-file` | | | 지정된 파일에 PID 저장 (`--daemon` 의미) |
| `--exclude` | `-e` | | 제외할 글로브 패턴 (반복 가능) |
| `--log-file` | | | 로그 출력을 stderr 대신 파일에 저장 |
| `--auto-quarantine` | `-q` | `false` | 탐지된 위협 자동 격리 |
| `--events` | | 모두 | 감시할 이벤트의 쉼표로 구분된 목록 |
| `--json` | | `false` | 이벤트를 JSON 라인으로 출력 |

## 플랫폼 메커니즘

PRX-SD는 각 플랫폼에서 사용 가능한 가장 능력 있는 파일 시스템 API를 사용합니다:

| 플랫폼 | API | 기능 |
|----------|-----|-------------|
| **Linux** | fanotify (커널 5.1+) | 시스템 전체 모니터링, 실행 권한 제어, 파일 디스크립터 패스스루 |
| **Linux (폴백)** | inotify | 디렉토리별 감시, 블록 지원 없음 |
| **macOS** | FSEvents | 저지연 재귀 모니터링, 이력 이벤트 재생 |
| **Windows** | ReadDirectoryChangesW | 완료 포트와 함께 디렉토리별 비동기 모니터링 |

::: tip
Linux에서 `sd monitor`는 fanotify를 사용하기 위해 `CAP_SYS_ADMIN` 기능(또는 root)이 필요합니다. 사용할 수 없으면 경고와 함께 자동으로 inotify로 폴백합니다.
:::

## 모니터링 이벤트

다음 파일 시스템 이벤트가 스캔을 트리거합니다:

| 이벤트 | 설명 | 플랫폼 |
|-------|-------------|-----------|
| `Create` | 새 파일 생성 | 모두 |
| `Modify` | 파일 내용 쓰기 | 모두 |
| `CloseWrite` | 쓰기 후 파일 닫힘 (부분 스캔 방지) | Linux |
| `Delete` | 파일 제거 | 모두 |
| `Rename` | 파일 이름 변경 또는 이동 | 모두 |
| `Open` | 읽기를 위해 파일 열림 | Linux (fanotify) |
| `Execute` | 파일이 실행될 예정 | Linux (fanotify) |

`--events`로 스캔을 트리거하는 이벤트 필터링:

```bash
# 새 파일 및 수정에서만 스캔
sd monitor --events Create,CloseWrite /home
```

## 블록 모드

fanotify가 있는 Linux에서 `--block`은 `FAN_OPEN_EXEC_PERM` 모드를 활성화합니다. 이 모드에서 커널은 PRX-SD가 판정을 반환할 때까지 프로세스 실행을 일시 중지합니다:

```bash
sudo sd monitor --block /usr/local/bin /tmp
```

::: warning
블록 모드는 모니터링된 경로의 모든 프로그램 실행에 지연 시간을 추가합니다. `/usr` 또는 `/lib` 같은 시스템 전체 경로가 아닌 `/tmp` 또는 다운로드 폴더 같은 고위험 디렉토리에만 사용하세요.
:::

블록 모드에서 위협이 탐지되면:

1. 파일 열기/실행이 커널에 의해 **거부**됨
2. 이벤트가 판정 `BLOCKED`로 로깅됨
3. `--auto-quarantine`이 설정된 경우 파일이 격리 저장소로 이동됨

## 데몬 모드

`--daemon`을 사용하여 터미널에서 모니터를 분리합니다:

```bash
sd monitor --daemon --pid-file /var/run/sd-monitor.pid /home /tmp /var/www
```

`SIGTERM`을 전송하여 데몬 중지:

```bash
kill $(cat /var/run/sd-monitor.pid)
```

또는 데몬 관리자를 통해 실행 중인 경우 `sd daemon stop`을 사용합니다. 자세한 내용은 [데몬](./daemon)을 참조하세요.

## 예제

```bash
# 홈과 tmp 디렉토리 감시
sd monitor /home /tmp

# 자동 격리로 감시
sd monitor --auto-quarantine /home/downloads

# Linux에서 민감한 디렉토리에 블록 모드
sudo sd monitor --block --auto-quarantine /tmp

# 빌드 아티팩트와 node_modules 제외
sd monitor -e "*.o" -e "node_modules/**" /home/dev/projects

# JSON 로깅으로 데몬으로 실행
sd monitor --daemon --json --log-file /var/log/sd-monitor.json /home

# 특정 이벤트만으로 모니터링
sd monitor --events Create,Modify,Rename /var/www
```

## JSON 출력

`--json`이 활성화되면 각 이벤트가 단일 JSON 라인을 생성합니다:

```json
{
  "timestamp": "2026-03-21T10:15:32.456Z",
  "event": "CloseWrite",
  "path": "/tmp/payload.exe",
  "verdict": "malicious",
  "threat": "Win.Trojan.Agent-123456",
  "action": "quarantined",
  "scan_ms": 12
}
```

## 다음 단계

- [데몬](./daemon) -- 관리되는 백그라운드 서비스로 모니터링 실행
- [랜섬웨어 보호](./ransomware) -- 특수 랜섬웨어 행동 탐지
- [격리 관리](/ko/prx-sd/quarantine/) -- 격리된 파일 관리
- [위협 대응](/ko/prx-sd/remediation/) -- 자동 대응 정책 설정
