---
title: 플러그인 개발 키트 (PDK)
description: PRX WASM 플러그인을 빌드하기 위한 플러그인 개발 키트의 API 레퍼런스입니다.
---

# 플러그인 개발 키트 (PDK)

PRX PDK는 PRX 플러그인을 빌드하는 데 필요한 타입, 트레이트, 매크로를 제공하는 Rust 크레이트입니다. 직렬화, 호스트 함수 바인딩, 플러그인 생명주기를 처리합니다.

## 설치

`Cargo.toml`에 추가합니다:

```toml
[dependencies]
prx-pdk = "0.1"
```

## 핵심 트레이트

### Tool

`Tool` 트레이트는 에이전트가 호출할 수 있는 새 도구를 등록하는 데 사용됩니다:

```rust
use prx_pdk::prelude::*;

#[prx_tool(
    name = "weather",
    description = "Get current weather for a location"
)]
fn weather(location: String) -> Result<String, PluginError> {
    let resp = http_get(&format!("https://api.weather.com/{}", location))?;
    Ok(resp.body)
}
```

### Channel

`Channel` 트레이트는 새 메시징 채널을 추가합니다:

```rust
use prx_pdk::prelude::*;

#[prx_channel(name = "my-chat")]
struct MyChatChannel;

impl Channel for MyChatChannel {
    fn send(&self, message: &str) -> Result<(), PluginError> { /* ... */ }
    fn receive(&self) -> Result<Option<String>, PluginError> { /* ... */ }
}
```

### Filter

`Filter` 트레이트는 LLM 전후로 메시지를 처리합니다:

```rust
use prx_pdk::prelude::*;

#[prx_filter(stage = "pre")]
fn content_filter(message: &str) -> Result<FilterAction, PluginError> {
    // FilterAction::Pass 또는 FilterAction::Block 반환
}
```

## 타입

PDK는 `PluginError`, `FilterAction`, `ToolResult`, `ChannelMessage`, `PluginConfig` 등의 공통 타입을 내보냅니다.

## 관련 페이지

- [개발자 가이드](./developer-guide)
- [호스트 함수](./host-functions)
- [예제](./examples)
