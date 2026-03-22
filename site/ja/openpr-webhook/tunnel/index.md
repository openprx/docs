---
title: WSSトンネル
description: "OpenPR-WebhookのWSSトンネルはコントロールプレーンへのアクティブなWebSocket接続を提供し、NATやファイアウォールの背後でのプッシュベースのタスクディスパッチを可能にします。"
---

# WSSトンネル

WSSトンネル（フェーズB）はOpenPR-WebhookからコントロールプレーンサーバーへのアクティブなWebSocket接続を提供します。インバウンドHTTP Webhookを待つ代わりに、トンネルによりコントロールプレーンが永続的な接続を通じてエージェントに直接タスクをプッシュできます。

これはWebhookサービスがNATやファイアウォールの背後で実行されており、インバウンドHTTPリクエストを受信できない場合に特に便利です。

## 動作の仕組み

```
コントロールプレーン (wss://...)
    ^         |
    |         | task.dispatch
    |         v
+-------------------+
| openpr-webhook    |
|   tunnel client   |
|                   |
| task.ack  ------->|
| heartbeat ------->|
| task.result ----->|
+-------------------+
    |
    v
  CLIエージェント (codex / claude-code / opencode)
```

1. OpenPR-WebhookがコントロールプレーンのURLへのWebSocket接続を開く
2. `Authorization`ヘッダーのBearerトークンで認証する
3. 接続を維持するために定期的なハートビートメッセージを送信する
4. コントロールプレーンから`task.dispatch`メッセージを受信する
5. `task.ack`ですぐに確認する
6. CLIエージェントを通じて非同期でタスクを実行する
7. 実行完了時に`task.result`を送り返す

## トンネルの有効化

トンネルを有効にするには**2つ**のことが必要です：

1. フィーチャーフラグ：`features.tunnel_enabled = true`
2. トンネルセクション：`tunnel.enabled = true`

両方の条件が真である必要があり、`OPENPR_WEBHOOK_SAFE_MODE`が設定されていてはなりません。

```toml
[features]
tunnel_enabled = true
cli_enabled = true  # Usually needed for task execution

[tunnel]
enabled = true
url = "wss://control.example.com/ws/agent"
agent_id = "my-webhook-agent"
auth_token = "your-bearer-token"
reconnect_secs = 3
heartbeat_secs = 20
```

## メッセージエンベロープフォーマット

すべてのトンネルメッセージは標準エンベロープを使用します：

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "heartbeat",
  "ts": 1711234567,
  "agent_id": "my-webhook-agent",
  "payload": { "alive": true },
  "sig": "sha256=abc123..."
}
```

| フィールド | タイプ | 説明 |
|-------|------|-------------|
| `id` | String（UUID） | 一意のメッセージ識別子 |
| `type` | String | メッセージタイプ（以下参照） |
| `ts` | Integer | Unixタイムスタンプ（秒） |
| `agent_id` | String | 送信エージェントのID |
| `payload` | Object | タイプ固有のペイロード |
| `sig` | String（オプション） | エンベロープのHMAC-SHA256署名 |

## メッセージタイプ

### アウトバウンド（エージェントからコントロールプレーンへ）

| タイプ | タイミング | ペイロード |
|------|------|---------|
| `heartbeat` | N秒ごと | `{"alive": true}` |
| `task.ack` | タスク受信後すぐ | `{"run_id": "...", "issue_id": "...", "status": "accepted"}` |
| `task.result` | タスク完了後 | `{"run_id": "...", "issue_id": "...", "status": "success/failed", "summary": "..."}` |
| `error` | プロトコルエラー時 | `{"reason": "invalid_json/missing_signature/bad_signature", "msg_id": "..."}` |

### インバウンド（コントロールプレーンからエージェントへ）

| タイプ | 目的 | ペイロード |
|------|---------|---------|
| `task.dispatch` | このエージェントにタスクを割り当て | `{"run_id": "...", "issue_id": "...", "agent": "...", "body": {...}}` |

## タスクディスパッチフロー

```
コントロールプレーン              openpr-webhook
    |                                 |
    |--- task.dispatch ------------->|
    |                                 |--- task.ack（即時）
    |<--- task.ack ------------------|
    |                                 |
    |                                 |--- CLIエージェント実行
    |                                 |    （非同期、タイムアウトまで）
    |                                 |
    |<--- task.result ---------------|--- task.result
    |                                 |
```

`task.dispatch`ペイロードフィールド：

| フィールド | タイプ | 説明 |
|-------|------|-------------|
| `run_id` | String | 一意のrun識別子（省略した場合は自動生成） |
| `issue_id` | String | 作業対象のイシューID |
| `agent` | String（オプション） | ターゲットエージェントID（最初の`cli`エージェントにフォールバック） |
| `body` | Object | ディスパッチャーに渡す完全なWebhookペイロード |

## HMACエンベロープ署名

`tunnel.hmac_secret`が設定されている場合、すべてのアウトバウンドエンベロープが署名されます：

1. エンベロープは`sig`を`null`に設定してJSONにシリアライズされる
2. HMAC-SHA256がシークレットを使用してJSONバイトで計算される
3. 署名が`sig`フィールドに`sha256={hex}`として設定される

インバウンドメッセージについては、`tunnel.require_inbound_sig = true`の場合、有効な署名のないメッセージはすべて`error`エンベロープで拒否されます。

```toml
[tunnel]
hmac_secret = "shared-secret-with-control-plane"
require_inbound_sig = true
```

## 再接続の動作

トンネルクライアントは切断時に自動的に再接続します：

- 初期リトライ遅延：`reconnect_secs`（デフォルト：3秒）
- バックオフ：連続失敗ごとに2倍に増加
- 最大バックオフ：`runtime.tunnel_reconnect_backoff_max_secs`（デフォルト：60秒）
- 接続成功時にベース遅延にリセット

## 並行性制御

トンネルを通じたCLIタスク実行は`runtime.cli_max_concurrency`で制限されます：

```toml
[runtime]
cli_max_concurrency = 2  # Allow 2 concurrent CLI tasks (default: 1)
```

並行性制限を超えるタスクはセマフォの許可を待ちます。これにより、複数のタスクが連続してディスパッチされるときにマシンが過負荷になるのを防ぎます。

## 設定リファレンス

| フィールド | デフォルト | 説明 |
|-------|---------|-------------|
| `tunnel.enabled` | `false` | トンネルを有効/無効にする |
| `tunnel.url` | -- | WebSocket URL（`wss://`または`ws://`） |
| `tunnel.agent_id` | `openpr-webhook` | エージェント識別子 |
| `tunnel.auth_token` | -- | 認証のBearerトークン |
| `tunnel.reconnect_secs` | `3` | ベース再接続間隔 |
| `tunnel.heartbeat_secs` | `20` | ハートビート間隔（最小3秒） |
| `tunnel.hmac_secret` | -- | HMAC-SHA256署名シークレット |
| `tunnel.require_inbound_sig` | `false` | 署名なしのインバウンドメッセージを拒否 |

## セキュリティ注意

- プロダクションでは常に`wss://`を使用してください。`ws://`を使用するとサービスが警告をログに記録します。
- `auth_token`はWebSocketアップグレード中にHTTPヘッダーとして送信されます。TLSが使用されていることを確認してください。
- なりすましタスクディスパッチを防ぐために`hmac_secret`と共に`require_inbound_sig`を有効にしてください。
