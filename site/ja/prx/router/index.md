---
title: LLM ルーター
description: モデル選択、コスト最適化、品質バランシングのための PRX インテリジェント LLM ルーターの概要
---

# LLM ルーター

PRX ルーターは、各リクエストに対して最適な LLM プロバイダーとモデルを自動的に選択するインテリジェントなモデル選択システムです。複数のルーティング戦略を使用して、品質、コスト、レイテンシのバランスを取ります。

## 概要

常に単一のモデルを使用する代わりに、ルーターは以下に基づいて設定されたモデルから動的に選択します:

- クエリの複雑さとタイプ
- モデルの機能スコアと Elo レーティング
- コスト制約
- レイテンシ要件
- 履歴パフォーマンスデータ

## ルーティング戦略

| 戦略 | 説明 | 最適な用途 |
|----------|-------------|---------|
| [ヒューリスティック](./heuristic) | クエリ特徴を使用したルールベースのスコアリング | シンプルなセットアップ、予測可能な動作 |
| [KNN](./knn) | 過去の成功クエリとのセマンティック類似度 | 学習型ルーティング、高精度 |
| [Automix](./automix) | 安価に開始し、信頼度が低い場合にエスカレーション | コスト最適化 |

## 設定

```toml
[router]
enabled = true
strategy = "heuristic"  # "heuristic" | "knn" | "automix"
default_model = "anthropic/claude-sonnet-4-6"

[router.models]
cheap = "anthropic/claude-haiku"
standard = "anthropic/claude-sonnet-4-6"
premium = "anthropic/claude-opus-4-6"
```

## 関連ページ

- [ヒューリスティックルーター](./heuristic)
- [KNN ルーター](./knn)
- [Automix ルーター](./automix)
- [LLM プロバイダー](/ja/prx/providers/)
