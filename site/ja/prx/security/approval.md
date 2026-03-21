---
title: 承認ワークフロー
description: PRX が実行前に人間の承認を必要とする監視付きツール呼び出しを処理する方法
---

# 承認ワークフロー

ツールのセキュリティポリシーが `"supervised"` に設定されている場合、PRX はツール呼び出しを実行する前に実行を一時停止し、人間の承認を待ちます。これにより、高リスクな操作 -- シェルコマンド、ファイル書き込み、ネットワークリクエスト、または不可逆的な結果をもたらす可能性のあるアクション -- に対する重要な安全レイヤーが提供されます。

## 概要

承認ワークフローはエージェントループとツール実行の間に位置します:

```
エージェントループ
    │
    ├── LLM がツール呼び出しを発行: shell("rm -rf /tmp/data")
    │
    ▼
┌───────────────────────────────────┐
│        ポリシーエンジン            │
│                                   │
│  ツール: "shell"                  │
│  ポリシー: "supervised"           │
│  アクション: 承認が必要           │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│      承認リクエスト                │
│                                   │
│  保留中...                        │
│  ├── スーパーバイザーに通知       │
│  ├── レスポンスを待機             │
│  └── N 秒後にタイムアウト        │
└───────────────┬───────────────────┘
                │
         ┌──────┴──────┐
         │             │
    ┌────▼────┐   ┌────▼────┐
    │ 承認    │   │ 拒否    │
    │         │   │         │
    │ ツール  │   │ エラーを│
    │ 実行    │   │ 返却    │
    └─────────┘   └─────────┘
```

## 設定

### ツールポリシーの設定

`config.toml` で承認が必要なツールを設定します:

```toml
[security.tool_policy]
# すべてのツールのデフォルトポリシー
# "allow" -- 即座に実行
# "deny" -- 実行を完全にブロック
# "supervised" -- 実行前に承認が必要
default = "allow"

# ツールごとのポリシー上書き
[security.tool_policy.tools]
shell = "supervised"
file_write = "supervised"
http_request = "supervised"
git_operations = "allow"
memory_store = "allow"
browser = "deny"

# グループレベルのポリシー
[security.tool_policy.groups]
sessions = "allow"
automation = "supervised"
```

### 承認設定

```toml
[security.approval]
# レスポンスを待つ時間（秒）
timeout_secs = 300

# 承認がタイムアウトした場合のアクション: "deny" または "allow"
# "deny" が安全なデフォルト -- 未回答のリクエストは拒否される
on_timeout = "deny"

# 承認リクエストの通知チャネル
notify_channel = "telegram"

# スーパーバイザーのユーザー ID
supervisor_id = "admin"

# 自動承認パターン: これらのパターンに一致するツール呼び出しは
# 人間の介入なしに自動的に承認される
[[security.approval.auto_approve]]
tool = "shell"
command_pattern = "^(ls|cat|head|tail|wc|grep|find|echo) "

[[security.approval.auto_approve]]
tool = "file_write"
path_pattern = "^/tmp/"
```

## 承認フロー

### ステップ 1: ポリシーチェック

エージェントがツール呼び出しを発行すると、ポリシーエンジンが評価します:

1. ツールごとのポリシーを確認（`security.tool_policy.tools.<name>`）
2. ツールごとのポリシーがない場合、グループポリシーを確認（`security.tool_policy.groups.<group>`）
3. グループポリシーもない場合、デフォルトポリシーを使用（`security.tool_policy.default`）

解決されたポリシーが `"supervised"` の場合、承認フローがトリガーされます。

### ステップ 2: 自動承認チェック

スーパーバイザーに通知する前に、PRX はリクエストが `auto_approve` パターンに一致するかチェックします。自動承認ルールは正規表現パターンを使用してツール引数を照合します:

| フィールド | 説明 |
|-------|-------------|
| `tool` | ルールが適用されるツール名 |
| `command_pattern` | シェルコマンドに対して照合される正規表現パターン（`shell` ツール用） |
| `path_pattern` | ファイルパスに対して照合される正規表現パターン（`file_write`、`file_read` 用） |
| `url_pattern` | URL に対して照合される正規表現パターン（`http_request` 用） |
| `args_pattern` | 完全な JSON 引数に対して照合される正規表現パターン |

一致が見つかった場合、リクエストは自動承認され、実行が即座に進行します。これは、過度な承認疲れを引き起こす安全な読み取り専用コマンドに役立ちます。

### ステップ 3: 通知

自動承認ルールが一致しない場合、PRX は承認リクエストを作成し、スーパーバイザーに通知します:

