---
title: 해시 가져오기
description: 사용자 정의 해시 차단 목록 및 ClamAV 시그니처 데이터베이스를 PRX-SD에 가져오기.
---

# 해시 가져오기

PRX-SD는 사용자 정의 해시 차단 목록과 ClamAV 시그니처 데이터베이스를 가져와 자체 위협 인텔리전스나 조직 차단 목록으로 탐지 커버리지를 확장할 수 있습니다.

## 사용자 정의 해시 가져오기

### 사용법

```bash
sd import [OPTIONS] <FILE>
```

### 옵션

| 플래그 | 축약 | 기본값 | 설명 |
|------|-------|---------|-------------|
| `--format` | `-f` | 자동 감지 | 해시 형식: `sha256`, `sha1`, `md5`, `auto` |
| `--label` | `-l` | 파일명 | 가져온 세트의 레이블 |
| `--replace` | | `false` | 같은 레이블의 기존 항목 교체 |
| `--dry-run` | | `false` | 가져오지 않고 파일 검증 |
| `--quiet` | `-q` | `false` | 진행 출력 억제 |

### 지원되는 해시 파일 형식

PRX-SD는 여러 가지 일반적인 형식을 허용합니다:

**일반 목록** -- 한 줄에 한 해시:

```
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

**레이블이 있는 해시** -- 해시 다음에 공백과 선택적 설명:

```
e3b0c44298fc1c149afbf4c8996fb924  empty_file
d7a8fbb307d7809469ca9abcb0082e4f  known_malware_sample
```

**CSV 형식** -- 헤더가 있는 쉼표로 구분:

```csv
hash,family,source
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855,Emotet,internal
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592,TrickBot,partner
```

**주석 줄** -- `#`으로 시작하는 줄은 무시됩니다:

```
# 사용자 정의 차단 목록 - 2026-03-21 업데이트
# 출처: 내부 위협 추적 팀
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

::: tip
해시 형식은 길이를 기반으로 자동 감지됩니다: 32자 = MD5, 40자 = SHA-1, 64자 = SHA-256. 감지가 실패하면 `--format`을 사용하여 재정의하세요.
:::

### 가져오기 예제

```bash
# SHA-256 차단 목록 가져오기
sd import threat_hashes.txt

# 명시적 형식과 레이블로 가져오기
sd import --format md5 --label "partner-feed-2026Q1" partner_hashes.txt

# 파일을 검증하기 위한 드라이 런
sd import --dry-run suspicious_hashes.csv

# 기존 가져오기 세트 교체
sd import --replace --label "daily-feed" today_hashes.txt
```

### 가져오기 출력

```
threat_hashes.txt에서 해시 가져오는 중...
  형식:      SHA-256 (자동 감지)
  레이블:    threat_hashes
  전체:      1,247줄
  유효:      1,203개 해시
  건너뜀:    44개 (중복: 38개, 유효하지 않음: 6개)
  가져옴:    1,203개 새 항목
  데이터베이스:  ~/.prx-sd/signatures/hashes/custom.lmdb
```

## ClamAV 데이터베이스 가져오기

### 사용법

```bash
sd import-clamav [OPTIONS] <FILE>
```

### 옵션

| 플래그 | 축약 | 기본값 | 설명 |
|------|-------|---------|-------------|
| `--type` | `-t` | 자동 감지 | 데이터베이스 유형: `cvd`, `cld`, `hdb`, `hsb`, `auto` |
| `--quiet` | `-q` | `false` | 진행 출력 억제 |

### 지원되는 ClamAV 형식

| 형식 | 확장자 | 설명 |
|--------|-----------|-------------|
| **CVD** | `.cvd` | ClamAV 바이러스 데이터베이스 (압축, 서명됨) |
| **CLD** | `.cld` | ClamAV 로컬 데이터베이스 (증분 업데이트) |
| **HDB** | `.hdb` | MD5 해시 데이터베이스 (일반 텍스트) |
| **HSB** | `.hsb` | SHA-256 해시 데이터베이스 (일반 텍스트) |
| **NDB** | `.ndb` | 확장 시그니처 형식 (본문 기반) |

::: warning
CVD/CLD 파일은 매우 클 수 있습니다. `main.cvd` 파일만 해도 600만 개 이상의 시그니처를 포함하며 가져온 후 약 300 MB의 디스크 공간이 필요합니다.
:::

### ClamAV 가져오기 예제

```bash
# 주요 ClamAV 데이터베이스 가져오기
sd import-clamav /var/lib/clamav/main.cvd

# 일일 업데이트 데이터베이스 가져오기
sd import-clamav /var/lib/clamav/daily.cvd

# 일반 텍스트 해시 데이터베이스 가져오기
sd import-clamav custom_sigs.hdb

# SHA-256 해시 데이터베이스 가져오기
sd import-clamav my_hashes.hsb
```

### ClamAV 통합 설정

PRX-SD와 ClamAV 시그니처를 사용하려면:

1. freshclam 설치 (ClamAV 업데이터):

```bash
# Debian/Ubuntu
sudo apt install clamav

# macOS
brew install clamav

# Fedora/RHEL
sudo dnf install clamav-update
```

2. 데이터베이스 다운로드:

```bash
sudo freshclam
```

3. PRX-SD로 가져오기:

```bash
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

4. 설정에서 ClamAV 활성화:

```toml
[signatures.sources]
clamav = true
```

## 가져온 해시 관리

가져온 해시 세트 보기:

```bash
sd info --imports
```

```
사용자 정의 해시 가져오기:
  threat_hashes       1,203 SHA-256  2026-03-21 가져옴
  partner-feed-2026Q1   847 MD5      2026-03-15 가져옴
  daily-feed          2,401 SHA-256  2026-03-21 가져옴

ClamAV 가져오기:
  main.cvd            6,234,109 시그니처  2026-03-20 가져옴
  daily.cvd           1,847,322 시그니처  2026-03-21 가져옴
```

가져온 세트 제거:

```bash
sd import --remove --label "partner-feed-2026Q1"
```

## 다음 단계

- [사용자 정의 YARA 규칙](./custom-rules) -- 패턴 기반 탐지 규칙 작성
- [시그니처 소스](./sources) -- 모든 사용 가능한 위협 인텔리전스 소스
- [시그니처 업데이트](./update) -- 데이터베이스 최신 상태 유지
- [위협 인텔리전스 개요](./index) -- 데이터베이스 아키텍처
