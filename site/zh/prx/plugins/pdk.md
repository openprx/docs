---
title: 插件开发工具包 (PDK)
description: 用于构建 WASM 插件的 PRX 插件开发工具包 API 参考。
---

# 插件开发工具包 (PDK)

PRX PDK 是一个 Rust crate，提供构建 PRX 插件所需的类型、trait 和宏。它处理序列化、宿主函数绑定和插件生命周期。

## 安装

添加到 `Cargo.toml`：

```toml
[dependencies]
prx-pdk = "0.1"
```

## 核心 Trait

### Tool

`Tool` trait 用于注册 Agent 可调用的新工具：

```rust
use prx_pdk::prelude::*;

#[prx_tool(
    name = "weather",
    description = "获取指定位置的当前天气"
)]
fn weather(location: String) -> Result<String, PluginError> {
    let resp = http_get(&format!("https://api.weather.com/{}", location))?;
    Ok(resp.body)
}
```

### Channel

`Channel` trait 添加新的消息渠道：

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

`Filter` trait 在 LLM 前或后处理消息：

```rust
use prx_pdk::prelude::*;

#[prx_filter(stage = "pre")]
fn content_filter(message: &str) -> Result<FilterAction, PluginError> {
    // 返回 FilterAction::Pass 或 FilterAction::Block
}
```

## 类型

PDK 导出常用类型：`PluginError`、`FilterAction`、`ToolResult`、`ChannelMessage` 和 `PluginConfig`。

## 相关页面

- [开发者指南](./developer-guide)
- [宿主函数](./host-functions)
- [示例](./examples)
