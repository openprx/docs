---
title: OpenAI Codex
description: PRX で OpenAI Codex（GitHub Copilot OAuth2 フロー）を LLM プロバイダーとして設定する
---

# OpenAI Codex

> GitHub Copilot の OAuth2 認証フローを使用して、ChatGPT Responses API 経由で OpenAI の Codex モデルにアクセスします。推論機能とネイティブツール呼び出しを備えた GPT-5.x Codex モデルを利用できます。

## 前提条件

- ChatGPT Plus、Team、または Enterprise サブスクリプション
- 既存の Codex CLI または GitHub Copilot OAuth2 トークン、**または** `prx auth login` フローを実行する意思

## クイックセットアップ

### 1. 認証

```bash
prx auth login --provider openai-codex
```

GitHub OAuth デバイスフローを開始し、トークンを `~/.openprx/` に保存します。

### 2. 設定

```toml
[default]
provider = "openai-codex"
model = "gpt-5.3-codex"
```

### 3. 検証

```bash
prx doctor models
```

## 利用可能なモデル

| モデル | コンテキスト | ビジョン | ツール使用 | 備考 |
|-------|---------|--------|----------|-------|
| `gpt-5.3-codex` | 128K | あり | あり | 最新 Codex モデル、最高性能 |
| `gpt-5.2-codex` | 128K | あり | あり | 前世代 Codex |
| `gpt-5.1-codex` | 128K | あり | あり | 安定版 Codex リリース |
| `gpt-5.1-codex-mini` | 128K | あり | あり | 小型、高速 Codex バリアント |
| `gpt-5-codex` | 128K | あり | あり | 第 1 世代 Codex 5 |
| `o3` | 128K | あり | あり | OpenAI 推論モデル |
| `o4-mini` | 128K | あり | あり | 小型推論モデル |

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `model` | string | `gpt-5.3-codex` | 使用するデフォルト Codex モデル |

設定に API キーは不要です。認証は `~/.openprx/` に保存された OAuth フローで処理されます。

## 機能

### Responses API

Chat Completions API を使用する標準的な OpenAI プロバイダーとは異なり、Codex プロバイダーはより新しい Responses API（`/codex/responses`）を使用します:

- リアルタイムデルタテキストイベントによる SSE ストリーミング
- ツール使用のための構造化 `function_call` 出力アイテム
- 推論エフォート制御（`minimal` / `low` / `medium` / `high` / `xhigh`）
- レスポンスメタデータの推論サマリー

### 自動推論エフォート

PRX はモデルに基づいて推論エフォートを自動調整します:

| モデル | `minimal` | `xhigh` |
|-------|-----------|---------|
| `gpt-5.2-codex` / `gpt-5.3-codex` | `low` にクランプ | 許可 |
| `gpt-5.1` | 許可 | `high` にクランプ |
| `gpt-5.1-codex-mini` | `medium` にクランプ | `high` にクランプ |

`ZEROCLAW_CODEX_REASONING_EFFORT` 環境変数で上書きできます。

### ネイティブツール呼び出し

ツール定義は Responses API 形式で `type: "function"`、`name`、`description`、`parameters` を含めて送信されます。ドットを含むツール名（例: `email.execute`）は自動的にアンダースコア（`email_execute`）にサニタイズされ、結果で元の名前を復元する逆マッピングが行われます。

### OAuth2 トークン管理

PRX は完全な OAuth2 ライフサイクルを管理します:

1. **ログイン**: `prx auth login --provider openai-codex` でデバイスコードフローを開始
2. **トークン保存**: トークンは暗号化されて `~/.openprx/` に保存
3. **自動更新**: 期限切れのアクセストークンは保存されたリフレッシュトークンを使用して自動更新
4. **Codex CLI インポート**: 既存の Codex CLI インストールがある場合、PRX はそのトークンを自動的にインポート可能

### ストリーム処理

プロバイダーは以下の SSE ストリームを処理します:
- アイドルタイムアウト（デフォルト 45 秒、`ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS` で設定可能）
- 最大レスポンスサイズ（4 MB）
- `[DONE]` マーカーとターミナルレスポンスイベントの適切な処理
- 自動コンテンツタイプ検出（SSE vs JSON）

## 環境変数

| 変数 | 説明 |
|----------|-------------|
| `ZEROCLAW_CODEX_REASONING_EFFORT` | 推論エフォートの上書き（`minimal` / `low` / `medium` / `high` / `xhigh`） |
| `ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS` | ストリームアイドルタイムアウト（秒）（デフォルト: 45、最小: 5） |

## トラブルシューティング

### 「OpenAI Codex auth profile not found」

`prx auth login --provider openai-codex` を実行して認証してください。ChatGPT サブスクリプションが必要です。

### 「OpenAI Codex account id not found」

JWT トークンにアカウント ID が含まれていません。`prx auth login --provider openai-codex` で再認証してください。

### ストリームタイムアウトエラー

`provider_response_timeout kind=stream_idle_timeout` が表示された場合、モデルの応答に時間がかかりすぎています。対処法:
- タイムアウトを延長: `export ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS=120`
- `gpt-5.1-codex-mini` などの高速モデルを使用

### 「payload_too_large」エラー

レスポンスが 4 MB を超えました。通常、これは異常に大きなモデルレスポンスを示しています。リクエストを小さな部分に分割してください。
