---
title: 사용자 정의 YARA 규칙
description: 사용자 환경에 특정한 위협을 탐지하기 위해 PRX-SD용 사용자 정의 YARA 규칙을 작성, 테스트, 배포합니다.
---

# 사용자 정의 YARA 규칙

YARA는 악성코드 탐지를 위해 설계된 패턴 매칭 언어입니다. PRX-SD는 내장 및 커뮤니티 규칙과 함께 사용자 정의 YARA 규칙을 로드하는 것을 지원하여, 특정 위협 환경에 맞는 탐지 로직을 만들 수 있습니다.

## 규칙 파일 위치

사용자 정의 YARA 규칙을 `~/.prx-sd/yara/` 디렉토리에 놓습니다:

```
~/.prx-sd/yara/
  custom_ransomware.yar
  internal_threats.yar
  compliance_checks.yar
```

PRX-SD는 시작 시 및 시그니처 업데이트 중에 이 디렉토리에서 모든 `.yar` 및 `.yara` 파일을 로드합니다. 규칙은 빠른 스캔을 위해 최적화된 캐시(`compiled.yarc`)로 컴파일됩니다.

::: tip
하위 디렉토리가 지원됩니다. 더 쉬운 관리를 위해 범주별로 규칙을 구성합니다:
```
~/.prx-sd/yara/
  ransomware/
    lockbit_variant.yar
    custom_encryptor.yar
  webshells/
    internal_webshell.yar
  compliance/
    pii_detection.yar
```
:::

## YARA 규칙 구문

YARA 규칙은 **meta**, **strings**, **condition** 세 섹션으로 구성됩니다.

### 기본 규칙 구조

```yara
rule Detect_CustomMalware : trojan
{
    meta:
        author = "Security Team"
        description = "Detects custom trojan used in targeted attack"
        severity = "high"
        date = "2026-03-21"
        reference = "https://internal.wiki/incident-2026-042"

    strings:
        $magic = { 4D 5A 90 00 }              // PE header (hex bytes)
        $str1 = "cmd.exe /c" ascii nocase      // ASCII string, case-insensitive
        $str2 = "powershell -enc" ascii nocase
        $str3 = "C:\\Users\\Public\\payload" wide  // UTF-16 string
        $mutex = "Global\\CustomMutex_12345"
        $regex = /https?:\/\/[a-z0-9]{8,12}\.onion/ // Regex pattern

    condition:
        $magic at 0 and
        (2 of ($str*)) and
        ($mutex or $regex)
}
```

### 주요 구문 요소

| 요소 | 구문 | 설명 |
|---------|--------|-------------|
| 16진수 문자열 | `{ 4D 5A ?? 00 }` | 와일드카드(`??`)가 있는 바이트 패턴 |
| 텍스트 문자열 | `"text" ascii` | 일반 ASCII 문자열 |
| 와이드 문자열 | `"text" wide` | UTF-16LE 인코딩 문자열 |
| 대소문자 무시 | `"text" nocase` | 대소문자에 관계없이 매칭 |
| 정규식 | `/pattern/` | 정규 표현식 패턴 |
| 태그 | `rule Name : tag1 tag2` | 분류 태그 |
| 파일 크기 | `filesize < 1MB` | 파일 크기 조건 |
| 진입점 | `entrypoint` | PE/ELF 진입점 오프셋 |
| 오프셋에서 | `$str at 0x100` | 특정 오프셋의 문자열 |
| 범위 내 | `$str in (0..1024)` | 바이트 범위 내 문자열 |
| 개수 | `#str > 3` | 문자열 출현 횟수 |

### 심각도 레벨

PRX-SD는 `severity` 메타 필드를 읽어 위협 분류를 결정합니다:

| 심각도 | PRX-SD 판정 |
|----------|---------------|
| `critical` | MALICIOUS |
| `high` | MALICIOUS |
| `medium` | SUSPICIOUS |
| `low` | SUSPICIOUS |
| (미설정) | SUSPICIOUS |

## 예제 규칙

### 의심스러운 스크립트 탐지

