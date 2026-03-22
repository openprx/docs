---
title: 내장 규칙
description: "OWASP CRS, ModSecurity 포트, CVE 가상 패치, 전용 탐지 검사기를 포함한 PRX-WAF 내장 규칙 레퍼런스."
---

# 내장 규칙

PRX-WAF는 4개의 소스에서 **398개의 기본 제공 탐지 규칙**이 포함됩니다. 모든 규칙은 서버 재시작 없이 핫 리로드됩니다.

## OWASP Core Rule Set (310개 규칙)

업계 표준 웹 애플리케이션 방화벽 규칙 세트입니다.

| 카테고리 | 규칙 수 | 설명 |
|---------|---------|------|
| SQLi | 78 | SQL 인젝션 — UNION, 블라인드, 에러 기반, 시간 기반 |
| XSS | 41 | 크로스 사이트 스크립팅 — 반사형, 저장형, DOM 기반 |
| RFI/LFI | 29 | 원격/로컬 파일 포함 |
| 경로 순회 | 22 | 디렉토리 순회 공격 |
| RCE | 18 | 원격 코드 실행 패턴 |
| PHP 인젝션 | 15 | PHP 코드 인젝션 |
| Java 공격 | 12 | Java 직렬화, EL 인젝션 |
| 노드 인젝션 | 11 | Node.js 프로토타입 오염 |
| 세션 고정 | 9 | 세션 하이재킹 패턴 |
| 기타 | 75 | HTTP 프로토콜 위반, 리퀘스터 이상 등 |

### 설정

```toml
[rules]
enable_builtin_owasp = true
paranoia_level = 1    # 1-4, 기본값 1
```

파라노이아 레벨:
- **레벨 1**: 높은 신뢰도 규칙만 (오탐 최소)
- **레벨 2**: 더 광범위한 탐지 추가
- **레벨 3**: 공격적인 패턴 매칭
- **레벨 4**: 최대 적용 범위 (전문가용)

## ModSecurity 규칙 (46개 규칙)

OWASP CRS에 포함되지 않은 추가 보호 규칙입니다:

| 카테고리 | 규칙 수 | 탐지 내용 |
|---------|---------|----------|
| SSRF | 14 | 서버 측 요청 위조 패턴 |
| 파일 업로드 | 11 | 악의적인 파일 업로드 탐지 |
| 세션 고정 | 9 | 세션 토큰 조작 |
| HTTP 오염 | 8 | HTTP 파라미터 오염 공격 |
| XXE | 4 | XML 외부 엔티티 인젝션 |

### 설정

```toml
[rules]
enable_builtin_modsecurity = true
```

## CVE 가상 패치 (39개 규칙)

고위험 알려진 취약점에 대한 즉각적인 보호입니다:

| CVE | CVSS | 설명 |
|-----|------|------|
| CVE-2021-44228 | 10.0 | Log4Shell — JNDI 인젝션 |
| CVE-2022-22965 | 9.8 | Spring4Shell — Spring MVC RCE |
| CVE-2021-26855 | 9.8 | ProxyLogon — Exchange SSRF |
| CVE-2022-1388 | 9.8 | F5 BIG-IP iControl RCE |
| CVE-2021-21985 | 9.8 | VMware vCenter RCE |
| CVE-2022-26134 | 9.8 | Confluence OGNL 인젝션 |
| CVE-2019-0708 | 9.8 | BlueKeep RDP 사전 인증 RCE |
| 기타 32개 CVE | - | Apache, Nginx, WordPress, Drupal 패치 |

### 설정

```toml
[rules]
enable_builtin_cve_patches = true
```

## 내장 탐지 검사기

전용 파서를 사용한 고성능 탐지 검사기입니다:

### 봇 탐지

```toml
[rules]
enable_builtin_bot = true
```

탐지 내용:
- 알려진 악의적인 봇 User-Agent 패턴
- 검색 엔진 봇 식별 (Googlebot, Bingbot 등)
- 봇넷 C&C 통신 패턴
- 취약점 스캐너 서명

### 스캐너 탐지

```toml
[rules]
enable_builtin_scanner = true
```

탐지 내용:
- Nikto, Nmap, Nuclei, SQLMap 서명
- 일반적인 취약점 스캐닝 패턴
- 크롤러 및 웹 스캐퍼

## 규칙 관리

```bash
# 카테고리별 규칙 나열
prx-waf rules list --category sqli

# 특정 규칙 정보 조회
prx-waf rules info CRS-942100

# 오탐을 일으키는 규칙 비활성화
prx-waf rules disable CRS-942100

# 규칙 통계 보기
prx-waf rules stats
```

## 다음 단계

- [YAML 구문](./yaml-syntax) — 자체 규칙 작성 방법
- [사용자 정의 규칙](./custom-rules) — 사용자 정의 탐지 예제
- [설정 레퍼런스](../configuration/reference) — 규칙 설정 옵션
