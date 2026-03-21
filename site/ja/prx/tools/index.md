---
title: ツール概要
description: PRX は 12 カテゴリに整理された 46 以上の組み込みツールを提供します。ツールはエージェントがエージェンティックループ中に OS、ネットワーク、メモリ、外部サービスと対話するために呼び出せる機能です。
---

# ツール概要

ツールは PRX エージェントが推論ループ中に呼び出せる機能です。LLM がアクションの実行が必要だと判断した場合 -- コマンドの実行、ファイルの読み取り、Web 検索、メモリの保存 -- 構造化された JSON 引数でツールを名前で呼び出します。PRX はツールを実行し、セキュリティポリシーを適用し、次の推論ステップのために結果を LLM に返します。

PRX には基本的なファイル I/O からブラウザ自動化、マルチエージェント委任、MCP プロトコル統合まで、12 カテゴリにわたる **46 以上の組み込みツール**が同梱されています。

## ツールアーキテクチャ

すべてのツールは `Tool` トレイトを実装します:

```rust
#[async_trait]
pub trait Tool: Send + Sync {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn parameters_schema(&self) -> serde_json::Value;
    async fn execute(&self, args: serde_json::Value) -> Result<ToolResult>;
}
```

各ツールはパラメータの JSON Schema を提供し、関数定義として LLM に送信されます。LLM は構造化された呼び出しを生成し、PRX は実行前に引数をスキーマに対して検証します。

## ツールレジストリ: `default_tools()` vs `all_tools()`

PRX は 2 層のレジストリシステムを使用します:

### `default_tools()` -- 最小コア（3 ツール）

軽量または制限されたエージェント用の最小ツールセット。常に利用可能で、追加設定不要:

| ツール | 説明 |
|------|-------------|
| `shell` | サンドボックス分離付きシェルコマンド実行 |
| `file_read` | ファイルの内容を読み取り（ACL 対応） |
| `file_write` | ファイルの内容を書き込み |

### `all_tools()` -- フルレジストリ（46 以上のツール）

設定に基づいて組み立てられる完全なツールセット。有効化されている機能に応じてツールが条件的に登録されます:

- **常に登録**: コアツール、メモリ、cron、スケジューリング、git、ビジョン、ノード、pushover、canvas、プロキシ設定、スキーマ
- **条件付き登録**: ブラウザ（`browser.enabled` 必要）、HTTP リクエスト（`http_request.enabled` 必要）、Web 検索（`web_search.enabled` 必要）、Web フェッチ（`web_search.fetch_enabled` + `browser.allowed_domains` 必要）、MCP（`mcp.enabled` 必要）、Composio（API キー必要）、delegate/agents_list（エージェント定義必要）

## カテゴリリファレンス

### コア（3 ツール）-- 常に利用可能

`default_tools()` と `all_tools()` の両方に含まれる基盤ツール。

| ツール | 説明 |
|------|-------------|
| `shell` | 設定可能なサンドボックス分離（Landlock/Firejail/Bubblewrap/Docker）でシェルコマンドを実行。60 秒タイムアウト、1MB 出力制限、サニタイズされた環境。 |
| `file_read` | パス検証付きでファイルの内容を読み取り。メモリ ACL が有効な場合、アクセス制御を適用するためメモリ Markdown ファイルへのアクセスをブロック。 |
| `file_write` | ファイルにコンテンツを書き込み。セキュリティポリシーチェックの対象。 |

### メモリ（5 ツール）

エージェントの永続知識の保存、取得、管理のための長期メモリ操作。

| ツール | 説明 |
|------|-------------|
| `memory_store` | ファクト、好み、メモを長期メモリに保存。カテゴリをサポート: `core`（永久）、`daily`（セッション）、`conversation`（チャットコンテキスト）、またはカスタム。 |
| `memory_forget` | 長期メモリから特定のエントリを削除。 |
| `memory_get` | キーで特定のメモリエントリを取得。有効時は ACL 対応。 |
| `memory_recall` | キーワードまたはセマンティック類似度でメモリをリコール。メモリ ACL が有効な場合は無効化。 |
| `memory_search` | メモリエントリ全体の全文検索とベクトル検索。有効時は ACL 対応。 |

### cron / スケジューリング（9 ツール）

時間ベースのタスク自動化と Xin スケジューリングエンジン。

| ツール | 説明 |
|------|-------------|
| `cron` | レガシー cron エントリポイント -- スケジュールタスクの作成または管理。 |
| `cron_add` | cron 式、コマンド、オプションの説明で新しい cron ジョブを追加。 |
| `cron_list` | スケジュールとステータス付きで全登録 cron ジョブを一覧表示。 |
| `cron_remove` | ID で cron ジョブを削除。 |
| `cron_update` | 既存の cron ジョブのスケジュール、コマンド、設定を更新。 |
| `cron_run` | cron ジョブを手動で即座にトリガー。 |
| `cron_runs` | cron ジョブの実行履歴とログを表示。 |
| `schedule` | 自然言語の時間表現でワンショットまたは繰り返しタスクをスケジュール。 |
| `xin` | Xin スケジューリングエンジン -- 依存チェーンと条件付き実行を持つ高度なタスクスケジューリング。 |

