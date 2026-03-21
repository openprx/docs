---
title: 設定リファレンス
description: PRX のすべての設定セクションとオプションのフィールドごとの完全なリファレンス。
---

# 設定リファレンス

このページでは PRX の `config.toml` のすべての設定セクションとフィールドを文書化しています。デフォルト値が示されているフィールドは省略可能です -- PRX はデフォルト値を使用します。

## トップレベル（デフォルト設定）

これらのフィールドは `config.toml` のルートレベル、セクションヘッダーの外側に記述します。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `default_provider` | `string` | `"openrouter"` | プロバイダー ID またはエイリアス（例: `"anthropic"`, `"openai"`, `"ollama"`） |
| `default_model` | `string` | `"anthropic/claude-sonnet-4.6"` | 選択したプロバイダーを通じてルーティングされるモデル識別子 |
| `default_temperature` | `float` | `0.7` | サンプリング温度（0.0--2.0）。低いほど決定的 |
| `api_key` | `string?` | `null` | 選択したプロバイダーの API キー。プロバイダー固有の環境変数でオーバーライドされる |
| `api_url` | `string?` | `null` | プロバイダー API のベース URL オーバーライド（例: リモート Ollama エンドポイント） |

```toml
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7
api_key = "sk-ant-..."
```

## `[gateway]`

Webhook エンドポイント、ペアリング、Web API 用の HTTP ゲートウェイサーバー。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `host` | `string` | `"127.0.0.1"` | バインドアドレス。公開アクセスには `"0.0.0.0"` を使用 |
| `port` | `u16` | `16830` | リッスンポート |
| `require_pairing` | `bool` | `true` | API リクエスト受け入れ前にデバイスペアリングを要求 |
| `allow_public_bind` | `bool` | `false` | トンネルなしで非 localhost へのバインドを許可 |
| `pair_rate_limit_per_minute` | `u32` | `5` | クライアントあたりの最大ペアリングリクエスト数/分 |
| `webhook_rate_limit_per_minute` | `u32` | `60` | クライアントあたりの最大 Webhook リクエスト数/分 |
| `api_rate_limit_per_minute` | `u32` | `120` | 認証済みトークンあたりの最大 API リクエスト数/分 |
| `trust_forwarded_headers` | `bool` | `false` | `X-Forwarded-For` / `X-Real-IP` ヘッダーを信頼（リバースプロキシ背後でのみ有効化） |
| `request_timeout_secs` | `u64` | `300` | HTTP ハンドラーのタイムアウト（秒） |
| `idempotency_ttl_secs` | `u64` | `300` | Webhook 冪等性キーの TTL |

```toml
[gateway]
host = "127.0.0.1"
port = 16830
require_pairing = true
api_rate_limit_per_minute = 120
```

::: warning
`host` または `port` の変更には完全な再起動が必要です。これらの値はサーバー起動時にバインドされ、ホットリロードできません。
:::

## `[channels_config]`

トップレベルのチャネル設定。個別のチャネルはネストされたサブセクションです。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `cli` | `bool` | `true` | 対話型 CLI チャネルを有効化 |
| `message_timeout_secs` | `u64` | `300` | メッセージごとの処理タイムアウト（LLM + ツール） |

### `[channels_config.telegram]`

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `bot_token` | `string` | *（必須）* | @BotFather からの Telegram Bot API トークン |
| `allowed_users` | `string[]` | `[]` | 許可する Telegram ユーザー ID またはユーザー名。空 = すべて拒否 |
| `mention_only` | `bool` | `false` | グループでは、ボットを @メンションしたメッセージにのみ応答 |
| `stream_mode` | `"off" \| "partial"` | `"off"` | ストリーミングモード: `off` は完全なレスポンスを送信、`partial` はドラフトを段階的に編集 |
| `draft_update_interval_ms` | `u64` | `1000` | ドラフト編集の最小間隔（レート制限保護） |
| `interrupt_on_new_message` | `bool` | `false` | 同じユーザーが新しいメッセージを送信した際に処理中のレスポンスをキャンセル |

```toml
[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["alice", "bob"]
mention_only = true
stream_mode = "partial"
```

### `[channels_config.discord]`

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `bot_token` | `string` | *（必須）* | Developer Portal からの Discord ボットトークン |
| `guild_id` | `string?` | `null` | 単一のギルド（サーバー）に制限 |
| `allowed_users` | `string[]` | `[]` | 許可する Discord ユーザー ID。空 = すべて拒否 |
| `listen_to_bots` | `bool` | `false` | 他のボットからのメッセージを処理（自身のメッセージは常に無視） |
| `mention_only` | `bool` | `false` | @メンションにのみ応答 |

