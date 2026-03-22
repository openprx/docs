---
title: ルートキット検出
description: "sd check-rootkitを使用してLinux上のカーネルおよびユーザースペースのルートキットを検出します。隠しプロセス、カーネルモジュール、システムコールフック等をチェックします。"
---

# ルートキット検出

`sd check-rootkit`コマンドはカーネルレベルとユーザースペースの両方のルートキットを検出するための深いシステム整合性チェックを実行します。ルートキットは標準のシステムツールからその存在を隠すため、最も危険なタイプのマルウェアの一つであり、従来のファイルスキャナーには見えません。

::: warning 要件
- **root権限が必要** -- ルートキット検出はカーネルデータ構造とシステム内部を読み込みます。
- **Linuxのみ** -- この機能は`/proc`、`/sys`、Linuxに固有のカーネルインターフェースに依存します。
:::

## 検出内容

PRX-SDは複数のベクターにわたってルートキットの存在をチェックします：

### カーネルレベルのチェック

| チェック | 説明 |
|-------|-------------|
| 隠しカーネルモジュール | `/proc/modules`からのロードされたモジュールをsysfsエントリと比較して不一致を発見 |
| システムコールテーブルフック | syscallテーブルエントリを既知の正常なカーネルシンボルに対して検証 |
| `/proc`の不一致 | `/proc`から隠されているが他のインターフェースから見えるプロセスを検出 |
| カーネルシンボルの改ざん | 主要なカーネル構造体の変更された関数ポインタを確認 |
| 割り込みデスクリプタテーブル | 予期しない変更のためにIDTエントリを検証 |

### ユーザースペースのチェック

| チェック | 説明 |
|-------|-------------|
| 隠しプロセス | `readdir(/proc)`の結果をブルートフォースPID列挙とクロスリファレンス |
| LD_PRELOAD注入 | `LD_PRELOAD`または`/etc/ld.so.preload`を通じてロードされた悪意のある共有ライブラリを確認 |
| バイナリの置き換え | 重要なシステムバイナリ（`ls`、`ps`、`netstat`、`ss`、`lsof`）の整合性を検証 |
| 隠しファイル | `getdents`シスコールをインターセプトして隠されたファイルを検出 |
| 疑わしいcronエントリ | 難読化またはエンコードされたコマンドのcrontabをスキャン |
| systemdサービスの改ざん | 不正または変更されたsystemdユニットを確認 |
| SSHバックドア | 不正なSSHキー、変更された`sshd_config`、バックドアされた`sshd`バイナリを探す |
| ネットワークリスナー | `ss`/`netstat`で表示されない隠しネットワークソケットを識別 |

## 基本的な使い方

完全なルートキットチェックを実行：

```bash
sudo sd check-rootkit
```

出力例：

```
PRX-SD Rootkit Check
====================
System: Linux 6.12.48 x86_64
Checks: 14 performed

Kernel Checks:
  [PASS] Kernel module list consistency
  [PASS] System call table integrity
  [PASS] /proc filesystem consistency
  [PASS] Kernel symbol verification
  [PASS] Interrupt descriptor table

Userspace Checks:
  [PASS] Hidden process detection
  [WARN] LD_PRELOAD check
    /etc/ld.so.preload exists with entry: /usr/lib/libfakeroot.so
  [PASS] Critical binary integrity
  [PASS] Hidden file detection
  [PASS] Cron entry audit
  [PASS] Systemd service audit
  [PASS] SSH configuration check
  [PASS] Network listener verification
  [PASS] /dev suspicious entries

Summary: 13 passed, 1 warning, 0 critical
```

## コマンドオプション

| オプション | ショート | デフォルト | 説明 |
|--------|-------|---------|-------------|
| `--json` | `-j` | オフ | JSON形式で結果を出力 |
| `--kernel-only` | | オフ | カーネルレベルのチェックのみ実行 |
| `--userspace-only` | | オフ | ユーザースペースのチェックのみ実行 |
| `--baseline` | | なし | 比較のためのベースラインファイルへのパス |
| `--save-baseline` | | なし | 現在の状態をベースラインとして保存 |

## ベースライン比較

継続的な監視のために、既知のクリーンなシステム状態のベースラインを作成し、将来のチェックで比較します：

```bash
# 既知のクリーンなシステムでベースラインを作成
sudo sd check-rootkit --save-baseline /etc/prx-sd/rootkit-baseline.json

# 将来のチェックはベースラインと比較
sudo sd check-rootkit --baseline /etc/prx-sd/rootkit-baseline.json
```

ベースラインはカーネルモジュールリスト、syscallテーブルハッシュ、重要なバイナリのチェックサム、ネットワークリスナーの状態を記録します。逸脱があればアラートが発生します。

## JSON出力

```bash
sudo sd check-rootkit --json
```

```json
{
  "timestamp": "2026-03-21T16:00:00Z",
  "system": {
    "kernel": "6.12.48",
    "arch": "x86_64",
    "hostname": "web-server-01"
  },
  "checks": [
    {
      "name": "kernel_modules",
      "category": "kernel",
      "status": "pass",
      "details": "142 modules, all consistent"
    },
    {
      "name": "ld_preload",
      "category": "userspace",
      "status": "warning",
      "details": "/etc/ld.so.preload contains: /usr/lib/libfakeroot.so",
      "recommendation": "Verify this entry is expected. Remove if unauthorized."
    }
  ],
  "summary": {
    "total": 14,
    "passed": 13,
    "warnings": 1,
    "critical": 0
  }
}
```

## 例: カーネルモジュールルートキットの検出

ルートキットがカーネルモジュールを隠す場合、`sd check-rootkit`は不一致を検出します：

```
Kernel Checks:
  [CRITICAL] Kernel module list consistency
    Module found in /sys/module/ but missing from /proc/modules:
      - syskit (size: 45056, loaded at: 0xffffffffc0a00000)
    This is a strong indicator of a hidden kernel module rootkit.
    Recommendation: Boot from trusted media and investigate.
```

::: warning 重大な調査結果
ルートキットチェッカーからの`CRITICAL`調査結果は深刻なセキュリティインシデントとして扱うべきです。侵害された可能性があるシステムで修復を試みないでください。代わりにマシンを隔離して、信頼できるメディアから調査してください。
:::

## 定期的なチェックのスケジューリング

監視ルーティンにルートキットチェックを追加：

```bash
# cron: 4時間ごとにチェック
0 */4 * * * root /usr/local/bin/sd check-rootkit --json >> /var/log/prx-sd/rootkit-check.log 2>&1
```

## 次のステップ

- [メモリスキャン](./memory-scan) -- 実行中のプロセスのインメモリ脅威を検出
- [ファイル＆ディレクトリスキャン](./file-scan) -- 従来のファイルベースのスキャン
- [USBスキャン](./usb-scan) -- 接続時にリムーバブルメディアをスキャン
- [検出エンジン](../detection/) -- すべての検出レイヤーの概要
