---
title: 플러그인 예제
description: 일반적인 패턴과 사용 사례를 보여주는 PRX 플러그인 예제입니다.
---

# 플러그인 예제

이 페이지는 PRX 플러그인 개발을 시작하는 데 도움이 되는 예제 플러그인을 제공합니다.

## 예제 1: 간단한 도구 플러그인

텍스트를 대문자로 변환하는 도구 플러그인:

```rust
use prx_pdk::prelude::*;

#[prx_tool(
    name = "uppercase",
    description = "Convert text to uppercase"
)]
fn uppercase(text: String) -> Result<String, PluginError> {
    Ok(text.to_uppercase())
}
```

## 예제 2: HTTP API 도구

외부 API에서 데이터를 가져오는 도구 플러그인:

```rust
use prx_pdk::prelude::*;

#[prx_tool(
    name = "github_stars",
    description = "Get star count for a GitHub repository"
)]
fn github_stars(repo: String) -> Result<String, PluginError> {
    let url = format!("https://api.github.com/repos/{}", repo);
    let resp = http_get(&url)?;
    // 파싱하고 스타 수 반환
    Ok(resp.body)
}
```

## 예제 3: 콘텐츠 필터

민감한 정보를 마스킹하는 필터 플러그인:

```rust
use prx_pdk::prelude::*;

#[prx_filter(stage = "post")]
fn redact_emails(message: &str) -> Result<FilterAction, PluginError> {
    let redacted = message.replace(
        |c: char| c == '@',
        "[REDACTED]"
    );
    Ok(FilterAction::Replace(redacted))
}
```

## 예제 4: 설정이 포함된 플러그인

자체 설정을 읽는 플러그인:

```rust
use prx_pdk::prelude::*;

#[prx_tool(name = "greet")]
fn greet(name: String) -> Result<String, PluginError> {
    let greeting = config_get("greeting").unwrap_or("Hello".to_string());
    Ok(format!("{}, {}!", greeting, name))
}
```

`config.toml`의 설정:

```toml
[[plugins.registry]]
name = "greet"
path = "greet.wasm"
enabled = true

[plugins.registry.config]
greeting = "Welcome"
```

## 관련 페이지

- [개발자 가이드](./developer-guide)
- [PDK 레퍼런스](./pdk)
- [호스트 함수](./host-functions)
