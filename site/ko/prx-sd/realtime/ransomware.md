---
title: 랜섬웨어 보호
description: 엔트로피 분석, 확장자 모니터링, 일괄 암호화 탐지를 사용한 행동 랜섬웨어 탐지.
---

# 랜섬웨어 보호

PRX-SD에는 실시간으로 랜섬웨어 행동을 식별하는 전용 `RansomwareDetector` 엔진이 포함되어 있습니다. 알려진 샘플이 필요한 시그니처 기반 탐지와 달리 랜섬웨어 탐지기는 행동 휴리스틱을 사용하여 파일 암호화를 완료하기 전에 제로데이 랜섬웨어를 잡습니다.

## 작동 방식

랜섬웨어 탐지기는 실시간 모니터의 일부로 실행되며 활성 암호화를 나타내는 패턴을 위해 파일 시스템 이벤트를 분석합니다. 세 가지 탐지 축에서 작동합니다:

### 1. 일괄 암호화 탐지

탐지기는 프로세스별 및 디렉토리별 파일 수정 속도를 추적합니다. 단일 프로세스가 짧은 시간 내에 비정상적으로 많은 수의 파일을 수정하면 알림을 트리거합니다.

| 매개변수 | 기본값 | 설명 |
|-----------|---------|-------------|
| `batch_threshold` | `20` | 탐지를 트리거할 파일 수정 수 |
| `batch_window_secs` | `10` | 일괄 계산을 위한 시간 창 (초) |
| `min_files_affected` | `5` | 알림 전 최소 고유 파일 수 |

```toml
[ransomware]
enabled = true
batch_threshold = 20
batch_window_secs = 10
min_files_affected = 5
```

### 2. 확장자 변경 모니터링

랜섬웨어는 일반적으로 암호화 후 새 확장자로 파일 이름을 바꿉니다. 탐지기는 알려진 랜섬웨어 확장자로의 대량 확장자 변경을 감시합니다:

```
.encrypted, .enc, .locked, .crypto, .crypt, .crypted,
.ransomware, .ransom, .rans, .pay, .pay2key,
.locky, .zepto, .cerber, .cerber3, .dharma, .wallet,
.onion, .wncry, .wcry, .wannacry, .petya, .notpetya,
.ryuk, .conti, .lockbit, .revil, .sodinokibi,
.maze, .egregor, .darkside, .blackmatter, .hive,
.deadbolt, .akira, .alphv, .blackcat, .royal,
.rhysida, .medusa, .bianlian, .clop, .8base
```

::: warning
확장자 모니터링만으로는 충분하지 않습니다 -- 정교한 랜섬웨어는 임의 또는 합법적으로 보이는 확장자를 사용할 수 있습니다. PRX-SD는 신뢰할 수 있는 탐지를 위해 확장자 변경과 엔트로피 분석을 결합합니다.
:::

### 3. 높은 엔트로피 탐지

암호화된 파일은 거의 최대 Shannon 엔트로피를 가집니다(바이트 레벨 분석에서 8.0에 가까움). 탐지기는 수정 전후의 파일 엔트로피를 비교합니다:

| 지표 | 임계값 | 의미 |
|--------|-----------|---------|
| 파일 엔트로피 | > 7.8 | 파일 내용이 암호화되거나 압축된 가능성이 높음 |
| 엔트로피 델타 | > 3.0 | 파일이 낮은 엔트로피에서 높은 엔트로피로 변경됨 (암호화) |
| 헤더 엔트로피 | > 7.5 | 처음 4KB가 높은 엔트로피 (원래 매직 바이트 파괴) |

수정 후 파일의 엔트로피가 크게 증가하고 파일이 이전에 알려진 문서 유형(PDF, DOCX, 이미지)이었다면 이것은 암호화의 강력한 지표입니다.

## 탐지 점수

각 탐지 축은 복합 랜섬웨어 점수에 기여합니다:

