---
title: 設定リファレンス
description: "Fenfaの完全な設定リファレンス。設定ファイルオプション、環境変数、ストレージ設定、Apple Developer APIの認証情報。"
---

# 設定リファレンス

Fenfaは`config.json`ファイル、環境変数、または管理パネル（ストレージやApple APIなどのランタイム設定）を通じて設定できます。

## 設定の優先順位

1. **環境変数** -- 最高優先度、すべてを上書き
2. **config.jsonファイル** -- 起動時に読み込まれる
3. **デフォルト値** -- 何も指定されていない場合に使用

## 設定ファイル

作業ディレクトリに`config.json`を作成します（またはDockerでマウント）：

```json
{
  "server": {
    "port": "8000",
    "primary_domain": "https://dist.example.com",
    "secondary_domains": [
      "https://cdn1.example.com",
      "https://cdn2.example.com"
    ],
    "organization": "Your Company Name",
    "bundle_id_prefix": "com.yourcompany.fenfa",
    "data_dir": "data",
    "db_path": "data/fenfa.db",
    "dev_proxy_front": "",
    "dev_proxy_admin": ""
  },
  "auth": {
    "upload_tokens": ["your-upload-token"],
    "admin_tokens": ["your-admin-token"]
  }
}
```

## サーバー設定

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `server.port` | string | `"8000"` | HTTPリッスンポート |
| `server.primary_domain` | string | `"http://localhost:8000"` | マニフェスト、コールバック、ダウンロードリンクで使用される公開URL |
| `server.secondary_domains` | string[] | `[]` | 追加ドメイン（CDN、代替アクセス） |
| `server.organization` | string | `"Fenfa Distribution"` | iOSモバイル設定プロファイルに表示される組織名 |
| `server.bundle_id_prefix` | string | `""` | 生成されたプロファイルのバンドルIDプレフィックス |
| `server.data_dir` | string | `"data"` | SQLiteデータベース用ディレクトリ |
| `server.db_path` | string | `"data/fenfa.db"` | 明示的なデータベースファイルパス |
| `server.dev_proxy_front` | string | `""` | 公開ページ用Vite開発サーバーURL（開発時のみ） |
| `server.dev_proxy_admin` | string | `""` | 管理パネル用Vite開発サーバーURL（開発時のみ） |

::: warning プライマリドメイン
`primary_domain`設定はiOS OTA配布にとって重要です。エンドユーザーがアクセスするHTTPS URLでなければなりません。iOSマニフェストファイルはダウンロードリンクにこのURLを使用し、UDIDコールバックはこのドメインにリダイレクトします。
:::

## 認証

| キー | タイプ | デフォルト | 説明 |
|-----|------|---------|-------------|
| `auth.upload_tokens` | string[] | `["dev-upload-token"]` | アップロードAPIのトークン |
| `auth.admin_tokens` | string[] | `["dev-admin-token"]` | 管理APIのトークン（アップロード権限を含む） |

::: danger デフォルトトークンを変更する
デフォルトトークン（`dev-upload-token`と`dev-admin-token`）は開発用のみです。プロダクションにデプロイする前に必ず変更してください。
:::

各スコープで複数のトークンがサポートされており、異なるCI/CDパイプラインやチームメンバーに異なるトークンを発行し、個別に取り消せます。

## 環境変数

環境変数で任意の設定値を上書きします：

| 変数 | 設定の同等物 | 説明 |
|----------|-------------------|-------------|
| `FENFA_PORT` | `server.port` | HTTPリッスンポート |
| `FENFA_DATA_DIR` | `server.data_dir` | データベースディレクトリ |
| `FENFA_PRIMARY_DOMAIN` | `server.primary_domain` | 公開ドメインURL |
| `FENFA_ADMIN_TOKEN` | `auth.admin_tokens[0]` | 管理トークン（最初のトークンを置き換え） |
| `FENFA_UPLOAD_TOKEN` | `auth.upload_tokens[0]` | アップロードトークン（最初のトークンを置き換え） |

例：

```bash
FENFA_PORT=9000 \
FENFA_PRIMARY_DOMAIN=https://dist.example.com \
FENFA_ADMIN_TOKEN=secure-random-token \
./fenfa
```

## ストレージ設定

### ローカルストレージ（デフォルト）

ファイルは作業ディレクトリに対する相対パス`uploads/{product_id}/{variant_id}/{release_id}/filename.ext`に保存されます。追加設定は不要です。

### S3互換ストレージ

管理パネルの**設定 > ストレージ**でS3ストレージを設定するか、APIを通じて設定します：

```bash
curl -X PUT http://localhost:8000/admin/api/settings \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storage_type": "s3",
    "s3_endpoint": "https://account-id.r2.cloudflarestorage.com",
    "s3_bucket": "fenfa-uploads",
    "s3_access_key": "your-access-key",
    "s3_secret_key": "your-secret-key",
    "s3_public_url": "https://cdn.example.com"
  }'
```

サポートされるプロバイダー：
- **Cloudflare R2** -- 外部転送料金なし、S3互換
- **AWS S3** -- 標準S3
- **MinIO** -- セルフホスト型S3互換ストレージ
- その他のS3互換プロバイダー

::: tip アップロードドメイン
プライマリドメインにファイルサイズのCDN制限がある場合は、大容量ファイルのアップロード時にCDN制限をバイパスする別ドメインとして`upload_domain`を設定します。
:::

## Apple Developer API

デバイスの自動登録のためにApple Developer APIの認証情報を設定します。管理パネルの**設定 > Apple Developer API**または管理APIを通じて設定します：

| フィールド | 説明 |
|-------|-------------|
| `apple_key_id` | App Store ConnectのAPIキーID |
| `apple_issuer_id` | 発行者ID（UUID形式） |
| `apple_private_key` | PEM形式の秘密鍵コンテンツ |
| `apple_team_id` | Apple DeveloperチームID |

セットアップ手順については[iOS配布](../distribution/ios)を参照してください。

## データベース

FenfaはGORMを通じてSQLiteを使用します。データベースファイルは設定された`db_path`に自動的に作成されます。マイグレーションは起動時に自動的に実行されます。

::: info バックアップ
Fenfaをバックアップするには、SQLiteデータベースファイルと`uploads/`ディレクトリをコピーします。S3ストレージの場合、ローカルバックアップが必要なのはデータベースファイルのみです。
:::

## 開発設定

ホットリロードを使用したローカル開発の場合：

```json
{
  "server": {
    "dev_proxy_front": "http://localhost:5173",
    "dev_proxy_admin": "http://localhost:5174"
  }
}
```

`dev_proxy_front`または`dev_proxy_admin`が設定されている場合、FenfaはVite開発サーバーへのリクエストをプロキシし、組み込みフロントエンドを提供する代わりにホットモジュール置換を使用します。

## 次のステップ

- [Dockerデプロイ](../deployment/docker) -- Docker設定とボリューム
- [プロダクションデプロイ](../deployment/production) -- リバースプロキシとセキュリティ強化
- [API概要](../api/) -- API認証の詳細
