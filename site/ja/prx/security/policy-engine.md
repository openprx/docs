---
title: ポリシーエンジン
description: PRX でエージェントのツールアクセスとデータフローを制御する宣言的セキュリティポリシーエンジン
---

# ポリシーエンジン

ポリシーエンジンは、エージェントが使用できるツール、アクセスできるファイル、実行できるネットワークリクエストを制御する宣言的ルールシステムです。ポリシーはすべてのツール呼び出しの前に評価されます。

## 概要

ポリシーは条件とアクションを持つルールとして定義されます:

- **Allow ルール** -- 特定の操作を明示的に許可
- **Deny ルール** -- 特定の操作を明示的にブロック
- **デフォルトアクション** -- ルールが一致しない場合に適用（デフォルトは拒否）

## ポリシー形式

```toml
[security.policy]
default_action = "deny"

[[security.policy.rules]]
name = "allow-read-workspace"
action = "allow"
tools = ["fs_read"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "block-sensitive-dirs"
action = "deny"
tools = ["fs_read", "fs_write"]
paths = ["/etc/**", "/root/**", "**/.ssh/**"]

[[security.policy.rules]]
name = "allow-http-approved-domains"
action = "allow"
tools = ["http_request"]
domains = ["api.github.com", "api.openai.com"]
```

## ルール評価

ルールは順序通りに評価されます。最初に一致したルールがアクションを決定します。ルールが一致しない場合、デフォルトアクションが適用されます。

## 組み込みポリシー

PRX には、以下を実現する適切なデフォルトポリシーが同梱されています:

- システムディレクトリと機密ファイルへのアクセスをブロック
- 破壊的操作には明示的な承認を要求
- ネットワークリクエストをレート制限
- 監査のためにすべてのツール実行をログ記録

## 関連ページ

- [セキュリティ概要](./)
- [サンドボックス](./sandbox)
- [脅威モデル](./threat-model)
