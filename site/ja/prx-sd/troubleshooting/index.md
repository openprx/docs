---
title: トラブルシューティング
description: "シグネチャ更新、スキャンパフォーマンス、権限、誤検知、デーモンの問題、メモリ使用量など、PRX-SDの一般的な問題の解決策。"
---

# トラブルシューティング

このページでは、PRX-SDの実行中に発生する最も一般的な問題とその原因および解決策を説明します。

## シグネチャデータベースの更新失敗

**症状：** `sd update`がネットワークエラー、タイムアウト、またはSHA-256不一致で失敗する。

**考えられる原因：**
- インターネット接続なし、またはファイアウォールがアウトバウンドHTTPSをブロック
- 更新サーバーが一時的に利用不可
- プロキシまたは企業ファイアウォールがレスポンスを変更している

**解決策：**

1. 更新サーバーへの**接続を確認**：

```bash
curl -fsSL https://update.prx-sd.dev/v1/manifest.json
```

2. ネットワーク制限がある場合は**オフライン更新スクリプト**を使用：

```bash
# On a machine with internet access
./tools/update-signatures.sh

# Copy the signatures directory to the target machine
scp -r ~/.prx-sd/signatures user@target:~/.prx-sd/
```

3. 破損したキャッシュをクリアするために**強制再ダウンロード**：

```bash
sd update --force
```

4. プライベートミラーをホストしている場合は**カスタム更新サーバーを使用**：

```bash
sd config set update_server_url "https://internal-mirror.example.com/prx-sd/v1"
sd update
```

5. **SHA-256不一致を確認** -- これは通常、転送中にダウンロードが破損したことを意味します。再試行するか、手動でダウンロードしてください：

```bash
sd update --force
```

::: tip
ダウンロードせずに更新が利用可能かどうかを確認するには`sd update --check-only`を実行してください。
:::

## スキャン速度が遅い

**症状：** ディレクトリのスキャンが予想よりもはるかに時間がかかる。

**考えられる原因：**
- ネットワークマウントファイルシステム（NFS、CIFS、SSHFS）のスキャン
- YARAルールがスキャンごとにコンパイルされている（キャッシュされたコンパイルなし）
- 多すぎるスレッドがスピニングディスク上でI/Oを競合している
- 大きなネストされたアーカイブでのアーカイブ再帰

**解決策：**

1. SSDバックアップストレージのために**スレッド数を増やす**：

```bash
sd config set scan.threads 16
```

2. スピニングディスク（I/Oバウンド）のために**スレッド数を減らす**：

```bash
sd config set scan.threads 2
```

3. **遅いまたは無関係なパスを除外**：

```bash
sd config set scan.exclude_paths '["/mnt/nfs", "/proc", "/sys", "/dev", "*.iso"]'
```

4. 不要な場合は**アーカイブスキャンを無効化**：

```bash
sd config set scan.scan_archives false
```

5. 深くネストされたアーカイブを避けるために**アーカイブ深度を制限**：

```bash
sd config set scan.max_archive_depth 1
```

6. 1回限りのスキャンには**`--exclude`フラグを使用**：

```bash
sd scan /home --exclude "*.iso" --exclude "node_modules"
```

7. ボトルネックを見つけるために**デバッグログを有効化**：

```bash
sd --log-level debug scan /path/to/dir 2>&1 | grep -i "slow\|timeout\|skip"
```

## fanotify権限エラー

**症状：** `sd monitor --block`が「Permission denied」または「Operation not permitted」で失敗する。

**考えられる原因：**
- rootとして実行していない
- Linuxカーネルに`CONFIG_FANOTIFY_ACCESS_PERMISSIONS`が有効化されていない
- AppArmorまたはSELinuxがfanotifyアクセスをブロックしている

**解決策：**

1. **rootとして実行**：

```bash
sudo sd monitor /home /tmp --block
```

2. **カーネル設定を確認**：

