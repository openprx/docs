---
title: チャネル概要
description: PRX は 19 のメッセージングプラットフォームに接続します。全チャネルの概要、比較マトリクス、設定パターン、DM ポリシー。
---

# チャネル

チャネルは、PRX を外部世界に接続するメッセージングプラットフォーム統合です。各チャネルは、メッセージの送受信、メディアの処理、入力中インジケーターの管理、ヘルスチェックの実行のための統一インターフェースを実装します。PRX は単一のデーモンプロセスから複数のチャネルを同時に実行できます。

## 対応チャネル

PRX は、コンシューマープラットフォーム、エンタープライズツール、オープンソースプロトコル、開発者インターフェースにまたがる 19 のメッセージングチャネルをサポートしています。

### チャネル比較マトリクス

| チャネル | DM | グループ | メディア | 音声 | E2EE | プラットフォーム | 状態 |
|---------|:--:|:-----:|:-----:|:-----:|:----:|----------|:------:|
| [Telegram](./telegram) | 可 | 可 | 可 | 不可 | 不可 | クロスプラットフォーム | 安定 |
| [Discord](./discord) | 可 | 可 | 可 | 不可 | 不可 | クロスプラットフォーム | 安定 |
| [Slack](./slack) | 可 | 可 | 可 | 不可 | 不可 | クロスプラットフォーム | 安定 |
| [WhatsApp](./whatsapp) | 可 | 可 | 可 | 不可 | 可 | Cloud API | 安定 |
| [WhatsApp Web](./whatsapp-web) | 可 | 可 | 可 | 不可 | 可 | マルチデバイス | ベータ |
| [Signal](./signal) | 可 | 可 | 可 | 不可 | 可 | クロスプラットフォーム | 安定 |
| [iMessage](./imessage) | 可 | 可 | 可 | 不可 | 可 | macOS のみ | ベータ |
| [Matrix](./matrix) | 可 | 可 | 可 | 不可 | 可 | 連合型 | 安定 |
| [Email](./email) | 可 | 不可 | 可 | 不可 | 不可 | IMAP/SMTP | 安定 |
| [Lark / 飛書](./lark) | 可 | 可 | 可 | 不可 | 不可 | クロスプラットフォーム | 安定 |
| [DingTalk](./dingtalk) | 可 | 可 | 可 | 不可 | 不可 | クロスプラットフォーム | 安定 |
| [QQ](./qq) | 可 | 可 | 可 | 不可 | 不可 | クロスプラットフォーム | ベータ |
| [Mattermost](./mattermost) | 可 | 可 | 可 | 不可 | 不可 | セルフホスト | 安定 |
| [Nextcloud Talk](./nextcloud-talk) | 可 | 可 | 可 | 不可 | 不可 | セルフホスト | ベータ |
| [IRC](./irc) | 可 | 可 | 不可 | 不可 | 不可 | 連合型 | 安定 |
| [LINQ](./linq) | 可 | 可 | 可 | 不可 | 不可 | パートナー API | アルファ |
| [CLI](./cli) | 可 | 不可 | 不可 | 不可 | N/A | ターミナル | 安定 |
| Terminal | 可 | 不可 | 不可 | 不可 | N/A | ターミナル | 安定 |
| Wacli | 可 | 可 | 可 | 不可 | 可 | JSON-RPC | ベータ |

**凡例：**
- **安定** -- 本番環境対応、完全にテスト済み
- **ベータ** -- 機能するが既知の制限あり
- **アルファ** -- 実験的、API が変更される可能性あり

## 共通設定パターン

すべてのチャネルは `~/.config/openprx/openprx.toml` の `[channels]` セクションで設定します。各チャネルにはプラットフォーム固有の設定を持つ独自のサブセクションがあります。

### 基本構造

```toml
[channels]
# 組み込み CLI チャネルを有効化（デフォルト: true）
cli = true

# メッセージごとの処理タイムアウト（秒、デフォルト: 300）
message_timeout_secs = 300

# ── Telegram ──────────────────────────────────────────────
[channels.telegram]
bot_token = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
allowed_users = ["alice", "bob"]
stream_mode = "edit"            # "edit" | "append" | "none"
mention_only = false

# ── Discord ───────────────────────────────────────────────
[channels.discord]
bot_token = "MTIzNDU2Nzg5.XXXXXX.XXXXXXXXXX"
guild_id = "1234567890"         # オプション: 1 つのサーバーに制限
allowed_users = []              # 空 = すべて許可
listen_to_bots = false
mention_only = false

# ── Slack ─────────────────────────────────────────────────
[channels.slack]
bot_token = "xoxb-..."
app_token = "xapp-..."
allowed_users = []
mention_only = true
```

### チャネル固有の設定例

**Lark / 飛書：**

```toml
[channels.lark]
app_id = "cli_xxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = []
use_feishu = false              # true = 飛書（中国版）、false = Lark（国際版）
receive_mode = "websocket"      # "websocket" | "webhook"
mention_only = false
```

**Signal：**

```toml
[channels.signal]
phone_number = "+1234567890"
signal_cli_path = "/usr/local/bin/signal-cli"
allowed_users = ["+1987654321"]
```

**Matrix（E2EE 付き）：**

```toml
[channels.matrix]
homeserver_url = "https://matrix.org"
username = "@prx-bot:matrix.org"
password = "secure-password"
allowed_users = ["@alice:matrix.org"]
```

