---
title: OpenTelemetry
description: PRX におけるスパンレベル分析のための OpenTelemetry 分散トレーシング
---

# OpenTelemetry

PRX は分散トレーシングのために OpenTelemetry（OTLP）をサポートします。トレースは LLM 呼び出し、ツール実行、メモリ操作を含むエージェント操作のスパンレベルの可視性を提供します。

## 概要

各エージェント操作はネストされたスパンを持つトレースを作成します:

```
Session
  └── Turn
       ├── Memory Recall (span)
       ├── LLM Request (span)
       │    ├── Token Streaming
       │    └── Response Parsing
       └── Tool Execution (span)
            ├── Policy Check
            └── Sandbox Run
```

## 設定

```toml
[observability.tracing]
enabled = false
endpoint = "http://localhost:4317"  # OTLP gRPC endpoint
protocol = "grpc"  # "grpc" | "http"
service_name = "prx"
sample_rate = 1.0  # 0.0 to 1.0
```

## サポートされるバックエンド

PRX は任意の OTLP 互換バックエンドにトレースをエクスポートできます:

- Jaeger
- Grafana Tempo
- Honeycomb
- Datadog
- AWS X-Ray（OTLP コレクター経由）

## スパン属性

スパンに付加される一般的な属性:

| 属性 | 説明 |
|-----------|-------------|
| `prx.session_id` | エージェントセッション識別子 |
| `prx.provider` | LLM プロバイダー名 |
| `prx.model` | モデル識別子 |
| `prx.tool` | ツール名（ツールスパンの場合） |
| `prx.tokens.input` | 入力トークン数 |
| `prx.tokens.output` | 出力トークン数 |

## 関連ページ

- [可観測性概要](./)
- [Prometheus メトリクス](./prometheus)
