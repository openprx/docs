---
title: Prometheus メトリクス
description: PRX の Prometheus メトリクスエンドポイントと利用可能なメトリクス
---

# Prometheus メトリクス

PRX は Grafana、Datadog、AlertManager などのモニタリングシステムとの統合のために Prometheus 互換のメトリクスエンドポイントを公開します。

## エンドポイント

有効化されると、メトリクスは以下で利用可能です:

```
http://127.0.0.1:9090/metrics
```

## 利用可能なメトリクス

### エージェントメトリクス

| メトリクス | タイプ | 説明 |
|--------|------|-------------|
| `prx_sessions_total` | Counter | 作成されたセッションの総数 |
| `prx_sessions_active` | Gauge | 現在アクティブなセッション数 |
| `prx_session_duration_seconds` | Histogram | セッション時間 |
| `prx_turns_total` | Counter | 会話ターンの総数 |
| `prx_tool_calls_total` | Counter | ツール呼び出しの総数（ツール名別） |

### LLM プロバイダーメトリクス

| メトリクス | タイプ | 説明 |
|--------|------|-------------|
| `prx_llm_requests_total` | Counter | LLM リクエストの総数（プロバイダー、モデル別） |
| `prx_llm_request_duration_seconds` | Histogram | LLM リクエストレイテンシ |
| `prx_llm_tokens_total` | Counter | トークンの総数（入力/出力、モデル別） |
| `prx_llm_errors_total` | Counter | LLM エラー数（タイプ別） |
| `prx_llm_cost_dollars` | Counter | 推定コスト（USD） |

### システムメトリクス

| メトリクス | タイプ | 説明 |
|--------|------|-------------|
| `prx_memory_usage_bytes` | Gauge | プロセスメモリ使用量 |
| `prx_cpu_usage_ratio` | Gauge | プロセス CPU 使用率 |

## 設定

```toml
[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"
path = "/metrics"
```

## 関連ページ

- [可観測性概要](./)
- [OpenTelemetry トレーシング](./opentelemetry)
