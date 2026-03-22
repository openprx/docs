---
title: 파일 및 디렉토리 스캔
description: sd scan 명령어 완전 레퍼런스. 해시 매칭, YARA 규칙, 휴리스틱 분석으로 악성코드를 위한 파일 및 디렉토리 스캔.
---

# 파일 및 디렉토리 스캔

`sd scan` 명령어는 파일과 디렉토리에서 악성코드를 검사하는 기본 방법입니다. 모든 파일을 다층 탐지 파이프라인 -- 해시 매칭, YARA 규칙, 휴리스틱 분석 -- 을 통해 실행하고 각 파일에 대한 판정을 보고합니다.

## 기본 사용법

단일 파일 스캔:

```bash
sd scan /path/to/file
```

디렉토리 스캔 (기본적으로 비재귀):

```bash
sd scan /home/user/downloads
```

디렉토리와 모든 하위 디렉토리 스캔:

```bash
sd scan /home --recursive
```

## 명령어 옵션

| 옵션 | 축약 | 기본값 | 설명 |
|--------|-------|---------|-------------|
| `--recursive` | `-r` | 끄기 | 하위 디렉토리 재귀 |
| `--json` | `-j` | 끄기 | JSON 형식으로 결과 출력 |
| `--threads` | `-t` | CPU 코어 수 | 병렬 스캔 스레드 수 |
| `--auto-quarantine` | `-q` | 끄기 | 탐지된 위협 자동 격리 |
| `--remediate` | | 끄기 | 자동 수정 시도 (정책 기반 삭제/격리) |
| `--exclude` | `-e` | 없음 | 파일 또는 디렉토리를 제외하는 글로브 패턴 |
| `--report` | | 없음 | 파일 경로에 스캔 보고서 저장 |
| `--max-size-mb` | | 100 | 이 크기(MB)보다 큰 파일 건너뜀 |
| `--no-yara` | | 끄기 | YARA 규칙 스캔 건너뜀 |
| `--no-heuristics` | | 끄기 | 휴리스틱 분석 건너뜀 |
| `--min-severity` | | `suspicious` | 보고할 최소 심각도 (`suspicious` 또는 `malicious`) |

## 탐지 흐름

`sd scan`이 파일을 처리할 때 순서대로 탐지 파이프라인을 통과합니다:

```
파일 → 매직 넘버 탐지 → 파일 유형 결정
  │
  ├─ 레이어 1: SHA-256 해시 조회 (LMDB)
  │   히트 → MALICIOUS (즉시, 파일당 ~1μs)
  │
  ├─ 레이어 2: YARA-X 규칙 스캔 (38,800개 이상의 규칙)
  │   히트 → 규칙 이름과 함께 MALICIOUS
  │
  ├─ 레이어 3: 휴리스틱 분석 (파일 유형별)
  │   점수 ≥ 60 → MALICIOUS
  │   점수 30-59 → SUSPICIOUS
  │   점수 < 30 → CLEAN
  │
  └─ 결과 집계 → 최고 심각도 우선
```

파이프라인은 단락됩니다: 해시 매치가 발견되면 해당 파일에 대한 YARA 및 휴리스틱 분석이 건너뜁니다. 이로 인해 대형 디렉토리 스캔이 빠릅니다 -- 대부분의 깨끗한 파일이 마이크로초 단위로 해시 레이어에서 해결됩니다.

## 출력 형식

### 사람이 읽을 수 있는 형식 (기본값)

```bash
sd scan /home/user/downloads --recursive
```

```
PRX-SD 스캔 보고서
==================
스캔됨: 3,421개 파일 (1.2 GB)
건너뜀: 14개 파일 (최대 크기 초과)
위협: 3개 (악성 2개, 의심 1개)

  [MALICIOUS] /home/user/downloads/invoice.exe
    레이어:   해시 매치 (SHA-256)
    소스:  MalwareBazaar
    패밀리:  Emotet
    SHA-256: e3b0c44298fc1c149afbf4c8996fb924...

  [MALICIOUS] /home/user/downloads/patch.scr
    레이어:   YARA 규칙
    규칙:    win_ransomware_lockbit3
    소스:  ReversingLabs

  [SUSPICIOUS] /home/user/downloads/updater.bin
    레이어:   휴리스틱 분석
    점수:   42/100
    발견:
      - 높은 섹션 엔트로피: 7.91 (패킹됨)
      - 의심스러운 API 임포트: VirtualAllocEx, WriteProcessMemory
      - 비표준 PE 타임스탬프

소요 시간: 5.8s (589파일/s)
```