```bash
zgrep FANOTIFY /proc/config.gz
# Should show: CONFIG_FANOTIFY=y and CONFIG_FANOTIFY_ACCESS_PERMISSIONS=y
```

3. **非ブロックモードをフォールバックとして使用**（依然として脅威を検出しますが、ファイルアクセスを防止しない）：

```bash
sd monitor /home /tmp
```

::: warning
ブロックモードはfanotifyサポートを持つLinuxのみで利用可能です。macOS（FSEvents）とWindows（ReadDirectoryChangesW）では、リアルタイム監視は検出専用モードで動作します。
:::

4. **SELinux/AppArmorを確認**：

```bash
# SELinux: check for denials
ausearch -m AVC -ts recent | grep prx-sd

# AppArmor: check for denials
dmesg | grep apparmor | grep prx-sd
```

## 誤検知（正当なファイルが脅威として検出される）

**症状：** 既知の安全なファイルがSuspiciousまたはMaliciousとしてフラグ立てされる。

**解決策：**

1. **何がトリガーされたかを確認**：

```bash
sd scan /path/to/file --json
```

`detection_type`と`threat_name`フィールドを確認：
- `HashMatch` -- ファイルのハッシュが既知のマルウェアハッシュに一致する（誤検知の可能性は低い）
- `YaraRule` -- YARAルールがファイル内のパターンに一致した
- `Heuristic` -- ヒューリスティックエンジンがファイルをしきい値以上にスコアリングした

2. **ヒューリスティックの誤検知の場合**、しきい値を上げる：

```bash
# Default is 60; raise to 70 for fewer false positives
sd config set scan.heuristic_threshold 70
```

3. **スキャンからファイルまたはディレクトリを除外**：

```bash
sd config set scan.exclude_paths '["/path/to/safe-file", "/opt/known-good/"]'
```

4. **YARAの誤検知の場合**、`~/.prx-sd/yara/`ディレクトリ内の特定のルールを削除またはコメントアウトすることで除外できます。

5. **ハッシュでホワイトリスト化** -- ファイルのSHA-256をローカル許可リストに追加します（将来の機能）。回避策として、パスでファイルを除外してください。

