---
title: ファイル操作
description: file_read と file_write ツールは、パス検証、メモリ ACL 強制、セキュリティポリシー統合によるファイルシステムアクセスを提供します。
---

# ファイル操作

PRX は 2 つのコアファイル操作ツール -- `file_read` と `file_write` -- を提供しており、最小限の `default_tools()` セットの一部です。これらのツールは常に利用可能で、追加の設定を必要とせず、エージェントがローカルファイルシステムと対話するための基盤を形成します。

両ツールはセキュリティポリシーエンジンの対象です。パス検証により、エージェントは許可されたディレクトリ内のファイルにのみアクセスできます。メモリ ACL が有効な場合、`file_read` はメモリマークダウンファイルへのアクセスを追加でブロックし、エージェントがメモリストレージを直接読み取ってアクセス制御をバイパスすることを防ぎます。

`shell` ツールとは異なり、ファイル操作は外部プロセスを起動しません。PRX プロセス内の直接 Rust I/O 操作として実装されており、`cat` や `echo >` などの同等のシェルコマンドよりも高速で監査が容易です。

## 設定

ファイル操作には専用の設定セクションがありません。その動作はセキュリティポリシーエンジンとメモリ ACL 設定を通じて制御されます:

```toml
# メモリ ACL が file_read の動作に影響
[memory]
acl_enabled = false    # true の場合、file_read がメモリファイルへのアクセスをブロック

# セキュリティポリシーでファイルアクセスパスを制限
[security.tool_policy.tools]
file_read = "allow"    # "allow" | "deny" | "supervised"
file_write = "allow"

# パスベースのポリシールール
[[security.policy.rules]]
name = "allow-workspace-read"
action = "allow"
tools = ["file_read"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "allow-workspace-write"
action = "allow"
tools = ["file_write"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "block-sensitive-paths"
action = "deny"
tools = ["file_read", "file_write"]
paths = ["/etc/shadow", "/root/**", "**/.ssh/**", "**/.env"]
```

## 使用方法

### file_read

`file_read` ツールはファイルの内容を読み取り、文字列として返します。エージェントが推論ループ中にファイルを検査する主要な方法です。

```json
{
  "name": "file_read",
  "arguments": {
    "path": "/home/user/project/src/main.rs"
  }
}
```

エージェントは通常 `file_read` を以下の目的で使用します:

- 変更前にソースコードを検査
- 設定ファイルを読み取ってシステム状態を理解
- ログファイルでエラーメッセージを確認
- ドキュメントや README ファイルをレビュー

### file_write

`file_write` ツールはファイルにコンテンツを書き込みます。存在しない場合は作成し、存在する場合はコンテンツを上書きします。

```json
{
  "name": "file_write",
  "arguments": {
    "path": "/home/user/project/src/config.toml",
    "content": "[server]\nport = 8080\nhost = \"0.0.0.0\"\n"
  }
}
```

エージェントは通常 `file_write` を以下の目的で使用します:

- 新しいソースファイルや設定ファイルを作成
- 既存ファイルを変更（`file_read` で読み取った後）
- 生成されたレポートや要約を書き込み
- 処理済みデータをディスクに保存

## パラメーター

### file_read パラメーター

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `path` | `string` | はい | -- | 読み取るファイルの絶対パスまたは相対パス |

**戻り値:**

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `success` | `bool` | ファイルが正常に読み取られた場合 `true` |
| `output` | `string` | UTF-8 文字列としてのファイル内容 |
| `error` | `string?` | 読み取りに失敗した場合のエラーメッセージ（ファイルが見つからない、権限拒否、ACL ブロックなど） |

### file_write パラメーター

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `path` | `string` | はい | -- | 書き込むファイルの絶対パスまたは相対パス |
| `content` | `string` | はい | -- | ファイルに書き込む内容 |

**戻り値:**

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `success` | `bool` | ファイルが正常に書き込まれた場合 `true` |
| `output` | `string` | 確認メッセージ（例: "File written: /path/to/file"） |
| `error` | `string?` | 書き込みに失敗した場合のエラーメッセージ（権限拒否、パスブロックなど） |

## パス検証

両ツールは I/O 操作を実行する前にパス検証を行います:

