---
title: 広告・悪意のあるドメインブロック
description: "sd adblockコマンドを使用してDNSレベルで広告、トラッカー、悪意のあるドメインをブロック。複数のフィルターリスト、カスタムルール、永続ロギングをサポート。"
---

# 広告・悪意のあるドメインブロック

PRX-SDには、広告、トラッカー、既知の悪意のあるドメインをDNSレベルでブロックする内蔵adblockエンジンが含まれています。Linuxおよびmacosのシステムホストファイル（`/etc/hosts`）、Windowsの`C:\Windows\System32\drivers\etc\hosts`にエントリを書き込む方式で機能します。フィルターリストは`~/.prx-sd/adblock/`にローカルに保存され、Adblock Plus（ABP）構文とホストファイル形式の両方をサポートします。

## 仕組み

adblockを有効にすると、PRX-SDは：

1. 設定されたフィルターリストをダウンロード（EasyList、abuse.ch URLhausなど）
2. ABPルール（`||domain.com^`）とホストエントリ（`0.0.0.0 domain.com`）を解析
3. ブロックされたすべてのドメインをシステムホストファイルに書き込み、`0.0.0.0`に向ける
4. すべてのブロックされたドメインルックアップを`~/.prx-sd/adblock/blocked_log.jsonl`にログ記録

::: tip
上流フォワーディングを伴う完全なDNSレベルフィルタリングには、adblockと[DNSプロキシ](./dns-proxy)を組み合わせてください。プロキシはadblockルール、IOCドメインフィード、カスタムブロックリストを単一のリゾルバーに統合します。
:::

## コマンド

### 保護の有効化

フィルターリストをダウンロードして、ホストファイル経由のDNSブロッキングをインストールします。rootまたは管理者権限が必要です。

```bash
sudo sd adblock enable
```

出力：

```
>>> Enabling adblock protection...
  Loaded 4 lists (128432 rules)
success: Adblock enabled: 95211 domains blocked via /etc/hosts
  Lists: ["easylist", "easyprivacy", "urlhaus-domains", "malware-domains"]
  Log: /home/user/.prx-sd/adblock/blocked_log.jsonl
```

### 保護の無効化

ホストファイルからすべてのPRX-SDエントリを削除します。認証情報とキャッシュされたリストは保持されます。

```bash
sudo sd adblock disable
```

### フィルターリストの同期

設定されたすべてのフィルターリストを強制再ダウンロードします。adblockが現在有効な場合、ホストファイルは新しいルールで自動的に更新されます。

```bash
sudo sd adblock sync
```

### 統計の表示

現在のステータス、読み込まれたリスト、ルール数、ブロックログサイズを表示します。

```bash
sd adblock stats
```

出力：

```
Adblock Engine Statistics
  Status:        ENABLED
  Lists loaded:  4
  Total rules:   128432
  Cache dir:     /home/user/.prx-sd/adblock
  Last sync:     2026-03-20T14:30:00Z
  Blocked log:   1842 entries

  - easylist
  - easyprivacy
  - urlhaus-domains
  - malware-domains
```

### URLまたはドメインの確認

特定のURLまたはドメインが現在のフィルターリストによってブロックされているかテストします。

```bash
sd adblock check ads.example.com
sd adblock check https://tracker.analytics.io/pixel.js
```

ドメインにスキームが完全に指定されていない場合、PRX-SDは自動的に`https://`を前に付加します。

出力：

```
BLOCKED ads.example.com -> Ads
```

または：

```
ALLOWED docs.example.com
```

### ブロックログの表示

永続的なJSONLログからの最近のブロックされたエントリを表示します。`--count`フラグで表示するエントリ数を制御します（デフォルト：50）。

```bash
sd adblock log
sd adblock log --count 100
```

各ログエントリにはタイムスタンプ、ドメイン、URL、カテゴリ、ソースが含まれます。

### カスタムフィルターリストの追加

名前とURLでサードパーティまたはカスタムフィルターリストを追加します。`--category`フラグでリストを分類します（デフォルト：`unknown`）。

利用可能なカテゴリ：`ads`、`tracking`、`malware`、`social`。

```bash
sd adblock add my-blocklist https://example.com/blocklist.txt --category malware
```

### フィルターリストの削除

以前に追加したフィルターリストを名前で削除します。

```bash
sd adblock remove my-blocklist
```

## デフォルトフィルターリスト

PRX-SDには以下の内蔵フィルターソースが付属しています：

| リスト | カテゴリ | 説明 |
|------|----------|-------------|
| EasyList | 広告 | コミュニティ維持の広告フィルターリスト |
| EasyPrivacy | トラッキング | トラッカーとフィンガープリンティング保護 |
| URLhaus Domains | マルウェア | abuse.ch悪意のあるURLドメイン |
| Malware Domains | マルウェア | 既知のマルウェア配布ドメイン |

## フィルターリスト形式

カスタムリストはAdblock Plus（ABP）構文またはホストファイル形式を使用できます：

**ABP形式：**

```
||ads.example.com^
||tracker.analytics.io^
```

**ホスト形式：**

```
0.0.0.0 ads.example.com
127.0.0.1 tracker.analytics.io
```

`!`、`#`、または`[`で始まる行はコメントとして扱われ無視されます。

## データディレクトリ構造

```
~/.prx-sd/adblock/
  enabled           # Flag file (present when adblock is active)
  config.json       # Source list configuration
  blocked_log.jsonl # Persistent block log
  lists/            # Cached filter list files
```

::: warning
adblockの有効化と無効化はシステムホストファイルを変更します。ホストファイルを手動で編集するのではなく、常に`sd adblock disable`を使用してエントリを完全に削除してください。このコマンドにはroot/管理者権限が必要です。
:::

## 例

**完全なセットアップワークフロー：**

```bash
# Enable with default lists
sudo sd adblock enable

# Add a custom malware blocklist
sd adblock add threatfox-domains https://threatfox.abuse.ch/export/hostfile/ --category malware

# Re-sync to download the new list
sudo sd adblock sync

# Verify a known malicious domain is blocked
sd adblock check malware-c2.example.com

# Check stats
sd adblock stats

# View recent blocks
sd adblock log --count 20
```

**無効化とクリーンアップ：**

```bash
sudo sd adblock disable
```

## 次のステップ

- 上流フォワーディングを伴う完全なDNSレベルフィルタリングのために[DNSプロキシ](./dns-proxy)をセットアップ
- ドメインがブロックされたときに通知を受け取るために[Webhookアラート](../alerts/)を設定
- 完全なコマンドリストについては[CLIリファレンス](../cli/)を参照
