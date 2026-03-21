---
title: HTTP 요청
description: 도메인 허용 목록, 설정 가능한 응답 크기 제한, 타임아웃 강제를 갖춘 API에 대한 HTTP 요청을 수행합니다.
---

# HTTP 요청

`http_request` 도구는 PRX 에이전트가 외부 API에 직접 HTTP 요청을 할 수 있게 합니다. JSON 데이터 가져오기, REST 엔드포인트 호출, 웹훅 전송과 같은 구조화된 API 상호작용을 위해 설계되었으며, 일반 웹 브라우징이 아닙니다. 이 도구는 거부 기본 도메인 정책을 강제합니다: `allowed_domains`에 명시적으로 나열된 도메인만 접근 가능합니다.

HTTP 요청은 기능 게이트가 적용되며 설정에서 `http_request.enabled = true`가 필요합니다. 웹 페이지를 렌더링하는 브라우저 도구와 달리, HTTP 요청 도구는 프로토콜 수준에서 작동하여 더 빠르고 API 통합에 더 적합합니다.

이 도구는 모든 표준 HTTP 메서드(GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS), 커스텀 헤더, 요청 본문, 설정 가능한 타임아웃을 지원합니다. 응답 본문은 메모리 고갈을 방지하기 위해 설정 가능한 최대 크기까지 캡처됩니다.

## 설정

```toml
[http_request]
enabled = true
allowed_domains = [
  "api.github.com",
  "api.openai.com",
  "api.anthropic.com",
  "httpbin.org"
]
max_response_size = 1000000   # 최대 응답 본문 크기(바이트, 1 MB)
timeout_secs = 30             # 요청 타임아웃(초)
```

### 도메인 허용 목록

`allowed_domains` 리스트는 HTTP 요청 도구의 주요 보안 제어입니다. 이 리스트에 있는 도메인으로의 요청만 허용됩니다. 도메인 매칭 규칙:

| 패턴 | 예시 | 매칭 |
|------|------|------|
| 정확한 도메인 | `"api.github.com"` | `api.github.com`만 |
| 와일드카드 서브도메인 | `"*.github.com"` | `api.github.com`, `raw.github.com` 등 |
| 최상위 도메인 | `"github.com"` | `github.com`만 (기본적으로 서브도메인 제외) |

::: warning
빈 `allowed_domains` 리스트는 도구가 활성화되어 있어도 HTTP 요청이 허용되지 않음을 의미합니다. 이것이 안전한 기본값입니다.
:::

## 사용법

### GET 요청

REST API에서 데이터 가져오기:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "GET",
    "url": "https://api.github.com/repos/openprx/prx/releases/latest",
    "headers": {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer ghp_xxxxxxxxxxxx"
    }
  }
}
```

### POST 요청

API 엔드포인트에 데이터 전송:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "POST",
    "url": "https://api.example.com/webhooks",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{\"event\": \"task_completed\", \"data\": {\"task_id\": 42}}"
  }
}
```

### PUT 요청

리소스 업데이트:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "PUT",
    "url": "https://api.example.com/config/settings",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer token-here"
    },
    "body": "{\"theme\": \"dark\", \"language\": \"en\"}"
  }
}
```

### DELETE 요청

리소스 제거:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "DELETE",
    "url": "https://api.example.com/items/42",
    "headers": {
      "Authorization": "Bearer token-here"
    }
  }
}
```

## 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `method` | `string` | 아니오 | `"GET"` | HTTP 메서드: `"GET"`, `"POST"`, `"PUT"`, `"PATCH"`, `"DELETE"`, `"HEAD"`, `"OPTIONS"` |
| `url` | `string` | 예 | -- | 요청할 전체 URL. HTTPS 또는 HTTP여야 합니다. 도메인이 `allowed_domains`에 있어야 합니다. |
| `headers` | `object` | 아니오 | `{}` | 요청에 포함할 HTTP 헤더의 키-값 맵 |
| `body` | `string` | 아니오 | -- | 요청 본문 (POST, PUT, PATCH 메서드용) |
| `timeout_secs` | `integer` | 아니오 | 설정 값 (`30`) | 요청별 타임아웃 재정의(초) |

**반환:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | `bool` | 요청이 완료되면 `true` (2xx 이외의 상태 코드도 포함) |
| `output` | `string` | 응답 본문 (텍스트), `max_response_size`로 잘림. 구조화된 출력에 상태 코드와 헤더 포함. |
| `error` | `string?` | 요청 실패 시 오류 메시지 (도메인 차단, 타임아웃, 연결 오류) |

