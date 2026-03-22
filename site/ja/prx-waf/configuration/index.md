---
title: 設定概要
description: "PRX-WAF設定の仕組み。TOMLコンフィグファイル構造、環境変数のオーバーライド、ファイルベース設定とデータベース保存設定の関係。"
---

# 設定

PRX-WAFは`-c` / `--config`フラグで渡されるTOMLファイルを通じて設定されます。デフォルトパスは`configs/default.toml`です。

```bash
prx-waf -c /etc/prx-waf/config.toml run
```

## 設定ソース

PRX-WAFは2つの設定レイヤーを使用します：

| ソース | スコープ | 説明 |
|--------|-------|-------------|
| TOMLファイル | サーバー起動 | プロキシポート、データベースURL、キャッシュ、HTTP/3、セキュリティ、クラスター |
| データベース | ランタイム | ホスト、ルール、証明書、プラグイン、トンネル、通知 |

TOMLファイルには起動時に必要な設定が含まれます（ポート、データベース接続、クラスター設定）。ホストやルールなどのランタイム設定はPostgreSQLに保存され、管理UIまたはREST APIで管理されます。

## 設定ファイル構造

TOMLコンフィグファイルには以下のセクションがあります：

```toml
[proxy]          # Reverse proxy listener addresses
[api]            # Admin API listener address
[storage]        # PostgreSQL connection
[cache]          # Response cache settings
[http3]          # HTTP/3 QUIC settings
[security]       # Admin API security (IP allowlist, rate limit, CORS)
[rules]          # Rule engine settings (directory, hot-reload, sources)
[crowdsec]       # CrowdSec integration
[cluster]        # Cluster mode (optional)
```

### 最小設定

開発用の最小設定：

```toml
[proxy]
listen_addr = "0.0.0.0:80"

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

### 本番設定

すべてのセキュリティ機能を持つ本番設定：

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"
worker_threads  = 4

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url    = "postgresql://prx_waf:STRONG_PASSWORD@db.internal:5432/prx_waf"
max_connections = 20

[cache]
enabled          = true
max_size_mb      = 512
default_ttl_secs = 120
max_ttl_secs     = 3600

[security]
admin_ip_allowlist     = ["10.0.0.0/8"]
max_request_body_bytes = 10485760
api_rate_limit_rps     = 100
cors_origins           = ["https://admin.example.com"]

[rules]
dir                    = "rules/"
hot_reload             = true
reload_debounce_ms     = 500
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## ホスト設定

静的デプロイメントのためにTOMLファイルでホストを定義できます：

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "127.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

::: tip
動的な環境では、TOMLファイルの代わりに管理UIまたはREST APIでホストを管理してください。データベースに保存されたホストはTOMLで定義されたホストより優先されます。
:::

## データベースマイグレーション

PRX-WAFには必要なデータベーススキーマを作成する8つのマイグレーションファイルが含まれています：

```bash
# Run migrations
prx-waf -c configs/default.toml migrate

# Create default admin user
prx-waf -c configs/default.toml seed-admin
```

マイグレーションはべき等で、複数回実行しても安全です。

## Docker環境

Dockerデプロイメントでは、設定値は通常`docker-compose.yml`で設定されます：

```yaml
services:
  prx-waf:
    environment:
      - DATABASE_URL=postgresql://prx_waf:prx_waf@postgres:5432/prx_waf
    volumes:
      - ./configs/default.toml:/app/configs/default.toml
```

## 次のステップ

- [設定リファレンス](./reference) -- タイプとデフォルト付きのすべてのTOMLキーのドキュメント
- [インストール](../getting-started/installation) -- 初期セットアップとデータベースマイグレーション
- [クラスターモード](../cluster/) -- クラスター固有の設定
