---
title: コスト追跡
description: PRX のすべての LLM プロバイダーにわたるトークン使用量、API コスト、予算アラートの追跡
---

# コスト追跡

PRX には、すべての LLM プロバイダーにわたるトークン消費量と API 支出を監視する組み込みのコスト追跡システムが含まれています。`CostTracker` はリクエストごと、セッションごと、プロバイダーごとに使用量を蓄積し、エージェントが API リソースをどのように消費しているかの完全な可視性を提供します。

## 概要

PRX のすべての LLM リクエストは、入力トークン、出力トークン、関連コストを含む `TokenUsage` レコードを生成します。これらのレコードは `CostTracker` によって集計され、レポート、予算管理、異常検出のためにクエリできます。

```
LLM Request
    │
    ├── プロバイダーが使用量メタデータを返却
    │   (input_tokens, output_tokens, cache hits)
    │
    ▼
TokenUsage レコード作成
    │
    ├── CostTracker に蓄積
    │   ├── リクエストごとの内訳
    │   ├── セッションごとの合計
    │   ├── プロバイダーごとの合計
    │   └── モデルごとの合計
    │
    ├── 予算チェック（制限が設定されている場合）
    │   ├── 予算内 → 続行
    │   └── 予算超過 → 警告 / 停止
    │
    └── 可観測性パイプラインに書き込み
        (メトリクス、ログ、トレーシングスパン)
```

## 設定

`config.toml` でコスト追跡を有効化・設定:

```toml
[cost]
enabled = true

# 表示用の通貨（計算には影響しません）
currency = "USD"

# 蓄積されたコストを永続ストレージにフラッシュする間隔
flush_interval_secs = 60

# 再起動後もコストデータを保持
persist = true
persist_path = "~/.local/share/openprx/cost.db"
```

### 予算制限

コストの暴走を防ぐために支出制限を設定:

```toml
[cost.budget]
# すべてのプロバイダーにわたる日次支出制限
daily_limit = 10.00

# 月次支出制限
monthly_limit = 200.00

# セッションごとの制限（新しいセッション開始時にリセット）
session_limit = 2.00

# 制限に達した時のアクション: "warn" or "stop"
# "warn" は警告をログに記録するがリクエストの続行を許可
# "stop" は期間がリセットされるまで LLM リクエストをブロック
on_limit = "warn"
```

### プロバイダーごとの制限

特定のプロバイダーの予算制限をオーバーライド:

```toml
[cost.budget.providers.openai]
daily_limit = 5.00
monthly_limit = 100.00

[cost.budget.providers.anthropic]
daily_limit = 8.00
monthly_limit = 150.00
```

## TokenUsage 構造

各 LLM リクエストは `TokenUsage` レコードを生成します:

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `input_tokens` | u64 | プロンプトのトークン数（システム + ユーザー + コンテキスト） |
| `output_tokens` | u64 | モデルレスポンスのトークン数 |
| `cache_read_tokens` | u64 | プロバイダーキャッシュから提供されたトークン数（Anthropic プロンプトキャッシング） |
| `cache_write_tokens` | u64 | プロバイダーキャッシュに書き込まれたトークン数 |
| `total_tokens` | u64 | `input_tokens + output_tokens` |
| `cost` | f64 | 設定された通貨での推定コスト |
| `provider` | string | プロバイダー名（例: "openai"、"anthropic"） |
| `model` | string | モデル識別子（例: "gpt-4o"、"claude-sonnet-4-20250514"） |
| `timestamp` | datetime | リクエストが行われた時刻 |
| `session_id` | string | リクエストを生成したエージェントセッション |

## CostTracker

`CostTracker` はすべてのトークン使用量の中央集計ポイントです。プロバイダーごと、モデルごと、セッションごと、日次（UTC 深夜にリセット）、月次（1日にリセット）の累計を維持します。トラッカーはスレッドセーフで、すべての LLM レスポンスの後に更新されます。

## 価格データ

PRX は一般的なプロバイダーとモデルの組み込み価格テーブルを維持しています。価格は 100 万トークンあたりで定義されます:

