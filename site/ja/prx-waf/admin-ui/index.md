---
title: 管理UI
description: "PRX-WAF Vue 3管理ダッシュボード。JWT + TOTP認証、ホスト管理、ルール管理、セキュリティイベント監視、リアルタイムWebSocketダッシュボード、通知設定。"
---

# 管理UI

PRX-WAFにはバイナリに埋め込まれたVue 3 + Tailwind CSS管理ダッシュボードが含まれています。ホスト、ルール、証明書、セキュリティイベント、クラスターステータスを管理するためのグラフィカルインターフェースを提供します。

## 管理UIへのアクセス

管理UIはAPIサーバーの設定されたアドレスで提供されます：

```
http://localhost:9527
```

デフォルト認証情報：`admin` / `admin`

::: warning
初回ログイン後すぐにデフォルトパスワードを変更してください。本番環境ではTOTP二要素認証を有効化してください。
:::

## 認証

管理UIは2つの認証メカニズムをサポートします：

| メソッド | 説明 |
|--------|-------------|
| JWTトークン | `/api/auth/login`経由で取得、ブラウザのlocalStorageに保存 |
| TOTP（オプション） | 二要素認証のための時間ベースのワンタイムパスワード |

### ログインAPI

```bash
curl -X POST http://localhost:9527/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

レスポンス：

```json
{
  "token": "eyJ...",
  "refresh_token": "..."
}
```

TOTPが有効なアカウントには`totp_code`フィールドを含めます：

```json
{"username": "admin", "password": "admin", "totp_code": "123456"}
```

## ダッシュボードセクション

### ホスト

保護されたドメインと上流バックエンドを管理：
- ホストの追加、編集、削除
- ホストごとにWAF保護を切り替え
- ホストごとのトラフィック統計を表示

### ルール

すべてのソースにわたる検出ルールを管理：
- OWASP CRS、ModSecurity、CVE、カスタムルールを表示
- 個別ルールを有効/無効化
- カテゴリ、重大度、ソースで検索・フィルタリング
- ルールのインポートとエクスポート

### IPルール

IPベースのアローおよびブロックリストを管理：
- IPアドレスまたはCIDR範囲を追加
- アロー/ブロックアクションを設定
- アクティブIPルールを表示

### URLルール

URLベースの検出ルールを管理：
- regexサポートでURLパターンを追加
- ブロック/ログ/アローアクションを設定

### セキュリティイベント

検出された攻撃を表示・分析：
- リアルタイムイベントフィード
- ホスト、攻撃タイプ、送信元IP、時間範囲でフィルタリング
- JSONまたはCSVでイベントをエクスポート

### 統計

トラフィックとセキュリティメトリクスを表示：
- リクエスト毎秒
- タイプ別攻撃分布
- 最も攻撃されているホスト
- 上位送信元IP
- レスポンスコード分布

### SSL証明書

TLS証明書を管理：
- アクティブな証明書と有効期限を表示
- 手動証明書をアップロード
- Let's Encrypt自動更新ステータスを監視

### WASMプラグイン

WebAssemblyプラグインを管理：
- 新しいプラグインをアップロード
- ロードされたプラグインとそのステータスを表示
- プラグインを有効/無効化

### トンネル

リバーストンネルを管理：
- WebSocketベースのトンネルを作成・削除
- トンネルのステータスとトラフィックを監視

### CrowdSec

CrowdSec統合ステータスを表示：
- LAPIからのアクティブな決定
- AppSec検査結果
- 接続ステータス

### 通知

アラートチャンネルを設定：
- メール（SMTP）
- Webhook
- Telegram

## リアルタイム監視

管理UIはライブセキュリティイベントストリーミングのためにWebSocketエンドポイント（`/ws/events`）に接続します。攻撃が検出・ブロックされるとイベントがリアルタイムで表示されます。

WebSocketにプログラムで接続することもできます：

```javascript
const ws = new WebSocket("ws://localhost:9527/ws/events");
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Security event:", data);
};
```

## セキュリティ強化

### IPで管理アクセスを制限

管理UIとAPIアクセスを信頼されたネットワークに制限：

```toml
[security]
admin_ip_allowlist = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
```

### レート制限を有効化

ブルートフォース攻撃から管理APIを保護：

```toml
[security]
api_rate_limit_rps = 100
```

### CORSを設定

管理APIにアクセスできるオリジンを制限：

```toml
[security]
cors_origins = ["https://admin.example.com"]
```

## テックスタック

| コンポーネント | テクノロジー |
|-----------|-----------|
| フロントエンド | Vue 3 + Tailwind CSS |
| ビルド | Vite |
| 状態管理 | Pinia |
| HTTPクライアント | Axios |
| チャート | Chart.js |
| 埋め込み | Axumが提供する静的ファイル |

管理UIのソースコードはリポジトリの`web/admin-ui/`にあります。

## 次のステップ

- [クイックスタート](../getting-started/quickstart) -- 最初の保護済みホストをセットアップする
- [設定リファレンス](../configuration/reference) -- 管理セキュリティ設定
- [CLIリファレンス](../cli/) -- 代替のコマンドライン管理
