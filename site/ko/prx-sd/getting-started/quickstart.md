---
title: 빠른 시작
description: 5분 안에 PRX-SD로 악성코드 스캔을 시작하세요. 설치, 시그니처 업데이트, 파일 스캔, 결과 검토, 실시간 모니터링 활성화.
---

# 빠른 시작

이 가이드는 5분 이내에 첫 번째 악성코드 스캔을 완료하도록 안내합니다. 완료 후 PRX-SD가 설치되고, 시그니처가 업데이트되며, 실시간 모니터링이 실행됩니다.

::: tip 필수 요건
`curl`이 설치된 Linux 또는 macOS 시스템이 필요합니다. 다른 방법 및 플랫폼 세부 정보는 [설치 가이드](./installation)를 참조하세요.
:::

## 1단계: PRX-SD 설치

설치 스크립트로 최신 릴리스를 다운로드하고 설치합니다:

```bash
curl -fsSL https://openprx.dev/install-sd.sh | bash
```

설치를 확인합니다:

```bash
sd --version
```

다음과 같은 출력이 표시되어야 합니다:

```
prx-sd 0.5.0
```

## 2단계: 시그니처 데이터베이스 업데이트

PRX-SD에는 내장 블록리스트가 포함되어 있지만 완전한 보호를 위해 최신 위협 인텔리전스를 다운로드해야 합니다. `update` 명령어는 설정된 모든 소스에서 해시 시그니처와 YARA 규칙을 가져옵니다:

```bash
sd update
```

예상 출력:

```
[INFO] 해시 시그니처 업데이트 중...
[INFO]   MalwareBazaar: 12,847개 해시 (최근 48시간)
[INFO]   URLhaus: 8,234개 해시
[INFO]   Feodo Tracker: 1,456개 해시
[INFO]   ThreatFox: 5,891개 해시
[INFO] YARA 규칙 업데이트 중...
[INFO]   내장 규칙: 64개
[INFO]   Yara-Rules/rules: 12,400개
[INFO]   Neo23x0/signature-base: 8,200개
[INFO]   ReversingLabs: 9,500개
[INFO]   ESET IOC: 3,800개
[INFO]   InQuest: 4,836개
[INFO] 시그니처 데이터베이스가 성공적으로 업데이트되었습니다.
[INFO] 합계: 28,428개 해시, 38,800개 YARA 규칙
```

::: tip 전체 업데이트
VirusShare 데이터베이스(20M+ MD5 해시)를 포함하려면 다음을 실행하세요:
```bash
sd update --full
```
시간이 더 걸리지만 최대 해시 커버리지를 제공합니다.
:::

## 3단계: 파일 또는 디렉토리 스캔

단일 의심스러운 파일을 스캔합니다:

```bash
sd scan /path/to/suspicious_file
```

전체 디렉토리를 재귀적으로 스캔합니다:

```bash
sd scan /home --recursive
```

깨끗한 디렉토리의 예상 출력:

```
PRX-SD 스캔 보고서
==================
스캔된 파일: 1,847개
위협: 0개
상태:  CLEAN

소요 시간: 2.3s
```

위협이 발견된 경우의 예상 출력:

```
PRX-SD 스캔 보고서
==================
스캔된 파일: 1,847개
위협: 2개

  [MALICIOUS] /home/user/downloads/invoice.exe
    매치: SHA-256 해시 (MalwareBazaar)
    패밀리: Emotet
    조치: 없음 (격리하려면 --auto-quarantine 사용)

  [SUSPICIOUS] /home/user/downloads/tool.bin
    매치: 휴리스틱 분석
    점수: 45/100
    발견: 높은 엔트로피 (7.8), UPX 패킹됨
    조치: 없음

소요 시간: 3.1s
```

## 4단계: 결과 검토 및 조치

자동화 또는 로그 수집에 적합한 상세 JSON 보고서:

```bash
sd scan /home --recursive --json
```

```json
{
  "scan_id": "a1b2c3d4",
  "timestamp": "2026-03-21T10:00:00Z",
  "files_scanned": 1847,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "detection_layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924..."
    }
  ],
  "duration_ms": 3100
}
```

스캔 중 탐지된 위협을 자동으로 격리하려면:

```bash
sd scan /home --recursive --auto-quarantine
```

격리된 파일은 안전하고 암호화된 디렉토리로 이동됩니다. 목록을 확인하고 복원할 수 있습니다:

```bash
# 격리된 파일 목록 조회
sd quarantine list

# 격리 ID로 파일 복원
sd quarantine restore QR-20260321-001
```

::: warning 격리
격리된 파일은 암호화되어 실수로 실행될 수 없습니다. 파일이 오탐지임을 확인한 경우에만 `sd quarantine restore`를 사용하세요.
:::

## 5단계: 실시간 모니터링 활성화

새로 생성되거나 수정된 파일을 감시하는 실시간 모니터를 시작합니다:

```bash
sd monitor /home /tmp /var/www
```

모니터는 포그라운드에서 실행되며 파일이 생성되거나 변경될 때 스캔합니다:

```
[INFO] 3개 디렉토리 모니터링 중...
[INFO] 중지하려면 Ctrl+C를 누르세요.
[2026-03-21 10:05:32] SCAN /home/user/downloads/update.bin → CLEAN
[2026-03-21 10:07:15] SCAN /tmp/payload.sh → [MALICIOUS] YARA: linux_backdoor_reverse_shell
```

백그라운드 서비스로 모니터를 실행하려면:

```bash
# systemd 서비스 설치 및 시작
sd service install
sd service start

# 서비스 상태 확인
sd service status
```

## 현재 상태

이 단계를 완료하면 시스템에 다음이 설치됩니다:

| 구성 요소 | 상태 |
|-----------|--------|
| `sd` 바이너리 | PATH에 설치됨 |
| 해시 데이터베이스 | LMDB에 28,000개 이상의 SHA-256/MD5 해시 |
| YARA 규칙 | 8개 소스의 38,800개 이상의 규칙 |
| 실시간 모니터 | 지정된 디렉토리 감시 중 |

## 다음 단계

- [파일 및 디렉토리 스캔](../scanning/file-scan) -- 스레드, 제외, 크기 제한을 포함한 모든 `sd scan` 옵션 탐색
- [메모리 스캔](../scanning/memory-scan) -- 메모리 내 위협에 대한 실행 중인 프로세스 메모리 스캔
- [루트킷 탐지](../scanning/rootkit) -- 커널 및 사용자 공간 루트킷 확인
- [탐지 엔진](../detection/) -- 다층 파이프라인 작동 방식 이해
- [YARA 규칙](../detection/yara-rules) -- 규칙 소스 및 사용자 정의 규칙에 대해 알아보기
