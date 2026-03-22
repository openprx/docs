---
title: プロセスメモリスキャン
description: "sd scan-memoryを使用してインメモリマルウェア、ファイルレス脅威、注入されたコードのために実行中のプロセスメモリをスキャンします。"
---

# プロセスメモリスキャン

`sd scan-memory`コマンドは実行中のプロセスのメモリをスキャンして、ディスクに一切触れることのないファイルレスマルウェア、注入されたシェルコード、インメモリ脅威を検出します。これは従来のファイルベースのスキャンを回避する高度な脅威を捕捉するために不可欠です。

::: warning 要件
- **root権限が必要** -- メモリスキャンは`/proc/<pid>/mem`を読み込み、rootまたは`CAP_SYS_PTRACE`が必要です。
- **Linuxのみ** -- プロセスメモリスキャンは現在Linuxでのみサポートされています。macOSサポートは計画中です。
:::

## 仕組み

プロセスメモリスキャンは実行中のプロセスの仮想メモリマッピングを読み込み、ファイルスキャンに使用されるのと同じ検出パイプラインを適用します：

1. **メモリ領域の列挙** -- `/proc/<pid>/maps`を解析して読み取り可能なメモリセグメント（ヒープ、スタック、匿名マッピング、マップされたファイル）を見つけます。
2. **メモリ内容の読み込み** -- `/proc/<pid>/mem`から各領域を読み込みます。
3. **YARAルールスキャン** -- シェルコードパターン、注入されたDLL、メモリ内の既知のマルウェアシグネチャを検出するために最適化されたインメモリYARAルールを適用します。
4. **パターン分析** -- RWXメモリ領域、非ファイルバックマッピング内のPEヘッダー、既知のエクスプロイトペイロードなどの疑わしいパターンを確認します。

## 基本的な使い方

実行中のすべてのプロセスをスキャン：

```bash
sudo sd scan-memory
```

PIDで特定のプロセスをスキャン：

```bash
sudo sd scan-memory --pid 1234
```

複数の特定プロセスをスキャン：

```bash
sudo sd scan-memory --pid 1234 --pid 5678 --pid 9012
```

## コマンドオプション

| オプション | ショート | デフォルト | 説明 |
|--------|-------|---------|-------------|
| `--pid` | `-p` | すべて | 指定したプロセスIDのみスキャン（繰り返し可能） |
| `--json` | `-j` | オフ | JSON形式で結果を出力 |
| `--exclude-pid` | | なし | スキャンから特定のPIDを除外 |
| `--exclude-user` | | なし | 特定のユーザーが所有するプロセスを除外 |
| `--min-region-size` | | 4096 | スキャンするメモリ領域の最小サイズ（バイト） |
| `--skip-mapped-files` | | オフ | ファイルバックメモリ領域をスキップ |

## 出力例

```bash
sudo sd scan-memory
```

```
PRX-SD Memory Scan Report
=========================
Processes scanned: 142
Memory regions scanned: 8,451
Total memory scanned: 4.2 GB

  [MALICIOUS] PID 3847 (svchost)
    Region:  0x7f4a00000000-0x7f4a00040000 (anon, RWX)
    Match:   YARA rule: memory_cobalt_strike_beacon
    Details: CobaltStrike Beacon shellcode detected in anonymous RWX mapping

  [SUSPICIOUS] PID 12045 (python3)
    Region:  0x7f8b10000000-0x7f8b10010000 (anon, RWX)
    Match:   Pattern analysis
    Details: Executable code in anonymous RWX region, possible shellcode injection

Duration: 12.4s
```

### JSON出力

```bash
sudo sd scan-memory --pid 3847 --json
```

```json
{
  "scan_type": "memory",
  "timestamp": "2026-03-21T15:00:00Z",
  "processes_scanned": 1,
  "regions_scanned": 64,
  "threats": [
    {
      "pid": 3847,
      "process_name": "svchost",
      "region_start": "0x7f4a00000000",
      "region_end": "0x7f4a00040000",
      "region_perms": "rwx",
      "region_type": "anonymous",
      "verdict": "malicious",
      "rule": "memory_cobalt_strike_beacon",
      "description": "CobaltStrike Beacon shellcode detected"
    }
  ]
}
```

## ユースケース

### インシデント対応

アクティブな調査中に、すべてのプロセスをスキャンして侵害されたサービスを発見：

```bash
sudo sd scan-memory --json > /evidence/memory-scan-$(date +%s).json
```

### ファイルレスマルウェア検出

現代のマルウェアはしばしばディスクに書き込むことなく完全にメモリ内で実行されます。一般的な技術には：

- **プロセスインジェクション** -- マルウェアは`ptrace`または`/proc/pid/mem`書き込みを使用して正規のプロセスにコードを注入
- **リフレクティブDLLローディング** -- DLLはファイルシステムに触れることなくメモリからロード
- **シェルコード実行** -- 生のシェルコードはRWXメモリに割り当てられ直接実行

`sd scan-memory`はこれらのパターンを探すことでそれらを検出します：

| 指標 | 説明 |
|-----------|-------------|
| RWX匿名マッピング | 非ファイルバックメモリの実行可能コード |
| メモリ内のPEヘッダー | LinuxプロセスメモリのWindows PE構造（クロスプラットフォームペイロード） |
| 既知のシェルコードシグネチャ | Metasploit、CobaltStrike、Sliverビーコンパターン |
| 疑わしいシスコールスタブ | フックまたはパッチされたシスコールエントリポイント |

### サーバーヘルスチェック

本番サーバーで定期的なメモリスキャンを実行：

```bash
# cronに追加: 6時間ごとにスキャン
0 */6 * * * root /usr/local/bin/sd scan-memory --json --exclude-user nobody >> /var/log/prx-sd/memory-scan.log 2>&1
```

::: tip パフォーマンスへの影響
メモリスキャンはプロセスメモリを読み込み、I/Oが一時的に増加する場合があります。本番サーバーでは低トラフィック期間にスキャンするか、クリティカルでないプロセスを除外することを検討してください。
:::

## 制限事項

- メモリスキャンはスキャン時点のプロセスメモリのスナップショットを読み込みます。急速に変化するメモリ領域では不完全な結果が得られる場合があります。
- カーネルメモリは`scan-memory`でスキャンされません。カーネルレベルの脅威検出には`sd check-rootkit`を使用してください。
- 高度に難読化または暗号化されたインメモリペイロードはYARAルールを回避する場合があります。パターン分析レイヤーが二次的な検出メカニズムを提供します。

## 次のステップ

- [ルートキット検出](./rootkit) -- カーネルおよびユーザースペースのルートキットを検出
- [ファイル＆ディレクトリスキャン](./file-scan) -- 従来のファイルベースのスキャン
- [YARAルール](../detection/yara-rules) -- メモリスキャンに使用されるルールエンジンの理解
- [検出エンジン](../detection/) -- すべての検出レイヤーの仕組み
