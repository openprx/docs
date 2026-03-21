---
title: セッションとエージェント
description: PRX でのサブエージェント起動、タスク委任、並行セッション管理のためのマルチエージェントオーケストレーションツール。
---

# セッションとエージェント

PRX は、親エージェントが子エージェントを起動し、専門エージェントにタスクを委任し、並行セッションを管理するためのマルチエージェントオーケストレーション用 8 つのツールを提供します。これは PRX の並列タスク分解アーキテクチャの基盤であり、複雑なタスクが独立したエージェントインスタンスが処理するサブタスクに分解されます。

セッションツール（`sessions_spawn`、`sessions_send`、`sessions_list`、`sessions_history`、`session_status`、`subagents`）はサブエージェントセッションのライフサイクルを管理します。エージェント委任ツール（`delegate`、`agents_list`）は、独自のプロバイダー、モデル、ツール設定を持つ名前付きエージェントへのタスクルーティングを可能にします。

セッションツールは `all_tools()` レジストリに登録されており、常に利用可能です。`delegate` と `agents_list` ツールは設定にエージェント定義が存在する場合にのみ条件付きで登録されます。

## 設定

### サブエージェント並行性

```toml
[agent.subagents]
max_concurrent = 4          # 最大同時サブエージェント数
max_depth = 3               # 最大ネスト深度（サブエージェントがサブエージェントを起動）
max_total_spawns = 20       # ルートセッションあたりの総起動バジェット
child_timeout_secs = 300    # 個々の子実行のタイムアウト
```

### 委任エージェント定義

名前付きエージェントは `[agents.*]` セクションで定義:

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a research assistant. Find accurate, up-to-date information."
agentic = true
max_iterations = 10
allowed_tools = ["web_search_tool", "web_fetch", "file_read", "memory_store"]

[agents.coder]
provider = "openai"
model = "gpt-4o"
system_prompt = "You are a code generation specialist. Write clean, well-tested code."
agentic = true
max_iterations = 15
allowed_tools = ["shell", "file_read", "file_write", "git_operations"]