**Email（IMAP/SMTP）：**

```toml
[channels.email]
imap_host = "imap.gmail.com"
imap_port = 993
smtp_host = "smtp.gmail.com"
smtp_port = 587
username = "prx-bot@gmail.com"
password = "app-specific-password"
allowed_from = ["alice@example.com"]
```

**DingTalk：**

```toml
[channels.dingtalk]
app_key = "dingxxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxx"
robot_code = "dingxxxxxxxxx"
allowed_users = []
```

## DM ポリシー

PRX は、エージェントにダイレクトメッセージを送信できるユーザーを細かく制御できます。DM ポリシーはチャネルごとに設定し、受信ダイレクトメッセージの処理方法を決定します。

### ポリシータイプ

| ポリシー | 動作 |
|--------|----------|
| `pairing` | 送信者が受け入れられる前にペアリングハンドシェイクが必要。ユーザーは認証のためにチャレンジレスポンスフローを完了する必要がある。将来の機能 -- 現在は `allowlist` にフォールバック。 |
| `allowlist` | **（デフォルト）** チャネルの `allowed_users` 配列にリストされた送信者のみがエージェントとやり取りできる。リストされていない送信者からのメッセージは無視される。 |
| `open` | 任意のユーザーがエージェントにダイレクトメッセージを送信できる。本番環境では注意して使用。 |
| `disabled` | すべてのダイレクトメッセージを無視。PRX がグループ内でのみ応答すべき場合に便利。 |

### 設定

DM ポリシーはチャネル設定のトップレベルで設定します：

```toml
[channels]
dm_policy = "allowlist"         # "pairing" | "allowlist" | "open" | "disabled"
```

各チャネルの `allowed_users` 配列がそのチャネルの許可リストになります：

```toml
[channels.telegram]
bot_token = "..."
allowed_users = ["alice", "bob"]  # これらのユーザーのみ DM 可能
```

`dm_policy = "open"` の場合、`allowed_users` フィールドは無視され、すべての送信者が受け入れられます。

## グループポリシー

DM ポリシーと同様に、PRX はエージェントが参加するグループ会話も制御します：

| ポリシー | 動作 |
|--------|----------|
| `allowlist` | **（デフォルト）** チャネルのグループ許可リストにリストされたグループのみ監視。 |
| `open` | エージェントが追加されたすべてのグループで応答。 |
| `disabled` | すべてのグループメッセージを無視。 |

```toml
[channels]
group_policy = "allowlist"

[channels.telegram]
bot_token = "..."
# グループの許可リストはチャネルごとに設定
```

## メンション限定モード

ほとんどのチャネルは `mention_only` フラグをサポートしています。有効にすると、エージェントは明示的にメンションされたメッセージ（@メンション、リプライ、プラットフォーム固有のトリガー）にのみ応答します。グループチャットで全メッセージに応答するのを避けるのに便利です。

```toml
[channels.discord]
bot_token = "..."
mention_only = true   # @メンション時のみ応答
```

## ストリームモード

一部のチャネルはリアルタイムでの LLM レスポンスストリーミングをサポートしています。`stream_mode` 設定はストリーミング出力の表示方法を制御します：

| モード | 動作 |
|------|----------|
| `edit` | トークンが到着するたびに同じメッセージを編集（Telegram、Discord） |
| `append` | メッセージに新しいテキストを追加 |
| `none` | 完全なレスポンスを待ってから送信 |

```toml
[channels.telegram]
bot_token = "..."
stream_mode = "edit"
draft_update_interval_ms = 1000   # ドラフト更新の頻度（ms）
```

## 新しいチャネルの追加

PRX チャネルは `Channel` トレイトに基づいています。新しいチャネルを接続するには：

1. `openprx.toml` にチャネル設定を追加
2. デーモンを再起動: `prx daemon`

あるいは、対話型チャネルウィザードを使用：

```bash
prx channel add telegram
```

アクティブなチャネルの一覧：

```bash
prx channel list
```

チャネル接続の問題を診断：

```bash
prx channel doctor
```

## チャネルアーキテクチャ

内部的には、各チャネルは：

1. プラットフォームからの受信メッセージを**リッスン**（ポーリング、Webhook、WebSocket 経由）
2. DM/グループポリシーと許可リストに基づいてメッセージを**フィルタ**
3. 受け入れたメッセージを処理のためにエージェントループに**ルーティング**
4. プラットフォームの API を通じてエージェントの応答を**送信**
5. ヘルスステータスを**レポート**し、指数バックオフで自動再接続

すべてのチャネルはデーモンプロセス内で並行して実行され、エージェントランタイム、メモリ、ツールサブシステムを共有します。

## 次のステップ

チャネルを選択して、固有のセットアップについて学びましょう：

- [Telegram](./telegram) -- Bot API 統合
- [Discord](./discord) -- スラッシュコマンド付きボット
- [Slack](./slack) -- Socket Mode 対応 Slack アプリ
- [WhatsApp](./whatsapp) -- Cloud API 統合
- [Signal](./signal) -- Signal CLI ブリッジ
- [Matrix](./matrix) -- E2EE 対応の連合型チャット
- [Lark / 飛書](./lark) -- エンタープライズメッセージング
- [Email](./email) -- IMAP/SMTP 統合
