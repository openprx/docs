---
title: ファイル＆ディレクトリスキャン
description: "sd scanコマンドの完全リファレンス。ハッシュマッチング、YARAルール、ヒューリスティック分析でファイルとディレクトリのマルウェアをスキャンします。"
---

# ファイル＆ディレクトリスキャン

`sd scan`コマンドはファイルとディレクトリのマルウェアをチェックする主要な方法です。各ファイルを多層検出パイプライン（ハッシュマッチング、YARAルール、ヒューリスティック分析）で処理し、各ファイルの判定を報告します。

## 基本的な使い方

単一ファイルをスキャン：

```bash
sd scan /path/to/file
```

ディレクトリをスキャン（デフォルトでは非再帰的）：

```bash
sd scan /home/user/downloads
```

ディレクトリとすべてのサブディレクトリをスキャン：

```bash
sd scan /home --recursive
```

## コマンドオプション

| オプション | ショート | デフォルト | 説明 |
|--------|-------|---------|-------------|
| `--recursive` | `-r` | オフ | サブディレクトリに再帰 |
| `--json` | `-j` | オフ | JSON形式で結果を出力 |
| `--threads` | `-t` | CPUコア数 | 並列スキャンスレッド数 |
| `--auto-quarantine` | `-q` | オフ | 検出された脅威を自動的に隔離 |
| `--remediate` | | オフ | 自動修復を試みる（ポリシーに基づいて削除/隔離） |
| `--exclude` | `-e` | なし | ファイルまたはディレクトリを除外するglobパターン |
| `--report` | | なし | スキャンレポートをファイルパスに書き込む |
| `--max-size-mb` | | 100 | このサイズ（MB）より大きいファイルをスキップ |
| `--no-yara` | | オフ | YARAルールスキャンをスキップ |
| `--no-heuristics` | | オフ | ヒューリスティック分析をスキップ |
| `--min-severity` | | `suspicious` | 報告する最小重大度（`suspicious`または`malicious`） |

## 検出フロー

`sd scan`がファイルを処理する際、検出パイプラインを順番に通過します：

```
ファイル → マジックナンバー検出 → ファイルタイプ決定
  │
  ├─ レイヤー1: SHA-256ハッシュルックアップ（LMDB）
  │   ヒット → MALICIOUS（即時、ファイルあたり~1μs）
  │
  ├─ レイヤー2: YARA-Xルールスキャン（38,800以上のルール）
  │   ヒット → ルール名付きMALICIOUS
  │
  ├─ レイヤー3: ヒューリスティック分析（ファイルタイプ対応）
  │   スコア ≥ 60 → MALICIOUS
  │   スコア 30-59 → SUSPICIOUS
  │   スコア < 30 → CLEAN
  │
  └─ 結果集約 → 最高重大度が優先
```

パイプラインはショートサーキットします：ハッシュマッチングが見つかった場合、そのファイルのYARAとヒューリスティック分析はスキップされます。これにより大規模ディレクトリのスキャンが高速になります。ほとんどのクリーンなファイルはマイクロ秒でハッシュレイヤーで解決されます。

## 出力形式

### 人間が読める形式（デフォルト）

```bash
sd scan /home/user/downloads --recursive
```

```
PRX-SD Scan Report
==================
Scanned: 3,421 files (1.2 GB)
Skipped: 14 files (exceeded max size)
Threats: 3 (2 malicious, 1 suspicious)

  [MALICIOUS] /home/user/downloads/invoice.exe
    Layer:   Hash match (SHA-256)
    Source:  MalwareBazaar
    Family:  Emotet
    SHA-256: e3b0c44298fc1c149afbf4c8996fb924...

  [MALICIOUS] /home/user/downloads/patch.scr
    Layer:   YARA rule
    Rule:    win_ransomware_lockbit3
    Source:  ReversingLabs

  [SUSPICIOUS] /home/user/downloads/updater.bin
    Layer:   Heuristic analysis
    Score:   42/100
    Findings:
      - High section entropy: 7.91 (packed)
      - Suspicious API imports: VirtualAllocEx, WriteProcessMemory
      - Non-standard PE timestamp

Duration: 5.8s (589 files/s)
```

