---
title: 루트킷 탐지
description: sd check-rootkit을 사용하여 Linux에서 커널 및 사용자 공간 루트킷 탐지. 숨겨진 프로세스, 커널 모듈, 시스템 콜 훅 등 확인.
---

# 루트킷 탐지

`sd check-rootkit` 명령어는 커널 레벨 및 사용자 공간 루트킷을 탐지하기 위한 심층 시스템 무결성 검사를 수행합니다. 루트킷은 표준 시스템 도구에서 자신의 존재를 숨기기 때문에 가장 위험한 악성코드 유형 중 하나입니다.

::: warning 요구 사항
- **루트 권한 필요** -- 루트킷 탐지는 커널 데이터 구조와 시스템 내부를 읽습니다.
- **Linux 전용** -- 이 기능은 `/proc`, `/sys`, Linux 특정 커널 인터페이스에 의존합니다.
:::

## 탐지 항목

PRX-SD는 여러 벡터에서 루트킷 존재를 확인합니다:

### 커널 레벨 검사

| 검사 | 설명 |
|-------|-------------|
| 숨겨진 커널 모듈 | `/proc/modules`의 로드된 모듈을 `sysfs` 항목과 비교하여 불일치 찾기 |
| 시스템 콜 테이블 훅 | 알려진 양호한 커널 심볼에 대해 syscall 테이블 항목 확인 |
| `/proc` 불일치 | `/proc`에서 숨겨지지만 다른 인터페이스를 통해 볼 수 있는 프로세스 탐지 |
| 커널 심볼 변조 | 주요 커널 구조의 수정된 함수 포인터 확인 |
| 인터럽트 디스크립터 테이블 | 예상치 못한 수정을 위한 IDT 항목 확인 |

### 사용자 공간 검사

| 검사 | 설명 |
|-------|-------------|
| 숨겨진 프로세스 | `readdir(/proc)` 결과와 무차별 PID 열거 상호 참조 |
| LD_PRELOAD 주입 | `LD_PRELOAD` 또는 `/etc/ld.so.preload`를 통해 로드된 악성 공유 라이브러리 확인 |
| 바이너리 교체 | 중요한 시스템 바이너리 무결성 확인 (`ls`, `ps`, `netstat`, `ss`, `lsof`) |
| 숨겨진 파일 | `getdents` syscall을 가로채어 숨겨진 파일 탐지 |
| 의심스러운 cron 항목 | 난독화되거나 인코딩된 명령어에 대한 crontab 스캔 |
| Systemd 서비스 변조 | 비인가 또는 수정된 systemd 유닛 확인 |
| SSH 백도어 | 비인가 SSH 키, 수정된 `sshd_config`, 백도어된 `sshd` 바이너리 찾기 |
| 네트워크 리스너 | `ss`/`netstat`에 표시되지 않는 숨겨진 네트워크 소켓 식별 |

## 기본 사용법

전체 루트킷 검사 실행:

```bash
sudo sd check-rootkit
```

예제 출력:

```
PRX-SD 루트킷 검사
====================
시스템: Linux 6.12.48 x86_64
검사: 14개 수행

커널 검사:
  [PASS] 커널 모듈 목록 일관성
  [PASS] 시스템 콜 테이블 무결성
  [PASS] /proc 파일시스템 일관성
  [PASS] 커널 심볼 확인
  [PASS] 인터럽트 디스크립터 테이블

사용자 공간 검사:
  [PASS] 숨겨진 프로세스 탐지
  [WARN] LD_PRELOAD 검사
    /etc/ld.so.preload에 항목 존재: /usr/lib/libfakeroot.so
  [PASS] 중요 바이너리 무결성
  [PASS] 숨겨진 파일 탐지
  [PASS] Cron 항목 감사
  [PASS] Systemd 서비스 감사
  [PASS] SSH 설정 확인
  [PASS] 네트워크 리스너 확인
  [PASS] /dev 의심스러운 항목

요약: 13개 통과, 1개 경고, 0개 심각
```

## 명령어 옵션

| 옵션 | 축약 | 기본값 | 설명 |
|--------|-------|---------|-------------|
| `--json` | `-j` | 끄기 | JSON 형식으로 결과 출력 |
| `--kernel-only` | | 끄기 | 커널 레벨 검사만 실행 |
| `--userspace-only` | | 끄기 | 사용자 공간 검사만 실행 |
| `--baseline` | | 없음 | 비교를 위한 기준선 파일 경로 |
| `--save-baseline` | | 없음 | 현재 상태를 기준선으로 저장 |

## 기준선 비교

지속적인 모니터링을 위해 알려진 양호한 시스템 상태의 기준선을 만들고 향후 검사에서 비교합니다:

```bash
# 알려진 깨끗한 시스템에서 기준선 만들기
sudo sd check-rootkit --save-baseline /etc/prx-sd/rootkit-baseline.json

# 향후 검사에서 기준선과 비교
sudo sd check-rootkit --baseline /etc/prx-sd/rootkit-baseline.json
```

기준선은 커널 모듈 목록, syscall 테이블 해시, 중요 바이너리 체크섬, 네트워크 리스너 상태를 기록합니다. 어떤 편차도 알림을 트리거합니다.

## JSON 출력

```bash
sudo sd check-rootkit --json
```

```json
{
  "timestamp": "2026-03-21T16:00:00Z",
  "system": {
    "kernel": "6.12.48",
    "arch": "x86_64",
    "hostname": "web-server-01"
  },
  "checks": [
    {
      "name": "kernel_modules",
      "category": "kernel",
      "status": "pass",
      "details": "142개 모듈, 모두 일관됨"
    },
    {
      "name": "ld_preload",
      "category": "userspace",
      "status": "warning",
      "details": "/etc/ld.so.preload 포함: /usr/lib/libfakeroot.so",
      "recommendation": "이 항목이 예상된 것인지 확인하세요. 비인가 시 제거하세요."
    }
  ],
  "summary": {
    "total": 14,
    "passed": 13,
    "warnings": 1,
    "critical": 0
  }
}
```

## 예제: 커널 모듈 루트킷 탐지

루트킷이 커널 모듈을 숨길 때 `sd check-rootkit`이 불일치를 탐지합니다:

```
커널 검사:
  [CRITICAL] 커널 모듈 목록 일관성
    /sys/module/에서 발견되었지만 /proc/modules에서 누락:
      - syskit (크기: 45056, 로드 위치: 0xffffffffc0a00000)
    이것은 숨겨진 커널 모듈 루트킷의 강력한 지표입니다.
    권장 사항: 신뢰할 수 있는 미디어에서 부팅하고 조사하세요.
```

::: warning 심각 발견 사항
루트킷 검사기의 `CRITICAL` 발견 사항은 심각한 보안 인시던트로 취급해야 합니다. 잠재적으로 손상된 시스템에서 수정을 시도하지 마세요. 대신 머신을 격리하고 신뢰할 수 있는 미디어에서 조사하세요.
:::

## 정기적인 검사 예약

모니터링 루틴에 루트킷 검사 추가:

```bash
# Cron: 4시간마다 검사
0 */4 * * * root /usr/local/bin/sd check-rootkit --json >> /var/log/prx-sd/rootkit-check.log 2>&1
```

## 다음 단계

- [메모리 스캔](./memory-scan) -- 실행 중인 프로세스에서 메모리 내 위협 탐지
- [파일 및 디렉토리 스캔](./file-scan) -- 전통적인 파일 기반 스캔
- [USB 스캔](./usb-scan) -- 연결 시 이동식 미디어 스캔
- [탐지 엔진](../detection/) -- 모든 탐지 레이어 개요
