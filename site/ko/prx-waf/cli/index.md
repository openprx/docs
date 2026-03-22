---
title: CLI 명령어 레퍼런스
description: "서버 관리, 규칙 작업, CrowdSec 통합, 봇 탐지를 포함한 모든 PRX-WAF CLI 명령어와 서브 명령어의 완전한 레퍼런스."
---

# CLI 명령어 레퍼런스

`prx-waf` 명령줄 인터페이스는 서버 관리, 규칙 작업, CrowdSec 통합, 봇 탐지를 위한 명령어를 제공합니다.

## 전역 옵션

| 플래그 | 기본값 | 설명 |
|--------|--------|------|
| `-c, --config <FILE>` | `configs/default.toml` | TOML 설정 파일 경로 |

```bash
prx-waf -c /etc/prx-waf/config.toml <COMMAND>
```

## 서버 명령어

| 명령어 | 설명 |
|--------|------|
| `prx-waf run` | 리버스 프록시 + 관리 API 시작 (영구 블록) |
| `prx-waf migrate` | 데이터베이스 마이그레이션만 실행 |
| `prx-waf seed-admin` | 기본 관리자 사용자 생성 (admin/admin) |

```bash
# 서버 시작
prx-waf -c configs/default.toml run

# 첫 시작 전 마이그레이션 실행
prx-waf -c configs/default.toml migrate

# 관리자 사용자 생성
prx-waf -c configs/default.toml seed-admin
```

::: tip
처음 설정하는 경우 `run` 전에 `migrate`와 `seed-admin`을 실행하세요. 이후 시작 시에는 `run`만 필요합니다 -- 마이그레이션은 자동으로 확인됩니다.
:::

## 규칙 관리

탐지 규칙을 관리하는 명령어입니다. 모든 규칙 명령어는 설정된 규칙 디렉토리에서 작동합니다.

| 명령어 | 설명 |
|--------|------|
| `prx-waf rules list` | 로드된 모든 규칙 나열 |
| `prx-waf rules list --category <CAT>` | 카테고리로 규칙 필터링 |
| `prx-waf rules list --source <SRC>` | 소스로 규칙 필터링 |
| `prx-waf rules info <RULE-ID>` | 규칙에 대한 상세 정보 표시 |
| `prx-waf rules enable <RULE-ID>` | 비활성화된 규칙 활성화 |
| `prx-waf rules disable <RULE-ID>` | 규칙 비활성화 |
| `prx-waf rules reload` | 디스크에서 모든 규칙 핫 리로드 |
| `prx-waf rules validate <PATH>` | 규칙 파일의 정확성 검증 |
| `prx-waf rules import <PATH\|URL>` | 파일 또는 URL에서 규칙 가져오기 |
| `prx-waf rules export [--format yaml]` | 현재 규칙 세트 내보내기 |
| `prx-waf rules update` | 원격 소스에서 최신 규칙 가져오기 |
| `prx-waf rules search <QUERY>` | 이름 또는 설명으로 규칙 검색 |
| `prx-waf rules stats` | 규칙 통계 표시 |

### 예제

```bash
# 모든 SQL 인젝션 규칙 나열
prx-waf rules list --category sqli

# OWASP CRS 규칙 나열
prx-waf rules list --source owasp

# 특정 규칙의 상세 정보 표시
prx-waf rules info CRS-942100

# 오탐을 일으키는 규칙 비활성화
prx-waf rules disable CRS-942100

# 규칙 편집 후 핫 리로드
prx-waf rules reload

# 배포 전 사용자 정의 규칙 검증
prx-waf rules validate rules/custom/myapp.yaml

# URL에서 규칙 가져오기
prx-waf rules import https://example.com/rules/custom.yaml

# 모든 규칙을 YAML로 내보내기
prx-waf rules export --format yaml > all-rules.yaml

# 통계 보기
prx-waf rules stats
```

