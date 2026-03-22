---
title: 管理API
description: "製品、バリアント、リリース、デバイス、設定、エクスポートを管理するための完全なFenfa管理APIリファレンス。"
---

# 管理API

すべての管理エンドポイントには管理スコープのトークンを持つ`X-Auth-Token`ヘッダーが必要です。管理トークンはアップロードを含むすべてのAPI操作への完全なアクセスを持ちます。

## 製品

### 製品一覧

```
GET /admin/api/products
```

基本情報を含むすべての製品を返します。

```bash
curl http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

### 製品を作成

```
POST /admin/api/products
Content-Type: application/json
```

| フィールド | 必須 | 説明 |
|-------|----------|-------------|
| `name` | はい | 製品の表示名 |
| `slug` | はい | URL識別子（ユニーク） |
| `description` | いいえ | 製品説明 |

```bash
curl -X POST http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "MyApp", "slug": "myapp", "description": "Cross-platform app"}'
```

### 製品を取得

```
GET /admin/api/products/:productID
```

すべてのバリアントを含む製品を返します。

### 製品を更新

```
PUT /admin/api/products/:productID
Content-Type: application/json
```

### 製品を削除

```
DELETE /admin/api/products/:productID
```

::: danger カスケード削除
製品を削除すると、そのすべてのバリアント、リリース、アップロードされたファイルが永久に削除されます。
:::

## バリアント

### バリアントを作成

```
POST /admin/api/products/:productID/variants
Content-Type: application/json
```

| フィールド | 必須 | 説明 |
|-------|----------|-------------|
| `platform` | はい | `ios`、`android`、`macos`、`windows`、`linux` |
| `display_name` | はい | 人間が読める名前 |
| `identifier` | はい | バンドルIDまたはパッケージ名 |
| `arch` | いいえ | CPUアーキテクチャ |
| `installer_type` | いいえ | ファイルタイプ（`ipa`、`apk`、`dmg`など） |
| `min_os` | いいえ | 最低OSバージョン |
| `sort_order` | いいえ | 表示順序（低い値が先） |

### バリアントを更新

```
PUT /admin/api/variants/:variantID
Content-Type: application/json
```

### バリアントを削除

```
DELETE /admin/api/variants/:variantID
```

::: danger カスケード削除
バリアントを削除すると、そのすべてのリリースとアップロードされたファイルが永久に削除されます。
:::

### バリアント統計

```
GET /admin/api/variants/:variantID/stats
```

バリアントのダウンロード数とその他の統計を返します。

## リリース

### リリースを削除

```
DELETE /admin/api/releases/:releaseID
```

リリースとそのアップロードされたバイナリファイルを削除します。

## 公開

公開ダウンロードページで製品/アプリが表示されるかどうかを制御します。

### 公開する

```
PUT /admin/api/apps/:appID/publish
```

### 非公開にする

```
PUT /admin/api/apps/:appID/unpublish
```

## イベント

### イベントをクエリ

```
GET /admin/api/events
```

訪問、クリック、ダウンロードイベントを返します。フィルタリングのためのクエリパラメータをサポートします。

| パラメータ | 説明 |
|-----------|-------------|
| `type` | イベントタイプ（`visit`、`click`、`download`） |
| `variant_id` | バリアントでフィルタ |
| `release_id` | リリースでフィルタ |

## iOSデバイス

### デバイス一覧

```
GET /admin/api/ios_devices
```

UDIDバインディングを完了したすべてのiOSデバイスを返します。

### Appleにデバイスを登録

```
POST /admin/api/devices/:deviceID/register-apple
```

Apple Developerアカウントに単一のデバイスを登録します。

### デバイスをバッチ登録

```
POST /admin/api/devices/register-apple
```

単一のバッチ操作で未登録のすべてのデバイスをAppleに登録します。

## Apple Developer API

### ステータスを確認

```
GET /admin/api/apple/status
```

Apple Developer APIの認証情報が設定されて有効かどうかを返します。

### Appleデバイスを一覧表示

```
GET /admin/api/apple/devices
```

Apple Developerアカウントに登録されたデバイスを返します。

## 設定

### 設定を取得

```
GET /admin/api/settings
```

現在のシステム設定（ドメイン、組織、ストレージタイプ）を返します。

### 設定を更新

```
PUT /admin/api/settings
Content-Type: application/json
```

更新可能なフィールドには以下が含まれます：
- `primary_domain` -- マニフェストとコールバックの公開URL
- `secondary_domains` -- CDNまたは代替ドメイン
- `organization` -- iOSプロファイルの組織名
- `storage_type` -- `local`または`s3`
- S3設定（エンドポイント、バケット、キー、公開URL）
- Apple Developer APIの認証情報

### アップロード設定を取得

```
GET /admin/api/upload-config
```

ストレージタイプと制限を含む現在のアップロード設定を返します。

## エクスポート

外部分析のためにデータをCSVファイルとしてエクスポートします：

| エンドポイント | データ |
|----------|------|
| `GET /admin/exports/releases.csv` | メタデータを含むすべてのリリース |
| `GET /admin/exports/events.csv` | すべてのイベント |
| `GET /admin/exports/ios_devices.csv` | すべてのiOSデバイス |

```bash
# 例：すべてのリリースをエクスポート
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## 次のステップ

- [アップロードAPI](./upload) -- アップロードエンドポイントリファレンス
- [設定](../configuration/) -- サーバー設定オプション
- [プロダクションデプロイ](../deployment/production) -- 管理APIを保護する
