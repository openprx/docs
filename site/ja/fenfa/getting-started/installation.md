---
title: インストール
description: "Docker、Docker Compose、またはGoとNode.jsでソースからビルドしてFenfaをインストールします。"
---

# インストール

Fenfaは2つのインストール方法をサポートしています：Docker（推奨）とソースからのビルド。

::: tip 推奨
**Docker**は最も早く始める方法です。ビルドツールを必要とせず、単一のコマンドで完全に動作するFenfaインスタンスを取得できます。
:::

## 前提条件

| 要件 | 最低バージョン | 注意事項 |
|-------------|---------|-------|
| Docker | 20.10+ | またはPodman 3.0+ |
| Go（ソースビルドのみ） | 1.25+ | Dockerでは不要 |
| Node.js（ソースビルドのみ） | 20+ | フロントエンドのビルドに必要 |
| ディスクスペース | 100 MB | アップロードされたビルドのストレージは別途 |

## 方法1: Docker（推奨）

公式イメージをプルして実行します：

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  fenfa/fenfa:latest
```

`http://localhost:8000/admin`にアクセスし、デフォルトトークン`dev-admin-token`でログインします。

::: warning セキュリティ
デフォルトトークンは開発用のみです。Fenfaをインターネットに公開する前に、安全なトークンを設定するために[プロダクションデプロイ](../deployment/production)を参照してください。
:::

### 永続ストレージを使用する場合

データベースとアップロードされたファイルのためにボリュームをマウントします：

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

### カスタム設定を使用する場合

すべての設定を完全に制御するために`config.json`ファイルをマウントします：

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  -v ./config.json:/app/config.json:ro \
  fenfa/fenfa:latest
```

利用可能なすべてのオプションについては[設定リファレンス](../configuration/)を参照してください。

### 環境変数

設定ファイルなしで設定値を上書きします：

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  -e FENFA_ADMIN_TOKEN=your-secret-admin-token \
  -e FENFA_UPLOAD_TOKEN=your-secret-upload-token \
  -e FENFA_PRIMARY_DOMAIN=https://dist.example.com \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

| 変数 | 説明 | デフォルト |
|----------|-------------|---------|
| `FENFA_PORT` | HTTPポート | `8000` |
| `FENFA_DATA_DIR` | データベースディレクトリ | `data` |
| `FENFA_PRIMARY_DOMAIN` | 公開ドメインURL | `http://localhost:8000` |
| `FENFA_ADMIN_TOKEN` | 管理トークン | `dev-admin-token` |
| `FENFA_UPLOAD_TOKEN` | アップロードトークン | `dev-upload-token` |

## 方法2: Docker Compose

`docker-compose.yml`を作成します：

```yaml
version: "3.8"
services:
  fenfa:
    image: fenfa/fenfa:latest
    container_name: fenfa
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      FENFA_ADMIN_TOKEN: your-secret-admin-token
      FENFA_UPLOAD_TOKEN: your-secret-upload-token
      FENFA_PRIMARY_DOMAIN: https://dist.example.com
    volumes:
      - ./data:/data
      - ./uploads:/app/uploads
```

サービスを起動します：

```bash
docker compose up -d
```

## 方法3: ソースからビルド

リポジトリをクローンします：

```bash
git clone https://github.com/openprx/fenfa.git
cd fenfa
```

### Makeを使用する場合

Makefileがフルビルドを自動化します：

```bash
make build   # フロントエンド + バックエンドをビルド
make run     # サーバーを起動
```

### 手動ビルド

最初にフロントエンドアプリケーションをビルドし、次にGoバックエンドをビルドします：

```bash
# 公開ダウンロードページをビルド
cd web/front && npm ci && npm run build && cd ../..

# 管理パネルをビルド
cd web/admin && npm ci && npm run build && cd ../..

# Goバイナリをビルド
go build -o fenfa ./cmd/server
```

フロントエンドは`internal/web/dist/`にコンパイルされ、`go:embed`でGoバイナリに組み込まれます。出来上がった`fenfa`バイナリは完全に自己完結しています。

### バイナリを実行する

```bash
./fenfa
```

Fenfaはデフォルトでポート8000で起動します。SQLiteデータベースは`data/`ディレクトリに自動的に作成されます。

## インストールの確認

ブラウザで`http://localhost:8000/admin`を開き、管理トークンでログインします。管理ダッシュボードが表示されるはずです。

ヘルスエンドポイントを確認します：

```bash
curl http://localhost:8000/healthz
```

期待されるレスポンス：

```json
{"ok": true}
```

## 次のステップ

- [クイックスタート](./quickstart) -- 5分で最初のビルドをアップロード
- [設定リファレンス](../configuration/) -- すべての設定オプション
- [Dockerデプロイ](../deployment/docker) -- Docker Composeとマルチアーキテクチャビルド
