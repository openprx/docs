---
title: 設定概要
description: PRX-SDの設定の仕組み、設定ファイルの保存場所、sd configコマンドを使用した設定の表示・変更・リセット方法を解説します。
---

# 設定概要

PRX-SDはすべての設定を`~/.prx-sd/config.json`の単一JSONファイルに保存します。このファイルは初回実行時に適切なデフォルト値で自動的に作成されます。`sd config`コマンドを使用するか、JSONファイルを直接編集することで設定を表示、変更、リセットできます。

## 設定ファイルの場所

| プラットフォーム | デフォルトパス |
|----------|-------------|
| Linux / macOS | `~/.prx-sd/config.json` |
| Windows | `%USERPROFILE%\.prx-sd\config.json` |
| カスタム | `--data-dir /path/to/dir`（グローバルCLIフラグ） |

`--data-dir`グローバルフラグはデフォルトの場所を上書きします。設定すると、設定ファイルは`<data-dir>/config.json`から読み込まれます。

```bash
# カスタムデータディレクトリを使用
sd --data-dir /opt/prx-sd config show
```

## `sd config`コマンド

### 現在の設定を表示

設定ファイルパスを含む現在のすべての設定を表示：

```bash
sd config show
```

出力：

```
Current Configuration
  File: /home/user/.prx-sd/config.json

{
  "scan": {
    "max_file_size": 104857600,
    "threads": null,
    "timeout_per_file_ms": 30000,
    "scan_archives": true,
    "max_archive_depth": 3,
    "heuristic_threshold": 60,
    "exclude_paths": []
  },
  "monitor": {
    "block_mode": false,
    "channel_capacity": 4096
  },
  "update_server_url": "https://update.prx-sd.dev/v1",
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

### 設定値を設定

ドット区切り表記を使用して任意の設定キーを設定します。値は適切なJSONタイプ（boolean、integer、float、array、object、またはstring）として自動的に解析されます。

```bash
sd config set <key> <value>
```

例：

```bash
# 最大ファイルサイズを200 MiBに設定
sd config set scan.max_file_size 209715200

# スキャンスレッドを8に設定
sd config set scan.threads 8

# 自動隔離を有効化
sd config set quarantine.auto_quarantine true

# ヒューリスティック閾値を50に設定（より敏感）
sd config set scan.heuristic_threshold 50

# 除外パスをJSON配列として追加
sd config set scan.exclude_paths '["*.log", "/proc", "/sys"]'

# 更新サーバーURLを変更
sd config set update_server_url "https://custom-update.example.com/v1"
```

出力：

```
OK Set scan.max_file_size = 209715200 (was 104857600)
```

::: tip
ネストされたキーにはドット表記を使用します。例えば、`scan.max_file_size`は`scan`オブジェクトに入り`max_file_size`フィールドを設定します。存在しない場合は中間オブジェクトが自動的に作成されます。
:::

### デフォルトにリセット

すべての設定を工場出荷時のデフォルトに復元：

```bash
sd config reset
```

出力：

```
OK Configuration reset to defaults.
```

::: warning
設定のリセットはシグネチャデータベース、YARAルール、隔離されたファイルを削除しません。`config.json`ファイルをデフォルト値にリセットするだけです。
:::

## 設定カテゴリ

設定は4つのメインセクションに整理されています：

| セクション | 目的 |
|---------|---------|
| `scan.*` | ファイルスキャンの動作：ファイルサイズ制限、スレッド、タイムアウト、アーカイブ、ヒューリスティック |
| `monitor.*` | リアルタイム監視：ブロックモード、イベントチャネル容量 |
| `quarantine.*` | 隔離ボールト：自動隔離、最大ボールトサイズ |
| `update_server_url` | シグネチャ更新サーバーエンドポイント |

すべての設定キー、タイプ、デフォルト値、説明の完全なリファレンスについては[設定リファレンス](./reference)を参照してください。

## デフォルト設定

初回実行時、PRX-SDは以下のデフォルト設定を生成します：

```json
{
  "scan": {
    "max_file_size": 104857600,
    "threads": null,
    "timeout_per_file_ms": 30000,
    "scan_archives": true,
    "max_archive_depth": 3,
    "heuristic_threshold": 60,
    "exclude_paths": []
  },
  "monitor": {
    "block_mode": false,
    "channel_capacity": 4096
  },
  "update_server_url": "https://update.prx-sd.dev/v1",
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

主なデフォルト値：

- **最大ファイルサイズ:** 100 MiB（これより大きいファイルはスキップ）
- **スレッド:** `null`（CPU数に基づいて自動検出）
- **タイムアウト:** ファイルあたり30秒
- **アーカイブ:** スキャン済み、最大3レベルのネスト
- **ヒューリスティック閾値:** 60（スコア60以上=悪意あり、30〜59=疑わしい）
- **ブロックモード:** 無効（モニターは報告するがファイルアクセスをブロックしない）
- **自動隔離:** 無効（脅威は報告されるがファイルは移動されない）
- **ボールトサイズ制限:** 1024 MiB

## 設定ファイルを直接編集

テキストエディタで`~/.prx-sd/config.json`を編集することもできます。PRX-SDは各コマンドの開始時にファイルを読み込むため、変更は即座に反映されます。

```bash
# エディタで開く
$EDITOR ~/.prx-sd/config.json
```

ファイルが有効なJSONであることを確認してください。不正な形式の場合、PRX-SDはデフォルト値にフォールバックして警告を出力します。

## データディレクトリ構造

```
~/.prx-sd/
  config.json       # エンジン設定
  signatures/       # LMDBハッシュシグネチャデータベース
  yara/             # コンパイル済みYARAルールファイル
  quarantine/       # AES-256-GCM暗号化隔離ボールト
  adblock/          # adblockフィルターリストとログ
  plugins/          # WASMプラグインディレクトリ
  audit/            # スキャン監査ログ（JSONL）
  prx-sd.pid        # デーモンPIDファイル（実行中の場合）
```

## 次のステップ

- すべてのキー、タイプ、デフォルト値については[設定リファレンス](./reference)を参照
- 設定がスキャンに与える影響を理解するために[スキャン](../scanning/file-scan)を学ぶ
- [リアルタイム監視](../realtime/)を設定して`monitor.block_mode`を設定
- 自動隔離動作のために[隔離](../quarantine/)を設定
