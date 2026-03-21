---
title: プラグイン開発者ガイド
description: プラグイン開発キットを使用した PRX プラグインの開発ステップバイステップガイド
---

# プラグイン開発者ガイド

このガイドでは、PRX プラグインをゼロから作成する手順を説明します。最終的に、PRX にロードできる動作するツールプラグインが完成します。

## 前提条件

- `wasm32-wasi` ターゲット付きの Rust ツールチェーン
- PRX CLI がインストール済み
- WASM の基本的な概念への理解

## プロジェクトセットアップ

```bash
# WASM ターゲットをインストール
rustup target add wasm32-wasi

# 新しいプラグインプロジェクトを作成
cargo new --lib my-plugin
cd my-plugin
```

`Cargo.toml` に PRX PDK を追加:

```toml
[dependencies]
prx-pdk = "0.1"

[lib]
crate-type = ["cdylib"]
```

## ツールプラグインの作成

最小限のツールプラグインは `Tool` トレイトを実装します:

```rust
use prx_pdk::prelude::*;

#[prx_tool]
fn hello(name: String) -> Result<String, PluginError> {
    Ok(format!("Hello, {}!", name))
}
```

## ビルド

```bash
cargo build --target wasm32-wasi --release
```

コンパイルされたプラグインは `target/wasm32-wasi/release/my_plugin.wasm` にあります。

## ローカルテスト

```bash
prx plugin install ./target/wasm32-wasi/release/my_plugin.wasm
prx plugin test my-plugin
```

## 公開

プラグインは `.wasm` ファイルとして共有するか、プラグインレジストリに公開できます（近日公開）。

## 関連ページ

- [プラグインシステム概要](./)
- [PDK リファレンス](./pdk)
- [ホスト関数](./host-functions)
- [プラグインの例](./examples)
