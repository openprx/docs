---
title: メモリツール
description: カテゴリサポートと ACL 強制によるエージェントの永続的長期メモリの保存、取得、検索、管理のための 5 つのツール。
---

# メモリツール

PRX は、エージェントが会話を超えて知識を永続化し、関連するコンテキストをリコールし、長期メモリストアを管理するための 5 つのメモリツールを提供します。これらのツールは、短命な LLM コンテキストウィンドウと永続的なエージェント知識の間のギャップを埋めます。

メモリシステムは 3 つの組み込みカテゴリ -- `core`（永続的な事実）、`daily`（セッションスコープのメモ）、`conversation`（チャットコンテキスト） -- に加え、カスタムのユーザー定義カテゴリをサポートします。各ツールは ACL 対応です: メモリアクセス制御が有効な場合、操作はプリンシパルごとのアクセスルールに基づいて制限されます。

メモリツールは `all_tools()` レジストリに登録されており、エージェントがフルツールセットで実行されている場合は常に利用可能です。5 つのメモリストレージバックエンド（Markdown、SQLite、PostgreSQL、Embeddings、またはインメモリ）のいずれでも動作します。

## 設定

メモリツールは `[memory]` セクションで設定されます:

```toml
[memory]
backend = "sqlite"              # "markdown" | "sqlite" | "postgres" | "embeddings" | "memory"
auto_save = true                # 会話入力をメモリに自動保存
acl_enabled = false             # アクセス制御リストを有効化
max_recall_items = 20           # recall/search が返す最大アイテム数
recall_relevance_threshold = 0.3  # recall の最小関連性スコア

# オプション: エンベディングベースのセマンティック検索
embedding_provider = "openai"
embedding_model = "text-embedding-3-small"
embedding_dimensions = 1536
vector_weight = 0.7             # ハイブリッド検索でのベクトル類似度の重み
keyword_weight = 0.3            # BM25 キーワード検索の重み
min_relevance_score = 0.4       # 結果に含める最小スコア

# メモリハイジーン（自動クリーンアップ）
hygiene_enabled = true
archive_after_days = 7
purge_after_days = 30
conversation_retention_days = 3
daily_retention_days = 7
```

## ツールリファレンス

### memory_store

事実、好み、メモ、知識を長期メモリに保存します。

