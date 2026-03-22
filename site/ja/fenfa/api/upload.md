---
title: アップロードAPI
description: "REST APIを通じてFenfaにアプリビルドをアップロードします。標準アップロードと自動メタデータ抽出付きスマートアップロード。"
---

# アップロードAPI

Fenfaは2つのアップロードエンドポイントを提供します：明示的なメタデータのための標準アップロードと、アップロードされたパッケージからメタデータを自動検出するスマートアップロードです。

## 標準アップロード

```
POST /upload
Content-Type: multipart/form-data
X-Auth-Token: <upload_token or admin_token>
```

### リクエストフィールド

| フィールド | 必須 | タイプ | 説明 |
|-------|----------|------|-------------|
| `variant_id` | はい | string | ターゲットバリアントID（例：`var_def456`） |
| `app_file` | はい | file | バイナリファイル（IPA、APK、DMGなど） |
| `version` | いいえ | string | バージョン文字列（例：「1.2.0」） |
| `build` | いいえ | integer | ビルド番号（例：120） |
| `channel` | いいえ | string | 配布チャンネル（例：「internal」、「beta」） |
| `min_os` | いいえ | string | 最低OSバージョン（例：「15.0」） |
| `changelog` | いいえ | string | リリースノートテキスト |

### 例

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0" \
  -F "build=120" \
  -F "channel=beta" \
  -F "min_os=15.0" \
  -F "changelog=Bug fixes and performance improvements"
```

### レスポンス（201 Created）

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
      "ios_install": "itms-services://?action=download-manifest&url=https://dist.example.com/ios/rel_b1cqa/manifest.plist"
    }
  }
}
```

`urls`オブジェクトには使用準備ができたリンクが含まれます：
- `page` -- 製品ダウンロードページURL
- `download` -- 直接バイナリダウンロードURL
- `ios_manifest` -- iOS マニフェストplist URL（iOSバリアントのみ）
- `ios_install` -- 完全な`itms-services://`インストールURL（iOSバリアントのみ）

## スマートアップロード

```
POST /admin/api/smart-upload
Content-Type: multipart/form-data
X-Auth-Token: <admin_token>
```

スマートアップロードは標準アップロードと同じフィールドを受け入れますが、アップロードされたパッケージからメタデータを自動検出します。

::: tip 自動検出される内容
**IPAファイル**: バンドルID、バージョン（CFBundleShortVersionString）、ビルド番号（CFBundleVersion）、アプリアイコン、最低iOSバージョン。

**APKファイル**: パッケージ名、バージョン名、バージョンコード、アプリアイコン、最低SDKバージョン。

デスクトップフォーマット（DMG、EXE、DEBなど）は自動検出をサポートしていません。バージョンとビルドを明示的に指定してください。
:::

### 例

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

明示的に指定されたフィールドは自動検出された値を上書きします：

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0-rc1" \
  -F "changelog=Release candidate 1"
```

## エラーレスポンス

### バリアントIDが不足（400）

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### 無効なトークン（401）

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "invalid or missing auth token"
  }
}
```

### バリアントが見つからない（404）

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "variant not found"
  }
}
```

## CI/CD例

### GitHub Actions

```yaml
- name: Upload iOS build to Fenfa
  run: |
    RESPONSE=$(curl -s -X POST ${{ secrets.FENFA_URL }}/upload \
      -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
      -F "variant_id=${{ secrets.FENFA_IOS_VARIANT }}" \
      -F "app_file=@build/MyApp.ipa" \
      -F "version=${{ github.ref_name }}" \
      -F "build=${{ github.run_number }}" \
      -F "changelog=${{ github.event.head_commit.message }}")
    echo "Upload response: $RESPONSE"
    echo "Download URL: $(echo $RESPONSE | jq -r '.data.urls.page')"
```

### GitLab CI

```yaml
upload:
  stage: deploy
  script:
    - |
      curl -X POST ${FENFA_URL}/upload \
        -H "X-Auth-Token: ${FENFA_UPLOAD_TOKEN}" \
        -F "variant_id=${FENFA_VARIANT_ID}" \
        -F "app_file=@build/output/app-release.apk" \
        -F "version=${CI_COMMIT_TAG}" \
        -F "build=${CI_PIPELINE_IID}" \
        -F "channel=beta"
  only:
    - tags
```

### シェルスクリプト

```bash
#!/bin/bash
# upload.sh - Fenfaにビルドをアップロード
FENFA_URL="https://dist.example.com"
TOKEN="your-upload-token"
VARIANT="var_def456"
FILE="$1"
VERSION="$2"

if [ -z "$FILE" ] || [ -z "$VERSION" ]; then
  echo "Usage: ./upload.sh <file> <version>"
  exit 1
fi

curl -X POST "${FENFA_URL}/upload" \
  -H "X-Auth-Token: ${TOKEN}" \
  -F "variant_id=${VARIANT}" \
  -F "app_file=@${FILE}" \
  -F "version=${VERSION}" \
  -F "build=$(date +%s)"
```

## 次のステップ

- [管理API](./admin) -- 完全な管理エンドポイントリファレンス
- [リリース管理](../products/releases) -- アップロードされたリリースを管理
- [配布概要](../distribution/) -- アップロードがエンドユーザーに届く方法
