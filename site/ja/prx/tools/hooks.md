---
title: フック
description: 8 つのライフサイクルイベント、シェルフック実行、WASM プラグインコールバック、HTTP API 管理、イベントバス統合による、可観測性と自動化のためのイベント駆動拡張システム。
---

# フック

PRX フックは、エージェント実行中のライフサイクルイベントに反応するイベント駆動拡張システムを提供します。エージェントループのすべての重要な瞬間 -- ターンの開始、LLM の呼び出し、ツールの呼び出し、エラーの発生 -- がフックイベントを発行します。`hooks.json` 設定ファイル、WASM プラグインマニフェスト、または HTTP API を通じてこれらのイベントにアクションをアタッチします。

フックは設計上**ファイア・アンド・フォーゲット**です。エージェントループをブロックしたり、実行フローを変更したり、会話にデータを注入したりすることはありません。これにより、コアエージェントパイプラインにレイテンシやフェイルモードを導入することなく、監査ログ、メトリクス収集、外部通知、副作用の自動化に最適です。

3 つのフック実行バックエンドがあります:

- **シェルフック** -- イベントペイロードを環境変数、一時ファイル、または stdin で渡して外部コマンドを実行。`hooks.json` で設定。
- **WASM プラグインフック** -- WASM プラグインがエクスポートする `on-event` 関数を呼び出し。プラグインの `plugin.toml` マニフェストで宣言。
- **イベントバスフック** -- 内部イベントバスのトピック `prx.lifecycle.<event>` にパブリッシュ。常にアクティブ; 設定不要。

## フックイベント

PRX は 8 つのライフサイクルイベントを発行します。各イベントはコンテキスト固有のフィールドを持つ JSON ペイロードを運びます。

| イベント | 発行タイミング | ペイロードフィールド |
|-------|-------------|----------------|
| `agent_start` | エージェントループが新しいターンを開始 | `agent` (string), `session` (string) |
| `agent_end` | エージェントループがターンを完了 | `success` (bool), `messages_count` (number) |
| `llm_request` | LLM プロバイダーにリクエストを送信する前 | `provider` (string), `model` (string), `messages_count` (number) |
| `llm_response` | LLM レスポンスを受信した後 | `provider` (string), `model` (string), `duration_ms` (number), `success` (bool) |
| `tool_call_start` | ツールが実行を開始する前 | `tool` (string), `arguments` (object) |
| `tool_call` | ツールが実行を完了した後 | `tool` (string), `success` (bool), `output` (string) |
| `turn_complete` | フルターン完了（すべてのツールが解決） | _(空のオブジェクト)_ |
| `error` | 実行中の任意のエラー | `component` (string), `message` (string) |

### ペイロードスキーマ

すべてのペイロードは JSON オブジェクトです。トップレベル構造がイベント固有のフィールドをラップします:

```json
{
  "event": "llm_response",
  "timestamp": "2026-03-21T08:15:30.123Z",
  "session_id": "sess_abc123",
  "payload": {
    "provider": "openai",
    "model": "gpt-4o",
    "duration_ms": 1842,
    "success": true
  }
}
```

`event`、`timestamp`、`session_id` フィールドはすべてのフックイベントに存在します。`payload` オブジェクトは上表に記載のとおりイベントタイプによって異なります。

## 設定

シェルフックはワークスペースディレクトリ（`config.toml` と同じディレクトリ）に配置する `hooks.json` ファイルで設定されます。PRX はこのファイルの変更を監視し、再起動なしで設定を**ホットリロード**します。

### 基本構造

```json
{
  "hooks": {
    "<event_name>": [
      {
        "command": "/path/to/script",
        "args": ["--flag", "value"],
        "env": {
          "CUSTOM_VAR": "value"
        },
        "cwd": "/working/directory",
        "timeout_ms": 5000,
        "stdin_json": true
      }
    ]
  }
}
```

各イベント名はフックアクションの配列にマップされます。同じイベントに複数のアクションをアタッチ可能で、それらは並行して独立に実行されます。

### 完全な例

