---
title: MCPサーバー
description: "OpenPRにはHTTP、stdio、SSEトランスポートで34ツールを提供する組み込みMCPサーバーが含まれています。Claude、Codex、CursorなどのAIアシスタントをプロジェクト管理と統合。"
---

# MCPサーバー

OpenPRにはAIアシスタントがプロジェクト、イシュー、スプリント、ラベル、コメント、提案、ファイルを管理するための34ツールを公開する組み込みの**MCP（Model Context Protocol）サーバー**が含まれています。サーバーは3つのトランスポートプロトコルを同時にサポートします。

## トランスポートプロトコル

| プロトコル | ユースケース | エンドポイント |
|----------|----------|----------|
| **HTTP** | Web統合、OpenClawプラグイン | `POST /mcp/rpc` |
| **stdio** | Claude Desktop、Codex、ローカルCLI | stdin/stdout JSON-RPC |
| **SSE** | ストリーミングクライアント、リアルタイムUI | `GET /sse` + `POST /messages` |

::: tip マルチプロトコル
HTTPモードでは、3つのプロトコルすべてが単一のポートで利用可能です：`/mcp/rpc`（HTTP）、`/sse` + `/messages`（SSE）、`/health`（ヘルスチェック）。
:::

## 設定

### 環境変数

| 変数 | 必須 | 説明 | 例 |
|----------|----------|-------------|---------|
| `OPENPR_API_URL` | はい | APIサーバーのベースURL | `http://localhost:3000` |
| `OPENPR_BOT_TOKEN` | はい | `opr_`プレフィックス付きボットトークン | `opr_abc123...` |
| `OPENPR_WORKSPACE_ID` | はい | デフォルトのワークスペースUUID | `e5166fd1-...` |

### Claude Desktop / Cursor / Codex（stdio）

MCPクライアント設定に追加：

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_your_token_here",
        "OPENPR_WORKSPACE_ID": "your-workspace-uuid"
      }
    }
  }
}
```

### HTTPモード

```bash
# Start the MCP server
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090

# Verify
curl -X POST http://localhost:8090/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### SSEモード

```bash
# 1. Connect SSE stream (returns session endpoint)
curl -N -H "Accept: text/event-stream" http://localhost:8090/sse
# -> event: endpoint
# -> data: /messages?session_id=<uuid>

# 2. POST request to the returned endpoint
curl -X POST "http://localhost:8090/messages?session_id=<uuid>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"projects.list","arguments":{}}}'
# -> Response arrives via SSE stream as event: message
```

### Docker Compose

```yaml
mcp-server:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: mcp-server
  environment:
    - OPENPR_API_URL=http://api:8080
    - OPENPR_BOT_TOKEN=opr_your_token
    - OPENPR_WORKSPACE_ID=your-workspace-uuid
  ports:
    - "8090:8090"
  command: ["./mcp-server", "--transport", "http", "--bind-addr", "0.0.0.0:8090"]
```

## ツールリファレンス（34ツール）

### プロジェクト（5）

| ツール | 必須パラメータ | 説明 |
|------|-----------------|-------------|
| `projects.list` | -- | ワークスペース内のすべてのプロジェクトをリスト |
| `projects.get` | `project_id` | イシュー数付きのプロジェクト詳細を取得 |
| `projects.create` | `key`, `name` | プロジェクトを作成 |
| `projects.update` | `project_id` | 名前/説明を更新 |
| `projects.delete` | `project_id` | プロジェクトを削除 |

### ワークアイテム / イシュー（11）

| ツール | 必須パラメータ | 説明 |
|------|-----------------|-------------|
| `work_items.list` | `project_id` | プロジェクト内のイシューをリスト |
| `work_items.get` | `work_item_id` | UUIDでイシューを取得 |
| `work_items.get_by_identifier` | `identifier` | 人間IDで取得（例：`API-42`） |
| `work_items.create` | `project_id`, `title` | オプションの状態、優先度、説明、assignee_id、due_at、添付ファイルでイシューを作成 |
| `work_items.update` | `work_item_id` | 任意のフィールドを更新 |
| `work_items.delete` | `work_item_id` | イシューを削除 |
| `work_items.search` | `query` | すべてのプロジェクト横断でフルテキスト検索 |
| `work_items.add_label` | `work_item_id`, `label_id` | 1つのラベルを追加 |
| `work_items.add_labels` | `work_item_id`, `label_ids` | 複数のラベルを追加 |
| `work_items.remove_label` | `work_item_id`, `label_id` | ラベルを削除 |
| `work_items.list_labels` | `work_item_id` | イシューのラベルをリスト |

