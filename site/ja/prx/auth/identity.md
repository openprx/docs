---
title: アイデンティティ
description: PRX のワークスペースとユーザースコープ、マルチテナンシー、アイデンティティコンテキスト伝播
---

# アイデンティティ管理

PRX のアイデンティティシステムは、すべてのエージェント操作に対してワークスペースレベルとユーザーレベルのスコープを提供します。マルチテナントデプロイメントでは、アイデンティティコンテキストが特定のセッションがアクセスできるメモリ、設定、ツール、リソースを決定します。アイデンティティモジュールはアクセス制御、監査ログ、パーソナライゼーションの基盤です。

## 概要

すべての PRX セッションは以下を含むアイデンティティコンテキスト内で動作します:

| コンポーネント | 説明 |
|-----------|-------------|
| **ユーザー** | エージェントと対話する人間またはボット |
| **ワークスペース** | ユーザー、設定、データをグループ化する論理的な境界 |
| **セッション** | ユーザーとエージェント間の単一の会話 |
| **プリンシパル** | アクセス制御の決定に使用される有効なアイデンティティ |

```
┌─────────────────────────────────────────┐
│              Workspace: "acme"          │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ User: A  │  │ User: B  │  ...       │
│  │          │  │          │            │
│  │ Sessions │  │ Sessions │            │
│  │ Memories │  │ Memories │            │
│  │ Config   │  │ Config   │            │
│  └──────────┘  └──────────┘            │
│                                         │
│  Shared: workspace config, tools, keys │
└─────────────────────────────────────────┘
```

## 設定

### ワークスペースセットアップ

```toml
[identity]
# Enable multi-tenant identity scoping.
enabled = true

# Default workspace for sessions that do not specify one.
default_workspace = "default"

# Allow users to create new workspaces.
allow_workspace_creation = true

# Maximum workspaces per deployment.
max_workspaces = 100
```

### ユーザープロファイル

ユーザープロファイルはユーザーごとのプリファレンスとメタデータを保存します:

```toml
[identity.profiles]
# Storage backend for user profiles: "memory" | "sqlite" | "postgres"
backend = "sqlite"
path = "~/.local/share/openprx/identities.db"
```

### ワークスペース設定

各ワークスペースは独自の設定オーバーレイを持つことができます:

```toml
# config.toml でのワークスペース固有のオーバーライド
[workspaces.acme]
display_name = "ACME Corp"
default_provider = "openai"
default_model = "gpt-4o"

[workspaces.acme.memory]
backend = "postgres"

[workspaces.acme.security.tool_policy]
default = "supervised"
```

## アイデンティティコンテキスト

`IdentityContext` 構造体はリクエストパイプライン全体を通じて伝播されます。含まれるフィールド: `user_id`、`display_name`、`workspace_id`、`session_id`、`role`（Owner/Admin/Member/Guest）、`channel`、任意の `metadata`。

アイデンティティコンテキストはすべてのレイヤーを通じて伝播します: ゲートウェイが受信リクエストからコンテキストを抽出し、エージェントループがメモリとツールアクセスのスコープに使用し、メモリシステムがワークスペースとユーザーでデータをネームスペース化し、コスト追跡が使用量を帰属させ、監査ログがアクターを記録します。

## マルチテナンシー

PRX は複数の組織が単一の PRX インスタンスを共有するマルチテナントデプロイメントをサポートします。テナント境界はワークスペースレベルで強制されます:

### データ分離

| リソース | 分離レベル |
|----------|----------------|
| メモリ | ワークスペースごと + ユーザーごと |
| 設定 | グローバルデフォルト上のワークスペースごとオーバーレイ |
| ツールポリシー | ワークスペースごとのオーバーライド |
| シークレット | ワークスペースごとの vault |
| コスト予算 | ワークスペースごとの制限 |
| 監査ログ | ワークスペースごとのフィルタリング |

### クロスワークスペースアクセス

デフォルトでは、ユーザーは自分のワークスペース内のリソースのみアクセスできます。クロスワークスペースアクセスには明示的な設定が必要です:

```toml
[identity.cross_workspace]
# Allow workspace admins to access other workspaces.
admin_cross_access = false

# Allow specific users to access multiple workspaces.
[[identity.cross_workspace.grants]]
user_id = "shared-bot"
workspaces = ["acme", "beta-corp"]
role = "member"
```

## ユーザー解決

PRX は通信チャネルに応じて異なる方法でユーザーアイデンティティを解決します:

| チャネル | アイデンティティソース | ユーザー ID 形式 |
|---------|----------------|----------------|
| Telegram | Telegram ユーザー ID | `telegram:<user_id>` |
| Discord | Discord ユーザー ID | `discord:<user_id>` |
| Slack | Slack ユーザー ID | `slack:<workspace_id>:<user_id>` |
| CLI | システムユーザー名 | `cli:<username>` |
| API/Gateway | Bearer トークン / API キー | `api:<key_hash>` |
| WeChat | WeChat OpenID | `wechat:<open_id>` |
| QQ | QQ 番号 | `qq:<qq_number>` |