```json
{
  "hooks": {
    "agent_start": [
      {
        "command": "/usr/local/bin/notify",
        "args": ["--channel", "ops", "--title", "Agent Started"],
        "timeout_ms": 3000
      }
    ],
    "llm_response": [
      {
        "command": "python3",
        "args": ["/opt/hooks/log_latency.py"],
        "stdin_json": true,
        "timeout_ms": 2000
      }
    ],
    "tool_call": [
      {
        "command": "/opt/hooks/audit_tool_usage.sh",
        "env": {
          "LOG_DIR": "/var/log/prx/audit"
        },
        "timeout_ms": 5000
      }
    ],
    "error": [
      {
        "command": "curl",
        "args": [
          "-X", "POST",
          "-H", "Content-Type: application/json",
          "-d", "@-",
          "https://hooks.slack.com/services/T00/B00/xxxxx"
        ],
        "stdin_json": true,
        "timeout_ms": 10000
      }
    ]
  }
}
```

## フックアクションフィールド

各フックアクションオブジェクトは以下のフィールドをサポート:

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-------|------|----------|---------|-------------|
| `command` | string | はい | -- | 実行可能ファイルの絶対パスまたはサニタイズされた PATH で見つかるコマンド名 |
| `args` | string[] | いいえ | `[]` | コマンドに渡される引数 |
| `env` | object | いいえ | `{}` | サニタイズされた実行環境にマージされる追加環境変数 |
| `cwd` | string | いいえ | ワークスペースディレクトリ | 起動されるプロセスの作業ディレクトリ |
| `timeout_ms` | number | いいえ | `30000` | 最大実行時間（ミリ秒）。この制限を超えるとプロセスは強制終了（SIGKILL） |
| `stdin_json` | bool | いいえ | `false` | `true` の場合、完全なイベントペイロード JSON が stdin 経由でプロセスにパイプされる |

### `command` に関する注意

`command` フィールドは実行前にセキュリティ検証を受けます。シェルメタ文字（`;`、`|`、`&`、`` ` ``、`$()`）を含んではなりません -- シェルインジェクションを防ぐために拒否されます。シェル機能が必要な場合は、スクリプトファイルにラップして `command` でそのスクリプトを指定してください。

相対パスはワークスペースディレクトリに対して解決されます。ただし、予測可能性のために絶対パスの使用を推奨します。

## ペイロードの配信

フックアクションは 3 つのチャネルから同時にイベントペイロードを受け取ります。この冗長性により、あらゆる言語のスクリプトが最も便利な方法でデータにアクセスできます。

### 1. 環境変数（`ZERO_HOOK_PAYLOAD`）

ペイロード JSON 文字列が `ZERO_HOOK_PAYLOAD` 環境変数として設定されます。シェルスクリプトにとって最もシンプルなアクセス方法です:

```bash
#!/bin/bash
# 環境変数からペイロードを読み取り
echo "$ZERO_HOOK_PAYLOAD" | jq '.payload.tool'
```

**サイズ制限**: 8 KB。シリアライズされたペイロードが 8 KB を超える場合、環境変数は**設定されず**、ペイロードは一時ファイルと stdin チャネルのみで利用可能です。

### 2. 一時ファイル（`ZERO_HOOK_PAYLOAD_FILE`）

ペイロードは一時ファイルに書き込まれ、ファイルパスが `ZERO_HOOK_PAYLOAD_FILE` 環境変数に設定されます。一時ファイルはフックプロセスの終了後に自動削除されます。

```python
import os, json

payload_file = os.environ["ZERO_HOOK_PAYLOAD_FILE"]
with open(payload_file) as f:
    data = json.load(f)
