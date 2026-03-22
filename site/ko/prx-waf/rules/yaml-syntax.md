---
title: YAML 규칙 구문
description: "필드, 연산자, 액션, 조건 논리를 포함한 PRX-WAF YAML 규칙 스키마의 완전한 레퍼런스."
---

# YAML 규칙 구문

PRX-WAF 규칙은 YAML 파일로 정의됩니다. 각 파일은 여러 규칙을 포함할 수 있습니다.

## 규칙 구조

```yaml
- id: "CUSTOM-001"
  name: "Block SQL Injection in query params"
  description: "Detects classic SQL injection patterns in URL query strings"
  category: "sqli"
  severity: "high"
  priority: 100
  enabled: true
  action: "block"
  conditions:
    - field: "query_string"
      operator: "regex"
      value: "(?i)(union|select|insert|update|delete|drop|exec)"
  tags: ["sqli", "owasp"]
```

## 규칙 필드

| 필드 | 유형 | 필수 | 설명 |
|------|------|------|------|
| `id` | `string` | 예 | 고유 규칙 식별자 (예: `"CUSTOM-001"`) |
| `name` | `string` | 예 | 사람이 읽을 수 있는 규칙 이름 |
| `description` | `string` | 아니오 | 규칙이 탐지하는 내용에 대한 설명 |
| `category` | `string` | 예 | 규칙 카테고리: `sqli`, `xss`, `rfi`, `rce`, `bot`, `scanner`, `custom` |
| `severity` | `string` | 예 | 위협 심각도: `low`, `medium`, `high`, `critical` |
| `priority` | `integer` | 아니오 | 평가 순서 (높을수록 먼저 평가됨, 기본값: `0`) |
| `enabled` | `boolean` | 아니오 | 규칙 활성화 여부 (기본값: `true`) |
| `action` | `string` | 예 | 탐지 시 취할 액션 (아래 액션 참조) |
| `conditions` | `array` | 예 | 일치 조건 목록 (아래 조건 참조) |
| `tags` | `string[]` | 아니오 | 검색 및 필터링을 위한 태그 |

## 조건 필드

각 조건에는 다음이 포함됩니다:

| 필드 | 유형 | 필수 | 설명 |
|------|------|------|------|
| `field` | `string` | 예 | 검사할 요청 필드 (아래 필드 참조) |
| `operator` | `string` | 예 | 비교 연산자 (아래 연산자 참조) |
| `value` | `string` | 예 | 비교 값 |
| `negate` | `boolean` | 아니오 | `true`이면 매칭을 반전 (기본값: `false`) |
| `transform` | `string[]` | 아니오 | 비교 전 적용할 변환 (예: `["lowercase", "url_decode"]`) |

## 요청 필드

| 필드 | 설명 |
|------|------|
| `method` | HTTP 메서드 (GET, POST 등) |
| `uri` | 전체 요청 URI |
| `path` | URI 경로 부분 |
| `query_string` | 원시 쿼리 문자열 |
| `header.<name>` | 특정 헤더 값 (예: `header.user-agent`) |
| `headers` | 모든 헤더 (연결됨) |
| `body` | 요청 바디 (원시) |
| `ip` | 클라이언트 IP 주소 |
| `host` | 호스트 헤더 값 |
| `cookie.<name>` | 특정 쿠키 값 |

## 연산자

| 연산자 | 설명 |
|--------|------|
| `equals` | 정확한 문자열 매칭 |
| `contains` | 부분 문자열 포함 여부 |
| `starts_with` | 지정된 접두사로 시작 |
| `ends_with` | 지정된 접미사로 끝남 |
| `regex` | 정규식 매칭 (Rust regex 구문) |
| `ip_range` | IP가 CIDR 범위 내에 있는지 확인 |
| `length_gt` | 길이가 값보다 큼 |
| `length_lt` | 길이가 값보다 작음 |
| `exists` | 필드가 존재하고 비어 있지 않음 |
| `not_exists` | 필드가 존재하지 않거나 비어 있음 |
| `in_list` | 쉼표로 구분된 목록에서 값과 일치 |

## 액션

| 액션 | 설명 |
|------|------|
| `block` | 요청을 403 Forbidden으로 거부 |
| `allow` | 추가 처리 없이 즉시 허용 |
| `log` | 이벤트 로깅만 (차단 없음) |
| `challenge` | JavaScript 챌린지 제공 (봇 탐지) |
| `redirect` | 다른 URL로 리디렉션 |
| `rate_limit` | 클라이언트에 속도 제한 적용 |

## 여러 조건

규칙에 여러 조건이 있으면 **모두** 참이어야 합니다 (AND 논리):

```yaml
- id: "CUSTOM-002"
  name: "Block POST with SQL in body from non-admin IPs"
  category: "sqli"
  severity: "high"
  action: "block"
  conditions:
    - field: "method"
      operator: "equals"
      value: "POST"
    - field: "body"
      operator: "regex"
      value: "(?i)(union.*select|select.*from)"
    - field: "ip"
      operator: "ip_range"
      negate: true
      value: "10.0.0.0/8"
```

## 변환

조건에 `transform`을 사용하여 비교 전에 필드 값을 전처리합니다:

```yaml
conditions:
  - field: "query_string"
    operator: "regex"
    value: "(?i)script"
    transform:
      - "url_decode"        # URL 디코딩 먼저
      - "html_entity_decode" # HTML 엔티티 디코딩
      - "lowercase"         # 소문자 변환
```

사용 가능한 변환: `lowercase`, `uppercase`, `url_decode`, `base64_decode`, `html_entity_decode`, `remove_whitespace`

## Rhai 스크립팅

복잡한 탐지 로직에는 인라인 Rhai 스크립트를 사용합니다:

```yaml
- id: "CUSTOM-003"
  name: "Complex custom detection"
  category: "custom"
  severity: "medium"
  action: "log"
  script: |
    let score = 0;
    if request.header("user-agent").contains("bot") { score += 10; }
    if request.query_string().len() > 1000 { score += 20; }
    score > 25
```

## 다음 단계

- [내장 규칙](./builtin-rules) — 제공되는 규칙에 대한 세부 정보
- [사용자 정의 규칙](./custom-rules) — 사용자 정의 규칙 작성 예제 및 모범 사례
