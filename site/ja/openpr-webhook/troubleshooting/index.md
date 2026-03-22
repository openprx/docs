---
title: トラブルシューティング
description: "OpenPR-Webhookの一般的な問題：401エラー、ボットタスクフィルタリング、エージェントマッチング、CLIエージェント、トンネル接続、コールバック失敗の解決策。"
---

# トラブルシューティング

## 一般的な問題

### Webhook POSTで401 Unauthorized

**症状：** すべてのWebhookリクエストがHTTP 401を返す。

**原因：**

1. **署名ヘッダーがない。** リクエストに`X-Webhook-Signature`または`X-OpenPR-Signature`を`sha256={hex-digest}`フォーマットで含める必要があります。

2. **間違ったシークレット。** HMAC-SHA256ダイジェストは`security.webhook_secrets`のシークレットの1つと一致する必要があります。送信側と受信側が同じシークレット文字列を使用していることを確認してください。

3. **ボディの不一致。** 署名は生のリクエストボディで計算されます。プロキシやミドルウェアがボディを変更する場合（例：JSONの再エンコード）、署名が一致しません。

**デバッグ：**

```bash
# Enable debug logging
RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml

# Temporarily allow unsigned requests for testing
# (config.toml)
[security]
allow_unsigned = true
```

### イベントが無視される（not_bot_task）

**症状：** レスポンスが`{"status": "ignored", "reason": "not_bot_task"}`。

**原因：** WebhookペイロードにBE`bot_context.is_bot_task = true`が含まれていません。OpenPR-Webhookはボットタスクとして明示的にマークされたイベントのみを処理します。

**修正：** OpenPRプラットフォームがWebhookペイロードにボットコンテキストを含めるように設定されていることを確認してください：

```json
{
  "event": "issue.updated",
  "bot_context": {
    "is_bot_task": true,
    "bot_name": "my-agent",
    "bot_agent_type": "cli"
  },
  "data": { ... }
}
```

### エージェントが見つからない

**症状：** レスポンスが`{"status": "no_agent", "bot_name": "..."}`.

**原因：** 設定済みのエージェントがペイロードの`bot_name`または`bot_agent_type`にマッチしません。

**修正：**

1. `bot_name`値にマッチする`id`または`name`を持つエージェントが設定されていることを確認
2. エージェントの`agent_type`が`bot_agent_type`と一致することを確認
3. エージェント名マッチングは大文字小文字を区別しないが、`id`マッチングは完全一致

### CLIエージェントが「disabled」を返す

**症状：** CLIディスパッチが`"cli disabled by feature flag or safe mode"`を返す。

**原因：**

1. `features.cli_enabled`が`true`に設定されていない
2. `OPENPR_WEBHOOK_SAFE_MODE`環境変数が設定されている

**修正：**

```toml
[features]
cli_enabled = true
```

セーフモードがアクティブでないことを確認：

```bash
echo $OPENPR_WEBHOOK_SAFE_MODE
# Should be empty or unset
```

### CLIエグゼキュータ「not allowed」

**症状：** エラーメッセージ`"executor not allowed: {name}"`。

**原因：** CLIエージェント設定の`executor`フィールドにホワイトリストにない値が含まれています。

**許可されるエグゼキュータ：**
- `codex`
- `claude-code`
- `opencode`

セキュリティ上の理由から、その他の値は拒否されます。

### トンネル接続に失敗する

**症状：** ログメッセージが`tunnel connect failed: ...`を繰り返し表示する。

**原因：**

1. **無効なURL。** トンネルURLは`wss://`または`ws://`で始まる必要があります。
2. **ネットワークの問題。** コントロールプレーンサーバーに到達できることを確認。
3. **認証の失敗。** `tunnel.auth_token`が正しいことを確認。
4. **必須フィールドの欠如。** `tunnel.agent_id`と`tunnel.auth_token`の両方が空でない必要があります。

**デバッグ：**

```bash
# Test WebSocket connectivity manually
# (requires wscat or websocat)
wscat -c wss://control.example.com/ws -H "Authorization: Bearer your-token"
```

### トンネルが再接続し続ける

**症状：** ログが`tunnel disconnected, reconnecting in Ns`をループで表示する。

**正常な動作：** トンネルは指数バックオフで自動再接続します（`tunnel_reconnect_backoff_max_secs`まで）。コントロールプレーンのログで切断理由を確認してください。

**チューニング：**

```toml
[tunnel]
reconnect_secs = 3        # Base retry interval
heartbeat_secs = 20       # Keep-alive interval

[runtime]
tunnel_reconnect_backoff_max_secs = 120  # Max backoff
```

### コールバックの失敗

**症状：** ログが`start callback failed: ...`または`final callback failed: ...`を表示する。

**原因：**

1. **callback_enabledがfalse。** コールバックには`features.callback_enabled = true`が必要。
2. **無効なcallback_url。** URLが到達可能であることを確認。
3. **認証の失敗。** コールバックエンドポイントが認証を要求する場合は`callback_token`を設定。
4. **タイムアウト。** デフォルトのHTTPタイムアウトは15秒。`runtime.http_timeout_secs`で増加させる。

### OpenClaw/カスタムエージェントの実行エラー

**症状：** レスポンスに`exec_error: ...`または`error: ...`が含まれる。

**原因：**

1. **バイナリが見つからない。** `command`パスが存在して実行可能であることを確認。
2. **権限が拒否された。** openpr-webhookプロセスに実行権限が必要。
3. **依存関係の欠如。** CLIツールに他のプログラムやライブラリが必要な場合がある。

**デバッグ：**

```bash
# Test the command manually
/usr/local/bin/openclaw --channel signal --target "+1234567890" --message "test"
```

## 診断チェックリスト

1. **サービスのヘルスを確認：**
   ```bash
   curl http://localhost:9000/health
   # Should return: ok
   ```

2. **ロードされたエージェントを確認：**
   起動ログの`Loaded N agent(s)`を確認。

3. **デバッグログを有効化：**
   ```bash
   RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml
   ```

4. **署名を手動で確認：**
   ```bash
   echo -n '{"event":"test"}' | openssl dgst -sha256 -hmac "your-secret"
   ```

5. **未署名リクエストでテスト（開発のみ）：**
   ```toml
   [security]
   allow_unsigned = true
   ```

6. **セーフモードのステータスを確認：**
   ```bash
   # If set, tunnel/cli/callback are force-disabled
   echo $OPENPR_WEBHOOK_SAFE_MODE
   ```

## ログメッセージリファレンス

| ログレベル | メッセージ | 意味 |
|-----------|---------|---------|
| INFO | `Loaded N agent(s)` | 設定が正常にロードされた |
| INFO | `openpr-webhook listening on ...` | サーバーが起動した |
| INFO | `Received webhook event: ...` | インバウンドイベントが解析された |
| INFO | `Dispatching to agent: ...` | エージェントがマッチし、ディスパッチ中 |
| INFO | `tunnel connected: ...` | WSSトンネルが確立された |
| WARN | `Invalid webhook signature` | 署名検証が失敗した |
| WARN | `No agent for bot_name=...` | マッチするエージェントが見つからない |
| WARN | `tunnel disconnected, reconnecting` | トンネル接続が失われた |
| WARN | `tunnel using insecure ws:// transport` | TLSを使用していない |
| ERROR | `tunnel connect failed: ...` | WebSocket接続エラー |
| ERROR | `openclaw failed: ...` | OpenClawコマンドがゼロ以外で終了した |
