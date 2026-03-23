---
title: 설정 레퍼런스
description: 유형, 기본값, 상세 설명을 포함한 모든 PRX-SD 설정 키의 완전한 레퍼런스.
---

# 설정 레퍼런스

이 페이지는 `~/.prx-sd/config.json`의 모든 설정 키를 문서화합니다. `sd config set <key> <value>`를 사용하여 설정을 수정하거나 JSON 파일을 직접 편집하세요.

## 스캔 설정 (`scan.*`)

스캔 엔진이 파일을 처리하는 방법을 제어하는 설정.

| 키 | 유형 | 기본값 | 설명 |
|-----|------|---------|-------------|
| `scan.max_file_size` | `integer` | `104857600` (100 MiB) | 최대 파일 크기(바이트). 이 값보다 큰 파일은 스캔 중 건너뜁니다. 제한을 비활성화하려면 `0`으로 설정합니다(권장하지 않음). |
| `scan.threads` | `integer \| null` | `null` (자동) | 병렬 스캐너 스레드 수. `null`이면 PRX-SD는 논리적 CPU 코어 수를 사용합니다. 병렬 처리를 제한하거나 늘리려면 특정 수를 지정합니다. |
| `scan.timeout_per_file_ms` | `integer` | `30000` (30초) | 단일 파일 스캔에 허용되는 최대 시간(밀리초). 초과하면 파일이 오류로 표시되고 다음 파일 스캔이 계속됩니다. |
| `scan.scan_archives` | `boolean` | `true` | 아카이브 파일(ZIP, tar.gz, 7z, RAR 등) 내부를 재귀적으로 스캔하고 내용을 스캔할지 여부. |
| `scan.max_archive_depth` | `integer` | `3` | 아카이브 재귀 시 최대 중첩 깊이. 예를 들어, ZIP 안의 ZIP 안의 ZIP은 깊이 3이 필요합니다. 압축 폭탄 공격을 방지합니다. |
| `scan.heuristic_threshold` | `integer` | `60` | 파일을 **악성**으로 표시하는 최소 휴리스틱 점수(0-100). 30과 이 임계값 사이의 점수를 받은 파일은 **의심**으로 표시됩니다. 낮은 값은 민감도를 높이지만 오탐지가 더 많을 수 있습니다. |
| `scan.exclude_paths` | `string[]` | `[]` | 스캔에서 제외할 글로브 패턴 또는 경로 접두사 목록. `*`(임의 문자) 및 `?`(단일 문자) 와일드카드를 지원합니다. |

### 예제

```bash
# 최대 파일 크기를 500 MiB로 늘리기
sd config set scan.max_file_size 524288000

# 정확히 4개의 스레드 사용
sd config set scan.threads 4

# 파일당 시간 초과를 60초로 늘리기
sd config set scan.timeout_per_file_ms 60000

# 아카이브 스캔 비활성화
sd config set scan.scan_archives false

# 아카이브 중첩 깊이를 5로 설정
sd config set scan.max_archive_depth 5

# 더 높은 민감도를 위해 휴리스틱 임계값 낮추기
sd config set scan.heuristic_threshold 40

# 경로 제외
sd config set scan.exclude_paths '["/proc", "/sys", "/dev", "*.log", "*.tmp"]'
```

## 모니터 설정 (`monitor.*`)

실시간 파일 시스템 모니터링(`sd monitor` 및 `sd daemon`)을 제어하는 설정.

| 키 | 유형 | 기본값 | 설명 |
|-----|------|---------|-------------|
| `monitor.block_mode` | `boolean` | `false` | `true`이면 fanotify 권한 이벤트(Linux 전용)를 사용하여 요청 프로세스가 읽기 전에 악성 파일에 대한 접근을 **차단**합니다. 루트 권한이 필요합니다. `false`이면 파일이 생성/수정 후 스캔되고 위협이 보고되지만 차단되지 않습니다. |
| `monitor.channel_capacity` | `integer` | `4096` | 파일 시스템 감시자와 스캐너 사이의 내부 이벤트 채널 버퍼 크기. 높은 파일 시스템 활동에서 "채널 가득 참" 경고가 표시되면 이 값을 늘리세요. |

