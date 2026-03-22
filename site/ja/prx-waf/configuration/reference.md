---
title: 設定リファレンス
description: "タイプ、デフォルト値、詳細な説明を含む、すべてのPRX-WAF TOMLコンフィグキーの完全リファレンス。"
---

# 設定リファレンス

このページはPRX-WAF TOMLコンフィグファイルのすべての設定キーを文書化しています。デフォルト設定ファイルは`configs/default.toml`です。

## プロキシ設定（`[proxy]`）

リバースプロキシリスナーを制御する設定。

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `listen_addr` | `string` | `"0.0.0.0:80"` | HTTPリスナーアドレス |
| `listen_addr_tls` | `string` | `"0.0.0.0:443"` | HTTPSリスナーアドレス |
| `worker_threads` | `integer \| null` | `null`（CPU数） | プロキシワーカースレッド数。nullの場合、論理CPUコア数を使用。 |

## API設定（`[api]`）

管理APIと管理UIの設定。

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `listen_addr` | `string` | `"127.0.0.1:9527"` | 管理API + UIリスナーアドレス。localhostのみにアクセスを制限するために本番環境では`127.0.0.1`にバインド。 |

## ストレージ設定（`[storage]`）

PostgreSQLデータベース接続。

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `database_url` | `string` | `"postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"` | PostgreSQL接続URL |
| `max_connections` | `integer` | `20` | プール内の最大データベース接続数 |

## キャッシュ設定（`[cache]`）

インメモリmokaLRUキャッシュを使用したレスポンスキャッシング設定。

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `enabled` | `boolean` | `true` | レスポンスキャッシングを有効化 |
| `max_size_mb` | `integer` | `256` | キャッシュの最大サイズ（メガバイト） |
| `default_ttl_secs` | `integer` | `60` | キャッシュされたレスポンスのデフォルトTTL（秒） |
| `max_ttl_secs` | `integer` | `3600` | 最大TTLキャップ（秒）。上流ヘッダーに関係なく、これより長くキャッシュすることはできません。 |

## HTTP/3設定（`[http3]`）

QUICを通じたHTTP/3（Quinnライブラリ）。

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `enabled` | `boolean` | `false` | HTTP/3サポートを有効化 |
| `listen_addr` | `string` | `"0.0.0.0:443"` | QUICリスナーアドレス（UDP） |
| `cert_pem` | `string` | -- | TLS証明書へのパス（PEMフォーマット） |
| `key_pem` | `string` | -- | TLS秘密鍵へのパス（PEMフォーマット） |

::: warning
HTTP/3には有効なTLS証明書が必要です。`enabled = true`の場合、`cert_pem`と`key_pem`の両方を設定する必要があります。
:::

## セキュリティ設定（`[security]`）

管理APIとプロキシのセキュリティ設定。

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `admin_ip_allowlist` | `string[]` | `[]` | 管理APIへのアクセスが許可されたIP/CIDRのリスト。空はすべてを許可。 |
| `max_request_body_bytes` | `integer` | `10485760`（10 MB） | 最大リクエストボディサイズ（バイト）。これを超えるリクエストは413で拒否。 |
| `api_rate_limit_rps` | `integer` | `0` | 管理API用のIP別レート制限（リクエスト毎秒）。`0`は無効。 |
| `cors_origins` | `string[]` | `[]` | 管理API用のCORS許可オリジン。空はすべてのオリジンを許可。 |

## ルール設定（`[rules]`）

ルールエンジン設定。

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `dir` | `string` | `"rules/"` | ルールファイルを含むディレクトリ |
| `hot_reload` | `boolean` | `true` | 自動ルールリロードのためのファイルシステム監視を有効化 |
| `reload_debounce_ms` | `integer` | `500` | ファイル変更イベントのデバウンスウィンドウ（ミリ秒） |
| `enable_builtin_owasp` | `boolean` | `true` | 内蔵OWASP CRSルールを有効化 |
| `enable_builtin_bot` | `boolean` | `true` | 内蔵ボット検出ルールを有効化 |
| `enable_builtin_scanner` | `boolean` | `true` | 内蔵スキャナー検出ルールを有効化 |

### ルールソース（`[[rules.sources]]`）

複数のルールソース（ローカルディレクトリまたはリモートURL）を設定：

| キー | タイプ | 必須 | 説明 |
|-----|------|----------|-------------|
| `name` | `string` | はい | ソース名（例：`"custom"`、`"owasp-crs"`） |
| `path` | `string` | いいえ | ローカルディレクトリパス |
| `url` | `string` | いいえ | ルール取得のためのリモートURL |
| `format` | `string` | はい | ルールフォーマット：`"yaml"`、`"json"`、または`"modsec"` |
| `update_interval` | `integer` | いいえ | 自動更新間隔（秒）（リモートソースのみ） |

```toml
[[rules.sources]]
name   = "custom"
path   = "rules/custom/"
format = "yaml"

[[rules.sources]]
name            = "owasp-crs"
url             = "https://example.com/rules/owasp.yaml"
format          = "yaml"
update_interval = 86400
```