```yara
rule Suspicious_PowerShell_Download : script
{
    meta:
        author = "Security Team"
        description = "PowerShell script downloading and executing remote content"
        severity = "high"

    strings:
        $dl1 = "Invoke-WebRequest" ascii nocase
        $dl2 = "Net.WebClient" ascii nocase
        $dl3 = "DownloadString" ascii nocase
        $dl4 = "DownloadFile" ascii nocase
        $exec1 = "Invoke-Expression" ascii nocase
        $exec2 = "iex(" ascii nocase
        $exec3 = "Start-Process" ascii nocase
        $enc = "-EncodedCommand" ascii nocase
        $bypass = "-ExecutionPolicy Bypass" ascii nocase

    condition:
        filesize < 5MB and
        (any of ($dl*)) and
        (any of ($exec*) or $enc or $bypass)
}
```

### 암호화폐 마이너 탐지

```yara
rule Crypto_Miner_Strings : miner
{
    meta:
        author = "Security Team"
        description = "Detects cryptocurrency mining software"
        severity = "medium"

    strings:
        $pool1 = "stratum+tcp://" ascii
        $pool2 = "stratum+ssl://" ascii
        $pool3 = "pool.minexmr.com" ascii
        $pool4 = "xmrpool.eu" ascii
        $algo1 = "cryptonight" ascii nocase
        $algo2 = "randomx" ascii nocase
        $algo3 = "ethash" ascii nocase
        $wallet = /[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}/ ascii  // Monero address

    condition:
        (any of ($pool*)) or
        ((any of ($algo*)) and $wallet)
}
```

### 웹셸 탐지

```yara
rule PHP_Webshell_Generic : webshell
{
    meta:
        author = "Security Team"
        description = "Generic PHP webshell detection"
        severity = "critical"

    strings:
        $php = "<?php" ascii nocase
        $eval1 = "eval(" ascii nocase
        $eval2 = "assert(" ascii nocase
        $eval3 = "preg_replace" ascii nocase
        $input1 = "$_GET[" ascii
        $input2 = "$_POST[" ascii
        $input3 = "$_REQUEST[" ascii
        $input4 = "$_COOKIE[" ascii
        $cmd1 = "system(" ascii nocase
        $cmd2 = "passthru(" ascii nocase
        $cmd3 = "shell_exec(" ascii nocase
        $cmd4 = "exec(" ascii nocase
        $obf1 = "base64_decode" ascii nocase
        $obf2 = "str_rot13" ascii nocase
        $obf3 = "gzinflate" ascii nocase

    condition:
        $php and
        (any of ($eval*)) and
        (any of ($input*)) and
        (any of ($cmd*) or any of ($obf*))
}
```

## 규칙 테스트

배포 전에 규칙을 검증합니다:

```bash
# 규칙 파일 컴파일 확인 (구문 검증)
sd yara validate ~/.prx-sd/yara/custom_ransomware.yar

# 특정 파일에 대해 규칙 테스트
sd yara test ~/.prx-sd/yara/custom_ransomware.yar /path/to/sample

# 샘플 디렉토리에 대해 모든 사용자 정의 규칙 테스트
sd yara test ~/.prx-sd/yara/ /path/to/samples/ --recursive

# 사용자 정의 규칙만 사용하여 드라이 런 스캔
sd scan --yara-only --yara-path ~/.prx-sd/yara/ /path/to/test
```

::: warning
프로덕션 모니터링에 배포하기 전에 항상 알려진 깨끗한 파일 세트에 대해 새 규칙을 테스트하여 오탐을 확인하세요.
:::

## 규칙 다시 로드

규칙을 추가하거나 수정한 후 데몬을 재시작하지 않고 다시 로드합니다:

```bash
# 규칙 재컴파일 및 다시 로드
sd yara reload

# 데몬으로 실행 중인 경우 SIGHUP 전송
kill -HUP $(cat ~/.prx-sd/sd.pid)
```

## 규칙 기여

PRX-SD 커뮤니티와 규칙을 공유합니다:

1. [prx-sd-signatures](https://github.com/OpenPRX/prx-sd-signatures) 저장소 포크
2. 적절한 범주 디렉토리에 규칙 추가
3. 포괄적인 `meta` 필드 포함 (author, description, severity, reference)
4. 악성 샘플과 깨끗한 파일 모두에 대해 테스트
5. 검증을 위한 샘플 해시와 함께 pull request 제출

## 다음 단계

- [시그니처 소스](./sources) -- 커뮤니티 및 서드파티 YARA 규칙 소스
- [해시 가져오기](./import) -- 해시 기반 차단 목록 추가
- [시그니처 업데이트](./update) -- 모든 규칙 최신 상태 유지
- [위협 인텔리전스 개요](./index) -- 전체 시그니처 아키텍처