```toml
[channels_config.discord]
bot_token = "MTIz..."
guild_id = "987654321"
allowed_users = ["111222333"]
mention_only = true
```

### `[channels_config.slack]`

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `bot_token` | `string` | *（必須）* | Slack ボット OAuth トークン（`xoxb-...`） |
| `app_token` | `string?` | `null` | Socket Mode 用のアプリレベルトークン（`xapp-...`） |
| `channel_id` | `string?` | `null` | 単一チャネルに制限 |
| `allowed_users` | `string[]` | `[]` | 許可する Slack ユーザー ID。空 = すべて拒否 |
| `mention_only` | `bool` | `false` | グループでは @メンションにのみ応答 |

### `[channels_config.lark]`

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `app_id` | `string` | *（必須）* | Lark/飛書 アプリ ID |
| `app_secret` | `string` | *（必須）* | Lark/飛書 アプリシークレット |
| `encrypt_key` | `string?` | `null` | イベント暗号化キー |
| `verification_token` | `string?` | `null` | イベント検証トークン |
| `allowed_users` | `string[]` | `[]` | 許可するユーザー ID。空 = すべて拒否 |
| `use_feishu` | `bool` | `false` | Lark（国際版）の代わりに飛書（中国版）の API エンドポイントを使用 |
| `receive_mode` | `"websocket" \| "webhook"` | `"websocket"` | メッセージ受信モード |
| `port` | `u16?` | `null` | Webhook リッスンポート（webhook モードのみ） |
| `mention_only` | `bool` | `false` | @メンションにのみ応答 |

PRX はさらに以下のチャネルもサポートしています（`[channels_config.*]` で設定）：

- **Matrix** -- `homeserver`、`access_token`、ルームの許可リスト
- **Signal** -- signal-cli REST API 経由
- **WhatsApp** -- Cloud API または Web モード
- **iMessage** -- macOS のみ、連絡先の許可リスト
- **DingTalk** -- `client_id` / `client_secret` によるストリームモード
- **QQ** -- `app_id` / `app_secret` による公式 Bot SDK
- **Email** -- IMAP/SMTP
- **IRC** -- サーバー、チャネル、ニック
- **Mattermost** -- URL + ボットトークン
- **Nextcloud Talk** -- ベース URL + アプリトークン
- **Webhook** -- 汎用受信 Webhook

## `[memory]`

会話履歴、知識、エンベディング用のメモリバックエンド。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `backend` | `string` | `"sqlite"` | バックエンドタイプ: `"sqlite"`, `"lucid"`, `"postgres"`, `"markdown"`, `"none"` |
| `auto_save` | `bool` | `true` | ユーザーの会話入力を自動的にメモリに保存 |
| `acl_enabled` | `bool` | `false` | メモリアクセス制御リストを有効化 |
| `hygiene_enabled` | `bool` | `true` | 定期的なアーカイブと保持クリーンアップを実行 |
| `archive_after_days` | `u32` | `7` | これより古い日次/セッションファイルをアーカイブ |
| `purge_after_days` | `u32` | `30` | これより古いアーカイブファイルをパージ |
| `conversation_retention_days` | `u32` | `3` | SQLite: これより古い会話行を削除 |
| `daily_retention_days` | `u32` | `7` | SQLite: これより古い日次行を削除 |
| `embedding_provider` | `string` | `"none"` | エンベディングプロバイダー: `"none"`, `"openai"`, `"custom:<URL>"` |
| `embedding_model` | `string` | `"text-embedding-3-small"` | エンベディングモデル名 |
| `embedding_dimensions` | `usize` | `1536` | エンベディングベクトルの次元数 |
| `vector_weight` | `f64` | `0.7` | ハイブリッド検索でのベクトル類似度の重み（0.0--1.0） |
| `keyword_weight` | `f64` | `0.3` | BM25 キーワード検索の重み（0.0--1.0） |
| `min_relevance_score` | `f64` | `0.4` | コンテキストにメモリを含めるための最小ハイブリッドスコア |
| `embedding_cache_size` | `usize` | `10000` | LRU エビクション前の最大エンベディングキャッシュエントリ数 |
| `snapshot_enabled` | `bool` | `false` | コアメモリを `MEMORY_SNAPSHOT.md` にエクスポート |
| `snapshot_on_hygiene` | `bool` | `false` | ハイジーンパス中にスナップショットを実行 |
| `auto_hydrate` | `bool` | `true` | `brain.db` がない場合にスナップショットから自動読み込み |

```toml
[memory]
backend = "sqlite"
auto_save = true
embedding_provider = "openai"
embedding_model = "text-embedding-3-small"
embedding_dimensions = 1536
vector_weight = 0.7
keyword_weight = 0.3
```

## `[router]`

