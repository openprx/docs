---
title: prx evolution
description: PRX の自己進化エンジンの監視と制御。
---

# prx evolution

自己進化エンジンの確認と制御を行います。PRX は 3 つのレベルの自律進化をサポートしています：L1（メモリ）、L2（プロンプト）、L3（戦略）。このコマンドにより、進化のステータス確認、履歴の確認、設定の更新、手動の進化サイクルのトリガーが可能です。

## 使い方

```bash
prx evolution <SUBCOMMAND> [OPTIONS]
```

## サブコマンド

### `prx evolution status`

進化エンジンの現在の状態を表示します。

```bash
prx evolution status [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--json` | `-j` | `false` | JSON で出力 |

**出力例：**

```
 Evolution Engine Status
 ───────────────────────
 Engine:    running
 L1 Memory:    enabled   (last: 2h ago, next: in 4h)
 L2 Prompt:    enabled   (last: 1d ago, next: in 23h)
 L3 Strategy:  disabled
 Total cycles: 142
 Rollbacks:    3
```

### `prx evolution history`

進化の履歴ログを表示します。

```bash
prx evolution history [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--limit` | `-n` | `20` | 表示するエントリ数 |
| `--level` | `-l` | すべて | レベルでフィルタ: `l1`, `l2`, `l3` |
| `--json` | `-j` | `false` | JSON で出力 |

```bash
# 最新の L2 進化 10 件を表示
prx evolution history --limit 10 --level l2
```

**出力例：**

```
 Time                Level  Action                          Status
 2026-03-21 08:00    L1     memory consolidation            success
 2026-03-20 20:00    L1     memory consolidation            success
 2026-03-20 09:00    L2     prompt refinement (system)      success
 2026-03-19 14:22    L2     prompt refinement (tool-use)    rolled back
```

### `prx evolution config`

進化の設定を表示または更新します。

```bash
prx evolution config [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--set` | | | 設定値を設定（例: `--set l1.enabled=true`） |
| `--json` | `-j` | `false` | JSON で出力 |

```bash
# 現在の設定を表示
prx evolution config

# L3 戦略進化を有効化
prx evolution config --set l3.enabled=true

# L1 の間隔を 2 時間に設定
prx evolution config --set l1.interval=7200
```

### `prx evolution trigger`

進化サイクルを手動でトリガーします。

```bash
prx evolution trigger [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--level` | `-l` | `l1` | トリガーする進化レベル: `l1`, `l2`, `l3` |
| `--dry-run` | | `false` | 変更を適用せずに進化をプレビュー |

```bash
# L1 メモリ進化をトリガー
prx evolution trigger --level l1

# L2 プロンプト進化をプレビュー
prx evolution trigger --level l2 --dry-run
```

## 進化レベル

| レベル | 対象 | 説明 |
|-------|--------|-------------|
| **L1** | メモリ | メモリエントリの統合、重複除去、整理 |
| **L2** | プロンプト | インタラクションパターンに基づくシステムプロンプトとツール使用指示の洗練 |
| **L3** | 戦略 | 高レベルの行動戦略の適応（明示的なオプトインが必要） |

すべての進化変更は元に戻せます。エンジンはロールバック履歴を保持し、パフォーマンスが低下した変更を自動的に元に戻します。

## 関連ドキュメント

- [自己進化の概要](/ja/prx/self-evolution/) -- アーキテクチャとコンセプト
- [L1: メモリ進化](/ja/prx/self-evolution/l1-memory) -- メモリ統合の詳細
- [L2: プロンプト進化](/ja/prx/self-evolution/l2-prompt) -- プロンプト洗練パイプライン
- [L3: 戦略進化](/ja/prx/self-evolution/l3-strategy) -- 戦略適応
- [進化の安全性](/ja/prx/self-evolution/safety) -- ロールバックと安全メカニズム
