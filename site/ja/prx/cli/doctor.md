---
title: prx doctor
description: デーモンヘルス、チャネルステータス、モデル可用性を検証するシステム診断を実行します。
---

# prx doctor

PRX インストールの包括的な診断を実行します。設定の有効性、デーモン接続、チャネルヘルス、プロバイダー API アクセス、モデルの可用性をチェックします。

## 使い方

```bash
prx doctor [SUBCOMMAND] [OPTIONS]
```

## オプション

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | 設定ファイルのパス |
| `--json` | `-j` | `false` | JSON で出力 |
| `--verbose` | `-v` | `false` | 詳細なチェック出力を表示 |
| `--fix` | | `false` | 一般的な問題の自動修正を試行 |

## サブコマンド

### `prx doctor`（サブコマンドなし）

すべての診断チェックを実行します。

```bash
prx doctor
```

**出力例：**

```
 PRX Doctor
 ══════════════════════════════════════════

 Configuration
   Config file exists ............... OK
   Config file valid ................ OK
   Data directory writable .......... OK

 Daemon
   Daemon running ................... OK (PID 12345)
   Gateway reachable ................ OK (127.0.0.1:3120)
   Uptime ........................... 3d 14h 22m

 Providers
   anthropic ....................... OK (claude-sonnet-4-20250514)
   ollama .......................... OK (llama3, 2 models)
   openai .......................... WARN (key not configured)

 Channels
   telegram-main ................... OK (connected)
   discord-dev ..................... OK (connected)
   slack-team ...................... FAIL (auth error)

 Memory
   Backend (sqlite) ................ OK
   Entries ......................... 1,247

 Evolution
   Engine .......................... OK (running)
   Last L1 cycle ................... 2h ago

 Summary: 10 passed, 1 warning, 1 failure
```

### `prx doctor models`

設定済みのすべてのプロバイダーでモデルの可用性をチェックします。

```bash
prx doctor models [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--provider` | `-P` | すべて | 特定のプロバイダーのみチェック |

```bash
# すべてのプロバイダーのモデルをチェック
prx doctor models

# Ollama のモデルのみチェック
prx doctor models --provider ollama
```

**出力例：**

```
 Provider     Model                        Status    Latency
 anthropic    claude-sonnet-4-20250514              OK        245ms
 anthropic    claude-haiku-4-20250514               OK        189ms
 ollama       llama3                       OK        12ms
 ollama       codellama                    OK        15ms
 openai       gpt-4o                       SKIP (no key)
```

## 診断チェック

doctor は以下のチェックを実行します：

| カテゴリ | チェック | 説明 |
|----------|-------|-------------|
| 設定 | ファイルの存在 | 設定ファイルが期待されるパスに存在する |
| 設定 | 有効な構文 | TOML がエラーなくパースされる |
| 設定 | スキーマの有効性 | すべての値が期待される型と範囲に一致する |
| デーモン | プロセス実行中 | デーモンの PID が生存している |
| デーモン | ゲートウェイ到達可能 | HTTP ヘルスエンドポイントが応答する |
| プロバイダー | API キー設定済み | 必要な API キーが設定されている |
| プロバイダー | API 到達可能 | プロバイダー API がテストリクエストに応答する |
| チャネル | トークンの有効性 | チャネルボットのトークンが受け入れられる |
| チャネル | 接続済み | チャネルがアクティブに接続されている |
| メモリ | バックエンド利用可能 | メモリストアにアクセス可能 |
| 進化 | エンジン実行中 | 進化エンジンがアクティブ |

## 自動修正

`--fix` フラグは一般的な問題の自動解決を試みます：

- 欠落しているデータディレクトリの作成
- 期限切れの OAuth トークンの更新
- 切断されたチャネルの再起動
- 無効なキャッシュエントリの削除

```bash
prx doctor --fix
```

## 関連ドキュメント

- [prx daemon](./daemon) -- デーモンが実行されていない場合に起動
- [prx channel doctor](./channel) -- 詳細なチャネル診断
- [トラブルシューティング](/ja/prx/troubleshooting/) -- よくあるエラーと解決方法
- [診断ガイド](/ja/prx/troubleshooting/diagnostics) -- 詳細な診断
