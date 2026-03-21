---
title: メディアツール
description: ビジュアルおよびオーディオコンテンツ生成のための画像処理、スクリーンショット、テキスト読み上げ、キャンバスレンダリングツール。
---

# メディアツール

PRX には、画像処理、画面キャプチャ、テキスト読み上げ合成、構造化コンテンツレンダリングにわたる 5 つのメディア関連ツールが含まれています。これらのツールにより、エージェントはビジュアルおよびオーディオコンテンツを扱えます -- 画像のリサイズ、ビジュアル推論のためのスクリーンショットキャプチャ、音声メッセージの生成、チャートやダイアグラムのレンダリング。

メディアツールはツールレジストリの 2 つのカテゴリに分散しています。ビジョンツール（`image`、`image_info`、`screenshot`）は常に `all_tools()` に登録されています。レンダリングツール（`tts`、`canvas`）はチャネルがアクティブな場合に登録されるか、無条件で登録されます。

これらのツールにより、PRX エージェントはテキスト応答とともに画像、オーディオ、ビジュアルアーティファクトを生成するマルチモーダル出力機能を得られます。

## 設定

メディアツールの設定は最小限です。ほとんどの設定はチャネルレベル（配信用）または LLM プロバイダー（ビジョンモデル機能用）で制御されます:

```toml
# ブラウザ設定がスクリーンショット機能に影響
[browser]
enabled = true
backend = "rust_native"

# チャネル設定が TTS 配信に影響
[channels_config.telegram]
bot_token = "..."
stream_mode = "partial"

# 専用のメディアツール設定セクションはありません
# ビジョンツールは always all_tools() で利用可能
```

## ツールリファレンス

### image

画像の処理と変換。リサイズ、クロップ、フォーマット変換操作をサポート。

**画像のリサイズ:**

```json
{
  "name": "image",
  "arguments": {
    "action": "resize",
    "path": "/home/user/photo.png",
    "width": 800,
    "height": 600
  }
}
```

**画像のクロップ:**

```json
{
  "name": "image",
  "arguments": {
    "action": "crop",
    "path": "/home/user/photo.png",
    "x": 100,
    "y": 50,
    "width": 400,
    "height": 300
  }
}
```

**フォーマット変換:**

