---
title: 診断
description: PRX の問題をデバッグするための詳細な診断手順とツール
---

# 診断

このページでは、基本的なトラブルシューティング手順で解決しない PRX の問題を調査するための高度な診断手順を説明します。

## 診断コマンド

### prx doctor

包括的なヘルスチェック:

```bash
prx doctor
```

出力内容:
- 設定の検証結果
- プロバイダーの接続テスト
- システム依存関係のチェック
- リソース使用状況のサマリー

### prx debug

詳細な操作トレースのためにデバッグレベルのログを有効化:

```bash
PRX_LOG=debug prx daemon
```

または設定で指定:

```toml
[observability]
log_level = "debug"
```

### prx info

システム情報を表示:

```bash
prx info
```

表示内容:
- PRX のバージョンとビルド情報
- OS とアーキテクチャ
- 設定されたプロバイダーとそのステータス
- メモリバックエンドの種類とサイズ
- プラグインの数とステータス

## ログ分析

PRX のログは構造化 JSON です（`log_format = "json"` の場合）。注目すべきキーフィールド:

| フィールド | 説明 |
|-------|-------------|
| `level` | ログレベル（debug、info、warn、error） |
| `target` | Rust モジュールパス |
| `session_id` | 関連するセッション ID |
| `provider` | 関連する LLM プロバイダー |
| `duration_ms` | 操作の所要時間 |
| `error` | エラーの詳細（該当する場合） |

## ネットワーク診断

プロバイダーの接続テスト:

```bash
# Anthropic API のテスト
prx provider test anthropic

# 設定されたすべてのプロバイダーをテスト
prx provider test --all

# サンドボックスからのネットワークチェック
prx sandbox test-network
```

## パフォーマンスプロファイリング

メトリクスエンドポイントを有効化し、Prometheus/Grafana でパフォーマンス分析:

```toml
[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"
```

監視すべき主要メトリクス:
- `prx_llm_request_duration_seconds` -- LLM レイテンシ
- `prx_sessions_active` -- 同時セッション数
- `prx_memory_usage_bytes` -- メモリ消費量

## 関連ページ

- [トラブルシューティング概要](./)
- [可観測性](/ja/prx/observability/)
- [Prometheus メトリクス](/ja/prx/observability/prometheus)