[agents.reviewer]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a code reviewer. Focus on correctness, security, and style."
agentic = true
max_iterations = 5
allowed_tools = ["file_read", "shell"]
```

## ツールリファレンス

### sessions_spawn

バックグラウンドで実行される非同期サブエージェントを起動します。ラン ID とともに即座に返します。子が完了すると親に自動的に通知されます。

```json
{
  "name": "sessions_spawn",
  "arguments": {
    "task": "Research the latest Rust async runtime benchmarks and summarize the findings.",
    "action": "spawn"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `task` | `string` | はい | -- | サブエージェントのタスク説明/システムプロンプト |
| `action` | `string` | いいえ | `"spawn"` | アクション: `"spawn"`、`"history"`（ログ表示）、または `"steer"`（リダイレクト） |
| `allowed_tools` | `array` | いいえ | 親のツール | サブエージェントがアクセスできるツールのサブセット |

### sessions_send

実行中のサブエージェントセッションにメッセージを送信し、親と子の間のインタラクティブな通信を可能にします。

```json
{
  "name": "sessions_send",
  "arguments": {
    "session_id": "run_abc123",
    "message": "Focus on performance comparisons, not API differences."
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `session_id` | `string` | はい | -- | ターゲットサブエージェントのラン ID |
| `message` | `string` | はい | -- | サブエージェントに送信するメッセージ |

### sessions_list

すべてのアクティブなサブエージェントセッションをステータス、タスク説明、経過時間とともにリスト。

```json
{
  "name": "sessions_list",
  "arguments": {}
}
```

パラメーター不要。アクティブなセッションのリストを返します。

### sessions_history

ツール呼び出しと LLM レスポンスを含む、サブエージェントランの会話ログを表示。

```json
{
  "name": "sessions_history",
  "arguments": {
    "session_id": "run_abc123"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `session_id` | `string` | はい | -- | 履歴を取得するラン ID |

### session_status

特定のセッションのステータスを確認（実行中、完了、失敗、タイムアウト）。

```json
{
  "name": "session_status",
  "arguments": {
    "session_id": "run_abc123"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `session_id` | `string` | はい | -- | 確認するラン ID |

### subagents

サブエージェントプールを管理 -- 実行中のサブエージェントのリスト、停止、検査。

```json
{
  "name": "subagents",
  "arguments": {
    "action": "list"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `action` | `string` | はい | -- | アクション: `"list"`、`"stop"`、`"inspect"` |
| `session_id` | `string` | 条件付き | -- | `"stop"` と `"inspect"` アクションで必須 |

### agents_list

設定されたすべての委任エージェントをモデル、機能、許可ツールとともにリスト。`[agents.*]` セクションが定義されている場合のみ登録。

```json
{
  "name": "agents_list",
  "arguments": {}
}
```

パラメーター不要。設定からのエージェント定義を返します。

### delegate

独自のプロバイダー、モデル、ツールセットを持つ名前付きエージェントにタスクを委任。委任エージェントは分離されたエージェンティックループを実行し、結果を返します。

```json
{
  "name": "delegate",
  "arguments": {
    "agent": "researcher",
    "task": "Find the top 5 Rust web frameworks by GitHub stars in 2026."
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `agent` | `string` | はい | -- | 設定されたエージェントの名前（`[agents.*]` から） |
| `task` | `string` | はい | -- | 委任エージェントへのタスク説明 |

## 使用パターン

### 並列リサーチ

複数のサブエージェントを起動して異なるトピックを同時にリサーチ:

```
親: プロジェクト用に 3 つのデータベースエンジンの比較が必要。

  [sessions_spawn] task="Research PostgreSQL strengths, weaknesses, and use cases"
  [sessions_spawn] task="Research SQLite strengths, weaknesses, and use cases"
  [sessions_spawn] task="Research DuckDB strengths, weaknesses, and use cases"

  [3 つすべての完了を待つ]
  [結果を比較テーブルに統合]
```

### 委任コードレビュー

特定のタスクに専門の委任エージェントを使用:

```
親: このプルリクエストのセキュリティ問題をレビュー。

  [delegate] agent="reviewer", task="Review the diff in /tmp/pr-42.patch for security vulnerabilities"

  [reviewer エージェントが file_read と shell ツールで実行]
  [詳細なセキュリティレビューを返す]
```

### 階層的タスク分解

サブエージェントは独自のサブエージェントを起動可能（`max_depth` まで）:

```
親エージェント
  ├── リサーチエージェント
  │     ├── Web 検索サブエージェント
  │     └── ドキュメント分析サブエージェント
  ├── コード生成エージェント
  └── テストエージェント
```

## セキュリティ

### 深度と並行性の制限

PRX はリソース枯渇を防ぐためにサブエージェント起動にハード制限を強制:

- **max_concurrent**: 同時実行サブエージェントを制限（デフォルト: 4）
- **max_depth**: ネスト深度を制限（デフォルト: 3）。最大深度では、子の利用可能ツールから `sessions_spawn` ツールが削除される。
- **max_total_spawns**: ルートセッションあたりの総起動数を制限（デフォルト: 20）
- **child_timeout_secs**: タイムアウトを超過したサブエージェントを強制終了（デフォルト: 300 秒）

### ツール制限

サブエージェントは親のサンドボックスポリシーを継承しますが、制限されたツールセットを持つことができます:

```json
{
  "name": "sessions_spawn",
  "arguments": {
    "task": "Search the web for information",
    "allowed_tools": ["web_search_tool", "web_fetch"]
  }
}
```

委任エージェントはツールが設定で明示的に定義されています。`allowed_tools` リスト外のツールにはアクセスできません。

### 資格情報の分離

委任エージェントは親とは異なるプロバイダーと API キーを使用可能:

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
# プロバイダーの設定済み API キーを使用
```

これにより、タスク要件に基づいて異なる LLM プロバイダーにタスクをルーティングでき、各プロバイダーの資格情報は分離されます。

### ポリシーエンジン

セッションとエージェントツールはポリシーエンジンの管理下にあります:

```toml
[security.tool_policy.groups]
sessions = "allow"

[security.tool_policy.tools]
delegate = "supervised"    # 委任に承認を要求
```

## 関連

- [サブエージェント](/ja/prx/agent/subagents) -- サブエージェントアーキテクチャと起動モデル
- [エージェントランタイム](/ja/prx/agent/runtime) -- エージェント実行アーキテクチャ
- [エージェントループ](/ja/prx/agent/loop) -- コア実行サイクル
- [セッションワーカー](/ja/prx/agent/session-worker) -- セッションのプロセス分離
- [設定リファレンス](/ja/prx/config/reference) -- エージェントとサブエージェント設定
- [ツール概要](/ja/prx/tools/) -- 全ツールとレジストリシステム
