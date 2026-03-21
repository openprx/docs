---
title: 監査ログ
description: PRX のすべてのセキュリティ関連操作を追跡するセキュリティ監査ログシステム
---

# 監査ログ

PRX には、すべてのセキュリティ関連操作を記録する組み込みの監査ログシステムが含まれています。`AuditLogger` は誰が何をいつ行い、成功したかどうかを追跡し、コンプライアンス、インシデント対応、フォレンジック分析のための改ざん検知可能な証跡を提供します。

## 概要

監査システムは、すべてのセキュリティ上重要なアクションに対して構造化イベントをキャプチャします:

- 認証試行（成功と失敗）
- 認可決定（許可と拒否）
- 設定変更
- ツール実行とサンドボックスイベント
- メモリアクセスと変更
- チャネル接続と切断
- 進化提案と適用
- プラグインライフサイクルイベント

すべての監査イベントには、タイムスタンプ、アクター ID、アクション説明、対象リソース、結果が含まれます。

## 監査イベント構造

各監査イベントは以下のフィールドを持つ構造化レコードです:

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `timestamp` | `DateTime<Utc>` | イベント発生時刻（UTC、ナノ秒精度） |
| `event_id` | `String` | イベントの一意識別子（UUIDv7、時間順） |
| `actor` | `Actor` | アクションの実行者（ユーザー、エージェント、システム、またはプラグイン） |
| `action` | `String` | 実行内容（例: `auth.login`、`tool.execute`、`config.update`） |
| `target` | `String` | 操作対象リソース（例: セッション ID、設定キー、ファイルパス） |
| `outcome` | `Outcome` | 結果: `success`、`failure`、または `denied` |
| `metadata` | `Map<String, Value>` | 追加コンテキスト（IP アドレス、拒否理由など） |
| `session_id` | `Option<String>` | 関連するエージェントセッション（ある場合） |
| `severity` | `Severity` | イベント重要度: `info`、`warning`、`critical` |

### アクタータイプ

| アクタータイプ | 説明 | 例 |
|-----------|-------------|---------|
| `user` | チャネルまたは API 認証で識別される人間ユーザー | `user:telegram:123456789` |
| `agent` | PRX エージェント自体 | `agent:default` |
| `system` | 内部システムプロセス（cron、進化） | `system:evolution` |
| `plugin` | WASM プラグイン | `plugin:my-plugin:v1.2.0` |

### アクションカテゴリ

アクションはドット区切りの名前空間規則に従います:

| カテゴリ | アクション | 重要度 |
|----------|---------|----------|
| `auth.*` | `auth.login`、`auth.logout`、`auth.token_refresh`、`auth.pairing` | info / warning |
| `authz.*` | `authz.allow`、`authz.deny`、`authz.policy_check` | info / warning |
| `config.*` | `config.update`、`config.reload`、`config.hot_reload` | warning |
| `tool.*` | `tool.execute`、`tool.sandbox_escape_attempt`、`tool.timeout` | info / critical |
| `memory.*` | `memory.store`、`memory.recall`、`memory.delete`、`memory.compact` | info |
| `channel.*` | `channel.connect`、`channel.disconnect`、`channel.error` | info / warning |
| `evolution.*` | `evolution.propose`、`evolution.apply`、`evolution.rollback` | warning / critical |
| `plugin.*` | `plugin.load`、`plugin.unload`、`plugin.error`、`plugin.permission_denied` | info / warning |
| `session.*` | `session.create`、`session.terminate`、`session.timeout` | info |

## 設定

