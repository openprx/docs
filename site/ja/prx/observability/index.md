---
title: 可観測性
description: メトリクス、トレーシング、ログを含む PRX の可観測性機能の概要
---

# 可観測性

PRX はメトリクス、分散トレーシング、構造化ログを通じた包括的な可観測性を提供します。これらの機能により、エージェント操作の監視、デバッグ、パフォーマンス最適化が可能になります。

## 概要

| 機能 | バックエンド | 目的 |
|---------|---------|---------|
| [Prometheus メトリクス](./prometheus) | Prometheus | 定量的モニタリング（リクエストレート、レイテンシ、エラー） |
| [OpenTelemetry](./opentelemetry) | OTLP 互換 | 分散トレーシングとスパンレベルの分析 |
| 構造化ログ | stdout/ファイル | 詳細な操作ログ |

## クイックスタート

`config.toml` で可観測性を有効化:

```toml
[observability]
log_level = "info"
log_format = "json"  # "json" | "pretty"

[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"

[observability.tracing]
enabled = false
endpoint = "http://localhost:4317"
```

## 主要メトリクス

PRX は以下のメトリクスを公開します:

- **エージェントパフォーマンス** -- セッション時間、セッションあたりのターン数、ツール呼び出し
- **LLM プロバイダー** -- リクエストレイテンシ、トークン使用量、エラーレート、コスト
- **メモリ** -- リコールレイテンシ、ストアサイズ、コンパクション頻度
- **システム** -- CPU 使用率、メモリ消費量、アクティブ接続数

## 関連ページ

- [Prometheus メトリクス](./prometheus)
- [OpenTelemetry トレーシング](./opentelemetry)
- [ハートビート](/ja/prx/cron/heartbeat)
