---
title: DNSプロキシ
description: "adblockフィルタリング、IOCドメインフィード、カスタムブロックリストを完全なクエリロギングで単一のリゾルバーに統合したローカルDNSプロキシを実行。"
---

# DNSプロキシ

`sd dns-proxy`コマンドは、DNS クエリをインターセプトして上流リゾルバーに転送する前に3つのエンジンでフィルタリングするローカルDNSプロキシサーバーを起動します：

1. **adblockエンジン** -- フィルターリストからの広告、トラッカー、悪意のあるドメインをブロック
2. **IOCドメインフィード** -- 脅威インテリジェンス侵害指標からのドメインをブロック
3. **カスタムDNSブロックリスト** -- ユーザー定義リストからのドメインをブロック

いずれかのフィルターに一致するクエリは`0.0.0.0`（NXDOMAIN）で応答されます。他のすべてのクエリは設定された上流DNSサーバーに転送されます。すべてのクエリとその解決ステータスはJSONLファイルにログ記録されます。

## クイックスタート

```bash
# Start the DNS proxy with defaults (listen 127.0.0.1:53, upstream 8.8.8.8:53)
sudo sd dns-proxy
```

::: tip
プロキシはデフォルトでポート53でリッスンします。これにはroot権限が必要です。非特権テストには`--listen 127.0.0.1:5353`のような高ポートを使用してください。
:::

## コマンドオプション

```bash
sd dns-proxy [OPTIONS]
```

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
| `--listen` | `127.0.0.1:53` | リッスンするアドレスとポート |
| `--upstream` | `8.8.8.8:53` | ブロックされていないクエリを転送する上流DNSサーバー |
| `--log-path` | `/tmp/prx-sd-dns.log` | JSONLクエリログファイルのパス |

## 使用例

### 基本的な使用

デフォルトアドレスでGoogle DNSを上流として起動：

```bash
sudo sd dns-proxy
```

出力：

```
>>> Starting DNS proxy (listen=127.0.0.1:53, upstream=8.8.8.8:53, log=/tmp/prx-sd-dns.log)
>>> Filter engines: adblock + dns_blocklist + ioc_domains
>>> Press Ctrl+C to stop.
```

### カスタムリッスンアドレスと上流

Cloudflare DNSを上流として使用し、カスタムポートでリッスン：

```bash
sudo sd dns-proxy --listen 127.0.0.1:5353 --upstream 1.1.1.1:53
```

### カスタムログパス

特定の場所にクエリログを書き込み：

```bash
sudo sd dns-proxy --log-path /var/log/prx-sd/dns-queries.jsonl
```

### adblockとの組み合わせ

DNSプロキシは`~/.prx-sd/adblock/`からadblockフィルターリストを自動的に読み込みます。最善のカバレッジを得るには：

```bash
# Step 1: Enable and sync adblock lists
sudo sd adblock enable
sd adblock sync

# Step 2: Start the DNS proxy (it picks up adblock rules automatically)
sudo sd dns-proxy
```

プロキシは`sd adblock`が使用するのと同じキャッシュされたフィルターリストを読み取ります。`sd adblock add`で追加されたリストは、プロキシを再起動した後に自動的に利用可能になります。

## システムのプロキシ使用設定

### Linux（systemd-resolved）

`/etc/systemd/resolved.conf`を編集：

```ini
[Resolve]
DNS=127.0.0.1
```

次に再起動：

```bash
sudo systemctl restart systemd-resolved
```

### Linux（resolv.conf）

```bash
echo "nameserver 127.0.0.1" | sudo tee /etc/resolv.conf
```

### macOS

```bash
sudo networksetup -setdnsservers Wi-Fi 127.0.0.1
```

元に戻すには：

```bash
sudo networksetup -setdnsservers Wi-Fi empty
```

::: warning
すべてのDNSトラフィックをローカルプロキシにリダイレクトすると、プロキシが停止した場合にDNS解決が失敗します。元の設定を復元するか、プロキシを再起動するまで解決できなくなります。
:::

## ログ形式

DNSプロキシはJSONL（1行に1つのJSONオブジェクト）を設定されたログパスに書き込みます。各エントリには以下が含まれます：

```json
{
  "timestamp": "2026-03-20T14:30:00.123Z",
  "query": "ads.example.com",
  "type": "A",
  "action": "blocked",
  "filter": "adblock",
  "upstream_ms": null
}
```

```json
{
  "timestamp": "2026-03-20T14:30:00.456Z",
  "query": "docs.example.com",
  "type": "A",
  "action": "forwarded",
  "filter": null,
  "upstream_ms": 12
}
```

| フィールド | 説明 |
|-------|-------------|
| `timestamp` | クエリのISO 8601タイムスタンプ |
| `query` | クエリされたドメイン名 |
| `type` | DNSレコードタイプ（A、AAAA、CNAMEなど） |
| `action` | `blocked`または`forwarded` |
| `filter` | マッチしたフィルター：`adblock`、`ioc`、`blocklist`、または`null` |
| `upstream_ms` | 上流DNSへのラウンドトリップ時間（ブロックされた場合はnull） |

## アーキテクチャ

```
Client DNS Query (port 53)
        |
        v
  +------------------+
  |  sd dns-proxy     |
  |                  |
  |  1. Adblock      |---> blocked? --> respond 0.0.0.0
  |  2. IOC domains  |---> blocked? --> respond 0.0.0.0
  |  3. DNS blocklist |---> blocked? --> respond 0.0.0.0
  |                  |
  |  Not blocked:    |
  |  Forward to      |---> upstream DNS (e.g. 8.8.8.8)
  |  upstream         |<--- response
  |                  |
  |  Log to JSONL    |
  +------------------+
        |
        v
  Client receives response
```

## サービスとして実行

DNSプロキシを永続的なsystemdサービスとして実行するには：

```bash
# Create a systemd unit file
sudo tee /etc/systemd/system/prx-sd-dns.service << 'EOF'
[Unit]
Description=PRX-SD DNS Proxy
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/sd dns-proxy --listen 127.0.0.1:53 --upstream 8.8.8.8:53 --log-path /var/log/prx-sd/dns-queries.jsonl
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable --now prx-sd-dns
```

::: tip
完全に管理されたバックグラウンド体験のために、リアルタイムファイル監視、自動シグネチャ更新を組み合わせた`sd daemon`の使用を検討してください。DNSプロキシ機能も拡張して含めることができます。
:::

## 次のステップ

- 包括的なドメインブロッキングのために[adblockフィルターリスト](./adblock)を設定
- DNS フィルタリングと並行したファイルシステム保護のために[リアルタイム監視](../realtime/)をセットアップ
- プロキシ関連設定については[設定リファレンス](../configuration/reference)を確認
