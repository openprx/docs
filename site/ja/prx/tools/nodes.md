---
title: リモートノード
description: マシン間の分散エージェント実行のためのリモート PRX ノードの管理と通信。
---

# リモートノード

`nodes` ツールは、PRX エージェントが分散デプロイメントでリモートの PRX インスタンスとインタラクションできるようにします。ノードとは、別のマシンで実行されている別の PRX デーモン -- 異なるハードウェア機能、ネットワークアクセス、ツール設定を持つ可能性がある -- で、コントローラーインスタンスとペアリングされたものです。

`nodes` ツールを通じて、エージェントは利用可能なノードを検出し、ヘルスチェックを行い、特殊な機能（例: GPU アクセス）を持つノードにタスクをルーティングし、結果を取得できます。これにより、ワークロード分散、環境の特化、エージェントタスクの地理的分散が可能になります。

`nodes` ツールは `all_tools()` レジストリに登録されており、常に利用可能です。実際の機能はノード設定とリモートピアがペアリングされているかどうかに依存します。

## 設定

### コントローラーモード

コントローラーはノード間の作業をオーケストレーションするプライマリ PRX インスタンスです:

```toml
[node]
mode = "controller"
node_id = "primary"
advertise_address = "192.168.1.100:3121"

[node.discovery]
method = "static"          # "static" | "mdns"
peers = [
  "192.168.1.101:3121",   # GPU ホスト
  "192.168.1.102:3121",   # ステージング環境
]
```

### ノードモード

ノードはコントローラーから委任された作業を受け入れる PRX インスタンスです:

```toml
[node]
mode = "node"
node_id = "gpu-host-01"
advertise_address = "192.168.1.101:3121"
controller = "192.168.1.100:3121"
```

### 検出方法

| 方法 | 説明 | ユースケース |
|--------|------------|----------|
| `static` | 設定内のピアアドレスの明示的なリスト | 既知で安定したインフラ |
| `mdns` | ローカルネットワーク上のマルチキャスト DNS による自動検出 | 動的環境、開発用途 |

```toml
# mDNS 検出
[node.discovery]
method = "mdns"
service_name = "_prx._tcp.local."
```

## 使用方法

### 利用可能なノードをリスト

ペアリングされたすべてのリモートノードをステータスとともに検出してリスト:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "list"
  }
}
```

**レスポンス例:**

```
Nodes:
  1. gpu-host-01 (192.168.1.101:3121) - ONLINE
     Capabilities: gpu, cuda, python
     Load: 23%

  2. staging-01 (192.168.1.102:3121) - ONLINE
     Capabilities: docker, network-access
     Load: 5%
```

### ノードのヘルスチェック

特定のノードのヘルスと機能をクエリ:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "health",
    "node_id": "gpu-host-01"
  }
}
```

### ノードにタスクを送信

特定のリモートノードにタスクをルーティングして実行:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "send",
    "node_id": "gpu-host-01",
    "task": "Run the ML inference pipeline on the uploaded dataset."
  }
}
```

### ノードの結果を取得

以前に送信したタスクの結果を取得:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "result",
    "task_id": "task_xyz789"
  }
}
```

## パラメーター

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `action` | `string` | はい | -- | ノードアクション: `"list"`、`"health"`、`"send"`、`"result"`、`"capabilities"` |
| `node_id` | `string` | 条件付き | -- | ターゲットノード識別子（`"health"`、`"send"` で必須） |
| `task` | `string` | 条件付き | -- | タスク説明（`"send"` で必須） |
| `task_id` | `string` | 条件付き | -- | タスク識別子（`"result"` で必須） |

**戻り値:**

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `success` | `bool` | 操作が完了した場合 `true` |
| `output` | `string` | 操作結果（ノードリスト、ヘルスステータス、タスク結果など） |
| `error` | `string?` | 操作が失敗した場合のエラーメッセージ（ノード到達不能、タスク未検出など） |

## アーキテクチャ

PRX ノードシステムはコントローラー-ノードトポロジーを使用:

```
┌──────────────────┐         ┌──────────────────┐
│   コントローラー  │         │   ノード A        │
│   (プライマリ PRX)│◄──────► │   (gpu-host-01)  │
│                  │  mTLS   │   GPU, CUDA      │
│   エージェント    │         │   ローカルツール   │
│   ├── nodes ツール│         └──────────────────┘
│   └── delegate   │
│                  │         ┌──────────────────┐
│                  │◄──────► │   ノード B        │
│                  │  mTLS   │   (staging-01)   │
│                  │         │   Docker, Net    │
└──────────────────┘         └──────────────────┘
```

