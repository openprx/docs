---
title: GitHub Copilot
description: PRX で GitHub Copilot を LLM プロバイダーとして設定する
---

# GitHub Copilot

> Copilot API を通じて GitHub Copilot Chat モデルにアクセスします。OAuth デバイスフロー認証とトークン管理の自動化をサポートしています。

## 前提条件

- **Copilot Individual**、**Copilot Business**、または **Copilot Enterprise** サブスクリプションがアクティブな GitHub アカウント
- オプションで、GitHub パーソナルアクセストークン（それ以外の場合はインタラクティブなデバイスフローログインが使用されます）

## クイックセットアップ

### 1. 認証

初回使用時、PRX は GitHub のデバイスコードフローによる認証を促します:

```
GitHub Copilot authentication is required.
Visit: https://github.com/login/device
Code: XXXX-XXXX
Waiting for authorization...
```

または、GitHub トークンを直接提供することもできます:

```bash
export GITHUB_TOKEN="ghp_..."
```

### 2. 設定

```toml
[default]
provider = "copilot"
model = "gpt-4o"
```

### 3. 検証

```bash
prx doctor models
```

## 利用可能なモデル

GitHub Copilot はキュレーションされたモデルセットへのアクセスを提供します。利用可能なモデルは Copilot サブスクリプションの種類によって異なります:

| モデル | コンテキスト | ビジョン | ツール使用 | 備考 |
|-------|---------|--------|----------|-------|
| `gpt-4o` | 128K | あり | あり | デフォルト Copilot モデル |
| `gpt-4o-mini` | 128K | あり | あり | 高速、コスト効率が高い |
| `claude-sonnet-4` | 200K | あり | あり | Copilot Enterprise で利用可能 |
| `o3-mini` | 128K | なし | あり | 推論モデル |

モデルの利用可否は GitHub Copilot プランと GitHub の現在のモデル提供状況によって異なる場合があります。

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `api_key` | string | 任意 | GitHub パーソナルアクセストークン（`ghp_...` または `gho_...`） |
| `model` | string | `gpt-4o` | 使用するデフォルトモデル |

## 機能

### ゼロコンフィグ認証

Copilot プロバイダーは VS Code の Copilot 拡張機能と同じ OAuth デバイスコードフローを実装しています:

1. **デバイスコードリクエスト**: PRX が GitHub にデバイスコードをリクエスト
2. **ユーザー認証**: `github.com/login/device` にアクセスしてコードを入力
3. **トークン交換**: GitHub OAuth トークンが短期の Copilot API キーに交換
4. **自動キャッシング**: トークンは `~/.config/openprx/copilot/` にセキュアなファイルパーミッション（0600）で保存
5. **自動更新**: 期限切れの Copilot API キーは再認証なしで自動的に再交換

### セキュアなトークン保存

トークンは厳格なセキュリティで保存されます:
- ディレクトリ: `~/.config/openprx/copilot/`（パーミッション 0700）
- ファイル: `access-token` と `api-key.json`（パーミッション 0600）
- 非 Unix プラットフォームでは、標準的なファイル作成が使用されます

### 動的 API エンドポイント

Copilot API キーレスポンスには、実際の API エンドポイントを指定する `endpoints.api` フィールドが含まれています。PRX はこれを尊重し、エンドポイントが指定されていない場合は `https://api.githubcopilot.com` にフォールバックします。

### ネイティブツール呼び出し

ツールは Copilot Chat Completions API（`/chat/completions`）を通じて OpenAI 互換形式で送信されます。プロバイダーは自動ツール選択のための `tool_choice: "auto"` をサポートしています。

### エディターヘッダー

リクエストには標準的な Copilot エディター識別ヘッダーが含まれます:
- `Editor-Version: vscode/1.85.1`
- `Editor-Plugin-Version: copilot/1.155.0`
- `User-Agent: GithubCopilot/1.155.0`

## トラブルシューティング

### 「Failed to get Copilot API key (401/403)」

GitHub OAuth トークンが期限切れか、Copilot サブスクリプションが無効です:
- GitHub アカウントにアクティブな Copilot サブスクリプションがあることを確認
- PRX は 401/403 でキャッシュされたアクセストークンを自動的にクリアし、デバイスフローログインの再プロンプトを行います

### 「Timed out waiting for GitHub authorization」

デバイスコードフローには 15 分のタイムアウトがあります。期限切れの場合:
- PRX コマンドを再実行して新しいコードを取得
- 正しい URL にアクセスし、表示された正確なコードを入力していることを確認

### 「GitHub device authorization expired」

デバイスコードが期限切れになりました。コマンドを再試行するだけで、新しい認証フローが開始されます。

### モデルが利用できない

利用可能なモデルは Copilot サブスクリプションの種類によって異なります:
- **Copilot Individual**: GPT-4o、GPT-4o-mini
- **Copilot Business/Enterprise**: Claude などの追加モデルが含まれる場合があります

[github.com/settings/copilot](https://github.com/settings/copilot) でサブスクリプションを確認してください。

### レート制限

GitHub Copilot には OpenAI とは別のレート制限があります。レート制限に遭遇した場合は、PRX 設定の `fallback_providers` を使用して別のプロバイダーにフォールバックすることを検討してください。
