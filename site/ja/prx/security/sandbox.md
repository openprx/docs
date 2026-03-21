---
title: サンドボックス
description: PRX でのツール実行を分離するサンドボックスバックエンド
---

# サンドボックス

PRX サンドボックスは、ツール実行のためのプロセスおよびファイルシステム分離を提供します。エージェントが外部コマンドを実行するツールを呼び出すと、サンドボックスはそのコマンドが制限された環境で実行されることを保証します。

## サンドボックスバックエンド

PRX は複数のサンドボックスバックエンドをサポートしています:

| バックエンド | プラットフォーム | 分離レベル | オーバーヘッド |
|---------|----------|----------------|----------|
| **Docker** | Linux、macOS | フルコンテナ | 高 |
| **Bubblewrap** | Linux | 名前空間 + seccomp | 低 |
| **Firejail** | Linux | 名前空間 + seccomp | 低 |
| **Landlock** | Linux（5.13+） | カーネル LSM | 最小 |
| **None** | すべて | 分離なし | なし |

## 設定

```toml
[security.sandbox]
backend = "bubblewrap"

[security.sandbox.docker]
image = "prx-sandbox:latest"
network = "none"
memory_limit = "256m"
cpu_limit = "1.0"

[security.sandbox.bubblewrap]
allow_network = false
writable_paths = ["/tmp"]
readonly_paths = ["/usr", "/lib"]
```

## 仕組み

1. エージェントがツール呼び出し（例: シェルコマンド実行）を要求
2. ポリシーエンジンが呼び出しが許可されているか確認
3. サンドボックスが設定されたバックエンドで実行をラップ
4. ツールが制限されたファイルシステムとネットワークアクセスで実行
5. 結果がキャプチャされてエージェントに返却

## 関連ページ

- [セキュリティ概要](./)
- [ポリシーエンジン](./policy-engine)
- [セッションワーカー](/ja/prx/agent/session-worker)
