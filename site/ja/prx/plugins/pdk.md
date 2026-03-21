---
title: プラグイン開発キット（PDK）
description: PRX WASM プラグインのビルドに使用するプラグイン開発キットの API リファレンス
---

# プラグイン開発キット（PDK）

PRX PDK は PRX プラグインのビルドに必要な型、トレイト、マクロを提供する Rust クレートです。シリアライゼーション、ホスト関数バインディング、プラグインライフサイクルを処理します。

## インストール

`Cargo.toml` に追加:

```toml
[dependencies]
prx-pdk = "0.1"
```

## コアトレイト

### Tool

`Tool` トレイトはエージェントが呼び出せる新しいツールの登録に使用されます:

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

`Channel` トレイトは新しいメッセージングチャネルを追加します:

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

`Filter` トレイトは LLM の前後にメッセージを処理します:

```rust
use prx_pdk::prelude::*;

#[prx_filter(stage = "pre")]
fn content_filter(message: &str) -> Result<FilterAction, PluginError> {
    // FilterAction::Pass or FilterAction::Block を返却
}
```

## 型

PDK は一般的な型をエクスポートします: `PluginError`、`FilterAction`、`ToolResult`、`ChannelMessage`、`PluginConfig`。

## 関連ページ

- [開発者ガイド](./developer-guide)
- [ホスト関数](./host-functions)
- [プラグインの例](./examples)
