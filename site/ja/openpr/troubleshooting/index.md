---
title: トラブルシューティング
description: "データベース接続、認証エラー、Dockerの問題、MCPサーバー設定など、OpenPRの一般的な問題の解決策。"
---

# トラブルシューティング

このページはOpenPRの実行中に発生する一般的な問題とその解決策を説明します。

## データベース接続

### APIが「connection refused」で起動に失敗する

APIサーバーがPostgreSQLの準備が整う前に起動します。

**解決策**: Docker Composeファイルにはヘルスチェックと`condition: service_healthy`付きの`depends_on`が含まれています。問題が続く場合は、PostgreSQLの`start_period`を増やしてください：

```yaml
postgres:
  healthcheck:
    start_period: 30s  # Increase from default 10s
```

### 「role openpr does not exist」

PostgreSQLユーザーが作成されていません。

**解決策**: Docker Composeの環境に`POSTGRES_USER`と`POSTGRES_PASSWORD`が設定されていることを確認してください。PostgreSQLを手動で実行している場合：

```bash
createuser -U postgres openpr
createdb -U postgres -O openpr openpr
```

### マイグレーションが適用されていない

マイグレーションはPostgreSQLコンテナの初回起動時にのみ自動的に実行されます（`docker-entrypoint-initdb.d`経由）。

**解決策**: データベースがすでに存在する場合は、手動でマイグレーションを適用：

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr
# Then run each migration SQL file in order
```

またはボリュームを再作成：

```bash
docker-compose down -v
docker-compose up -d
```

::: warning データ損失
`docker-compose down -v`はデータベースボリュームを削除します。先にデータをバックアップしてください。
:::

## 認証

### サーバー再起動後に「Invalid token」

JWTトークンは`JWT_SECRET`で署名されます。この値が再起動間で変更されると、すべての既存トークンが無効になります。

**解決策**: `.env`に固定の`JWT_SECRET`を設定：

```bash
JWT_SECRET=your-fixed-random-secret-here
```

### 最初のユーザーが管理者でない

管理者ロールは最初に登録したユーザーに割り当てられます。`role: "admin"`の代わりに`role: "user"`が表示される場合、別のアカウントが最初に登録されています。

**解決策**: データベースを使用してロールを更新：

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr \
  -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
```

## Docker / Podman

### PodmanビルドがDNSエラーで失敗する

Podmanのデフォルトネットワークはビルド時にDNSアクセスを持ちません。

**解決策**: Podmanでイメージをビルドする際は常に`--network=host`を使用：

```bash
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
```

### フロントエンドに「502 Bad Gateway」が表示される

NginxコンテナがAPIサーバーに到達できません。

**解決策**: 以下を確認：
1. APIコンテナが実行中：`docker-compose ps`
2. APIヘルスチェックが通過：`docker exec openpr-api curl -f http://localhost:8080/health`
3. 両方のコンテナが同じネットワーク上：`docker network inspect openpr_openpr-network`

### ポートの競合

別のサービスが同じポートを使用しています。

**解決策**: `docker-compose.yml`の外部ポートマッピングを変更：

```yaml
api:
  ports:
    - "8082:8080"  # Changed from 8081
```

## MCPサーバー

### 「tools/list returns empty」

MCPサーバーがAPIに接続できません。

**解決策**: 環境変数を確認：

```bash
docker exec openpr-mcp-server env | grep OPENPR
```

以下を確認：
- `OPENPR_API_URL`が正しいAPIエンドポイントを指している
- `OPENPR_BOT_TOKEN`が有効なボットトークン（`opr_`で始まる）
- `OPENPR_WORKSPACE_ID`が有効なワークスペースUUID

### stdioトランスポートが機能しない

MCPバイナリはAIクライアントでコマンドとして設定する必要があります。

**解決策**: バイナリパスが正しく、環境変数が設定されていることを確認：

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/absolute/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_...",
        "OPENPR_WORKSPACE_ID": "..."
      }
    }
  }
}
```

### SSE接続が切断される

SSE接続はタイムアウトが短いプロキシサーバーによって閉じられることがあります。

**解決策**: リバースプロキシを使用している場合は、SSEエンドポイントのタイムアウトを増やしてください：

```
# Caddy
reverse_proxy /sse localhost:8090 {
    flush_interval -1
}
```

## フロントエンド

### デプロイ後にブランクページが表示される

フロントエンドのビルドが間違ったAPI URLを使用している可能性があります。

**解決策**: ビルド前に`VITE_API_URL`を設定：

```bash
VITE_API_URL=https://your-domain.example.com/api npm run build
```

### ログインは機能するがページが空

APIリクエストがサイレントに失敗しています。ブラウザコンソール（F12）で401またはCORSエラーを確認してください。

**解決策**: APIがブラウザからアクセス可能で、CORSが設定されていることを確認してください。フロントエンドはNginxを通じてAPIリクエストをプロキシするべきです。

## パフォーマンス

### 検索が遅い

PostgreSQLのフルテキスト検索は適切なインデックスなしでは大規模なデータセットで遅くなることがあります。

**解決策**: FTSインデックスが存在することを確認（マイグレーションで作成される）：

```sql
-- Check for existing indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'work_items';
```

### メモリ使用量が多い

APIサーバーはファイルアップロードをメモリ内で処理します。

**解決策**: アップロードサイズを制限し、`uploads/`ディレクトリを監視してください。古いアップロードの定期的なクリーンアップを設定することを検討してください。

## ヘルプの取得

ここで問題が解決しない場合：

1. 既知の問題の[GitHubのIssues](https://github.com/openprx/openpr/issues)を確認。
2. エラーメッセージのためにAPIとMCPサーバーのログをレビュー。
3. エラーログ、環境の詳細、再現手順を含む新しいissueを開く。