## 규칙 소스 관리

원격 규칙 소스를 관리하는 명령어입니다.

| 명령어 | 설명 |
|--------|------|
| `prx-waf sources list` | 설정된 규칙 소스 나열 |
| `prx-waf sources add <NAME> <URL>` | 원격 규칙 소스 추가 |
| `prx-waf sources remove <NAME>` | 규칙 소스 제거 |
| `prx-waf sources update [NAME]` | 특정 소스(또는 모두)에서 최신 가져오기 |
| `prx-waf sources sync` | 모든 원격 소스 동기화 |

### 예제

```bash
# 모든 소스 나열
prx-waf sources list

# 사용자 정의 소스 추가
prx-waf sources add my-rules https://example.com/rules/latest.yaml

# 모든 소스 동기화
prx-waf sources sync

# 특정 소스 업데이트
prx-waf sources update owasp-crs
```

## CrowdSec 통합

CrowdSec 위협 인텔리전스 통합을 관리하는 명령어입니다.

| 명령어 | 설명 |
|--------|------|
| `prx-waf crowdsec status` | CrowdSec 통합 상태 표시 |
| `prx-waf crowdsec decisions` | LAPI의 활성 결정 나열 |
| `prx-waf crowdsec test` | LAPI 연결 테스트 |
| `prx-waf crowdsec setup` | 인터랙티브 CrowdSec 설정 마법사 |

### 예제

```bash
# 통합 상태 확인
prx-waf crowdsec status

# 활성 차단/캡차 결정 나열
prx-waf crowdsec decisions

# CrowdSec LAPI 연결 테스트
prx-waf crowdsec test

# 설정 마법사 실행
prx-waf crowdsec setup
```

## 봇 탐지

봇 탐지 규칙을 관리하는 명령어입니다.

| 명령어 | 설명 |
|--------|------|
| `prx-waf bot list` | 알려진 봇 서명 나열 |
| `prx-waf bot add <PATTERN> [--action ACTION]` | 봇 탐지 패턴 추가 |
| `prx-waf bot remove <PATTERN>` | 봇 탐지 패턴 제거 |
| `prx-waf bot test <USER-AGENT>` | 봇 규칙으로 User-Agent 테스트 |

### 예제

```bash
# 모든 봇 서명 나열
prx-waf bot list

# 새 봇 패턴 추가
prx-waf bot add "(?i)my-bad-bot" --action block

# 로그 전용 모드로 봇 패턴 추가
prx-waf bot add "(?i)suspicious-crawler" --action log

# User-Agent 문자열 테스트
prx-waf bot test "Mozilla/5.0 (compatible; Googlebot/2.1)"

# 봇 패턴 제거
prx-waf bot remove "(?i)my-bad-bot"
```

## 사용 패턴

### 첫 번째 설정

```bash
# 1. 마이그레이션 실행
prx-waf -c configs/default.toml migrate

# 2. 관리자 사용자 생성
prx-waf -c configs/default.toml seed-admin

# 3. 서버 시작
prx-waf -c configs/default.toml run
```

### 규칙 유지 관리 워크플로우

```bash
# 1. 업스트림 규칙 업데이트 확인
prx-waf rules update

# 2. 업데이트 후 검증
prx-waf rules validate rules/

# 3. 변경 사항 검토
prx-waf rules stats

# 4. 핫 리로드
prx-waf rules reload
```

### CrowdSec 통합 설정

```bash
# 1. 설정 마법사 실행
prx-waf crowdsec setup

# 2. 연결 테스트
prx-waf crowdsec test

# 3. 결정이 흘러오는지 확인
prx-waf crowdsec decisions
```

## 다음 단계

- [빠른 시작](../getting-started/quickstart) — PRX-WAF 시작하기
- [규칙 엔진](../rules/) — 탐지 파이프라인 이해
- [설정 레퍼런스](../configuration/reference) — 모든 설정 키
