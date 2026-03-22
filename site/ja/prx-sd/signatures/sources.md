---
title: シグネチャソース
description: "更新頻度とカバレッジを含む、PRX-SDに統合されたすべての脅威インテリジェンスソースの詳細情報。"
---

# シグネチャソース

PRX-SDは20以上のオープンソースおよびコミュニティのソースから脅威インテリジェンスを集約します。このページでは各ソース、カバレッジ、更新頻度、データタイプについて詳細情報を提供します。

## abuse.chソース

abuse.chプロジェクトは複数の高品質で無料の脅威フィードを提供します：

| ソース | データタイプ | 内容 | 更新頻度 | ライセンス |
|--------|-----------|---------|-----------------|---------|
| **MalwareBazaar** | SHA-256 | 世界中の研究者が提出したマルウェアサンプル。最新提出の48時間ローリングウィンドウ。 | 5分ごと | CC0 |
| **URLhaus** | SHA-256 | マルウェア配布URLに関連するファイルハッシュ。ドライブバイダウンロード、フィッシングペイロード、エクスプロイトキットドロップを対象。 | 毎時 | CC0 |
| **Feodo Tracker** | SHA-256 | バンキング型トロイの木馬とローダー：Emotet、Dridex、TrickBot、QakBot、BazarLoader、IcedID。 | 5分ごと | CC0 |
| **ThreatFox** | SHA-256 | 複数のマルウェアファミリーにわたるコミュニティ提出のIOC。ファイルハッシュ、ドメイン、IPを含む。 | 毎時 | CC0 |
| **SSL Blacklist** | SHA-1（証明書） | ボットネットC2サーバーが使用するSSL証明書のSHA-1フィンガープリント。ネットワークIOCマッチングに使用。 | 毎日 | CC0 |

::: tip
すべてのabuse.chフィードは登録やAPIキーなしで利用できます。PRX-SDはパブリックAPIエンドポイントから直接ダウンロードします。
:::

## VirusShare

| フィールド | 詳細 |
|-------|---------|
| **データタイプ** | MD5ハッシュ |
| **件数** | 2,000万件以上 |
| **内容** | 最大級のパブリックマルウェアハッシュリポジトリの一つ。番号付きリストファイル（VirusShare_00000.md5からVirusShare_00500+.md5）に整理されたMD5ハッシュを含む。 |
| **更新頻度** | 定期的に新しいリストファイルが追加される |
| **アクセス** | 無料（ダウンロードサイズのため`--full`フラグが必要） |
| **ライセンス** | 非商用利用は無料 |

::: warning
VirusShareの完全ダウンロードは約500 MBで、インポートに相当な時間がかかります。`sd update --full`で含めるか、VirusShareなしの標準更新に`sd update`を使用してください。
:::

## YARAルールソース

| ソース | ルール数 | 対象分野 | 品質 |
|--------|-----------|------------|---------|
| **内蔵ルール** | 64件 | Linux、macOS、Windows全体でのランサムウェア、トロイの木馬、バックドア、ルートキット、マイナー、ウェブシェル | PRX-SDチームが精選 |
| **Yara-Rules/rules** | コミュニティ | Emotet、TrickBot、CobaltStrike、Mirai、LockBit、APT | コミュニティ維持 |
| **Neo23x0/signature-base** | 高ボリューム | APT29、Lazarusグループ、暗号マイニング、ウェブシェル、ランサムウェアファミリー | 高品質、Florian Roth |
| **ReversingLabs YARA** | 商用グレード | トロイの木馬、ランサムウェア、バックドア、ハッキングツール、エクスプロイト | プロフェッショナルグレード、オープンソース |
| **Elastic Security** | 成長中 | Windows、Linux、macOSの脅威を対象としたエンドポイント検出ルール | Elastic脅威研究チーム |
| **Google GCTI** | 選択的 | Google Cloud Threat Intelligenceからの高信頼ルール | 非常に高品質 |
| **ESET IOC** | 選択的 | APT追跡：Turla、Interception、InvisiMole、その他の高度な脅威 | APT専門 |
| **InQuest** | 専門的 | 悪意のあるドキュメント：OLEエクスプロイト、DDEインジェクション、マクロベースのマルウェア | ドキュメント特化 |

### YARAルールカテゴリ

