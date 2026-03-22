---
title: 설정 개요
description: PRX-SD 설정 작동 방식, 설정 파일 저장 위치, sd config 명령어를 사용하여 설정을 보고 수정하고 초기화하는 방법을 이해합니다.
---

# 설정 개요

PRX-SD는 모든 설정을 `~/.prx-sd/config.json`의 단일 JSON 파일에 저장합니다. 이 파일은 첫 실행 시 합리적인 기본값으로 자동 생성됩니다. `sd config` 명령어를 사용하거나 JSON 파일을 직접 편집하여 설정을 보고 수정하고 초기화할 수 있습니다.

## 설정 파일 위치

| 플랫폼 | 기본 경로 |
|----------|-------------|
| Linux / macOS | `~/.prx-sd/config.json` |
| Windows | `%USERPROFILE%\.prx-sd\config.json` |
| 사용자 정의 | `--data-dir /path/to/dir` (전역 CLI 플래그) |

`--data-dir` 전역 플래그는 기본 위치를 재정의합니다. 설정되면 설정 파일을 `<data-dir>/config.json`에서 읽습니다.

```bash
# 사용자 정의 데이터 디렉토리 사용
sd --data-dir /opt/prx-sd config show
```

## `sd config` 명령어

### 현재 설정 표시

설정 파일 경로를 포함한 모든 현재 설정을 표시합니다:

```bash
sd config show
```

출력:

```
현재 설정
  파일: /home/user/.prx-sd/config.json

{
  "scan": {
    "max_file_size": 104857600,
    "threads": null,
    "timeout_per_file_ms": 30000,
    "scan_archives": true,
    "max_archive_depth": 3,
    "heuristic_threshold": 60,
    "exclude_paths": []
  },
  "monitor": {
    "block_mode": false,
    "channel_capacity": 4096
  },
  "update_server_url": "https://update.prx-sd.dev/v1",
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

### 설정 값 지정

점으로 구분된 표기법을 사용하여 설정 키를 지정합니다. 값은 적절한 JSON 유형(불리언, 정수, 부동소수점, 배열, 객체, 문자열)으로 자동 파싱됩니다.

```bash
sd config set <key> <value>
```

예제:

```bash
# 최대 파일 크기를 200 MiB로 설정
sd config set scan.max_file_size 209715200

# 스캔 스레드를 8로 설정
sd config set scan.threads 8

# 자동 격리 활성화
sd config set quarantine.auto_quarantine true

# 휴리스틱 임계값을 50으로 설정 (더 민감하게)
sd config set scan.heuristic_threshold 50

# 제외 경로를 JSON 배열로 추가
sd config set scan.exclude_paths '["*.log", "/proc", "/sys"]'

# 업데이트 서버 URL 변경
sd config set update_server_url "https://custom-update.example.com/v1"
```

출력:

```
OK Set scan.max_file_size = 209715200 (이전값: 104857600)
```

::: tip
중첩 키는 점 표기법을 사용합니다. 예를 들어 `scan.max_file_size`는 `scan` 객체로 이동하여 `max_file_size` 필드를 설정합니다. 중간 객체가 존재하지 않으면 자동으로 생성됩니다.
:::

### 기본값으로 초기화

모든 설정을 공장 기본값으로 복원합니다:

```bash
sd config reset
```

출력:

```
OK 설정이 기본값으로 초기화되었습니다.
```

::: warning
설정 초기화는 시그니처 데이터베이스, YARA 규칙, 격리된 파일을 삭제하지 않습니다. `config.json` 파일만 기본값으로 초기화됩니다.
:::

## 설정 카테고리

설정은 네 가지 주요 섹션으로 구성됩니다:

| 섹션 | 목적 |
|---------|---------|
| `scan.*` | 파일 스캔 동작: 파일 크기 제한, 스레드, 시간 초과, 아카이브, 휴리스틱 |
| `monitor.*` | 실시간 모니터링: 블록 모드, 이벤트 채널 용량 |
| `quarantine.*` | 격리 저장소: 자동 격리, 최대 저장소 크기 |
| `update_server_url` | 시그니처 업데이트 서버 엔드포인트 |

모든 설정 키, 유형, 기본값, 설명에 대한 완전한 레퍼런스는 [설정 레퍼런스](./reference)를 참조하세요.

## 기본 설정

첫 실행 시 PRX-SD는 다음 기본 설정을 생성합니다:

```json
{
  "scan": {
    "max_file_size": 104857600,
    "threads": null,
    "timeout_per_file_ms": 30000,
    "scan_archives": true,
    "max_archive_depth": 3,
    "heuristic_threshold": 60,
    "exclude_paths": []
  },
  "monitor": {
    "block_mode": false,
    "channel_capacity": 4096
  },
  "update_server_url": "https://update.prx-sd.dev/v1",
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

주요 기본값:

- **최대 파일 크기:** 100 MiB (이보다 큰 파일은 건너뜀)
- **스레드:** `null` (CPU 코어 수 기반 자동 감지)
- **시간 초과:** 파일당 30초
- **아카이브:** 최대 3단계 중첩까지 스캔
- **휴리스틱 임계값:** 60 (점수 60 이상 = 악성, 30-59 = 의심)
- **블록 모드:** 비활성화됨 (모니터는 보고하지만 파일 접근을 차단하지 않음)
- **자동 격리:** 비활성화됨 (위협은 보고되지만 이동되지 않음)
- **저장소 크기 제한:** 1024 MiB

## 설정 파일 직접 편집

`~/.prx-sd/config.json`을 텍스트 편집기로 직접 편집할 수도 있습니다. PRX-SD는 각 명령 시작 시 파일을 읽으므로 변경 사항이 즉시 적용됩니다.

```bash
# 편집기에서 열기
$EDITOR ~/.prx-sd/config.json
```

파일이 유효한 JSON인지 확인하세요. 잘못된 형식이면 PRX-SD가 기본값으로 돌아가며 경고를 출력합니다.

## 데이터 디렉토리 구조

```
~/.prx-sd/
  config.json       # 엔진 설정
  signatures/       # LMDB 해시 시그니처 데이터베이스
  yara/             # 컴파일된 YARA 규칙 파일
  quarantine/       # AES-256-GCM 암호화된 격리 저장소
  adblock/          # 광고 차단 필터 목록 및 로그
  plugins/          # WASM 플러그인 디렉토리
  audit/            # 스캔 감사 로그 (JSONL)
  prx-sd.pid        # 데몬 PID 파일 (실행 중일 때)
```

## 다음 단계

- 모든 키, 유형, 기본값을 위한 [설정 레퍼런스](./reference) 참조
- 설정이 스캔에 미치는 영향을 이해하기 위한 [스캔](../scanning/file-scan) 학습
- [실시간 모니터링](../realtime/) 설정 및 `monitor.block_mode` 구성
- [격리](../quarantine/) 자동 격리 동작 설정
