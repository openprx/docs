---
title: 격리 관리
description: "AES-256-GCM 암호화 저장소로 격리된 위협 관리, 파일 복원, 격리 통계 검토."
---

# 격리 관리

PRX-SD가 위협을 탐지하면 암호화된 격리 저장소에 파일을 격리할 수 있습니다. 격리된 파일은 AES-256-GCM으로 암호화되고, 이름이 변경되며, 실수로 실행될 수 없는 보안 디렉토리로 이동됩니다. 모든 원본 메타데이터는 포렌식 분석을 위해 보존됩니다.

## 격리 작동 방식

```
위협 탐지됨
  1. 임의 AES-256-GCM 키 생성
  2. 파일 내용 암호화
  3. 암호화된 blob을 vault.bin에 저장
  4. 메타데이터(원본 경로, 해시, 탐지 정보)를 JSON으로 저장
  5. 디스크에서 원본 파일 삭제
  6. 격리 이벤트 로깅
```

격리 저장소는 `~/.prx-sd/quarantine/`에 저장됩니다:

```
~/.prx-sd/quarantine/
  vault.bin                    # 암호화된 파일 저장소 (추가 전용)
  index.json                   # 메타데이터와 함께 격리 인덱스
  entries/
    a1b2c3d4.json             # 항목별 메타데이터
    e5f6g7h8.json
```

각 격리 항목에는 다음이 포함됩니다:

```json
{
  "id": "a1b2c3d4",
  "original_path": "/tmp/payload.exe",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
  "file_size": 245760,
  "detection": {
    "engine": "yara",
    "rule": "Win_Trojan_AgentTesla",
    "severity": "malicious"
  },
  "quarantined_at": "2026-03-21T10:15:32Z",
  "vault_offset": 1048576,
  "vault_length": 245792
}
```

::: tip
격리 저장소는 인증된 암호화(AES-256-GCM)를 사용합니다. 이는 격리된 악성코드의 우발적인 실행과 증거 변조를 모두 방지합니다.
:::

## 격리된 파일 목록

```bash
sd quarantine list [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|------|-------|---------|-------------|
| `--json` | | `false` | JSON으로 출력 |
| `--sort` | `-s` | `date` | 정렬 기준: `date`, `name`, `size`, `severity` |
| `--filter` | `-f` | | 심각도별 필터링: `malicious`, `suspicious` |
| `--limit` | `-n` | 전체 | 표시할 최대 항목 수 |

### 예제

```bash
sd quarantine list
```

```
격리 저장소 (4개 항목, 1.2 MB)

ID        날짜                 크기     심각도     탐지                   원본 경로
a1b2c3d4  2026-03-21 10:15:32  240 KB   악성       Win_Trojan_AgentTesla  /tmp/payload.exe
e5f6g7h8  2026-03-20 14:22:01  512 KB   악성       Ransom_LockBit3       /home/user/doc.pdf.lockbit
c9d0e1f2  2026-03-19 09:45:18  32 KB    의심스러움  Suspicious_Script     /var/www/upload/shell.php
b3a4c5d6  2026-03-18 16:30:55  384 KB   악성       SHA256_Match          /tmp/dropper.bin
```

## 파일 복원

격리된 파일을 원래 위치 또는 지정된 경로로 복원합니다:

```bash
sd quarantine restore <ID> [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|------|-------|---------|-------------|
| `--to` | `-t` | 원본 경로 | 다른 위치로 복원 |
| `--force` | `-f` | `false` | 대상이 존재하면 덮어쓰기 |

::: warning
격리된 파일을 복원하면 알려진 악성 또는 의심스러운 파일이 디스크에 다시 놓입니다. 오탐으로 확인되었거나 격리된 환경에서 분석이 필요한 경우에만 파일을 복원하세요.
:::

### 예제

```bash
# 원래 위치로 복원
sd quarantine restore a1b2c3d4

# 분석을 위해 특정 디렉토리로 복원
sd quarantine restore a1b2c3d4 --to /tmp/analysis/

# 대상에 파일이 존재하면 강제 덮어쓰기
sd quarantine restore a1b2c3d4 --to /tmp/analysis/ --force
```

## 격리된 파일 삭제

격리 항목을 영구적으로 삭제합니다:

```bash
# 단일 항목 삭제
sd quarantine delete <ID>

# 모든 항목 삭제
sd quarantine delete-all

# 30일보다 오래된 항목 삭제
sd quarantine delete --older-than 30d

# 특정 심각도의 모든 항목 삭제
sd quarantine delete --filter malicious
```

삭제 시 암호화된 데이터는 저장소에서 제거되기 전에 0으로 덮어쓰여집니다.

::: warning
삭제는 영구적입니다. 암호화된 파일 데이터와 메타데이터는 삭제 후 복구할 수 없습니다. 삭제 전에 보관을 위해 항목을 내보내는 것을 고려하세요.
:::

## 격리 통계

격리 저장소에 대한 집계 통계 보기:

```bash
sd quarantine stats
```

```
격리 통계
  총 항목:           47
  총 크기:           28.4 MB (암호화됨)
  가장 오래된 항목:   2026-02-15
  가장 최근 항목:    2026-03-21

  심각도별:
    악성:            31 (65.9%)
    의심스러움:       16 (34.1%)

  탐지 엔진별:
    YARA 규칙:       22 (46.8%)
    해시 매칭:       15 (31.9%)
    휴리스틱:         7 (14.9%)
    랜섬웨어:         3 (6.4%)

  상위 탐지:
    Win_Trojan_Agent    8개 항목
    Ransom_LockBit3     5개 항목
    SHA256_Match        5개 항목
    Suspicious_Script   4개 항목
```

## 자동 격리

스캔 또는 모니터링 중 자동 격리 활성화:

```bash
# 자동 격리로 스캔
sd scan /tmp --auto-quarantine

# 자동 격리로 모니터링
sd monitor --auto-quarantine /home /tmp

# 자동 격리로 데몬
sd daemon start --auto-quarantine
```

또는 기본 정책으로 설정:

```toml
[policy]
on_malicious = "quarantine"
on_suspicious = "report"
```

## 격리 데이터 내보내기

보고 또는 SIEM 통합을 위해 격리 메타데이터 내보내기:

```bash
# 모든 메타데이터를 JSON으로 내보내기
sd quarantine list --json > quarantine_report.json

# 통계를 JSON으로 내보내기
sd quarantine stats --json > quarantine_stats.json
```

## 다음 단계

- [위협 대응](/ko/prx-sd/remediation/) -- 격리 외 대응 정책 설정
- [파일 모니터링](/ko/prx-sd/realtime/monitor) -- 자동 격리가 포함된 실시간 보호
- [웹훅 알림](/ko/prx-sd/alerts/webhook) -- 파일 격리 시 알림 받기
- [위협 인텔리전스](/ko/prx-sd/signatures/) -- 시그니처 데이터베이스 개요
