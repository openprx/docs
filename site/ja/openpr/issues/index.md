---
title: イシューと追跡
description: "OpenPRのイシューはコアの作業単位です。状態、優先度、担当者、ラベル、コメントでタスク、バグ、機能を追跡。"
---

# イシューと追跡

イシュー（ワークアイテムとも呼ばれる）はOpenPRのコアの作業単位です。プロジェクト内のタスク、バグ、機能、または追跡可能な作業を表します。

## イシューフィールド

| フィールド | タイプ | 必須 | 説明 |
|-------|------|----------|-------------|
| タイトル | string | はい | 作業の短い説明 |
| 説明 | markdown | いいえ | フォーマット付きの詳細説明 |
| 状態 | enum | はい | ワークフロー状態（[ワークフロー](./workflow)を参照） |
| 優先度 | enum | いいえ | `low`、`medium`、`high`、`urgent` |
| 担当者 | user | いいえ | イシューを担当するチームメンバー |
| ラベル | list | いいえ | 分類タグ（[ラベル](./labels)を参照） |
| スプリント | sprint | いいえ | イシューが属するスプリントサイクル |
| 期日 | datetime | いいえ | 目標完了日 |
| 添付ファイル | files | いいえ | 添付ファイル（画像、ドキュメント、ログ） |

## イシュー識別子

各イシューにはプロジェクトキーと連番で構成される人間が読める識別子があります：

```
API-1, API-2, API-3, ...
FRONT-1, FRONT-2, ...
```

ワークスペース内のすべてのプロジェクト横断でイシューを識別子で検索できます。

## イシューの作成

### Web UIから

1. プロジェクトに移動。
2. **New Issue（新規イシュー）**をクリック。
3. タイトル、説明、オプションフィールドを入力。
4. **Create（作成）**をクリック。

### REST APIから

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Implement user settings page",
    "description": "Add a settings page where users can update their profile.",
    "state": "todo",
    "priority": "medium",
    "assignee_id": "<user_uuid>"
  }'
```

### MCPから

```json
{
  "method": "tools/call",
  "params": {
    "name": "work_items.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "title": "Implement user settings page",
      "state": "todo",
      "priority": "medium"
    }
  }
}
```

## コメント

イシューはMarkdownフォーマットとファイル添付付きのスレッドコメントをサポートします：

```bash
# Add a comment
curl -X POST http://localhost:8080/api/issues/<issue_id>/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content": "Fixed in commit abc123. Ready for review."}'
```

コメントはMCPツールでも利用可能です：`comments.create`、`comments.list`、`comments.delete`。

## アクティビティフィード

イシューへのすべての変更はアクティビティフィードに記録されます：

- 状態の変更
- 担当者の変更
- ラベルの追加/削除
- コメント
- 優先度の更新

アクティビティフィードは各イシューの完全な監査証跡を提供します。

## ファイル添付

イシューとコメントは画像、ドキュメント、ログ、アーカイブを含むファイル添付をサポートします。APIでアップロード：

```bash
curl -X POST http://localhost:8080/api/v1/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@screenshot.png"
```

またはMCPで：

```json
{
  "method": "tools/call",
  "params": {
    "name": "files.upload",
    "arguments": {
      "filename": "screenshot.png",
      "content_base64": "<base64_encoded_content>"
    }
  }
}
```

サポートされているファイルタイプ：画像（PNG、JPG、GIF、WebP）、ドキュメント（PDF、TXT）、データ（JSON、CSV、XML）、アーカイブ（ZIP、GZ）、ログ。

## 検索

OpenPRはPostgreSQL FTSを使用して全イシュー、コメント、提案のフルテキスト検索を提供します：

```bash
# Search via API
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/search?q=authentication+bug"

# Search via MCP
# work_items.search: search within a project
# search.all: global search across all projects
```

## MCPツール

| ツール | パラメータ | 説明 |
|------|--------|-------------|
| `work_items.list` | `project_id` | プロジェクト内のイシューをリスト |
| `work_items.get` | `work_item_id` | UUIDでイシューを取得 |
| `work_items.get_by_identifier` | `identifier` | 人間IDで取得（例：`API-42`） |
| `work_items.create` | `project_id`, `title` | イシューを作成 |
| `work_items.update` | `work_item_id` | 任意のフィールドを更新 |
| `work_items.delete` | `work_item_id` | イシューを削除 |
| `work_items.search` | `query` | フルテキスト検索 |
| `comments.create` | `work_item_id`, `content` | コメントを追加 |
| `comments.list` | `work_item_id` | コメントをリスト |
| `comments.delete` | `comment_id` | コメントを削除 |
| `files.upload` | `filename`, `content_base64` | ファイルをアップロード |

## 次のステップ

- [ワークフロー状態](./workflow) -- イシューのライフサイクルを理解
- [スプリント計画](./sprints) -- イシューをスプリントサイクルに整理
- [ラベル](./labels) -- ラベルでイシューを分類