## CrowdSec設定（`[crowdsec]`）

CrowdSec脅威インテリジェンス統合。

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `enabled` | `boolean` | `false` | CrowdSec統合を有効化 |
| `mode` | `string` | `"bouncer"` | 統合モード：`"bouncer"`、`"appsec"`、または`"both"` |
| `lapi_url` | `string` | `"http://127.0.0.1:8080"` | CrowdSec LAPI URL |
| `api_key` | `string` | `""` | バウンサーAPIキー |
| `update_frequency_secs` | `integer` | `10` | 決定キャッシュ更新間隔（秒） |
| `fallback_action` | `string` | `"allow"` | LAPIが到達不能の場合のアクション：`"allow"`、`"block"`、または`"log"` |
| `appsec_endpoint` | `string` | -- | AppSec HTTP検査エンドポイントURL（オプション） |
| `appsec_key` | `string` | -- | AppSec APIキー（オプション） |

## ホスト設定（`[[hosts]]`）

静的ホストエントリ（管理UI/APIでも管理可能）：

| キー | タイプ | 必須 | 説明 |
|-----|------|----------|-------------|
| `host` | `string` | はい | マッチするドメイン名 |
| `port` | `integer` | はい | リッスンポート（通常80または443） |
| `remote_host` | `string` | はい | 上流バックエンドIPまたはホスト名 |
| `remote_port` | `integer` | はい | 上流バックエンドポート |
| `ssl` | `boolean` | いいえ | 上流にHTTPSを使用（デフォルト：false） |
| `guard_status` | `boolean` | いいえ | WAF保護を有効化（デフォルト：true） |

## クラスター設定（`[cluster]`）

マルチノードクラスター設定。詳細は[クラスターモード](../cluster/)を参照。

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `enabled` | `boolean` | `false` | クラスターモードを有効化 |
| `node_id` | `string` | `""`（自動） | 一意のノード識別子。空の場合は自動生成。 |
| `role` | `string` | `"auto"` | ノードロール：`"auto"`、`"main"`、または`"worker"` |
| `listen_addr` | `string` | `"0.0.0.0:16851"` | ノード間通信のQUICリッスンアドレス |
| `seeds` | `string[]` | `[]` | クラスター参加のためのシードノードアドレス |

### クラスタークリプト（`[cluster.crypto]`）

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `ca_cert` | `string` | -- | CA証明書へのパス（PEM） |
| `ca_key` | `string` | -- | CA秘密鍵へのパス（メインノードのみ） |
| `node_cert` | `string` | -- | ノード証明書へのパス（PEM） |
| `node_key` | `string` | -- | ノード秘密鍵へのパス（PEM） |
| `auto_generate` | `boolean` | `true` | 最初の起動時に証明書を自動生成 |
| `ca_validity_days` | `integer` | `3650` | CA証明書の有効期間（日） |
| `node_validity_days` | `integer` | `365` | ノード証明書の有効期間（日） |
| `renewal_before_days` | `integer` | `7` | 有効期限のこの日数前に自動更新 |

### クラスター同期（`[cluster.sync]`）

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `rules_interval_secs` | `integer` | `10` | ルールバージョンチェック間隔 |
| `config_interval_secs` | `integer` | `30` | 設定同期間隔 |
| `events_batch_size` | `integer` | `100` | この数でイベントバッチをフラッシュ |
| `events_flush_interval_secs` | `integer` | `5` | バッチが満杯でなくてもイベントをフラッシュ |
| `stats_interval_secs` | `integer` | `10` | 統計レポート間隔 |
| `events_queue_size` | `integer` | `10000` | イベントキューサイズ（満杯の場合は最古をドロップ） |

### クラスター選出（`[cluster.election]`）

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `timeout_min_ms` | `integer` | `150` | 最小選出タイムアウト（ms） |
| `timeout_max_ms` | `integer` | `300` | 最大選出タイムアウト（ms） |
| `heartbeat_interval_ms` | `integer` | `50` | メインからワーカーへのハートビート間隔（ms） |
| `phi_suspect` | `float` | `8.0` | Phi累積疑わしきしきい値 |
| `phi_dead` | `float` | `12.0` | Phi累積死亡しきい値 |

### クラスターヘルス（`[cluster.health]`）

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `check_interval_secs` | `integer` | `5` | ヘルスチェック頻度 |
| `max_missed_heartbeats` | `integer` | `3` | N回ミス後にピアを不健全とマーク |

## 完全なデフォルト設定

参考として、リポジトリの[default.toml](https://github.com/openprx/prx-waf/blob/main/configs/default.toml)ファイルを参照してください。

## 次のステップ

- [設定概要](./index) -- 設定レイヤーがどのように連携するか
- [クラスターデプロイメント](../cluster/deployment) -- クラスター固有の設定
- [ルールエンジン](../rules/) -- ルールエンジン設定の詳細
