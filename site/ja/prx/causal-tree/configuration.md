---
title: CTE 設定リファレンス
description: PRX 因果ツリーエンジンの完全な設定リファレンス。
---

# CTE 設定リファレンス

因果ツリーエンジンは PRX 設定ファイルの `[causal_tree]` セクションで設定します。

> **CTE はデフォルトで無効です。** 以下のパラメータは `causal_tree.enabled = true` の場合のみ有効になります。

## 完全な設定例

```toml
[causal_tree]
enabled = true

w_confidence = 0.50
w_cost = 0.25
w_latency = 0.25

write_decision_log = true
write_metrics = true

[causal_tree.policy]
max_branches = 3
commit_threshold = 0.62
extra_token_ratio_limit = 0.35
extra_latency_budget_ms = 300
rehearsal_timeout_ms = 5000
default_side_effect_mode = "read_only"
circuit_breaker_threshold = 5
circuit_breaker_cooldown_secs = 60
```

## パラメータリファレンス

### トップレベルパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `enabled` | bool | `false` | マスタースイッチ。`false` の場合、CTE は完全にバイパスされます。 |
| `w_confidence` | f32 | `0.50` | 信頼度次元のスコアリング重み。 |
| `w_cost` | f32 | `0.25` | コストペナルティのスコアリング重み。 |
| `w_latency` | f32 | `0.25` | レイテンシペナルティのスコアリング重み。 |
| `write_decision_log` | bool | `true` | 有効時、各 CTE 決定の構造化ログを出力。 |
| `write_metrics` | bool | `true` | 有効時、CTE パフォーマンスメトリクスを収集。 |

### ポリシーパラメータ (`[causal_tree.policy]`)

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `max_branches` | usize | `3` | リクエストあたりの最大候補ブランチ数。 |
| `commit_threshold` | f32 | `0.62` | ブランチをコミットするための最小複合スコア。 |
| `extra_token_ratio_limit` | f32 | `0.35` | ベースラインリクエストに対する CTE オーバーヘッドの最大トークン比率。 |
| `extra_latency_budget_ms` | u64 | `300` | CTE パイプラインの最大追加レイテンシ（ミリ秒）。 |
| `rehearsal_timeout_ms` | u64 | `5000` | 単一リハーサルのタイムアウト（ミリ秒）。 |
| `default_side_effect_mode` | string | `"read_only"` | リハーサルの副作用モード。`"read_only"` / `"dry_run"` / `"live"`。 |
| `circuit_breaker_threshold` | u32 | `5` | サーキットブレーカーがトリップするまでの連続失敗回数。 |
| `circuit_breaker_cooldown_secs` | u64 | `60` | サーキットブレーカーのクールダウン期間（秒）。 |

## 最小設定

```toml
[causal_tree]
enabled = true
```

## 関連ページ

- [因果ツリーエンジン概要](./)
- [完全な設定リファレンス](/ja/prx/config/reference)
