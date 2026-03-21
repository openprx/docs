---
title: WebSocket
description: リアルタイムストリーミングエージェントインタラクションのための WebSocket インターフェース
---

# WebSocket

PRX ゲートウェイは、エージェントセッションとのリアルタイム双方向通信のための WebSocket エンドポイントを提供します。ストリーミングレスポンス、ライブツール実行更新、インタラクティブな会話を可能にします。

## 接続

以下の WebSocket エンドポイントに接続します:

```
ws://127.0.0.1:3120/ws/sessions/:id
```

## メッセージプロトコル

メッセージは `type` フィールドを持つ JSON オブジェクトとして交換されます:

### クライアントからサーバーへ

- `message` -- ユーザーメッセージを送信
- `cancel` -- 現在のエージェント操作をキャンセル
- `ping` -- キープアライブ ping

### サーバーからクライアントへ

- `token` -- ストリーミングレスポンストークン
- `tool_call` -- エージェントがツールを呼び出し中
- `tool_result` -- ツール実行が完了
- `done` -- エージェントレスポンスが完了
- `error` -- エラーが発生
- `pong` -- キープアライブレスポンス

## 設定

```toml
[gateway.websocket]
max_connections = 100
ping_interval_secs = 30
max_message_size_kb = 1024
```

## 関連ページ

- [ゲートウェイ概要](./)
- [HTTP API](./http-api)
