---
title: WASMプラグイン
description: "PRXランタイムでのサンドボックス実行のためのPRX-Email WASMプラグインシステム。WITホスト呼び出し、ネットワーク安全スイッチ、プラグイン開発ガイド。"
---

# WASMプラグイン

PRX-EmailにはPRXランタイム内でのサンドボックス実行のためにメールクライアントをWebAssemblyにコンパイルするWASMプラグインが含まれています。プラグインはWIT（WebAssembly Interface Types）を使用してホスト呼び出しインターフェースを定義し、WASMホスト型コードが同期、一覧表示、取得、検索、送信、返信などのメール操作を呼び出せるようにします。

## アーキテクチャ

```
PRX Runtime (Host)
  |
  +-- WASM Plugin (prx-email-plugin)
        |
        +-- WIT Host-Calls
        |     email.sync    --> Host IMAP sync
        |     email.list    --> Host inbox list
        |     email.get     --> Host message get
        |     email.search  --> Host inbox search
        |     email.send    --> Host SMTP send
        |     email.reply   --> Host SMTP reply
        |
        +-- email.execute   --> Dispatcher
              (forwards to host-calls above)
```

### 実行モデル

WASMプラグインが`email.execute`を呼び出すと、プラグインは呼び出しを適切なホスト呼び出し関数にディスパッチします。ホストランタイムが実際のIMAP/SMTP操作を処理し、結果はWITインターフェースを通じて返されます。

## ネットワーク安全スイッチ

WASMコンテキストからの実際のIMAP/SMTP実行は**デフォルトで無効**です。これはサンドボックス化されたプラグインからの意図しないネットワーク接続を防ぎます。

### ネットワーク操作を有効にする

PRXランタイムを開始する前に環境変数を設定します：

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### 無効時の動作

| 操作 | 動作 |
|-----|------|
| `email.sync` | `EMAIL_NETWORK_GUARD`エラーを返す |
| `email.send` | `EMAIL_NETWORK_GUARD`エラーを返す |
| `email.reply` | `EMAIL_NETWORK_GUARD`エラーを返す |
| `email.list` | 動作する（ローカルSQLiteから読み取り） |
| `email.get` | 動作する（ローカルSQLiteから読み取り） |
| `email.search` | 動作する（ローカルSQLiteから読み取り） |

::: tip
読み取り専用操作（list、get、search）はネットワークアクセスなしにローカルSQLiteデータベースを照会するため、常に動作します。IMAP/SMTP接続が必要な操作のみがゲートされます。
:::

### ホスト機能が利用できない場合

ホストランタイムがメール機能を提供しない場合（非WASM実行パス）、操作は`EMAIL_HOST_CAPABILITY_UNAVAILABLE`を返します。

## プラグイン構造

```
wasm-plugin/
  Cargo.toml          # Plugin crate configuration
  plugin.toml         # Plugin manifest
  plugin.wasm         # Pre-compiled WASM binary
  src/
    lib.rs            # Plugin entry point and dispatcher
    bindings.rs       # WIT-generated bindings
  wit/                # WIT interface definitions
    deps/
      prx-host/       # Host-provided interfaces
```

### Cargo設定

```toml
[package]
name = "prx-email-plugin"
version = "0.1.0"
edition = "2024"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
wit-bindgen = { version = "0.51", features = ["macros"] }

[package.metadata.component]
package = "prx:plugin"

[package.metadata.component.target.dependencies]
"prx:host" = { path = "wit/deps/prx-host" }
```

## プラグインのビルド

### 前提条件

- Rustツールチェーン
- `wasm32-wasip1`ターゲット

### ビルドステップ

```bash
# Add WASM target
rustup target add wasm32-wasip1

# Build the plugin
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### ビルドスクリプトの使用

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

## WITインターフェース

プラグインはWIT定義インターフェースを通じてホストと通信します。`prx:host`パッケージは以下のホスト呼び出し関数を提供します：

### 利用可能なホスト呼び出し

| 関数 | 説明 | ネットワーク必要 |
|-----|------|:----------:|
| `email.sync` | アカウント/フォルダのIMAP受信トレイを同期 | はい |
| `email.list` | ローカルデータベースからメッセージを一覧表示 | いいえ |
| `email.get` | IDで特定のメッセージを取得 | いいえ |
| `email.search` | クエリでメッセージを検索 | いいえ |
| `email.send` | SMTP経由で新しいメールを送信 | はい |
| `email.reply` | 既存のメールに返信 | はい |

### リクエスト/レスポンス形式

ホスト呼び出しはリクエストとレスポンスのペイロードにJSONシリアライゼーションを使用します：

```rust
// Example: list messages
let request = serde_json::json!({
    "account_id": 1,
    "limit": 10
});

let response = host_call("email.list", &request)?;
```

## 開発ワークフロー

### 1. プラグインコードを変更する

`wasm-plugin/src/lib.rs`を編集してカスタムロジックを追加します：

```rust
// Add pre-processing before email operations
fn before_send(request: &SendRequest) -> Result<(), PluginError> {
    // Custom validation, logging, or transformation
    Ok(())
}
```

### 2. リビルドする

```bash
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### 3. ローカルでテストする

ネットワーク安全スイッチを無効にしてテストします：

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
# Run your PRX runtime with the updated plugin
```

### 4. デプロイする

コンパイルされた`.wasm`ファイルをPRXランタイムのプラグインディレクトリにコピーします。

## セキュリティモデル

| 制約 | 適用 |
|-----|------|
| ネットワークアクセス | デフォルトで無効。`PRX_EMAIL_ENABLE_REAL_NETWORK=1`が必要 |
| ファイルシステムアクセス | WASMからの直接ファイルシステムアクセスなし |
| メモリ | WASMリニアメモリ制限で境界付け |
| 実行時間 | フェルメータリングで境界付け |
| トークン安全性 | OAuthトークンはホストが管理し、WASMに公開されない |

::: warning
WASMプラグインはOAuthトークンや認証情報に直接アクセスできません。すべての認証はホストランタイムが処理します。プラグインは操作結果のみを受け取り、生の認証情報は受け取りません。
:::

## 次のステップ

- [インストール](../getting-started/installation) -- WASMプラグインのビルド手順
- [設定リファレンス](../configuration/) -- ネットワーク安全スイッチとランタイム設定
- [トラブルシューティング](../troubleshooting/) -- プラグイン関連の問題