### コメント（3）

| ツール | 必須パラメータ | 説明 |
|------|-----------------|-------------|
| `comments.create` | `work_item_id`, `content` | オプションの添付ファイルでコメントを作成 |
| `comments.list` | `work_item_id` | イシューのコメントをリスト |
| `comments.delete` | `comment_id` | コメントを削除 |

### ファイル（1）

| ツール | 必須パラメータ | 説明 |
|------|-----------------|-------------|
| `files.upload` | `filename`, `content_base64` | ファイルをアップロード（base64）、URLとファイル名を返す |

### ラベル（5）

| ツール | 必須パラメータ | 説明 |
|------|-----------------|-------------|
| `labels.list` | -- | すべてのワークスペースラベルをリスト |
| `labels.list_by_project` | `project_id` | プロジェクトのラベルをリスト |
| `labels.create` | `name`, `color` | ラベルを作成（カラー：16進数、例：`#2563eb`） |
| `labels.update` | `label_id` | 名前/カラー/説明を更新 |
| `labels.delete` | `label_id` | ラベルを削除 |

### スプリント（4）

| ツール | 必須パラメータ | 説明 |
|------|-----------------|-------------|
| `sprints.list` | `project_id` | プロジェクトのスプリントをリスト |
| `sprints.create` | `project_id`, `name` | オプションのstart_date、end_dateでスプリントを作成 |
| `sprints.update` | `sprint_id` | 名前/日付/ステータスを更新 |
| `sprints.delete` | `sprint_id` | スプリントを削除 |

### 提案（3）

| ツール | 必須パラメータ | 説明 |
|------|-----------------|-------------|
| `proposals.list` | `project_id` | オプションのステータスフィルタで提案をリスト |
| `proposals.get` | `proposal_id` | 提案の詳細を取得 |
| `proposals.create` | `project_id`, `title`, `description` | ガバナンス提案を作成 |

### メンバーと検索（2）

| ツール | 必須パラメータ | 説明 |
|------|-----------------|-------------|
| `members.list` | -- | ワークスペースメンバーとロールをリスト |
| `search.all` | `query` | プロジェクト、イシュー、コメント横断でグローバル検索 |

## レスポンスフォーマット

すべてのMCPツールレスポンスは以下の構造に従います：

### 成功

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### エラー

```json
{
  "code": 400,
  "message": "error description"
}
```

## ボットトークン認証

MCPサーバーは**ボットトークン**（プレフィックス`opr_`）で認証します。ボットトークンは**Workspace Settings（ワークスペース設定）** > **Bot Tokens（ボットトークン）**で作成してください。

各ボットトークンは：
- 表示名を持つ（アクティビティフィードに表示）
- 1つのワークスペースにスコープされる
- 監査証跡の完全性のために`bot_mcp`ユーザーエンティティを作成する
- ワークスペースメンバーが利用可能なすべての読み書き操作をサポートする

## エージェント統合

コーディングエージェント向けに、OpenPRは以下を提供します：

- **AGENTS.md**（`apps/mcp-server/AGENTS.md`）-- エージェント向けのワークフローパターンとツール例。
- **スキルパッケージ**（`skills/openpr-mcp/SKILL.md`）-- ワークフローテンプレートとスクリプトを持つガバナンス付きスキル。

推奨エージェントワークフロー：
1. ツールのセマンティクスのために`AGENTS.md`を読み込む。
2. `tools/list`を使用してランタイムで利用可能なツールを列挙する。
3. ワークフローパターンに従う：検索 -> 作成 -> ラベル付け -> コメント。

## 次のステップ

- [API概要](../api/) -- REST APIリファレンス
- [メンバーと権限](../workspace/members) -- ボットトークン管理
- [設定](../configuration/) -- すべての環境変数
