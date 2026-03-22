---
title: インストール
description: "Docker Compose、Podman、またはRustとNode.jsを使用したソースビルドでOpenPRをインストール。"
---

# インストール

OpenPRは3つのインストール方法をサポートしています。Docker Composeが完全に動作するインスタンスを最も素早く立ち上げる方法です。

::: tip 推奨
**Docker Compose**は単一のコマンドですべてのサービス（API、フロントエンド、ワーカー、MCPサーバー、PostgreSQL）を起動します。RustツールチェーンやNode.jsは不要です。
:::

## 前提条件

| 要件 | 最小バージョン | 備考 |
|-------------|---------|-------|
| Docker | 20.10+ | またはPodman 3.0+ with podman-compose |
| Docker Compose | 2.0+ | Docker Desktopに同梱 |
| Rust（ソースビルド） | 1.75.0 | Dockerインストールには不要 |
| Node.js（ソースビルド） | 20+ | SvelteKitフロントエンドのビルド用 |
| PostgreSQL（ソースビルド） | 15+ | Dockerメソッドにはロールに含まれる |
| ディスクスペース | 500 MB | イメージ + データベース |
| RAM | 1 GB | プロダクション環境では2 GB+推奨 |

## 方法1: Docker Compose（推奨）

リポジトリをクローンしてすべてのサービスを起動：

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
docker-compose up -d
```

これにより5つのサービスが起動します：

| サービス | コンテナ | ポート | 説明 |
|---------|-----------|------|-------------|
| PostgreSQL | `openpr-postgres` | 5432 | 自動マイグレーション付きデータベース |
| API | `openpr-api` | 8081 (8080にマップ) | REST APIサーバー |
| Worker | `openpr-worker` | -- | バックグラウンドタスクプロセッサー |
| MCPサーバー | `openpr-mcp-server` | 8090 | MCPツールサーバー |
| フロントエンド | `openpr-frontend` | 3000 | SvelteKit Web UI |

すべてのサービスが実行中であることを確認：

```bash
docker-compose ps
```

::: warning 最初のユーザー
最初に登録したユーザーが自動的に**admin**になります。URLを他の人と共有する前に管理者アカウントを登録してください。
:::

### 環境変数

`.env`を編集してデプロイメントをカスタマイズ：

```bash
# Database
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (change in production!)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# Frontend
VITE_API_URL=http://localhost:8080

# MCP Server
MCP_SERVER_PORT=8090
```

::: danger セキュリティ
プロダクションにデプロイする前に`JWT_SECRET`とデータベースパスワードを必ず変更してください。強力なランダム値を使用してください。
:::

## 方法2: Podman

OpenPRはDockerの代替としてPodmanで動作します。主な違いは、DNS解決のためPodmanはビルド時に`--network=host`が必要なことです：

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env

# Build images with network access
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
sudo podman build --network=host --build-arg APP_BIN=worker -f Dockerfile.prebuilt -t openpr_worker .
sudo podman build --network=host --build-arg APP_BIN=mcp-server -f Dockerfile.prebuilt -t openpr_mcp-server .
sudo podman build --network=host -f frontend/Dockerfile -t openpr_frontend frontend/

# Start services
sudo podman-compose up -d
```

::: tip Podman DNS
フロントエンドのNginxコンテナはDNSリゾルバとして`10.89.0.1`（PodmanのデフォルトネットワークDNS）を使用します。Dockerのデフォルト（`127.0.0.11`）ではありません。これはインクルードされているNginx設定ですでに設定されています。
:::

## 方法3: ソースからビルド

### バックエンド

```bash
# Prerequisites: Rust 1.75+, PostgreSQL 15+
git clone https://github.com/openprx/openpr.git
cd openpr

# Configure
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Build all binaries
cargo build --release -p api -p worker -p mcp-server
```

バイナリは以下の場所にあります：
- `target/release/api` -- REST APIサーバー
- `target/release/worker` -- バックグラウンドワーカー
- `target/release/mcp-server` -- MCPツールサーバー

### フロントエンド

```bash
cd frontend
npm install    # or: bun install
npm run build  # or: bun run build
```

ビルド出力は`frontend/build/`にあります。Nginxまたはその他の静的ファイルサーバーで提供してください。

### データベースセットアップ

データベースを作成してマイグレーションを実行：

```bash
# Create database
createdb -U postgres openpr

# Migrations run automatically on first API start
# Or apply manually:
psql -U openpr -d openpr -f migrations/0001_initial.sql
# ... apply remaining migrations in order
```

### サービスの起動

```bash
# Terminal 1: API server
./target/release/api

# Terminal 2: Worker
./target/release/worker

# Terminal 3: MCP server
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090
```

## インストールの確認

すべてのサービスが実行中になったら、各エンドポイントを確認：

```bash
# API health check
curl http://localhost:8080/health

# MCP server health
curl http://localhost:8090/health

# Frontend
curl -s http://localhost:3000 | head -5
```

ブラウザでhttp://localhost:3000を開いてWeb UIにアクセスしてください。

## アンインストール

### Docker Compose

```bash
cd openpr
docker-compose down -v  # -v removes volumes (database data)
docker rmi $(docker images 'openpr*' -q)
```

### ソースビルド

```bash
# Stop running services (Ctrl+C in each terminal)
# Remove binaries
rm -f target/release/api target/release/worker target/release/mcp-server

# Drop database (optional)
dropdb -U postgres openpr
```

## 次のステップ

- [クイックスタート](./quickstart) -- 5分で最初のワークスペースとプロジェクトを作成
- [Dockerデプロイメント](../deployment/docker) -- プロダクションDocker設定
- [プロダクションデプロイメント](../deployment/production) -- Caddy、PostgreSQL、セキュリティ強化