### 通信プロトコル

ノードは相互 TLS（mTLS）認証を備えた TCP 上のカスタムプロトコルで通信:

1. **ペアリング**: ノードはチャレンジ-レスポンスハンドシェイクでコントローラーとペアリング（[ノードペアリング](/ja/prx/nodes/pairing)を参照）
2. **ハートビート**: ペアリングされたノードはヘルスと機能を報告するために定期的にハートビートを送信
3. **タスクディスパッチ**: コントローラーはシリアライズされたコンテキストとともにノードにタスクを送信
4. **結果返却**: ノードは構造化出力とともにタスク結果を返す

### 機能アドバタイズ

各ノードは機能をアドバタイズし、コントローラーはそれをインテリジェントなタスクルーティングに使用:

- **ハードウェア**: `gpu`、`cuda`、`tpu`、`high-memory`
- **ソフトウェア**: `docker`、`python`、`rust`、`nodejs`
- **ネットワーク**: `network-access`、`vpn-connected`、`internal-network`
- **ツール**: ノード上で利用可能な PRX ツールのリスト

## 一般的なパターン

### GPU 加速タスク

ML や計算集約型タスクを GPU 搭載ノードにルーティング:

```
エージェント: ユーザーが画像分類を実行したい。
  1. [nodes] action="list" → CUDA を持つ gpu-host-01 を発見
  2. [nodes] action="send", node_id="gpu-host-01", task="Run image classification on /data/images/"
  3. [完了を待つ]
  4. [nodes] action="result", task_id="task_abc123"
```

### 環境分離

特定の環境を必要とするタスクにノードを使用:

```
エージェント: ステージング環境でデプロイスクリプトをテストする必要がある。
  1. [nodes] action="send", node_id="staging-01", task="Run deploy.sh and verify all services start"
  2. [nodes] action="result", task_id="task_def456"
```

### 負荷分散

並列実行のために複数のノードに作業を分散:

```
エージェント: 3 つのデータセットを同時に処理。
  1. [nodes] action="send", node_id="node-a", task="Process dataset-1.csv"
  2. [nodes] action="send", node_id="node-b", task="Process dataset-2.csv"
  3. [nodes] action="send", node_id="node-c", task="Process dataset-3.csv"
  4. [3 つすべてから結果を収集]
```

## セキュリティ

### 相互 TLS 認証

すべてのノード通信は mTLS を使用します。TLS ハンドシェイク中にコントローラーとノードの両方が有効な証明書を提示する必要があります。証明書はペアリングプロセス中に交換されます。

### ペアリング要件

ノードはタスクを交換する前にペアリングハンドシェイクを完了する必要があります。ペアリングされていないノードは接続レベルで拒否されます。ペアリングプロトコルについては[ノードペアリング](/ja/prx/nodes/pairing)を参照。

### タスク分離

リモートノードに送信されたタスクはノードのセキュリティポリシー内で実行されます。ノードのサンドボックス設定、ツール制限、リソース制限がコントローラーの設定とは独立して適用されます。

### ネットワークセキュリティ

- ノード通信ポートは既知のコントローラー/ノードアドレスのみ許可するようにファイアウォール設定すべき
- mDNS 検出はローカルネットワークセグメントに限定
- 本番デプロイメントには静的ピアリストを推奨

### ポリシーエンジン

`nodes` ツールはセキュリティポリシーの管理下にあります:

```toml
[security.tool_policy.tools]
nodes = "supervised"       # リモートノードへのタスク送信前に承認を要求
```

## 関連

- [リモートノード](/ja/prx/nodes/) -- ノードシステムアーキテクチャ
- [ノードペアリング](/ja/prx/nodes/pairing) -- ペアリングプロトコルと証明書交換
- [通信プロトコル](/ja/prx/nodes/protocol) -- ワイヤプロトコルの詳細
- [セキュリティペアリング](/ja/prx/security/pairing) -- デバイスペアリングのセキュリティモデル
- [セッションとエージェント](/ja/prx/tools/sessions) -- ローカルマルチエージェント実行の代替
- [ツール概要](/ja/prx/tools/) -- 全ツールとレジストリシステム
