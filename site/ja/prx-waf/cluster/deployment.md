---
title: クラスターデプロイメント
description: "マルチノードPRX-WAFクラスターのデプロイのステップバイステップガイド。証明書生成、ノード設定、Docker Compose、検証。"
---

# クラスターデプロイメント

このガイドでは、1つのメインノードと2つのワーカーノードからなる3ノードPRX-WAFクラスターのデプロイについて説明します。

## 前提条件

- UDPポート`16851`でネットワーク接続された3台のサーバー（またはDockerホスト）
- すべてのノードからアクセス可能なPostgreSQL 16+（共有またはレプリケート）
- 各ノードにインストールされたPRX-WAFバイナリ（またはDockerイメージが利用可能）

## ステップ1：クラスター証明書の生成

cert-initコンテナまたはOpenSSLを使用して手動でCAとノード証明書を生成します。

**Docker Composeを使用（推奨）：**

リポジトリには証明書生成を処理する`docker-compose.cluster.yml`ファイルが含まれています：

```bash
# Generate certificates
docker compose -f docker-compose.cluster.yml run --rm cert-init
```

これにより共有ボリュームに証明書が作成されます：

```
cluster_certs/
├── cluster-ca.pem      # CA certificate
├── cluster-ca.key      # CA private key (main node only)
├── node-a.pem          # Main node certificate
├── node-a.key          # Main node private key
├── node-b.pem          # Worker node B certificate
├── node-b.key          # Worker node B private key
├── node-c.pem          # Worker node C certificate
└── node-c.key          # Worker node C private key
```

**auto_generateを使用：**

または、メインノードで`auto_generate = true`を設定します。ワーカーノードはジョインプロセス中に証明書を受け取ります：

```toml
[cluster.crypto]
auto_generate = true
```

## ステップ2：メインノードの設定

`configs/cluster-node-a.toml`を作成：

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"

[api]
listen_addr = "0.0.0.0:9527"

[storage]
database_url    = "postgresql://prx_waf:prx_waf@postgres:5432/prx_waf"
max_connections = 20

[cluster]
enabled     = true
node_id     = "node-a"
role        = "main"
listen_addr = "0.0.0.0:16851"
seeds       = []                # Main has no seeds

[cluster.crypto]
ca_cert   = "/certs/cluster-ca.pem"
ca_key    = "/certs/cluster-ca.key"   # Main holds the CA key
node_cert = "/certs/node-a.pem"
node_key  = "/certs/node-a.key"
auto_generate = false

[cluster.sync]
rules_interval_secs        = 10
config_interval_secs       = 30
events_batch_size          = 100
events_flush_interval_secs = 5
stats_interval_secs        = 10
events_queue_size          = 10000

[cluster.election]
timeout_min_ms        = 150
timeout_max_ms        = 300
heartbeat_interval_ms = 50

[cluster.health]
check_interval_secs   = 5
max_missed_heartbeats = 3
```

## ステップ3：ワーカーノードの設定

`configs/cluster-node-b.toml`を作成（node-cも同様）：

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"

[api]
listen_addr = "0.0.0.0:9527"

[storage]
database_url    = "postgresql://prx_waf:prx_waf@postgres:5432/prx_waf"
max_connections = 20

[cluster]
enabled     = true
node_id     = "node-b"
role        = "worker"
listen_addr = "0.0.0.0:16851"
seeds       = ["node-a:16851"]    # Points to the main node

[cluster.crypto]
ca_cert   = "/certs/cluster-ca.pem"
node_cert = "/certs/node-b.pem"
node_key  = "/certs/node-b.key"
auto_generate = false

[cluster.sync]
rules_interval_secs        = 10
config_interval_secs       = 30
events_batch_size          = 100
events_flush_interval_secs = 5

[cluster.health]
check_interval_secs   = 5
max_missed_heartbeats = 3
```

## ステップ4：クラスターの起動

**Docker Composeで：**

```bash
docker compose -f docker-compose.cluster.yml up -d
```

**手動で：**

データベース、メイン、ワーカーの順にノードを起動：

```bash
# On each node
prx-waf -c /etc/prx-waf/config.toml run
```

## ステップ5：クラスターの確認

任意のノードからクラスターステータスを確認：

```bash
# Via the admin UI — navigate to the Cluster dashboard

# Via the API
curl -H "Authorization: Bearer $TOKEN" http://node-a:9527/api/cluster/status
```

期待されるレスポンス：

```json
{
  "cluster_enabled": true,
  "node_id": "node-a",
  "role": "main",
  "peers": [
    {"node_id": "node-b", "role": "worker", "status": "healthy"},
    {"node_id": "node-c", "role": "worker", "status": "healthy"}
  ],
  "sync": {
    "last_rule_sync": "2026-03-21T10:00:00Z",
    "last_config_sync": "2026-03-21T10:00:00Z"
  }
}
```

## ロードバランサーの統合

クラスター全体にクライアントトラフィックを分散するために、クラスターの前に外部ロードバランサー（HAProxy、Nginx、またはクラウドLBなど）を配置：

```
                    ┌──── node-a (main)   :80/:443
Client → LB ───────┼──── node-b (worker) :80/:443
                    └──── node-c (worker) :80/:443
```

各ノードはWAFパイプラインを通じてトラフィックを独立して処理します。メインノードはトラフィック処理ノードでもあります -- 調整業務のみに限定されません。

::: tip
ロードバランサーのヘルスチェックには`/health`エンドポイントを使用：
```
GET http://node-a/health → 200 OK
```
:::

## クラスターのスケーリング

新しいワーカーノードを追加するには：

1. 新しいノードの証明書を生成（または`auto_generate`を使用）
2. `seeds = ["node-a:16851"]`で新しいノードを設定
3. ノードを起動 -- 自動的にクラスターに参加して同期します

ノードを削除するには、単純に停止します。クラスターヘルスチェッカーが離脱を検出し、同期から除外します。

## 次のステップ

- [クラスターモード概要](./index) -- アーキテクチャと同期の詳細
- [設定リファレンス](../configuration/reference) -- すべてのクラスター設定キー
- [トラブルシューティング](../troubleshooting/) -- 一般的なクラスターデプロイメントの問題
