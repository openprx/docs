---
title: 브라우저 도구
description: 웹 내비게이션, 폼 상호작용, 스크린샷, 도메인 제한 브라우징을 위한 플러거블 백엔드를 갖춘 전체 브라우저 자동화입니다.
---

# 브라우저 도구

브라우저 도구는 PRX 에이전트에 완전한 웹 자동화 기능을 제공합니다 -- 페이지 내비게이션, 폼 입력, 요소 클릭, 콘텐츠 추출, 스크린샷 캡처. 세 가지 자동화 엔진을 지원하는 플러거블 백엔드 아키텍처를 사용하며, 무제한 웹 접근을 방지하기 위해 도메인 제한을 강제합니다.

브라우저 도구는 기능 게이트가 적용되며 설정에서 `browser.enabled = true`가 필요합니다. 활성화하면 PRX는 도구 레지스트리에 `browser`와 `browser_open`을 등록합니다. 브라우저 도구는 복잡한 다단계 웹 워크플로우를 지원하며, `browser_open`은 URL을 열고 콘텐츠를 추출하는 더 간단한 인터페이스를 제공합니다.

PRX에는 시각적 작업에서 브라우저 도구를 보완하는 비전 관련 도구(`screenshot`, `image`, `image_info`)도 포함되어 있습니다. 브라우저 도구로 캡처한 스크린샷은 시각적 추론을 위해 비전 가능 LLM에 전달할 수 있습니다.

## 설정

```toml
[browser]
enabled = true
backend = "agent_browser"       # "agent_browser" | "rust_native" | "computer_use"
allowed_domains = ["github.com", "docs.rs", "*.openprx.dev", "stackoverflow.com"]
session_name = "default"        # 영구 상태를 위한 명명된 브라우저 세션
```

### 백엔드 옵션

| 백엔드 | 설명 | 의존성 | 적합한 용도 |
|--------|------|--------|-------------|
| `agent_browser` | 외부 헤드리스 브라우저 도구인 `agent-browser` CLI를 호출 | PATH에 `agent-browser` 바이너리 | 일반 웹 자동화, JavaScript 중심 사이트 |
| `rust_native` | 헤드리스 Chrome/Chromium을 사용하는 내장 Rust 브라우저 구현 | Chromium 설치 | 경량 자동화, 외부 의존성 없음 |
| `computer_use` | 전체 데스크톱 상호작용을 위한 computer-use 사이드카 | Anthropic computer-use 사이드카 | OS 수준 상호작용, 복잡한 GUI 워크플로우 |

### 도메인 제한

`allowed_domains` 리스트는 브라우저가 접근할 수 있는 도메인을 제어합니다. 도메인 매칭은 다음을 지원합니다:

- **정확한 매칭**: `"github.com"`은 `github.com`만 매칭
- **서브도메인 와일드카드**: `"*.openprx.dev"`는 `docs.openprx.dev`, `api.openprx.dev` 등을 매칭
- **와일드카드 없음**: 빈 리스트는 모든 브라우저 내비게이션을 차단

```toml
[browser]
allowed_domains = [
  "github.com",
  "*.github.com",
  "docs.rs",
  "crates.io",
  "stackoverflow.com",
  "*.openprx.dev"
]
```

## 사용법

### browser 도구

메인 `browser` 도구는 복잡한 웹 워크플로우를 위해 여러 액션을 지원합니다:

**URL로 내비게이션:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "navigate",
    "url": "https://github.com/openprx/prx"
  }
}
```

**폼 필드 입력:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "fill",
    "selector": "#search-input",
    "value": "PRX documentation"
  }
}
```

**요소 클릭:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "click",
    "selector": "button[type='submit']"
  }
}
```

**스크린샷 캡처:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "screenshot"
  }
}
```

