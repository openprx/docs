---
title: 광고 및 악성 도메인 차단
description: "sd adblock 명령어를 사용하여 DNS 수준에서 광고, 트래커, 악성 도메인을 차단합니다. 여러 필터 목록, 사용자 정의 규칙, 영구 로깅을 지원합니다."
---

# 광고 및 악성 도메인 차단

PRX-SD에는 광고, 트래커, 알려진 악성 도메인을 시스템 hosts 파일(`/etc/hosts` - Linux/macOS, `C:\Windows\System32\drivers\etc\hosts` - Windows)에 항목을 작성하여 DNS 수준에서 차단하는 내장 adblock 엔진이 포함되어 있습니다. 필터 목록은 `~/.prx-sd/adblock/` 하에 로컬로 저장되며 Adblock Plus(ABP) 구문과 hosts 파일 형식을 모두 지원합니다.

## 작동 방식

adblock을 활성화하면 PRX-SD가:

1. 설정된 필터 목록 다운로드 (EasyList, abuse.ch URLhaus 등)
2. ABP 규칙(`||domain.com^`) 및 hosts 항목(`0.0.0.0 domain.com`) 파싱
3. 차단된 모든 도메인을 `0.0.0.0`을 가리키도록 시스템 hosts 파일에 작성
4. 모든 차단된 도메인 조회를 `~/.prx-sd/adblock/blocked_log.jsonl`에 로깅

::: tip
업스트림 전달이 포함된 전체 DNS 수준 필터링을 위해 adblock을 [DNS 프록시](./dns-proxy)와 결합합니다. 프록시는 adblock 규칙, IOC 도메인 피드, 사용자 정의 차단 목록을 단일 리졸버에 통합합니다.
:::

## 명령어

### 보호 활성화

필터 목록을 다운로드하고 hosts 파일을 통해 DNS 차단을 설치합니다. 루트/관리자 권한이 필요합니다.

```bash
sudo sd adblock enable
```

출력:

```
>>> adblock 보호 활성화 중...
  4개 목록 로드됨 (128432개 규칙)
success: Adblock 활성화됨: /etc/hosts를 통해 95211개 도메인 차단됨
  목록: ["easylist", "easyprivacy", "urlhaus-domains", "malware-domains"]
  로그: /home/user/.prx-sd/adblock/blocked_log.jsonl
```

### 보호 비활성화

hosts 파일에서 모든 PRX-SD 항목을 제거합니다. 자격 증명과 캐시된 목록은 보존됩니다.

```bash
sudo sd adblock disable
```

### 필터 목록 동기화

설정된 모든 필터 목록을 강제로 재다운로드합니다. adblock이 현재 활성화된 경우 hosts 파일이 새 규칙으로 자동으로 업데이트됩니다.

```bash
sudo sd adblock sync
```

### 통계 보기

현재 상태, 로드된 목록, 규칙 수, 차단 로그 크기를 표시합니다.

```bash
sd adblock stats
```

출력:

```
Adblock 엔진 통계
  상태:           활성화됨
  로드된 목록:    4개
  총 규칙:        128432개
  캐시 디렉토리:  /home/user/.prx-sd/adblock
  마지막 동기화:  2026-03-20T14:30:00Z
  차단 로그:      1842개 항목

  - easylist
  - easyprivacy
  - urlhaus-domains
  - malware-domains
```

### URL 또는 도메인 확인

특정 URL 또는 도메인이 현재 필터 목록에 의해 차단되는지 테스트합니다.

```bash
sd adblock check ads.example.com
sd adblock check https://tracker.analytics.io/pixel.js
```

도메인에 스킴이 완전히 지정되지 않은 경우 PRX-SD가 자동으로 `https://`를 앞에 붙입니다.

출력:

```
BLOCKED ads.example.com -> Ads
```

또는:

```
ALLOWED docs.example.com
```

### 차단 로그 보기

영구 JSONL 로그에서 최근 차단된 항목을 표시합니다. `--count` 플래그는 표시할 항목 수를 제어합니다 (기본값: 50).

```bash
sd adblock log
sd adblock log --count 100
```

각 로그 항목에는 타임스탬프, 도메인, URL, 범주 및 소스가 포함됩니다.

### 사용자 정의 필터 목록 추가

이름과 URL로 서드파티 또는 사용자 정의 필터 목록을 추가합니다. `--category` 플래그는 목록을 분류합니다 (기본값: `unknown`).

사용 가능한 범주: `ads`, `tracking`, `malware`, `social`.

```bash
sd adblock add my-blocklist https://example.com/blocklist.txt --category malware
```

### 필터 목록 제거

이름으로 이전에 추가된 필터 목록을 제거합니다.

```bash
sd adblock remove my-blocklist
```

## 기본 필터 목록

PRX-SD는 다음 내장 필터 소스를 제공합니다:

| 목록 | 범주 | 설명 |
|------|----------|-------------|
| EasyList | 광고 | 커뮤니티 유지 광고 필터 목록 |
| EasyPrivacy | 추적 | 트래커 및 지문 채취 방지 |
| URLhaus Domains | 악성코드 | abuse.ch 악성 URL 도메인 |
| Malware Domains | 악성코드 | 알려진 악성코드 배포 도메인 |

## 필터 목록 형식

사용자 정의 목록은 Adblock Plus(ABP) 구문이나 hosts 파일 형식을 사용할 수 있습니다:

**ABP 형식:**

```
||ads.example.com^
||tracker.analytics.io^
```

**Hosts 형식:**

```
0.0.0.0 ads.example.com
127.0.0.1 tracker.analytics.io
```

`!`, `#` 또는 `[`로 시작하는 줄은 주석으로 처리되어 무시됩니다.

## 데이터 디렉토리 구조

```
~/.prx-sd/adblock/
  enabled           # 플래그 파일 (adblock이 활성화될 때 존재)
  config.json       # 소스 목록 설정
  blocked_log.jsonl # 영구 차단 로그
  lists/            # 캐시된 필터 목록 파일
```

::: warning
adblock을 활성화하고 비활성화하면 시스템 hosts 파일이 수정됩니다. hosts 파일을 수동으로 편집하는 대신 항상 `sd adblock disable`을 사용하여 항목을 깔끔하게 제거하세요. 명령어는 루트/관리자 권한이 필요합니다.
:::

## 예제

**전체 설정 워크플로우:**

```bash
# 기본 목록으로 활성화
sudo sd adblock enable

# 사용자 정의 악성코드 차단 목록 추가
sd adblock add threatfox-domains https://threatfox.abuse.ch/export/hostfile/ --category malware

# 새 목록을 다운로드하기 위해 재동기화
sudo sd adblock sync

# 알려진 악성 도메인이 차단되는지 확인
sd adblock check malware-c2.example.com

# 통계 확인
sd adblock stats

# 최근 차단 보기
sd adblock log --count 20
```

**비활성화 및 정리:**

```bash
sudo sd adblock disable
```

## 다음 단계

- 업스트림 전달을 통한 전체 DNS 수준 필터링을 위해 [DNS 프록시](./dns-proxy)를 설정합니다
- 도메인이 차단될 때 알림을 받으려면 [웹훅 알림](../alerts/)을 설정합니다
- 전체 명령어 목록은 [CLI 레퍼런스](../cli/)를 탐색합니다