print(f"Tool: {data['payload']['tool']}, Success: {data['payload']['success']}")
```

このチャネルにはサイズ制限がなく、大きくなる可能性のあるペイロード（例: 詳細な出力を持つ `tool_call`）に推奨される方法です。

### 3. 標準入力（stdin）

フックアクションで `stdin_json` が `true` に設定されている場合、ペイロード JSON が stdin 経由でプロセスにパイプされます。`curl -d @-` や `jq` など、ネイティブに stdin から読み取るコマンドに便利です。

```bash
#!/bin/bash
# stdin から読み取り（フック設定で stdin_json: true が必要）
read -r payload
echo "$payload" | jq -r '.payload.message'
```

## 環境変数

すべてのフックプロセスは `ZERO_HOOK_PAYLOAD` と `ZERO_HOOK_PAYLOAD_FILE` に加えて以下の環境変数を受け取ります:

| 変数 | 説明 | 例 |
|----------|-------------|---------|
| `ZERO_HOOK_EVENT` | このフックをトリガーしたイベント名 | `tool_call` |
| `ZERO_HOOK_SESSION` | 現在のセッション識別子 | `sess_abc123` |
| `ZERO_HOOK_TIMESTAMP` | イベントの ISO 8601 タイムスタンプ | `2026-03-21T08:15:30.123Z` |
| `ZERO_HOOK_PAYLOAD` | JSON 文字列としてのフルペイロード（>8 KB の場合は省略） | `{"event":"tool_call",...}` |
| `ZERO_HOOK_PAYLOAD_FILE` | ペイロードを含む一時ファイルのパス | `/tmp/prx-hook-a1b2c3.json` |

実行環境はフックプロセス開始前に**サニタイズ**されます。機密性の高い危険な環境変数は除去され（下記[セキュリティ](#セキュリティ)を参照）、上記の変数とフックアクションからの `env` オーバーライドのみが利用可能です。

## WASM プラグインフック

WASM プラグインは PRX WIT（WebAssembly Interface Types）インターフェースで定義された `on-event` 関数をエクスポートすることでフックイベントをサブスクライブできます。

### WIT インターフェース

```wit
interface hooks {
    /// サブスクライブされたイベントが発火したときに呼ばれる。
    /// 成功時は Ok(())、失敗時は Err(message) を返す。
    on-event: func(event: string, payload-json: string) -> result<_, string>;
}
```

`event` パラメーターはイベント名（例: `"tool_call"`）、`payload-json` はシェルフックが受け取るものと同一の JSON 文字列としてシリアライズされたフルペイロードです。

### イベントサブスクリプションパターン

プラグインはパターンマッチングを使用して受け取りたいイベントを `plugin.toml` マニフェストで宣言:

| パターン | マッチ | 例 |
|---------|---------|---------|
| 完全一致 | 単一の特定イベント | `"tool_call"` |
| ワイルドカードサフィックス | プレフィックスに一致するすべてのイベント | `"prx.lifecycle.*"` |
| ユニバーサル | すべてのイベント | `"*"` |

### プラグインマニフェストの例

```toml
[plugin]
name = "audit-logger"
version = "0.1.0"
description = "Logs all lifecycle events to an audit trail"

[[capabilities]]
type = "hook"
events = ["agent_start", "agent_end", "error"]

