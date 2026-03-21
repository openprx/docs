---
title: 웹 검색
description: DuckDuckGo (무료, API 키 불필요) 또는 Brave Search (API 키 필요)를 통해 웹을 검색하며, 설정 가능한 결과 제한과 타임아웃을 지원합니다.
---

# 웹 검색

`web_search_tool`은 PRX 에이전트가 현재 정보를 위해 웹을 검색할 수 있게 합니다. 두 가지 검색 프로바이더 -- DuckDuckGo (무료, API 키 불필요)와 Brave Search (API 키 필요) -- 를 지원하며, 에이전트가 최근 이벤트에 대한 질문에 답하거나, 문서를 조회하거나, 주제를 리서치하는 데 사용할 수 있는 구조화된 검색 결과를 반환합니다.

웹 검색은 기능 게이트가 적용되며 설정에서 `web_search.enabled = true`가 필요합니다. 활성화하면 PRX는 검색 결과에서 찾은 URL의 전체 페이지 콘텐츠를 추출하기 위한 `web_fetch` 도구도 선택적으로 등록합니다.

`web_search_tool`과 `web_fetch`의 조합은 에이전트에 완전한 웹 리서치 파이프라인을 제공합니다: 관련 페이지를 검색한 다음, 가장 유망한 결과에서 콘텐츠를 가져오고 추출합니다.

## 설정

```toml
[web_search]
enabled = true
provider = "duckduckgo"      # "duckduckgo" (무료) 또는 "brave" (API 키 필요)
max_results = 5              # 검색당 최대 결과 (1-10)
timeout_secs = 10            # 요청 타임아웃 (초)

# Brave Search (API 키 필요)
# provider = "brave"
# brave_api_key = "BSA-xxxxxxxxxxxx"

# 웹 페치 (페이지 콘텐츠 추출)
fetch_enabled = true         # web_fetch 도구 활성화
fetch_max_chars = 50000      # web_fetch가 반환하는 최대 문자 수
```

### 프로바이더 비교

| 기능 | DuckDuckGo | Brave Search |
|------|-----------|-------------|
| 비용 | 무료 | 무료 티어 (월 2000 쿼리), 유료 플랜 가능 |
| API 키 | 불필요 | 필요 (`brave_api_key`) |
| 결과 품질 | 일반 쿼리에 좋음 | 더 높은 품질, 더 나은 구조화 |
| 레이트 리밋 | 암시적 (스로틀링 가능) | 명시적 (플랜에 따름) |
| 프라이버시 | 프라이버시 중심 | 프라이버시 중심 |
| 구조화된 데이터 | 기본 (제목, URL, 스니펫) | 풍부 (제목, URL, 스니펫, 추가 설명) |

### 프로바이더 선택

- **DuckDuckGo**는 기본이며 `enabled = true` 외에 설정 없이 즉시 사용할 수 있습니다. 대부분의 사용 사례에 적합하며 계정이나 API 키가 필요하지 않습니다.
- **Brave Search**는 더 높은 품질의 결과와 더 풍부한 메타데이터를 제공합니다. 검색 품질이 중요하거나 안정적인 콘텐츠 추출을 위해 `web_fetch` 도구가 필요할 때 사용합니다.

## 사용법

### web_search_tool

검색 도구는 제목, URL, 스니펫이 포함된 결과 목록을 반환합니다:

```json
{
  "name": "web_search_tool",
  "arguments": {
    "query": "Rust async runtime comparison tokio vs async-std 2026",
    "max_results": 5
  }
}
```

**예시 응답:**

```json
{
  "success": true,
  "output": "1. Comparing Tokio and async-std in 2026 - https://blog.example.com/rust-async\n   Snippet: A detailed comparison of the two main Rust async runtimes...\n\n2. Tokio documentation - https://docs.rs/tokio\n   Snippet: Tokio is an asynchronous runtime for Rust...\n\n..."
}
```

### web_fetch

검색을 통해 관련 URL을 찾은 후 에이전트가 전체 콘텐츠를 가져오고 추출할 수 있습니다:

```json
{
  "name": "web_fetch",
  "arguments": {
    "url": "https://blog.example.com/rust-async"
  }
}
```

`web_fetch` 도구는:

1. `browser.allowed_domains`에 대해 URL 도메인을 검증
2. 페이지 콘텐츠를 가져옴
3. 읽을 수 있는 텍스트를 추출 (HTML, 스크립트, 스타일 제거)
4. `fetch_max_chars`로 잘림
5. 추출된 콘텐츠를 반환

::: warning
`web_fetch`는 `web_search.fetch_enabled = true` **그리고** `browser.allowed_domains` 설정이 모두 필요합니다. 가져오는 URL은 허용된 도메인 중 하나와 매칭되어야 합니다.
:::

