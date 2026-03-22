---
title: ランサムウェア保護
description: エントロピー分析、拡張子監視、バッチ暗号化検出を使用した動作的ランサムウェア検出。
---

# ランサムウェア保護

PRX-SDには、リアルタイムでランサムウェアの動作を識別する専用の`RansomwareDetector`エンジンが含まれています。既知のサンプルを必要とするシグネチャベースの検出とは異なり、ランサムウェア検出器は動作ヒューリスティックを使用してファイルの暗号化が完了する前にゼロデイランサムウェアを捕捉します。

## 仕組み

ランサムウェア検出器はリアルタイムモニターの一部として実行され、アクティブな暗号化を示すパターンのファイルシステムイベントを分析します。3つの検出軸で動作します：

### 1. バッチ暗号化検出

検出器はプロセスごとおよびディレクトリごとのファイル変更レートを追跡します。単一のプロセスが短い時間ウィンドウ内に異常に多くのファイルを変更すると、アラートがトリガーされます。

| パラメータ | デフォルト | 説明 |
|-----------|---------|-------------|
| `batch_threshold` | `20` | 検出をトリガーするファイル変更数 |
| `batch_window_secs` | `10` | バッチカウントのための時間ウィンドウ（秒） |
| `min_files_affected` | `5` | アラート前の最小区別ファイル数 |

```toml
[ransomware]
enabled = true
batch_threshold = 20
batch_window_secs = 10
min_files_affected = 5
```

### 2. 拡張子変更監視

ランサムウェアは暗号化後に新しい拡張子でファイルを名前変更することが典型的です。検出器は大量の拡張子変更、特に既知のランサムウェア拡張子への変更を監視します：

```
.encrypted, .enc, .locked, .crypto, .crypt, .crypted,
.ransomware, .ransom, .rans, .pay, .pay2key,
.locky, .zepto, .cerber, .cerber3, .dharma, .wallet,
.onion, .wncry, .wcry, .wannacry, .petya, .notpetya,
.ryuk, .conti, .lockbit, .revil, .sodinokibi,
.maze, .egregor, .darkside, .blackmatter, .hive,
.deadbolt, .akira, .alphv, .blackcat, .royal,
.rhysida, .medusa, .bianlian, .clop, .8base
```

::: warning
拡張子監視だけでは不十分です。高度なランサムウェアはランダムまたは正規に見える拡張子を使用する場合があります。PRX-SDは信頼できる検出のために拡張子変更とエントロピー分析を組み合わせます。
:::

### 3. 高エントロピー検出

暗号化されたファイルはほぼ最大のシャノンエントロピー（バイトレベル分析で8.0に近い）を持ちます。検出器は変更前後のファイルエントロピーを比較します：

| 指標 | 閾値 | 意味 |
|--------|-----------|---------|
| ファイルエントロピー | > 7.8 | ファイル内容は暗号化または圧縮されている可能性が高い |
| エントロピーデルタ | > 3.0 | ファイルが低エントロピーから高エントロピーに変化（暗号化） |
| ヘッダーエントロピー | > 7.5 | 最初の4KBが高エントロピー（元のマジックバイトが破壊） |

変更後にファイルのエントロピーが大幅に上昇し、ファイルが以前に既知のドキュメントタイプ（PDF、DOCX、画像）だった場合、これは暗号化の強い指標です。

## 検出スコアリング

各検出軸は複合ランサムウェアスコアに貢献します：

| シグナル | 重み | 説明 |
|--------|--------|-------------|
| バッチファイル変更 | 40 | 1つのプロセスによる多数のファイルの急速な変更 |
| 既知のランサムウェア拡張子への変更 | 30 | ランサムウェア拡張子でファイルが名前変更 |
| 不明な拡張子への変更 | 15 | 異常な新しい拡張子でファイルが名前変更 |
| 高エントロピーデルタ | 25 | ファイルエントロピーが大幅に増加 |
| 高絶対エントロピー | 10 | ファイルがほぼ最大エントロピーを持つ |
| 身代金ノートの作成 | 35 | 身代金ノートパターンに一致するファイルが検出 |
| シャドウコピーの削除 | 50 | ボリュームシャドウコピーを削除しようとする試み |

**60**を超える複合スコアは`MALICIOUS`判定をトリガーします。**30〜59**のスコアは`SUSPICIOUS`アラートを生成します。

## 身代金ノート検出

検出器は一般的な身代金ノートパターンに一致するファイルの作成を監視します：

```
README_RESTORE_FILES.txt, HOW_TO_DECRYPT.txt,
DECRYPT_INSTRUCTIONS.html, YOUR_FILES_ARE_ENCRYPTED.txt,
RECOVER_YOUR_FILES.txt, !README!.txt, _readme.txt,
HELP_DECRYPT.html, RANSOM_NOTE.txt, #DECRYPT#.txt
```

::: tip
身代金ノート検出はパターンベースであり、ノートファイル自体が悪意を持つ必要はありません。他のシグナルと組み合わせて、これらのパターンに一致するファイルの単なる作成がランサムウェアスコアに貢献します。
:::

## 自動対応

ランサムウェアが検出されると、設定されたポリシーに応じて対応が行われます：

| アクション | 説明 |
|--------|-------------|
| **アラート** | イベントをログに記録して通知を送信（webhook、メール） |
| **ブロック** | ファイル操作を拒否（Linux fanotifyブロックモードのみ） |
| **強制終了** | 問題のプロセスを終了 |
| **隔離** | 影響を受けたファイルを暗号化隔離ボールトに移動 |
| **隔離（ネットワーク）** | マシンのすべてのネットワークアクセスをブロック（緊急時） |

`config.toml`で対応を設定：

```toml
[ransomware.response]
on_detection = "kill"           # alert | block | kill | quarantine | isolate
quarantine_affected = true      # 証拠として変更されたファイルを隔離
notify_webhook = true           # webhook通知を送信
notify_email = true             # メールアラートを送信
snapshot_process_tree = true    # フォレンジクス用にプロセスツリーをキャプチャ
```

## 設定

完全なランサムウェア検出器の設定：

```toml
[ransomware]
enabled = true
batch_threshold = 20
batch_window_secs = 10
min_files_affected = 5
entropy_threshold = 7.8
entropy_delta_threshold = 3.0
score_threshold_malicious = 60
score_threshold_suspicious = 30

# より高い感度で保護するディレクトリ
protected_dirs = [
    "~/Documents",
    "~/Pictures",
    "~/Desktop",
    "/var/www",
]

# 監視から免除されるプロセス（例：バックアップソフトウェア）
exempt_processes = [
    "borgbackup",
    "restic",
    "rsync",
]

[ransomware.response]
on_detection = "kill"
quarantine_affected = true
notify_webhook = true
notify_email = false
```

## 例

```bash
# ランサムウェア保護で監視を開始
sd monitor --auto-quarantine /home

# ランサムウェア検出器はデーモンモードでデフォルトで有効
sd daemon start

# ランサムウェア検出器のステータスを確認
sd status --verbose
```

## 次のステップ

- [ファイル監視](./monitor) -- リアルタイム監視を設定
- [デーモン](./daemon) -- バックグラウンドサービスとして実行
- [脅威対応](/ja/prx-sd/remediation/) -- 完全な修復ポリシー設定
- [Webhookアラート](/ja/prx-sd/alerts/webhook) -- 即時通知を受け取る
