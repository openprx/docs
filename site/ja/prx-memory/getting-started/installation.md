---
title: インストール
description: CargoでPRX-Memoryをソースからインストールするか、stdioおよびHTTPトランスポート用のデーモンバイナリをビルドします。
---

# インストール

PRX-MemoryはRustワークスペースとして配布されています。主要な成果物は`prx-memory-mcp`クレートの`prx-memoryd`デーモンバイナリです。

::: tip 推奨
ソースからビルドすることで最新機能が使用でき、LanceDBなどのオプションバックエンドを有効にできます。
:::

## 前提条件

| 要件 | 最小 | 備考 |
|------|------|------|
| Rust | stable toolchain | [rustup](https://rustup.rs/)でインストール |
| オペレーティングシステム | Linux、macOS、Windows (WSL2) | Rustがサポートする任意のプラットフォーム |
| Git | 2.30+ | リポジトリをクローンするため |
| ディスク容量 | 100 MB | バイナリ + 依存関係 |
| RAM | 256 MB | 大規模メモリデータベースにはより多く推奨 |

## 方法1：ソースからビルド（推奨）

リポジトリをクローンしてリリースモードでビルドします：

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build --release -p prx-memory-mcp --bin prx-memoryd
```

バイナリは`target/release/prx-memoryd`にあります。PATHにコピーします：

```bash
sudo cp target/release/prx-memoryd /usr/local/bin/prx-memoryd
```

### ビルドオプション

| フィーチャーフラグ | デフォルト | 説明 |
|----------------|---------|------|
| `lancedb-backend` | 無効 | LanceDBベクトルストレージバックエンド |

LanceDBサポートでビルドするには：

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

::: warning ビルド依存関係
Debian/Ubuntuでは以下が必要な場合があります：
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
macOSではXcode Command Line Toolsが必要です：
```bash
xcode-select --install
```
:::

## 方法2：Cargoインストール

Rustがインストールされている場合は直接インストールできます：

```bash
cargo install prx-memory-mcp
```

これはソースからコンパイルし、`prx-memoryd`バイナリを`~/.cargo/bin/`に配置します。

## 方法3：ライブラリとして使用

PRX-Memoryクレートを自分のRustプロジェクトの依存関係として使用するには、`Cargo.toml`に追加します：

```toml
[dependencies]
prx-memory-core = "0.1"
prx-memory-embed = "0.1"
prx-memory-rerank = "0.1"
prx-memory-storage = "0.1"
```

## インストールの確認

ビルド後、バイナリが動作することを確認します：

```bash
prx-memoryd --help
```

基本的なstdioセッションをテストします：

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

HTTPセッションをテストします：

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

ヘルスエンドポイントを確認します：

```bash
curl -sS http://127.0.0.1:8787/health
```

## 開発セットアップ

開発とテストには標準のRustワークフローを使用します：

```bash
# Format
cargo fmt --all

# Lint
cargo clippy --all-targets --all-features -- -D warnings

# Test
cargo test --all-targets --all-features

# Check (fast feedback)
cargo check --all-targets --all-features
```

## アンインストール

```bash
# Remove the binary
sudo rm /usr/local/bin/prx-memoryd
# Or if installed via Cargo
cargo uninstall prx-memory-mcp

# Remove data files
rm -rf ./data/memory-db.json
```

## 次のステップ

- [クイックスタート](./quickstart) -- 5分でPRX-Memoryを起動
- [設定](../configuration/) -- すべての環境変数とプロファイル
- [MCP統合](../mcp/) -- MCPクライアントに接続