組み合わせたルールセットはこれらのマルウェアカテゴリをカバーします：

| カテゴリ | ファミリー例 | プラットフォームカバレッジ |
|----------|-----------------|------------------|
| ランサムウェア | WannaCry、LockBit、Conti、REvil、Akira、BlackCat | Windows、Linux |
| トロイの木馬 | Emotet、TrickBot、QakBot、Agent Tesla、RedLine | Windows |
| バックドア | CobaltStrike、Metasploit、ShadowPad、PlugX | クロスプラットフォーム |
| ルートキット | Reptile、Diamorphine、Horse Pill | Linux |
| マイナー | XMRig、CCMinerバリアント | クロスプラットフォーム |
| ウェブシェル | China Chopper、WSO、b374k、c99、r57 | クロスプラットフォーム |
| APT | APT29、Lazarus、Turla、Sandworm、OceanLotus | クロスプラットフォーム |
| エクスプロイト | EternalBlue、PrintNightmare、Log4Shellペイロード | クロスプラットフォーム |
| ハッキングツール | Mimikatz、Rubeus、BloodHound、Impacket | Windows |
| ドキュメント | 悪意のあるOfficeマクロ、PDFエクスプロイト、RTFエクスプロイト | クロスプラットフォーム |

## IOCフィードソース

| ソース | 指標タイプ | 件数 | 内容 | 更新頻度 |
|--------|---------------|-------|---------|-----------------|
| **IPsum** | IPアドレス | 150,000件以上 | 50以上のブロックリストからの集約された悪意のあるIPレピュテーション。マルチレベルスコアリング（IPを引用するリスト数に基づくレベル1-8）。 | 毎日 |
| **FireHOL** | IPアドレス | 200,000件以上 | 脅威レベル別に整理された精選IPブロックリスト（level1からlevel4）。レベルが高いほど厳格な包含基準。 | 6時間ごと |
| **Emerging Threats** | IPアドレス | 100,000件以上 | SuricataおよびSnort IDSルールから抽出されたIP。ボットネットC2、スキャン、ブルートフォース、エクスプロイト試行をカバー。 | 毎日 |
| **SANS ISC** | IPアドレス | 50,000件以上 | インターネットストームセンターのDShieldセンサーネットワークからの不審なIP。 | 毎日 |
| **URLhaus（URL）** | URL | 85,000件以上 | マルウェア配布、フィッシング、エクスプロイト配信に使用されるアクティブな悪意のあるURL。 | 毎時 |

## ClamAVデータベース

| フィールド | 詳細 |
|-------|---------|
| **データタイプ** | マルチフォーマットシグネチャ（ハッシュ、バイトコード、正規表現、論理） |
| **件数** | 11,000,000件以上のシグネチャ |
| **ファイル** | `main.cvd`（コア）、`daily.cvd`（毎日更新）、`bytecode.cvd`（バイトコードルール） |
| **内容** | 最大のオープンソースウイルスシグネチャデータベース。ウイルス、トロイの木馬、ワーム、フィッシング、PUAをカバー。 |
| **更新頻度** | 毎日複数回 |
| **アクセス** | freshclamまたは直接ダウンロードで無料 |

ClamAV統合を有効にするには：

```bash
# Import ClamAV databases
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

詳細なClamAVインポート手順については[ハッシュのインポート](./import)を参照してください。

## ソース設定

`config.toml`で個々のソースを有効/無効化：

```toml
[signatures.sources]
malware_bazaar = true
urlhaus = true
feodo_tracker = true
threatfox = true
ssl_blacklist = true
virusshare = false          # Enable with sd update --full
builtin_rules = true
yara_community = true
neo23x0 = true
reversinglabs = true
elastic = true
gcti = true
eset = true
inquest = true
ipsum = true
firehol = true
emerging_threats = true
sans_isc = true
clamav = false              # Enable after importing ClamAV DBs
```

## 次のステップ

- [シグネチャの更新](./update) -- すべてのソースをダウンロードして更新
- [ハッシュのインポート](./import) -- カスタムハッシュとClamAVデータベースを追加
- [カスタムYARAルール](./custom-rules) -- 独自の検出ルールを作成
- [脅威インテリジェンス概要](./index) -- アーキテクチャとデータディレクトリのレイアウト
