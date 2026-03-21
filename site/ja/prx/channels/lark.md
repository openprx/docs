---
title: Lark / 飛書
description: PRX を Lark（国際版）または飛書（中国版）に接続
---

# Lark / 飛書

> Open Platform API を使用して、WebSocket ロングコネクションまたは HTTP Webhook イベント配信により、PRX を Lark（国際版）または飛書（中国本土版）に接続します。

## 前提条件

- Lark または飛書のテナント（組織）
- [Lark デベロッパーコンソール](https://open.larksuite.com/app)または[飛書デベロッパーコンソール](https://open.feishu.cn/app)で作成されたアプリ
- デベロッパーコンソールから取得した App ID、App Secret、Verification Token

## クイックセットアップ

### 1. ボットアプリの作成

1. デベロッパーコンソールで新しいカスタムアプリを作成
2. 「資格情報」で **App ID** と **App Secret** をコピー
3. 「イベントサブスクリプション」で **Verification Token** をコピー
4. ボット機能を追加し、権限を設定:
   - `im:message`、`im:message.group_at_msg`、`im:message.p2p_msg`

### 2. 設定

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
verification_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["ou_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"]
```

飛書（中国版）の場合:

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
verification_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
use_feishu = true
allowed_users = ["*"]
```

### 3. 検証

```bash
prx channel doctor lark
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `app_id` | `String` | *必須* | Lark/飛書デベロッパーコンソールの App ID |
| `app_secret` | `String` | *必須* | デベロッパーコンソールの App Secret |
| `verification_token` | `String` | `null` | Webhook 検証用の Verification Token |
| `encrypt_key` | `String` | `null` | Webhook メッセージ復号用の Encrypt Key |
| `allowed_users` | `[String]` | `[]` | 許可するユーザー ID または Union ID。空 = すべて拒否。`"*"` = すべて許可 |
| `mention_only` | `bool` | `false` | true の場合、グループではメンション時のみ応答。DM は常に処理 |
| `use_feishu` | `bool` | `false` | true の場合、Lark（国際版）の代わりに飛書（中国版）の API エンドポイントを使用 |
| `receive_mode` | `String` | `"websocket"` | イベント受信モード: `"websocket"`（デフォルト、パブリック URL 不要）または `"webhook"` |
| `port` | `u16` | `null` | Webhook モード専用の HTTP ポート。`receive_mode = "webhook"` 時に必須、WebSocket では無視 |

## 機能

- **WebSocket ロングコネクション** -- パブリック URL 不要で、リアルタイムイベントのための永続 WSS 接続（デフォルトモード）
- **HTTP Webhook モード** -- 必要な環境向けの HTTP コールバックによる代替イベント配信
- **Lark と飛書サポート** -- Lark（国際版）と飛書（中国版）の API エンドポイントを自動切り替え
- **確認リアクション** -- ロケールに応じたリアクションで受信メッセージに反応（zh-CN、zh-TW、en、ja）
- **DM とグループメッセージング** -- プライベートチャットとグループ会話の両方を処理
- **テナントアクセストークン管理** -- テナントアクセストークンを自動取得・更新
- **メッセージ重複排除** -- 30 分間のウィンドウ内で WebSocket メッセージの二重ディスパッチを防止

## 制限事項

- WebSocket モードには Lark/飛書サーバーへの安定したアウトバウンド接続が必要
- Webhook モードにはパブリックにアクセス可能な HTTPS エンドポイントが必要
- ボットがグループメッセージを受信するには、事前にグループに追加されている必要あり
- 飛書と Lark は異なる API ドメインを使用。`use_feishu` がテナントリージョンに一致していることを確認
- テナントの管理ポリシーにより、エンタープライズアプリの承認が必要な場合あり

## トラブルシューティング

### ボットがメッセージを受信しない
- WebSocket モードでは、`open.larksuite.com`（または `open.feishu.cn`）へのアウトバウンド接続が許可されていることを確認
- アプリに必要な `im:message` 権限があり、承認/公開されていることを確認
- ボットがグループに追加されているか、ユーザーがボットとの DM を開始していることを確認

### Webhook イベントで「Verification failed」
- `verification_token` がデベロッパーコンソールの値と一致していることを確認
- `encrypt_key` を使用している場合、コンソールの設定と完全に一致していることを確認

### API リージョンの誤り
- 飛書（中国版）テナントを使用する場合は `use_feishu = true` を設定
- Lark（国際版）テナントを使用する場合は `use_feishu = false`（デフォルト）であることを確認
