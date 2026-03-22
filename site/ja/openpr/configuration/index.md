---
title: 設定リファレンス
description: "API、ワーカー、MCPサーバー、フロントエンド、データベースのすべてのOpenPR環境変数と設定オプションの完全リファレンス。"
---

# 設定リファレンス

OpenPRは環境変数を通じて設定されます。Docker Composeを使用する場合はすべてのサービスが同じ`.env`ファイルを読み込み、直接実行する場合は個別の環境変数を使用します。

## APIサーバー

| 変数 | デフォルト | 説明 |
|----------|---------|-------------|
| `APP_NAME` | `api` | ログ用のアプリケーション識別子 |
| `BIND_ADDR` | `0.0.0.0:8080` | APIがリッスンするアドレスとポート |
| `DATABASE_URL` | -- | PostgreSQL接続文字列 |
| `JWT_SECRET` | `change-me-in-production` | JWTトークン署名用の秘密鍵 |
| `JWT_ACCESS_TTL_SECONDS` | `2592000`（30日） | アクセストークンの有効期間（秒） |
| `JWT_REFRESH_TTL_SECONDS` | `604800`（7日） | リフレッシュトークンの有効期間（秒） |
| `RUST_LOG` | `info` | ログレベル（trace、debug、info、warn、error） |
| `UPLOAD_DIR` | `/app/uploads` | ファイルアップロードのディレクトリ |

::: danger セキュリティ
プロダクションでは`JWT_SECRET`を必ず強力でランダムな値に変更してください。少なくとも32文字のランダムデータを使用：
```bash
openssl rand -hex 32
```
:::

## データベース

| 変数 | デフォルト | 説明 |
|----------|---------|-------------|
| `DATABASE_URL` | -- | 完全なPostgreSQL接続文字列 |
| `POSTGRES_DB` | `openpr` | データベース名 |
| `POSTGRES_USER` | `openpr` | データベースユーザー |
| `POSTGRES_PASSWORD` | `openpr` | データベースパスワード |

接続文字列フォーマット：

```
postgres://user:password@host:port/database
```

::: tip Docker Compose
Docker Composeを使用する場合、データベースサービスは`postgres`という名前なので接続文字列は：
```
postgres://openpr:openpr@postgres:5432/openpr
```
:::

## ワーカー

| 変数 | デフォルト | 説明 |
|----------|---------|-------------|
| `APP_NAME` | `worker` | アプリケーション識別子 |
| `DATABASE_URL` | -- | PostgreSQL接続文字列 |
| `JWT_SECRET` | -- | APIサーバーの値と一致する必要がある |
| `RUST_LOG` | `info` | ログレベル |

ワーカーは`job_queue`と`scheduled_jobs`テーブルからバックグラウンドタスクを処理します。

## MCPサーバー

| 変数 | デフォルト | 説明 |
|----------|---------|-------------|
| `APP_NAME` | `mcp-server` | アプリケーション識別子 |
| `OPENPR_API_URL` | -- | APIサーバーURL（プロキシがある場合はそれを含む） |
| `OPENPR_BOT_TOKEN` | -- | `opr_`プレフィックス付きボットトークン |
| `OPENPR_WORKSPACE_ID` | -- | デフォルトのワークスペースUUID |
| `DATABASE_URL` | -- | PostgreSQL接続文字列 |
| `JWT_SECRET` | -- | APIサーバーの値と一致する必要がある |
| `DEFAULT_AUTHOR_ID` | -- | MCP操作のフォールバック作成者UUID |
| `RUST_LOG` | `info` | ログレベル |

### MCPトランスポートオプション

MCPサーバーバイナリはコマンドライン引数を受け付けます：

```bash
# HTTP mode (default)
mcp-server --transport http --bind-addr 0.0.0.0:8090

# stdio mode (for Claude Desktop, Codex)
mcp-server --transport stdio

# Subcommand form
mcp-server serve --transport http --bind-addr 0.0.0.0:8090
```

## フロントエンド

| 変数 | デフォルト | 説明 |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8080` | フロントエンドが接続するAPIサーバーURL |

::: tip リバースプロキシ
リバースプロキシ（Caddy/Nginx）を使用するプロダクション環境では、`VITE_API_URL`はAPIサーバーにルーティングするプロキシURLを指す必要があります。
:::

## Docker Composeポート

| サービス | 内部ポート | 外部ポート | 目的 |
|---------|---------------|---------------|---------|
| PostgreSQL | 5432 | 5432 | データベース |
| API | 8080 | 8081 | REST API |
| Worker | -- | -- | バックグラウンドタスク（ポートなし） |
| MCPサーバー | 8090 | 8090 | MCPツール |
| フロントエンド | 80 | 3000 | Web UI |

## .envファイルの例

```bash
# Database
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (CHANGE IN PRODUCTION)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# API Server
APP_NAME=api
BIND_ADDR=0.0.0.0:8080
RUST_LOG=info

# Frontend
VITE_API_URL=http://localhost:8080

# MCP Server
MCP_SERVER_PORT=8090
```

## ログレベル

OpenPRは構造化ログのために`tracing`クレートを使用します。`RUST_LOG`を設定して冗長性を制御：

| レベル | 説明 |
|-------|-------------|
| `error` | エラーのみ |
| `warn` | エラーと警告 |
| `info` | 通常の操作メッセージ（デフォルト） |
| `debug` | 詳細なデバッグ情報 |
| `trace` | 非常に詳細、すべての内部操作を含む |

モジュールごとのフィルタリングがサポートされています：

```bash
RUST_LOG=info,api=debug,mcp_server=trace
```

## 次のステップ

- [Dockerデプロイメント](../deployment/docker) -- Docker Compose設定
- [プロダクションデプロイメント](../deployment/production) -- Caddy、セキュリティ、スケーリング
- [インストール](../getting-started/installation) -- はじめに
