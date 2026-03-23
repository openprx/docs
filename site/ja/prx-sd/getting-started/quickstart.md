---
title: クイックスタート
description: 5分でPRX-SDのマルウェアスキャンを開始します。インストール、シグネチャ更新、ファイルスキャン、結果確認、リアルタイム監視の有効化。
---

# クイックスタート

このガイドでは5分以内に初めてのマルウェアスキャンまで誘導します。完了後、PRX-SDがインストールされ、シグネチャが更新され、リアルタイム監視が実行されています。

::: tip 前提条件
`curl`がインストールされたLinuxまたはmacOSシステムが必要です。他の方法とプラットフォームの詳細については[インストールガイド](./installation)を参照してください。
:::

## ステップ1: PRX-SDをインストール

インストールスクリプトで最新リリースをダウンロードしてインストール：

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash
```

インストールを確認：

```bash
sd --version
```

次のような出力が表示されます：

```
prx-sd 0.5.0
```

## ステップ2: シグネチャデータベースを更新

PRX-SDには組み込みブロックリストが含まれていますが、完全な保護のために最新の脅威インテリジェンスをダウンロードする必要があります。`update`コマンドは設定されたすべてのソースからハッシュシグネチャとYARAルールを取得します：

```bash
sd update
```

期待される出力：

```
[INFO] Updating hash signatures...
[INFO]   MalwareBazaar: 12,847 hashes (last 48h)
[INFO]   URLhaus: 8,234 hashes
[INFO]   Feodo Tracker: 1,456 hashes
[INFO]   ThreatFox: 5,891 hashes
[INFO] Updating YARA rules...
[INFO]   Built-in rules: 64
[INFO]   Yara-Rules/rules: 12,400
[INFO]   Neo23x0/signature-base: 8,200
[INFO]   ReversingLabs: 9,500
[INFO]   ESET IOC: 3,800
[INFO]   InQuest: 4,836
[INFO] Signature database updated successfully.
[INFO] Total: 28,428 hashes, 38,800 YARA rules
```

::: tip 完全更新
VirusShare完全データベース（2000万以上のMD5ハッシュ）を含めるには：
```bash
sd update --full
```
時間はかかりますが、最大のハッシュカバレッジを提供します。
:::

## ステップ3: ファイルまたはディレクトリをスキャン

疑わしいファイルをスキャン：

```bash
sd scan /path/to/suspicious_file
```

ディレクトリ全体を再帰的にスキャン：

```bash
sd scan /home --recursive
```

クリーンなディレクトリの出力例：

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 0
Status:  CLEAN

Duration: 2.3s
```

脅威が見つかった場合の出力例：

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 2

  [MALICIOUS] /home/user/downloads/invoice.exe
    Match: SHA-256 hash (MalwareBazaar)
    Family: Emotet
    Action: None (use --auto-quarantine to isolate)

  [SUSPICIOUS] /home/user/downloads/tool.bin
    Match: Heuristic analysis
    Score: 45/100
    Findings: High entropy (7.8), UPX packed
    Action: None

Duration: 3.1s
```

## ステップ4: 結果を確認してアクションを取る

自動化やログ取り込みに適したJSON形式の詳細レポート：

```bash
sd scan /home --recursive --json
```

```json
{
  "scan_id": "a1b2c3d4",
  "timestamp": "2026-03-21T10:00:00Z",
  "files_scanned": 1847,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "detection_layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924..."
    }
  ],
  "duration_ms": 3100
}
```

スキャン中に検出された脅威を自動的に隔離するには：

```bash
sd scan /home --recursive --auto-quarantine
```

隔離されたファイルは安全な暗号化ディレクトリに移動されます。一覧表示と復元が可能です：

```bash
# 隔離されたファイルを一覧表示
sd quarantine list

# 隔離IDでファイルを復元
sd quarantine restore QR-20260321-001
```

::: warning 隔離
隔離されたファイルは暗号化されており、誤って実行することはできません。ファイルが誤検知であると確信できる場合にのみ`sd quarantine restore`を使用してください。
:::

## ステップ5: リアルタイム監視を有効化

新規または変更されたファイルのディレクトリを監視するリアルタイムモニターを起動：

```bash
sd monitor /home /tmp /var/www
```

モニターはフォアグラウンドで実行され、ファイルが作成または変更されるとスキャンします：

```
[INFO] Monitoring 3 directories...
[INFO] Press Ctrl+C to stop.
[2026-03-21 10:05:32] SCAN /home/user/downloads/update.bin → CLEAN
[2026-03-21 10:07:15] SCAN /tmp/payload.sh → [MALICIOUS] YARA: linux_backdoor_reverse_shell
```

バックグラウンドサービスとしてモニターを実行するには：

```bash
# systemdサービスをインストールして起動
sd service install
sd service start

# サービスステータスを確認
sd service status
```

## これで何ができるか

これらの手順を完了すると、システムには次のものがあります：

| コンポーネント | ステータス |
|-----------|--------|
| `sd`バイナリ | PATHにインストール済み |
| ハッシュデータベース | LMDBに28,000以上のSHA-256/MD5ハッシュ |
| YARAルール | 8ソースからの38,800以上のルール |
| リアルタイムモニター | 指定したディレクトリを監視中 |

## 次のステップ

- [ファイル＆ディレクトリスキャン](../scanning/file-scan) -- スレッド、除外、サイズ制限を含むすべての`sd scan`オプションを探索
- [メモリスキャン](../scanning/memory-scan) -- メモリ内の脅威のために実行中のプロセスメモリをスキャン
- [ルートキット検出](../scanning/rootkit) -- カーネルおよびユーザースペースのルートキットをチェック
- [検出エンジン](../detection/) -- 多層パイプラインの仕組みを理解
- [YARAルール](../detection/yara-rules) -- ルールソースとカスタムルールについて学ぶ
