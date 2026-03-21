---
title: MCP 統合
description: stdio または HTTP トランスポートを介した外部 MCP サーバーへの接続、動的ツール検出とネームスペーシングを備えた Model Context Protocol クライアント。
---

# MCP 統合

PRX は、外部 MCP サーバーに接続し、それらのツールをエージェントに公開する Model Context Protocol（MCP）クライアントを実装しています。MCP は LLM アプリケーションが外部ツールプロバイダーとどのように通信するかを標準化するオープンプロトコルで、ファイルシステム、データベース、API など、MCP 互換サーバーの成長するエコシステムとの統合を PRX に可能にします。

`mcp` ツールはフィーチャーゲートされており、`mcp.enabled = true` と少なくとも 1 つのサーバー定義が必要です。PRX は stdio トランスポート（ローカルプロセス通信）と HTTP トランスポート（リモートサーバー通信）の両方をサポートします。MCP サーバーのツールは `tools/list` プロトコルメソッドを介してランタイムで動的に検出され、組み込みツールとの衝突を避けるためにネームスペース化されます。

PRX はワークスペースローカルの `mcp.json` 検出もサポートしており、VS Code や Claude Desktop と同じ形式に従うため、ツール間で MCP サーバー設定を簡単に共有できます。

## 設定

### config.toml でのサーバー定義

`[mcp.servers]` セクションで MCP サーバーを定義:

```toml
[mcp]
enabled = true

# ── Stdio トランスポート（ローカルプロセス） ──────────────────────────
[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
enabled = true
startup_timeout_ms = 10000
request_timeout_ms = 30000
tool_name_prefix = "fs"

[mcp.servers.github]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_xxxxxxxxxxxx" }
tool_name_prefix = "gh"

[mcp.servers.sqlite]
transport = "stdio"
command = "uvx"
args = ["mcp-server-sqlite", "--db-path", "/home/user/data.db"]
tool_name_prefix = "sql"

# ── HTTP トランスポート（リモートサーバー） ───────────────────────────
[mcp.servers.remote-api]
transport = "http"
url = "https://mcp.example.com/sse"
request_timeout_ms = 60000
tool_name_prefix = "api"

[mcp.servers.streamable]
transport = "streamable_http"
url = "http://localhost:8090/mcp"
request_timeout_ms = 30000
```

### サーバーごとの設定

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | このサーバーの有効/無効化 |
| `transport` | `string` | `"stdio"` | トランスポートタイプ: `"stdio"`、`"http"`、`"streamable_http"` |
| `command` | `string` | -- | stdio トランスポートのコマンド（例: `"npx"`、`"uvx"`、`"node"`） |
| `args` | `string[]` | `[]` | stdio コマンドの引数 |
| `url` | `string` | -- | HTTP トランスポートの URL |
| `env` | `map` | `{}` | stdio プロセスの環境変数 |
| `startup_timeout_ms` | `u64` | `10000` | サーバー起動の最大待ち時間 |
| `request_timeout_ms` | `u64` | `30000` | リクエストごとのタイムアウト |
| `tool_name_prefix` | `string` | `"mcp"` | ツール名のプレフィックス（例: `"fs"` は `"fs_read_file"` となる） |
| `allow_tools` | `string[]` | `[]` | ツール許可リスト（空 = 検出されたすべてのツールを許可） |
| `deny_tools` | `string[]` | `[]` | ツール拒否リスト（許可リストより優先） |

### ワークスペースローカルの mcp.json

