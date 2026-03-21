---
title: WhatsApp Web
description: ネイティブ Web クライアント (wa-rs) を使用して PRX を WhatsApp に接続
---

# WhatsApp Web

> ネイティブ Rust Web クライアント (wa-rs) を使用して PRX を WhatsApp に接続します。エンドツーエンド暗号化、QR コードまたはペアコードリンク、完全なメディアサポートに対応。

## 前提条件

- 有効な電話番号を持つ WhatsApp アカウント
- `whatsapp-web` フィーチャーフラグでビルドされた PRX
- Meta Business API アカウントは不要

## クイックセットアップ

### 1. フィーチャーフラグの有効化

WhatsApp Web サポート付きで PRX をビルド：

```bash
cargo build --release --features whatsapp-web
```

### 2. 設定

```toml
[channels_config.whatsapp]
session_path = "~/.config/openprx/whatsapp-session.db"
allowed_numbers = ["+1234567890", "*"]
```

ペアコードリンク（QR コードの代わり）の場合：

```toml
[channels_config.whatsapp]
session_path = "~/.config/openprx/whatsapp-session.db"
pair_phone = "15551234567"
allowed_numbers = ["*"]
```

### 3. アカウントのリンク

PRX を起動します。初回実行時に以下のいずれかが表示されます：
- WhatsApp モバイルアプリでスキャンする**QR コード**
- `pair_phone` が設定されている場合は**ペアコード**（WhatsApp > リンクされたデバイスでコードを入力）

### 4. 検証

```bash
prx channel doctor whatsapp
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `session_path` | `String` | *必須* | セッション SQLite データベースのパス。このフィールドの存在で Web モードが選択される |
| `pair_phone` | `String` | `null` | ペアコードリンク用の電話番号（形式: 国番号 + 番号、例: `"15551234567"`）。未設定の場合は QR コードペアリング |
| `pair_code` | `String` | `null` | リンク用のカスタムペアコード。空のままにすると WhatsApp が生成 |
| `allowed_numbers` | `[String]` | `[]` | E.164 形式の許可電話番号（例: `"+1234567890"`）。`"*"` = すべて許可 |

## 機能

- **Meta Business API 不要** -- WhatsApp Web プロトコルを使用してリンクデバイスとして直接接続
- **エンドツーエンド暗号化** -- Signal Protocol によるメッセージ暗号化、公式 WhatsApp クライアントと同等
- **QR コードとペアコードリンク** -- WhatsApp アカウントをリンクする 2 つの方法
- **永続セッション** -- セッション状態をローカル SQLite データベースに保存、再起動後も保持
- **グループと DM** -- プライベートチャットとグループ会話の両方をサポート
- **メディアメッセージ** -- 画像、ドキュメント、その他のメディアタイプを処理
- **ボイスノートサポート** -- STT 設定時に受信ボイスノートを文字起こし、TTS 設定時にオプションでボイスノートで返信
- **プレゼンスとリアクション** -- 入力中インジケーターとメッセージリアクションをサポート

## 制限事項

- コンパイル時に `whatsapp-web` フィーチャーフラグが必要
- 電話番号あたり 1 つのリンクデバイスセッションのみサポート（WhatsApp の制限）
- 長期間使用しないとセッションが期限切れになる可能性あり、再リンクが必要
- macOS、Linux、Windows WSL2 のみ対応（PRX 本体と同じ）
- WhatsApp が再認証を要求する場合あり

## トラブルシューティング

### QR コードが表示されない
- `session_path` が設定されディレクトリが書き込み可能であることを確認
- PRX が `--features whatsapp-web` でビルドされていることを確認
- セッションデータベースを削除して再起動し、新しいペアリングを強制

### セッションの期限切れまたは切断
- 設定された `session_path` のセッションデータベースを削除
- PRX を再起動して新しい QR コードまたはペアコードフローをトリガー

### ボイスノートが文字起こしされない
- PRX 設定の `[transcription]` セクションを設定して STT を有効化
- サポートされる STT バックエンド: OpenAI Whisper, Deepgram, AssemblyAI, Google STT

::: tip Cloud API モード
Meta Business アカウントがあり Webhook ベースのメッセージングを好む場合は、[WhatsApp (Cloud API)](./whatsapp) を参照してください。
:::
