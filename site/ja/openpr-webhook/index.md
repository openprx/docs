---
title: OpenPR-Webhook
description: "OpenPR-WebhookはOpenPRプラットフォームのWebhookイベントディスパッチャーサービスです。HMAC-SHA256署名検証、ボットタスクフィルタリング、5種類のエージェントタイプをサポート。"
---

# OpenPR-Webhook

OpenPR-Webhookは[OpenPR](https://github.com/openprx/openpr)向けのWebhookイベントディスパッチャーサービスです。OpenPRプラットフォームからWebhookイベントを受信し、ボットコンテキストに基づいてフィルタリングし、処理のために1つ以上の設定可能なエージェントにルーティングします。

## 機能概要

OpenPRでイベントが発生すると（例：イシューが作成または更新された）、プラットフォームはこのサービスにWebhookのPOSTリクエストを送信します。OpenPR-Webhookは以下を実行します：

1. **リクエストを検証** -- HMAC-SHA256署名検証を使用
2. **イベントをフィルタリング** -- `bot_context.is_bot_task = true`のイベントのみが処理される
3. **エージェントにルーティング** -- 名前またはタイプで設定済みエージェントにイベントをマッチング
4. **ディスパッチ** -- エージェントのアクションを実行（メッセージ送信、CLIツール呼び出し、別のWebhookへの転送など）

## アーキテクチャ概要

```
OpenPRプラットフォーム
    |
    | POST /webhook (HMAC-SHA256 署名済み)
    v
+-------------------+
| openpr-webhook    |
|                   |
| 署名検証           |
| イベントフィルタ    |
| エージェントマッチ  |
+-------------------+
    |           |           |
    v           v           v
 openclaw    webhook     cli agent
 (Signal/    (HTTP       (codex /
  Telegram)  forward)    claude-code)
```

## 主要機能

- **HMAC-SHA256署名検証** -- マルチシークレットローテーションサポート付き
- **ボットタスクフィルタリング** -- ボット向けでないイベントをサイレントに無視
- **5種類のエージェント/エグゼキュータタイプ** -- openclaw、openprx、webhook、custom、cli
- **メッセージテンプレート** -- 柔軟な通知フォーマットのプレースホルダー変数
- **状態遷移** -- タスク開始、成功、失敗時にイシュー状態を自動更新
- **WSSトンネル**（フェーズB） -- プッシュベースのタスクディスパッチのためのコントロールプレーンへのアクティブなWebSocket接続
- **MCP クローズドループ自動化** -- AIエージェントがイシューのフルコンテキストを読み取り、OpenPR MCPツールを通じて結果を書き戻す
- **エージェントごとの環境変数** -- エージェントごとに`OPENPR_BOT_TOKEN`、`OPENPR_API_URL`などを注入
- **安全ファースト設計** -- 危険な機能（トンネル、cli、コールバック）はデフォルトでオフ、フィーチャーフラグとセーフモードで制御

## サポートされるエージェントタイプ

| タイプ | 目的 | プロトコル |
|------|---------|----------|
| `openclaw` | OpenClaw CLIを通じてSignal/Telegramで通知を送信 | シェルコマンド |
| `openprx` | OpenPRX Signal APIまたはCLIでメッセージを送信 | HTTP API / Shell |
| `webhook` | 完全なイベントペイロードをHTTPエンドポイントに転送 | HTTP POST |
| `custom` | メッセージを引数として任意のシェルコマンドを実行 | シェルコマンド |
| `cli` | イシューに対してAIコーディングエージェント（codex、claude-code、opencode）を実行 | サブプロセス |

## クイックリンク

- [インストール](getting-started/installation.md)
- [クイックスタート](getting-started/quickstart.md)
- [エージェントタイプ](agents/index.md)
- [エグゼキュータリファレンス](agents/executors.md)
- [WSSトンネル](tunnel/index.md)
- [設定リファレンス](configuration/index.md)
- [トラブルシューティング](troubleshooting/index.md)

## リポジトリ

ソースコード：[github.com/openprx/openpr-webhook](https://github.com/openprx/openpr-webhook)

ライセンス：MIT OR Apache-2.0
