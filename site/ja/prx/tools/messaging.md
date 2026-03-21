---
title: メッセージング
description: 自動ルーティングと低レベルゲートウェイアクセスによるコミュニケーションチャネルを通じたメッセージ送信ツール。
---

# メッセージング

PRX は、エージェントがコミュニケーションチャネルを通じてメッセージを送り返すための 2 つのメッセージングツールを提供します。`message_send` ツールは、設定された任意のチャネルにテキスト、メディア、音声メッセージを送信するための高レベルインターフェースで、`gateway` ツールは生のメッセージ配信のための Axum HTTP/WebSocket ゲートウェイへの低レベルアクセスを提供します。

メッセージングツールはゲートウェイレベルで登録され、チャネルがアクティブな場合に利用可能です。`message_send` ツールはアクティブなチャネル（Telegram、Discord、Slack、CLI など）にメッセージを自動ルーティングし、`gateway` ツールは高度なユースケース向けに直接ゲートウェイプロトコルアクセスを提供します。

これらのツールはインバウンドチャネルシステムを補完します。チャネルがユーザーからのメッセージの受信とエージェントへのルーティングを処理する一方、メッセージングツールはアウトバウンド方向 -- エージェント生成コンテンツのユーザーへの送信 -- を処理します。

## 設定

メッセージングツールには専用の設定セクションがありません。その利用可能性はチャネルとゲートウェイの設定に依存します:

```toml
# ゲートウェイ設定（メッセージングツールはこれに依存）
[gateway]
host = "127.0.0.1"
port = 16830

# チャネル設定（message_send はアクティブなチャネルにルーティング）
[channels_config]
cli = true
message_timeout_secs = 300

[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["alice", "bob"]
stream_mode = "partial"
```

`message_send` ツールは少なくとも 1 つのチャネルがアクティブな場合に利用可能です。`gateway` ツールは常に `all_tools()` に登録されています。

## ツールリファレンス

### message_send

設定された任意のチャネルと受信者にメッセージを送信します。ツールはアクティブなチャネル -- 現在の会話が行われているチャネル -- に自動ルーティングします。

**テキストメッセージを送信:**

```json
{
  "name": "message_send",
  "arguments": {
    "text": "The build completed successfully. All 42 tests passed.",
    "channel": "telegram"
  }
}
```

**メディア（画像/ファイル）を送信:**

```json
{
  "name": "message_send",
  "arguments": {
    "media_path": "/tmp/screenshot.png",
    "caption": "Current dashboard state",
    "channel": "telegram"
  }
}
```

**音声メッセージを送信:**