[[capabilities]]
type = "hook"
events = ["prx.lifecycle.*"]
```

単一のプラグインが異なるイベントパターンを持つ複数の `[[capabilities]]` ブロックを宣言できます。マッチしたすべてのイベントの和集合がプラグインが受け取るイベントを決定します。

### 実行モデル

WASM プラグインフックは他のプラグイン関数と同じリソース制限を持つ WASM サンドボックス内で実行されます。以下の対象:

- **メモリ制限**: プラグインのリソース設定で定義（デフォルト 64 MB）
- **実行タイムアウト**: シェルフックの `timeout_ms` と同じ（デフォルト 30 秒）
- **ファイルシステムアクセスなし**: WASI 機能で明示的に付与されない限り
- **ネットワークアクセスなし**: 機能フラグで明示的に付与されない限り

WASM フックが `Err(message)` を返した場合、エラーはログに記録されますがエージェントループには影響しません。フックは常にファイア・アンド・フォーゲットです。

## イベントバス統合

すべてのフックイベントは自動的に内部イベントバスのトピック `prx.lifecycle.<event>` にパブリッシュされます。これはシェルまたは WASM フックが設定されているかどうかに関係なく発生します。

### トピック形式

```
prx.lifecycle.agent_start
prx.lifecycle.agent_end
prx.lifecycle.llm_request
prx.lifecycle.llm_response
prx.lifecycle.tool_call_start
prx.lifecycle.tool_call
prx.lifecycle.turn_complete
prx.lifecycle.error
```

### サブスクリプションタイプ

内部コンポーネントとプラグインは 3 つのパターンを使用してイベントバストピックをサブスクライブ可能:

- **完全一致**: `prx.lifecycle.tool_call` -- `tool_call` イベントのみ受信
- **ワイルドカード**: `prx.lifecycle.*` -- すべてのライフサイクルイベントを受信
- **階層的**: `prx.*` -- すべての PRX ドメインイベント（ライフサイクル、メトリクスなど）を受信

### ペイロード制限

| 制約 | 値 |
|------------|-------|
| 最大ペイロードサイズ | 64 KB |
| 最大再帰深度 | 8 レベル |
| ディスパッチモデル | ファイア・アンド・フォーゲット（非同期） |
| 配信保証 | 最大 1 回 |

フックイベントが別のフックイベントをトリガーする場合（例: フックスクリプトがツールを呼び出して `tool_call` を発行）、再帰カウンターがインクリメントされます。8 レベルの深さで、以降のイベント発行は無限ループを防ぐためにサイレントにドロップされます。

## HTTP API

フックは HTTP API を通じてプログラマティックに管理できます。すべてのエンドポイントは認証が必要で、JSON レスポンスを返します。

### すべてのフックをリスト

```
GET /api/hooks
```

レスポンス:

```json
{
  "hooks": [
    {
      "id": "hook_01",
      "event": "error",
      "action": {
        "command": "/opt/hooks/notify_error.sh",
        "args": [],
        "timeout_ms": 5000,
        "stdin_json": false
      },
      "enabled": true,
      "created_at": "2026-03-20T10:00:00Z",
      "updated_at": "2026-03-20T10:00:00Z"
    }
  ]
}
```

### フックを作成

```
POST /api/hooks
Content-Type: application/json

{
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency.py"],
    "stdin_json": true,
    "timeout_ms": 3000
  },
  "enabled": true
}
```

レスポンス（201 Created）:

```json
{
  "id": "hook_02",
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency.py"],
    "stdin_json": true,
    "timeout_ms": 3000
  },
  "enabled": true,
  "created_at": "2026-03-21T08:00:00Z",
  "updated_at": "2026-03-21T08:00:00Z"
}
```

### フックを更新

```
PUT /api/hooks/hook_02
Content-Type: application/json

{
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency_v2.py"],
    "stdin_json": true,
    "timeout_ms": 5000
  },
  "enabled": true
}
```

レスポンス（200 OK）: 更新されたフックオブジェクトを返す。

### フックを削除

```
DELETE /api/hooks/hook_02
```

レスポンス（204 No Content）: 成功時は空ボディ。

### フックの切り替え

```
PATCH /api/hooks/hook_01/toggle
```

レスポンス（200 OK）:

```json
{
  "id": "hook_01",
  "enabled": false
}
```

このエンドポイントは `enabled` 状態を切り替えます。無効化されたフックは設定に残りますが、イベント発火時に実行されません。

## セキュリティ

フックの実行には、権限昇格、データ流出、サービス拒否を防ぐためのいくつかのセキュリティ対策が適用されます。

### ブロックされる環境変数

以下の環境変数はフック実行環境から除去され、フックアクションの `env` フィールドでオーバーライドできません:

| 変数 | 理由 |
|----------|--------|
| `LD_PRELOAD` | ライブラリインジェクション攻撃ベクトル |
| `LD_LIBRARY_PATH` | ライブラリ検索パス操作 |
| `DYLD_INSERT_LIBRARIES` | macOS ライブラリインジェクション |
| `DYLD_LIBRARY_PATH` | macOS ライブラリパス操作 |
| `PATH` | PATH ハイジャックを防止; 最小限の安全な PATH が提供される |
| `HOME` | ホームディレクトリのスプーフィングを防止 |

### 入力検証

- **ヌルバイト拒否**: `command`、`args`、`env` キー、`env` 値にヌルバイト（`\0`）が含まれる場合は拒否。OS レベルで文字列を切り詰めるヌルバイトインジェクション攻撃を防止。
- **シェルメタ文字拒否**: `command` フィールドに `;`、`|`、`&`、`` ` ``、`$(`、その他のシェルメタ文字を含んではならない。コマンドが誤ってシェル経由で渡された場合でもシェルインジェクションを防止。
- **パストラバーサル**: `cwd` フィールドは `..` コンポーネントでワークスペースディレクトリから脱出しないことを検証。

