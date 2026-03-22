---
title: Dockerデプロイ
description: "DockerとDocker ComposeでFenfaをデプロイします。コンテナ設定、ボリューム、マルチアーキテクチャビルド、ヘルスチェック。"
---

# Dockerデプロイ

Fenfaは組み込みフロントエンドを持つGoバイナリを含む単一のDockerイメージとして提供されます。追加のコンテナは不要です -- 永続データのためにボリュームをマウントするだけです。

## クイックスタート

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

## Docker Compose

`docker-compose.yml`を作成します：

```yaml
version: "3.8"

services:
  fenfa:
    image: fenfa/fenfa:latest
    container_name: fenfa
    restart: unless-stopped
    ports:
      - "127.0.0.1:8000:8000"
    environment:
      FENFA_ADMIN_TOKEN: ${FENFA_ADMIN_TOKEN}
      FENFA_UPLOAD_TOKEN: ${FENFA_UPLOAD_TOKEN}
      FENFA_PRIMARY_DOMAIN: ${FENFA_PRIMARY_DOMAIN:-http://localhost:8000}
    volumes:
      - fenfa-data:/data
      - fenfa-uploads:/app/uploads
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8000/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

volumes:
  fenfa-data:
  fenfa-uploads:
```

composeファイルと並んで`.env`ファイルを作成します：

```bash
FENFA_ADMIN_TOKEN=your-secure-admin-token
FENFA_UPLOAD_TOKEN=your-secure-upload-token
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

サービスを起動します：

```bash
docker compose up -d
```

## ボリューム

| マウントポイント | 目的 | バックアップ必須 |
|-------------|---------|-----------------|
| `/data` | SQLiteデータベース | はい |
| `/app/uploads` | アップロードされたバイナリファイル | はい（S3使用時を除く） |
| `/app/config.json` | 設定ファイル（オプション） | はい |

::: warning データの永続性
ボリュームマウントなしでは、コンテナが再作成されるとすべてのデータが失われます。プロダクション使用では常に`/data`と`/app/uploads`をマウントしてください。
:::

## 設定ファイルを使用する

完全な制御のために設定ファイルをマウントします：

```yaml
services:
  fenfa:
    image: fenfa/fenfa:latest
    volumes:
      - fenfa-data:/data
      - fenfa-uploads:/app/uploads
      - ./config.json:/app/config.json:ro
```

## ヘルスチェック

Fenfaは`/healthz`でヘルスエンドポイントを公開しています：

```bash
curl http://localhost:8000/healthz
# {"ok": true}
```

上記のDocker Composeの例にはヘルスチェック設定が含まれています。KubernetesやNomadなどのオーケストレーターでは、このエンドポイントをライブネスとレディネスプローブに使用します。

## マルチアーキテクチャ

FenfaのDockerイメージは`linux/amd64`と`linux/arm64`の両方をサポートしています。Dockerはホストに適したアーキテクチャを自動的にプルします。

マルチアーキテクチャイメージを自分でビルドするには：

```bash
./scripts/docker-build.sh
```

これはDocker Buildxを使用して両方のアーキテクチャのイメージを作成します。

## リソース要件

Fenfaは軽量です：

| リソース | 最低 | 推奨 |
|----------|---------|-------------|
| CPU | 1コア | 2コア |
| RAM | 64 MB | 256 MB |
| ディスク | 100 MB（アプリ） | アップロードファイルに依存 |

SQLiteデータベースとGoバイナリのオーバーヘッドは最小限です。リソース使用量は主にアップロードストレージと同時接続数によってスケールします。

## ログ

コンテナログを表示します：

```bash
docker logs -f fenfa
```

Fenfaはログ集約ツールに対応した構造化フォーマットでstdoutにログを出力します。

## アップデート

```bash
docker compose pull
docker compose up -d
```

::: tip ゼロダウンタイムアップデート
Fenfaは素早く起動します（1秒未満）。ほぼゼロのダウンタイムアップデートのために、ヘルスチェックを通過した新しいコンテナに自動的にトラフィックをルーティングするリバースプロキシヘルスチェックを使用します。
:::

## 次のステップ

- [プロダクションデプロイ](./production) -- リバースプロキシ、TLS、セキュリティ
- [設定リファレンス](../configuration/) -- すべての設定オプション
- [トラブルシューティング](../troubleshooting/) -- よくあるDockerの問題