PRX はワークスペースローカルの `mcp.json` ファイルから MCP サーバーを検出します。VS Code や Claude Desktop と同じ形式:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./my-mcp-server/index.js"],
      "env": { "API_KEY": "..." }
    },
    "python-tools": {
      "command": "python3",
      "args": ["-m", "my_mcp_module"],
      "env": {}
    }
  }
}
```

このファイルをワークスペースのルートディレクトリに配置します。PRX は起動時とツールリフレッシュ時に `mcp.json` をチェックします。

**安全なランチャーホワイトリスト**: `mcp.json` のコマンドは安全なランチャーのホワイトリストに制限されています:

| ランチャー | 言語/プラットフォーム |
|----------|-------------------|
| `npx` | Node.js (npm) |
| `node` | Node.js |
| `python` | Python |
| `python3` | Python 3 |
| `uvx` | Python (uv) |
| `uv` | Python (uv) |
| `deno` | Deno |
| `bun` | Bun |
| `docker` | Docker |
| `cargo` | Rust |
| `go` | Go |
| `ruby` | Ruby |
| `php` | PHP |
| `dotnet` | .NET |
| `java` | Java |

このホワイトリストにないコマンドは、`mcp.json` ファイルによる任意のコマンド実行を防ぐために拒否されます。

## 使用方法

### 動的ツール検出

MCP ツールは MCP クライアントがサーバーに接続すると自動的に検出されます。エージェントはそれらをツールレジストリの通常のツールとして認識します:

```
利用可能な MCP ツール:
  fs_read_file          - ファイルの内容を読み取る
  fs_write_file         - ファイルにコンテンツを書き込む
  fs_list_directory     - ディレクトリの内容をリスト
  gh_create_issue       - GitHub Issue を作成
  gh_search_code        - GitHub でコードを検索
  sql_query             - SQL クエリを実行
  sql_list_tables       - データベーステーブルをリスト
```

### ツールネームスペーシング

各 MCP サーバーのツールは名前の衝突を避けるために設定された `tool_name_prefix` でプレフィックス付与されます:

- サーバー `filesystem`（プレフィックス `"fs"`）は `fs_read_file`、`fs_write_file` などを公開
- サーバー `github`（プレフィックス `"gh"`）は `gh_create_issue`、`gh_search_code` などを公開
- サーバー `sqlite`（プレフィックス `"sql"`）は `sql_query`、`sql_list_tables` などを公開

2 つのサーバーが同じベース名のツールを公開する場合、プレフィックスがそれらを区別します。

### ツールリフレッシュ

`mcp` ツールは各エージェントターン前にツールを再検出する `refresh()` フックをサポートします。これは以下を意味します:

- MCP サーバーに追加された新しいツールが PRX を再起動せずに利用可能になる
- 削除されたツールは LLM に提供されなくなる
- ツールスキーマの変更が即座に反映される

### エージェント呼び出し

エージェントは組み込みツールと同じ方法で MCP ツールを呼び出します:

```json
{
  "name": "gh_create_issue",
  "arguments": {
    "owner": "openprx",
    "repo": "prx",
    "title": "Add support for MCP resource subscriptions",
    "body": "PRX should support MCP resource change notifications..."
  }
}
```

PRX はこの呼び出しを適切な MCP サーバーにルーティングし、設定されたトランスポートでリクエストを送信し、結果を LLM に返します。

## トランスポートの詳細

### Stdio トランスポート

stdio トランスポートは MCP サーバーを子プロセスとして起動し、JSON-RPC を使用して stdin/stdout で通信:

```
PRX プロセス
    │
    ├── stdin  ──→ MCP サーバープロセス
    └── stdout ←── MCP サーバープロセス
```

- サーバーは初回使用時（遅延初期化）またはデーモン起動時に開始
- プロセスライフサイクルは PRX が管理（クラッシュ時の自動再起動）
- サーバーの stderr 出力は診断用にキャプチャ

### HTTP トランスポート

HTTP トランスポートは HTTP 経由でリモート MCP サーバーに接続:

```
PRX  ──HTTP/SSE──→  リモート MCP サーバー
```

- ストリーミングレスポンス用に Server-Sent Events（SSE）をサポート
- 接続は最初のツール呼び出し時に確立
- ヘッダーによる認証をサポート（サーバーごとに設定可能）

### Streamable HTTP トランスポート

streamable HTTP トランスポートはより新しい MCP streamable HTTP プロトコルを使用:

```
PRX  ──HTTP POST──→  MCP サーバー（streamable）
     ←──ストリーミング──
