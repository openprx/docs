---
title: 프로세스 메모리 스캔
description: sd scan-memory를 사용하여 메모리 내 악성코드, 파일리스 위협, 주입된 코드를 위한 실행 중인 프로세스 메모리 스캔.
---

# 프로세스 메모리 스캔

`sd scan-memory` 명령어는 실행 중인 프로세스의 메모리를 스캔하여 디스크에 닿지 않는 파일리스 악성코드, 주입된 셸코드, 메모리 내 위협을 탐지합니다. 이는 전통적인 파일 기반 스캔을 회피하는 고급 위협을 잡는 데 필수적입니다.

::: warning 요구 사항
- **루트 권한 필요** -- 메모리 스캔은 `/proc/<pid>/mem`을 읽어야 하며 root 또는 `CAP_SYS_PTRACE`가 필요합니다.
- **Linux 전용** -- 프로세스 메모리 스캔은 현재 Linux에서만 지원됩니다. macOS 지원이 계획되어 있습니다.
:::

## 작동 방식

프로세스 메모리 스캔은 실행 중인 프로세스의 가상 메모리 매핑을 읽고 파일 스캔에 사용되는 동일한 탐지 파이프라인을 적용합니다:

1. **메모리 영역 열거** -- `/proc/<pid>/maps`를 파싱하여 읽을 수 있는 메모리 세그먼트(힙, 스택, 익명 매핑, 매핑된 파일)를 찾습니다.
2. **메모리 내용 읽기** -- `/proc/<pid>/mem`에서 각 영역을 읽습니다.
3. **YARA 규칙 스캔** -- 메모리에서 셸코드 패턴, 주입된 DLL, 알려진 악성코드 시그니처를 탐지하기 위해 최적화된 메모리 내 YARA 규칙을 적용합니다.
4. **패턴 분석** -- RWX 메모리 영역, 파일 기반이 아닌 매핑의 PE 헤더, 알려진 익스플로잇 페이로드 같은 의심스러운 패턴을 확인합니다.

## 기본 사용법

모든 실행 중인 프로세스 스캔:

```bash
sudo sd scan-memory
```

PID로 특정 프로세스 스캔:

```bash
sudo sd scan-memory --pid 1234
```

여러 특정 프로세스 스캔:

```bash
sudo sd scan-memory --pid 1234 --pid 5678 --pid 9012
```

## 명령어 옵션

| 옵션 | 축약 | 기본값 | 설명 |
|--------|-------|---------|-------------|
| `--pid` | `-p` | 모두 | 지정된 프로세스 ID만 스캔 (반복 가능) |
| `--json` | `-j` | 끄기 | JSON 형식으로 결과 출력 |
| `--exclude-pid` | | 없음 | 스캔에서 특정 PID 제외 |
| `--exclude-user` | | 없음 | 특정 사용자가 소유한 프로세스 제외 |
| `--min-region-size` | | 4096 | 스캔할 최소 메모리 영역 크기 (바이트) |
| `--skip-mapped-files` | | 끄기 | 파일 기반 메모리 영역 건너뜀 |

## 출력 예제

```bash
sudo sd scan-memory
```

```
PRX-SD 메모리 스캔 보고서
=========================
스캔된 프로세스: 142개
스캔된 메모리 영역: 8,451개
총 스캔된 메모리: 4.2 GB

  [MALICIOUS] PID 3847 (svchost)
    영역:  0x7f4a00000000-0x7f4a00040000 (익명, RWX)
    매치:   YARA 규칙: memory_cobalt_strike_beacon
    세부 정보: 익명 RWX 매핑에서 CobaltStrike Beacon 셸코드 탐지

  [SUSPICIOUS] PID 12045 (python3)
    영역:  0x7f8b10000000-0x7f8b10010000 (익명, RWX)
    매치:   패턴 분석
    세부 정보: 익명 RWX 영역의 실행 가능 코드, 가능한 셸코드 주입

소요 시간: 12.4s
```

### JSON 출력

```bash
sudo sd scan-memory --pid 3847 --json
```

```json
{
  "scan_type": "memory",
  "timestamp": "2026-03-21T15:00:00Z",
  "processes_scanned": 1,
  "regions_scanned": 64,
  "threats": [
    {
      "pid": 3847,
      "process_name": "svchost",
      "region_start": "0x7f4a00000000",
      "region_end": "0x7f4a00040000",
      "region_perms": "rwx",
      "region_type": "anonymous",
      "verdict": "malicious",
      "rule": "memory_cobalt_strike_beacon",
      "description": "CobaltStrike Beacon shellcode detected"
    }
  ]
}
```

## 사용 사례

### 인시던트 대응

활성 조사 중에 모든 프로세스를 스캔하여 손상된 서비스 찾기:

```bash
sudo sd scan-memory --json > /evidence/memory-scan-$(date +%s).json
```

### 파일리스 악성코드 탐지

현대 악성코드는 종종 디스크에 쓰지 않고 완전히 메모리에서 실행됩니다. 일반적인 기술에는 다음이 포함됩니다:

- **프로세스 주입** -- 악성코드가 `ptrace` 또는 `/proc/pid/mem` 쓰기를 사용하여 합법적인 프로세스에 코드 주입
- **반사적 DLL 로딩** -- 파일시스템을 건드리지 않고 메모리에서 DLL 로드
- **셸코드 실행** -- 원시 셸코드가 RWX 메모리에 할당되어 직접 실행

`sd scan-memory`는 다음을 찾아 이러한 패턴을 탐지합니다:

| 지표 | 설명 |
|-----------|-------------|
| RWX 익명 매핑 | 파일 기반이 아닌 메모리의 실행 가능 코드 |
| 메모리의 PE 헤더 | Linux 프로세스 메모리의 Windows PE 구조 (크로스플랫폼 페이로드) |
| 알려진 셸코드 시그니처 | Metasploit, CobaltStrike, Sliver 비콘 패턴 |
| 의심스러운 syscall 스텁 | 후킹되거나 패치된 syscall 진입점 |

### 서버 상태 확인

프로덕션 서버에서 주기적인 메모리 스캔 실행:

```bash
# cron에 추가: 6시간마다 스캔
0 */6 * * * root /usr/local/bin/sd scan-memory --json --exclude-user nobody >> /var/log/prx-sd/memory-scan.log 2>&1
```

::: tip 성능 영향
메모리 스캔은 프로세스 메모리를 읽으며 I/O를 잠깐 증가시킬 수 있습니다. 프로덕션 서버에서는 낮은 트래픽 기간에 스캔하거나 비핵심 프로세스를 제외하는 것을 고려하세요.
:::

## 한계

- 메모리 스캔은 스캔 시점에 프로세스 메모리의 스냅샷을 읽습니다. 빠르게 변하는 메모리 영역은 불완전한 결과를 낼 수 있습니다.
- 커널 메모리는 `scan-memory`로 스캔되지 않습니다. 커널 레벨 위협 탐지에는 `sd check-rootkit`을 사용하세요.
- 심하게 난독화되거나 암호화된 메모리 내 페이로드는 YARA 규칙을 회피할 수 있습니다. 패턴 분석 레이어가 보조 탐지 메커니즘을 제공합니다.

## 다음 단계

- [루트킷 탐지](./rootkit) -- 커널 및 사용자 공간 루트킷 탐지
- [파일 및 디렉토리 스캔](./file-scan) -- 전통적인 파일 기반 스캔
- [YARA 규칙](../detection/yara-rules) -- 메모리 스캔에 사용되는 규칙 엔진 이해
- [탐지 엔진](../detection/) -- 모든 탐지 레이어가 함께 작동하는 방식
