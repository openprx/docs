---
title: DingTalk
description: Stream Mode を使用して PRX を DingTalk（Alibaba）に接続
---

# DingTalk

> DingTalk の Stream Mode WebSocket API を使用して PRX を接続し、Alibaba のワークプレースプラットフォームでリアルタイムボットメッセージングを実現します。

## 前提条件

- DingTalk 組織（企業またはチーム）
- [DingTalk デベロッパーコンソール](https://open-dev.dingtalk.com/)で作成されたボットアプリケーション
- デベロッパーコンソールから取得した Client ID（AppKey）と Client Secret（AppSecret）

## クイックセットアップ

### 1. DingTalk ボットの作成

1. [DingTalk Open Platform](https://open-dev.dingtalk.com/) にアクセスしてサインイン
2. 新しい「企業内部アプリケーション」（または「H5 マイクロアプリケーション」）を作成
3. アプリケーションに「ロボット」機能を追加
4. 「資格情報」で **Client ID**（AppKey）と **Client Secret**（AppSecret）をコピー
5. ボット設定で「Stream Mode」を有効化

### 2. 設定

```toml
[channels_config.dingtalk]
client_id = "dingxxxxxxxxxxxxxxxxxx"
client_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["manager1234"]
```

### 3. 検証

```bash
prx channel doctor dingtalk
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `client_id` | `String` | *必須* | DingTalk デベロッパーコンソールの Client ID（AppKey） |
| `client_secret` | `String` | *必須* | デベロッパーコンソールの Client Secret（AppSecret） |
| `allowed_users` | `[String]` | `[]` | 許可する DingTalk スタッフ ID。空 = すべて拒否。`"*"` = すべて許可 |

## 機能

- **Stream Mode WebSocket** -- DingTalk のゲートウェイへの永続 WebSocket 接続でリアルタイムメッセージ配信
- **パブリック URL 不要** -- Stream Mode はアウトバウンド接続を確立するため、インバウンド Webhook の設定不要
- **プライベートチャットとグループチャット** -- 1:1 の会話とグループチャットメッセージの両方を処理
- **セッション Webhook** -- DingTalk が提供するメッセージごとのセッション Webhook URL を使用して返信
- **ゲートウェイ自動登録** -- DingTalk のゲートウェイに登録して WebSocket エンドポイントとチケットを取得
- **会話タイプ検出** -- プライベートチャットとグループ会話を区別

## 制限事項

- Stream Mode には DingTalk サーバーへの安定したアウトバウンド WebSocket 接続が必要
- 返信にはメッセージごとのセッション Webhook を使用するため、速やかに使用しないと期限切れの可能性あり
- ボットがグループメッセージを受信するには、管理者がグループチャットにボットを追加する必要あり
- DingTalk API は主に中国語でドキュメント化されており、国際サポートは限定的
- 内部アプリケーションの展開には企業管理者の承認が必要な場合あり

## トラブルシューティング

### ボットが DingTalk に接続できない
- `client_id` と `client_secret` が正しいことを確認
- DingTalk デベロッパーコンソールのボット設定で「Stream Mode」が有効になっていることを確認
- DingTalk サーバーへのアウトバウンド接続がファイアウォールでブロックされていないことを確認

### メッセージは受信するが返信に失敗する
- セッション Webhook はメッセージごとに発行され、期限切れの可能性あり。返信を速やかに送信すること
- デベロッパーコンソールでボットに必要な API 権限があることを確認

### グループメッセージが受信されない
- ボットは管理者によって明示的にグループに追加される必要あり
- 送信者のスタッフ ID が `allowed_users` に含まれていることを確認、またはテスト用に `allowed_users = ["*"]` を設定
