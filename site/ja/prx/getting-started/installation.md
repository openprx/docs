---
title: インストール
description: インストールスクリプト、Cargo、ソースビルド、Docker を使用して Linux、macOS、Windows WSL2 に PRX をインストールする方法。
---

# インストール

PRX は `prx` という単一の静的バイナリとして配布されます。ワークフローに合ったインストール方法を選択してください。

## 前提条件

PRX をインストールする前に、システムが以下の要件を満たしていることを確認してください：

| 要件 | 詳細 |
|-------------|---------|
| **OS** | Linux (x86_64, aarch64)、macOS (Apple Silicon, Intel)、または Windows (WSL2 経由) |
| **Rust** | 1.92.0+ (2024 edition) -- Cargo インストールまたはソースビルドの場合のみ必要 |
| **システムパッケージ** | `pkg-config` (Linux、ソースビルドの場合のみ) |
| **ディスク容量** | バイナリ本体 約 50 MB、WASM プラグインランタイム込みで 約 200 MB |
| **RAM** | デーモン最低 64 MB（LLM 推論を除く） |

::: tip
インストールスクリプトまたは Docker を使用する場合、システムに Rust をインストールする必要はありません。
:::

## 方法 1: インストールスクリプト（推奨）

最も手軽に始められる方法です。スクリプトが OS とアーキテクチャを検出し、最新リリースのバイナリをダウンロードして `PATH` に配置します。

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

スクリプトはデフォルトで `prx` を `~/.local/bin/` にインストールします。このディレクトリが `PATH` に含まれていることを確認してください：

```bash
export PATH="$HOME/.local/bin:$PATH"
```

特定のバージョンをインストールするには：

```bash
curl -fsSL https://openprx.dev/install.sh | bash -s -- --version 0.3.0
```

カスタムディレクトリにインストールするには：

```bash
curl -fsSL https://openprx.dev/install.sh | bash -s -- --prefix /usr/local
```

## 方法 2: Cargo インストール

Rust ツールチェーンがインストールされている場合、crates.io から直接 PRX をインストールできます：

```bash
cargo install openprx
```

これによりデフォルト機能でリリースバイナリがビルドされ、`~/.cargo/bin/prx` に配置されます。

すべてのオプション機能（Matrix E2EE、WhatsApp Web など）を含めてインストールするには：

```bash
cargo install openprx --all-features
```

::: info フィーチャーフラグ
PRX はオプションのチャネルサポートに Cargo フィーチャーフラグを使用しています：

| フィーチャー | 説明 |
|---------|-------------|
| `channel-matrix` | E2E 暗号化対応の Matrix チャネル |
| `whatsapp-web` | WhatsApp Web マルチデバイスチャネル |
| **default** | すべての安定チャネルが有効 |
:::

## 方法 3: ソースからビルド

開発用または最新の未リリースコードを実行する場合：

```bash
# リポジトリをクローン
git clone https://github.com/openprx/prx.git
cd prx

# リリースバイナリをビルド
cargo build --release

# バイナリは target/release/prx に生成されます
./target/release/prx --version
```

すべての機能を含めてビルドするには：

```bash
cargo build --release --all-features
```

ローカルでビルドしたバイナリを Cargo の bin ディレクトリにインストールするには：

```bash
cargo install --path .
```

### 開発ビルド

開発中の高速な反復のために、デバッグビルドを使用します：

```bash
cargo build
./target/debug/prx --version
```

::: warning
デバッグビルドは実行時のパフォーマンスが大幅に低下します。本番環境やベンチマークには必ず `--release` を使用してください。
:::

## 方法 4: Docker

ローカルインストール不要で PRX をコンテナとして実行できます：

```bash
docker pull ghcr.io/openprx/prx:latest
```

設定ディレクトリをマウントして実行：

```bash
docker run -d \
  --name prx \
  -v ~/.config/openprx:/home/prx/.config/openprx \
  -p 3120:3120 \
  ghcr.io/openprx/prx:latest \
  daemon
```

または Docker Compose を使用：

```yaml
# docker-compose.yml
services:
  prx:
    image: ghcr.io/openprx/prx:latest
    restart: unless-stopped
    ports:
      - "3120:3120"
    volumes:
      - ./config:/home/prx/.config/openprx
      - ./data:/home/prx/.local/share/openprx
    command: daemon
```

::: tip
Docker で実行する場合、LLM API キーは環境変数で設定するか、設定ファイルをマウントしてください。詳細は[設定](../config/)を参照してください。
:::

## インストールの確認

インストール後、PRX が正しく動作しているか確認します：

```bash
prx --version
```

期待される出力：

```
prx 0.3.0
```

ヘルスチェックの実行：

```bash
prx doctor
```

これにより、Rust ツールチェーン（インストールされている場合）、システム依存関係、設定ファイルの有効性、LLM プロバイダーへのネットワーク接続が検証されます。

## プラットフォーム別の注意事項

### Linux

PRX は最新の Linux ディストリビューション（カーネル 4.18 以上）で動作します。バイナリは TLS に `rustls` を使用して静的リンクされているため、OpenSSL のインストールは不要です。

サンドボックス機能を使用するには、追加パッケージが必要な場合があります：

```bash
# Firejail サンドボックスバックエンド
sudo apt install firejail

# Bubblewrap サンドボックスバックエンド
sudo apt install bubblewrap

# Docker サンドボックスバックエンド（Docker デーモンが必要）
sudo apt install docker.io
```

### macOS

PRX は Apple Silicon (aarch64) と Intel (x86_64) の両方の Mac でネイティブに動作します。iMessage チャネルは macOS でのみ利用可能です。

ソースからビルドする場合、Xcode Command Line Tools がインストールされていることを確認してください：

```bash
xcode-select --install
```

### Windows (WSL2)

PRX は WSL2 を通じて Windows でサポートされています。Linux ディストリビューション（Ubuntu 推奨）をインストールし、WSL2 環境内で Linux の手順に従ってください。

```powershell
# PowerShell から（Ubuntu で WSL2 をインストール）
wsl --install -d Ubuntu
```

その後、WSL2 内で：

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

::: warning
ネイティブ Windows サポートは現在利用できません。WSL2 はほぼネイティブの Linux パフォーマンスを提供し、推奨されるアプローチです。
:::

## アンインストール

PRX を削除するには：

```bash
# インストールスクリプトでインストールした場合
rm ~/.local/bin/prx

# Cargo でインストールした場合
cargo uninstall openprx

# 設定とデータを削除（任意）
rm -rf ~/.config/openprx
rm -rf ~/.local/share/openprx
```

## 次のステップ

- [クイックスタート](./quickstart) -- 5 分で PRX を起動する
- [オンボーディングウィザード](./onboarding) -- LLM プロバイダーの設定
- [設定](../config/) -- 完全な設定リファレンス