### タイムアウト強制

すべてのフックプロセスは設定された `timeout_ms`（デフォルト 30 秒）の対象です。プロセスがこの制限を超えた場合:

1. `SIGTERM` がプロセスに送信
2. 5 秒の猶予期間後に `SIGKILL` を送信
3. フックは内部メトリクスでタイムアウトとしてマーク
4. エージェントループは**影響を受けない**

### リソース分離

フックプロセスは、サンドボックスバックエンドがアクティブな場合、シェルツール実行と同じ cgroup およびネームスペース制限を継承します。Docker サンドボックスモードでは、フックはデフォルトでネットワークアクセスのない別のコンテナで実行されます。

## 例

### 監査ログフック

コンプライアンス監査のためにすべてのツール呼び出しをファイルに記録:

```json
{
  "hooks": {
    "tool_call": [
      {
        "command": "/opt/hooks/audit_log.sh",
        "env": {
          "AUDIT_LOG": "/var/log/prx/tool_audit.jsonl"
        },
        "timeout_ms": 2000
      }
    ]
  }
}
```

`/opt/hooks/audit_log.sh`:

```bash
#!/bin/bash
echo "$ZERO_HOOK_PAYLOAD" >> "$AUDIT_LOG"
```

### エラー通知フック

エラーイベントを Slack チャネルに送信:

```json
{
  "hooks": {
    "error": [
      {
        "command": "curl",
        "args": [
          "-s", "-X", "POST",
          "-H", "Content-Type: application/json",
          "-d", "@-",
          "https://hooks.slack.com/services/T00/B00/xxxxx"
        ],
        "stdin_json": true,
        "timeout_ms": 10000
      }
    ]
  }
}
```

### LLM レイテンシメトリクスフック

監視ダッシュボード用に LLM レスポンス時間を追跡:

```json
{
  "hooks": {
    "llm_response": [
      {
        "command": "python3",
        "args": ["/opt/hooks/metrics.py"],
        "stdin_json": true,
        "timeout_ms": 3000
      }
    ]
  }
}
```

`/opt/hooks/metrics.py`:

```python
import sys, json

data = json.load(sys.stdin)
payload = data["payload"]
provider = payload["provider"]
model = payload["model"]
duration = payload["duration_ms"]
success = payload["success"]

# StatsD、Prometheus pushgateway、その他のメトリクスバックエンドにプッシュ
print(f"prx.llm.duration,provider={provider},model={model} {duration}")
print(f"prx.llm.success,provider={provider},model={model} {1 if success else 0}")
```

### セッションライフサイクル追跡

利用分析のためにエージェントセッションの開始と終了を追跡:

```json
{
  "hooks": {
    "agent_start": [
      {
        "command": "/opt/hooks/session_tracker.sh",
        "args": ["start"],
        "timeout_ms": 2000
      }
    ],
    "agent_end": [
      {
        "command": "/opt/hooks/session_tracker.sh",
        "args": ["end"],
        "timeout_ms": 2000
      }
    ]
  }
}
```

## 関連

- [シェル実行](/ja/prx/tools/shell) -- フックがよくラップするシェルツール
- [MCP 統合](/ja/prx/tools/mcp) -- `tool_call` イベントを発行する外部ツールプロトコル
- [プラグイン](/ja/prx/plugins/) -- フック機能を含む WASM プラグインシステム
- [可観測性](/ja/prx/observability/) -- フックを補完するメトリクスとトレーシング
- [セキュリティ](/ja/prx/security/) -- フック実行を管理するサンドボックスとポリシーエンジン