| 신호 | 가중치 | 설명 |
|--------|--------|-------------|
| 일괄 파일 수정 | 40 | 하나의 프로세스에 의한 많은 파일의 빠른 수정 |
| 알려진 랜섬웨어 확장자로의 변경 | 30 | 랜섬웨어 확장자로 파일 이름 변경 |
| 알 수 없는 확장자로의 변경 | 15 | 비정상적인 새 확장자로 파일 이름 변경 |
| 높은 엔트로피 델타 | 25 | 파일 엔트로피가 극적으로 증가함 |
| 높은 절대 엔트로피 | 10 | 파일이 거의 최대 엔트로피를 가짐 |
| 랜섬 노트 생성 | 35 | 랜섬 노트 패턴과 매칭되는 파일 탐지 |
| 섀도우 복사본 삭제 | 50 | 볼륨 섀도우 복사본 삭제 시도 |

복합 점수 **60** 이상은 `MALICIOUS` 판정을 트리거합니다. **30-59** 사이의 점수는 `SUSPICIOUS` 알림을 생성합니다.

## 랜섬 노트 탐지

탐지기는 일반적인 랜섬 노트 패턴과 매칭되는 파일 생성을 감시합니다:

```
README_RESTORE_FILES.txt, HOW_TO_DECRYPT.txt,
DECRYPT_INSTRUCTIONS.html, YOUR_FILES_ARE_ENCRYPTED.txt,
RECOVER_YOUR_FILES.txt, !README!.txt, _readme.txt,
HELP_DECRYPT.html, RANSOM_NOTE.txt, #DECRYPT#.txt
```

::: tip
랜섬 노트 탐지는 패턴 기반이며 노트 파일 자체가 악성일 필요는 없습니다. 이러한 패턴과 매칭되는 파일의 생성만으로도 다른 신호와 결합하여 랜섬웨어 점수에 기여합니다.
:::

## 자동 대응

랜섬웨어가 탐지되면 설정된 정책에 따라 대응합니다:

| 조치 | 설명 |
|--------|-------------|
| **알림** | 이벤트 로깅 및 알림 전송 (웹훅, 이메일) |
| **차단** | 파일 작업 거부 (Linux fanotify 블록 모드만) |
| **종료** | 악성 프로세스 종료 |
| **격리** | 영향받은 파일을 암호화된 격리 저장소로 이동 |
| **격리** | 머신의 모든 네트워크 접근 차단 (비상) |

`config.toml`에서 대응 설정:

```toml
[ransomware.response]
on_detection = "kill"           # alert | block | kill | quarantine | isolate
quarantine_affected = true      # 증거로 수정된 파일 격리
notify_webhook = true           # 웹훅 알림 전송
notify_email = true             # 이메일 알림 전송
snapshot_process_tree = true    # 포렌식을 위한 프로세스 트리 캡처
```

## 설정

완전한 랜섬웨어 탐지기 설정:

```toml
[ransomware]
enabled = true
batch_threshold = 20
batch_window_secs = 10
min_files_affected = 5
entropy_threshold = 7.8
entropy_delta_threshold = 3.0
score_threshold_malicious = 60
score_threshold_suspicious = 30

# 더 높은 민감도로 보호할 디렉토리
protected_dirs = [
    "~/Documents",
    "~/Pictures",
    "~/Desktop",
    "/var/www",
]

# 모니터링에서 제외할 프로세스 (예: 백업 소프트웨어)
exempt_processes = [
    "borgbackup",
    "restic",
    "rsync",
]

[ransomware.response]
on_detection = "kill"
quarantine_affected = true
notify_webhook = true
notify_email = false
```

## 예제

```bash
# 랜섬웨어 보호로 모니터링 시작
sd monitor --auto-quarantine /home

# 랜섬웨어 탐지기는 데몬 모드에서 기본으로 활성화됨
sd daemon start

# 랜섬웨어 탐지기 상태 확인
sd status --verbose
```

## 다음 단계

- [파일 모니터링](./monitor) -- 실시간 모니터링 설정
- [데몬](./daemon) -- 백그라운드 서비스로 실행
- [위협 대응](/ko/prx-sd/remediation/) -- 전체 수정 정책 설정
- [웹훅 알림](/ko/prx-sd/alerts/webhook) -- 즉각적인 알림 받기