### ブラウザ / ビジョン（5 ツール）

Web 自動化と画像処理。ブラウザツールには `[browser] enabled = true` が必要。

| ツール | 説明 |
|------|-------------|
| `browser` | プラガブルバックエンド（agent-browser CLI、Rust ネイティブ、computer-use サイドカー）を持つフルブラウザ自動化。ナビゲーション、フォーム入力、クリック、スクリーンショット、OS レベルアクションをサポート。 |
| `browser_open` | ブラウザで URL を簡単に開く。`browser.allowed_domains` でドメイン制限。 |
| `screenshot` | 現在の画面または特定のウィンドウのスクリーンショットをキャプチャ。 |
| `image` | 画像の処理と変換（リサイズ、クロップ、フォーマット変換）。 |
| `image_info` | 画像ファイルからメタデータと寸法を抽出。 |

### ネットワーク（4 ツール）

HTTP リクエスト、Web 検索、Web フェッチ、MCP プロトコル統合。

| ツール | 説明 |
|------|-------------|
| `http_request` | API に HTTP リクエストを送信。デフォルト拒否: `allowed_domains` のみ到達可能。タイムアウトと最大レスポンスサイズが設定可能。 |
| `web_search_tool` | DuckDuckGo（無料、キー不要）または Brave Search（API キー必要）で Web 検索。 |
| `web_fetch` | Web ページからコンテンツを取得・抽出。`web_search.fetch_enabled` と `browser.allowed_domains` の設定が必要。 |
| `mcp` | Model Context Protocol クライアント -- 外部 MCP サーバー（stdio または HTTP トランスポート）に接続してツールを呼び出し。ワークスペースローカルの `mcp.json` 検出をサポート。 |

### メッセージング（2 ツール）

通信チャネルを通じてメッセージを送信。

| ツール | 説明 |
|------|-------------|
| `message_send` | 設定された任意のチャネルと受信者にメッセージ（テキスト、メディア、音声）を送信。アクティブなチャネルに自動ルーティング。 |
| `gateway` | Axum HTTP/WebSocket ゲートウェイを通じた生メッセージ送信のための低レベルゲートウェイアクセス。 |

### セッション / エージェント（8 ツール）

マルチエージェントオーケストレーション: サブエージェントのスポーン、タスクの委任、同時セッションの管理。

| ツール | 説明 |
|------|-------------|
| `sessions_spawn` | バックグラウンドで実行される非同期サブエージェントをスポーン。実行 ID を即座に返し、完了時に結果を自動通知。`history` と `steer` アクションをサポート。 |
| `sessions_send` | 実行中のサブエージェントセッションにメッセージを送信。 |
| `sessions_list` | ステータス付きで全アクティブサブエージェントセッションを一覧表示。 |
| `sessions_history` | サブエージェント実行の会話ログを表示。 |
| `session_status` | 特定のセッションの状態を確認。 |
| `subagents` | サブエージェントプールの管理 -- サブエージェントの一覧表示、停止、検査。 |
| `agents_list` | モデルと機能を含む全設定済み委任エージェントを一覧表示。設定でエージェントが定義されている場合のみ登録。 |
| `delegate` | 独自のプロバイダー、モデル、ツールセットを持つ名前付きエージェントにタスクを委任。フォールバック認証情報と分離されたエージェンティックループをサポート。 |

### リモートデバイス（2 ツール）

リモートノードとプッシュ通知との対話。

| ツール | 説明 |
|------|-------------|
| `nodes` | 分散デプロイメントでリモート PRX ノードを管理・通信。 |
| `pushover` | Pushover サービス経由でプッシュ通知を送信。 |

### Git（1 ツール）

バージョン管理操作。

| ツール | 説明 |
|------|-------------|
| `git_operations` | ワークスペースリポジトリで Git 操作（status、diff、commit、push、pull、log、branch）を実行。 |

### 設定（2 ツール）

ランタイム設定管理。

| ツール | 説明 |
|------|-------------|
| `config_reload` | プロセスを再起動せずに PRX 設定ファイルをホットリロード。 |
| `proxy_config` | ランタイムでプロキシ/ネットワーク設定を表示・変更。 |

### サードパーティ統合（1 ツール）

外部プラットフォームコネクター。

| ツール | 説明 |
|------|-------------|
| `composio` | Composio プラットフォーム経由で 250 以上のアプリとサービスに接続。Composio API キーが必要。 |

### レンダリング（2 ツール）

コンテンツ生成と出力フォーマット。

