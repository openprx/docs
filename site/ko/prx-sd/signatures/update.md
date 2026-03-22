---
title: 시그니처 업데이트
description: "sd update를 통한 증분 업데이트와 Ed25519 검증으로 위협 인텔리전스 데이터베이스를 최신 상태로 유지."
---

# 시그니처 업데이트

`sd update` 명령어는 설정된 모든 소스에서 최신 위협 시그니처를 다운로드합니다. 정기적인 업데이트는 매우 중요합니다 -- 새로운 악성코드 샘플이 매 분마다 나타나며, 오래된 시그니처 데이터베이스는 보호에 허점을 남깁니다.

## 사용법

```bash
sd update [OPTIONS]
```

## 옵션

| 플래그 | 축약 | 기본값 | 설명 |
|------|-------|---------|-------------|
| `--check-only` | | `false` | 다운로드 없이 사용 가능한 업데이트 확인 |
| `--force` | `-f` | `false` | 캐시를 무시하고 모든 시그니처 강제 재다운로드 |
| `--source` | `-s` | 전체 | 특정 소스 범주만 업데이트: `hashes`, `yara`, `ioc`, `clamav` |
| `--full` | | `false` | 대용량 데이터셋 포함 (VirusShare 2,000만개 이상 MD5 해시) |
| `--server-url` | | 공식 | 사용자 정의 업데이트 서버 URL |
| `--no-verify` | | `false` | Ed25519 시그니처 검증 건너뜀 (권장하지 않음) |
| `--timeout` | `-t` | `300` | 소스별 다운로드 타임아웃 (초) |
| `--parallel` | `-p` | `4` | 병렬 다운로드 수 |
| `--quiet` | `-q` | `false` | 진행 출력 억제 |

## 업데이트 작동 방식

### 업데이트 흐름

```
sd update
  1. 업데이트 서버에서 metadata.json 가져오기
  2. 로컬 버전과 원격 버전 비교
  3. 각 오래된 소스에 대해:
     a. 증분 diff 다운로드 (diff를 사용할 수 없으면 전체 파일)
     b. Ed25519 시그니처 검증
     c. 로컬 데이터베이스에 적용
  4. YARA 규칙 재컴파일
  5. 로컬 metadata.json 업데이트
```

### 증분 업데이트

PRX-SD는 대역폭을 최소화하기 위해 증분 업데이트를 사용합니다:

| 소스 유형 | 업데이트 방법 | 일반 크기 |
|-------------|--------------|-------------|
| 해시 데이터베이스 | 델타 diff (추가 + 제거) | 50-200 KB |
| YARA 규칙 | Git 스타일 패치 | 10-50 KB |
| IOC 피드 | 전체 교체 (소형 파일) | 1-5 MB |
| ClamAV | cdiff 증분 업데이트 | 100-500 KB |

증분 업데이트를 사용할 수 없을 때(최초 설치, 손상 또는 `--force`), 전체 데이터베이스가 다운로드됩니다.

### Ed25519 시그니처 검증

모든 다운로드된 파일은 적용되기 전에 Ed25519 시그니처에 대해 검증됩니다. 이는 다음을 방지합니다:

- **변조** -- 수정된 파일이 거부됩니다
- **손상** -- 불완전한 다운로드가 감지됩니다
- **재생 공격** -- 오래된 시그니처를 재생할 수 없습니다 (타임스탬프 검증)

서명 공개 키는 컴파일 시 `sd` 바이너리에 임베드됩니다.

::: warning
프로덕션에서 `--no-verify`를 사용하지 마세요. 시그니처 검증은 손상된 업데이트 서버 또는 중간자 공격을 통한 공급망 공격을 방지하기 위해 존재합니다.
:::

## 업데이트 확인

다운로드 없이 사용 가능한 업데이트를 확인하려면:

```bash
sd update --check-only
```

```
업데이트 확인 중...
  MalwareBazaar:    업데이트 사용 가능 (v2026.0321.2, +847개 해시)
  URLhaus:          최신 상태 (v2026.0321.1)
  Feodo Tracker:    업데이트 사용 가능 (v2026.0321.3, +12개 해시)
  ThreatFox:        최신 상태 (v2026.0321.1)
  YARA Community:   업데이트 사용 가능 (v2026.0320.1, +3개 규칙)
  IOC Feeds:        업데이트 사용 가능 (v2026.0321.1, +1,204개 지표)
  ClamAV:           설정되지 않음

3개 소스에 업데이트가 있습니다.
다운로드하려면 'sd update'를 실행하세요.
```

## 사용자 정의 업데이트 서버

에어갭 환경이나 비공개 미러를 운영하는 조직의 경우:

```bash
sd update --server-url https://signatures.internal.corp/prx-sd
```

`config.toml`에서 서버를 영구적으로 설정합니다:

```toml
[update]
server_url = "https://signatures.internal.corp/prx-sd"
interval_hours = 6
auto_update = true
```

::: tip
`prx-sd-mirror` 도구를 사용하여 로컬 시그니처 미러를 설정합니다. 자세한 내용은 [자체 호스팅 가이드](https://github.com/OpenPRX/prx-sd-signatures)를 참조하세요.
:::

## 셸 스크립트 대안

`sd`가 설치되지 않은 시스템의 경우 번들된 셸 스크립트를 사용합니다:

```bash
# 표준 업데이트 (해시 + YARA)
./tools/update-signatures.sh

# VirusShare를 포함한 전체 업데이트
./tools/update-signatures.sh --full

# 해시만 업데이트
./tools/update-signatures.sh --source hashes

# YARA 규칙만 업데이트
./tools/update-signatures.sh --source yara
```

## 예제

```bash
# 표준 업데이트
sd update

# 모든 것의 전체 재다운로드 강제
sd update --force

# YARA 규칙만 업데이트
sd update --source yara

# VirusShare를 포함한 전체 업데이트 (대용량 다운로드)
sd update --full

# cron 작업을 위한 조용한 모드
sd update --quiet

# 먼저 사용 가능한 것 확인
sd update --check-only

# 증가된 병렬 처리로 사용자 정의 서버 사용
sd update --server-url https://mirror.example.com --parallel 8
```

## 업데이트 자동화

### sd daemon 사용

데몬이 자동으로 업데이트를 처리합니다. 간격을 설정합니다:

```bash
sd daemon start --update-hours 4
```

### cron 사용

```bash
# 6시간마다 시그니처 업데이트
0 */6 * * * /usr/local/bin/sd update --quiet 2>&1 | logger -t prx-sd
```

### systemd 타이머 사용

```ini
# /etc/systemd/system/prx-sd-update.timer
[Unit]
Description=PRX-SD Signature Update Timer

[Timer]
OnCalendar=*-*-* 00/6:00:00
RandomizedDelaySec=900
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now prx-sd-update.timer
```

## 다음 단계

- [시그니처 소스](./sources) -- 각 위협 인텔리전스 소스에 대한 세부 정보
- [해시 가져오기](./import) -- 사용자 정의 해시 차단 목록 추가
- [데몬](../realtime/daemon) -- 자동 백그라운드 업데이트
- [위협 인텔리전스 개요](./index) -- 데이터베이스 아키텍처 개요
