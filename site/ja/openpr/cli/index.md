---
title: CLIリファレンス
---

# CLIリファレンス

OpenPRには`openpr-mcp`バイナリに組み込まれたコマンドラインインターフェースが含まれています。MCPサーバーの実行に加えて、ターミナルから直接プロジェクト、ワークアイテム、コメント、ラベル、スプリントなどを管理するコマンドを提供します。

## インストール

CLIは`mcp-server`クレートの一部として利用可能です。ビルド後、バイナリは`openpr-mcp`という名前になります。

```bash
cargo build --release -p mcp-server
```

## グローバルフラグ

これらのフラグはすべてのコマンドに適用されます：

| フラグ | 説明 | デフォルト |
|------|-------------|---------|
| `--api-url <URL>` | APIサーバーエンドポイント | `http://localhost:8080` |
| `--bot-token <TOKEN>` | 認証トークン（プレフィックス`opr_`） | -- |
| `--workspace-id <UUID>` | 操作のワークスペースコンテキスト | -- |
| `--format json\|table` | 出力フォーマット | `table` |

環境変数でも設定できます：

```bash
export OPENPR_API_URL=http://localhost:8080
export OPENPR_BOT_TOKEN=opr_your_token_here
export OPENPR_WORKSPACE_ID=your-workspace-uuid
```

## コマンド

### serve -- MCPサーバーを起動

AI統合のためのMCPサーバーを実行。

```bash
# HTTP transport (default)
openpr-mcp serve --transport http --port 8090

# Stdio transport (for direct integration)
openpr-mcp serve --transport stdio
```

### projects -- プロジェクト管理

```bash
# List all projects in the workspace
openpr-mcp projects list --format table

# Get details of a specific project
openpr-mcp projects get <project_id>

# Create a new project
openpr-mcp projects create --name "My Project" --key "MP"
```

### work-items -- ワークアイテム管理

```bash
# List work items with filters
openpr-mcp work-items list --project-id <id> --state todo
openpr-mcp work-items list --project-id <id> --state in_progress --assignee-id <user_id>

# Get a specific work item
openpr-mcp work-items get <id>

# Create a work item
openpr-mcp work-items create --project-id <id> --title "Fix bug" --state todo
openpr-mcp work-items create --project-id <id> --title "New feature" --state backlog --priority high

# Update a work item
openpr-mcp work-items update <id> --state in_progress --assignee-id <user_id>
openpr-mcp work-items update <id> --state done --priority low

# Search work items by text
openpr-mcp work-items search --query "authentication"
```

### comments -- コメント管理

```bash
# List comments on a work item
openpr-mcp comments list --work-item-id <id>

# Add a comment
openpr-mcp comments create --work-item-id <id> --content "Fixed in commit abc123"
```

### labels -- ラベル管理

```bash
# List workspace-level labels
openpr-mcp labels list --workspace

# List project-level labels
openpr-mcp labels list --project-id <id>
```

### sprints -- スプリント管理

```bash
# List sprints for a project
openpr-mcp sprints list --project-id <id>
```

### search -- グローバル検索

```bash
# Search across all entities
openpr-mcp search --query "bug"
```

### files -- ファイル添付

```bash
# Upload a file to a work item
openpr-mcp files upload --work-item-id <id> --path ./screenshot.png
```

## 使用例

### 典型的なワークフロー

```bash
# Set up credentials
export OPENPR_API_URL=https://openpr.example.com
export OPENPR_BOT_TOKEN=opr_abc123
export OPENPR_WORKSPACE_ID=550e8400-e29b-41d4-a716-446655440000

# List projects
openpr-mcp projects list

# View todo items for a project
openpr-mcp work-items list --project-id <id> --state todo --format table

# Pick up a work item
openpr-mcp work-items update <item_id> --state in_progress --assignee-id <your_user_id>

# Add a comment when done
openpr-mcp comments create --work-item-id <item_id> --content "Completed. See PR #42."

# Mark as done
openpr-mcp work-items update <item_id> --state done
```

### スクリプト用JSON出力

`--format json`を使用して`jq`やその他のツールにパイプするのに適した機械可読な出力を取得：

```bash
# Get all in-progress items as JSON
openpr-mcp work-items list --project-id <id> --state in_progress --format json

# Count items by state
openpr-mcp work-items list --project-id <id> --format json | jq '.[] | .state' | sort | uniq -c
```

## 参照

- [MCPサーバー](../mcp-server/) -- AIエージェントのためのMCPツール統合
- [APIリファレンス](../api/) -- 完全なREST APIドキュメント
- [ワークフロー状態](../issues/workflow) -- イシュー状態管理とカスタムワークフロー
