---
title: APIエンドポイントリファレンス
description: "認証、プロジェクト、イシュー、ガバナンス、AI、管理操作を含むすべてのOpenPR REST APIエンドポイントの完全リファレンス。"
---

# APIエンドポイントリファレンス

このページはすべてのOpenPR REST APIエンドポイントの完全リファレンスを提供します。特に記載がない限り、すべてのエンドポイントは認証が必要です。

## 認証

| メソッド | エンドポイント | 説明 | 認証 |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | 新しいアカウントを作成 | 不要 |
| POST | `/api/auth/login` | ログインしてトークンを取得 | 不要 |
| POST | `/api/auth/refresh` | アクセストークンをリフレッシュ | 不要 |
| GET | `/api/auth/me` | 現在のユーザー情報を取得 | 必要 |

## ワークスペース

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/workspaces` | ユーザーのワークスペースをリスト |
| POST | `/api/workspaces` | ワークスペースを作成 |
| GET | `/api/workspaces/:id` | ワークスペースの詳細を取得 |
| PUT | `/api/workspaces/:id` | ワークスペースを更新 |
| DELETE | `/api/workspaces/:id` | ワークスペースを削除（オーナーのみ） |

## ワークスペースメンバー

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/workspaces/:id/members` | メンバーをリスト |
| POST | `/api/workspaces/:id/members` | メンバーを追加 |
| PUT | `/api/workspaces/:id/members/:user_id` | メンバーロールを更新 |
| DELETE | `/api/workspaces/:id/members/:user_id` | メンバーを削除 |

## ボットトークン

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/workspaces/:id/bots` | ボットトークンをリスト |
| POST | `/api/workspaces/:id/bots` | ボットトークンを作成 |
| DELETE | `/api/workspaces/:id/bots/:bot_id` | ボットトークンを削除 |

## プロジェクト

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/workspaces/:ws_id/projects` | プロジェクトをリスト |
| POST | `/api/workspaces/:ws_id/projects` | プロジェクトを作成 |
| GET | `/api/workspaces/:ws_id/projects/:id` | カウント付きでプロジェクトを取得 |
| PUT | `/api/workspaces/:ws_id/projects/:id` | プロジェクトを更新 |
| DELETE | `/api/workspaces/:ws_id/projects/:id` | プロジェクトを削除 |

## イシュー（ワークアイテム）

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/projects/:id/issues` | イシューをリスト（ページネーション、フィルター） |
| POST | `/api/projects/:id/issues` | イシューを作成 |
| GET | `/api/issues/:id` | UUIDでイシューを取得 |
| PATCH | `/api/issues/:id` | イシューフィールドを更新 |
| DELETE | `/api/issues/:id` | イシューを削除 |

### イシューフィールド（作成/更新）

```json
{
  "title": "string (required on create)",
  "description": "string (markdown)",
  "state": "backlog | todo | in_progress | done",
  "priority": "low | medium | high | urgent",
  "assignee_id": "uuid",
  "sprint_id": "uuid",
  "due_at": "ISO 8601 datetime"
}
```

## ボード

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/projects/:id/board` | カンバンボードの状態を取得 |

## コメント

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/issues/:id/comments` | イシューのコメントをリスト |
| POST | `/api/issues/:id/comments` | コメントを作成 |
| DELETE | `/api/comments/:id` | コメントを削除 |

## ラベル

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/labels` | すべてのワークスペースラベルをリスト |
| POST | `/api/labels` | ラベルを作成 |
| PUT | `/api/labels/:id` | ラベルを更新 |
| DELETE | `/api/labels/:id` | ラベルを削除 |
| POST | `/api/issues/:id/labels` | イシューにラベルを追加 |
| DELETE | `/api/issues/:id/labels/:label_id` | イシューからラベルを削除 |

## スプリント

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/projects/:id/sprints` | スプリントをリスト |
| POST | `/api/projects/:id/sprints` | スプリントを作成 |
| PUT | `/api/sprints/:id` | スプリントを更新 |
| DELETE | `/api/sprints/:id` | スプリントを削除 |

## 提案

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/proposals` | 提案をリスト |
| POST | `/api/proposals` | 提案を作成 |
| GET | `/api/proposals/:id` | 提案の詳細を取得 |
| POST | `/api/proposals/:id/vote` | 投票する |
| POST | `/api/proposals/:id/submit` | 投票のために提出 |
| POST | `/api/proposals/:id/archive` | 提案をアーカイブ |

## ガバナンス

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/governance/config` | ガバナンス設定を取得 |
| PUT | `/api/governance/config` | ガバナンス設定を更新 |
| GET | `/api/governance/audit-logs` | ガバナンス監査ログをリスト |

## 決定

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/decisions` | 決定をリスト |
| GET | `/api/decisions/:id` | 決定の詳細を取得 |

## 信頼スコア

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/trust-scores` | 信頼スコアをリスト |
| GET | `/api/trust-scores/:user_id` | ユーザーの信頼スコアを取得 |
| GET | `/api/trust-scores/:user_id/history` | スコア履歴を取得 |
| POST | `/api/trust-scores/:user_id/appeals` | 申請を提出 |

## 拒否権

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/veto` | 拒否権イベントをリスト |
| POST | `/api/veto` | 拒否権を作成 |
| POST | `/api/veto/:id/escalate` | 拒否権をエスカレーション |

## AIエージェント

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/projects/:id/ai-agents` | AIエージェントをリスト |
| POST | `/api/projects/:id/ai-agents` | AIエージェントを登録 |
| GET | `/api/projects/:id/ai-agents/:agent_id` | エージェントの詳細を取得 |
| PUT | `/api/projects/:id/ai-agents/:agent_id` | エージェントを更新 |
| DELETE | `/api/projects/:id/ai-agents/:agent_id` | エージェントを削除 |

## AIタスク

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/projects/:id/ai-tasks` | AIタスクをリスト |
| POST | `/api/projects/:id/ai-tasks` | AIタスクを作成 |
| PUT | `/api/projects/:id/ai-tasks/:task_id` | タスクステータスを更新 |
| POST | `/api/projects/:id/ai-tasks/:task_id/callback` | タスクコールバック |

## ファイルアップロード

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| POST | `/api/v1/upload` | ファイルをアップロード（multipart/form-data） |

サポートされているタイプ：画像（PNG、JPG、GIF、WebP）、ドキュメント（PDF、TXT）、データ（JSON、CSV、XML）、アーカイブ（ZIP、GZ）、ログ。

## Webhook

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/workspaces/:id/webhooks` | Webhookをリスト |
| POST | `/api/workspaces/:id/webhooks` | Webhookを作成 |
| PUT | `/api/workspaces/:id/webhooks/:wh_id` | Webhookを更新 |
| DELETE | `/api/workspaces/:id/webhooks/:wh_id` | Webhookを削除 |
| GET | `/api/workspaces/:id/webhooks/:wh_id/deliveries` | 配信ログ |

## 検索

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/search?q=<query>` | すべてのエンティティ横断でフルテキスト検索 |

## 管理

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/admin/users` | すべてのユーザーをリスト（管理者のみ） |
| PUT | `/api/admin/users/:id` | ユーザーを更新（管理者のみ） |

## ヘルス

| メソッド | エンドポイント | 説明 | 認証 |
|--------|----------|-------------|------|
| GET | `/health` | ヘルスチェック | 不要 |

## 次のステップ

- [認証](./authentication) -- トークン管理とボットトークン
- [API概要](./index) -- レスポンスフォーマットと規約
- [MCPサーバー](../mcp-server/) -- AIフレンドリーなインターフェース