## 파라미터

### web_search_tool 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `query` | `string` | 예 | -- | 검색 쿼리 문자열 |
| `max_results` | `integer` | 아니오 | 설정 값 (`5`) | 반환할 최대 결과 수 (1-10) |

**반환:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | `bool` | 검색이 완료되면 `true` |
| `output` | `string` | 제목, URL, 스니펫이 포함된 포맷된 검색 결과 |
| `error` | `string?` | 검색 실패 시 오류 메시지 (타임아웃, 프로바이더 오류 등) |

### web_fetch 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `url` | `string` | 예 | -- | 콘텐츠를 가져오고 추출할 URL |

**반환:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | `bool` | 페이지가 가져와지고 파싱되면 `true` |
| `output` | `string` | 추출된 텍스트 콘텐츠, `fetch_max_chars`로 잘림 |
| `error` | `string?` | 가져오기 실패 시 오류 메시지 (도메인 허용되지 않음, 타임아웃 등) |

## 일반적인 리서치 워크플로우

완전한 웹 리서치 워크플로우는 일반적으로 다음 패턴을 따릅니다:

1. **검색**: 에이전트가 `web_search_tool`을 사용하여 관련 페이지 찾기
2. **평가**: 에이전트가 검색 스니펫을 검토하여 가장 관련성 높은 결과 식별
3. **가져오기**: 에이전트가 `web_fetch`를 사용하여 선택된 페이지의 전체 콘텐츠 추출
4. **통합**: 에이전트가 여러 소스의 정보를 응답으로 결합

```
에이전트 사고: 사용자가 최신 Rust 릴리스 기능에 대해 물었음.
  1. [web_search_tool] query="Rust 1.82 release features changelog"
  2. [결과 검토, 상위 2개 URL 선택]
  3. [web_fetch] url="https://blog.rust-lang.org/2026/..."
  4. [web_fetch] url="https://releases.rs/docs/1.82.0/"
  5. [가져온 콘텐츠에서 응답 통합]
```

## 보안

### 프로바이더 자격 증명

- **DuckDuckGo**: 자격 증명 불필요. 쿼리는 DuckDuckGo의 API 엔드포인트에 전송됩니다.
- **Brave Search**: `brave_api_key`는 설정 파일에 저장됩니다. PRX의 암호화된 시크릿 저장소를 사용하여 보호하세요:

```toml
[web_search]
brave_api_key = "enc:xxxxxxxxxxxxx"  # ChaCha20-Poly1305로 암호화됨
```

### web_fetch 도메인 제한

`web_fetch` 도구는 `browser.allowed_domains` 리스트를 준수합니다. 이는 에이전트가 임의 URL에서 콘텐츠를 가져오는 것을 방지하며, 다음과 같은 위험을 방지합니다:

- 에이전트를 악성 콘텐츠에 노출 (웹 페이지를 통한 프롬프트 인젝션)
- 에이전트가 내부 URL을 가져오는 경우 서버 측 요청 위조(SSRF) 트리거
- 공격자가 제어하는 도메인으로의 DNS 또는 HTTP 요청을 통한 정보 유출

```toml
[browser]
allowed_domains = ["docs.rs", "crates.io", "github.com", "*.rust-lang.org"]
```

### 타임아웃 보호

검색과 가져오기 작업 모두 느리거나 응답하지 않는 서버에서의 멈춤을 방지하기 위한 설정 가능한 타임아웃이 있습니다:

- `web_search.timeout_secs` (기본: 10초) -- 검색 쿼리 타임아웃
- `web_fetch`에도 네트워크 수준 타임아웃 적용

### 콘텐츠 크기 제한

`fetch_max_chars` 설정(기본: 50,000자)은 극도로 큰 웹 페이지로 인한 메모리 고갈을 방지합니다. 이 제한을 넘는 콘텐츠는 잘립니다.

### 정책 엔진

웹 검색 도구는 보안 정책 엔진을 통과합니다:

```toml
[security.tool_policy.tools]
web_search_tool = "allow"
web_fetch = "supervised"     # 가져오기 전 승인 필요
```

## 관련 페이지

- [HTTP 요청](/ko/prx/tools/http-request) -- API에 대한 프로그래밍 방식 HTTP 요청
- [브라우저 도구](/ko/prx/tools/browser) -- JavaScript 중심 사이트를 위한 전체 브라우저 자동화
- [설정 참조](/ko/prx/config/reference) -- `[web_search]` 및 `[browser]` 필드
- [시크릿 관리](/ko/prx/security/secrets) -- API 키의 암호화 저장
- [도구 개요](/ko/prx/tools/) -- 모든 도구 및 레지스트리 시스템
