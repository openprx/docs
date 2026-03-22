---
title: 예약 스캔
description: 정기적인 간격으로 자동 위협 탐지를 위해 sd schedule로 반복 스캔 작업을 설정합니다.
---

# 예약 스캔

`sd schedule` 명령어는 정해진 간격으로 실행되는 반복 스캔 작업을 관리합니다. 예약 스캔은 실시간 모니터링을 보완하여 지정된 디렉토리의 정기적인 전체 스캔을 수행하고, 모니터링이 비활성화된 동안 누락되거나 도입된 위협을 잡습니다.

## 사용법

```bash
sd schedule <SUBCOMMAND> [OPTIONS]
```

### 서브 커맨드

| 서브 커맨드 | 설명 |
|------------|-------------|
| `add` | 새 예약 스캔 작업 생성 |
| `remove` | 예약 스캔 작업 제거 |
| `list` | 모든 예약 스캔 작업 나열 |
| `status` | 마지막 실행 및 다음 실행을 포함한 예약 작업 상태 표시 |
| `run` | 예약 작업 즉시 수동 트리거 |

## 예약 스캔 추가

```bash
sd schedule add <PATH> [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|------|-------|---------|-------------|
| `--frequency` | `-f` | `daily` | 스캔 빈도: `hourly`, `4h`, `12h`, `daily`, `weekly` |
| `--name` | `-n` | 자동 생성 | 이 작업의 사람이 읽을 수 있는 이름 |
| `--recursive` | `-r` | `true` | 디렉토리를 재귀적으로 스캔 |
| `--auto-quarantine` | `-q` | `false` | 탐지된 위협 격리 |
| `--exclude` | `-e` | | 제외할 글로브 패턴 (반복 가능) |
| `--notify` | | `true` | 탐지 시 알림 전송 |
| `--time` | `-t` | 임의 | 선호하는 시작 시간 (HH:MM, 24시간 형식) |
| `--day` | `-d` | `monday` | 주간 스캔의 요일 |

### 빈도 옵션

| 빈도 | 간격 | 사용 사례 |
|-----------|----------|----------|
| `hourly` | 60분마다 | 고위험 디렉토리 (업로드, 임시) |
| `4h` | 4시간마다 | 공유 디렉토리, 웹 루트 |
| `12h` | 12시간마다 | 사용자 홈 디렉토리 |
| `daily` | 24시간마다 | 범용 전체 스캔 |
| `weekly` | 7일마다 | 저위험 아카이브, 백업 검증 |

### 예제

```bash
# 홈 디렉토리의 일일 스캔
sd schedule add /home --frequency daily --name "home-daily"

# 자동 격리로 업로드 디렉토리의 시간별 스캔
sd schedule add /var/www/uploads --frequency hourly --auto-quarantine \
  --name "uploads-hourly"

# 대형 미디어 파일을 제외한 주간 전체 스캔
sd schedule add / --frequency weekly --name "full-weekly" \
  --exclude "*.iso" --exclude "*.vmdk" --exclude "/proc/*" --exclude "/sys/*"

# 임시 디렉토리의 4시간 스캔
sd schedule add /tmp --frequency 4h --auto-quarantine --name "tmp-4h"

# 특정 시간의 일일 스캔
sd schedule add /home --frequency daily --time 02:00 --name "home-nightly"

# 일요일 주간 스캔
sd schedule add /var/www --frequency weekly --day sunday --time 03:00 \
  --name "webroot-weekly"
```

## 예약 스캔 나열

```bash
sd schedule list
```

```
예약 스캔 작업 (4개)

이름              경로              빈도     자동-격리  다음 실행
home-daily        /home             daily    아니오      2026-03-22 02:00
uploads-hourly    /var/www/uploads  hourly   예          2026-03-21 11:00
tmp-4h            /tmp              4h       예          2026-03-21 14:00
full-weekly       /                 weekly   아니오      2026-03-23 03:00 (일)
```

## 작업 상태 확인

```bash
sd schedule status
```

```
예약 스캔 상태

