---
title: SSL/TLS設定
description: "自動Let's Encrypt証明書、手動証明書管理、HTTP/3 QUICサポート、TLSベストプラクティスでPRX-WAFにHTTPSを設定。"
---

# SSL/TLS設定

PRX-WAFはLet's Encrypt（ACME v2）経由の自動TLS証明書管理、手動証明書設定、QUICを通じたHTTP/3をサポートします。このページではHTTPS関連のすべての設定について説明します。

## 自動証明書（Let's Encrypt）

PRX-WAFは`instant-acme`ライブラリを使用してLet's Encryptから自動的にTLS証明書を取得および更新します。ホストがSSL有効で設定されると、PRX-WAFは以下を行います：

1. ポート80でACME HTTP-01チャレンジに応答
2. Let's Encryptから証明書を取得
3. データベースに証明書を保存
4. 有効期限前に自動更新

::: tip
自動証明書が機能するには、ACME HTTP-01チャレンジ検証のためにポート80がインターネットからアクセス可能である必要があります。
:::

## 手動証明書

自動ACMEが適さない環境では、証明書を手動で設定：

```toml
[http3]
cert_pem = "/etc/prx-waf/tls/cert.pem"
key_pem  = "/etc/prx-waf/tls/key.pem"
```

管理UIで証明書をアップロードすることもできます：

1. サイドバーの**SSL証明書**に移動
2. **証明書をアップロード**をクリック
3. 証明書チェーン（PEM）と秘密鍵（PEM）を提供
4. 証明書をホストに関連付け

またはAPIで：

```bash
curl -X POST http://localhost:9527/api/certificates \
  -H "Authorization: Bearer $TOKEN" \
  -F "cert=@/path/to/cert.pem" \
  -F "key=@/path/to/key.pem" \
  -F "host=example.com"
```

## TLSリスナー

PRX-WAFは設定されたTLSアドレスでHTTPSトラフィックをリッスンします：

```toml
[proxy]
listen_addr     = "0.0.0.0:80"      # HTTP
listen_addr_tls = "0.0.0.0:443"     # HTTPS
```

## HTTP/3（QUIC）

PRX-WAFはQuinn QUICライブラリを通じてHTTP/3をサポートします。設定で有効化：

```toml
[http3]
enabled     = true
listen_addr = "0.0.0.0:443"
cert_pem    = "/etc/prx-waf/tls/cert.pem"
key_pem     = "/etc/prx-waf/tls/key.pem"
```

::: warning
HTTP/3には有効なTLS証明書が必要です。`enabled = true`の場合、certとkeyのパスを提供する必要があります。自動Let's Encrypt証明書もHTTP/3でサポートされています。
:::

HTTP/3はHTTPSと同じポート（443）でUDP上で実行されます。QUICをサポートするクライアントは自動的にアップグレードし、他のクライアントはTCP上のHTTP/2またはHTTP/1.1にフォールバックします。

## HTTPSリダイレクト

すべてのHTTPトラフィックをHTTPSにリダイレクトするには、ポート80（HTTP）とポート443（HTTPS）の両方でホストを設定します。ホストにSSLが設定されている場合、PRX-WAFはHTTPリクエストをHTTPS相当に自動的にリダイレクトします。

## 証明書の保存

すべての証明書（自動および手動）はPostgreSQLデータベースに保存されます。`certificates`テーブル（マイグレーション`0003`）には以下が含まれます：

- 証明書チェーン（PEM）
- 秘密鍵（AES-256-GCMで暗号化）
- ドメイン名
- 有効期限
- ACMEアカウント情報（自動更新用）

::: info
秘密鍵はAES-256-GCMを使用して保存時に暗号化されます。暗号化キーは設定から導出されます。データベースに暗号化されていない秘密鍵を保存しないでください。
:::

## DockerでのHTTPS

Dockerで実行する場合、TLSトラフィックのためにポート443をマップ：

```yaml
# docker-compose.yml
services:
  prx-waf:
    ports:
      - "80:80"
      - "443:443"
      - "9527:9527"
```

HTTP/3の場合、UDPポートもマップ：

```yaml
    ports:
      - "80:80"
      - "443:443/tcp"
      - "443:443/udp"  # HTTP/3 QUIC
      - "9527:9527"
```

## ベストプラクティス

1. **本番環境では常にHTTPSを使用する。** HTTPはACMEチャレンジの処理とHTTPSへのリダイレクトのみに使用すべきです。

2. **HTTP/3を有効化する**（サポートするクライアント向け）。QUICはより高速な接続確立と損失の多いネットワークでのより良いパフォーマンスを提供します。

3. **可能な場合は自動証明書を使用する。** Let's Encrypt証明書は無料で、すべてのブラウザで信頼され、PRX-WAFによって自動更新されます。

4. **管理APIアクセスを制限する。** 管理APIは信頼されたネットワークからのみアクセス可能にすべきです：

```toml
[security]
admin_ip_allowlist = ["10.0.0.0/8", "172.16.0.0/12"]
```

## 次のステップ

- [リバースプロキシ](./reverse-proxy) -- バックエンドルーティングとホスト設定
- [ゲートウェイ概要](./index) -- レスポンスキャッシングとトンネル
- [クラスターモード](../cluster/) -- mTLS証明書を使用したマルチノードTLS