| プロバイダー | モデル | 入力（100万あたり） | 出力（100万あたり） |
|----------|-------|----------------|-----------------|
| OpenAI | gpt-4o | $2.50 | $10.00 |
| OpenAI | gpt-4o-mini | $0.15 | $0.60 |
| OpenAI | o3 | $10.00 | $40.00 |
| Anthropic | claude-sonnet-4-20250514 | $3.00 | $15.00 |
| Anthropic | claude-haiku-35-20241022 | $0.80 | $4.00 |
| Anthropic | claude-opus-4-20250514 | $15.00 | $75.00 |
| Google | gemini-2.0-flash | $0.075 | $0.30 |
| DeepSeek | deepseek-chat | $0.14 | $0.28 |

### カスタム価格

組み込みテーブルにないモデルの価格をオーバーライドまたは追加:

```toml
[cost.pricing."openai/gpt-4o"]
input_per_million = 2.50
output_per_million = 10.00

[cost.pricing."custom/my-model"]
input_per_million = 1.00
output_per_million = 3.00
```

セルフホストモデル（Ollama、vLLM）で API 呼び出しが無料の場合、価格をゼロに設定:

```toml
[cost.pricing."ollama/llama3"]
input_per_million = 0.0
output_per_million = 0.0
```

## 使用量レポート

### CLI コマンド

```bash
# 現在のセッションのコストサマリーを表示
prx cost

# 日次内訳を表示
prx cost --period daily

# プロバイダー別の月次内訳を表示
prx cost --period monthly --group-by provider

# 特定の日付範囲のコストを表示
prx cost --from 2026-03-01 --to 2026-03-15

# CSV にエクスポート
prx cost --period monthly --format csv > costs.csv

# JSON にエクスポート（プログラムによる使用向け）
prx cost --period daily --format json
```

### 出力例

```
PRX Cost Report (2026-03-21)
════════════════════════════════════════════════════
Provider     Model                   Tokens (in/out)    Cost
─────────────────────────────────────────────────────────────
anthropic    claude-sonnet-4-20250514      45.2K / 12.8K    $0.33
openai       gpt-4o                  22.1K / 8.4K     $0.14
openai       gpt-4o-mini              8.3K / 3.1K     $0.00
─────────────────────────────────────────────────────────────
Total                                75.6K / 24.3K    $0.47

Budget Status:
  Session: $0.47 / $2.00 (23.5%)
  Daily:   $3.82 / $10.00 (38.2%)
  Monthly: $42.15 / $200.00 (21.1%)
```

## 予算アラート

コストが予算制限に近づくと、PRX は `on_limit` 設定に基づいてアクションを実行します:

| 閾値 | `on_limit = "warn"` | `on_limit = "stop"` |
|-----------|--------------------|--------------------|
| 制限の 80% | 警告をログ記録 | 警告をログ記録 |
| 制限の 100% | エラーをログ記録、続行 | LLM リクエストをブロック、ユーザーに通知 |
| 制限リセット（新しい日/月） | カウンターリセット | カウンターリセット、リクエストのブロック解除 |

予算アラートは可観測性イベントとしても出力されます。Prometheus メトリクスが有効な場合、以下のゲージがエクスポートされます:

```
prx_cost_daily_total{currency="USD"} 3.82
prx_cost_monthly_total{currency="USD"} 42.15
prx_cost_session_total{currency="USD"} 0.47
prx_cost_budget_daily_remaining{currency="USD"} 6.18
prx_cost_budget_monthly_remaining{currency="USD"} 157.85
```

## 可観測性との統合

コストデータは PRX の可観測性スタックと統合されます:

- **Prometheus** -- プロバイダー/モデルごとのトークン数とコストゲージ
- **OpenTelemetry** -- `prx.tokens.input`、`prx.tokens.output`、`prx.cost` スパン属性
- **ログ** -- リクエストごとのコストは DEBUG レベル、予算警告は WARN レベルで記録

## セキュリティノート

- コストデータは使用パターンを明かす可能性があります。マルチユーザーデプロイメントではコストレポートへのアクセスを制限してください。
- 永続コストデータベース（`cost.db`）は使用履歴を含みます。バックアップ戦略に含めてください。
- 予算制限はローカルで適用されます。プロバイダー側の支出制限とは連携しません。多層防御のため両方を設定してください。

## 関連ページ

- [可観測性概要](/ja/prx/observability/)
- [Prometheus メトリクス](/ja/prx/observability/prometheus)
- [OpenTelemetry](/ja/prx/observability/opentelemetry)
- [プロバイダー設定](/ja/prx/providers/)
