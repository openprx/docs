---
title: CrowdSec統合
description: "協調的な脅威インテリジェンスのためのPRX-WAF CrowdSec統合。インメモリ決定キャッシュを持つバウンサーモード、リアルタイムHTTP分析のためのAppSecモード、コミュニティ共有のためのログプッシャー。"
---

# CrowdSec統合

PRX-WAFは[CrowdSec](https://www.crowdsec.net/)と統合し、協調的なコミュニティ駆動の脅威インテリジェンスをWAF検出パイプラインに直接取り込みます。ローカルルールとヒューリスティックのみに依存するのではなく、PRX-WAFはCrowdSecネットワーク（数千のマシンがリアルタイムで攻撃シグナルを共有）を活用し、既知の悪意のあるIPをブロックし、アプリケーション層の攻撃を検出し、WAFイベントをコミュニティに貢献できます。

統合は**3つのモード**で動作し、独立して、または組み合わせて使用できます：

| モード | 目的 | レイテンシ | パイプラインフェーズ |
|------|---------|---------|----------------|
| **バウンサー** | キャッシュされたLAPI決定でIPをブロック | マイクロ秒（インメモリ） | フェーズ16a |
| **AppSec** | CrowdSec AppSec経由で完全なHTTPリクエストを分析 | ミリ秒（HTTP呼び出し） | フェーズ16b |
| **ログプッシャー** | WAFイベントをLAPIにレポートバック | 非同期（バッチ処理） | バックグラウンド |

## 仕組み

### バウンサーモード

バウンサーモードはCrowdSec Local API（LAPI）と同期された**インメモリ決定キャッシュ**を維持します。検出パイプラインのフェーズ16aでリクエストが到着すると、PRX-WAFはキャッシュに対してO(1)ルックアップを実行します：

```
Request IP ──> DashMap (exact IP match) ──> Hit? ──> Apply decision (ban/captcha/throttle)
                     │
                     └──> Miss ──> RwLock<Vec> (CIDR range scan) ──> Hit? ──> Apply decision
                                          │
                                          └──> Miss ──> Allow (proceed to next phase)
```

キャッシュは設定可能な間隔（デフォルト：10秒ごと）でLAPIの`/v1/decisions`エンドポイントをポーリングして更新されます。この設計により、IPルックアップがネットワークI/Oをブロックすることはありません -- 同期はバックグラウンドタスクで実行されます。

**データ構造：**

- **DashMap**（正確なIPアドレス用） -- ロックフリーの並行ハッシュマップ、O(1)ルックアップ
- **RwLock\<Vec\>**（CIDR範囲用） -- キャッシュミス時に順次スキャン、通常は小さいセット

**シナリオフィルタリング**により、シナリオ名に基づいて決定を含めるまたは除外できます：

```toml
# Only act on SSH brute-force and HTTP scanning scenarios
scenarios_containing = ["ssh-bf", "http-scan"]

# Ignore decisions from these scenarios
scenarios_not_containing = ["manual"]
```

### AppSecモード

AppSecモードはリアルタイム分析のためにCrowdSec AppSecコンポーネントに完全なHTTPリクエスト詳細を送信します。IPのみをチェックするバウンサーモードとは異なり、AppSecはリクエストヘッダー、ボディ、URI、メソッドを検査してSQLインジェクション、XSS、パストラバーサルなどのアプリケーション層の攻撃を検出します。

```
Request ──> Phase 16b ──> POST http://appsec:7422/
                           Body: { method, uri, headers, body }
                           ──> CrowdSec AppSec engine
                           ──> Response: allow / block (with details)
```

AppSecチェックは**非同期**です -- PRX-WAFは設定可能なタイムアウト（デフォルト：500ms）でリクエストを送信します。AppSecエンドポイントが到達不能またはタイムアウトした場合、`fallback_action`がリクエストを許可、ブロック、またはログするかどうかを決定します。

### ログプッシャー

ログプッシャーはWAFセキュリティイベントをCrowdSec LAPIにレポートバックし、コミュニティ脅威インテリジェンスネットワークに貢献します。イベントはバッチ処理され、LAPIの負荷を最小化するために定期的にフラッシュされます。

**バッチパラメーター：**

| パラメーター | 値 | 説明 |
|-----------|-------|-------------|
| バッチサイズ | 50イベント | バッファが50イベントに達したらフラッシュ |
| フラッシュ間隔 | 30秒 | バッファが満杯でなくてもフラッシュ |
| 認証 | マシンJWT | `pusher_login` / `pusher_password`でマシン認証を使用 |
| シャットダウン | 最終フラッシュ | プロセス終了前にすべてのバッファイベントをフラッシュ |

プッシャーはマシン認証情報（バウンサーAPIキーとは別）を使用してLAPIに認証し、`/v1/alerts`エンドポイントにイベントをポストします。

## 設定

TOMLコンフィグファイルに`[crowdsec]`セクションを追加：

```toml
[crowdsec]
# Master switch
enabled = true

# Integration mode: "bouncer", "appsec", or "both"
mode = "both"

# --- Bouncer settings ---
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-api-key"
update_frequency_secs = 10
cache_ttl_secs = 0           # 0 = use LAPI-provided duration
fallback_action = "allow"    # "allow" | "block" | "log"

# Scenario filtering (optional)
scenarios_containing = []
scenarios_not_containing = []

# --- AppSec settings ---
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500

# --- Log Pusher settings ---
pusher_login = "machine-id"
pusher_password = "machine-password"
```

### 設定リファレンス

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `enabled` | `boolean` | `false` | CrowdSec統合を有効化 |
| `mode` | `string` | `"bouncer"` | 統合モード：`"bouncer"`、`"appsec"`、または`"both"` |
| `lapi_url` | `string` | `"http://127.0.0.1:8080"` | CrowdSec LAPIベースURL |
| `api_key` | `string` | `""` | バウンサーAPIキー（`cscli bouncers add`で取得） |
| `update_frequency_secs` | `integer` | `10` | LAPIからの決定キャッシュ更新頻度（秒） |
| `cache_ttl_secs` | `integer` | `0` | 決定TTLを上書き。`0`はLAPIが提供する期間を使用。 |
| `fallback_action` | `string` | `"allow"` | LAPIまたはAppSecが到達不能の場合のアクション：`"allow"`、`"block"`、または`"log"` |
| `scenarios_containing` | `string[]` | `[]` | シナリオ名がこれらの部分文字列の一つを含む決定のみをキャッシュ。空はすべて。 |
| `scenarios_not_containing` | `string[]` | `[]` | シナリオ名がこれらの部分文字列の一つを含む決定を除外。 |
| `appsec_endpoint` | `string` | -- | CrowdSec AppSecエンドポイントURL |
| `appsec_key` | `string` | -- | AppSec APIキー |
| `appsec_timeout_ms` | `integer` | `500` | AppSec HTTPリクエストタイムアウト（ミリ秒） |
| `pusher_login` | `string` | -- | LAPI認証のためのマシンログイン（ログプッシャー） |
| `pusher_password` | `string` | -- | LAPI認証のためのマシンパスワード（ログプッシャー） |

## セットアップガイド

### 前提条件

1. PRX-WAFホストからLAPIにアクセス可能な実行中のCrowdSecインスタンス
2. バウンサーAPIキー（バウンサーモード用）
3. CrowdSec AppSecコンポーネント（AppSecモード用、オプション）
4. マシン認証情報（ログプッシャー用、オプション）

### ステップ1：CrowdSecのインストール

CrowdSecがまだインストールされていない場合：

```bash
# Debian / Ubuntu
curl -s https://install.crowdsec.net | sudo sh
sudo apt install crowdsec

# Verify LAPI is running
sudo cscli metrics
```

### ステップ2：バウンサーの登録

```bash
# Create a bouncer API key for PRX-WAF
sudo cscli bouncers add prx-waf-bouncer

# Output:
# API key for 'prx-waf-bouncer':
#   abc123def456...
#
# Copy this key -- it is only shown once.
```

### ステップ3：PRX-WAFの設定

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
```

### ステップ4：接続の確認

```bash
# Using the CLI
prx-waf crowdsec test

# Or via the API
curl http://localhost:9527/api/crowdsec/test -X POST \
  -H "Authorization: Bearer <token>"
```

### ステップ5（オプション）：AppSecを有効化

CrowdSec AppSecコンポーネントが実行中の場合：

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
```

### ステップ6（オプション）：ログプッシャーを有効化

WAFイベントをCrowdSecに貢献するには：

```bash
# Register a machine on the CrowdSec LAPI
sudo cscli machines add prx-waf-pusher --password "your-secure-password"
```

```toml
[crowdsec]
pusher_login = "prx-waf-pusher"
pusher_password = "your-secure-password"
```

### インタラクティブセットアップ

ガイド付きセットアップのためにCLIウィザードを使用：

```bash
prx-waf crowdsec setup
```

ウィザードはLAPI URL設定、APIキー入力、モード選択、接続テストの手順を案内します。

## パイプライン統合

CrowdSecチェックは16フェーズのWAF検出パイプラインの**フェーズ16** -- 上流バックエンドへのプロキシ前の最終フェーズで実行されます。この配置は意図的です：

1. **より安価なチェックを先に。** IPアローリスト/ブロックリスト（フェーズ1〜4）、レート制限（フェーズ5）、パターンマッチング（フェーズ8〜13）がCrowdSecの前に実行され、外部ルックアップなしで明らかな攻撃をフィルタリングします。
2. **AppSecより前にバウンサー。** フェーズ16a（バウンサー）はマイクロ秒レイテンシで同期実行されます。IPが決定キャッシュにない場合のみ、HTTPラウンドトリップを伴うフェーズ16b（AppSec）が実行されます。
3. **ノンブロッキングアーキテクチャ。** 決定キャッシュはバックグラウンドタスクで更新されます。AppSec呼び出しはタイムアウト付きの非同期HTTPを使用します。どちらのモードもメインプロキシスレッドプールをブロックしません。

```
Phase 1-15 (local checks)
    │
    └──> Phase 16a: Bouncer (DashMap/CIDR lookup, ~1-5 us)
              │
              ├── Decision found ──> Block/Captcha/Throttle
              │
              └── No decision ──> Phase 16b: AppSec (HTTP POST, ~1-50 ms)
                                       │
                                       ├── Block ──> 403 Forbidden
                                       │
                                       └── Allow ──> Proxy to upstream
```

## REST API

すべてのCrowdSec APIエンドポイントは認証（管理APIからのJWT Bearerトークン）が必要です。

### ステータス

```http
GET /api/crowdsec/status
```

接続状態、キャッシュ統計、設定サマリーを含む現在の統合ステータスを返します。

**レスポンス：**

```json
{
  "enabled": true,
  "mode": "both",
  "lapi_connected": true,
  "appsec_connected": true,
  "cache": {
    "exact_ips": 1247,
    "cidr_ranges": 89,
    "last_refresh": "2026-03-21T10:15:30Z",
    "refresh_interval_secs": 10
  },
  "pusher": {
    "authenticated": true,
    "events_sent": 4521,
    "buffer_size": 12
  }
}
```

### 決定のリスト

```http
GET /api/crowdsec/decisions
```

タイプ、スコープ、値、有効期限を含むすべてのキャッシュされた決定を返します。

**レスポンス：**

```json
{
  "decisions": [
    {
      "id": 12345,
      "type": "ban",
      "scope": "ip",
      "value": "192.168.1.100",
      "scenario": "crowdsecurity/http-bf-wordpress_bf",
      "duration": "4h",
      "expires_at": "2026-03-21T14:00:00Z"
    },
    {
      "id": 12346,
      "type": "ban",
      "scope": "range",
      "value": "10.0.0.0/24",
      "scenario": "crowdsecurity/ssh-bf",
      "duration": "24h",
      "expires_at": "2026-03-22T10:00:00Z"
    }
  ],
  "total": 1336
}
```

### 決定の削除

```http
DELETE /api/crowdsec/decisions/:id
```

ローカルキャッシュとLAPIの両方から決定を削除します。誤検知のIPブロックを解除するのに有効です。

**サンプル：**

```bash
curl -X DELETE http://localhost:9527/api/crowdsec/decisions/12345 \
  -H "Authorization: Bearer <token>"
```

### 接続テスト

```http
POST /api/crowdsec/test
```

LAPI（および設定されている場合はAppSecエンドポイント）への接続をテストします。接続ステータスとレイテンシを返します。

**レスポンス：**

```json
{
  "lapi": {
    "reachable": true,
    "latency_ms": 3,
    "version": "1.6.4"
  },
  "appsec": {
    "reachable": true,
    "latency_ms": 12
  }
}
```

### 設定の取得

```http
GET /api/crowdsec/config
```

現在のCrowdSec設定を返します（`api_key`などの機密フィールドはマスクされます）。

### 設定の更新

```http
PUT /api/crowdsec/config
Content-Type: application/json
```

ランタイムでCrowdSec設定を更新します。変更は再起動なしで即座に有効になります。

**リクエストボディ：**

```json
{
  "enabled": true,
  "mode": "both",
  "lapi_url": "http://127.0.0.1:8080",
  "api_key": "new-api-key",
  "update_frequency_secs": 15,
  "fallback_action": "log"
}
```

### キャッシュ統計

```http
GET /api/crowdsec/stats
```

ヒット/ミス率と決定タイプ内訳を含む詳細なキャッシュ統計を返します。

**レスポンス：**

```json
{
  "cache": {
    "exact_ips": 1247,
    "cidr_ranges": 89,
    "total_lookups": 582910,
    "cache_hits": 3891,
    "cache_misses": 579019,
    "hit_rate_percent": 0.67
  },
  "decisions_by_type": {
    "ban": 1102,
    "captcha": 145,
    "throttle": 89
  },
  "decisions_by_scenario": {
    "crowdsecurity/http-bf-wordpress_bf": 423,
    "crowdsecurity/ssh-bf": 312,
    "crowdsecurity/http-bad-user-agent": 198
  }
}
```

### 最近のイベント

```http
GET /api/crowdsec/events
```

CrowdSec決定によってトリガーされた最近のセキュリティイベントを返します。

**レスポンス：**

```json
{
  "events": [
    {
      "timestamp": "2026-03-21T10:14:22Z",
      "source_ip": "192.168.1.100",
      "action": "ban",
      "scenario": "crowdsecurity/http-bf-wordpress_bf",
      "request_uri": "/wp-login.php",
      "method": "POST"
    }
  ],
  "total": 892
}
```

## CLIコマンド

### ステータス

```bash
prx-waf crowdsec status
```

統合ステータス、LAPI接続状態、キャッシュサイズ、プッシャー統計を表示します。

**出力例：**

```
CrowdSec Integration Status
============================
  Enabled:        true
  Mode:           both
  LAPI URL:       http://127.0.0.1:8080
  LAPI Connected: true
  Cache:
    Exact IPs:    1,247
    CIDR Ranges:  89
    Last Refresh: 2s ago
  AppSec:
    Endpoint:     http://127.0.0.1:7422
    Connected:    true
  Pusher:
    Authenticated: true
    Events Sent:   4,521
    Buffer:        12 pending
```

### 決定のリスト

```bash
prx-waf crowdsec decisions
```

ローカルキャッシュ内のすべてのアクティブな決定のテーブルを印刷します。

### 接続テスト

```bash
prx-waf crowdsec test
```

LAPIとAppSecエンドポイントへの接続チェックを実行し、レイテンシとバージョン情報をレポートします。

### セットアップウィザード

```bash
prx-waf crowdsec setup
```

以下を案内するインタラクティブウィザード：

1. LAPI URLとAPIキーの設定
2. モード選択（バウンサー / appsec / 両方）
3. AppSecエンドポイント設定（該当する場合）
4. ログプッシャー認証情報セットアップ（オプション）
5. 接続確認
6. TOMLファイルへの設定書き込み

## 管理UI

Vue 3管理ダッシュボードには3つのCrowdSec管理ビューが含まれています：

### CrowdSec設定

**CrowdSecSettings**ビュー（**設定 > CrowdSec**）はすべてのCrowdSecパラメーターを設定するフォームを提供します：

- 有効/無効トグル
- モードセレクター（バウンサー / appsec / 両方）
- LAPI URLとAPIキーフィールド
- キャッシュ更新間隔スライダー
- フォールバックアクションセレクター
- AppSecエンドポイント設定
- ログプッシャー認証情報
- リアルタイムフィードバックを持つ接続テストボタン

### CrowdSec決定

**CrowdSecDecisions**ビュー（**セキュリティ > CrowdSec決定**）はソート可能でフィルタリング可能なテーブルにすべてのキャッシュされた決定を表示します：

- 決定タイプバッジ（ban、captcha、throttle）
- ジオロケーションルックアップ付きIP/レンジ
- ドキュメントリンク付きシナリオ名
- 有効期限カウントダウン
- IPのブロックを解除するワンクリック削除

### CrowdSec統計

**CrowdSecStats**ビュー（**ダッシュボード > CrowdSec**）は運用メトリクスを表示します：

- キャッシュヒット/ミス率チャート（時系列）
- 決定タイプ内訳（円グラフ）
- 上位ブロックシナリオ（棒グラフ）
- プッシャーイベントスループット
- LAPIレイテンシヒストグラム

## デプロイパターン

### バウンサーのみ（推奨開始点）

最もシンプルなデプロイメント。PRX-WAFはCrowdSec LAPIから決定をポーリングし、既知の悪意のあるIPをブロック：

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 10
fallback_action = "allow"
```

最適：ほとんどのデプロイメント、最小限のオーバーヘッド、追加のCrowdSecコンポーネントが不要。

### 完全統合（バウンサー + AppSec + プッシャー）

双方向脅威インテリジェンスによる最大限の保護：

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 10
fallback_action = "log"
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
pusher_login = "prx-waf-machine"
pusher_password = "secure-password"
```

最適：IPレピュテーションとアプリケーション層の検査の両方とコミュニティ貢献が必要な本番環境。

### リモートLAPIを使用した高可用性

CrowdSec LAPIが専用サーバーで実行されている場合：

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "https://crowdsec.internal:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 5
fallback_action = "allow"  # Don't block if LAPI is unreachable
cache_ttl_secs = 300       # Keep decisions for 5 min even if LAPI goes down
```

最適：CrowdSec LAPIが集中管理されるマルチサーバーデプロイメント。

### 厳格なセキュリティ（失敗時にブロック）

脅威インテリジェンスが利用できない場合にトラフィックをブロックすることを好む高セキュリティ環境：

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
fallback_action = "block"
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 200     # Short timeout, fail fast
```

::: warning
`fallback_action = "block"`を設定すると、LAPIまたはAppSecエンドポイントが到達不能になった場合、すべてのトラフィックがブロックされます。CrowdSecの可用性が保証されている環境のみで使用してください。
:::

## シナリオフィルタリング

CrowdSecシナリオは特定の攻撃パターンを表します（例：`crowdsecurity/ssh-bf`はSSHブルートフォース、`crowdsecurity/http-bad-user-agent`は悪意のあるユーザーエージェント用）。PRX-WAFが対応するシナリオをフィルタリングできます：

### 特定のシナリオのみを含める

```toml
[crowdsec]
# Only block IPs flagged for HTTP-related attacks
scenarios_containing = ["http-"]
```

WAFがHTTPトラフィックのみを処理し、SSHやSMTPブルートフォースの決定でキャッシュを汚染したくない場合に有効です。

### 特定のシナリオを除外

```toml
[crowdsec]
# Block everything except manual decisions
scenarios_not_containing = ["manual"]
```

### フィルターを組み合わせる

```toml
[crowdsec]
# Only HTTP scenarios, but exclude DDoS (handled by upstream)
scenarios_containing = ["http-"]
scenarios_not_containing = ["http-ddos"]
```

## トラブルシューティング

### LAPI接続拒否

```
CrowdSec LAPI unreachable: connection refused at http://127.0.0.1:8080
```

**原因：** CrowdSec LAPIが実行されていないか、異なるアドレスでリッスンしています。

**修正：**
```bash
# Check CrowdSec status
sudo systemctl status crowdsec

# Verify LAPI is listening
sudo ss -tlnp | grep 8080

# Check CrowdSec logs
sudo journalctl -u crowdsec -f
```

### 無効なAPIキー

```
CrowdSec LAPI returned 403: invalid API key
```

**原因：** バウンサーAPIキーが正しくないか、失効しています。

**修正：**
```bash
# List existing bouncers
sudo cscli bouncers list

# Create a new bouncer key
sudo cscli bouncers add prx-waf-bouncer
```

### AppSecタイムアウト

```
CrowdSec AppSec timeout after 500ms
```

**原因：** AppSecエンドポイントが遅いまたは過負荷です。

**修正：**
- `appsec_timeout_ms`を増加（例：1000に）
- AppSecリソース使用量を確認
- AppSecが重要でない場合は`mode = "bouncer"`のみの使用を検討

### 空の決定キャッシュ

`prx-waf crowdsec decisions`がエントリを表示しない場合：

1. LAPIに決定があることを確認：`sudo cscli decisions list`
2. シナリオフィルタリングを確認 -- `scenarios_containing`フィルターが制限的すぎる可能性があります
3. バウンサーキーに読み取り権限があることを確認

### ログプッシャー認証失敗

```
CrowdSec pusher: machine authentication failed
```

**原因：** マシン認証情報が無効です。

**修正：**
```bash
# Verify machine exists
sudo cscli machines list

# Re-register the machine
sudo cscli machines add prx-waf-pusher --password "new-password" --force
```

設定で`pusher_login`と`pusher_password`を更新してください。

## 次のステップ

- [設定リファレンス](../configuration/reference) -- 完全なTOML設定リファレンス
- [CLIリファレンス](../cli/) -- CrowdSecサブコマンドを含むすべてのCLIコマンド
- [ルールエンジン](../rules/) -- CrowdSecが検出パイプラインにどのように適合するか
- [管理UI](../admin-ui/) -- ダッシュボードからのCrowdSec管理
