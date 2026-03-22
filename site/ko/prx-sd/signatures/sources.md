---
title: 시그니처 소스
description: "업데이트 빈도와 커버리지를 포함하여 PRX-SD에 통합된 모든 위협 인텔리전스 소스에 대한 상세 정보."
---

# 시그니처 소스

PRX-SD는 20개 이상의 오픈소스 및 커뮤니티 소스의 위협 인텔리전스를 집계합니다. 이 페이지는 각 소스, 커버리지, 업데이트 빈도 및 데이터 유형에 대한 상세 정보를 제공합니다.

## abuse.ch 소스

abuse.ch 프로젝트는 무료로 사용할 수 있는 고품질 위협 피드를 여러 개 제공합니다:

| 소스 | 데이터 유형 | 내용 | 업데이트 빈도 | 라이선스 |
|--------|-----------|---------|-----------------|---------|
| **MalwareBazaar** | SHA-256 | 전 세계 연구자들이 제출한 악성코드 샘플. 최신 제출의 48시간 롤링 창. | 5분마다 | CC0 |
| **URLhaus** | SHA-256 | 악성코드를 배포하는 URL과 연관된 파일 해시. 드라이브-바이 다운로드, 피싱 페이로드, 익스플로잇 킷 드롭 포함. | 매시간 | CC0 |
| **Feodo Tracker** | SHA-256 | 뱅킹 트로이목마 및 로더: Emotet, Dridex, TrickBot, QakBot, BazarLoader, IcedID. | 5분마다 | CC0 |
| **ThreatFox** | SHA-256 | 여러 악성코드 계열에 걸친 커뮤니티 제출 IOC. 파일 해시, 도메인, IP 포함. | 매시간 | CC0 |
| **SSL Blacklist** | SHA-1 (인증서) | 봇넷 C2 서버에서 사용하는 SSL 인증서의 SHA-1 지문. 네트워크 IOC 매칭에 사용. | 매일 | CC0 |

::: tip
모든 abuse.ch 피드는 등록 또는 API 키 없이 사용할 수 있습니다. PRX-SD는 공개 API 엔드포인트에서 직접 다운로드합니다.
:::

## VirusShare

| 필드 | 세부 정보 |
|-------|---------|
| **데이터 유형** | MD5 해시 |
| **수량** | 2,000만개 이상 |
| **내용** | 가장 큰 공개 악성코드 해시 저장소 중 하나. 번호가 매겨진 목록 파일(VirusShare_00000.md5부터 VirusShare_00500+.md5)로 구성된 MD5 해시 포함. |
| **업데이트 빈도** | 새 목록 파일이 주기적으로 추가됨 |
| **접근** | 무료 (다운로드 크기로 인해 `--full` 플래그 필요) |
| **라이선스** | 비상업적 사용에 무료 |

::: warning
전체 VirusShare 다운로드는 약 500 MB이며 가져오는 데 상당한 시간이 걸립니다. 포함하려면 `sd update --full`을 사용하거나, VirusShare 없이 표준 업데이트를 위해 `sd update`를 사용하세요.
:::

## YARA 규칙 소스

| 소스 | 규칙 수 | 초점 영역 | 품질 |
|--------|-----------|------------|---------|
| **내장 규칙** | 64 | Linux, macOS, Windows에서의 랜섬웨어, 트로이목마, 백도어, 루트킷, 마이너, 웹셸 | PRX-SD 팀이 선별 |
| **Yara-Rules/rules** | 커뮤니티 | Emotet, TrickBot, CobaltStrike, Mirai, LockBit, APT | 커뮤니티 유지 |
| **Neo23x0/signature-base** | 고용량 | APT29, Lazarus Group, 암호화폐 채굴, 웹셸, 랜섬웨어 계열 | 고품질, Florian Roth |
| **ReversingLabs YARA** | 상업급 | 트로이목마, 랜섬웨어, 백도어, 해킹 도구, 익스플로잇 | 전문급, 오픈소스 |
| **Elastic Security** | 증가 중 | Windows, Linux, macOS 위협을 포함하는 엔드포인트 탐지 규칙 | Elastic 위협 연구팀 |
| **Google GCTI** | 선택적 | Google Cloud Threat Intelligence의 고신뢰도 규칙 | 매우 높은 품질 |
| **ESET IOC** | 선택적 | APT 추적: Turla, Interception, InvisiMole 및 기타 고급 위협 | APT 중심 |
| **InQuest** | 전문화됨 | 악성 문서: OLE 익스플로잇, DDE 주입, 매크로 기반 악성코드 | 문서 특화 |

