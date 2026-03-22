---
title: インストール
description: "Docker Compose、Cargo、またはソースからのビルドでPRX-WAFをインストール。前提条件、プラットフォームの注意事項、インストール後の確認を含む。"
---

# インストール

PRX-WAFは3つのインストール方法をサポートしています。ワークフローに最適な方法を選択してください。

::: tip 推奨
**Docker Compose**は最も素早く始める方法です。PRX-WAF、PostgreSQL、管理UIを1つのコマンドで起動します。
:::

## 前提条件

| 要件 | 最小バージョン | 備考 |
|-------------|---------|-------|
| オペレーティングシステム | Linux（x86_64、aarch64）、macOS（12+） | WindowsはWSL2経由 |
| PostgreSQL | 16+ | Docker Composeに含まれる |
| Rust（ソースビルドのみ） | 1.82.0 | Dockerインストールでは不要 |
| Node.js（管理UIビルドのみ） | 18+ | Dockerインストールでは不要 |
| Docker | 20.10+ | またはPodman 3.0+ |
| ディスクスペース | 500 MB | バイナリ約100 MB + PostgreSQLデータ約400 MB |
| RAM | 512 MB | 本番環境では2 GB以上を推奨 |

## 方法1：Docker Compose（推奨）

リポジトリをクローンしてDocker Composeですべてのサービスを起動：

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# Review and edit environment variables in docker-compose.yml
# (database password, admin credentials, listen ports)
docker compose up -d
```

3つのコンテナが起動します：

| コンテナ | ポート | 説明 |
|-----------|------|-------------|
| `prx-waf` | `80`、`443` | リバースプロキシ（HTTP + HTTPS） |
| `prx-waf` | `9527` | 管理API + Vue 3 UI |
| `postgres` | `5432` | PostgreSQL 16データベース |

デプロイメントを確認：

```bash
# Check container status
docker compose ps

# Check health endpoint
curl http://localhost:9527/health
```

`http://localhost:9527`で管理UIを開き、デフォルト認証情報`admin` / `admin`でログインします。

::: warning デフォルトパスワードの変更
初回ログイン後すぐにデフォルト管理者パスワードを変更してください。管理UI の**設定 > アカウント**またはAPIを使用してください。
:::

### PodmanでのDocker Compose

DockerではなくPodmanを使用している場合：

```bash
podman-compose up -d --build
```

::: info Podman DNS
Podmanを使用する場合、コンテナ間通信のDNSリゾルバーアドレスはDockerの`127.0.0.11`ではなく`10.89.0.1`です。付属の`docker-compose.yml`はこれを自動的に処理します。
:::

## 方法2：Cargoインストール

Rustがインストールされている場合、リポジトリからPRX-WAFをインストールできます：

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
cargo build --release
```

バイナリは`target/release/prx-waf`に配置されます。PATHにコピー：

```bash
sudo cp target/release/prx-waf /usr/local/bin/prx-waf
```

::: warning ビルド依存関係
Cargoビルドはネイティブ依存関係をコンパイルします。Debian/Ubuntuでは以下が必要な場合があります：
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
macOSでは、Xcode Command Line Toolsが必要です：
```bash
xcode-select --install
```
:::

### データベースのセットアップ

PRX-WAFにはPostgreSQL 16以上のデータベースが必要です：

```bash
# Create database and user
createdb prx_waf
createuser prx_waf

# Run migrations
./target/release/prx-waf -c configs/default.toml migrate

# Create default admin user (admin/admin)
./target/release/prx-waf -c configs/default.toml seed-admin
```

### サーバーの起動

```bash
./target/release/prx-waf -c configs/default.toml run
```

これによりポート80/443でリバースプロキシが起動し、ポート9527で管理APIが起動します。

## 方法3：ソースからビルド（開発）

管理UIのライブリロードを伴う開発向け：

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# Build the Rust backend
cargo build

# Build the admin UI
cd web/admin-ui
npm install
npm run build
cd ../..

# Start the development server
cargo run -- -c configs/default.toml run
```

### 本番用管理UIのビルド

```bash
cd web/admin-ui
npm install
npm run build
```

ビルドされたファイルはコンパイル時にRustバイナリに埋め込まれ、APIサーバーによって提供されます。

## systemdサービス

ベアメタルでの本番デプロイメントのために、systemdサービスを作成：

```ini
# /etc/systemd/system/prx-waf.service
[Unit]
Description=PRX-WAF Web Application Firewall
After=network.target postgresql.service

[Service]
Type=simple
User=prx-waf
ExecStart=/usr/local/bin/prx-waf -c /etc/prx-waf/config.toml run
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-waf
sudo systemctl status prx-waf
```

## インストールの確認

インストール後、PRX-WAFが実行中であることを確認：

```bash
# Check health endpoint
curl http://localhost:9527/health

# Check admin UI
curl -s http://localhost:9527 | head -5
```

`http://localhost:9527`の管理UIにログインして、ダッシュボードが正しく読み込まれることを確認します。

## 次のステップ

- [クイックスタート](./quickstart) -- 5分で最初のアプリケーションを保護
- [設定](../configuration/) -- PRX-WAF設定のカスタマイズ
- [ルールエンジン](../rules/) -- 検出パイプラインの理解
