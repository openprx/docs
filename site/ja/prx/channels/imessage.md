---
title: iMessage
description: macOS で PRX を iMessage に接続
---

# iMessage

> macOS の Messages データベースと AppleScript ブリッジを使用して、PRX を iMessage にネイティブ統合します。

## 前提条件

- **macOS のみ** -- iMessage 統合には macOS が必要（Monterey 12.0 以降推奨）
- Messages アプリにサインイン済みのアクティブな iMessage アカウント
- PRX プロセスにフルディスクアクセスが付与されていること（Messages データベースの読み取りのため）

## クイックセットアップ

### 1. フルディスクアクセスの付与

1. **システム設定 > プライバシーとセキュリティ > フルディスクアクセス** を開く
2. ターミナルアプリケーションまたは PRX バイナリをリストに追加
3. ターミナルまたは PRX プロセスを再起動

### 2. 設定

```toml
[channels_config.imessage]
allowed_contacts = ["+1234567890", "user@icloud.com"]
```

### 3. 検証

```bash
prx channel doctor imessage
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `allowed_contacts` | `[String]` | *必須* | 許可する iMessage 連絡先: 電話番号（E.164）またはメールアドレス。空 = すべて拒否 |

## 機能

- **ネイティブ macOS 統合** -- Messages の SQLite データベースから直接読み取り
- **AppleScript ブリッジ** -- 信頼性の高いメッセージ配信のため `osascript` 経由で返信を送信
- **電話番号とメール連絡先** -- 電話番号または Apple ID メールアドレスでフィルタ
- **最新 macOS サポート** -- macOS Ventura 以降で使用される `attributedBody` typedstream 形式に対応
- **ポーリングベース** -- Messages データベースを定期的にチェックして新着メッセージを検出

## 制限事項

- **macOS のみ** -- Linux や Windows では利用不可
- `~/Library/Messages/chat.db` の読み取りにフルディスクアクセスが必要
- Messages アプリが実行中（少なくともサインイン済み）である必要あり
- 新しい連絡先との会話を開始することはできない。既存の会話がある連絡先のみ対応
- グループ iMessage チャットは現在サポートされていない
- ポーリング間隔により、プッシュベースのチャネルと比較してわずかな遅延が発生
- AppleScript ベースの送信はヘッドレス（SSH のみ）の macOS 環境では動作しない場合あり

## トラブルシューティング

### Messages データベースの読み取りで「Permission denied」
- PRX プロセスまたはその親ターミナルにフルディスクアクセスが付与されていることを確認
- macOS Ventura 以降では、**システム設定 > プライバシーとセキュリティ > フルディスクアクセス** で確認
- 権限付与後にターミナルを再起動

### メッセージが検出されない
- Messages アプリに Apple ID でサインインしていることを確認
- 連絡先が `allowed_contacts` に含まれていることを確認（E.164 形式の電話番号またはメール）
- 新着メッセージの検出にはポーリングサイクルが必要な場合あり

### 返信が送信されない
- Messages アプリが実行中であることを確認（サインインだけでは不十分）
- AppleScript の送信には GUI アクセスが必要。SSH のみのセッションでは失敗する場合あり
- macOS のコンソール.app で AppleScript エラーを確認
