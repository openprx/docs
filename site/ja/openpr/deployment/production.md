---
title: プロダクションデプロイメント
description: "Caddyリバースプロキシ、自動HTTPS、PostgreSQLの堅牢化、セキュリティのベストプラクティスでOpenPRをプロダクション環境にデプロイ。"
---

# プロダクションデプロイメント

このガイドでは、HTTPS、リバースプロキシ、データベースの堅牢化、セキュリティのベストプラクティスを備えたプロダクション環境へのOpenPRのデプロイについて説明します。

## アーキテクチャ

```mermaid
graph LR
    INTERNET["インターネット<br/>:443"] --> CADDY["Caddy<br/>自動HTTPS"]
    CADDY --> FE["フロントエンド<br/>Nginx :3000"]
    FE --> API["API :8080"]
    FE --> MCP["MCP :8090"]
    API --> PG["PostgreSQL :5432"]
    WORKER["Worker"] --> PG
```

## 前提条件

- 少なくとも2 CPUコアと2 GB RAMのサーバー
- サーバーのIPアドレスに向けられたドメイン名
- DockerとDocker Compose（またはPodman）

## ステップ1: 環境を設定

プロダクション用`.env`ファイルを作成：

```bash
# Database (use strong passwords)
DATABASE_URL=postgres://openpr:STRONG_PASSWORD_HERE@postgres:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE

# JWT (generate a random secret)
JWT_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_TTL_SECONDS=86400
JWT_REFRESH_TTL_SECONDS=604800

# Logging
RUST_LOG=info
```

::: danger シークレット
`.env`ファイルをバージョン管理にコミットしないでください。`chmod 600 .env`を使用してファイル権限を制限してください。
:::

## ステップ2: Caddyをセットアップ

ホストシステムにCaddyをインストール：

```bash
sudo apt install -y caddy
```

Caddyfileを設定：

```
# /etc/caddy/Caddyfile
your-domain.example.com {
    reverse_proxy localhost:3000
}
```

CaddyはLet's Encrypt TLS証明書を自動的に取得して更新します。

Caddyを起動：

```bash
sudo systemctl enable --now caddy
```

::: tip 代替: Nginx
Nginxを好む場合は、ポート3000へのプロキシパスを設定し、TLS証明書にはcertbotを使用してください。
:::

## ステップ3: Docker Composeでデプロイ

```bash
cd /opt/openpr
docker-compose up -d
```

すべてのサービスが正常かどうかを確認：

```bash
docker-compose ps
curl -k https://your-domain.example.com/health
```

## ステップ4: 管理者アカウントを作成

ブラウザで`https://your-domain.example.com`を開き、管理者アカウントを登録します。

::: warning 最初のユーザー
最初に登録したユーザーが管理者になります。URLを共有する前に管理者アカウントを登録してください。
:::

## セキュリティチェックリスト

### 認証

- [ ] `JWT_SECRET`をランダムな32文字以上の値に変更
- [ ] 適切なトークンTTL値を設定（アクセスは短く、リフレッシュは長く）
- [ ] デプロイ後すぐに管理者アカウントを作成

### データベース

- [ ] PostgreSQLに強力なパスワードを使用
- [ ] PostgreSQLポート（5432）をインターネットに公開しない
- [ ] データベースがリモートの場合はPostgreSQL SSL接続を有効化
- [ ] 定期的なデータベースバックアップを設定

### ネットワーク

- [ ] HTTPS（TLS 1.3）でCaddyまたはNginxを使用
- [ ] ポート443（HTTPS）とオプションで8090（MCP）のみをインターネットに公開
- [ ] ファイアウォール（ufw、iptables）を使用してアクセスを制限
- [ ] MCPサーバーアクセスを既知のIP範囲に制限することを検討

### アプリケーション

- [ ] `RUST_LOG=info`を設定（プロダクションではdebugやtraceは使わない）
- [ ] アップロードディレクトリのディスク使用量を監視
- [ ] コンテナログのログローテーションを設定

## データベースバックアップ

自動PostgreSQLバックアップをセットアップ：

```bash
#!/bin/bash
# /opt/openpr/backup.sh
BACKUP_DIR="/opt/openpr/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

docker exec openpr-postgres pg_dump -U openpr openpr | gzip > "$BACKUP_DIR/openpr_$DATE.sql.gz"

# Keep only last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
```

cronに追加：

```bash
# Daily backup at 2 AM
0 2 * * * /opt/openpr/backup.sh
```

## 監視

### ヘルスチェック

サービスのヘルスエンドポイントを監視：

```bash
# API
curl -f http://localhost:8080/health

# MCP Server
curl -f http://localhost:8090/health
```

### ログ監視

```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f api --tail=100
```

## スケーリングの考慮事項

- **APIサーバー**: ロードバランサーの背後で複数のレプリカを実行可能。すべてのインスタンスが同じPostgreSQLデータベースに接続。
- **Worker**: 重複したジョブ処理を避けるために単一インスタンスを実行。
- **MCPサーバー**: 複数のレプリカを実行可能。各インスタンスはステートレス。
- **PostgreSQL**: 高可用性のためにPostgreSQLレプリケーションやマネージドデータベースサービスを検討。

## 更新

OpenPRを更新するには：

```bash
cd /opt/openpr
git pull origin main
docker-compose down
docker-compose up -d --build
```

データベースマイグレーションはAPIサーバーの起動時に自動的に適用されます。

## 次のステップ

- [Dockerデプロイメント](./docker) -- Docker Composeリファレンス
- [設定](../configuration/) -- 環境変数リファレンス
- [トラブルシューティング](../troubleshooting/) -- 一般的なプロダクションの問題
