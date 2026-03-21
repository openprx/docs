---
title: Git 操作
description: ワークスペースリポジトリでの status、diff、commit、push、pull、log、branch 操作をサポートするバージョン管理ツール。
---

# Git 操作

`git_operations` ツールは、PRX エージェントに統一されたインターフェースを通じてバージョン管理機能を提供します。エージェントがシェルツールを通じて `git` コマンドを呼び出す（サンドボックス制限の対象となる）代わりに、`git_operations` は最も一般的な Git ワークフロー -- ステータス確認、差分表示、コミット作成、プッシュ、プル、履歴表示、ブランチ管理 -- のための構造化された安全な API を提供します。

このツールはワークスペースリポジトリ（通常はエージェントが作業しているプロジェクトディレクトリ）で動作します。`all_tools()` レジストリに登録されており、エージェントがフルツールセットで実行されている場合は常に利用可能です。

Git をシェルコマンドではなくファーストクラスのツールとして提供することで、PRX はきめ細かいセキュリティポリシーの適用、引数の検証、LLM が確実にパースできる構造化出力の生成が可能になります。

## 設定

`git_operations` ツールには専用の設定セクションがありません。その動作はワークスペースパスとセキュリティポリシーによって制御されます:

```toml
# git 操作のツールポリシー
[security.tool_policy.tools]
git_operations = "allow"    # "allow" | "deny" | "supervised"
```

ワークスペースリポジトリはエージェントセッションのカレントワーキングディレクトリによって決定されます。エージェントが Git リポジトリ内から起動された場合、そのリポジトリが使用されます。そうでない場合、ツールはリポジトリが見つからないことを示すエラーを返します。

## 使用方法

`git_operations` ツールは実行する Git アクションを指定する `operation` パラメーターを受け取ります:

### status

現在のリポジトリの状態（ステージ済み、未ステージ、追跡されていないファイル）を確認:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "status"
  }
}
```

構造化出力として以下を返します:
- 現在のブランチ名
- コミット用にステージされたファイル
- 変更済みだが未ステージのファイル
- 追跡されていないファイル
- アップストリームトラッキング状態

### diff

ワーキングツリーの変更またはコミット間の差分を表示:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "diff"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "diff",
    "args": ["--staged"]
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "diff",
    "args": ["HEAD~3..HEAD"]
  }
}
```

### commit

メッセージ付きでコミットを作成:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "commit",
    "message": "fix: resolve race condition in session cleanup"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "commit",
    "message": "feat: add web search provider selection",
    "args": ["--all"]
  }
}
```

### push

リモートリポジトリにコミットをプッシュ:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "push"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "push",
    "args": ["origin", "feature/web-search"]
  }
}
```

### pull

リモートリポジトリから変更をプル:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "pull"
  }
}
```

### log

コミット履歴を表示:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "log",
    "args": ["--oneline", "-20"]
  }
}
```

### branch

ブランチの一覧表示、作成、または切り替え:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "branch"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "branch",
    "args": ["feature/new-tool"]
  }
}
```

## パラメーター

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `operation` | `string` | はい | -- | Git 操作: `"status"`、`"diff"`、`"commit"`、`"push"`、`"pull"`、`"log"`、`"branch"` |
| `message` | `string` | 条件付き | -- | コミットメッセージ（`"commit"` 操作で必須） |
| `args` | `array` | いいえ | `[]` | Git コマンドに渡される追加引数 |

**戻り値:**

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `success` | `bool` | Git 操作が正常に完了した場合 `true` |
| `output` | `string` | Git コマンド出力（ステータステキスト、diff 内容、ログエントリなど） |
| `error` | `string?` | 操作が失敗した場合のエラーメッセージ |

## 一般的なワークフロー

### フィーチャーブランチワークフロー

典型的なエージェント駆動のフィーチャーブランチワークフロー:

```
1. [git_operations] operation="branch", args=["feature/add-search"]
2. [file_write] 新しいファイルを書き込み
3. [git_operations] operation="status"  -- 変更を確認
4. [git_operations] operation="diff"    -- 変更をレビュー
5. [git_operations] operation="commit", message="feat: add search functionality", args=["--all"]
6. [git_operations] operation="push", args=["-u", "origin", "feature/add-search"]
```

### コードレビュー準備

コミット前に変更を検査:

```
1. [git_operations] operation="status"
2. [git_operations] operation="diff", args=["--staged"]
3. [git_operations] operation="log", args=["--oneline", "-5"]
4. エージェントが diff をレビューして改善を提案
```

### コンフリクト解消

マージコンフリクトの確認と解消:

```
1. [git_operations] operation="pull"
2. コンフリクトがある場合: [git_operations] operation="status"
3. [file_read] コンフリクトのあるファイルを読み取り
4. [file_write] コンフリクトを解消
5. [git_operations] operation="commit", message="merge: resolve conflicts in config.toml"
```

## セキュリティ

### シェルとの比較

`shell` ツールで `git` を実行する代わりに `git_operations` を使用することで、いくつかのセキュリティ上の利点があります:

- **引数の検証**: パラメーターが実行前に検証され、インジェクション攻撃を防止
- **構造化出力**: 結果がパースされ、予測可能な形式で返される
- **シェル展開なし**: 引数はシェル解釈なしで直接 Git に渡される
- **きめ細かいポリシー**: `shell` が拒否または supervised でも `git_operations` を許可可能

### 破壊的操作の保護

ツールには一般的な破壊的操作に対するセーフガードが含まれています:

- **フォースプッシュ**: `--force` と `--force-with-lease` 引数は警告付きでログに記録
- **ブランチ削除**: `-D`（強制削除）操作は監査ログでフラグ付け
- **リセット操作**: ハードリセットはツールを通じて直接公開されていない

最大限の安全性のために、`git_operations` を supervised としてマーク:

```toml
[security.tool_policy.tools]
git_operations = "supervised"
```

### 資格情報の処理

`git_operations` ツールはシステムの Git 資格情報ストレージ（クレデンシャルヘルパー、SSH 鍵など）を使用します。資格情報を公開したりログに記録したりすることはありません。リモート操作（push、pull）はホスト上の事前設定された Git 資格情報に依存します。

### 監査ログ

有効な場合、すべての Git 操作が監査ログに記録されます:

- 操作タイプ（status、commit、push など）
- 引数
- 成功/失敗ステータス
- コミット SHA（コミット操作の場合）

## 関連

- [シェル実行](/ja/prx/tools/shell) -- 高度な Git コマンドの代替
- [ファイル操作](/ja/prx/tools/file-operations) -- リポジトリ内のファイル読み書き
- [セッションとエージェント](/ja/prx/tools/sessions) -- 専門エージェントへの Git タスクの委任
- [ポリシーエンジン](/ja/prx/security/policy-engine) -- Git 操作のアクセス制御
- [ツール概要](/ja/prx/tools/) -- 全ツールとレジストリシステム