```json
{
  "name": "message_send",
  "arguments": {
    "voice_path": "/tmp/summary.mp3",
    "channel": "telegram"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `text` | `string` | 条件付き | -- | テキストメッセージの内容（メディア/音声がない場合必須） |
| `channel` | `string` | いいえ | アクティブチャネル | ターゲットチャネル名（省略時は自動検出） |
| `recipient` | `string` | いいえ | 現在のユーザー | 受信者識別子（ユーザー ID、チャット ID など） |
| `media_path` | `string` | いいえ | -- | メディアファイルのパス（画像、ドキュメント、動画） |
| `caption` | `string` | いいえ | -- | メディアメッセージのキャプション |
| `voice_path` | `string` | いいえ | -- | 音声/オーディオファイルのパス |
| `reply_to` | `string` | いいえ | -- | 返信先のメッセージ ID（プラットフォーム固有） |

### gateway

生メッセージを Axum HTTP/WebSocket ゲートウェイ経由で送信するための低レベルゲートウェイアクセス。`message_send` では不十分な高度なユースケース向けです。

```json
{
  "name": "gateway",
  "arguments": {
    "action": "send",
    "payload": {
      "type": "text",
      "content": "Raw gateway message",
      "target": "ws://localhost:16830/ws"
    }
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `action` | `string` | はい | -- | ゲートウェイアクション: `"send"`、`"broadcast"`、`"status"` |
| `payload` | `object` | 条件付き | -- | メッセージペイロード（`"send"` と `"broadcast"` で必須） |

## 使用方法

### 自動チャネルルーティング

ほとんどの場合、エージェントはチャネルを指定する必要がありません。ユーザーが Telegram でメッセージを送信すると、エージェントの応答は自動的に Telegram にルーティングされます:

```
ユーザー（Telegram 経由）: 天気はどうですか？
エージェント: [message_send を呼び出し: text="現在上海は 22 度で晴れです。"]
       → 自動的に同じチャットの Telegram に送信
```

### クロスチャネルメッセージング

エージェントは会話が行われているのとは異なるチャネルにメッセージを送信できます:

```json
{
  "name": "message_send",
  "arguments": {
    "text": "Build failed! Check CI logs.",
    "channel": "discord",
    "recipient": "111222333"
  }
}
```

これは、エージェントが 1 つのチャネルを監視し、別のチャネルにアラートを送信する通知ワークフローに便利です。

### メディア配信

エージェントはメッセージングチャネルを通じてファイル、画像、オーディオを送信できます:

1. メディアファイルを生成またはダウンロード
2. 一時パスに保存
3. `media_path` 付きの `message_send` で送信

```
エージェントの思考: ユーザーがデータのチャートを求めている。
  1. [shell] python3 generate_chart.py --output /tmp/chart.png
  2. [message_send] media_path="/tmp/chart.png", caption="Monthly revenue chart"
```

### 音声メッセージ

音声をサポートするチャネル（Telegram、WhatsApp、Discord）では、エージェントはオーディオメッセージを送信できます:

```
エージェントの思考: ユーザーが音声要約を求めている。
  1. [tts] text="Here is your daily summary..." output="/tmp/summary.mp3"
  2. [message_send] voice_path="/tmp/summary.mp3"
```

## チャネルルーティングの詳細

`message_send` が明示的な `channel` パラメーターなしで呼び出された場合、PRX は以下のロジックでターゲットチャネルを決定します:

1. **アクティブセッションチャネル**: 現在のエージェントセッションに関連付けられたチャネル（受信メッセージによってセッションが作成されたときに設定）
2. **デフォルトチャネル**: セッションチャネルが設定されていない場合、最初のアクティブチャネルにフォールバック
3. **CLI フォールバック**: チャネルが設定されていない場合、出力は stdout に

### サポートされるチャネルトランスポート

| チャネル | テキスト | メディア | 音声 | 返信 |
|---------|:----:|:-----:|:-----:|:-----:|
| Telegram | 可 | 可 | 可 | 可 |
| Discord | 可 | 可 | 可 | 可 |
| Slack | 可 | 可 | 不可 | 可 |
| WhatsApp | 可 | 可 | 可 | 可 |
| Signal | 可 | 可 | 不可 | 可 |
| Matrix | 可 | 可 | 不可 | 可 |
| Email | 可 | 可（添付） | 不可 | 可 |
| CLI | 可 | 不可 | 不可 | 不可 |

## セキュリティ

### チャネル認可

アウトバウンドメッセージはインバウンドメッセージと同じチャネルポリシーの対象です。エージェントは設定済みでアクティブなチャネルにのみメッセージを送信できます。未設定のチャネルへの送信を試みるとエラーが返されます。

### 受信者検証

`recipient` が指定された場合、PRX はターゲットチャネルを通じて受信者が到達可能であることを検証します。`allowed_users` リストを持つチャネルでは、リストにない受信者へのアウトバウンドメッセージはブロックされます。

### レート制限

アウトバウンドメッセージはチャネルのレート制限（プラットフォームごとに設定）の対象です。例えば、Telegram は PRX が自動バックオフで尊重する API レート制限を強制します。

### ポリシーエンジン

メッセージングツールはセキュリティポリシーで制御できます:

```toml
[security.tool_policy.tools]
message_send = "allow"
gateway = "supervised"     # 生ゲートウェイアクセスには承認を要求
```

### 監査ログ

すべてのアウトバウンドメッセージが監査ログに記録されます:

- ターゲットチャネルと受信者
- メッセージタイプ（テキスト、メディア、音声）
- タイムスタンプ
- 配信ステータス

メディアファイルパスはログに記録されますが、ファイル内容は監査ログに保存されません。

## 関連

- [チャネル概要](/ja/prx/channels/) -- 全 19 サポートメッセージングプラットフォーム
- [ゲートウェイ](/ja/prx/gateway/) -- HTTP API と WebSocket アーキテクチャ
- [ゲートウェイ HTTP API](/ja/prx/gateway/http-api) -- REST API エンドポイント
- [ゲートウェイ WebSocket](/ja/prx/gateway/websocket) -- リアルタイムストリーミング
- [レンダリングツール（TTS）](/ja/prx/tools/media) -- 音声メッセージ用テキスト読み上げ
- [ツール概要](/ja/prx/tools/) -- 全ツールとレジストリシステム
