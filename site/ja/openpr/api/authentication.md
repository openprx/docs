---
title: 認証
description: "OpenPRはユーザー認証にJWTトークン、AI/MCPアクセスにボットトークンを使用します。登録、ログイン、トークンリフレッシュ、ボットトークンについて学びます。"
---

# 認証

OpenPRはユーザー認証に**JWT（JSON Web Tokens）**、AIアシスタントとMCPサーバーアクセスに**ボットトークン**を使用します。

## ユーザー認証（JWT）

### 登録

新しいアカウントを作成：

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePassword123"
  }'
```

レスポンス：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

::: tip 最初のユーザー
最初に登録したユーザーが自動的に`admin`ロールを取得します。それ以降のすべてのユーザーはデフォルトで`user`になります。
:::

### ログイン

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

レスポンスには`access_token`、`refresh_token`、`role`付きのユーザー情報が含まれます。

### アクセストークンの使用

すべての認証リクエストの`Authorization`ヘッダーにアクセストークンを含める：

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/workspaces
```

### トークンのリフレッシュ

アクセストークンの期限が切れた場合、リフレッシュトークンを使用して新しいペアを取得：

```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJ..."}'
```

### 現在のユーザーを取得

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/auth/me
```

`role`（admin/user）を含む現在のユーザープロファイルを返します。

## トークン設定

JWTトークンの有効期間は環境変数で設定されます：

| 変数 | デフォルト | 説明 |
|----------|---------|-------------|
| `JWT_SECRET` | `change-me-in-production` | トークン署名用の秘密鍵 |
| `JWT_ACCESS_TTL_SECONDS` | `2592000`（30日） | アクセストークンの有効期間 |
| `JWT_REFRESH_TTL_SECONDS` | `604800`（7日） | リフレッシュトークンの有効期間 |

::: danger プロダクションセキュリティ
プロダクションでは`JWT_SECRET`を必ず強力でランダムな値に設定してください。デフォルト値は安全ではありません。
:::

## ボットトークン認証

ボットトークンはAIアシスタントと自動化ツールに認証を提供します。ワークスペーススコープで`opr_`プレフィックスを使用します。

### ボットトークンの作成

ボットトークンはワークスペース設定UIまたはAPIで管理されます：

```bash
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/bots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"name": "Claude Assistant"}'
```

### ボットトークンの使用

ボットトークンはJWTトークンと同じ方法で使用されます：

```bash
curl -H "Authorization: Bearer opr_abc123..." \
  http://localhost:8080/api/workspaces/<workspace_id>/projects
```

### ボットトークンのプロパティ

| プロパティ | 説明 |
|----------|-------------|
| プレフィックス | `opr_` |
| スコープ | 1つのワークスペース |
| エンティティタイプ | `bot_mcp`ユーザーエンティティを作成 |
| 権限 | ワークスペースメンバーと同等 |
| 監査証跡 | すべての操作がボットユーザー下で記録 |

## 認証エンドポイントまとめ

| エンドポイント | メソッド | 説明 |
|----------|--------|-------------|
| `/api/auth/register` | POST | アカウントを作成 |
| `/api/auth/login` | POST | ログインしてトークンを取得 |
| `/api/auth/refresh` | POST | トークンペアをリフレッシュ |
| `/api/auth/me` | GET | 現在のユーザー情報を取得 |

## 次のステップ

- [エンドポイントリファレンス](./endpoints) -- 完全なAPIドキュメント
- [MCPサーバー](../mcp-server/) -- MCPでのボットトークンの使用
- [メンバーと権限](../workspace/members) -- ロールベースアクセス
