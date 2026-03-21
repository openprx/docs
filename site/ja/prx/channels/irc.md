---
title: IRC
description: TLS 経由で PRX を IRC に接続
---

# IRC

> TLS 経由で Internet Relay Chat（IRC）サーバーに PRX を接続し、チャネル、DM、複数の認証方式をサポートします。

## 前提条件

- 接続先の IRC サーバー（例: Libera.Chat、OFTC、またはプライベートサーバー）
- ボット用のニックネーム
- TLS 対応の IRC サーバー（ポート 6697 が標準）

## クイックセットアップ

### 1. サーバーの選択とニックネームの登録（任意）

Libera.Chat などのパブリックネットワークでは、ボットのニックネームを NickServ に登録することを推奨:

```
/msg NickServ REGISTER <password> <email>
```

### 2. 設定

```toml
[channels_config.irc]
server = "irc.libera.chat"
port = 6697
nickname = "prx-bot"
channels = ["#my-channel"]
allowed_users = ["mynick", "*"]
```

NickServ 認証を使用する場合:

```toml
[channels_config.irc]
server = "irc.libera.chat"
port = 6697
nickname = "prx-bot"
channels = ["#my-channel", "#another-channel"]
allowed_users = ["*"]
nickserv_password = "your-nickserv-password"
```

### 3. 検証

```bash
prx channel doctor irc
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `server` | `String` | *必須* | IRC サーバーのホスト名（例: `"irc.libera.chat"`） |
| `port` | `u16` | `6697` | IRC サーバーポート（TLS の場合 6697） |
| `nickname` | `String` | *必須* | IRC ネットワーク上のボットニックネーム |
| `username` | `String` | *nickname* | IRC ユーザー名（未設定の場合はニックネームがデフォルト） |
| `channels` | `[String]` | `[]` | 接続時に参加する IRC チャネル（例: `["#channel1", "#channel2"]`） |
| `allowed_users` | `[String]` | `[]` | 許可するニックネーム（大文字小文字区別なし）。空 = すべて拒否。`"*"` = すべて許可 |
| `server_password` | `String` | `null` | サーバーパスワード（ZNC などのバウンサー用） |
| `nickserv_password` | `String` | `null` | ニックネーム認証用の NickServ IDENTIFY パスワード |
| `sasl_password` | `String` | `null` | IRCv3 認証用の SASL PLAIN パスワード |
| `verify_tls` | `bool` | `true` | サーバーの TLS 証明書を検証 |

## 機能

- **TLS 暗号化** -- すべての接続はセキュリティのため TLS を使用
- **複数の認証方式** -- サーバーパスワード、NickServ IDENTIFY、SASL PLAIN（IRCv3）をサポート
- **マルチチャネルサポート** -- 複数のチャネルに同時に参加して応答
- **チャネルと DM サポート** -- チャネル PRIVMSG とダイレクトメッセージの両方を処理
- **プレーンテキスト出力** -- レスポンスは IRC 向けに自動調整（Markdown やコードフェンスなし）
- **スマートメッセージ分割** -- 長いメッセージは IRC の行長制限を尊重して分割
- **接続キープアライブ** -- サーバーの PING メッセージに応答し、デッド接続を検出（5 分の読み取りタイムアウト）
- **単調メッセージ ID** -- バーストトラフィック時のユニークなメッセージ順序付けを保証

## 制限事項

- IRC はプレーンテキストのみ。Markdown、HTML、リッチフォーマットはサポートされない
- メッセージは IRC の行長制限の対象（通常、プロトコルオーバーヘッドを含めて 512 バイト）
- 組み込みのメディアまたはファイル共有機能なし
- タイムアウト内にサーバーが PING への応答を受信しない場合、接続が切断される可能性あり
- 一部の IRC ネットワークにはアンチフラッド対策があり、ボットのレートが制限される場合あり
- ニック変更とネットワークスプリット後の再接続は処理されるが、一時的な中断が発生する場合あり

## トラブルシューティング

### IRC サーバーに接続できない
- `server` ホスト名と `port` が正しいことを確認
- ポート 6697（TLS）がファイアウォールでブロックされていないことを確認
- 自己署名証明書を使用する場合は `verify_tls = false` を設定

### ボットがチャネルに参加するが応答しない
- 送信者のニックネームが `allowed_users` に含まれていることを確認（大文字小文字区別なし）
- テスト用に `allowed_users = ["*"]` を設定してすべてのユーザーを許可
- ボットがチャネルで発言権限を持っていることを確認（ミュートまたはバンされていないこと）

### NickServ 認証が失敗する
- `nickserv_password` が正しいことを確認
- ボットのニックネームは識別前に NickServ に登録されている必要あり
- 一部のネットワークでは NickServ の代わりに SASL 認証が必要。その場合は `sasl_password` を使用
