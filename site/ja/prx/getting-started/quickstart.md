---
title: クイックスタート
description: 5 分で PRX を起動します。インストール、LLM プロバイダーの設定、デーモンの起動、チャットまで。
---

# クイックスタート

このガイドでは、ゼロから PRX エージェントを起動するまでを 5 分以内で行います。

## ステップ 1: PRX のインストール

最新リリースをインストールします：

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

インストールを確認します：

```bash
prx --version
```

::: tip
別のインストール方法（Cargo、ソースビルド、Docker）については、[インストールガイド](./installation)を参照してください。
:::

## ステップ 2: オンボーディングウィザードの実行

オンボーディングウィザードが、LLM プロバイダー、API キー、初期設定を対話的に構成します：

```bash
prx onboard
```

ウィザードでは以下の手順を案内します：

1. **プロバイダーの選択** -- Anthropic、OpenAI、Ollama、OpenRouter など
2. **API キーの入力** -- 設定ファイルに安全に保存されます
3. **デフォルトモデルの選択** -- ウィザードがプロバイダーから利用可能なモデルを取得します
4. **メモリバックエンドの設定** -- Markdown（デフォルト）、SQLite、または PostgreSQL

ウィザード完了後、設定は `~/.config/openprx/openprx.toml` に保存されます。

::: info クイックセットアップ
プロバイダーとモデルが分かっている場合、対話型ウィザードをスキップできます：

```bash
prx onboard --provider anthropic --api-key sk-ant-... --model claude-sonnet-4-20250514
```

すべてのオプションについては、[オンボーディングウィザード](./onboarding)を参照してください。
:::

## ステップ 3: デーモンの起動

PRX デーモンをバックグラウンドで起動します。デーモンはエージェントランタイム、ゲートウェイ API、および設定済みのすべてのチャネルを管理します：

```bash
prx daemon
```

デフォルトでは、デーモンは `127.0.0.1:3120` でリッスンします。ホストとポートをカスタマイズできます：

```bash
prx daemon --host 0.0.0.0 --port 8080
```

::: tip サービスとして実行
本番環境のデプロイでは、PRX をシステムサービスとしてインストールして、起動時に自動的に開始されるようにします：

```bash
prx service install
```

これにより systemd ユニット（Linux）または launchd plist（macOS）が作成されます。詳細は [prx service](../cli/service) を参照してください。
:::

## ステップ 4: PRX とチャット

ターミナルで直接対話型チャットセッションを開きます：

```bash
prx chat
```

これにより実行中のデーモンに接続し、設定済みの LLM と会話できる REPL が開きます。メッセージを入力して Enter を押してください：

```
You: What can you help me with?
PRX: I can help you with a wide range of tasks...
```

単一セッションのプロバイダーとモデルを指定することもできます：

```bash
prx chat --provider ollama --model llama3.2
```

`Ctrl+C` を押すか `/quit` と入力するとチャットを終了します。

## ステップ 5: チャネルの接続

PRX は 19 のメッセージングチャネルをサポートしています。接続するには、`~/.config/openprx/openprx.toml` ファイルにチャネルの設定を追加します。

例えば、Telegram ボットを接続する場合：

```toml
[channels.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["your_telegram_username"]
```

その後、デーモンを再起動して新しいチャネルを有効にします：

```bash
prx daemon
```

またはチャネル管理コマンドを使用します：

```bash
prx channel add telegram
```

対応するすべてのプラットフォームとその設定については、[チャネル概要](../channels/)を参照してください。

## ステップ 6: ステータスの確認

PRX インスタンスの現在の状態を確認します：

```bash
prx status
```

表示される情報：

- **バージョン** とバイナリパス
- **ワークスペース** ディレクトリ
- **設定** ファイルの場所
- **プロバイダー** と使用中のモデル
- **アクティブなチャネル** とその接続状態
- **メモリバックエンド** と統計情報
- **稼働時間** とリソース使用状況

出力例：

```
PRX Status

Version:     0.3.0
Workspace:   /home/user/.local/share/openprx
Config:      /home/user/.config/openprx/openprx.toml
Provider:    anthropic (claude-sonnet-4-20250514)
Memory:      markdown (/home/user/.local/share/openprx/memory)
Channels:    telegram (connected), cli (active)
Gateway:     http://127.0.0.1:3120
Uptime:      2h 15m
```

## 次のステップ

PRX が起動したら、残りのドキュメントを探索してください：

| トピック | 説明 |
|-------|-------------|
| [オンボーディングウィザード](./onboarding) | すべてのオンボーディングオプションの詳細 |
| [チャネル](../channels/) | Telegram、Discord、Slack、その他 16 のプラットフォームへの接続 |
| [プロバイダー](../providers/) | LLM プロバイダーの設定と切り替え |
| [ツール](../tools/) | 46 以上の組み込みツールの紹介 |
| [自己進化](../self-evolution/) | L1/L2/L3 進化システムについて |
| [設定](../config/) | すべてのオプションを含む完全な設定リファレンス |
| [CLI リファレンス](../cli/) | 完全なコマンドリファレンス |
