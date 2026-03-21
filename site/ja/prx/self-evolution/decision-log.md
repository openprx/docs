---
title: 決定ログ
description: 自己進化サイクル中の決定ログ -- 記録内容、形式、分析、ロールバック追跡
---

# 決定ログ

自己進化サイクル中に下されたすべての決定は、構造化された決定ログに記録されます。このログは、進化システムが何を決定し、なぜ決定し、結果として何が起こったかの完全な監査証跡を提供し、事後分析、デバッグ、安全なロールバックを可能にします。

## 概要

決定ログは進化決定の完全なライフサイクルをキャプチャします:

- **提案生成** -- どのような改善が提案され、なぜか
- **評価** -- 安全性とフィットネス基準に対して提案がどのようにスコアリングされたか
- **判定** -- 提案が承認、却下、または延期されたか
- **実行** -- どのような変更が適用され、その直接的な効果
- **結果** -- 変更後の測定結果（リグレッションを含む）

セキュリティ監査ログ（すべてのセキュリティイベントを記録）とは異なり、決定ログは自己進化システムの推論プロセスに特化しています。

## 決定レコード構造

各決定は構造化レコードとして保存されます:

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `decision_id` | `String` | 一意識別子（UUIDv7、時間順） |
| `cycle_id` | `String` | この決定を生成した進化サイクル |
| `layer` | `Layer` | 進化レイヤー: `L1`（メモリ）、`L2`（プロンプト）、または `L3`（戦略） |
| `timestamp` | `DateTime<Utc>` | 決定が記録された日時 |
| `proposal` | `Proposal` | 提案された変更（タイプ、説明、パラメーター） |
| `rationale` | `String` | この変更が提案された理由の説明 |
| `data_points` | `usize` | 決定に使用されたデータサンプル数 |
| `fitness_before` | `f64` | 変更前のフィットネススコア |
| `fitness_after` | `Option<f64>` | 変更後のフィットネススコア（実行後に入力） |
| `verdict` | `Verdict` | `approved`、`rejected`、`deferred`、または `auto_approved` |
| `verdict_reason` | `String` | 判定に至った理由（例: 安全性チェック結果） |
| `executed` | `bool` | 変更が実際に適用されたか |
| `rollback_id` | `Option<String>` | ロールバックスナップショットへの参照（作成された場合） |
| `outcome` | `Option<Outcome>` | 実行後の結果: `improved`、`neutral`、`regressed`、または `rolled_back` |

### 判定タイプ

| 判定 | 説明 | トリガー |
|---------|-------------|---------|
| `auto_approved` | パイプラインにより自動承認 | リスクスコアがしきい値以下の L1 変更 |
| `approved` | 評価後に承認 | 安全性チェックに合格した L2/L3 変更 |
| `rejected` | 安全性パイプラインにより却下 | サニティチェック失敗、リスクが高すぎる、または競合検出 |
| `deferred` | 後の評価のために延期 | データ不足またはシステム健全性の懸念 |

## 設定

```toml
[self_evolution.decision_log]
enabled = true
storage = "file"                # "file" または "database"
path = "~/.local/share/openprx/decisions/"
format = "jsonl"                # "jsonl" または "json"（整形表示）
retention_days = 180            # 180 日以上古いエントリを自動削除
max_entries = 10000             # ローテーション前の最大エントリ数

[self_evolution.decision_log.database]
backend = "sqlite"
path = "~/.local/share/openprx/decisions.db"
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | 決定ログの有効/無効化 |
| `storage` | `String` | `"file"` | ストレージバックエンド: `"file"` または `"database"` |
| `path` | `String` | `"~/.local/share/openprx/decisions/"` | ログファイルのディレクトリ（ファイルモード） |
| `format` | `String` | `"jsonl"` | ファイル形式: `"jsonl"`（コンパクト）または `"json"`（人間可読） |
| `retention_days` | `u64` | `180` | N 日以上古いエントリを自動削除。0 = 永久保持 |
| `max_entries` | `usize` | `10000` | ローテーション前のファイルあたり最大エントリ数 |
| `database.backend` | `String` | `"sqlite"` | データベースバックエンド: `"sqlite"` または `"postgres"` |
| `database.path` | `String` | `""` | データベースパス（SQLite）または接続 URL（PostgreSQL） |

## 決定レコードの例

```json
{
  "decision_id": "019520b0-5678-7000-8000-000000000042",
  "cycle_id": "cycle_2026-03-21T03:00:00Z",
  "layer": "L2",
  "timestamp": "2026-03-21T03:05:12.345Z",
  "proposal": {
    "type": "prompt_refinement",
    "description": "Shorten system prompt preamble by 15% to reduce token usage",
    "parameters": {
      "target": "system_prompt.preamble",
      "old_token_count": 320,
      "new_token_count": 272
    }
  },
  "rationale": "Analysis of 500 sessions shows the preamble consumes 8% of context window with low recall contribution. A/B test variant with shortened preamble showed 3% improvement in response relevance.",
  "data_points": 500,
  "fitness_before": 0.72,
  "fitness_after": 0.75,
  "verdict": "approved",
  "verdict_reason": "Passed all safety checks. Risk score 0.12 (threshold: 0.5). No conflicts with existing policies.",
  "executed": true,
  "rollback_id": "snap_019520b0-5678-7000-8000-000000000043",
  "outcome": "improved"
}
```

## 決定ログのクエリ

### CLI コマンド

```bash
# 最近の決定を表示
prx evolution decisions --tail 20

