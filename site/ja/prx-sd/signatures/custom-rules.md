---
title: カスタムYARAルール
description: "お使いの環境に特有の脅威を検出するために、PRX-SD向けカスタムYARAルールを作成、テスト、デプロイ。"
---

# カスタムYARAルール

YARAはマルウェア検出のために設計されたパターンマッチング言語です。PRX-SDは内蔵ルールやコミュニティルールと並んでカスタムYARAルールの読み込みをサポートしており、特定の脅威環境に合わせた検出ロジックを作成できます。

## ルールファイルの場所

カスタムYARAルールを`~/.prx-sd/yara/`ディレクトリに配置：

```
~/.prx-sd/yara/
  custom_ransomware.yar
  internal_threats.yar
  compliance_checks.yar
```

PRX-SDは起動時とシグネチャ更新時にこのディレクトリからすべての`.yar`および`.yara`ファイルを読み込みます。ルールは高速スキャンのために最適化されたキャッシュ（`compiled.yarc`）にコンパイルされます。

::: tip
サブディレクトリがサポートされています。カテゴリ別にルールを整理して管理しやすくできます：
```
~/.prx-sd/yara/
  ransomware/
    lockbit_variant.yar
    custom_encryptor.yar
  webshells/
    internal_webshell.yar
  compliance/
    pii_detection.yar
```
:::

## YARAルール構文

YARAルールは3つのセクションで構成されます：**meta**、**strings**、**condition**。

### 基本的なルール構造

```yara
rule Detect_CustomMalware : trojan
{
    meta:
        author = "Security Team"
        description = "Detects custom trojan used in targeted attack"
        severity = "high"
        date = "2026-03-21"
        reference = "https://internal.wiki/incident-2026-042"

    strings:
        $magic = { 4D 5A 90 00 }              // PE header (hex bytes)
        $str1 = "cmd.exe /c" ascii nocase      // ASCII string, case-insensitive
        $str2 = "powershell -enc" ascii nocase
        $str3 = "C:\\Users\\Public\\payload" wide  // UTF-16 string
        $mutex = "Global\\CustomMutex_12345"
        $regex = /https?:\/\/[a-z0-9]{8,12}\.onion/ // Regex pattern

    condition:
        $magic at 0 and
        (2 of ($str*)) and
        ($mutex or $regex)
}
```

### 主要な構文要素

| 要素 | 構文 | 説明 |
|---------|--------|-------------|
| 16進文字列 | `{ 4D 5A ?? 00 }` | ワイルドカード（`??`）付きバイトパターン |
| テキスト文字列 | `"text" ascii` | プレーンASCII文字列 |
| ワイド文字列 | `"text" wide` | UTF-16LEエンコード文字列 |
| 大文字小文字を無視 | `"text" nocase` | 大文字小文字に関係なくマッチ |
| 正規表現 | `/pattern/` | 正規表現パターン |
| タグ | `rule Name : tag1 tag2` | 分類タグ |
| ファイルサイズ | `filesize < 1MB` | ファイルサイズの条件 |
| エントリポイント | `entrypoint` | PE/ELFエントリポイントオフセット |
| オフセット指定 | `$str at 0x100` | 特定オフセットの文字列 |
| 範囲内 | `$str in (0..1024)` | バイト範囲内の文字列 |
| カウント | `#str > 3` | 文字列の出現回数 |

### 重大度レベル

PRX-SDは脅威分類を決定するために`severity`メタフィールドを読み取ります：

| 重大度 | PRX-SD判定 |
|----------|---------------|
| `critical` | MALICIOUS |
| `high` | MALICIOUS |
| `medium` | SUSPICIOUS |
| `low` | SUSPICIOUS |
| （未設定） | SUSPICIOUS |

## ルール例

### 不審なスクリプトの検出

