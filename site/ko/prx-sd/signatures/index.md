---
title: 위협 인텔리전스 개요
description: "해시 시그니처, YARA 규칙, IOC 피드, ClamAV 통합을 포함한 PRX-SD 시그니처 데이터베이스 아키텍처."
---

# 위협 인텔리전스 개요

PRX-SD는 여러 오픈소스 및 커뮤니티 소스의 위협 인텔리전스를 통합 로컬 데이터베이스로 집계합니다. 이 다층적 접근 방식은 알려진 악성코드 해시에서 행동 패턴 규칙, 네트워크 침해 지표까지 광범위한 커버리지를 보장합니다.

## 시그니처 범주

PRX-SD는 위협 인텔리전스를 네 가지 범주로 구성합니다:

| 범주 | 소스 | 수량 | 조회 속도 | 저장 용량 |
|----------|---------|-------|-------------|---------|
| **해시 시그니처** | 7개 소스 | 수백만 개의 SHA-256/MD5 | LMDB를 통한 O(1) | ~500 MB |
| **YARA 규칙** | 8개 소스 | 38,800개 이상의 규칙 | 패턴 매칭 | ~15 MB |
| **IOC 피드** | 5개 소스 | 585,000개 이상의 지표 | Trie / 해시 맵 | ~25 MB |
| **ClamAV 데이터베이스** | 1개 소스 | 11,000,000개 이상의 시그니처 | ClamAV 엔진 | ~300 MB |

### 해시 시그니처

가장 빠른 탐지 레이어입니다. 각 파일은 스캔 시 해시되어 알려진 악성 파일 해시가 포함된 로컬 LMDB 데이터베이스와 대조됩니다:

- **abuse.ch MalwareBazaar** -- 최신 악성코드 샘플의 SHA-256 해시 (48시간 롤링 창)
- **abuse.ch URLhaus** -- 악성 URL을 통해 배포된 파일의 SHA-256 해시
- **abuse.ch Feodo Tracker** -- 뱅킹 트로이목마 SHA-256 해시 (Emotet, Dridex, TrickBot)
- **abuse.ch ThreatFox** -- 커뮤니티 제출의 SHA-256 IOC
- **abuse.ch SSL Blacklist** -- 악성 SSL 인증서의 SHA-1 지문
- **VirusShare** -- 2,000만개 이상의 MD5 해시 (`--full` 업데이트로 사용 가능)
- **내장 차단 목록** -- EICAR 테스트 파일, WannaCry, NotPetya, Emotet의 하드코딩된 해시

### YARA 규칙

정확한 해시가 아닌 코드 패턴, 문자열, 구조로 악성코드를 식별하는 패턴 매칭 규칙입니다. 이를 통해 악성코드의 변종과 계열을 탐지합니다:

- **내장 규칙** -- 랜섬웨어, 트로이목마, 백도어, 루트킷, 마이너, 웹셸에 대한 64개의 선별된 규칙
- **Yara-Rules/rules** -- Emotet, TrickBot, CobaltStrike, Mirai, LockBit에 대한 커뮤니티 유지 규칙
- **Neo23x0/signature-base** -- APT29, Lazarus, 암호화폐 채굴, 웹셸을 위한 고품질 규칙
- **ReversingLabs YARA** -- 트로이목마, 랜섬웨어, 백도어를 위한 상업급 오픈소스 규칙
- **ESET IOC** -- Turla, Interception 및 기타 고급 위협에 대한 APT 추적 규칙
- **InQuest** -- 악성 문서(OLE, DDE 익스플로잇)를 위한 전문 규칙
- **Elastic Security** -- Elastic의 위협 연구팀의 탐지 규칙
- **Google GCTI** -- Google Cloud Threat Intelligence의 YARA 규칙

### IOC 피드

알려진 악성 인프라에 대한 연결을 탐지하기 위한 네트워크 침해 지표:

- **IPsum** -- 집계된 악성 IP 평판 목록 (다중 소스 점수)
- **FireHOL** -- 여러 위협 레벨의 선별된 IP 차단 목록
- **Emerging Threats** -- IP/도메인 IOC로 변환된 Suricata/Snort 규칙
- **SANS ISC** -- Internet Storm Center의 일일 의심스러운 IP 피드
- **URLhaus** -- 피싱, 악성코드 배포를 위한 활성 악성 URL

### ClamAV 데이터베이스

가장 큰 오픈소스 시그니처 세트를 제공하는 ClamAV 바이러스 데이터베이스와의 선택적 통합:

- **main.cvd** -- 핵심 바이러스 시그니처
- **daily.cvd** -- 매일 업데이트되는 시그니처
- **bytecode.cvd** -- 바이트코드 탐지 시그니처

## 데이터 디렉토리 구조

모든 시그니처 데이터는 `~/.prx-sd/signatures/` 하에 저장됩니다:

```
~/.prx-sd/signatures/
  hashes/
    malware_bazaar.lmdb       # MalwareBazaar SHA-256
    urlhaus.lmdb              # URLhaus SHA-256
    feodo.lmdb                # Feodo Tracker SHA-256
    threatfox.lmdb            # ThreatFox IOC
    virusshare.lmdb           # VirusShare MD5 (--full 전용)
    custom.lmdb               # 사용자 가져온 해시
  yara/
    builtin/                  # 내장 규칙 (바이너리와 함께 제공)
    community/                # 다운로드된 커뮤니티 규칙
    custom/                   # 사용자 작성 사용자 정의 규칙
    compiled.yarc             # 사전 컴파일된 규칙 캐시
  ioc/
    ipsum.dat                 # IPsum IP 평판
    firehol.dat               # FireHOL 차단 목록
    et_compromised.dat        # Emerging Threats IP
    sans_isc.dat              # SANS ISC 의심스러운 IP
    urlhaus_urls.dat          # URLhaus 악성 URL
  clamav/
    main.cvd                  # ClamAV 주요 시그니처
    daily.cvd                 # ClamAV 일일 업데이트
    bytecode.cvd              # ClamAV 바이트코드 시그니처
  metadata.json               # 업데이트 타임스탬프 및 버전 정보
```

::: tip
`sd info`를 사용하여 소스 수, 마지막 업데이트 시간, 디스크 사용량을 포함한 모든 시그니처 데이터베이스의 현재 상태를 확인합니다.
:::

## 시그니처 상태 조회

```bash
sd info
```

```
PRX-SD 시그니처 데이터베이스
  해시 시그니처:      1,247,832개 항목 (7개 소스)
  YARA 규칙:         38,847개 규칙 (8개 소스, 64개 내장)
  IOC 지표:          585,221개 항목 (5개 소스)
  ClamAV 시그니처:   설치되지 않음
  마지막 업데이트:    2026-03-21 08:00:12 UTC
  데이터베이스 버전:  2026.0321.1
  디스크 사용량:      542 MB
```

## 다음 단계

- [시그니처 업데이트](./update) -- 데이터베이스를 최신 상태로 유지
- [시그니처 소스](./sources) -- 각 소스에 대한 상세 정보
- [해시 가져오기](./import) -- 자체 해시 차단 목록 추가
- [사용자 정의 YARA 규칙](./custom-rules) -- 사용자 정의 규칙 작성 및 배포
