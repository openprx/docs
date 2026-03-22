---
title: USBデバイススキャン
description: "sd scan-usbを使用してリムーバブルUSBストレージデバイスが接続されたときに自動的に検出してマルウェアをスキャンします。"
---

# USBデバイススキャン

`sd scan-usb`コマンドは接続されたリムーバブルUSBストレージデバイスを検出し、その内容のマルウェアをスキャンします。これはUSBドライブがマルウェア配布の一般的なベクターである環境（エアギャップネットワーク、共有ワークステーション、産業制御システムなど）にとって不可欠です。

## 仕組み

呼び出されると、`sd scan-usb`は以下の手順を実行します：

1. **デバイス検出** -- `/sys/block/`を通じてブロックデバイスを列挙し、リムーバブルデバイス（USBマスストレージ）を識別します。
2. **マウント検出** -- デバイスがすでにマウントされているかを確認します。されていない場合は、スキャンのために一時ディレクトリに読み取り専用モードでオプションとしてマウントできます。
3. **完全スキャン** -- デバイス上のすべてのファイルに対して完全な検出パイプライン（ハッシュマッチング、YARAルール、ヒューリスティック分析）を実行します。
4. **レポート** -- ファイルごとの判定を含むスキャンレポートを生成します。

::: tip 自動マウント
デフォルトでは、`sd scan-usb`はすでにマウントされているデバイスをスキャンします。マウントされていないUSBデバイスをスキャンのために自動的に読み取り専用モードでマウントするには`--auto-mount`を使用してください。
:::

## 基本的な使い方

接続されているすべてのUSBストレージデバイスをスキャン：

```bash
sd scan-usb
```

出力例：

```
PRX-SD USB Scan
===============
Detected USB devices:
  /dev/sdb1 → /media/user/USB_DRIVE (vfat, 16 GB)

Scanning /media/user/USB_DRIVE...
Scanned: 847 files (2.1 GB)
Threats: 1

  [MALICIOUS] /media/user/USB_DRIVE/autorun.exe
    Layer:   YARA rule
    Rule:    win_worm_usb_spreader
    Details: USB worm with autorun.inf exploitation

Duration: 4.2s
```

## コマンドオプション

| オプション | ショート | デフォルト | 説明 |
|--------|-------|---------|-------------|
| `--auto-quarantine` | `-q` | オフ | 検出された脅威を自動的に隔離 |
| `--auto-mount` | | オフ | マウントされていないUSBデバイスを読み取り専用モードでマウント |
| `--device` | `-d` | すべて | 特定のデバイスのみスキャン（例：`/dev/sdb1`） |
| `--json` | `-j` | オフ | JSON形式で結果を出力 |
| `--eject-after` | | オフ | スキャン後にデバイスを安全に排出 |
| `--max-size-mb` | | 100 | このサイズより大きいファイルをスキップ |

## 自動隔離

USBデバイスで見つかった脅威を自動的に隔離：

```bash
sd scan-usb --auto-quarantine
```

```
Scanning /media/user/USB_DRIVE...
  [MALICIOUS] /media/user/USB_DRIVE/autorun.exe → Quarantined (QR-20260321-012)
  [MALICIOUS] /media/user/USB_DRIVE/.hidden/payload.bin → Quarantined (QR-20260321-013)

Threats quarantined: 2
Safe to use: Review remaining files before opening.
```

::: warning 重要
`--auto-quarantine`をUSBスキャンで使用すると、悪意のあるファイルはUSBデバイスから削除されるのではなく、ホストマシンのローカル隔離ボールトに移動されます。`--remediate`も使用しない限り、USB上の元のファイルはそのまま残ります。
:::

## 特定のデバイスのスキャン

複数のUSBデバイスが接続されている場合、特定のものをスキャン：

```bash
sd scan-usb --device /dev/sdb1
```

スキャンせずに検出されたUSBデバイスを一覧表示：

```bash
sd scan-usb --list
```

```
Detected USB storage devices:
  1. /dev/sdb1  Kingston DataTraveler  16 GB  vfat  Mounted: /media/user/USB_DRIVE
  2. /dev/sdc1  SanDisk Ultra          64 GB  exfat Not mounted
```

## JSON出力

```bash
sd scan-usb --json
```

```json
{
  "scan_type": "usb",
  "timestamp": "2026-03-21T17:00:00Z",
  "devices": [
    {
      "device": "/dev/sdb1",
      "label": "USB_DRIVE",
      "filesystem": "vfat",
      "size_gb": 16,
      "mount_point": "/media/user/USB_DRIVE",
      "files_scanned": 847,
      "threats": [
        {
          "path": "/media/user/USB_DRIVE/autorun.exe",
          "verdict": "malicious",
          "layer": "yara",
          "rule": "win_worm_usb_spreader"
        }
      ]
    }
  ]
}
```

## 一般的なUSBの脅威

USBデバイスは以下の種類のマルウェアの配布によく使用されます：

| 脅威タイプ | 説明 | 検出レイヤー |
|-------------|-------------|-----------------|
| Autorunワーム | Windowsでの実行に`autorun.inf`を悪用 | YARAルール |
| USBドロッパー | 偽装された実行可能ファイル（例：`document.pdf.exe`） | ヒューリスティック + YARA |
| BadUSBペイロード | HIDエミュレーション攻撃を標的にしたスクリプト | ファイル分析 |
| ランサムウェアキャリア | コピー時に起動する暗号化されたペイロード | ハッシュ + YARA |
| データ漏洩ツール | データを収集して抽出するように設計されたユーティリティ | ヒューリスティック分析 |

## リアルタイム監視との統合

USB監視と`sd monitor`デーモンを組み合わせて、USBデバイスが接続されたときに自動的にスキャンできます：

```bash
sd monitor --watch-usb /home /tmp
```

これはリアルタイムファイルモニターを起動し、USB自動スキャン機能を追加します。新しいUSBデバイスがudevで検出されると、自動的にスキャンされます。

::: tip キオスクモード
公共端末や共有ワークステーションでは、`--watch-usb`と`--auto-quarantine`を組み合わせて、ユーザーの介入なしにUSBデバイスからの脅威を自動的に中和します。
:::

## 次のステップ

- [ファイル＆ディレクトリスキャン](./file-scan) -- `sd scan`の完全リファレンス
- [メモリスキャン](./memory-scan) -- 実行中のプロセスメモリをスキャン
- [ルートキット検出](./rootkit) -- システムレベルの脅威をチェック
- [検出エンジン](../detection/) -- 多層パイプラインの仕組み