### 初回接触登録

新しいユーザーが PRX と初めて対話すると、アイデンティティレコードが自動的に作成されます: チャネルアダプターがユーザー識別子を抽出し、デフォルト設定でプロファイルを作成し、`Member` ロールで `default_workspace` にユーザーを割り当てます。

### 手動ユーザー管理

```bash
# 既知の全ユーザーを一覧
prx identity list

# ユーザーの詳細を表示
prx identity info telegram:123456

# ユーザーをワークスペースに割り当て
prx identity assign telegram:123456 --workspace acme --role admin

# ワークスペースからユーザーを削除
prx identity remove telegram:123456 --workspace acme

# ユーザーメタデータを設定
prx identity set telegram:123456 --key language --value en
```

## ワークスペース管理

```bash
# 全ワークスペースを一覧
prx workspace list

# 新しいワークスペースを作成
prx workspace create acme --display-name "ACME Corp"

# ワークスペースの詳細を表示
prx workspace info acme

# ワークスペース設定を変更
prx workspace config acme --set default_provider=anthropic

# ワークスペースを削除（確認が必要）
prx workspace delete acme --confirm
```

## ユーザープロファイル

ユーザープロファイルはエージェントの動作をパーソナライズするプリファレンスを保存します:

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `user_id` | string | 一意の識別子 |
| `display_name` | string | 人が読める名前 |
| `language` | string | 優先言語（ISO 639-1） |
| `timezone` | string | 優先タイムゾーン（IANA 形式） |
| `role` | enum | ワークスペースロール（owner、admin、member、guest） |
| `preferences` | map | キーバリュープリファレンス（モデル、冗長度など） |
| `created_at` | datetime | 初回対話のタイムスタンプ |
| `last_seen_at` | datetime | 最新の対話タイムスタンプ |

### システムプロンプトでのプロファイルアクセス

エージェントのシステムプロンプトにはテンプレート変数を通じてユーザープロファイル情報を含めることができます（例: <code v-pre>{{identity.display_name}}</code>、<code v-pre>{{identity.language}}</code>）。これらはプロンプトが LLM に送信される前にアイデンティティコンテキストから解決されます。

## ロールベースアクセス制御

ワークスペースロールはユーザーが実行できるアクションを決定します:

| 権限 | Owner | Admin | Member | Guest |
|------------|-------|-------|--------|-------|
| エージェント利用（チャット） | 可 | 可 | 可 | 可 |
| メモリ保存 | 可 | 可 | 可 | 不可 |
| ツール設定 | 可 | 可 | 不可 | 不可 |
| ユーザー管理 | 可 | 可 | 不可 | 不可 |
| ワークスペース管理 | 可 | 不可 | 不可 | 不可 |
| 監査ログ閲覧 | 可 | 可 | 不可 | 不可 |

## 統合ポイント

`identity.enabled = true` の場合、すべてのメモリ操作は `workspace:{workspace_id}:user:{user_id}:{key}` でスコープされ、データ分離を保証します。ツールポリシーはワークスペースごとにオーバーライドでき、トークン使用量はユーザーごとのコスト報告のためにアイデンティティコンテキストに帰属されます。

## セキュリティノート

- **アイデンティティ偽装** -- アイデンティティシステムはチャネルアダプターがユーザーを正しく識別することを信頼します。チャネル認証が適切に設定されていることを確認してください（ボットトークン、OAuth など）。
- **ワークスペース分離** -- ワークスペース境界はアプリケーションロジックで強制されます。基盤となるストレージ（SQLite、Postgres）はデータベースレベルの分離を提供しません。スコープロジックのバグはデータ漏洩の可能性があります。
- **ゲストアクセス** -- ゲストはデフォルトで最小限の権限を持ちます。公開エージェントを有効にする場合はゲストロールの設定を確認してください。
- **プロファイルデータ** -- ユーザープロファイルには個人情報が含まれる場合があります。プライバシーポリシーと適用される規制に従って取り扱ってください。
- **クロスワークスペース付与** -- クロスワークスペースアクセスは控えめに付与してください。各付与は侵害されたアカウントの影響範囲を拡大します。

## 関連ページ

- [認証概要](/ja/prx/auth/)
- [OAuth2 フロー](/ja/prx/auth/oauth2)
- [プロバイダープロファイル](/ja/prx/auth/profiles)
- [セキュリティ概要](/ja/prx/security/)
- [ポリシーエンジン](/ja/prx/security/policy-engine)
- [メモリシステム](/ja/prx/memory/)
