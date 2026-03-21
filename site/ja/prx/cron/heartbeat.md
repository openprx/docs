---
title: ハートビート
description: PRX cron システムにおける定期的なヘルスチェックとステータスレポート
---

# ハートビート

ハートビートは PRX デーモンの稼働状態を監視する定期的なヘルスチェックです。設定可能な間隔（デフォルト: 30 秒）で実行され、システムヘルスを報告します。

## チェック内容

- **デーモンプロセス** -- デーモンが応答可能か
- **プロバイダー接続性** -- 設定された LLM プロバイダーに到達可能か
- **メモリ使用量** -- メモリ消費が制限内か
- **ディスク容量** -- データ保存に十分なディスク容量があるか
- **アクティブセッション** -- 実行中のエージェントセッションの数とステータス

## ヘルスステータス

ハートビートは以下を通じてステータスを公開します:

- デバッグレベルのログエントリ
- `/health` API エンドポイント
- Prometheus メトリクス（有効時）
- オプションの外部ヘルスチェック URL

## 設定

```toml
[cron.heartbeat]
interval_secs = 30
check_providers = true
check_disk_space = true
disk_space_threshold_mb = 100
external_health_url = ""  # optional: POST status to external URL
```

## 関連ページ

- [cron システム概要](./)
- [可観測性](/ja/prx/observability/)
- [Prometheus メトリクス](/ja/prx/observability/prometheus)