**페이지 콘텐츠 추출:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "content"
  }
}
```

### browser_open 도구

URL을 열고 콘텐츠를 반환하는 간소화된 도구입니다:

```json
{
  "name": "browser_open",
  "arguments": {
    "url": "https://docs.rs/tokio/latest/tokio/"
  }
}
```

### 다단계 워크플로우 예시

일반적인 리서치 워크플로우는 여러 브라우저 액션을 체인합니다:

1. 검색 엔진으로 내비게이션
2. 검색창에 쿼리 입력
3. 검색 버튼 클릭
4. 페이지에서 결과 추출
5. 관련 결과로 내비게이션
6. 상세 콘텐츠 추출
7. 시각적 참조를 위한 스크린샷 캡처

## 파라미터

### browser 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `action` | `string` | 예 | -- | 수행할 액션: `"navigate"`, `"fill"`, `"click"`, `"screenshot"`, `"content"`, `"scroll"`, `"wait"`, `"back"`, `"forward"` |
| `url` | `string` | 조건부 | -- | 내비게이션할 URL (`"navigate"` 액션에 필수) |
| `selector` | `string` | 조건부 | -- | 대상 요소의 CSS 선택자 (`"fill"`, `"click"`에 필수) |
| `value` | `string` | 조건부 | -- | 입력할 값 (`"fill"` 액션에 필수) |
| `timeout_ms` | `integer` | 아니오 | `30000` | 액션 완료를 위한 최대 대기 시간 |

### browser_open 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `url` | `string` | 예 | -- | 열고 콘텐츠를 추출할 URL |

### 비전 도구 파라미터

**screenshot:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `target` | `string` | 아니오 | `"screen"` | 캡처 대상: `"screen"` 또는 윈도우 식별자 |

**image:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `action` | `string` | 예 | -- | 이미지 작업: `"resize"`, `"crop"`, `"convert"` |
| `path` | `string` | 예 | -- | 이미지 파일 경로 |

**image_info:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `path` | `string` | 예 | -- | 검사할 이미지 파일 경로 |

## 백엔드 상세

### agent-browser

`agent_browser` 백엔드는 외부 `agent-browser` CLI 도구에 위임하며, 헤드리스 Chrome 기반 자동화 환경을 제공합니다. 통신은 JSON-RPC 메시지를 사용하여 stdio를 통해 이루어집니다.

장점:
- 완전한 JavaScript 실행
- 쿠키 및 세션 영속성
- 확장 지원

### rust_native

`rust_native` 백엔드는 Rust 바인딩을 사용하여 로컬 Chromium/Chrome 설치를 직접 제어합니다. Chrome DevTools Protocol (CDP)을 통해 통신합니다.

장점:
- 외부 바이너리 의존성 없음 (Chromium 제외)
- 서브프로세스 스폰보다 낮은 지연
- PRX 내부와의 긴밀한 통합

### computer_use

`computer_use` 백엔드는 Anthropic의 computer-use 사이드카를 활용하여 마우스 이동, 키보드 입력, 화면 캡처를 포함한 OS 수준 상호작용을 수행합니다. 이는 브라우저 자동화를 넘어 전체 데스크톱 제어로 확장됩니다.

장점:
- 브라우저뿐만 아니라 네이티브 애플리케이션과 상호작용 가능
- 복잡한 GUI 워크플로우 지원
- 팝업, 파일 대화 상자, 시스템 프롬프트 처리

## 보안

### 도메인 허용 목록

브라우저 도구는 엄격한 도메인 허용 목록을 강제합니다. URL로 내비게이션하기 전에:

1. URL이 파싱되고 호스트명이 추출됨
2. 호스트명이 `allowed_domains`와 대조 확인됨
3. 매칭되지 않으면 내비게이션이 차단되고 오류가 반환됨

이는 에이전트가 임의의 웹사이트에 접근하는 것을 방지하며, 악성 콘텐츠에 노출되거나 인증된 세션에서 의도치 않은 작업이 트리거되는 것을 방지합니다.

### 세션 격리

브라우저 세션은 이름으로 격리됩니다. 다른 에이전트 세션이나 서브 에이전트는 상태 유출(쿠키, localStorage, 세션 데이터)을 방지하기 위해 별도의 브라우저 컨텍스트를 사용할 수 있습니다.

### 콘텐츠 추출 제한

페이지 콘텐츠 추출은 과도하게 큰 페이지로 인한 메모리 고갈을 방지하기 위해 `web_search.fetch_max_chars` 제한을 따릅니다.

### 정책 엔진

브라우저 도구 호출은 보안 정책 엔진을 통과합니다. 도구를 완전히 거부하거나, 각 내비게이션에 승인을 요구하도록 감독할 수 있습니다:

```toml
[security.tool_policy.tools]
browser = "supervised"
browser_open = "allow"
```

### 자격 증명 안전

브라우저 도구는 브라우저 세션에 자격 증명이나 인증 토큰을 주입하지 않습니다. 에이전트가 웹사이트에서 인증해야 하는 경우 브라우저 도구를 사용하여 로그인 폼을 명시적으로 입력해야 하며, 이는 감독 정책의 적용을 받습니다.

## 관련 페이지

- [웹 검색](/ko/prx/tools/web-search) -- 브라우저 자동화 없이 웹 검색
- [HTTP 요청](/ko/prx/tools/http-request) -- API에 대한 프로그래밍 방식 HTTP 요청
- [셸 실행](/ko/prx/tools/shell) -- CLI 기반 웹 상호작용(curl, wget)의 대안
- [보안 샌드박스](/ko/prx/security/sandbox) -- 도구 실행을 위한 프로세스 격리
- [설정 참조](/ko/prx/config/reference) -- `[browser]` 설정 필드
- [도구 개요](/ko/prx/tools/) -- 모든 도구 및 레지스트리 시스템
