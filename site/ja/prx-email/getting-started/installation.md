---
title: インストール
description: "ソースからのインストール、Cargo依存関係としての追加、またはPRXランタイム統合のためのWASMプラグインのビルド。"
---

# インストール

PRX-EmailはRustライブラリ依存関係として使用するか、スタンドアロン使用のためにソースからビルドするか、PRXランタイム用のWASMプラグインとしてコンパイルできます。

::: tip 推奨
ほとんどのユーザーにとって、PRX-Emailを**Cargo依存関係**として追加することがRustプロジェクトにメール機能を統合する最も速い方法です。
:::

## 前提条件

| 要件 | 最小 | 備考 |
|------|------|------|
| Rust | 1.85.0 (2024 edition) | すべてのインストール方法に必要 |
| Git | 2.30+ | リポジトリをクローンするため |
| SQLite | bundled | `rusqlite` bundledフィーチャーで含まれる。システムSQLiteは不要 |
| `wasm32-wasip1`ターゲット | latest | WASMプラグインのコンパイルにのみ必要 |

## 方法1：Cargo依存関係（推奨）

プロジェクトの`Cargo.toml`にPRX-Emailを追加します：

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

これはライブラリとすべての依存関係（`rusqlite`（bundled SQLite）、`imap`、`lettre`、`mail-parser`）を取得します。

::: warning ビルド依存関係
`rusqlite` bundledフィーチャーはCソースからSQLiteをコンパイルします。Debian/Ubuntuでは以下が必要な場合があります：
```bash
sudo apt install -y build-essential pkg-config
```
macOSではXcode Command Line Toolsが必要です：
```bash
xcode-select --install
```
:::

## 方法2：ソースからビルド

リポジトリをクローンしてリリースモードでビルドします：

```bash
git clone https://github.com/openprx/prx_email.git
cd prx_email
cargo build --release
```

すべてが動作することを確認するためにテストスイートを実行します：

```bash
cargo test
```

lint検証のためにclippyを実行します：

```bash
cargo clippy -- -D warnings
```

## 方法3：WASMプラグイン

WASMプラグインにより、PRX-EmailはPRXランタイム内でサンドボックス化されたWebAssemblyモジュールとして実行できます。プラグインはWIT（WebAssembly Interface Types）を使用してホスト呼び出しインターフェースを定義します。

### WASMプラグインをビルドする

```bash
cd prx_email

# Add the WASM target
rustup target add wasm32-wasip1

# Build the plugin
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

コンパイルされたプラグインは`wasm-plugin/target/wasm32-wasip1/release/prx_email_plugin.wasm`にあります。

または、ビルドスクリプトを使用します：

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

### プラグイン設定

WASMプラグインには`wasm-plugin/`ディレクトリにプラグインメタデータと機能を定義する`plugin.toml`マニフェストが含まれています。

### ネットワーク安全スイッチ

デフォルトでは、WASMプラグインは**実際のネットワーク操作が無効**な状態で実行されます。WASMコンテキストから実際のIMAP/SMTP接続を有効にするには：

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

無効な場合、ネットワーク依存の操作（`email.sync`、`email.send`、`email.reply`）はガードヒント付きの制御されたエラーを返します。これはサンドボックス化されたプラグインからの意図しないネットワークアクセスを防ぐための安全措置です。

## 依存関係

PRX-Emailは以下の主要な依存関係を使用します：

| クレート | バージョン | 目的 |
|---------|---------|------|
| `rusqlite` | 0.31 | bundled Cコンパイルを持つSQLiteデータベース |
| `imap` | 2.4 | 受信トレイ同期用IMAPクライアント |
| `lettre` | 0.11 | メール送信用SMTPクライアント |
| `mail-parser` | 0.10 | MIMEメッセージパース |
| `rustls` | 0.23 | IMAP接続用TLS |
| `rustls-connector` | 0.20 | TLSストリームラッパー |
| `serde` / `serde_json` | 1.0 | モデルとAPIレスポンスのシリアライゼーション |
| `sha2` | 0.10 | フォールバックメッセージIDのためのSHA-256 |
| `base64` | 0.22 | 添付ファイルのBase64エンコード |
| `thiserror` | 1.0 | エラー型の導出 |

すべてのTLS接続は`rustls`（Pure Rust）を使用します。OpenSSLの依存関係なし。

## インストールの確認

ビルド後、ライブラリがコンパイルされてテストが通ることを確認します：

```bash
cargo check
cargo test
```

期待される出力：

```
running 7 tests
test plugin::email_plugin::tests::parse_mime_extracts_text_html_and_attachments ... ok
test plugin::email_plugin::tests::references_chain_appends_parent_message_id ... ok
test plugin::email_plugin::tests::reply_sets_in_reply_to_header_on_outbox ... ok
test plugin::email_plugin::tests::parse_mime_fallback_message_id_is_stable_and_unique ... ok
test plugin::email_plugin::tests::list_search_reject_out_of_range_limit ... ok
test plugin::email_plugin::tests::run_sync_runner_respects_max_concurrency_cap ... ok
test plugin::email_plugin::tests::reload_auth_from_env_updates_tokens ... ok

test result: ok. 7 passed; 0 failed; 0 ignored
```

## 次のステップ

- [クイックスタート](./quickstart) -- 最初のメールアカウントを設定してメッセージを送信
- [アカウント管理](../accounts/) -- IMAP、SMTP、OAuthを設定
- [WASMプラグイン](../plugins/) -- WASMプラグインインターフェースについて学ぶ