### 응답 형식

도구는 다음을 포함하는 구조화된 출력을 반환합니다:

```
Status: 200 OK
Content-Type: application/json

{
  "name": "prx",
  "version": "0.8.0",
  ...
}
```

비텍스트 응답(바이너리 데이터)의 경우 도구는 본문을 포함하지 않고 응답 크기와 콘텐츠 타입을 보고합니다.

## 일반 패턴

### API 통합

HTTP 요청 도구는 외부 서비스와 통합하는 데 일반적으로 사용됩니다:

```
에이전트 사고: 사용자가 PR의 CI 상태를 확인하고 싶어함.
  1. [http_request] GET https://api.github.com/repos/owner/repo/pulls/42/checks
  2. [JSON 응답 파싱]
  3. [사용자에게 상태 보고]
```

### 웹훅 전달

외부 시스템에 알림 전송:

```
에이전트 사고: 작업 완료, 웹훅에 알려야 함.
  1. [http_request] POST https://hooks.slack.com/services/T.../B.../xxx
     body: {"text": "Task #42 completed successfully"}
```

### 데이터 가져오기

분석을 위한 구조화된 데이터 검색:

```
에이전트 사고: 패키지 메타데이터를 조회해야 함.
  1. [http_request] GET https://crates.io/api/v1/crates/tokio
  2. [버전, 다운로드 수, 의존성 추출]
```

## 보안

### 거부 기본

HTTP 요청 도구는 거부 기본 보안 모델을 사용합니다. 도메인이 `allowed_domains`에 명시적으로 나열되지 않으면 네트워크 연결 전에 요청이 차단됩니다. 이는 다음을 방지합니다:

- **서버 측 요청 위조(SSRF)**: 에이전트가 명시적으로 허용되지 않는 한 내부 네트워크 주소(`localhost`, `10.x.x.x`, `192.168.x.x`)에 요청할 수 없음
- **데이터 유출**: 에이전트가 임의의 외부 서버에 데이터를 전송할 수 없음
- **DNS 리바인딩**: 도메인은 DNS 해석 시점이 아닌 요청 시점에 확인됨

### 자격 증명 처리

HTTP 요청 도구는 자격 증명을 자동으로 주입하지 않습니다. 에이전트가 API로 인증해야 하는 경우 도구 호출 인자에 인증 헤더를 명시적으로 포함해야 합니다. 이는 다음을 의미합니다:

- API 키가 도구 호출(및 감사 로그)에 표시됨
- 에이전트가 제공받았거나 메모리에서 검색한 자격 증명만 사용 가능
- 도메인 허용 목록에 의해 무단 도메인으로의 자격 증명 유출이 방지됨

민감한 API 호출에는 `[security.tool_policy]`를 사용하여 `http_request`를 감독 모드로 표시하는 것을 고려하세요:

```toml
[security.tool_policy.tools]
http_request = "supervised"
```

### 응답 크기 제한

`max_response_size` 설정(기본: 1 MB)은 예기치 않게 큰 응답으로 인한 메모리 고갈을 방지합니다. 이 제한을 초과하는 응답은 잘리고 출력에 참고가 추가됩니다.

### 타임아웃 보호

`timeout_secs` 설정(기본: 30초)은 느리거나 응답하지 않는 서버에서 에이전트가 멈추는 것을 방지합니다. 타임아웃은 연결 수준에서 강제됩니다.

### 프록시 지원

`[proxy]`가 설정되면 HTTP 요청은 설정된 프록시를 통해 라우팅됩니다:

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1"]
```

### 감사 로깅

활성화되면 모든 HTTP 요청이 감사 로그에 기록됩니다:

- 요청 메서드 및 URL
- 요청 헤더 (민감한 값은 수정됨)
- 응답 상태 코드
- 응답 크기
- 성공/실패 상태

## 관련 페이지

- [웹 검색](/ko/prx/tools/web-search) -- 웹 검색 및 페이지 콘텐츠 가져오기
- [브라우저 도구](/ko/prx/tools/browser) -- 웹 페이지를 위한 전체 브라우저 자동화
- [MCP 통합](/ko/prx/tools/mcp) -- MCP 프로토콜을 통한 외부 도구 연결
- [설정 참조](/ko/prx/config/reference) -- `[http_request]` 설정 필드
- [프록시 설정](/ko/prx/config/reference#proxy) -- 아웃바운드 프록시 설정
- [도구 개요](/ko/prx/tools/) -- 모든 도구 및 레지스트리 시스템
