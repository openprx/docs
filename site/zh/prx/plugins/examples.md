---
title: 插件示例
description: PRX 插件示例，展示常见模式和用例。
---

# 插件示例

本页提供示例插件，帮助你快速上手 PRX 插件开发。

## 示例 1：简单工具插件

一个将文本转为大写的工具插件：

```rust
use prx_pdk::prelude::*;

#[prx_tool(
    name = "uppercase",
    description = "将文本转为大写"
)]
fn uppercase(text: String) -> Result<String, PluginError> {
    Ok(text.to_uppercase())
}
```

## 示例 2：HTTP API 工具

一个从外部 API 获取数据的工具插件：

```rust
use prx_pdk::prelude::*;

#[prx_tool(
    name = "github_stars",
    description = "获取 GitHub 仓库的 star 数量"
)]
fn github_stars(repo: String) -> Result<String, PluginError> {
    let url = format!("https://api.github.com/repos/{}", repo);
    let resp = http_get(&url)?;
    Ok(resp.body)
}
```

## 示例 3：内容过滤器

一个脱敏敏感信息的过滤器插件：

```rust
use prx_pdk::prelude::*;

#[prx_filter(stage = "post")]
fn redact_emails(message: &str) -> Result<FilterAction, PluginError> {
    let redacted = message.replace(
        |c: char| c == '@',
        "[已脱敏]"
    );
    Ok(FilterAction::Replace(redacted))
}
```

## 示例 4：带配置的插件

一个从配置中读取参数的插件：

```rust
use prx_pdk::prelude::*;

#[prx_tool(name = "greet")]
fn greet(name: String) -> Result<String, PluginError> {
    let greeting = config_get("greeting").unwrap_or("你好".to_string());
    Ok(format!("{}，{}！", greeting, name))
}
```

`config.toml` 中的配置：

```toml
[[plugins.registry]]
name = "greet"
path = "greet.wasm"
enabled = true

[plugins.registry.config]
greeting = "欢迎"
```

## 相关页面

- [开发者指南](./developer-guide)
- [PDK 参考](./pdk)
- [宿主函数](./host-functions)
