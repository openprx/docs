---
title: 設定リファレンス
description: タイプ、デフォルト値、詳細な説明を含むPRX-SDのすべての設定キーの完全リファレンス。
---

# 設定リファレンス

このページは`~/.prx-sd/config.json`のすべての設定キーを文書化しています。`sd config set <key> <value>`を使用して設定を変更するか、JSONファイルを直接編集してください。

## スキャン設定（`scan.*`）

スキャンエンジンがファイルを処理する方法を制御する設定。

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `scan.max_file_size` | `integer` | `104857600`（100 MiB） | バイト単位の最大ファイルサイズ。この値より大きいファイルはスキャン中にスキップされます。制限を無効にするには`0`を設定（非推奨）。 |
| `scan.threads` | `integer \| null` | `null`（自動） | 並列スキャナースレッド数。`null`の場合、PRX-SDは論理CPUコア数を使用します。並列性を制限または増加させるには特定の数値を設定。 |
| `scan.timeout_per_file_ms` | `integer` | `30000`（30秒） | 1ファイルのスキャンに許される最大時間（ミリ秒）。超過した場合、ファイルはエラーとしてマークされ、次のファイルのスキャンが続行されます。 |
| `scan.scan_archives` | `boolean` | `true` | アーカイブファイル（ZIP、tar.gz、7z、RARなど）に再帰してその内容をスキャンするかどうか。 |
| `scan.max_archive_depth` | `integer` | `3` | アーカイブ内の再帰時の最大ネスト深度。例えば、ZIP内のZIP内のZIPには深度3が必要。ZIPボム攻撃を防止。 |
| `scan.heuristic_threshold` | `integer` | `60` | ファイルを**悪意あり**とフラグするための最小ヒューリスティックスコア（0〜100）。30からこの閾値の間のファイルは**疑わしい**としてフラグされます。値を下げると感度は上がりますが誤検知が増える可能性があります。 |
| `scan.exclude_paths` | `string[]` | `[]` | スキャンから除外するglobパターンまたはパスプレフィックスのリスト。`*`（任意の文字）と`?`（1文字）のワイルドカードをサポート。 |

### 例

```bash
# 最大ファイルサイズを500 MiBに増加
sd config set scan.max_file_size 524288000

# 正確に4スレッドを使用
sd config set scan.threads 4

# ファイルごとのタイムアウトを60秒に増加
sd config set scan.timeout_per_file_ms 60000

# アーカイブスキャンを無効化
sd config set scan.scan_archives false

# アーカイブネスト深度を5に設定
sd config set scan.max_archive_depth 5

# より高い感度のためにヒューリスティック閾値を下げる
sd config set scan.heuristic_threshold 40

# パスを除外
sd config set scan.exclude_paths '["/proc", "/sys", "/dev", "*.log", "*.tmp"]'
```

## モニター設定（`monitor.*`）

リアルタイムファイルシステム監視（`sd monitor`と`sd daemon`）を制御する設定。

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `monitor.block_mode` | `boolean` | `false` | `true`の場合、fanotify権限イベント（Linuxのみ）を使用して、リクエストしたプロセスがファイルを読み取る前に悪意のあるファイルへのアクセスを**ブロック**します。root権限が必要。`false`の場合、ファイルは作成/変更後にスキャンされ、脅威は報告されますがブロックされません。 |
| `monitor.channel_capacity` | `integer` | `4096` | ファイルシステムウォッチャーとスキャナー間の内部イベントチャネルバッファのサイズ。高いファイルシステムアクティビティ下で「チャネルフル」の警告が表示される場合は増やしてください。 |

### 例

```bash
# ブロックモードを有効化（root必要）
sd config set monitor.block_mode true

# ビジーサーバーのためにチャネルバッファを増加
sd config set monitor.channel_capacity 16384
```

::: warning
ブロックモード（`monitor.block_mode = true`）はLinuxのfanotify権限イベントを使用します。これには以下が必要：
- root権限
- `CONFIG_FANOTIFY_ACCESS_PERMISSIONS`が有効なLinuxカーネル
- rootとして実行されているPRX-SDデーモン

macOSとWindowsではブロックモードは利用できず、この設定は無視されます。
:::

## 更新設定

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `update_server_url` | `string` | `"https://update.prx-sd.dev/v1"` | シグネチャ更新サーバーのURL。エンジンは更新を確認するために`<url>/manifest.json`を取得します。プライベートミラーまたはエアギャップ更新サーバーを使用するために上書き。 |

### 例

```bash
# プライベートミラーを使用
sd config set update_server_url "https://internal-mirror.example.com/prx-sd/v1"

# 公式サーバーにリセット
sd config set update_server_url "https://update.prx-sd.dev/v1"
```

## 隔離設定（`quarantine.*`）

暗号化隔離ボールトを制御する設定。

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `quarantine.auto_quarantine` | `boolean` | `false` | `true`の場合、スキャン中に**悪意あり**として検出されたファイルを自動的に隔離ボールトに移動します。`false`の場合、脅威は報告されますがファイルはそのままです。 |
| `quarantine.max_vault_size_mb` | `integer` | `1024`（1 GiB） | MiB単位の隔離ボールトの最大合計サイズ。この制限に達すると、古いエントリが削除されるまで新しいファイルを隔離できません。 |

### 例

```bash
# 自動隔離を有効化
sd config set quarantine.auto_quarantine true

# ボールトサイズを5 GiBに増加
sd config set quarantine.max_vault_size_mb 5120

# 自動隔離を無効化（報告のみ）
sd config set quarantine.auto_quarantine false
```

## 完全なデフォルト設定

参考として、完全なデフォルト設定を以下に示します：

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

## 値の解析ルール

`sd config set`を使用する場合、値は次の順序で自動的に解析されます：

1. **Boolean** -- `true`または`false`
2. **Null** -- `null`
3. **Integer** -- 例：`42`、`104857600`
4. **Float** -- 例：`3.14`
5. **JSON配列/オブジェクト** -- 例：`'["/proc", "*.log"]'`、`'{"key": "value"}'`
6. **String** -- それ以外すべて、例：`"https://example.com"`

::: tip
配列やオブジェクトを設定する場合は、シェルの展開を防ぐために値をシングルクォートで囲んでください：
```bash
sd config set scan.exclude_paths '["*.log", "/proc", "/sys"]'
```
:::

## 関連コマンド

| コマンド | 説明 |
|---------|-------------|
| `sd config show` | 現在の設定を表示 |
| `sd config set <key> <value>` | 設定値を設定 |
| `sd config reset` | すべての設定をデフォルトにリセット |
| `sd policy show` | 修復ポリシーを表示 |
| `sd policy set <key> <value>` | 修復ポリシー値を設定 |
| `sd policy reset` | 修復ポリシーをデフォルトにリセット |

## 次のステップ

- 一般的な紹介のために[設定概要](./index)に戻る
- `scan.*`設定が[ファイルスキャン](../scanning/file-scan)に与える影響を学ぶ
- `monitor.*`設定で[リアルタイム監視](../realtime/)を設定
- 自動隔離で[隔離](../quarantine/)をセットアップ