```json
{
  "name": "memory_store",
  "arguments": {
    "key": "user_timezone",
    "value": "The user is located in UTC+8 (Asia/Shanghai)",
    "category": "core"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `key` | `string` | はい | -- | このメモリエントリの一意識別子 |
| `value` | `string` | はい | -- | 保存する内容 |
| `category` | `string` | いいえ | `"core"` | カテゴリ: `"core"`、`"daily"`、`"conversation"`、またはカスタム |

**カテゴリ:**

| カテゴリ | 保持期間 | 目的 |
|----------|-----------|---------|
| `core` | 永続（明示的に削除するまで） | 基本的な事実、ユーザーの好み、システム設定 |
| `daily` | セッションスコープ、`archive_after_days` 後にアーカイブ | 今日のタスク、コンテキスト、セッションメモ |
| `conversation` | 短命、`conversation_retention_days` 後に削除 | 現在のチャットコンテキスト、参照 |
| カスタム | `daily` の保持ルールに従う | ドメイン固有の知識用のユーザー定義カテゴリ |

### memory_forget

キーによって長期メモリから特定のエントリを削除します。

```json
{
  "name": "memory_forget",
  "arguments": {
    "key": "user_timezone"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `key` | `string` | はい | -- | 削除するメモリエントリのキー |

### memory_get

正確なキーによって特定のメモリエントリを取得します。有効な場合は ACL 対応です。

```json
{
  "name": "memory_get",
  "arguments": {
    "key": "user_timezone"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `key` | `string` | はい | -- | 検索する正確なキー |

見つかった場合は保存された値を返し、キーが存在しないか ACL によってアクセスが拒否された場合はエラーを返します。

### memory_recall

キーワードまたはセマンティック類似度でメモリをリコールします。クエリに最も関連するエントリを返します。このツールは `memory.acl_enabled = true` の場合**完全に無効化**されます -- ツールレジストリから削除されます。

```json
{
  "name": "memory_recall",
  "arguments": {
    "query": "user preferences about coding style"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `query` | `string` | はい | -- | 検索クエリ（キーワードまたは自然言語） |
| `max_results` | `integer` | いいえ | `20` | 返すエントリの最大数 |

### memory_search

全メモリエントリにわたるフルテキストおよびベクトル検索。`memory_recall` とは異なり、このツールは ACL が有効な場合でも利用可能ですが、結果にプリンシパルごとのアクセス制限を強制します。

```json
{
  "name": "memory_search",
  "arguments": {
    "query": "project deadlines",
    "category": "daily",
    "max_results": 10
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `query` | `string` | はい | -- | 検索クエリ |
| `category` | `string` | いいえ | -- | 結果を特定のカテゴリにフィルタ |
| `max_results` | `integer` | いいえ | `20` | 返すエントリの最大数 |

エンベディング検索が設定されている場合、`memory_search` は以下を組み合わせたハイブリッド検索を実行:

- **ベクトル類似度**（`vector_weight` で重み付け） -- エンベディングによるセマンティックマッチング
- **BM25 キーワード検索**（`keyword_weight` で重み付け） -- 従来のフルテキストマッチング

`min_relevance_score` 未満の結果はフィルタリングされます。

## 使用方法

### 典型的なメモリワークフロー

会話中、エージェントは自然なサイクルでメモリツールを使用:

1. **開始時にリコール**: 応答前にシステムが関連メモリをリコールしてコンテキストを注入
2. **会話中に保存**: ユーザーが重要な情報を共有したとき、エージェントがそれを保存
3. **オンデマンドで検索**: エージェントが特定の過去の知識を必要とするとき、メモリを検索
4. **リクエストに応じて削除**: ユーザーが情報の削除を求めたとき、エージェントがそれを削除

### CLI インタラクション

コマンドラインからメモリの状態を確認できます:

```bash
# メモリ統計を表示
prx memory stats

# カテゴリ内の全メモリエントリをリスト
prx memory list --category core

# CLI からメモリを検索
prx memory search "project deadlines"

# メモリをファイルにエクスポート
prx memory export --format json > memories.json
```

### エージェント使用例

複数ターンの会話で:

```
ユーザー: コードはすべて 4 スペースインデントがいいです。
エージェント: [memory_store を呼び出し: key="code_style_indent", value="User prefers 4-space indentation", category="core"]
       了解しました。4 スペースインデントの好みを記憶します。

ユーザー: 私のコーディングの好みは何ですか？
エージェント: [memory_search を呼び出し: query="coding preferences"]
       記憶によると、すべてのコードで 4 スペースインデントを好まれています。
```

## セキュリティ

### ACL 強制

`memory.acl_enabled = true` の場合、メモリシステムはアクセス制御を強制:

| ツール | ACL 動作 |
|------|-------------|
| `memory_store` | 現在のプリンシパルの所有権でエントリを保存 |
| `memory_forget` | 現在のプリンシパルが所有するエントリの削除のみ許可 |
| `memory_get` | 現在のプリンシパルがアクセス権を持つエントリのみ返す |
| `memory_recall` | **完全に無効化**（ツールレジストリから削除） |
| `memory_search` | 現在のプリンシパルがアクセス権を持つエントリのみ返す |

`memory_recall` ツールは ACL 下で無効化されます。これは、その広範なキーワードマッチングがプリンシパル境界を超えて情報を漏洩する可能性があるためです。より対象を絞った `memory_get` と `memory_search` ツールはエントリごとのアクセスチェックを強制します。

### file_read との相互作用

ACL が有効な場合、`file_read` ツールはメモリストレージファイル（メモリディレクトリ内のマークダウンファイル）へのアクセスもブロックします。これにより、エージェントがディスクから生のメモリファイルを読み取って ACL をバイパスすることを防ぎます。

### 機密データの取り扱い

メモリエントリにはユーザーの機密情報が含まれる可能性があります。以下のプラクティスを検討してください:

- 真に永続的な知識にのみ `core` カテゴリを慎重に使用
- 古いエントリの自動削除のために `hygiene_enabled` を有効化
- マルチユーザーデプロイメントでは `acl_enabled` を有効化
- `prx memory list` でメモリ内容を定期的にレビュー
- 不要になった機密エントリには `memory_forget` を使用

### 監査証跡

`security.audit.enabled = true` の場合、すべてのメモリ操作がツール名、キー、カテゴリ、成功/失敗ステータスを含めて監査ログに記録されます。

## 関連

- [メモリシステム](/ja/prx/memory/) -- アーキテクチャとストレージバックエンド
- [Markdown バックエンド](/ja/prx/memory/markdown) -- ファイルベースのメモリストレージ
- [SQLite バックエンド](/ja/prx/memory/sqlite) -- ローカルデータベースストレージ
- [PostgreSQL バックエンド](/ja/prx/memory/postgres) -- リモートデータベースストレージ
- [エンベディング](/ja/prx/memory/embeddings) -- ベクトル検索設定
- [メモリハイジーン](/ja/prx/memory/hygiene) -- 自動クリーンアップとアーカイブ
- [ファイル操作](/ja/prx/tools/file-operations) -- file_read との ACL 相互作用
- [ツール概要](/ja/prx/tools/) -- 全ツールとレジストリシステム
