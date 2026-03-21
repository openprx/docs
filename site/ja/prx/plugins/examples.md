---
title: プラグインの例
description: 一般的なパターンとユースケースを示す PRX プラグインの例
---

# プラグインの例

このページでは、PRX プラグイン開発を始めるための参考となるサンプルプラグインを提供します。

## 例 1: シンプルなツールプラグイン

テキストを大文字に変換するツールプラグイン:

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

## 例 2: HTTP API ツール

外部 API からデータを取得するツールプラグイン:

```rust
use prx_pdk::prelude::*;

#[prx_tool(
    name = "github_stars",
    description = "Get star count for a GitHub repository"
)]
fn github_stars(repo: String) -> Result<String, PluginError> {
    let url = format!("https://api.github.com/repos/{}", repo);
    let resp = http_get(&url)?;
    // スター数をパースして返却
    Ok(resp.body)
}
```

## 例 3: コンテンツフィルター

機密情報をリダクトするフィルタープラグイン:

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

## 例 4: 設定付きプラグイン

設定から読み取るプラグイン:

```rust
use prx_pdk::prelude::*;

#[prx_tool(name = "greet")]
fn greet(name: String) -> Result<String, PluginError> {
    let greeting = config_get("greeting").unwrap_or("Hello".to_string());
    Ok(format!("{}, {}!", greeting, name))
}
```

`config.toml` での設定:

```toml
[[plugins.registry]]
name = "greet"
path = "greet.wasm"
enabled = true

[plugins.registry.config]
greeting = "Welcome"
```

## 関連ページ

- [開発者ガイド](./developer-guide)
- [PDK リファレンス](./pdk)
- [ホスト関数](./host-functions)
