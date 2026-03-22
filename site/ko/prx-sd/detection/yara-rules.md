---
title: YARA 규칙
description: PRX-SD는 YARA-X를 사용하여 커뮤니티 저장소, 상업용 수준의 규칙 세트, 64개의 내장 규칙을 포함한 8개 소스의 38,800개 이상의 규칙에 대해 파일을 스캔합니다.
---

# YARA 규칙

YARA 규칙은 PRX-SD 탐지 파이프라인의 두 번째 레이어입니다. 해시 매칭이 알려진 악성코드의 정확한 복사본을 잡는 반면, YARA 규칙은 파일 내의 바이트 시퀀스, 문자열, 구조적 조건을 매칭하여 악성코드 **패밀리**, **변형**, **행동 패턴**을 탐지합니다.

PRX-SD는 8개 소스에서 집계된 38,800개 이상의 YARA 규칙과 함께 **YARA-X** 엔진을 사용합니다 -- 향상된 성능, 안전성, 호환성을 제공하는 YARA의 차세대 Rust 재작성입니다.

## YARA-X 엔진

PRX-SD는 전통적인 C 기반 YARA 라이브러리 대신 [YARA-X](https://github.com/VirusTotal/yara-x)를 사용합니다. 주요 장점:

| 기능 | YARA (C) | YARA-X (Rust) |
|---------|----------|---------------|
| 언어 | C | Rust (메모리 안전) |
| 성능 | 좋음 | 대용량 규칙 세트에서 2-5배 빠름 |
| 규칙 호환성 | 기준선 | 완전한 하위 호환성 + 새 기능 |
| 스레드 안전성 | 신중한 처리 필요 | 설계에 의해 안전 |
| 모듈 지원 | 내장 모듈 | 모듈식, 확장 가능 |

## 규칙 소스

PRX-SD는 8개 소스에서 규칙을 집계합니다:

| 소스 | 규칙 수 | 내용 | 플랫폼 커버리지 |
|--------|-------|---------|-------------------|
| **내장 규칙** | 64개 | 랜섬웨어, 트로이목마, 백도어, 루트킷, 마이너, 웹셸 | Linux + macOS + Windows |
| **Yara-Rules/rules** (GitHub) | ~12,400개 | Emotet, TrickBot, CobaltStrike, Mirai, LockBit | 크로스플랫폼 |
| **Neo23x0/signature-base** | ~8,200개 | APT29, Lazarus, 크립토 마이닝, 웹셸, 랜섬웨어 | 크로스플랫폼 |
| **ReversingLabs YARA** | ~9,500개 | 트로이목마, 랜섬웨어, 백도어, 해킹 도구 | Windows + Linux |
| **ESET IOC** | ~3,800개 | Turla, Interception, 고급 지속적 위협 | 크로스플랫폼 |
| **InQuest** | ~4,836개 | OLE/DDE 악성 문서, 매크로 페이로드 | 크로스플랫폼 |
| **JPCERT/CC** | ~500개+ | 아시아-태평양 대상 위협 | 크로스플랫폼 |
| **사용자 정의/가져오기** | 가변 | 사용자 제공 규칙 | 모두 |

**합계: 38,800개 이상의 규칙** (중복 제거 후)

## 내장 규칙

64개의 내장 규칙은 PRX-SD 바이너리에 컴파일되어 있으며 외부 규칙 세트를 다운로드하지 않아도 항상 사용 가능합니다. 가장 많은 위협 카테고리를 커버합니다:

| 카테고리 | 규칙 수 | 예제 |
|----------|-------|---------|
| 랜섬웨어 | 12개 | WannaCry, LockBit, Conti, REvil, BlackCat, Ryuk |
| 트로이목마 | 10개 | Emotet, TrickBot, Dridex, QakBot |
| 백도어 | 8개 | Cobalt Strike Beacon, Metasploit Meterpreter, 리버스 셸 |
| 루트킷 | 6개 | Reptile, Diamorphine, Jynx2 (Linux) |
| 크립토마이너 | 6개 | XMRig, CGMiner, 숨겨진 마이닝 설정 |
| 웹셸 | 8개 | China Chopper, WSO, B374K, PHP/ASP/JSP 셸 |
| RAT | 6개 | njRAT, DarkComet, AsyncRAT, Quasar |
| 익스플로잇 | 4개 | EternalBlue, PrintNightmare, Log4Shell 페이로드 |
| 테스트 시그니처 | 4개 | EICAR 테스트 파일 변형 |

## 규칙 매칭 프로세스

파일이 레이어 2에 도달하면 YARA-X는 다음과 같이 처리합니다:

1. **규칙 컴파일** -- 시작 시 모든 규칙이 최적화된 내부 표현으로 컴파일됩니다. 이것은 한 번 발생하고 메모리에 캐시됩니다.
2. **아톰 추출** -- YARA-X는 규칙 패턴에서 짧은 바이트 시퀀스(아톰)를 추출하여 검색 인덱스를 만듭니다. 이를 통해 빠른 사전 필터링이 가능합니다.
3. **스캔** -- 파일 내용이 아톰 인덱스에 대해 스캔됩니다. 매칭되는 아톰이 있는 규칙만 완전히 평가됩니다.
4. **조건 평가** -- 각 후보 규칙에 대해 전체 조건(불리언 로직, 문자열 수, 파일 구조 확인)이 평가됩니다.
5. **결과** -- 매칭되는 규칙이 수집되고 파일이 보고서에 규칙 이름이 포함된 `MALICIOUS`로 표시됩니다.

### 성능

| 지표 | 값 |
|--------|-------|
| 규칙 컴파일 (38,800개 규칙) | ~2초 (시작 시 일회성) |
| 파일당 스캔 시간 | ~0.3밀리초 평균 |
| 메모리 사용량 (컴파일된 규칙) | ~150 MB |
| 처리량 | 스레드당 ~3,000파일/초 |

## YARA 규칙 업데이트

규칙은 해시 시그니처와 함께 업데이트됩니다:

```bash
# 모두 업데이트 (해시 + YARA 규칙)
sd update

# YARA 규칙만 업데이트
sd update --source yara
```

업데이트 프로세스:

1. 각 소스에서 규칙 아카이브 다운로드
2. YARA-X로 규칙 구문 유효성 검사
3. 이름과 내용 해시로 규칙 중복 제거
4. 결합된 규칙 세트 컴파일
5. 활성 규칙 세트를 원자적으로 교체

::: tip 무중단 업데이트
규칙 업데이트는 원자적입니다. 새 규칙 세트는 활성 규칙을 교체하기 전에 컴파일되고 검증됩니다. 컴파일이 실패하면(예: 커뮤니티 규칙의 구문 오류로 인해) 기존 규칙 세트가 활성 상태로 유지됩니다.
:::

## 사용자 정의 규칙

사용자 정의 YARA 규칙 디렉토리에 `.yar` 또는 `.yara` 파일을 배치하여 규칙을 추가할 수 있습니다:

```bash
# 기본 사용자 정의 규칙 디렉토리
~/.config/prx-sd/rules/
```

사용자 정의 규칙 예제:

```yara
rule custom_webshell_detector {
    meta:
        description = "Detects custom PHP webshell variant"
        author = "Security Team"
        severity = "high"

    strings:
        $eval = "eval(base64_decode(" ascii
        $system = "system($_" ascii
        $exec = "exec($_" ascii

    condition:
        filesize < 100KB and
        ($eval or $system or $exec)
}
```

사용자 정의 규칙을 추가한 후 규칙 세트를 다시 로드합니다:

```bash
sd reload-rules
```

또는 모니터 데몬을 다시 시작하여 변경 사항을 자동으로 반영합니다.

## 규칙 디렉토리

| 디렉토리 | 소스 | 업데이트 동작 |
|-----------|--------|----------------|
| `~/.local/share/prx-sd/rules/builtin/` | 바이너리에 컴파일됨 | 릴리스와 함께 업데이트 |
| `~/.local/share/prx-sd/rules/community/` | 소스에서 다운로드 | `sd update`로 업데이트 |
| `~/.config/prx-sd/rules/` | 사용자 제공 사용자 정의 규칙 | 수동, 절대 덮어쓰지 않음 |

## 규칙 확인

현재 로드된 규칙 수와 소스를 확인합니다:

```bash
sd info
```

```
YARA 규칙
==========
내장:        64개
커뮤니티:    38,736개
사용자 정의: 12개
총 컴파일됨: 38,812개
규칙 소스:   8개
마지막 업데이트: 2026-03-21 10:00:00 UTC
```

특정 키워드와 매칭되는 규칙 목록:

```bash
sd rules list --filter "ransomware"
```

## 다음 단계

- [휴리스틱 분석](./heuristics) -- 시그니처를 회피하는 파일에 대한 행동 탐지
- [해시 매칭](./hash-matching) -- 가장 빠른 탐지 레이어
- [탐지 엔진 개요](./index) -- 모든 레이어가 함께 작동하는 방식
- [지원 파일 유형](./file-types) -- YARA 규칙이 대상으로 하는 파일 형식
