---
title: プロジェクト管理
description: "プロジェクトはワークスペース内でイシュー、スプリント、ラベルを整理します。OpenPRでプロジェクトを作成・管理する方法を学びます。"
---

# プロジェクト管理

**プロジェクト**はワークスペース内に存在し、イシュー、スプリント、ラベル、ガバナンス提案のコンテナとして機能します。各プロジェクトにはイシュー識別子のプレフィックスとなる一意の**キー**（例：`API`、`FRONT`、`OPS`）があります。

## プロジェクトの作成

ワークスペースに移動して**New Project（新規プロジェクト）**をクリック：

| フィールド | 必須 | 説明 | 例 |
|-------|----------|-------------|---------|
| 名前 | はい | 表示名 | "Backend API" |
| キー | はい | イシュー用の2-5文字のプレフィックス | "API" |
| 説明 | いいえ | プロジェクトの概要 | "REST API and business logic" |

キーはワークスペース内で一意である必要があり、イシュー識別子を決定します：`API-1`、`API-2`など。

## プロジェクトダッシュボード

各プロジェクトが提供するもの：

- **Board（ボード）** -- ドラッグ＆ドロップカラム付きカンバンビュー（Backlog、To Do、In Progress、Done）。
- **Issues（イシュー）** -- フィルタリング、ソート、フルテキスト検索付きリストビュー。
- **Sprints（スプリント）** -- スプリント計画とサイクル管理。[スプリント](../issues/sprints)を参照。
- **Labels（ラベル）** -- 分類用のプロジェクトスコープのラベル。[ラベル](../issues/labels)を参照。
- **Settings（設定）** -- プロジェクト名、キー、説明、メンバー設定。

## イシュー数

プロジェクト概要には状態ごとのイシュー数が表示されます：

| 状態 | 説明 |
|-------|-------------|
| Backlog | アイデアと将来の作業 |
| To Do | 現在のサイクルで計画済み |
| In Progress | 積極的に作業中 |
| Done | 完了した作業 |

## APIリファレンス

```bash
# List projects in a workspace
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects

# Create a project
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Backend API", "key": "API"}'

# Get project with issue counts
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects/<project_id>
```

## MCPツール

| ツール | パラメータ | 説明 |
|------|--------|-------------|
| `projects.list` | -- | ワークスペース内のすべてのプロジェクトをリスト |
| `projects.get` | `project_id` | イシュー数付きのプロジェクト詳細を取得 |
| `projects.create` | `key`, `name` | 新しいプロジェクトを作成 |
| `projects.update` | `project_id` | 名前または説明を更新 |
| `projects.delete` | `project_id` | プロジェクトを削除 |

## 次のステップ

- [イシュー](../issues/) -- プロジェクト内でイシューを作成・管理
- [メンバー](./members) -- ワークスペースロールを通じてプロジェクトアクセスを管理
