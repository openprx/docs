---
title: REST API 概要
description: "OpenPRはワークスペース、プロジェクト、イシュー、ガバナンスなどを管理するための包括的なREST APIを公開しています。RustとAxumで構築。"
---

# REST API 概要

OpenPRはすべてのプラットフォーム機能へのプログラムアクセスのために**Rust**と**Axum**で構築されたRESTful APIを提供します。APIはJSONリクエスト/レスポンスフォーマットとJWTベースの認証をサポートします。

## ベースURL

```
http://localhost:8080/api
```

リバースプロキシ（Caddy/Nginx）の背後のプロダクションデプロイメントでは、APIは通常フロントエンドURLを通じてプロキシされます。

## レスポンスフォーマット

すべてのAPIレスポンスは一貫したJSON構造に従います：

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
  "message": "Detailed error description"
}
```

一般的なエラーコード：

| コード | 意味 |
|------|---------|
| 400 | 不正なリクエスト（バリデーションエラー） |
| 401 | 未認証（トークンがないか無効） |
| 403 | 禁止（権限不足） |
| 404 | 見つからない |
| 500 | 内部サーバーエラー |

## APIカテゴリ

| カテゴリ | ベースパス | 説明 |
|----------|-----------|-------------|
| [認証](./authentication) | `/api/auth/*` | 登録、ログイン、トークンリフレッシュ |
| プロジェクト | `/api/workspaces/*/projects/*` | CRUD、メンバー、設定 |
| イシュー | `/api/projects/*/issues/*` | CRUD、割り当て、ラベル、コメント |
| ボード | `/api/projects/*/board` | カンバンボードの状態 |
| スプリント | `/api/projects/*/sprints/*` | スプリントCRUDと計画 |
| ラベル | `/api/labels/*` | ラベルCRUD |
| 検索 | `/api/search` | フルテキスト検索 |
| 提案 | `/api/proposals/*` | 作成、投票、提出、アーカイブ |
| ガバナンス | `/api/governance/*` | 設定、監査ログ |
| 決定 | `/api/decisions/*` | 決定記録 |
| 信頼スコア | `/api/trust-scores/*` | スコア、履歴、申請 |
| 拒否権 | `/api/veto/*` | 拒否権、エスカレーション |
| AIエージェント | `/api/projects/*/ai-agents/*` | エージェント管理 |
| AIタスク | `/api/projects/*/ai-tasks/*` | タスク割り当て |
| ボットトークン | `/api/workspaces/*/bots` | ボットトークンCRUD |
| ファイルアップロード | `/api/v1/upload` | マルチパートファイルアップロード |
| Webhook | `/api/workspaces/*/webhooks/*` | Webhook CRUD |
| 管理 | `/api/admin/*` | システム管理 |

完全なAPIリファレンスは[エンドポイントリファレンス](./endpoints)を参照。

## コンテンツタイプ

すべてのPOST/PUT/PATCHリクエストは`Content-Type: application/json`を使用する必要があります。ただし、ファイルアップロードは`multipart/form-data`を使用します。

## ページネーション

リストエンドポイントはページネーションをサポートします：

```bash
curl "http://localhost:8080/api/projects/<id>/issues?page=1&per_page=20" \
  -H "Authorization: Bearer <token>"
```

## フルテキスト検索

検索エンドポイントはイシュー、コメント、提案横断でPostgreSQLのフルテキスト検索を使用します：

```bash
curl "http://localhost:8080/api/search?q=authentication+bug" \
  -H "Authorization: Bearer <token>"
```

## ヘルスチェック

APIサーバーは認証を必要としないヘルスエンドポイントを公開します：

```bash
curl http://localhost:8080/health
```

## 次のステップ

- [認証](./authentication) -- JWT認証とボットトークン
- [エンドポイントリファレンス](./endpoints) -- 完全なエンドポイントドキュメント
- [MCPサーバー](../mcp-server/) -- 34ツールを持つAIフレンドリーなインターフェース
