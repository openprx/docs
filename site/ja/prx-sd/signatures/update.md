---
title: シグネチャの更新
description: "Ed25519検証と増分更新を含むsd updateによる脅威インテリジェンスデータベースの最新維持。"
---

# シグネチャの更新

`sd update`コマンドはすべての設定済みソースから最新の脅威シグネチャをダウンロードします。定期的な更新は重要です -- 新しいマルウェアサンプルは数分ごとに出現し、古くなったシグネチャデータベースは保護に穴を開けます。

## 使い方

```bash
sd update [OPTIONS]
```

## オプション

| フラグ | ショート | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--check-only` | | `false` | ダウンロードせずに利用可能な更新を確認 |
| `--force` | `-f` | `false` | キャッシュを無視してすべてのシグネチャを強制再ダウンロード |
| `--source` | `-s` | all | 特定のソースカテゴリのみ更新：`hashes`、`yara`、`ioc`、`clamav` |
| `--full` | | `false` | 大規模データセットを含む（VirusShare 2000万件以上のMD5ハッシュ） |
| `--server-url` | | official | カスタム更新サーバーURL |
| `--no-verify` | | `false` | Ed25519シグネチャ検証をスキップ（非推奨） |
| `--timeout` | `-t` | `300` | ソースごとのダウンロードタイムアウト（秒） |
| `--parallel` | `-p` | `4` | 並列ダウンロード数 |
| `--quiet` | `-q` | `false` | 進捗出力を抑制 |

## 更新の仕組み

### 更新フロー

```
sd update
  1. Fetch metadata.json from update server
  2. Compare local versions with remote versions
  3. For each outdated source:
     a. Download incremental diff (or full file if no diff available)
     b. Verify Ed25519 signature
     c. Apply to local database
  4. Recompile YARA rules
  5. Update local metadata.json
```

### 増分更新

PRX-SDは帯域幅を最小化するために増分更新を使用します：

| ソースタイプ | 更新方法 | 典型的なサイズ |
|-------------|--------------|-------------|
| ハッシュデータベース | デルタ差分（追加 + 削除） | 50-200 KB |
| YARAルール | Gitスタイルパッチ | 10-50 KB |
| IOCフィード | 完全置換（小さなファイル） | 1-5 MB |
| ClamAV | cdiff増分更新 | 100-500 KB |

増分更新が利用できない場合（初回インストール、破損、または`--force`時）、完全なデータベースがダウンロードされます。

### Ed25519シグネチャ検証

ダウンロードされたすべてのファイルは適用前にEd25519シグネチャに対して検証されます。これにより以下から保護されます：

- **改ざん** -- 変更されたファイルは拒否される
- **破損** -- 不完全なダウンロードが検出される
- **リプレイ攻撃** -- 古いシグネチャは再使用できない（タイムスタンプ検証）

署名公開鍵はコンパイル時に`sd`バイナリに埋め込まれています。

::: warning
本番環境では`--no-verify`を使用しないでください。シグネチャ検証は、侵害された更新サーバーや中間者攻撃によるサプライチェーン攻撃を防ぐために存在します。
:::

## 更新の確認

ダウンロードせずに利用可能な更新を確認するには：

```bash
sd update --check-only
```

```
Checking for updates...
  MalwareBazaar:    update available (v2026.0321.2, +847 hashes)
  URLhaus:          up to date (v2026.0321.1)
  Feodo Tracker:    update available (v2026.0321.3, +12 hashes)
  ThreatFox:        up to date (v2026.0321.1)
  YARA Community:   update available (v2026.0320.1, +3 rules)
  IOC Feeds:        update available (v2026.0321.1, +1,204 indicators)
  ClamAV:           not configured

3 sources have updates available.
Run 'sd update' to download.
```

## カスタム更新サーバー

エアギャップ環境やプライベートミラーを運用している組織向け：

```bash
sd update --server-url https://signatures.internal.corp/prx-sd
```

`config.toml`でサーバーを永続的に設定：

```toml
[update]
server_url = "https://signatures.internal.corp/prx-sd"
interval_hours = 6
auto_update = true
```

::: tip
ローカルシグネチャミラーをセットアップするには`prx-sd-mirror`ツールを使用してください。詳細は[セルフホスティングガイド](https://github.com/OpenPRX/prx-sd-signatures)を参照してください。
:::

## シェルスクリプトの代替

`sd`がインストールされていないシステムでは、バンドルされたシェルスクリプトを使用：

```bash
# Standard update (hashes + YARA)
./tools/update-signatures.sh

# Full update including VirusShare
./tools/update-signatures.sh --full

# Update only hashes
./tools/update-signatures.sh --source hashes

# Update only YARA rules
./tools/update-signatures.sh --source yara
```

## 例

```bash
# Standard update
sd update

# Force full re-download of everything
sd update --force

# Update only YARA rules
sd update --source yara

# Full update with VirusShare (large download)
sd update --full

# Quiet mode for cron jobs
sd update --quiet

# Check what's available first
sd update --check-only

# Use a custom server with increased parallelism
sd update --server-url https://mirror.example.com --parallel 8
```

## 自動更新

### sd daemonによる自動更新

デーモンは更新を自動的に処理します。間隔を設定：

```bash
sd daemon start --update-hours 4
```

### cronによる自動更新

```bash
# Update signatures every 6 hours
0 */6 * * * /usr/local/bin/sd update --quiet 2>&1 | logger -t prx-sd
```

### systemdタイマーによる自動更新

```ini
# /etc/systemd/system/prx-sd-update.timer
[Unit]
Description=PRX-SD Signature Update Timer

[Timer]
OnCalendar=*-*-* 00/6:00:00
RandomizedDelaySec=900
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now prx-sd-update.timer
```

## 次のステップ

- [シグネチャソース](./sources) -- 各脅威インテリジェンスソースの詳細
- [ハッシュのインポート](./import) -- カスタムハッシュブロックリストを追加
- [デーモン](../realtime/daemon) -- 自動バックグラウンド更新
- [脅威インテリジェンス概要](./index) -- データベースアーキテクチャ概要
