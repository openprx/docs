---
title: cron タスク
description: PRX cron システムの組み込みスケジュールタスクリファレンス
---

# 組み込みタスク

PRX にはルーチンメンテナンスを処理するいくつかの組み込み cron タスクが含まれています。これらのタスクは cron システムが有効な場合に自動的に実行されます。

## タスクリファレンス

| タスク | デフォルトスケジュール | 説明 |
|------|-----------------|-------------|
| `heartbeat` | 30 秒ごと | システムヘルスチェック |
| `memory-hygiene` | 毎日 3:00 | メモリエントリの圧縮と剪定 |
| `log-rotation` | 毎日 0:00 | 古いログファイルのローテーションと圧縮 |
| `cache-cleanup` | 毎時 | 期限切れキャッシュエントリの削除 |
| `metrics-export` | 5 分ごと | 設定されたバックエンドへのメトリクスエクスポート |
| `signature-update` | 6 時間ごと | 脅威シグネチャの更新（PRX-SD 統合が有効な場合） |

## 設定

各組み込みタスクは個別に有効/無効化およびスケジュール変更が可能です:

```toml
[cron.builtin.memory_hygiene]
enabled = true
schedule = "0 3 * * *"

[cron.builtin.log_rotation]
enabled = true
schedule = "0 0 * * *"
max_log_age_days = 30

[cron.builtin.cache_cleanup]
enabled = true
schedule = "0 * * * *"
```

## カスタムタスク

組み込みタスクに加えて、スケジュールに従ってプロンプトを実行するカスタムエージェントタスクを定義できます:

```toml
[[cron.tasks]]
name = "weekly-cleanup"
schedule = "0 2 * * 0"  # 日曜日 2:00 AM
action = "agent"
prompt = "Review and archive old conversation logs"
timeout_secs = 300
```

## 関連ページ

- [cron システム概要](./)
- [ハートビート](./heartbeat)
- [メモリハイジーン](/ja/prx/memory/hygiene)