| ツール | 説明 |
|------|-------------|
| `canvas` | ビジュアル出力用の構造化コンテンツ（テーブル、チャート、ダイアグラム）をレンダリング。 |
| `tts` | テキスト読み上げ -- テキストを音声メッセージに変換し、現在の会話に送信。MP3 生成、M4A 変換、配信を自動処理。 |

### 管理（1 ツール）

内部スキーマと診断。

| ツール | 説明 |
|------|-------------|
| `schema` | クロスプロバイダー LLM 互換性のための JSON Schema クリーニングと正規化。`$ref` の解決、ユニオンの平坦化、サポートされていないキーワードの除去。 |

## ツールの有効化と無効化

### 機能ゲート付きツール

多くのツールはそれぞれの設定セクションで有効化されます。`config.toml` に以下を追加:

```toml
# -- ブラウザツール --
[browser]
enabled = true
allowed_domains = ["github.com", "stackoverflow.com", "*.openprx.dev"]
backend = "agent_browser"   # "agent_browser" | "rust_native" | "computer_use"

# -- HTTP リクエストツール --
[http_request]
enabled = true
allowed_domains = ["api.github.com", "api.openai.com"]
max_response_size = 1000000  # 1MB
timeout_secs = 30

# -- Web 検索ツール --
[web_search]
enabled = true
provider = "duckduckgo"      # "duckduckgo"（無料）or "brave"（API キー必要）
max_results = 5
timeout_secs = 10

# web_fetch でページコンテンツ抽出も有効化:
fetch_enabled = true
fetch_max_chars = 50000

# -- Composio 統合 --
[composio]
enabled = true
api_key = "your-composio-key"
entity_id = "default"
```

### ツールポリシーパイプライン

きめ細かい制御には、`[security.tool_policy]` セクションで個々のツールやグループを許可、拒否、監視に設定:

```toml
[security.tool_policy]
# デフォルトポリシー: "allow", "deny", or "supervised"
default = "allow"

# グループレベルポリシー
[security.tool_policy.groups]
sessions = "allow"
automation = "allow"
hardware = "deny"

# ツールごとのオーバーライド（最高優先度）
[security.tool_policy.tools]
shell = "supervised"     # 実行前に承認が必要
gateway = "allow"
composio = "deny"        # API キーが設定されていても Composio を無効化
```

ポリシー解決順序（最高優先度順）:
1. ツールごとのポリシー（`security.tool_policy.tools.<name>`）
2. グループポリシー（`security.tool_policy.groups.<group>`）
3. デフォルトポリシー（`security.tool_policy.default`）

## MCP ツール統合

PRX は Model Context Protocol（MCP）クライアントを実装し、外部 MCP サーバーに接続してそのツールをエージェントに公開できます。

### 設定

`config.toml` で MCP サーバーを定義:

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
transport = "stdio"

[mcp.servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
transport = "stdio"
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_..." }

[mcp.servers.remote-api]
url = "https://mcp.example.com/sse"
transport = "streamable_http"
```

### ワークスペースローカル `mcp.json`

PRX はワークスペースローカルの `mcp.json` ファイルからも MCP サーバーを検出します（VS Code や Claude Desktop と同じフォーマット）:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./my-mcp-server/index.js"],
      "env": { "API_KEY": "..." }
    }
  }
}
```

`mcp.json` のコマンドは安全なランチャーのホワイトリストに制限されます: `npx`、`node`、`python`、`python3`、`uvx`、`uv`、`deno`、`bun`、`docker`、`cargo`、`go`、`ruby`、`php`、`dotnet`、`java`。

## セキュリティ: サンドボックスと ACL

### ツールサンドボックス

`shell` ツールは設定可能なサンドボックス内でコマンドを実行します。PRX は 4 つのサンドボックスバックエンドと no-op フォールバックをサポート:

```toml
[security.sandbox]
enabled = true
backend = "auto"         # "auto" | "landlock" | "firejail" | "bubblewrap" | "docker" | "none"
```

| バックエンド | プラットフォーム | 分離レベル | 備考 |
|---------|----------|-----------------|-------|
| Landlock | Linux（カーネル LSM） | ファイルシステム | カーネルネイティブ、追加依存関係なし |
| Firejail | Linux | フル（ネットワーク、ファイルシステム、PID） | ユーザースペース、広く利用可能 |
| Bubblewrap | Linux、macOS | ネームスペースベース | ユーザーネームスペース、軽量 |
| Docker | 任意 | コンテナ | フルコンテナ分離 |
| None | 任意 | アプリケーション層のみ | OS レベルの分離なし |

自動検出モード（`backend = "auto"`）は利用可能なバックエンドを順にプローブします: Landlock、Firejail、Bubblewrap、Docker、見つからない場合は警告付きで None にフォールバック。

## 関連ページ

- [シェルツール](./shell)
- [ファイル操作](./file-operations)
- [Web 検索](./web-search)
- [ブラウザツール](./browser)
- [MCP 統合](./mcp)
- [セッション管理](./sessions)