```

このトランスポートは双方向通信で SSE より効率的で、新しい MCP サーバー実装に推奨されるトランスポートです。

## パラメーター

MCP ツール自体には固定パラメーターがありません。各 MCP サーバーは `tools/list` プロトコルメソッドで検出される独自のパラメータースキーマを持つ独自のツールを公開します。パラメーターは個々の MCP サーバー実装によって定義されます。

MCP メタツール（管理用）は以下をサポート:

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `action` | `string` | いいえ | -- | 管理アクション: `"status"`、`"refresh"`、`"servers"` |

## セキュリティ

### 環境変数サニタイズ

PRX はインジェクション攻撃を防ぐために MCP サーバープロセスから危険な環境変数を自動的に除去します:

| 除去される変数 | リスク |
|------------------|------|
| `LD_PRELOAD` | ライブラリインジェクション（Linux） |
| `DYLD_INSERT_LIBRARIES` | ライブラリインジェクション（macOS） |
| `NODE_OPTIONS` | Node.js ランタイム操作 |
| `PYTHONPATH` | Python モジュールパスハイジャック |
| `PYTHONSTARTUP` | Python 起動スクリプトインジェクション |
| `RUBYOPT` | Ruby ランタイムオプションインジェクション |
| `PERL5OPT` | Perl ランタイムオプションインジェクション |

明示的に設定された `env` 変数と安全なシステム変数のみが子プロセスに渡されます。

### mcp.json のコマンドホワイトリスト

`mcp.json` ファイル形式は便利ですが潜在的に危険です。PRX はコマンドを既知の安全なランチャーのホワイトリストに制限することでこれを軽減します。これにより、悪意のある `mcp.json` が任意のバイナリを実行することを防ぎます。

### ツール許可/拒否リスト

サーバーごとのツールフィルタリングで、エージェントに公開されるツールを制御:

```toml
[mcp.servers.filesystem]
# これらのツールのみ公開
allow_tools = ["read_file", "list_directory"]
# 検出されてもこれらのツールをブロック
deny_tools = ["write_file", "delete_file"]
```

拒否リストは許可リストより優先されます。これにより、デフォルトですべてのツールを許可しながら危険なものを明示的にブロックする多層防御アプローチが可能になります。

### ネットワーク分離

stdio トランスポートサーバーの場合、サーバープロセスはサンドボックス設定を継承します。サンドボックスがネットワークアクセスをブロックする場合、MCP サーバーもネットワークリクエストを行えません。

HTTP トランスポートサーバーの場合、リモートサーバーのセキュリティは PRX の制御外です。HTTP トランスポート URL が信頼できるサーバーのみを指すようにしてください。

### ポリシーエンジン

MCP ツールはセキュリティポリシーエンジンの管理下にあります:

```toml
[security.tool_policy.tools]
mcp = "allow"           # すべての MCP ツールをグローバルに許可
fs_write_file = "deny"  # プレフィックス付き名前で特定の MCP ツールをブロック
```

### 監査ログ

すべての MCP ツール呼び出しが監査ログに記録されます:

- サーバー名とツール名
- 引数（機密値はリダクト）
- レスポンスステータス
- 実行時間

## 関連

- [設定リファレンス](/ja/prx/config/reference) -- `[mcp]` と `[mcp.servers]` 設定
- [ツール概要](/ja/prx/tools/) -- 組み込みツールと MCP 統合の概要
- [セキュリティサンドボックス](/ja/prx/security/sandbox) -- MCP サーバープロセスのサンドボックス
- [シークレット管理](/ja/prx/security/secrets) -- MCP サーバー資格情報の暗号化ストレージ
- [シェル実行](/ja/prx/tools/shell) -- シェルコマンドでツールを実行する代替