### JSON 출력

```bash
sd scan /path --recursive --json
```

```json
{
  "scan_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2026-03-21T14:30:00Z",
  "files_scanned": 3421,
  "files_skipped": 14,
  "total_bytes": 1288490188,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
      "md5": "d41d8cd98f00b204e9800998ecf8427e"
    }
  ],
  "duration_ms": 5800,
  "throughput_files_per_sec": 589
}
```

### 보고서 파일

보관을 위해 결과를 파일에 저장:

```bash
sd scan /srv/web --recursive --report /var/log/prx-sd/scan-report.json
```

## 제외 패턴

`--exclude`를 사용하여 글로브 패턴과 일치하는 파일이나 디렉토리를 건너뜁니다. 여러 패턴을 지정할 수 있습니다:

```bash
sd scan /home --recursive \
  --exclude "*.log" \
  --exclude "node_modules/**" \
  --exclude ".git/**" \
  --exclude "/home/user/VMs/**"
```

::: tip 성능
`node_modules`, `.git`, 가상 머신 이미지 같은 대형 디렉토리를 제외하면 스캔 속도가 크게 향상됩니다.
:::

## 자동 격리

`--auto-quarantine` 플래그는 스캔 중 탐지된 위협을 격리 저장소로 이동합니다:

```bash
sd scan /tmp --recursive --auto-quarantine
```

```
[MALICIOUS] /tmp/dropper.exe → 격리됨 (QR-20260321-007)
```

격리된 파일은 AES-256으로 암호화되어 `~/.local/share/prx-sd/quarantine/`에 저장됩니다. 실수로 실행될 수 없습니다. 자세한 내용은 [격리 문서](../quarantine/)를 참조하세요.

## 예제 시나리오

### CI/CD 파이프라인 스캔

배포 전 빌드 아티팩트 스캔:

```bash
sd scan ./dist --recursive --json --min-severity suspicious
```

자동화를 위한 종료 코드 사용: `0` = 깨끗, `1` = 위협 발견, `2` = 스캔 오류.

### 웹 서버 일간 스캔

웹 접근 가능한 디렉토리의 야간 스캔 예약:

```bash
sd scan /var/www /srv/uploads --recursive \
  --auto-quarantine \
  --report /var/log/prx-sd/daily-$(date +%Y%m%d).json \
  --exclude "*.log"
```

### 포렌식 조사

읽기 전용으로 마운트된 디스크 이미지 스캔:

```bash
sudo mount -o ro /dev/sdb1 /mnt/evidence
sd scan /mnt/evidence --recursive --json --threads 1 --max-size-mb 500
```

::: warning 대형 스캔
수백만 개의 파일을 스캔할 때 `--threads`를 사용하여 리소스 사용량을 제어하고 `--max-size-mb`를 사용하여 스캔을 느리게 할 수 있는 대형 파일을 건너뛰세요.
:::

### 홈 디렉토리 빠른 확인

일반적인 위협 위치의 빠른 스캔:

```bash
sd scan ~/Downloads ~/Desktop /tmp --recursive
```

## 성능 튜닝

| 파일 수 | 대략적인 시간 | 참고 |
|-------|-------------------|-------|
| 1,000개 | < 1초 | 해시 레이어가 대부분의 파일 해결 |
| 10,000개 | 2-5초 | YARA 규칙이 파일당 ~0.3ms 추가 |
| 100,000개 | 20-60초 | 파일 크기 및 유형에 따라 다름 |
| 1,000,000개+ | 5-15분 | `--threads`와 `--exclude` 사용 |

스캔 속도에 영향을 미치는 요인:

- **디스크 I/O** -- SSD는 무작위 읽기에서 HDD보다 5-10배 빠름
- **파일 크기 분포** -- 많은 작은 파일이 몇 개의 큰 파일보다 빠름
- **탐지 레이어** -- 해시 전용 스캔(`--no-yara --no-heuristics`)이 가장 빠름
- **스레드 수** -- 빠른 저장소를 가진 멀티코어 시스템에서 더 많은 스레드가 도움

## 다음 단계

- [메모리 스캔](./memory-scan) -- 실행 중인 프로세스 메모리 스캔
- [루트킷 탐지](./rootkit) -- 커널 레벨 위협 확인
- [USB 스캔](./usb-scan) -- 이동식 미디어 스캔
- [탐지 엔진](../detection/) -- 각 탐지 레이어 작동 방식