1. **パス正規化** -- 相対パスはカレントワーキングディレクトリに対して解決されます。シンボリックリンクはパストラバーサルを検出するために解決されます。
2. **ポリシーチェック** -- 解決されたパスがセキュリティポリシールールに対してチェックされます。パスを明示的に許可するルールがなく、デフォルトアクションが `deny` の場合、操作はブロックされます。
3. **特殊パスブロック** -- ポリシーに関係なく、特定のパスは常にブロックされます:
   - `/proc/`、`/sys/`（Linux カーネルインターフェース）
   - `/dev/` のデバイスファイル（`/dev/null`、`/dev/urandom` を除く）
   - `memory.acl_enabled = true` の場合のメモリストレージファイル

### パストラバーサル防止

ツールはポリシーチェック前にシンボリックリンクを解決し `..` コンポーネントを正規化します。これにより、攻撃者がシンボリックリンクや相対パスのトリックを使用して許可されたディレクトリから脱出することを防ぎます:

```
# これらはすべて解決されチェックされます:
/home/user/workspace/../../../etc/passwd  →  /etc/passwd  →  拒否
/home/user/workspace/link-to-etc          →  /etc/        →  拒否（シンボリックリンクの場合）
```

## メモリ ACL 強制

設定で `memory.acl_enabled = true` の場合、`file_read` ツールは追加の制限を強制します:

- **メモリファイルブロック**: `file_read` はメモリディレクトリ（通常 `~/.local/share/openprx/memory/`）に保存されたマークダウンファイルの読み取りを拒否します。これにより、エージェントが生のストレージファイルを読み取ってメモリアクセス制御をバイパスすることを防ぎます。
- **メモリリコール無効化**: ACL が有効な場合、`memory_recall` ツールはツールレジストリから完全に削除されます。
- **ターゲットアクセスのみ**: エージェントはメモリコンテンツにアクセスするために、適切な ACL チェック付きの `memory_get` または `memory_search` を使用する必要があります。

```toml
[memory]
acl_enabled = true    # メモリパスに対する file_read 制限を有効化
```

この分離により、エージェントがメモリファイルの物理的な場所を知っていても、制御されたメモリ API 外からそれらを読み取ることができないことが保証されます。

## セキュリティ

### ポリシーエンジン統合

すべての `file_read` と `file_write` 呼び出しは実行前にセキュリティポリシーエンジンを通過します。ポリシーエンジンはルールを順番に評価します:

1. ツール別ポリシー（`security.tool_policy.tools.file_read`）
2. パスベースルール（一致する `paths` パターンを持つ `security.policy.rules`）
3. デフォルトアクション（`security.policy.default_action`）

### 監査ログ

監査ログが有効な場合、すべてのファイル操作が以下とともに記録されます:

- タイムスタンプ
- ツール名（`file_read` または `file_write`）
- 解決されたファイルパス
- 成功/失敗ステータス
- エラー理由（拒否または失敗の場合）

```toml
[security.audit]
enabled = true
log_path = "audit.log"
```

### 機密ファイル保護

デフォルトのセキュリティポリシーは一般的な機密パスへのアクセスをブロックします:

- SSH 鍵（`~/.ssh/`）
- 環境ファイル（`.env`、`.env.local`）
- Git 資格情報（`.git-credentials`）
- シェル履歴（`.bash_history`、`.zsh_history`）
- システムパスワードファイル（`/etc/shadow`）

これらのデフォルトは明示的な allow ルールで上書きできますが、本番環境ではこれを強く推奨しません。

### バイナリファイルの処理

`file_read` ツールはファイルを UTF-8 文字列として読み取ります。バイナリファイルは文字化けした出力やエンコーディングエラーを生成します。エージェントはバイナリファイルの検査には `shell` ツールと適切なコマンド（例: `xxd`、`file`、`hexdump`）を使用することが期待されます。

## 関連

- [シェル実行](/ja/prx/tools/shell) -- コマンド実行ツール（バイナリファイルの代替）
- [メモリツール](/ja/prx/tools/memory) -- ACL によるメモリアクセス制御
- [ポリシーエンジン](/ja/prx/security/policy-engine) -- パスベースのアクセス制御ルール
- [設定リファレンス](/ja/prx/config/reference) -- メモリとセキュリティ設定
- [ツール概要](/ja/prx/tools/) -- 全ツールとレジストリシステム
