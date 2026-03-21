---
title: ノードペアリング
description: セキュアな分散実行のために PRX ノードをコントローラーとペアリングする方法
---

# ノードペアリング

ノードがコントローラーからタスクを受信するには、事前にペアリングが必要です。ペアリングは暗号化された ID 検証を通じて相互信頼を確立します。

## ペアリングプロセス

1. ノードをペアリングモードで起動: `prx node pair`
2. ノードがペアリングコード（6桁の PIN）を表示
3. コントローラーでペアリングを開始: `prx pair add --address <node-ip>:3121`
4. プロンプトが表示されたらペアリングコードを入力
5. 双方が Ed25519 公開鍵を交換・検証

## 設定

```toml
[node.pairing]
auto_accept = false
pairing_timeout_secs = 120
max_paired_controllers = 3
```

## ノードの管理

```bash
# コントローラー側
prx node list              # ペアリング済みノードの一覧
prx node status <node-id>  # ノードの状態を確認
prx node unpair <node-id>  # ノードのペアリングを解除

# ノード側
prx node pair              # ペアリングモードに入る
prx node info              # ノード ID を表示
```

## 関連ページ

- [ノード概要](./)
- [通信プロトコル](./protocol)
- [デバイスペアリング](/ja/prx/security/pairing)