### JSON出力

```bash
sd scan /path --recursive --json
```

```json
{
  "scan_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2026-03-21T14:30:00Z",
  "files_scanned": 3421,
  "files_skipped": 14,
  "total_bytes": 1288490188,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
      "md5": "d41d8cd98f00b204e9800998ecf8427e"
    }
  ],
  "duration_ms": 5800,
  "throughput_files_per_sec": 589
}
```

### レポートファイル

アーカイブのために結果をファイルに書き込む：

```bash
sd scan /srv/web --recursive --report /var/log/prx-sd/scan-report.json
```

## 除外パターン

`--exclude`を使用してglobパターンに一致するファイルやディレクトリをスキップします。複数のパターンを指定できます：

```bash
sd scan /home --recursive \
  --exclude "*.log" \
  --exclude "node_modules/**" \
  --exclude ".git/**" \
  --exclude "/home/user/VMs/**"
```

::: tip パフォーマンス
`node_modules`、`.git`、仮想マシンイメージなどの大規模ディレクトリを除外するとスキャン速度が大幅に向上します。
:::

## 自動隔離

`--auto-quarantine`フラグはスキャン中に検出された脅威を隔離ボールトに移動します：

```bash
sd scan /tmp --recursive --auto-quarantine
```

```
[MALICIOUS] /tmp/dropper.exe → Quarantined (QR-20260321-007)
```

隔離されたファイルはAES-256で暗号化され、`~/.local/share/prx-sd/quarantine/`に保存されます。誤って実行することはできません。詳細については[隔離ドキュメント](../quarantine/)を参照してください。

## 使用例

### CI/CDパイプラインスキャン

デプロイ前にビルドアーティファクトをスキャン：

```bash
sd scan ./dist --recursive --json --min-severity suspicious
```

自動化のために終了コードを使用：`0` = クリーン、`1` = 脅威発見、`2` = スキャンエラー。

### Webサーバーの日次スキャン

Webアクセス可能なディレクトリのナイトリースキャンをスケジュール：

```bash
sd scan /var/www /srv/uploads --recursive \
  --auto-quarantine \
  --report /var/log/prx-sd/daily-$(date +%Y%m%d).json \
  --exclude "*.log"
```

### フォレンジック調査

読み取り専用でマウントされたディスクイメージをスキャン：

```bash
sudo mount -o ro /dev/sdb1 /mnt/evidence
sd scan /mnt/evidence --recursive --json --threads 1 --max-size-mb 500
```

::: warning 大規模スキャン
数百万のファイルをスキャンする場合、`--threads`でリソース使用量を制御し、`--max-size-mb`でスキャンを遅らせる可能性のある大きすぎるファイルをスキップしてください。
:::

### ホームディレクトリのクイックチェック

一般的な脅威場所の高速スキャン：

```bash
sd scan ~/Downloads ~/Desktop /tmp --recursive
```

## パフォーマンスチューニング

| ファイル数 | おおよその時間 | 注意事項 |
|-------|-------------------|-------|
| 1,000 | 1秒未満 | ハッシュレイヤーがほとんどのファイルを解決 |
| 10,000 | 2〜5秒 | YARAルールはファイルあたり~0.3ミリ秒追加 |
| 100,000 | 20〜60秒 | ファイルサイズとタイプに依存 |
| 1,000,000以上 | 5〜15分 | `--threads`と`--exclude`を使用 |

スキャン速度に影響する要因：

- **ディスクI/O** -- SSDはランダム読み込みでHDDより5〜10倍高速
- **ファイルサイズ分布** -- 多数の小さいファイルは少数の大きいファイルより高速
- **検出レイヤー** -- ハッシュのみスキャン（`--no-yara --no-heuristics`）が最速
- **スレッド数** -- 高速ストレージを持つマルチコアシステムでより多くのスレッドが役立つ

## 次のステップ

- [メモリスキャン](./memory-scan) -- 実行中のプロセスメモリをスキャン
- [ルートキット検出](./rootkit) -- カーネルレベルの脅威をチェック
- [USBスキャン](./usb-scan) -- リムーバブルメディアをスキャン
- [検出エンジン](../detection/) -- 各検出レイヤーの仕組み
