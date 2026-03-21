---
title: セキュリティ
description: ポリシーエンジン、サンドボックス、シークレット管理、脅威モデルを含む PRX セキュリティモデルの概要
---

# セキュリティ

セキュリティは PRX の基盤的な関心事です。自律エージェントフレームワークとして、PRX はエージェントが実行できるアクション、アクセスできるデータ、外部システムとの相互作用方法を慎重に制御する必要があります。

## セキュリティレイヤー

PRX は複数のセキュリティレイヤーによる多層防御を実装しています:

| レイヤー | コンポーネント | 目的 |
|-------|-----------|---------|
| ポリシー | [ポリシーエンジン](./policy-engine) | ツールアクセスとデータフローのための宣言的ルール |
| 分離 | [サンドボックス](./sandbox) | ツール実行のためのプロセス/コンテナ分離 |
| 認証 | [ペアリング](./pairing) | デバイスペアリングと ID 検証 |
| シークレット | [シークレット管理](./secrets) | API キーと認証情報のセキュアな保存 |

## 設定

```toml
[security]
sandbox_backend = "bubblewrap"  # "docker" | "firejail" | "bubblewrap" | "landlock" | "none"
require_tool_approval = true
max_tool_calls_per_turn = 10

[security.policy]
default_action = "deny"
```

## 脅威モデル

PRX の[脅威モデル](./threat-model)は、敵対的入力、プロンプトインジェクション、ツールの悪用、データ流出を主要な脅威ベクトルとして考慮しています。

## 関連ページ

- [ポリシーエンジン](./policy-engine)
- [ペアリング](./pairing)
- [サンドボックス](./sandbox)
- [シークレット管理](./secrets)
- [脅威モデル](./threat-model)