```
[APPROVAL REQUIRED]

Tool: shell
Arguments: {"command": "rm -rf /tmp/data"}
Session: abc-123
Agent: default
Time: 2026-03-21 14:30:22 UTC

Reply with:
  /approve -- ツール呼び出しを実行
  /deny -- ツール呼び出しを拒否
  /deny reason: <説明> -- 理由付きで拒否
```

通知は設定された `notify_channel` を通じて送信されます。サポートされるチャネル:

| チャネル | 通知方法 |
|---------|-------------------|
| Telegram | スーパーバイザーのチャットにメッセージ |
| Discord | スーパーバイザーに DM |
| Slack | スーパーバイザーに DM |
| CLI | ターミナルプロンプト（stdin） |
| Email | 設定されたアドレスにメール |
| Webhook | 設定された URL に HTTP POST |

### ステップ 4: 待機

エージェントループはスーパーバイザーのレスポンスを待つ間一時停止します。この間:

- エージェントはツールを実行できません（現在のツール呼び出しがブロック）
- 他のセッションは独立して動作を継続
- 承認リクエストには追跡用の一意の ID があります

### ステップ 5: 解決

スーパーバイザーは以下のいずれかで応答します:

| レスポンス | 効果 |
|----------|--------|
| **承認** | ツール呼び出しが通常通り実行され、結果がエージェントに返される |
| **拒否** | ツール呼び出しが拒否され、エラーメッセージがエージェントに返される |
| **理由付き拒否** | 拒否と同じだが、エージェントが適応できるように理由がエラーメッセージに含まれる |
| **タイムアウト** | `on_timeout` アクションが適用される（デフォルト: 拒否） |

## リクエストのライフサイクル

各承認リクエストは以下の状態を遷移します:

```
PENDING → APPROVED → EXECUTED
       → DENIED
       → TIMED_OUT
       → CANCELLED（解決前にセッションが終了した場合）
```

| 状態 | 説明 |
|-------|-------------|
| `PENDING` | スーパーバイザーのレスポンスを待機中 |
| `APPROVED` | スーパーバイザーが承認、ツール実行中 |
| `EXECUTED` | 承認後にツール実行が完了 |
| `DENIED` | スーパーバイザーがリクエストを明示的に拒否 |
| `TIMED_OUT` | `timeout_secs` 以内にレスポンスなし |
| `CANCELLED` | 解決前にセッションが終了 |

## 承認インターフェース

CLI モードでは、承認リクエストはツール名、引数、リスクレベルを含むインタラクティブなターミナルプロンプトとして表示されます。プログラマティックアクセスの場合、PRX は REST API を公開しています:

```bash
# 保留中のリクエスト一覧 / 承認 / 拒否
curl http://localhost:8080/api/approvals?status=pending
curl -X POST http://localhost:8080/api/approvals/{id}/approve
curl -X POST http://localhost:8080/api/approvals/{id}/deny \
  -d '{"reason": "Not permitted"}'
```

## 監査証跡

すべての承認決定は、以下のフィールドでアクティビティログに記録されます: `request_id`、`tool`、`arguments`、`session_id`、`decision`、`decided_by`、`decided_at`、`reason`、`execution_result`。`prx audit approvals --last 50` でアクセスするか、`--format json` でエクスポートできます。

## セキュリティに関する注意事項

- **タイムアウト時はデフォルト拒否** -- 本番環境では常に `on_timeout = "deny"` を設定してください。未回答のリクエストの進行を許可すると、監視の目的が無効になります。
- **自動承認は慎重に** -- 過度に広範な自動承認パターンは承認ワークフローをバイパスする可能性があります。具体的な正規表現パターンを使用し、定期的にレビューしてください。
- **スーパーバイザー認証** -- `notify_channel` がスーパーバイザーを認証することを確認してください。侵害された通知チャネルは不正な承認を許可する可能性があります。
- **レート制限** -- エージェントが同じ操作に対して承認リクエストを繰り返しトリガーする場合、そのツールのポリシーを `"deny"` に更新するか、より具体的な自動承認ルールを追加することを検討してください。
- **マルチスーパーバイザー** -- チームデプロイメントでは、複数のスーパーバイザーの設定を検討してください。いずれかが承認または拒否できます。

## 関連ページ

- [セキュリティ概要](/ja/prx/security/)
- [ポリシーエンジン](/ja/prx/security/policy-engine)
- [サンドボックス](/ja/prx/security/sandbox)
- [監査ログ](/ja/prx/security/audit)
- [ツール概要](/ja/prx/tools/)