```yara
rule Suspicious_PowerShell_Download : script
{
    meta:
        author = "Security Team"
        description = "PowerShell script downloading and executing remote content"
        severity = "high"

    strings:
        $dl1 = "Invoke-WebRequest" ascii nocase
        $dl2 = "Net.WebClient" ascii nocase
        $dl3 = "DownloadString" ascii nocase
        $dl4 = "DownloadFile" ascii nocase
        $exec1 = "Invoke-Expression" ascii nocase
        $exec2 = "iex(" ascii nocase
        $exec3 = "Start-Process" ascii nocase
        $enc = "-EncodedCommand" ascii nocase
        $bypass = "-ExecutionPolicy Bypass" ascii nocase

    condition:
        filesize < 5MB and
        (any of ($dl*)) and
        (any of ($exec*) or $enc or $bypass)
}
```

### 暗号通貨マイナーの検出

```yara
rule Crypto_Miner_Strings : miner
{
    meta:
        author = "Security Team"
        description = "Detects cryptocurrency mining software"
        severity = "medium"

    strings:
        $pool1 = "stratum+tcp://" ascii
        $pool2 = "stratum+ssl://" ascii
        $pool3 = "pool.minexmr.com" ascii
        $pool4 = "xmrpool.eu" ascii
        $algo1 = "cryptonight" ascii nocase
        $algo2 = "randomx" ascii nocase
        $algo3 = "ethash" ascii nocase
        $wallet = /[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}/ ascii  // Monero address

    condition:
        (any of ($pool*)) or
        ((any of ($algo*)) and $wallet)
}
```

### ウェブシェルの検出

```yara
rule PHP_Webshell_Generic : webshell
{
    meta:
        author = "Security Team"
        description = "Generic PHP webshell detection"
        severity = "critical"

    strings:
        $php = "<?php" ascii nocase
        $eval1 = "eval(" ascii nocase
        $eval2 = "assert(" ascii nocase
        $eval3 = "preg_replace" ascii nocase
        $input1 = "$_GET[" ascii
        $input2 = "$_POST[" ascii
        $input3 = "$_REQUEST[" ascii
        $input4 = "$_COOKIE[" ascii
        $cmd1 = "system(" ascii nocase
        $cmd2 = "passthru(" ascii nocase
        $cmd3 = "shell_exec(" ascii nocase
        $cmd4 = "exec(" ascii nocase
        $obf1 = "base64_decode" ascii nocase
        $obf2 = "str_rot13" ascii nocase
        $obf3 = "gzinflate" ascii nocase

    condition:
        $php and
        (any of ($eval*)) and
        (any of ($input*)) and
        (any of ($cmd*) or any of ($obf*))
}
```

## ルールのテスト

デプロイ前にルールを検証：

```bash
# Compile-check a rule file (syntax validation)
sd yara validate ~/.prx-sd/yara/custom_ransomware.yar

# Test a rule against a specific file
sd yara test ~/.prx-sd/yara/custom_ransomware.yar /path/to/sample

# Test all custom rules against a directory of samples
sd yara test ~/.prx-sd/yara/ /path/to/samples/ --recursive

# Dry-run scan using only custom rules
sd scan --yara-only --yara-path ~/.prx-sd/yara/ /path/to/test
```

::: warning
本番監視にデプロイする前に、誤検知を確認するために既知のクリーンなファイルのセットに対して新しいルールを必ずテストしてください。
:::

## ルールのリロード

ルールを追加または変更した後、デーモンを再起動せずにリロード：

```bash
# Recompile and reload rules
sd yara reload

# If running as daemon, send SIGHUP
kill -HUP $(cat ~/.prx-sd/sd.pid)
```

## ルールのコントリビュート

PRX-SDコミュニティとルールを共有：

1. [prx-sd-signatures](https://github.com/OpenPRX/prx-sd-signatures)リポジトリをフォーク
2. 適切なカテゴリディレクトリにルールを追加
3. 包括的な`meta`フィールドを含める（author、description、severity、reference）
4. 悪意のあるサンプルとクリーンなファイルの両方でテスト
5. 検証用のサンプルハッシュを含むプルリクエストを提出

## 次のステップ

- [シグネチャソース](./sources) -- コミュニティおよびサードパーティのYARAルールソース
- [ハッシュのインポート](./import) -- ハッシュベースのブロックリストを追加
- [シグネチャの更新](./update) -- すべてのルールを最新の状態に保つ
- [脅威インテリジェンス概要](./index) -- 完全なシグネチャアーキテクチャ
