---
title: 규칙 엔진
description: "탐지 규칙 소스, 파라노이아 레벨, 핫 리로드, 규칙 우선순위를 포함한 PRX-WAF 규칙 엔진 개요."
---

# 규칙 엔진

PRX-WAF 규칙 엔진은 4개의 소스에서 총 **398개의 기본 제공 규칙**을 로드하며, 무제한의 사용자 정의 규칙을 지원합니다.

## 규칙 소스

| 소스 | 규칙 수 | 설명 |
|------|---------|------|
| OWASP CRS | 310 | OWASP Core Rule Set — 업계 표준 웹 공격 탐지 |
| ModSecurity | 46 | 서버 측 요청 위조, 파일 업로드, 세션 고정 |
| CVE 패치 | 39 | 알려진 CVE에 대한 가상 패치 (Log4Shell, Spring4Shell 등) |
| 내장 검사기 | - | SQLi, XSS, 경로 순회, 명령 인젝션 전용 파서 |

## 파라노이아 레벨

OWASP CRS 규칙은 4개의 파라노이아 레벨로 구성됩니다:

| 레벨 | 설명 | 오탐률 |
|------|------|--------|
| **1** (기본값) | 핵심 보호만 — 모든 애플리케이션에 적합 | 낮음 |
| **2** | 고급 탐지 추가 — 일부 맞춤화 필요할 수 있음 | 중간 |
| **3** | 공격적인 탐지 — 테스트 후 배포 | 높음 |
| **4** | 최대 보호 — 세심한 조정 필요 | 매우 높음 |

::: tip
파라노이아 레벨 1로 시작하여 애플리케이션의 트래픽을 모니터링한 후 레벨을 높이세요. 새 규칙은 `action: log`로 배포하여 오탐 가능성을 미리 확인하는 것이 좋습니다.
:::

## 규칙 평가 순서

요청이 들어오면 규칙 엔진은 다음 순서로 규칙을 평가합니다:

1. **IP 허용 목록** — IP 허용 규칙은 다른 모든 것보다 우선함
2. **IP 차단 목록** — 명시적 차단 규칙
3. **내장 검사기** — 빠른 SQLi/XSS/경로 순회 파싱
4. **YAML 규칙** — 우선순위 필드 순서대로 (높은 값이 먼저)
5. **사용자 정의 규칙** — 사용자 정의 YAML 파일의 규칙

## 핫 리로드

PRX-WAF는 서버 재시작 없이 규칙 파일 변경을 감시하고 다시 로드합니다:

```toml
[rules]
hot_reload = true
reload_debounce_ms = 500    # 파일 변경 후 다시 로드 전 대기 시간
```

수동으로 다시 로드를 트리거하려면:

```bash
prx-waf rules reload
```

또는 SIGHUP을 보냅니다:

```bash
kill -HUP $(pgrep prx-waf)
```

## 규칙 관리

```bash
# 모든 로드된 규칙 나열
prx-waf rules list

# 카테고리별 필터링
prx-waf rules list --category sqli

# 규칙 비활성화 (오탐 감소)
prx-waf rules disable CRS-942100

# 규칙 활성화
prx-waf rules enable CRS-942100

# 규칙 통계 보기
prx-waf rules stats
```

## 규칙 디렉토리 구조

```
rules/
  owasp-crs/          # OWASP Core Rule Set
    sqli.yaml
    xss.yaml
    rfi.yaml
    ...
  modsecurity/        # ModSecurity 규칙
  cve-patches/        # CVE 가상 패치
  custom/             # 사용자 정의 규칙
    myapp.yaml
```

## 다음 단계

- [YAML 구문](./yaml-syntax) — 규칙 스키마 완전 레퍼런스
- [내장 규칙](./builtin-rules) — 제공되는 규칙에 대한 세부 정보
- [사용자 정의 규칙](./custom-rules) — 자체 탐지 규칙 작성
