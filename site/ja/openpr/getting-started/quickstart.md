---
title: クイックスタート
description: "OpenPRを起動して最初のワークスペース、プロジェクト、イシューを5分で作成。"
---

# クイックスタート

このガイドでは、OpenPRのセットアップと最初のワークスペース、プロジェクト、イシューの作成を案内します。すでに[インストール](./installation)を完了していることを前提としています。

## ステップ1: OpenPRを起動

まだ起動していない場合は、サービスを起動：

```bash
cd openpr
docker-compose up -d
```

すべてのサービスが正常になるまで待機：

```bash
docker-compose ps
```

## ステップ2: 管理者アカウントを登録

ブラウザでhttp://localhost:3000を開きます。**Register（登録）**をクリックしてアカウントを作成してください。

::: tip 最初のユーザーが管理者
最初に登録したユーザーが自動的に**admin**ロールを取得します。このユーザーはすべてのワークスペース、プロジェクト、システム設定を管理できます。
:::

## ステップ3: ワークスペースを作成

ログイン後、最初のワークスペースを作成：

1. ダッシュボードで**Create Workspace（ワークスペースを作成）**をクリック。
2. 名前（例："My Team"）とスラッグ（例："my-team"）を入力。
3. **Create（作成）**をクリック。

ワークスペースはすべてのプロジェクトとメンバーの最上位コンテナです。

## ステップ4: プロジェクトを作成

ワークスペース内で：

1. **New Project（新規プロジェクト）**をクリック。
2. 名前（例："Backend API"）とプロジェクトキー（例："API"）を入力。キーはイシュー識別子のプレフィックスとして使用されます（例：API-1、API-2）。
3. **Create（作成）**をクリック。

## ステップ5: イシューを作成

プロジェクトに移動してイシューを作成：

1. **New Issue（新規イシュー）**をクリック。
2. タイトルと説明を入力。
3. 状態を設定（backlog、todo、in_progress、またはdone）。
4. オプションで優先度（low、medium、high、urgent）、担当者、ラベルを設定。
5. **Create（作成）**をクリック。

イシューはAPIやMCPサーバーでも作成できます：

```bash
# Create an issue via REST API
curl -X POST http://localhost:8080/api/projects/<project_id>/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "title": "Set up CI pipeline",
    "state": "todo",
    "priority": "high"
  }'
```

## ステップ6: カンバンボードをセットアップ

プロジェクトの**Board（ボード）**ビューに移動します。イシューは状態ごとにカラムに整理されます：

| カラム | 状態 | 説明 |
|--------|-------|-------------|
| Backlog | `backlog` | アイデアと将来の作業 |
| To Do | `todo` | 現在のサイクルで計画済み |
| In Progress | `in_progress` | 積極的に作業中 |
| Done | `done` | 完了した作業 |

イシューをカラム間でドラッグ＆ドロップして状態を更新してください。

## ステップ7: チームメンバーを招待

**Workspace Settings（ワークスペース設定）** > **Members（メンバー）**へ：

1. **Invite Member（メンバーを招待）**をクリック。
2. メールアドレスを入力。
3. ロールを選択：**Owner（オーナー）**、**Admin（管理者）**、または**Member（メンバー）**。

| ロール | 権限 |
|------|------------|
| Owner | フルアクセス、ワークスペースを削除可能 |
| Admin | プロジェクト、メンバー、設定を管理 |
| Member | イシュー、コメントを作成・管理 |

## ステップ8: AIアシスタントを接続（オプション）

AIアシスタントがプロジェクトを管理できるようにMCPサーバーをセットアップ：

1. **Workspace Settings（ワークスペース設定）** > **Bot Tokens（ボットトークン）**へ。
2. 新しいボットトークンを作成。`opr_`プレフィックスが付きます。
3. ボットトークンでAIアシスタントを設定。

Claude Desktopの設定例：

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

AIアシスタントは34のMCPツールを通じてプロジェクトのリスト表示、イシューの作成、スプリントの管理などができるようになります。

## 次のステップ

- [ワークスペース管理](../workspace/) -- ワークスペース構成とメンバーロールについて学ぶ
- [イシューとワークフロー](../issues/) -- イシュー追跡と状態管理の詳細
- [スプリント計画](../issues/sprints) -- スプリントサイクルの設定
- [ガバナンスセンター](../governance/) -- 提案、投票、信頼スコアを有効化
- [APIリファレンス](../api/) -- 外部ツールとの統合
- [MCPサーバー](../mcp-server/) -- AIアシスタント向けMCPツール完全リファレンス
