---
title: Dockerデプロイメント
description: "Docker ComposeまたはPodmanでOpenPRをデプロイ。サービス設定、ネットワーク、ボリューム、ヘルスチェックを含む。"
---

# Dockerデプロイメント

OpenPRは単一のコマンドで必要なすべてのサービスを起動する`docker-compose.yml`を提供します。

## クイックスタート

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
# Edit .env with production values
docker-compose up -d
```

## サービスアーキテクチャ

```mermaid
graph LR
    subgraph Docker["Dockerネットワーク (openpr-network)"]
        PG["PostgreSQL<br/>:5432"]
        API["APIサーバー<br/>:8080"]
        WORKER["Worker"]
        MCP["MCPサーバー<br/>:8090"]
        FE["フロントエンド<br/>:80"]
    end

    PG --> API
    PG --> WORKER
    API --> MCP
    API --> FE

    USER["ユーザー<br/>ブラウザ"] -->|":3000"| FE
    AIBOT["AIアシスタント"] -->|":8090"| MCP
```

## サービス

### PostgreSQL

```yaml
postgres:
  image: postgres:16
  container_name: openpr-postgres
  environment:
    POSTGRES_DB: openpr
    POSTGRES_USER: openpr
    POSTGRES_PASSWORD: openpr
  ports:
    - "5432:5432"
  volumes:
    - pgdata:/var/lib/postgresql/data
    - ./migrations:/docker-entrypoint-initdb.d
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U openpr -d openpr"]
    interval: 5s
    timeout: 3s
    retries: 20
```

`migrations/`ディレクトリのマイグレーションはPostgreSQLの`docker-entrypoint-initdb.d`メカニズムにより初回起動時に自動的に実行されます。

### APIサーバー

```yaml
api:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: api
  container_name: openpr-api
  environment:
    BIND_ADDR: 0.0.0.0:8080
    DATABASE_URL: postgres://openpr:openpr@postgres:5432/openpr
    JWT_SECRET: ${JWT_SECRET:-change-me-in-production}
    UPLOAD_DIR: /app/uploads
  ports:
    - "8081:8080"
  volumes:
    - ./uploads:/app/uploads
  depends_on:
    postgres:
      condition: service_healthy
```

### Worker

```yaml
worker:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: worker
  container_name: openpr-worker
  environment:
    DATABASE_URL: postgres://openpr:openpr@postgres:5432/openpr
  depends_on:
    postgres:
      condition: service_healthy
```

ワーカーは公開ポートがありません -- PostgreSQLに直接接続してバックグラウンドジョブを処理します。

### MCPサーバー

```yaml
mcp-server:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: mcp-server
  container_name: openpr-mcp-server
  environment:
    OPENPR_API_URL: http://api:8080
    OPENPR_BOT_TOKEN: opr_your_token
    OPENPR_WORKSPACE_ID: your-workspace-uuid
  command: ["./mcp-server", "serve", "--transport", "http", "--bind-addr", "0.0.0.0:8090"]
  ports:
    - "8090:8090"
  depends_on:
    api:
      condition: service_healthy
```

### フロントエンド

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: openpr-frontend
  ports:
    - "3000:80"
  depends_on:
    api:
      condition: service_healthy
```

## ボリューム

| ボリューム | 目的 |
|--------|---------|
| `pgdata` | PostgreSQLデータの永続化 |
| `./uploads` | ファイルアップロードストレージ |
| `./migrations` | データベースマイグレーションスクリプト |

## ヘルスチェック

すべてのサービスはヘルスチェックを含みます：

| サービス | チェック | 間隔 |
|---------|-------|----------|
| PostgreSQL | `pg_isready` | 5秒 |
| API | `curl /health` | 10秒 |
| MCPサーバー | `curl /health` | 10秒 |
| フロントエンド | `wget /health` | 30秒 |

## 一般的な操作

```bash
# View logs
docker-compose logs -f api
docker-compose logs -f mcp-server

# Restart a service
docker-compose restart api

# Rebuild and restart
docker-compose up -d --build api

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# Connect to database
docker exec -it openpr-postgres psql -U openpr -d openpr
```

## Podman

Podmanユーザーの場合、主な違いは：

1. DNS アクセスのために`--network=host`でビルド：
   ```bash
   sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
   ```

2. フロントエンドNginxは`127.0.0.11`（Dockerデフォルト）ではなく`10.89.0.1`（Podmanデフォルト）をDNSリゾルバとして使用。

3. `docker-compose`の代わりに`sudo podman-compose`を使用。

## 次のステップ

- [プロダクションデプロイメント](./production) -- Caddyリバースプロキシ、HTTPS、セキュリティ
- [設定](../configuration/) -- 環境変数リファレンス
- [トラブルシューティング](../troubleshooting/) -- 一般的なDockerの問題
