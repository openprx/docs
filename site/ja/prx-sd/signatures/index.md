---
title: 脅威インテリジェンス概要
description: ハッシュシグネチャ、YARAルール、IOCフィード、ClamAV統合を含むPRX-SDシグネチャデータベースのアーキテクチャ。
---

# 脅威インテリジェンス概要

PRX-SDは複数のオープンソースおよびコミュニティのソースから脅威インテリジェンスを集約し、統一されたローカルデータベースにまとめます。この多層アプローチにより、既知のマルウェアハッシュから動作パターンルール、ネットワーク侵害指標まで幅広いカバレッジを確保します。

## シグネチャカテゴリ

PRX-SDは脅威インテリジェンスを4つのカテゴリに整理します：

| カテゴリ | ソース数 | 件数 | 検索速度 | ストレージ |
|----------|---------|-------|-------------|---------|
| **ハッシュシグネチャ** | 7ソース | SHA-256/MD5 数百万件 | O(1) via LMDB | ~500 MB |
| **YARAルール** | 8ソース | 38,800+件のルール | パターンマッチング | ~15 MB |
| **IOCフィード** | 5ソース | 585,000+件の指標 | トライ / ハッシュマップ | ~25 MB |
| **ClamAVデータベース** | 1ソース | 11,000,000+件のシグネチャ | ClamAVエンジン | ~300 MB |

### ハッシュシグネチャ

最速の検出レイヤー。各ファイルはスキャン時にハッシュ化され、既知の悪意のあるファイルハッシュを含むローカルLMDBデータベースと照合されます：

- **abuse.ch MalwareBazaar** -- 最近のマルウェアサンプルのSHA-256ハッシュ（48時間ローリングウィンドウ）
- **abuse.ch URLhaus** -- 悪意のあるURLを通じて配布されるファイルのSHA-256ハッシュ
- **abuse.ch Feodo Tracker** -- バンキング型トロイの木馬（Emotet、Dridex、TrickBot）のSHA-256ハッシュ
- **abuse.ch ThreatFox** -- コミュニティ提出によるSHA-256 IOC
- **abuse.ch SSL Blacklist** -- ボットネットC2サーバーが使用する悪意のあるSSL証明書のSHA-1フィンガープリント
- **VirusShare** -- 2,000万件以上のMD5ハッシュ（`--full`更新で利用可能）
- **内蔵ブロックリスト** -- EICARテストファイル、WannaCry、NotPetya、Emotetのハードコードされたハッシュ

### YARAルール

正確なハッシュではなく、コードパターン、文字列、構造によってマルウェアを識別するパターンマッチングルール。バリアントやマルウェアファミリーも検出できます：

- **内蔵ルール** -- ランサムウェア、トロイの木馬、バックドア、ルートキット、マイナー、ウェブシェルに対応した64件の精選ルール
- **Yara-Rules/rules** -- Emotet、TrickBot、CobaltStrike、Mirai、LockBitのコミュニティ維持ルール
- **Neo23x0/signature-base** -- APT29、Lazarus、暗号マイニング、ウェブシェル向けの高品質ルール
- **ReversingLabs YARA** -- トロイの木馬、ランサムウェア、バックドア向けの商用グレードオープンソースルール
- **ESET IOC** -- Turla、Interceptionsなど高度な脅威のAPT追跡ルール
- **InQuest** -- 悪意のあるドキュメント（OLE、DDE）の専門ルール
- **Elastic Security** -- Elasticの脅威研究チームによる検出ルール
- **Google GCTI** -- Google Cloud Threat IntelligenceのYARAルール

### IOCフィード

既知の悪意のあるインフラへの接続を検出するためのネットワーク侵害指標：

- **IPsum** -- 集約された悪意のあるIPレピュテーションリスト（マルチソーススコアリング）
- **FireHOL** -- 複数の脅威レベルで精選されたIPブロックリスト
- **Emerging Threats** -- IP/ドメインIOCに変換されたSuricata/Snortルール
- **SANS ISC** -- インターネットストームセンターからの毎日の不審なIPフィード
- **URLhaus** -- フィッシング、マルウェア配布のためのアクティブな悪意のあるURL

### ClamAVデータベース

最大のオープンソースシグネチャセットを提供するClamAVウイルスデータベースとのオプション統合：

- **main.cvd** -- コアウイルスシグネチャ
- **daily.cvd** -- 毎日更新されるシグネチャ
- **bytecode.cvd** -- バイトコード検出シグネチャ

## データディレクトリ構造

すべてのシグネチャデータは`~/.prx-sd/signatures/`に保存されます：

```
~/.prx-sd/signatures/
  hashes/
    malware_bazaar.lmdb       # MalwareBazaar SHA-256
    urlhaus.lmdb              # URLhaus SHA-256
    feodo.lmdb                # Feodo Tracker SHA-256
    threatfox.lmdb            # ThreatFox IOCs
    virusshare.lmdb           # VirusShare MD5 (--full only)
    custom.lmdb               # User-imported hashes
  yara/
    builtin/                  # Built-in rules (shipped with binary)
    community/                # Downloaded community rules
    custom/                   # User-written custom rules
    compiled.yarc             # Pre-compiled rule cache
  ioc/
    ipsum.dat                 # IPsum IP reputation
    firehol.dat               # FireHOL blocklists
    et_compromised.dat        # Emerging Threats IPs
    sans_isc.dat              # SANS ISC suspicious IPs
    urlhaus_urls.dat          # URLhaus malicious URLs
  clamav/
    main.cvd                  # ClamAV main signatures
    daily.cvd                 # ClamAV daily updates
    bytecode.cvd              # ClamAV bytecode sigs
  metadata.json               # Update timestamps and version info
```

::: tip
`sd info`を使用して、ソース件数、最終更新時刻、ディスク使用量などすべてのシグネチャデータベースの現在の状態を確認できます。
:::

## シグネチャ状態の確認

```bash
sd info
```

```
PRX-SD Signature Database
  Hash signatures:    1,247,832 entries (7 sources)
  YARA rules:         38,847 rules (8 sources, 64 built-in)
  IOC indicators:     585,221 entries (5 sources)
  ClamAV signatures:  not installed
  Last updated:       2026-03-21 08:00:12 UTC
  Database version:   2026.0321.1
  Disk usage:         542 MB
```

## 次のステップ

- [シグネチャの更新](./update) -- データベースを最新の状態に保つ
- [シグネチャソース](./sources) -- 各ソースの詳細情報
- [ハッシュのインポート](./import) -- 独自のハッシュブロックリストを追加
- [カスタムYARAルール](./custom-rules) -- カスタム検出ルールの作成とデプロイ