이름              마지막 실행            시간      파일     위협     상태
home-daily        2026-03-21 02:00:12   8m 32s    45,231   0        깨끗함
uploads-hourly    2026-03-21 10:00:05   45s       1,247    1        위협 발견
tmp-4h            2026-03-21 10:00:08   2m 12s    3,891    0        깨끗함
full-weekly       2026-03-16 03:00:00   1h 22m    892,451  3        위협 발견
```

특정 작업에 대한 상세 상태 가져오기:

```bash
sd schedule status home-daily
```

```
작업: home-daily
  경로:           /home
  빈도:           daily (24시간마다)
  선호 시간:     02:00
  자동 격리:     아니오
  재귀:           예
  제외:           (없음)

  마지막 실행:   2026-03-21 02:00:12 UTC
  소요 시간:     8분 32초
  스캔된 파일:  45,231개
  발견된 위협:  0개
  결과:          깨끗함

  다음 실행:    2026-03-22 02:00 UTC
  총 실행:       47회
  총 위협:       3개 (모든 실행에 걸쳐)
```

## 예약 스캔 제거

```bash
# 이름으로 제거
sd schedule remove home-daily

# 모든 예약 스캔 제거
sd schedule remove --all
```

## 스캔 수동 트리거

다음 간격을 기다리지 않고 예약 작업을 즉시 실행합니다:

```bash
sd schedule run home-daily
```

이것은 설정된 모든 옵션(격리, 제외, 알림)으로 스캔을 실행하고 작업의 마지막 실행 타임스탬프를 업데이트합니다.

## 스케줄링 작동 방식

PRX-SD는 시스템 cron이 아닌 내부 스케줄러를 사용합니다. 스케줄러는 데몬 프로세스의 일부로 실행됩니다:

```
sd daemon start
  └── 스케줄러 스레드
        ├── 60초마다 작업 간격 확인
        ├── 간격이 경과하면 스캔 작업 시작
        ├── 결과를 ~/.prx-sd/schedule/에 직렬화
        └── 완료 시 알림 전송
```

::: warning
예약 스캔은 데몬이 활성화된 경우에만 실행됩니다. 데몬이 중지된 동안 누락된 스캔은 다음 데몬 시작 시 실행됩니다. 지속적인 스케줄링을 위해 `sd daemon start`를 사용하세요.
:::

## 설정 파일

예약 작업은 `~/.prx-sd/schedule.json`에 저장되며 `config.toml`에서도 정의할 수 있습니다:

```toml
[[schedule]]
name = "home-daily"
path = "/home"
frequency = "daily"
time = "02:00"
recursive = true
auto_quarantine = false
notify = true

[[schedule]]
name = "uploads-hourly"
path = "/var/www/uploads"
frequency = "hourly"
recursive = true
auto_quarantine = true
notify = true
exclude = ["*.tmp", "*.log"]

[[schedule]]
name = "full-weekly"
path = "/"
frequency = "weekly"
day = "sunday"
time = "03:00"
recursive = true
auto_quarantine = false
notify = true
exclude = ["*.iso", "*.vmdk", "/proc/*", "/sys/*", "/dev/*"]
```

## 스캔 보고서

각 예약 스캔은 `~/.prx-sd/reports/`에 저장된 보고서를 생성합니다:

```bash
# 작업의 최신 보고서 보기
sd schedule report home-daily

# JSON으로 보고서 내보내기
sd schedule report home-daily --json > report.json

# 모든 보고서 나열
sd schedule report --list
```

::: tip
예약 스캔을 이메일 알림과 결합하여 자동 보고서를 받습니다. 이메일 이벤트에서 `scan_completed`를 설정하여 각 예약 스캔 후 요약을 받습니다.
:::

## 다음 단계

- [웹훅 알림](./webhook) -- 예약 스캔이 위협을 발견했을 때 알림 받기
- [이메일 알림](./email) -- 예약 스캔의 이메일 보고서
- [데몬](/ko/prx-sd/realtime/daemon) -- 예약 스캔 실행에 필요
- [위협 대응](/ko/prx-sd/remediation/) -- 위협이 발견될 때 발생할 일 설정
