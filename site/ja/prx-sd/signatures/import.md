---
title: ハッシュのインポート
description: PRX-SDにカスタムハッシュブロックリストとClamAVシグネチャデータベースをインポート。
---

# ハッシュのインポート

PRX-SDでは独自の脅威インテリジェンスや組織のブロックリストで検出カバレッジを拡張するために、カスタムハッシュブロックリストとClamAVシグネチャデータベースをインポートできます。

## カスタムハッシュのインポート

### 使い方

```bash
sd import [OPTIONS] <FILE>
```

### オプション

| フラグ | ショート | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--format` | `-f` | 自動検出 | ハッシュ形式：`sha256`、`sha1`、`md5`、`auto` |
| `--label` | `-l` | ファイル名 | インポートセットのラベル |
| `--replace` | | `false` | 同じラベルの既存エントリを置換 |
| `--dry-run` | | `false` | インポートせずにファイルを検証 |
| `--quiet` | `-q` | `false` | 進捗出力を抑制 |

### サポートされるハッシュファイル形式

PRX-SDはいくつかの一般的な形式を受け入れます：

**プレーンリスト** -- 1行に1ハッシュ：

```
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

**ラベル付きハッシュ** -- ハッシュの後にスペースとオプションの説明：

```
e3b0c44298fc1c149afbf4c8996fb924  empty_file
d7a8fbb307d7809469ca9abcb0082e4f  known_malware_sample
```

**CSV形式** -- ヘッダー付きカンマ区切り：

```csv
hash,family,source
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855,Emotet,internal
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592,TrickBot,partner
```

**コメント行** -- `#`で始まる行は無視されます：

```
# Custom blocklist - updated 2026-03-21
# Source: internal threat hunting team
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

::: tip
ハッシュ形式は長さに基づいて自動検出されます：32文字 = MD5、40文字 = SHA-1、64文字 = SHA-256。検出が失敗した場合は`--format`で上書きできます。
:::

### インポート例

```bash
# Import a SHA-256 blocklist
sd import threat_hashes.txt

# Import with explicit format and label
sd import --format md5 --label "partner-feed-2026Q1" partner_hashes.txt

# Dry run to validate file
sd import --dry-run suspicious_hashes.csv

# Replace an existing import set
sd import --replace --label "daily-feed" today_hashes.txt
```

### インポート出力

```
Importing hashes from threat_hashes.txt...
  Format:    SHA-256 (auto-detected)
  Label:     threat_hashes
  Total:     1,247 lines
  Valid:     1,203 hashes
  Skipped:   44 (duplicates: 38, invalid: 6)
  Imported:  1,203 new entries
  Database:  ~/.prx-sd/signatures/hashes/custom.lmdb
```

## ClamAVデータベースのインポート

### 使い方

```bash
sd import-clamav [OPTIONS] <FILE>
```

### オプション

| フラグ | ショート | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--type` | `-t` | 自動検出 | データベースタイプ：`cvd`、`cld`、`hdb`、`hsb`、`auto` |
| `--quiet` | `-q` | `false` | 進捗出力を抑制 |

### サポートされるClamAV形式

| 形式 | 拡張子 | 説明 |
|--------|-----------|-------------|
| **CVD** | `.cvd` | ClamAVウイルスデータベース（圧縮、署名済み） |
| **CLD** | `.cld` | ClamAVローカルデータベース（増分更新） |
| **HDB** | `.hdb` | MD5ハッシュデータベース（プレーンテキスト） |
| **HSB** | `.hsb` | SHA-256ハッシュデータベース（プレーンテキスト） |
| **NDB** | `.ndb` | 拡張シグネチャ形式（ボディベース） |

::: warning
CVD/CLDファイルは非常に大きくなる場合があります。`main.cvd`ファイルだけで600万件以上のシグネチャを含み、インポート後に約300 MBのディスクスペースが必要です。
:::

### ClamAVインポート例

```bash
# Import the main ClamAV database
sd import-clamav /var/lib/clamav/main.cvd

# Import the daily update database
sd import-clamav /var/lib/clamav/daily.cvd

# Import a plain-text hash database
sd import-clamav custom_sigs.hdb

# Import an SHA-256 hash database
sd import-clamav my_hashes.hsb
```

### ClamAV統合のセットアップ

ClamAVシグネチャをPRX-SDで使用するには：

1. freshclam（ClamAV更新ツール）をインストール：

```bash
# Debian/Ubuntu
sudo apt install clamav

# macOS
brew install clamav

# Fedora/RHEL
sudo dnf install clamav-update
```

2. データベースをダウンロード：

```bash
sudo freshclam
```

3. PRX-SDにインポート：

```bash
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

4. configでClamAVを有効化：

```toml
[signatures.sources]
clamav = true
```

## インポートされたハッシュの管理

インポートされたハッシュセットを表示：

```bash
sd info --imports
```

```
Custom Hash Imports:
  threat_hashes       1,203 SHA-256  imported 2026-03-21
  partner-feed-2026Q1   847 MD5      imported 2026-03-15
  daily-feed          2,401 SHA-256  imported 2026-03-21

ClamAV Imports:
  main.cvd            6,234,109 sigs  imported 2026-03-20
  daily.cvd           1,847,322 sigs  imported 2026-03-21
```

インポートセットを削除：

```bash
sd import --remove --label "partner-feed-2026Q1"
```

## 次のステップ

- [カスタムYARAルール](./custom-rules) -- パターンベースの検出ルールを作成
- [シグネチャソース](./sources) -- すべての利用可能な脅威インテリジェンスソース
- [シグネチャの更新](./update) -- データベースを最新の状態に保つ
- [脅威インテリジェンス概要](./index) -- データベースアーキテクチャ
