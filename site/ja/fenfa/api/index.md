---
title: API概要
description: "Fenfa REST APIリファレンス。トークンベースの認証、JSONレスポンス、ビルドのアップロード、製品の管理、分析のクエリのためのエンドポイント。"
---

# API概要

Fenfaはビルドのアップロード、製品の管理、分析のクエリのためのREST APIを公開しています。CI/CDアップロードから管理パネル操作まで、すべてのプログラム的なやり取りはこのAPIを通じて行われます。

## ベースURL

すべてのAPIエンドポイントはFenfaサーバーURLに対する相対パスです：

```
https://your-domain.com
```

## 認証

保護されたエンドポイントには`X-Auth-Token`ヘッダーが必要です。Fenfaは2つのトークンスコープを使用します：

| スコープ | 可能な操作 | ヘッダー |
|-------|--------|--------|
| `upload` | ビルドのアップロード | `X-Auth-Token: YOUR_UPLOAD_TOKEN` |
| `admin` | 完全な管理アクセス（アップロードを含む） | `X-Auth-Token: YOUR_ADMIN_TOKEN` |

トークンは`config.json`または環境変数で設定します。[設定](../configuration/)を参照してください。

::: warning
有効なトークンなしに保護されたエンドポイントへのリクエストは`401 Unauthorized`レスポンスを受け取ります。
:::

## レスポンス形式

すべてのJSONレスポンスは統一された構造に従います：

**成功：**

```json
{
  "ok": true,
  "data": { ... }
}
```

**エラー：**

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### エラーコード

| コード | HTTPステータス | 説明 |
|------|-------------|-------------|
| `BAD_REQUEST` | 400 | 無効なリクエストパラメータ |
| `UNAUTHORIZED` | 401 | 認証トークンが不足または無効 |
| `FORBIDDEN` | 403 | トークンに必要なスコープがない |
| `NOT_FOUND` | 404 | リソースが見つからない |
| `INTERNAL_ERROR` | 500 | サーバーエラー |

## エンドポイントサマリー

### 公開エンドポイント（認証不要）

| メソッド | パス | 説明 |
|--------|------|-------------|
| GET | `/products/:slug` | 製品ダウンロードページ（HTML） |
| GET | `/d/:releaseID` | 直接ファイルダウンロード |
| GET | `/ios/:releaseID/manifest.plist` | iOS OTAマニフェスト |
| GET | `/udid/profile.mobileconfig?variant=:id` | UDIDバインディングプロファイル |
| POST | `/udid/callback` | UDIDコールバック（iOSから） |
| GET | `/udid/status?variant=:id` | UDIDバインディングステータス |
| GET | `/healthz` | ヘルスチェック |

### アップロードエンドポイント（アップロードトークン）

| メソッド | パス | 説明 |
|--------|------|-------------|
| POST | `/upload` | ビルドファイルをアップロード |

### 管理エンドポイント（管理トークン）

| メソッド | パス | 説明 |
|--------|------|-------------|
| POST | `/admin/api/smart-upload` | 自動検出付きスマートアップロード |
| GET | `/admin/api/products` | 製品一覧 |
| POST | `/admin/api/products` | 製品を作成 |
| GET | `/admin/api/products/:id` | バリアント付きの製品を取得 |
| PUT | `/admin/api/products/:id` | 製品を更新 |
| DELETE | `/admin/api/products/:id` | 製品を削除 |
| POST | `/admin/api/products/:id/variants` | バリアントを作成 |
| PUT | `/admin/api/variants/:id` | バリアントを更新 |
| DELETE | `/admin/api/variants/:id` | バリアントを削除 |
| GET | `/admin/api/variants/:id/stats` | バリアント統計 |
| DELETE | `/admin/api/releases/:id` | リリースを削除 |
| PUT | `/admin/api/apps/:id/publish` | アプリを公開 |
| PUT | `/admin/api/apps/:id/unpublish` | アプリを非公開 |
| GET | `/admin/api/events` | イベントをクエリ |
| GET | `/admin/api/ios_devices` | iOSデバイス一覧 |
| POST | `/admin/api/devices/:id/register-apple` | Appleにデバイスを登録 |
| POST | `/admin/api/devices/register-apple` | デバイスをバッチ登録 |
| GET | `/admin/api/settings` | 設定を取得 |
| PUT | `/admin/api/settings` | 設定を更新 |
| GET | `/admin/api/upload-config` | アップロード設定を取得 |
| GET | `/admin/api/apple/status` | Apple APIステータス |
| GET | `/admin/api/apple/devices` | Apple登録デバイス |

### エクスポートエンドポイント（管理トークン）

| メソッド | パス | 説明 |
|--------|------|-------------|
| GET | `/admin/exports/releases.csv` | リリースをエクスポート |
| GET | `/admin/exports/events.csv` | イベントをエクスポート |
| GET | `/admin/exports/ios_devices.csv` | iOSデバイスをエクスポート |

## IDフォーマット

すべてのリソースIDはプレフィックス + ランダム文字列形式を使用します：

| プレフィックス | リソース |
|--------|----------|
| `prd_` | 製品 |
| `var_` | バリアント |
| `rel_` | リリース |
| `app_` | アプリ（レガシー） |

## 詳細リファレンス

- [アップロードAPI](./upload) -- フィールドリファレンスと例を含むアップロードエンドポイント
- [管理API](./admin) -- 完全な管理エンドポイントドキュメント