### 예제

```bash
# 블록 모드 활성화 (root 필요)
sd config set monitor.block_mode true

# 바쁜 서버를 위해 채널 버퍼 늘리기
sd config set monitor.channel_capacity 16384
```

::: warning
블록 모드(`monitor.block_mode = true`)는 Linux fanotify 권한 이벤트를 사용합니다. 다음이 필요합니다:
- 루트 권한
- `CONFIG_FANOTIFY_ACCESS_PERMISSIONS`가 활성화된 Linux 커널
- 루트로 실행되는 PRX-SD 데몬

macOS 및 Windows에서는 블록 모드를 사용할 수 없으며 이 설정이 무시됩니다.
:::

## 업데이트 설정

| 키 | 유형 | 기본값 | 설명 |
|-----|------|---------|-------------|
| `update_server_url` | `string` | `null` | 시그니처 업데이트 서버 URL. 엔진이 업데이트를 확인하기 위해 `<url>/manifest.json`을 가져옵니다. 사설 미러 또는 에어갭 업데이트 서버를 사용하려면 재정의하세요. |

### 예제

```bash
# 사설 미러 사용
sd config set update_server_url "https://internal-mirror.example.com/prx-sd/v1"

# 공식 서버로 초기화
sd config set update_server_url null
```

## 격리 설정 (`quarantine.*`)

암호화된 격리 저장소를 제어하는 설정.

| 키 | 유형 | 기본값 | 설명 |
|-----|------|---------|-------------|
| `quarantine.auto_quarantine` | `boolean` | `false` | `true`이면 스캔 중 **악성**으로 탐지된 파일을 자동으로 격리 저장소로 이동합니다. `false`이면 위협이 보고되지만 파일은 그대로 유지됩니다. |
| `quarantine.max_vault_size_mb` | `integer` | `1024` (1 GiB) | 격리 저장소의 최대 총 크기(MiB). 이 한도에 도달하면 이전 항목이 삭제될 때까지 새 파일을 격리할 수 없습니다. |

### 예제

```bash
# 자동 격리 활성화
sd config set quarantine.auto_quarantine true

# 저장소 크기를 5 GiB로 늘리기
sd config set quarantine.max_vault_size_mb 5120

# 자동 격리 비활성화 (보고만)
sd config set quarantine.auto_quarantine false
```

## 완전한 기본 설정

참고로 전체 기본 설정입니다:

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
  "update_server_url": null,
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

## 값 파싱 규칙

`sd config set`을 사용할 때 값은 다음 순서로 자동 파싱됩니다:

1. **불리언** -- `true` 또는 `false`
2. **Null** -- `null`
3. **정수** -- 예: `42`, `104857600`
4. **부동소수점** -- 예: `3.14`
5. **JSON 배열/객체** -- 예: `'["/proc", "*.log"]'`, `'{"key": "value"}'`
6. **문자열** -- 그 외, 예: `"https://example.com"`

::: tip
배열이나 객체를 설정할 때 셸 확장을 방지하기 위해 값을 작은따옴표로 감쌉니다:
```bash
sd config set scan.exclude_paths '["*.log", "/proc", "/sys"]'
```
:::

## 관련 명령어

| 명령어 | 설명 |
|---------|-------------|
| `sd config show` | 현재 설정 표시 |
| `sd config set <key> <value>` | 설정 값 지정 |
| `sd config reset` | 모든 설정을 기본값으로 초기화 |
| `sd policy show` | 수정 정책 표시 |
| `sd policy set <key> <value>` | 수정 정책 값 지정 |
| `sd policy reset` | 수정 정책을 기본값으로 초기화 |

## 다음 단계

- 일반 소개를 위한 [설정 개요](./index)로 돌아가기
- `scan.*` 설정이 [파일 스캔](../scanning/file-scan)에 미치는 영향 알아보기
- `monitor.*` 설정으로 [실시간 모니터링](../realtime/) 구성
- 자동 격리로 [격리](../quarantine/) 설정