### YARA 규칙 범주

결합된 규칙 세트는 다음 악성코드 범주를 포함합니다:

| 범주 | 예제 계열 | 플랫폼 커버리지 |
|----------|-----------------|------------------|
| 랜섬웨어 | WannaCry, LockBit, Conti, REvil, Akira, BlackCat | Windows, Linux |
| 트로이목마 | Emotet, TrickBot, QakBot, Agent Tesla, RedLine | Windows |
| 백도어 | CobaltStrike, Metasploit, ShadowPad, PlugX | 크로스 플랫폼 |
| 루트킷 | Reptile, Diamorphine, Horse Pill | Linux |
| 마이너 | XMRig, CCMiner 변종 | 크로스 플랫폼 |
| 웹셸 | China Chopper, WSO, b374k, c99, r57 | 크로스 플랫폼 |
| APT | APT29, Lazarus, Turla, Sandworm, OceanLotus | 크로스 플랫폼 |
| 익스플로잇 | EternalBlue, PrintNightmare, Log4Shell 페이로드 | 크로스 플랫폼 |
| 해킹 도구 | Mimikatz, Rubeus, BloodHound, Impacket | Windows |
| 문서 | 악성 Office 매크로, PDF 익스플로잇, RTF 익스플로잇 | 크로스 플랫폼 |

## IOC 피드 소스

| 소스 | 지표 유형 | 수량 | 내용 | 업데이트 빈도 |
|--------|---------------|-------|---------|-----------------|
| **IPsum** | IP 주소 | 150,000+ | 50개 이상의 차단 목록에서 집계된 악성 IP 평판. 다중 레벨 점수 (해당 IP를 인용하는 목록 수에 따라 레벨 1-8). | 매일 |
| **FireHOL** | IP 주소 | 200,000+ | 위협 레벨별 선별된 IP 차단 목록 (level1~level4). 높은 레벨일수록 더 엄격한 포함 기준. | 6시간마다 |
| **Emerging Threats** | IP 주소 | 100,000+ | Suricata 및 Snort IDS 규칙에서 추출한 IP. 봇넷 C2, 스캐닝, 브루트 포스, 익스플로잇 시도 포함. | 매일 |
| **SANS ISC** | IP 주소 | 50,000+ | Internet Storm Center의 DShield 센서 네트워크에서의 의심스러운 IP. | 매일 |
| **URLhaus (URL)** | URL | 85,000+ | 악성코드 배포, 피싱, 익스플로잇 전달에 사용되는 활성 악성 URL. | 매시간 |

## ClamAV 데이터베이스

| 필드 | 세부 정보 |
|-------|---------|
| **데이터 유형** | 다형식 시그니처 (해시, 바이트코드, 정규식, 논리) |
| **수량** | 11,000,000개 이상의 시그니처 |
| **파일** | `main.cvd` (핵심), `daily.cvd` (일일 업데이트), `bytecode.cvd` (바이트코드 규칙) |
| **내용** | 가장 큰 오픈소스 바이러스 시그니처 데이터베이스. 바이러스, 트로이목마, 웜, 피싱, PUA 포함. |
| **업데이트 빈도** | 하루에 여러 번 |
| **접근** | freshclam 또는 직접 다운로드를 통해 무료 |

ClamAV 통합을 활성화하려면:

```bash
# ClamAV 데이터베이스 가져오기
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

자세한 ClamAV 가져오기 지침은 [해시 가져오기](./import)를 참조하세요.

## 소스 설정

`config.toml`에서 개별 소스를 활성화하거나 비활성화합니다:

```toml
[signatures.sources]
malware_bazaar = true
urlhaus = true
feodo_tracker = true
threatfox = true
ssl_blacklist = true
virusshare = false          # sd update --full로 활성화
builtin_rules = true
yara_community = true
neo23x0 = true
reversinglabs = true
elastic = true
gcti = true
eset = true
inquest = true
ipsum = true
firehol = true
emerging_threats = true
sans_isc = true
clamav = false              # ClamAV DB 가져온 후 활성화
```

## 다음 단계

- [시그니처 업데이트](./update) -- 모든 소스 다운로드 및 업데이트
- [해시 가져오기](./import) -- 사용자 정의 해시 및 ClamAV 데이터베이스 추가
- [사용자 정의 YARA 규칙](./custom-rules) -- 자체 탐지 규칙 작성
- [위협 인텔리전스 개요](./index) -- 아키텍처 및 데이터 디렉토리 레이아웃