```json
{
  "name": "image",
  "arguments": {
    "action": "convert",
    "path": "/home/user/photo.png",
    "format": "jpeg",
    "output": "/home/user/photo.jpg"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `action` | `string` | はい | -- | 操作: `"resize"`、`"crop"`、`"convert"` |
| `path` | `string` | はい | -- | ソース画像ファイルのパス |
| `width` | `integer` | 条件付き | -- | ターゲット幅（resize と crop 用） |
| `height` | `integer` | 条件付き | -- | ターゲット高さ（resize と crop 用） |
| `x` | `integer` | 条件付き | -- | クロップ原点の X オフセット |
| `y` | `integer` | 条件付き | -- | クロップ原点の Y オフセット |
| `format` | `string` | 条件付き | -- | 変換先フォーマット: `"png"`、`"jpeg"`、`"webp"`、`"gif"` |
| `output` | `string` | いいえ | ソースを上書き | 出力ファイルパス |

### image_info

画像ファイルを変更せずにメタデータと寸法を抽出。

```json
{
  "name": "image_info",
  "arguments": {
    "path": "/home/user/photo.png"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `path` | `string` | はい | -- | 画像ファイルのパス |

**返される情報:**

| フィールド | 説明 |
|-------|-------------|
| 幅 | 画像の幅（ピクセル） |
| 高さ | 画像の高さ（ピクセル） |
| フォーマット | 画像フォーマット（PNG、JPEG、WebP など） |
| 色空間 | RGB、RGBA、グレースケールなど |
| ファイルサイズ | ディスク上のサイズ |
| DPI | 解像度（メタデータに含まれる場合） |

### screenshot

現在の画面または特定のウィンドウのスクリーンショットをキャプチャ。デスクトップやアプリケーションの現在の状態を観察するためのビジュアル推論タスクに有用。

```json
{
  "name": "screenshot",
  "arguments": {
    "target": "screen"
  }
}
```

```json
{
  "name": "screenshot",
  "arguments": {
    "target": "window",
    "window_name": "Firefox"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `target` | `string` | いいえ | `"screen"` | キャプチャ対象: `"screen"`（フルスクリーン）または `"window"`（特定のウィンドウ） |
| `window_name` | `string` | 条件付き | -- | キャプチャするウィンドウタイトル（`target = "window"` の場合に必須） |
| `output` | `string` | いいえ | 自動生成の一時パス | スクリーンショットの出力ファイルパス |

スクリーンショットは PNG ファイルとして保存されます。ビジョン対応 LLM（GPT-4o、Claude Sonnet など）と使用する場合、ビジュアル分析のために次のメッセージにスクリーンショットを含めることができます。

### tts

テキスト読み上げ合成。テキストをオーディオファイルに変換し、現在の会話に音声メッセージとして送信します。ツールは MP3 生成、オプションの M4A 変換、アクティブなチャネルを通じた配信を処理します。

```json
{
  "name": "tts",
  "arguments": {
    "text": "Good morning! Here is your daily briefing. Three tasks are due today."
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `text` | `string` | はい | -- | 音声に変換するテキスト |
| `language` | `string` | いいえ | `"en"` | 音声合成の言語コード |
| `voice` | `string` | いいえ | プロバイダーデフォルト | 音声識別子（プロバイダー固有） |

TTS ツールは音声メッセージをサポートするアクティブなチャネル（Telegram、WhatsApp、Discord）が必要です。音声をサポートしないチャネルではツールはエラーを返します。

**TTS パイプライン:**

1. テキストが TTS プロバイダー（組み込みまたは外部）に送信
2. オーディオが MP3 として生成
3. チャネルが M4A を要求する場合（一部のモバイルクライアントなど）、自動変換を実行
4. オーディオファイルが `message_send` 経由で音声メッセージとして配信

### canvas

ビジュアル出力のための構造化コンテンツをレンダリング。テーブル、チャート、ダイアグラム、フォーマット済みレイアウトをサポート。

```json
{
  "name": "canvas",
  "arguments": {
    "type": "table",
    "data": {
      "headers": ["Name", "Status", "Score"],
      "rows": [
        ["Module A", "Passed", "98"],
        ["Module B", "Failed", "45"],
        ["Module C", "Passed", "87"]
      ]
    }
  }
}
```

```json
{
  "name": "canvas",
  "arguments": {
    "type": "diagram",
    "content": "graph LR\n  A[Input] --> B[Process]\n  B --> C[Output]"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `type` | `string` | はい | -- | コンテンツタイプ: `"table"`、`"chart"`、`"diagram"`、`"code"` |
| `data` | `object` | 条件付き | -- | テーブルとチャートの構造化データ |
| `content` | `string` | 条件付き | -- | ダイアグラム（Mermaid 構文）とコードブロックのテキストコンテンツ |
| `format` | `string` | いいえ | `"png"` | 出力フォーマット: `"png"`、`"svg"`、`"html"` |
| `output` | `string` | いいえ | 自動生成の一時パス | 出力ファイルパス |

## 使用パターン

### ビジュアル推論ワークフロー

ビジョン対応 LLM でスクリーンショットを使用して UI 状態を理解:

```
エージェントの思考: Web アプリケーションが正しく表示されるか確認する必要がある。
  1. [browser] action="navigate", url="https://app.example.com/dashboard"
  2. [screenshot] target="screen"
  3. [LLM によるスクリーンショットのビジョン分析]
  4. "ダッシュボードには 3 つのアクティブアラートと低下傾向のメトリクスチャートが表示されています..."
```

### レポート生成

チャートとテーブルでビジュアルレポートを生成:

```
エージェントの思考: ユーザーがプロジェクトステータスレポートを求めている。
  1. [memory_search] query="project status"
  2. [canvas] type="table", data={プロジェクトステータスデータ}
  3. [canvas] type="chart", data={進捗チャートデータ}
  4. [message_send] media_path="/tmp/status_table.png", caption="Project Status"
  5. [message_send] media_path="/tmp/progress_chart.png", caption="Sprint Progress"
```

### 音声インタラクション

ハンズフリーシナリオ向けにオーディオレスポンスを提供:

```
エージェントの思考: ユーザーが音声要約を求めている。
  1. [memory_recall] query="today's meetings and tasks"
  2. [tts] text="You have 3 meetings today. The first is at 10 AM with the engineering team..."
  → 音声メッセージが Telegram 経由で配信
```

## セキュリティ

### ファイルシステムアクセス

画像とスクリーンショットツールはローカルファイルシステムでファイルの読み書きを行います。これらの操作は `file_read` と `file_write` と同じセキュリティポリシーの対象です:

- パス検証により許可されたディレクトリ外のアクセスを防止
- ファイル書き込み操作はセキュリティポリシールールを尊重
- 一時ファイルはデフォルトで `TMPDIR` に書き込み

### TTS プライバシー

音声メッセージには会話からの機密情報が含まれる可能性があります。以下を考慮:

- TTS コンテンツは TTS プロバイダー（外部の可能性あり）に送信される
- 生成されたオーディオファイルはディスクに一時的に保存される
- 音声メッセージはチャネルを通じて配信され、プラットフォームのプライバシーポリシーの対象

### キャンバスコンテンツの安全性

canvas ツールはユーザー提供データをレンダリングします。Mermaid 構文のダイアグラムをレンダリングする場合、コンテンツはローカルで処理され外部サービスは関与しません。

### ポリシーエンジン

メディアツールは個別に制御可能:

```toml
[security.tool_policy.tools]
image = "allow"
image_info = "allow"
screenshot = "supervised"    # スクリーンショットに承認を要求
tts = "allow"
canvas = "allow"
```

## 関連

- [ブラウザツール](/ja/prx/tools/browser) -- スクリーンショットサポート付き Web オートメーション
- [メッセージング](/ja/prx/tools/messaging) -- チャネルを通じたメディアと音声の配信
- [チャネル概要](/ja/prx/channels/) -- チャネルのメディア機能マトリクス
- [ツール概要](/ja/prx/tools/) -- 全ツールとレジストリシステム