::: tip
検出が本当に誤検知だと思われる場合は、ファイルハッシュ（ファイル自体ではなく）とルール名を含めて[github.com/openprx/prx-sd/issues](https://github.com/openprx/prx-sd/issues)で報告してください。
:::

## デーモンが起動できない

**症状：** `sd daemon`が直ちに終了する、または`sd status`が「stopped」を表示する。

**考えられる原因：**
- 別のインスタンスがすでに実行中（PIDファイルが存在する）
- データディレクトリにアクセスできないまたは破損している
- シグネチャデータベースが見つからない

**解決策：**

1. **古いPIDファイルを確認**：

```bash
cat ~/.prx-sd/prx-sd.pid
# If the listed PID is not running, remove the file
rm ~/.prx-sd/prx-sd.pid
```

2. **デーモンのステータスを確認**：

```bash
sd status
```

3. **フォアグラウンドで実行**してデバッグログで起動エラーを確認：

```bash
sd --log-level debug daemon /home /tmp
```

4. **シグネチャが存在することを確認**：

```bash
sd info
# If hash_count is 0, run:
sd update
```

5. **ディレクトリ権限を確認**：

```bash
ls -la ~/.prx-sd/
# All directories should be owned by your user and writable
```

6. データディレクトリが破損している場合は**再初期化**：

```bash
# Back up existing data
mv ~/.prx-sd ~/.prx-sd.bak

# Re-run any command to trigger first-run setup
sd info

# Re-download signatures
sd update
```

## ログレベルの調整

**問題：** 問題をデバッグするためにより多くの診断情報が必要。

PRX-SDは5つのログレベルをサポートします（最も詳細から最も少ない詳細順）：

| レベル | 説明 |
|-------|-------------|
| `trace` | ファイルごとのYARAマッチングの詳細を含むすべて |
| `debug` | 詳細なエンジン操作、プラグインの読み込み、ハッシュルックアップ |
| `info` | スキャン進捗、シグネチャ更新、プラグイン登録 |
| `warn` | 警告と非致命的エラー（デフォルト） |
| `error` | 重大なエラーのみ |

```bash
# Maximum verbosity
sd --log-level trace scan /tmp

# Debug-level for troubleshooting
sd --log-level debug monitor /home

# Redirect logs to a file for analysis
sd --log-level debug scan /home 2> /tmp/prx-sd-debug.log
```

::: tip
`--log-level`フラグはグローバルであり、サブコマンドの**前に**来る必要があります：
```bash
# Correct
sd --log-level debug scan /tmp

# Incorrect (flag after subcommand)
sd scan /tmp --log-level debug
```
:::

## メモリ使用量が多い

**症状：** `sd`プロセスが予想以上のメモリを消費する。特に大きなディレクトリスキャン中。

**考えられる原因：**
- 多くのスレッドで非常に多くのファイルをスキャンしている
- YARAルールはメモリにコンパイルされる（38,800件以上のルールは大きなメモリを使用）
- アーカイブスキャンで大きな圧縮ファイルがメモリに展開される
- `max_memory_mb`制限が高いWASMプラグイン

**解決策：**

1. **スレッド数を減らす**（各スレッドが独自のYARAコンテキストを読み込む）：

```bash
sd config set scan.threads 2
```

2. 非常に大きなファイルをスキップするために**最大ファイルサイズを制限**：

```bash
# Limit to 50 MiB
sd config set scan.max_file_size 52428800
```

3. メモリ制限システムのために**アーカイブスキャンを無効化**：

```bash
sd config set scan.scan_archives false
```

4. **アーカイブ深度を制限**：

```bash
sd config set scan.max_archive_depth 1
```

5. **WASMプラグインのメモリ制限を確認** -- `~/.prx-sd/plugins/*/plugin.json`で`max_memory_mb`の値が高いプラグインを確認して削減してください。

6. **スキャン中のメモリを監視**：

```bash
# In another terminal
watch -n 1 'ps aux | grep sd | grep -v grep'
```

7. **デーモンの場合**、時間の経過とともにメモリを監視：

```bash
sd status
# Shows PID; use top/htop to watch memory
```

## その他の一般的な問題

### 「No YARA rules found」警告

YARAルールディレクトリが空です。初回セットアップを再実行するかルールをダウンロード：

```bash
sd update
# Or manually trigger setup by removing the yara directory:
rm -rf ~/.prx-sd/yara
sd info  # triggers first-run setup with embedded rules
```

### 「Failed to open signature database」エラー

LMDBシグネチャデータベースが破損している可能性があります：

```bash
rm -rf ~/.prx-sd/signatures
sd update
```

### Adblock：「insufficient privileges」

adblockの有効化/無効化コマンドはシステムホストファイルを変更するためにrootが必要です：

```bash
sudo sd adblock enable
sudo sd adblock disable
```

### 「timeout」エラーでファイルがスキャンをスキップされる

個別ファイルのタイムアウトはデフォルトで30秒です。複雑なファイルのために増やしてください：

```bash
sd config set scan.timeout_per_file_ms 60000
```

## ヘルプの取得

上記の解決策で問題が解決しない場合：

1. **既存のissueを確認：** [github.com/openprx/prx-sd/issues](https://github.com/openprx/prx-sd/issues)
2. 以下を含む**新しいissueを提出**：
   - PRX-SDバージョン（`sd info`）
   - オペレーティングシステムとカーネルバージョン
   - デバッグログ出力（`sd --log-level debug ...`）
   - 再現手順

## 次のステップ

- エンジンの動作を細かく調整するために[設定リファレンス](../configuration/reference)を確認
- 脅威がどのように識別されるかを理解するために[検出エンジン](../detection/)について学ぶ
- 問題をプロアクティブに通知するために[アラート](../alerts/)をセットアップ
