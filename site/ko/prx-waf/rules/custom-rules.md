---
title: 사용자 정의 규칙
description: "사용자 정의 YAML 규칙 작성, Rhai 스크립팅, 모범 사례, ModSecurity 규칙 가져오기를 포함한 PRX-WAF 사용자 정의 규칙 가이드."
---

# 사용자 정의 규칙

PRX-WAF는 YAML 파일 또는 인라인 Rhai 스크립트로 사용자 정의 탐지 규칙 작성을 지원합니다.

## 첫 번째 규칙 작성

`rules/custom/` 디렉토리에 YAML 파일을 생성합니다:

```bash
mkdir -p rules/custom
cat > rules/custom/myapp.yaml << 'EOF'
- id: "MYAPP-001"
  name: "Block requests to admin endpoint from non-internal IPs"
  description: "Protects the admin panel from external access"
  category: "custom"
  severity: "high"
  priority: 200
  action: "block"
  conditions:
    - field: "path"
      operator: "starts_with"
      value: "/admin"
    - field: "ip"
      operator: "ip_range"
      negate: true
      value: "10.0.0.0/8"
EOF
```

규칙을 로드하려면:

```bash
prx-waf rules reload
```

## 일반적인 사용자 정의 규칙 예제

### 사용자 에이전트 차단

```yaml
- id: "CUSTOM-UA-001"
  name: "Block known attack tools"
  category: "scanner"
  severity: "high"
  action: "block"
  conditions:
    - field: "header.user-agent"
      operator: "regex"
      value: "(?i)(sqlmap|nikto|nessus|nuclei|dirbuster|gobuster)"
```

### 대형 요청 바디 속도 제한

```yaml
- id: "CUSTOM-BODY-001"
  name: "Rate limit large POST bodies"
  category: "custom"
  severity: "medium"
  action: "rate_limit"
  conditions:
    - field: "method"
      operator: "equals"
      value: "POST"
    - field: "body"
      operator: "length_gt"
      value: "102400"    # 100KB
```

### 특정 경로에 대한 헤더 요구

```yaml
- id: "CUSTOM-API-001"
  name: "Require API key header on /api/ paths"
  category: "custom"
  severity: "medium"
  action: "block"
  conditions:
    - field: "path"
      operator: "starts_with"
      value: "/api/"
    - field: "header.x-api-key"
      operator: "not_exists"
```

### PowerShell 다운로더 탐지

```yaml
- id: "CUSTOM-PS-001"
  name: "Detect PowerShell download cradles"
  category: "rce"
  severity: "critical"
  action: "block"
  conditions:
    - field: "body"
      operator: "regex"
      value: "(?i)(invoke-webrequest|iwr|wget|curl).*http"
      transform:
        - "url_decode"
        - "base64_decode"
```

## Rhai 스크립팅

복잡한 다단계 탐지 로직에 Rhai 스크립트를 사용합니다:

```yaml
- id: "CUSTOM-SCRIPT-001"
  name: "Multi-factor bot detection"
  category: "bot"
  severity: "medium"
  action: "log"
  script: |
    // 여러 신호에 기반한 봇 점수 계산
    let score = 0;

    // 봇 같은 User-Agent 확인
    let ua = request.header("user-agent");
    if ua.len() == 0 { score += 30; }
    if ua.contains("bot") || ua.contains("crawler") { score += 20; }

    // 쿼리 문자열이 비정상적으로 긴지 확인
    if request.query_string().len() > 2000 { score += 15; }

    // Accept 헤더가 없는지 확인 (실제 브라우저는 항상 보냄)
    if !request.header("accept").exists() { score += 25; }

    score >= 50  // 50점 이상이면 차단
```

### 사용 가능한 Rhai 함수

```
request.method()              - HTTP 메서드
request.path()                - URI 경로
request.query_string()        - 원시 쿼리 문자열
request.header(name)          - 헤더 값
request.body()                - 요청 바디
request.ip()                  - 클라이언트 IP
request.host()                - 호스트 헤더
```

## ModSecurity 규칙 가져오기

기존 ModSecurity 규칙 파일을 PRX-WAF YAML 형식으로 가져옵니다:

```bash
prx-waf rules import /path/to/modsec_rules.conf
```

또는 URL에서 직접 가져오기:

```bash
prx-waf rules import https://example.com/custom-rules.conf
```

::: tip
ModSecurity 가져오기는 SecRule 구문을 지원합니다. 복잡한 변환이나 지원되지 않는 지시문이 있는 규칙은 수동 검토가 필요할 수 있습니다.
:::

## 규칙 검증

배포 전에 규칙 파일을 검증합니다:

```bash
# 단일 파일 검증
prx-waf rules validate rules/custom/myapp.yaml

# 전체 디렉토리 검증
prx-waf rules validate rules/
```

## 모범 사례

1. **로그 모드로 시작** — 새 규칙은 `action: log`로 배포하여 오탐 가능성을 미리 확인

2. **우선순위 사용** — 더 구체적인 규칙에는 더 높은 `priority` 값 사용

3. **규칙 ID 네이밍** — 애플리케이션별 접두사 사용 (예: `MYAPP-`, `API-`, `CORP-`)

4. **변환 체이닝** — 난독화 우회를 방지하기 위해 `url_decode`와 `html_entity_decode` 모두 적용

5. **IP 허용 목록 우선** — 모든 검사를 건너뛰려면 내부 IP에 `action: allow` 규칙 사용:

```yaml
- id: "ALLOW-INTERNAL"
  name: "Allow all internal traffic"
  category: "custom"
  severity: "low"
  priority: 1000    # 높은 우선순위 — 먼저 평가됨
  action: "allow"
  conditions:
    - field: "ip"
      operator: "ip_range"
      value: "10.0.0.0/8"
```

## 다음 단계

- [YAML 구문](./yaml-syntax) — 완전한 규칙 스키마 레퍼런스
- [내장 규칙](./builtin-rules) — 기존 보호 기능 이해
- [규칙 엔진](./index) — 규칙 평가 순서 및 파라노이아 레벨