マルチモデルデプロイメント用のヒューリスティック LLM ルーター。能力、Elo レーティング、コスト、レイテンシを組み合わせた加重式で候補モデルをスコアリングします。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | ヒューリスティックルーティングを有効化 |
| `alpha` | `f32` | `0.0` | 類似度スコアの重み |
| `beta` | `f32` | `0.5` | 能力スコアの重み |
| `gamma` | `f32` | `0.3` | Elo スコアの重み |
| `delta` | `f32` | `0.1` | コストペナルティ係数 |
| `epsilon` | `f32` | `0.1` | レイテンシペナルティ係数 |
| `knn_enabled` | `bool` | `false` | 履歴からの KNN セマンティックルーティングを有効化 |
| `knn_min_records` | `usize` | `10` | KNN がルーティングに影響する前の最小履歴レコード数 |
| `knn_k` | `usize` | `7` | 投票用の最近傍数 |

### `[router.automix]`

適応的エスカレーションポリシー: 安価なモデルで開始し、信頼度が低下した場合にプレミアムモデルにエスカレーション。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | Automix エスカレーションを有効化 |
| `confidence_threshold` | `f32` | `0.7` | 信頼度がこの値を下回るとエスカレーション（0.0--1.0） |
| `cheap_model_tiers` | `string[]` | `[]` | 「安価優先」と見なすモデルティア |
| `premium_model_id` | `string` | `""` | エスカレーション用のモデル |

```toml
[router]
enabled = true
beta = 0.5
gamma = 0.3
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

## `[security]`

OS レベルのセキュリティ: サンドボックス、リソース制限、監査ログ。

### `[security.sandbox]`

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `enabled` | `bool?` | `null`（自動検出） | サンドボックス分離を有効化 |
| `backend` | `string` | `"auto"` | バックエンド: `"auto"`, `"landlock"`, `"firejail"`, `"bubblewrap"`, `"docker"`, `"none"` |
| `firejail_args` | `string[]` | `[]` | カスタム Firejail 引数 |

### `[security.resources]`

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `max_memory_mb` | `u32` | `512` | コマンドあたりの最大メモリ（MB） |
| `max_cpu_time_seconds` | `u64` | `60` | コマンドあたりの最大 CPU 時間 |
| `max_subprocesses` | `u32` | `10` | 最大サブプロセス数 |
| `memory_monitoring` | `bool` | `true` | メモリ使用量モニタリングを有効化 |

### `[security.audit]`

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | 監査ログを有効化 |
| `log_path` | `string` | `"audit.log"` | 監査ログファイルのパス（設定ディレクトリからの相対パス） |
| `max_size_mb` | `u32` | `100` | ローテーション前の最大ログサイズ |
| `sign_events` | `bool` | `false` | 改ざん検出のためにイベントを HMAC で署名 |

```toml
[security.sandbox]
backend = "landlock"

[security.resources]
max_memory_mb = 1024
max_cpu_time_seconds = 120

[security.audit]
enabled = true
sign_events = true
```

## `[observability]`

メトリクスと分散トレーシングバックエンド。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `backend` | `string` | `"none"` | バックエンド: `"none"`, `"log"`, `"prometheus"`, `"otel"` |
| `otel_endpoint` | `string?` | `null` | OTLP エンドポイント URL（例: `"http://localhost:4318"`） |
| `otel_service_name` | `string?` | `null` | OTel コレクター用のサービス名（デフォルトは `"prx"`） |

```toml
[observability]
backend = "otel"
otel_endpoint = "http://localhost:4318"
otel_service_name = "prx-production"
```

## `[mcp]`

[Model Context Protocol](https://modelcontextprotocol.io/) サーバー統合。PRX は MCP クライアントとして動作し、追加ツール用の外部 MCP サーバーに接続します。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | MCP クライアント統合を有効化 |

### `[mcp.servers.<name>]`

各名前付きサーバーは `[mcp.servers]` の下のサブセクションです。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | サーバーごとの有効化スイッチ |
| `transport` | `"stdio" \| "http"` | `"stdio"` | トランスポートタイプ |
| `command` | `string?` | `null` | stdio モード用のコマンド |
| `args` | `string[]` | `[]` | stdio モード用のコマンド引数 |
| `url` | `string?` | `null` | HTTP トランスポート用の URL |
| `env` | `map<string, string>` | `{}` | stdio モード用の環境変数 |
| `startup_timeout_ms` | `u64` | `10000` | 起動タイムアウト |
| `request_timeout_ms` | `u64` | `30000` | リクエストごとのタイムアウト |
| `tool_name_prefix` | `string` | `"mcp"` | 公開されるツール名のプレフィックス |
| `allow_tools` | `string[]` | `[]` | ツールの許可リスト（空 = すべて） |
| `deny_tools` | `string[]` | `[]` | ツールの拒否リスト |

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]

[mcp.servers.remote-api]
transport = "http"
url = "http://localhost:8090/mcp"
request_timeout_ms = 60000
```