```toml
[security.audit]
enabled = true
min_severity = "info"           # ログ記録する最小重要度: "info"、"warning"、"critical"

[security.audit.file]
enabled = true
path = "~/.local/share/openprx/audit.log"
format = "jsonl"                # "jsonl" または "csv"
max_size_mb = 100               # このサイズを超えたらローテーション
max_files = 10                  # 最大 10 個のローテーションファイルを保持
compress_rotated = true         # ローテーションファイルを gzip 圧縮

[security.audit.database]
enabled = false
backend = "sqlite"              # "sqlite" または "postgres"
path = "~/.local/share/openprx/audit.db"
retention_days = 90             # 90 日以上古いイベントを自動削除
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | 監査ログをグローバルに有効/無効化 |
| `min_severity` | `String` | `"info"` | 記録する最小重要度レベル |
| `file.enabled` | `bool` | `true` | 監査イベントをログファイルに書き込み |
| `file.path` | `String` | `"~/.local/share/openprx/audit.log"` | 監査ログファイルのパス |
| `file.format` | `String` | `"jsonl"` | ログ形式: `"jsonl"`（1 行 1 JSON オブジェクト）または `"csv"` |
| `file.max_size_mb` | `u64` | `100` | ローテーション前の最大ファイルサイズ（MB） |
| `file.max_files` | `u32` | `10` | 保持するローテーションファイル数 |
| `file.compress_rotated` | `bool` | `true` | ローテーションログファイルを gzip で圧縮 |
| `database.enabled` | `bool` | `false` | 監査イベントをデータベースに書き込み |
| `database.backend` | `String` | `"sqlite"` | データベースバックエンド: `"sqlite"` または `"postgres"` |
| `database.path` | `String` | `""` | データベースパス（SQLite）または接続 URL（PostgreSQL） |
| `database.retention_days` | `u64` | `90` | N 日以上古いイベントを自動削除。0 = 永久保持 |

## ストレージバックエンド

### ファイル（JSONL）

デフォルトバックエンドはログファイルに 1 行 1 JSON オブジェクトを書き込みます。この形式は標準的なログ分析ツール（jq、grep、Elasticsearch インジェスト）と互換性があります。

ログエントリの例:

```json
{
  "timestamp": "2026-03-21T10:15:30.123456789Z",
  "event_id": "019520a8-1234-7000-8000-000000000001",
  "actor": {"type": "user", "id": "user:telegram:123456789"},
  "action": "tool.execute",
  "target": "shell:ls -la /tmp",
  "outcome": "success",
  "metadata": {"sandbox": "bubblewrap", "duration_ms": 45},
  "session_id": "sess_abc123",
  "severity": "info"
}
```

### データベース（SQLite / PostgreSQL）

データベースバックエンドはイベントを構造化テーブルに保存し、効率的なクエリのために `timestamp`、`actor`、`action`、`severity` にインデックスを作成します。

## 監査証跡のクエリ

### CLI クエリ

```bash
# 最近の監査イベントを表示
prx audit log --tail 50

# アクションカテゴリでフィルタ
prx audit log --action "auth.*" --last 24h

# 重要度でフィルタ
prx audit log --severity critical --last 7d

# アクターでフィルタ
prx audit log --actor "user:telegram:123456789"

# JSON にエクスポート
prx audit log --last 30d --format json > audit_export.json
```

### データベースクエリ

データベースバックエンドを使用する場合、SQL で直接クエリできます:

```sql
-- 過去 24 時間の認証失敗試行
SELECT * FROM audit_events
WHERE action LIKE 'auth.%'
  AND outcome = 'failure'
  AND timestamp > datetime('now', '-24 hours')
ORDER BY timestamp DESC;

-- 特定ユーザーのツール実行
SELECT action, target, outcome, timestamp
FROM audit_events
WHERE actor_id = 'user:telegram:123456789'
  AND action LIKE 'tool.%'
ORDER BY timestamp DESC
LIMIT 100;

-- クリティカルイベントのサマリー
SELECT action, COUNT(*) as count
FROM audit_events
WHERE severity = 'critical'
  AND timestamp > datetime('now', '-7 days')
GROUP BY action
ORDER BY count DESC;
```

## コンプライアンス

監査ログシステムはコンプライアンス要件をサポートするよう設計されています:

- **不変性** -- ログファイルは追加専用。ローテーションファイルはチェックサムで整合性検証可能
- **完全性** -- すべてのセキュリティ関連操作がデフォルトで `info` レベルでログ記録
- **保持** -- 自動ローテーションと削除による設定可能な保持期間
- **否認不可** -- すべてのイベントにアクター ID とタイムスタンプが含まれる
- **可用性** -- デュアル出力（ファイル + データベース）により、一方のバックエンドが失敗してもイベントが失われない

### コンプライアンス推奨設定

```toml
[security.audit]
enabled = true
min_severity = "info"

[security.audit.file]
enabled = true
format = "jsonl"
max_size_mb = 500
max_files = 50
compress_rotated = true

[security.audit.database]
enabled = true
backend = "postgres"
path = "postgresql://audit_user:password@localhost/prx_audit"
retention_days = 365
```

## パフォーマンス

監査ロガーは最小限のオーバーヘッドで設計されています:

- イベントはバウンドチャネル経由で非同期に書き込まれます（デフォルト容量: 10,000 イベント）
- ファイル書き込みはバッファリングされ、定期的にフラッシュされます（1 秒ごとまたは 100 イベントごと）
- データベース書き込みはバッチ処理されます（デフォルトバッチサイズ: 50 イベント）
- イベントチャネルが満杯の場合、イベントは警告カウンター付きでドロップされます（メインエージェントループをブロックしません）

## 制限事項

- ファイルバックエンドは組み込みの改ざん検出を提供しません（高セキュリティデプロイメントでは外部整合性監視を検討）
- プラグインコードからの監査イベントはホストによってログ記録されます。プラグインは監査システムをバイパスできません
- CSV 形式はネストされたメタデータフィールドをサポートしません（完全な忠実性には JSONL を使用）
- データベース保持クリーンアップは 1 時間に 1 回実行されます。設定された保持期間をわずかに超えてイベントが存続する場合があります

## 関連ページ

- [セキュリティ概要](./)
- [ポリシーエンジン](./policy-engine) -- 監査イベントを生成する認可決定
- [サンドボックス](./sandbox) -- ツール実行の分離
- [脅威モデル](./threat-model) -- セキュリティアーキテクチャと信頼境界
