---
title: Ollama
description: PRX で Ollama をローカルおよびセルフホスト LLM 推論プロバイダーとして設定する
---

# Ollama

> Ollama を使用して LLM をローカルまたはセルフホストインフラストラクチャで実行します。ビジョン、ネイティブツール呼び出し、推論モデル、およびオプションの Ollama Cloud 経由クラウドルーティングをサポートしています。

## 前提条件

- ローカルにインストールして実行中の [Ollama](https://ollama.com/)、**または**
- ネットワークアクセス可能なリモート Ollama インスタンス

## クイックセットアップ

### 1. Ollama のインストール

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# サーバーを起動
ollama serve
```

### 2. モデルのプル

```bash
ollama pull qwen3
```

### 3. 設定

```toml
[default]
provider = "ollama"
model = "qwen3"
```

ローカル使用では API キーは不要です。

### 4. 検証

```bash
prx doctor models
```

## 利用可能なモデル

Ollama で利用可能な任意のモデルが使用できます。人気のある選択肢:

| モデル | パラメータ | ビジョン | ツール使用 | 備考 |
|-------|-----------|--------|----------|-------|
| `qwen3` | 8B | なし | あり | 優れた多言語コーディングモデル |
| `qwen2.5-coder` | 7B | なし | あり | コード特化 |
| `llama3.1` | 8B/70B/405B | なし | あり | Meta のオープンモデルファミリー |
| `mistral-nemo` | 12B | なし | あり | 効率的な推論 |
| `deepseek-r1` | 7B/14B/32B | なし | あり | 推論モデル |
| `llava` | 7B/13B | あり | なし | ビジョン + 言語 |
| `gemma2` | 9B/27B | なし | あり | Google のオープンモデル |
| `codellama` | 7B/13B/34B | なし | なし | コード特化 Llama |

`ollama list` を実行してインストール済みモデルを確認できます。

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `api_key` | string | 任意 | リモート/クラウド Ollama インスタンス用 API キー |
| `api_url` | string | `http://localhost:11434` | Ollama サーバーベース URL |
| `model` | string | 必須 | モデル名（例: `qwen3`、`llama3.1:70b`） |
| `reasoning` | bool | 任意 | 推論モデルの `think` モードを有効化 |

## 機能

### ローカル使用のゼロコンフィグ

Ollama をローカルで実行する場合、API キーや特別な設定は不要です。PRX は自動的に `http://localhost:11434` に接続します。

### ネイティブツール呼び出し

PRX は Ollama のネイティブ `/api/chat` ツール呼び出しサポートを使用します。ツール定義はリクエストボディで送信され、互換モデル（qwen2.5、llama3.1、mistral-nemo など）から構造化 `tool_calls` が返されます。

PRX はモデル固有の挙動にも対応します:
- **ネストされたツール呼び出し**: `{"name": "tool_call", "arguments": {"name": "shell", ...}}` は自動的にアンラップされます
- **プレフィックス付き名前**: `tool.shell` は `shell` に正規化されます
- **ツール結果マッピング**: ツール呼び出し ID が追跡され、フォローアップのツール結果メッセージの `tool_name` フィールドにマッピングされます

### ビジョンサポート

ビジョン対応モデル（例: LLaVA）は Ollama のネイティブ `images` フィールド経由で画像を受け取ります。PRX は `[IMAGE:...]` マーカーから base64 画像データを自動抽出し、個別の画像エントリとして送信します。

### 推論モード

推論モデル（QwQ、DeepSeek-R1 など）の場合、`think` パラメーターを有効にします:

```toml
[providers.ollama]
reasoning = true
```

これによりリクエストに `"think": true` が送信され、モデルの内部推論プロセスが有効になります。モデルが `thinking` フィールドのみを空のコンテンツで返した場合、PRX は適切なフォールバックメッセージを提供します。

### リモートおよびクラウドインスタンス

リモート Ollama サーバーに接続する場合:

```toml
[providers.ollama]
api_url = "https://my-ollama-server.example.com:11434"
api_key = "${OLLAMA_API_KEY}"
```

認証は非ローカルエンドポイント（ホストが `localhost`、`127.0.0.1`、`::1` でない場合）にのみ送信されます。

### クラウドルーティング

モデル名に `:cloud` を追加して、リモート Ollama インスタンスを強制的に経由させます:

```bash
prx chat --model "qwen3:cloud"
```

クラウドルーティングには以下が必要です:
- 非ローカルの `api_url`
- 設定済みの `api_key`

### 延長タイムアウト

Ollama リクエストは 300 秒のタイムアウトを使用します（クラウドプロバイダーの 120 秒に対して）。ローカルハードウェアでの潜在的に遅い推論を考慮しています。

## トラブルシューティング

### 「Is Ollama running?」

最も一般的なエラーです。対処法:
- サーバーを起動: `ollama serve`
- ポートにアクセスできるか確認: `curl http://localhost:11434`
- カスタムポートを使用している場合は、設定の `api_url` を更新

### モデルが見つからない

先にモデルをプルしてください:
```bash
ollama pull qwen3
```

### 空のレスポンス

一部の推論モデルは最終レスポンスなしで `thinking` コンテンツのみを返す場合があります。通常、モデルが途中で停止したことを意味します。対処法:
- リクエストを再送信
- 別のモデルを使用
- モデルが推論モードを十分にサポートしていない場合は無効化

### ツール呼び出しが機能しない

すべての Ollama モデルがツール呼び出しをサポートしているわけではありません。正常に動作することが確認されているモデル:
- `qwen2.5` / `qwen3`
- `llama3.1`
- `mistral-nemo`
- `command-r`

### クラウドルーティングエラー

- 「requested cloud routing, but Ollama endpoint is local」: `api_url` をリモートサーバーに設定
- 「requested cloud routing, but no API key is configured」: `api_key` または `OLLAMA_API_KEY` を設定