# レイヤーでフィルタ
prx evolution decisions --layer L2 --last 30d

# 判定でフィルタ
prx evolution decisions --verdict rejected --last 7d

# 結果でフィルタ
prx evolution decisions --outcome regressed

# 特定の決定の全詳細を表示
prx evolution decisions --id 019520b0-5678-7000-8000-000000000042

# 分析用に決定をエクスポート
prx evolution decisions --last 90d --format json > decisions_q1.json
```

### プログラマティックアクセス

決定ログはゲートウェイ API 経由でアクセスできます:

```bash
# 最近の決定を一覧表示
curl -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/evolution/decisions?limit=20

# 特定の決定を取得
curl -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/evolution/decisions/019520b0-5678-7000-8000-000000000042
```

## 決定パターンの分析

### レイヤー別承認率

各レイヤーで提案の何パーセントが承認されているかを追跡し、進化システムの有効性を理解します:

```bash
prx evolution stats --last 90d
```

出力例:

```
Layer   Proposed  Approved  Rejected  Deferred  Approval Rate
L1      142       138       2         2         97.2%
L2      28        19        6         3         67.9%
L3      5         2         3         0         40.0%
```

### リグレッション検出

リグレッションにつながった決定を特定:

```bash
prx evolution decisions --outcome regressed --last 90d
```

リグレッションした各決定には `fitness_before` と `fitness_after` の値が含まれており、影響の測定と変更との相関が容易です。

### ロールバック追跡

決定がロールバックされると、ログは以下を記録します:

1. `outcome = "rolled_back"` の元の決定
2. ロールバックアクション自体の新しい決定レコード
3. 復元されたスナップショットにリンクする `rollback_id`

このチェーンにより、提案、実行、リグレッション検出、ロールバックの完全なライフサイクルを追跡できます。

## 決定ログからのロールバック

特定の決定を手動でロールバックするには:

```bash
# 決定とそのロールバックスナップショットを表示
prx evolution decisions --id <decision_id>

# スナップショットを復元
prx evolution rollback --snapshot <rollback_id>
```

ロールバック操作は手動介入を文書化する新しい決定レコードを作成します。

## 安全性システムとの統合

決定ログは安全性パイプラインと統合しています:

- **実行前** -- 安全性パイプラインが過去の決定を読み取ってパターンを検出（例: 同じ領域での繰り返し失敗）
- **実行後** -- リグレッションシグナルが自動ロールバックをトリガーし、ログに記録
- **レート制限** -- パイプラインがログを確認して時間ウィンドウあたりの最大変更数を強制

## 制限事項

- 決定ログは PRX インスタンスにローカル。マルチノードデプロイメントでは外部ログ集約が必要
- ファイルバックエンドはインデックス付きクエリをサポートしない。大規模分析にはデータベースバックエンドを使用
- フィットネススコアは観測ウィンドウの完了後にのみ入力される（レイヤーごとに設定可能）
- 延期された決定は、延期条件が再評価されない場合、永久に解決されない可能性がある

## 関連ページ

- [自己進化概要](./)
- [進化パイプライン](./pipeline) -- 決定を生成する 4 ステージパイプライン
- [実験とフィットネス](./experiments) -- A/B テストとフィットネススコアリング
- [安全性とロールバック](./safety) -- 安全性チェックと自動ロールバック