## `[browser]`

ブラウザ自動化ツール設定。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | `browser_open` ツールを有効化 |
| `allowed_domains` | `string[]` | `[]` | 許可するドメイン（完全一致またはサブドメイン一致） |
| `session_name` | `string?` | `null` | 自動化用の名前付きブラウザセッション |

```toml
[browser]
enabled = true
allowed_domains = ["docs.rs", "github.com", "*.example.com"]
```

## `[web_search]`

Web 検索と URL フェッチツールの設定。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | `web_search` ツールを有効化 |
| `provider` | `string` | `"duckduckgo"` | 検索プロバイダー: `"duckduckgo"`（無料）または `"brave"`（API キー必要） |
| `brave_api_key` | `string?` | `null` | Brave Search API キー |
| `max_results` | `usize` | `5` | 検索ごとの最大結果数（1--10） |
| `timeout_secs` | `u64` | `15` | リクエストタイムアウト |
| `fetch_enabled` | `bool` | `true` | `web_fetch` ツールを有効化 |
| `fetch_max_chars` | `usize` | `10000` | `web_fetch` が返す最大文字数 |

```toml
[web_search]
enabled = true
provider = "brave"
brave_api_key = "BSA..."
max_results = 5
fetch_enabled = true
```

## `[xin]`

Xin（心/マインド）自律タスクエンジン -- 進化、フィットネスチェック、ハイジーン操作を含むバックグラウンドタスクをスケジュール・実行します。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | Xin タスクエンジンを有効化 |
| `interval_minutes` | `u32` | `5` | ティック間隔（分、最小 1） |
| `max_concurrent` | `usize` | `4` | ティックあたりの最大同時タスク実行数 |
| `max_tasks` | `usize` | `128` | ストア内の最大タスク数 |
| `stale_timeout_minutes` | `u32` | `60` | 実行中のタスクが古いとマークされるまでの分数 |
| `builtin_tasks` | `bool` | `true` | 組み込みシステムタスクを自動登録 |
| `evolution_integration` | `bool` | `false` | Xin に進化/フィットネスのスケジューリングを管理させる |

```toml
[xin]
enabled = true
interval_minutes = 10
max_concurrent = 4
builtin_tasks = true
evolution_integration = true
```

## `[cost]`

コスト追跡のための支出制限とモデルごとの料金。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | コスト追跡を有効化 |
| `daily_limit_usd` | `f64` | `10.0` | 日次支出制限（USD） |
| `monthly_limit_usd` | `f64` | `100.0` | 月次支出制限（USD） |
| `warn_at_percent` | `u8` | `80` | 支出がこのパーセンテージに達したら警告 |
| `allow_override` | `bool` | `false` | `--override` フラグでの予算超過リクエストを許可 |

```toml
[cost]
enabled = true
daily_limit_usd = 25.0
monthly_limit_usd = 500.0
warn_at_percent = 80
```

## `[reliability]`

レジリエントなプロバイダーアクセスのためのリトライとフォールバックチェーン設定。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `max_retries` | `u32` | `3` | 一時的な障害に対する最大リトライ回数 |
| `fallback_providers` | `string[]` | `[]` | フォールバックプロバイダー名の順序付きリスト |

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

## `[secrets]`

ChaCha20-Poly1305 を使用した暗号化クレデンシャルストア。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `encrypt` | `bool` | `true` | 設定内の API キーとトークンの暗号化を有効化 |

## `[auth]`

外部クレデンシャルインポート設定。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `codex_auth_json_auto_import` | `bool` | `true` | Codex CLI の `auth.json` から OAuth クレデンシャルを自動インポート |
| `codex_auth_json_path` | `string` | `"~/.codex/auth.json"` | Codex CLI 認証ファイルのパス |

## `[proxy]`

送信 HTTP/HTTPS/SOCKS5 プロキシ設定。

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | プロキシを有効化 |
| `http_proxy` | `string?` | `null` | HTTP プロキシ URL |
| `https_proxy` | `string?` | `null` | HTTPS プロキシ URL |
| `all_proxy` | `string?` | `null` | すべてのスキーム用のフォールバックプロキシ |
| `no_proxy` | `string[]` | `[]` | バイパスリスト（`NO_PROXY` と同じ形式） |
| `scope` | `string` | `"zeroclaw"` | スコープ: `"environment"`, `"zeroclaw"`, `"services"` |
| `services` | `string[]` | `[]` | スコープが `"services"` の場合のサービスセレクター |

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1", "*.internal"]
scope = "zeroclaw"
```
