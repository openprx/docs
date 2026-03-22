---
title: クイックスタート
description: "5分でPRX-WAFによるWebアプリケーション保護を開始。プロキシの起動、バックエンドホストの追加、保護の確認、セキュリティイベントの監視。"
---

# クイックスタート

このガイドでは、5分以内でゼロから完全に保護されたWebアプリケーションを構築します。完了時には、PRX-WAFがバックエンドへのトラフィックをプロキシし、一般的な攻撃をブロックし、セキュリティイベントをログに記録しています。

::: tip 前提条件
DockerとDocker Composeがインストールされている必要があります。他の方法については[インストールガイド](./installation)を参照してください。
:::

## ステップ1：PRX-WAFの起動

リポジトリをクローンしてすべてのサービスを起動：

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
docker compose up -d
```

すべてのコンテナが実行中であることを確認：

```bash
docker compose ps
```

期待される出力：

```
NAME         SERVICE     STATUS
prx-waf      prx-waf     running
postgres     postgres    running
```

## ステップ2：管理UIへのログイン

ブラウザを開いて`http://localhost:9527`に移動します。デフォルト認証情報でログイン：

- **ユーザー名：** `admin`
- **パスワード：** `admin`

::: warning
初回ログイン後すぐにデフォルトパスワードを変更してください。
:::

## ステップ3：バックエンドホストの追加

管理UIまたはAPIで最初の保護済みホストを追加：

**管理UI経由：**
1. サイドバーの**ホスト**に移動
2. **ホストを追加**をクリック
3. 以下を入力：
   - **ホスト：** `example.com`（保護したいドメイン）
   - **リモートホスト：** `192.168.1.100`（バックエンドサーバーIP）
   - **リモートポート：** `8080`（バックエンドサーバーポート）
   - **ガードステータス：** 有効
4. **保存**をクリック

**API経由：**

```bash
# Obtain a JWT token
TOKEN=$(curl -s -X POST http://localhost:9527/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')

# Add a host
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "port": 80,
    "remote_host": "192.168.1.100",
    "remote_port": 8080,
    "guard_status": true
  }'
```

## ステップ4：保護のテスト

プロキシ経由で正当なリクエストを送信：

```bash
curl -H "Host: example.com" http://localhost/
```

バックエンドの通常のレスポンスが返るはずです。次に、WAFがSQLインジェクションの試みをブロックすることをテスト：

```bash
curl -H "Host: example.com" "http://localhost/?id=1%20OR%201=1--"
```

期待されるレスポンス：**403 Forbidden**

XSSの試みをテスト：

```bash
curl -H "Host: example.com" "http://localhost/?q=<script>alert(1)</script>"
```

期待されるレスポンス：**403 Forbidden**

パストラバーサルの試みをテスト：

```bash
curl -H "Host: example.com" "http://localhost/../../etc/passwd"
```

期待されるレスポンス：**403 Forbidden**

## ステップ5：セキュリティイベントの監視

管理UIでブロックされた攻撃を表示：

1. サイドバーの**セキュリティイベント**に移動
2. ステップ4からブロックされたリクエストが表示されるはずです
3. 各イベントには攻撃タイプ、送信元IP、一致したルール、タイムスタンプが表示されます

またはAPIでイベントを照会：

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9527/api/security-events
```

```json
{
  "events": [
    {
      "id": 1,
      "host": "example.com",
      "source_ip": "172.18.0.1",
      "attack_type": "sqli",
      "rule_id": "CRS-942100",
      "action": "block",
      "timestamp": "2026-03-21T10:05:32Z"
    }
  ]
}
```

## ステップ6：リアルタイム監視の有効化（オプション）

ライブセキュリティイベントのWebSocketエンドポイントに接続：

```bash
# Using websocat or similar WebSocket client
websocat ws://localhost:9527/ws/events
```

攻撃が検出・ブロックされるとイベントがリアルタイムでストリーミングされます。

## 現在の構成

以下のステップを完了すると、セットアップには次が含まれます：

| コンポーネント | ステータス |
|-----------|--------|
| リバースプロキシ | ポート80/443でリッスン中 |
| WAFエンジン | 16フェーズ検出パイプラインがアクティブ |
| 内蔵ルール | OWASP CRS（310以上のルール）が有効 |
| 管理UI | ポート9527で実行中 |
| PostgreSQL | 設定、ルール、イベントを保存 |
| リアルタイム監視 | WebSocketイベントストリームが利用可能 |

## 次のステップ

- [ルールエンジン](../rules/) -- YAMLルールエンジンの仕組みを理解する
- [YAML構文](../rules/yaml-syntax) -- カスタムルールのルールスキーマを学ぶ
- [リバースプロキシ](../gateway/reverse-proxy) -- 負荷分散と上流ルーティングを設定する
- [SSL/TLS](../gateway/ssl-tls) -- Let's Encryptによる自動証明書でHTTPSを有効化する
- [設定リファレンス](../configuration/reference) -- PRX-WAFのあらゆる側面を微調整する
