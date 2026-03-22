---
title: クイックスタート
description: "シンプルなWebhook転送エージェントでOpenPR-Webhookをセットアップし、シミュレートされたイベントでテスト。"
---

# クイックスタート

このガイドでは、シンプルなWebhook転送エージェントでOpenPR-Webhookをセットアップし、シミュレートされたイベントでテストする方法を説明します。

## ステップ1: 設定を作成

`config.toml`という名前のファイルを作成：

```toml
[server]
listen = "0.0.0.0:9000"

[security]
webhook_secrets = ["my-test-secret"]

[[agents]]
id = "echo-agent"
name = "Echo Agent"
agent_type = "webhook"

[agents.webhook]
url = "https://httpbin.org/post"
```

この設定は：

- ポート9000でリッスン
- シークレット`my-test-secret`を使用したHMAC-SHA256署名を要求
- テスト用にhttpbin.orgにボットイベントをルーティング

## ステップ2: サービスを起動

```bash
./target/release/openpr-webhook config.toml
```

以下のメッセージが表示されるはずです：

```
INFO openpr_webhook: Loaded 1 agent(s)
INFO openpr_webhook: tunnel subsystem disabled (feature flag or safe mode)
INFO openpr_webhook: openpr-webhook listening on 0.0.0.0:9000
```

## ステップ3: テストイベントを送信

テストペイロードのHMAC-SHA256署名を生成して送信：

```bash
# The test payload
PAYLOAD='{"event":"issue.updated","bot_context":{"is_bot_task":true,"bot_name":"echo-agent","bot_agent_type":"webhook"},"data":{"issue":{"id":"42","key":"PROJ-42","title":"Fix login bug"}},"actor":{"name":"alice"},"project":{"name":"backend"}}'

# Compute HMAC-SHA256 signature
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

# Send the webhook
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

期待されるレスポンス：

```json
{
  "status": "dispatched",
  "agent": "echo-agent",
  "result": "webhook: 200 OK"
}
```

## ステップ4: フィルタリングをテスト

`bot_context.is_bot_task = true`のないイベントはサイレントに無視されます：

```bash
PAYLOAD='{"event":"issue.created","data":{"issue":{"id":"1"}}}'
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

レスポンス：

```json
{
  "status": "ignored",
  "reason": "not_bot_task"
}
```

## ステップ5: 署名拒否をテスト

無効な署名はHTTP 401を返します：

```bash
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=invalid" \
  -d '{"event":"test"}'
```

レスポンス：`401 Unauthorized`

## エージェントマッチングの理解

`is_bot_task = true`でWebhookイベントが届くと、サービスは以下のロジックでエージェントをマッチングします：

1. **名前によるマッチ** -- `bot_context.bot_name`がエージェントの`id`または`name`と一致する場合（大文字小文字を区別しない）
2. **タイプによるフォールバック** -- 名前マッチがなければ、`agent_type`が`bot_context.bot_agent_type`と一致する最初のエージェントを使用

エージェントがマッチしない場合、レスポンスには`"status": "no_agent"`が含まれます。

## 次のステップ

- [エージェントタイプ](../agents/index.md) -- 5つのエージェントタイプすべてについて学ぶ
- [エグゼキュータリファレンス](../agents/executors.md) -- 各エグゼキュータの詳細
- [設定リファレンス](../configuration/index.md) -- 完全なTOMLスキーマ
