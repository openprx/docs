---
title: インストール
description: インストールスクリプト、Cargo、ソースビルド、DockerでLinux、macOS、Windows WSL2にPRX-SDをインストールします。
---

# インストール

PRX-SDは4つのインストール方法をサポートしています。ワークフローに最適な方法を選択してください。

::: tip 推奨
**インストールスクリプト**が最も手軽な方法です。プラットフォームを自動検出し、正しいバイナリをダウンロードしてPATHに配置します。
:::

## 前提条件

| 要件 | 最小値 | 注意事項 |
|-------------|---------|-------|
| オペレーティングシステム | Linux（x86_64、aarch64）、macOS（12以上）、Windows（WSL2） | ネイティブWindowsは非対応 |
| ディスク容量 | 200 MB | バイナリ約50MB + シグネチャデータベース約150MB |
| RAM | 512 MB | 大規模ディレクトリスキャンには2GB以上を推奨 |
| Rust（ソースビルドのみ） | 1.85.0 | スクリプトまたはDockerインストールには不要 |
| Git（ソースビルドのみ） | 2.30以上 | リポジトリのクローンに必要 |
| Docker（Dockerのみ） | 20.10以上 | またはPodman 3.0以上 |

## 方法1: インストールスクリプト（推奨）

インストールスクリプトはプラットフォームの最新リリースバイナリをダウンロードし、`/usr/local/bin`に配置します。

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash
```

特定のバージョンをインストールするには：

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash -s -- --version 0.5.0
```

スクリプトは以下の環境変数をサポートします：

| 変数 | デフォルト | 説明 |
|----------|---------|-------------|
| `INSTALL_DIR` | `/usr/local/bin` | カスタムインストールディレクトリ |
| `VERSION` | `latest` | 特定のリリースバージョン |
| `ARCH` | 自動検出 | アーキテクチャの上書き（`x86_64`、`aarch64`） |

## 方法2: Cargoインストール

Rustがインストールされている場合、crates.ioから直接インストールできます：

```bash
cargo install prx-sd
```

これはソースからコンパイルし、`sd`バイナリを`~/.cargo/bin/`に配置します。

::: warning ビルド依存関係
Cargoインストールはネイティブ依存関係をコンパイルします。Debian/Ubuntuでは以下が必要な場合があります：
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
macOSではXcodeコマンドラインツールが必要です：
```bash
xcode-select --install
```
:::

## 方法3: ソースからビルド

リポジトリをクローンしてリリースモードでビルド：

```bash
git clone https://github.com/openprx/prx-sd.git
cd prx-sd
cargo build --release
```

バイナリは`target/release/sd`にあります。PATHにコピー：

```bash
sudo cp target/release/sd /usr/local/bin/sd
```

### ビルドオプション

| フィーチャーフラグ | デフォルト | 説明 |
|-------------|---------|-------------|
| `yara` | 有効 | YARA-Xルールエンジン |
| `ml` | 無効 | ONNX ML推論エンジン |
| `gui` | 無効 | Tauri + Vue 3デスクトップGUI |
| `virustotal` | 無効 | VirusTotal API統合 |

ML推論サポートでビルドするには：

```bash
cargo build --release --features ml
```

デスクトップGUIをビルドするには：

```bash
cargo build --release --features gui
```

## 方法4: Docker

公式Dockerイメージをプル：

```bash
docker pull ghcr.io/openprx/prx-sd:latest
```

ターゲットディレクトリをマウントしてスキャンを実行：

```bash
docker run --rm -v /path/to/scan:/scan ghcr.io/openprx/prx-sd:latest scan /scan --recursive
```

リアルタイム監視の場合、デーモンとして実行：

```bash
docker run -d \
  --name prx-sd \
  --restart unless-stopped \
  -v /home:/watch/home:ro \
  -v /tmp:/watch/tmp:ro \
  ghcr.io/openprx/prx-sd:latest \
  monitor /watch/home /watch/tmp
```

::: tip Docker Compose
本番デプロイの自動シグネチャ更新のための`docker-compose.yml`がリポジトリルートにあります。
:::

## プラットフォーム別注意事項

### Linux

PRX-SDは最新のLinuxディストリビューションで動作します。リアルタイム監視には`inotify`サブシステムが使用されます。大規模なディレクトリツリーには監視制限を増やす必要があるかもしれません：

```bash
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

ルートキット検出とメモリスキャンにはroot権限が必要です。

### macOS

PRX-SDはmacOSのリアルタイム監視にFSEventsを使用します。Apple Silicon（aarch64）とIntel（x86_64）の両方をサポートしています。インストールスクリプトはアーキテクチャを自動検出します。

::: warning macOS Gatekeeper
macOSがバイナリをブロックした場合、隔離属性を削除してください：
```bash
xattr -d com.apple.quarantine /usr/local/bin/sd
```
:::

### Windows（WSL2）

PRX-SDはWSL2内でLinuxバイナリとして動作します。まずLinuxディストリビューションのWSL2をインストールし、次にLinuxのインストール手順に従ってください。ネイティブWindowsサポートは将来のリリースで予定されています。

## インストールの確認

インストール後、`sd`が動作していることを確認：

```bash
sd --version
```

期待される出力：

```
prx-sd 0.5.0
```

シグネチャデータベースを含むシステム全体のステータスを確認：

```bash
sd info
```

インストールされたバージョン、シグネチャ数、YARAルール数、データベースパスが表示されます。

## アンインストール

### スクリプト / Cargoインストール

```bash
# バイナリを削除
sudo rm /usr/local/bin/sd
# またはCargoでインストールした場合
cargo uninstall prx-sd

# シグネチャデータベースと設定を削除
rm -rf ~/.config/prx-sd
rm -rf ~/.local/share/prx-sd
```

### Docker

```bash
docker stop prx-sd && docker rm prx-sd
docker rmi ghcr.io/openprx/prx-sd:latest
```

## 次のステップ

- [クイックスタート](./quickstart) -- 5分でスキャンを開始
- [ファイル＆ディレクトリスキャン](../scanning/file-scan) -- `sd scan`コマンドの完全リファレンス
- [検出エンジン概要](../detection/) -- 多層パイプラインの理解
