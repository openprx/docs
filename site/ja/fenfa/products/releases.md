---
title: リリース管理
description: "Fenfaでアプリのリリースをアップロード、バージョン管理、管理します。各リリースはプラットフォームバリアントにアップロードされた特定のビルドです。"
---

# リリース管理

リリースはバリアントの下にある特定のアップロードされたビルドを表します。各リリースにはバージョン文字列、ビルド番号、チェンジログ、バイナリファイル自体があります。リリースは製品ダウンロードページで逆の時系列順に表示されます。

## リリースフィールド

| フィールド | タイプ | 説明 |
|-------|------|-------------|
| `id` | string | 自動生成ID（例：`rel_b1cqa`） |
| `variant_id` | string | 親バリアントID |
| `version` | string | バージョン文字列（例：「1.2.0」） |
| `build` | integer | ビルド番号（例：120） |
| `changelog` | text | リリースノート（ダウンロードページに表示） |
| `min_os` | string | 最低OSバージョン |
| `channel` | string | 配布チャンネル（例：「internal」、「beta」、「production」） |
| `size_bytes` | integer | ファイルサイズ（バイト） |
| `sha256` | string | アップロードされたファイルのSHA-256ハッシュ |
| `download_count` | integer | このリリースがダウンロードされた回数 |
| `file_name` | string | 元のファイル名 |
| `file_ext` | string | ファイル拡張子（例：「ipa」、「apk」） |
| `created_at` | datetime | アップロードタイムスタンプ |

## リリースをアップロードする

### 標準アップロード

特定のバリアントにビルドファイルをアップロードします：

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0" \
  -F "build=120" \
  -F "channel=beta" \
  -F "changelog=Bug fixes and performance improvements"
```

レスポンス：

```json
{
  "ok": true,
  "data": {
    "app": {
      "id": "app_xxx",
      "name": "MyApp",
      "platform": "ios",
      "bundle_id": "com.example.myapp"
    },
    "release": {
      "id": "rel_b1cqa",
      "version": "1.2.0",
      "build": 120
    },
    "urls": {
      "page": "https://dist.example.com/products/myapp",
      "download": "https://dist.example.com/d/rel_b1cqa",
      "ios_manifest": "https://dist.example.com/ios/rel_b1cqa/manifest.plist",
      "ios_install": "itms-services://..."
    }
  }
}
```

### スマートアップロード

スマートアップロードエンドポイントはアップロードされたパッケージからメタデータを自動検出します：

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

::: tip 自動検出
スマートアップロードはIPAおよびAPKファイルから以下を抽出します：
- **バンドルID / パッケージ名**
- **バージョン文字列**（CFBundleShortVersionString / versionName）
- **ビルド番号**（CFBundleVersion / versionCode）
- **アプリアイコン**（抽出されて製品アイコンとして保存）
- **最低OSバージョン**

アップロードリクエストで明示的に指定することで、自動検出されたフィールドを上書きできます。
:::

### アップロードフィールド

| フィールド | 必須 | 説明 |
|-------|----------|-------------|
| `variant_id` | はい | ターゲットバリアントID |
| `app_file` | はい | バイナリファイル（IPA、APK、DMGなど） |
| `version` | いいえ | バージョン文字列（IPA/APKでは自動検出） |
| `build` | いいえ | ビルド番号（IPA/APKでは自動検出） |
| `channel` | いいえ | 配布チャンネル |
| `min_os` | いいえ | 最低OSバージョン |
| `changelog` | いいえ | リリースノート |

## ファイルストレージ

アップロードされたファイルは以下に保存されます：

```
uploads/{product_id}/{variant_id}/{release_id}/filename.ext
```

各リリースには回復目的のための`meta.json`スナップショット（ローカルストレージのみ）もあります。

::: info S3ストレージ
S3互換ストレージが設定されている場合、ファイルは設定されたバケットにアップロードされます。ストレージパス構造は同じままです。S3セットアップについては[設定](../configuration/)を参照してください。
:::

## ダウンロードURL

各リリースにはいくつかのURLがあります：

| URL | 説明 |
|-----|-------------|
| `/d/:releaseID` | 直接バイナリダウンロード（HTTP Rangeリクエストをサポート） |
| `/ios/:releaseID/manifest.plist` | iOS OTAマニフェスト（`itms-services://`リンク用） |
| `/products/:slug` | 製品ダウンロードページ |
| `/products/:slug?r=:releaseID` | 特定のリリースがハイライトされた製品ページ |

## リリースを削除する

```bash
curl -X DELETE http://localhost:8000/admin/api/releases/rel_b1cqa \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

::: warning
リリースを削除すると、アップロードされたバイナリファイルとすべての関連メタデータが永久に削除されます。
:::

## リリースデータのエクスポート

レポート用にすべてのリリースをCSVとしてエクスポートします：

```bash
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## CI/CD統合

FenfaはCI/CDパイプラインから呼び出されるように設計されています。典型的なGitHub Actionsステップ：

```yaml
- name: Upload to Fenfa
  run: |
    curl -X POST ${{ secrets.FENFA_URL }}/upload \
      -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
      -F "variant_id=${{ secrets.FENFA_VARIANT_ID }}" \
      -F "app_file=@build/output/MyApp.ipa" \
      -F "version=${{ github.ref_name }}" \
      -F "build=${{ github.run_number }}" \
      -F "changelog=${{ github.event.head_commit.message }}"
```

## 次のステップ

- [アップロードAPIリファレンス](../api/upload) -- 完全なアップロードエンドポイントドキュメント
- [iOS配布](../distribution/ios) -- iOS OTAマニフェストとインストール
- [配布概要](../distribution/) -- リリースがエンドユーザーに届く方法
