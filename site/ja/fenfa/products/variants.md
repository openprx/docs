---
title: プラットフォームバリアント
description: "Fenfa製品の下でiOS、Android、macOS、Windows、Linux向けにプラットフォーム固有のバリアントを設定します。"
---

# プラットフォームバリアント

バリアントは製品の下にあるプラットフォーム固有のビルドターゲットを表します。各バリアントには独自のプラットフォーム、識別子（バンドルIDまたはパッケージ名）、アーキテクチャ、インストーラータイプがあります。リリースは特定のバリアントにアップロードされます。

## サポートされるプラットフォーム

| プラットフォーム | 識別子の例 | インストーラータイプ | アーキテクチャ |
|----------|--------------------|----------------|--------------|
| `ios` | `com.example.myapp` | `ipa` | `arm64` |
| `android` | `com.example.myapp` | `apk` | `universal`、`arm64-v8a`、`armeabi-v7a` |
| `macos` | `com.example.myapp` | `dmg`、`pkg`、`zip` | `arm64`、`x86_64`、`universal` |
| `windows` | `com.example.myapp` | `exe`、`msi`、`zip` | `x64`、`arm64` |
| `linux` | `com.example.myapp` | `deb`、`rpm`、`appimage`、`tar.gz` | `x86_64`、`aarch64` |

## バリアントを作成する

### 管理パネルから

1. バリアントを追加したい製品を開きます。
2. **バリアントを追加**をクリックします。
3. フィールドを入力します：

| フィールド | 必須 | 説明 |
|-------|----------|-------------|
| プラットフォーム | はい | ターゲットプラットフォーム（`ios`、`android`、`macos`、`windows`、`linux`） |
| 表示名 | はい | 人間が読める名前（例：「iOS」、「Android ARM64」） |
| 識別子 | はい | バンドルIDまたはパッケージ名 |
| アーキテクチャ | いいえ | CPUアーキテクチャ |
| インストーラータイプ | いいえ | ファイルタイプ（`ipa`、`apk`、`dmg`など） |
| 最低OS | いいえ | 最低OSバージョン要件 |
| 表示順序 | いいえ | ダウンロードページでの表示順序（低い値が先） |

4. **保存**をクリックします。

### APIから

```bash
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ios",
    "display_name": "iOS",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "ipa",
    "min_os": "15.0"
  }'
```

レスポンス：

```json
{
  "ok": true,
  "data": {
    "id": "var_def456",
    "product_id": "prd_abc123",
    "platform": "ios",
    "display_name": "iOS",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "ipa",
    "min_os": "15.0",
    "published": true,
    "sort_order": 0
  }
}
```

## 典型的な製品セットアップ

典型的なマルチプラットフォーム製品には次のバリアントが含まれる場合があります：

```
MyApp (製品)
├── iOS (com.example.myapp, ipa, arm64)
├── Android (com.example.myapp, apk, universal)
├── macOS Apple Silicon (com.example.myapp, dmg, arm64)
├── macOS Intel (com.example.myapp, dmg, x86_64)
├── Windows (com.example.myapp, exe, x64)
└── Linux (com.example.myapp, appimage, x86_64)
```

::: tip 単一アーキテクチャと複数アーキテクチャ
ユニバーサルバイナリをサポートするプラットフォーム（AndroidやmacOSなど）では、`universal`アーキテクチャで単一のバリアントを作成できます。アーキテクチャごとに別のバイナリを提供するプラットフォームでは、アーキテクチャごとに1つのバリアントを作成します。
:::

## バリアントを更新する

```bash
curl -X PUT http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "iOS (Ad-Hoc)",
    "min_os": "16.0"
  }'
```

## バリアントを削除する

::: danger カスケード削除
バリアントを削除すると、そのすべてのリリースとアップロードされたファイルが永久に削除されます。
:::

```bash
curl -X DELETE http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## バリアント統計

特定のバリアントのダウンロード統計を取得します：

```bash
curl http://localhost:8000/admin/api/variants/var_def456/stats \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## IDフォーマット

バリアントIDはプレフィックス`var_`とランダムな文字列を使用します（例：`var_def456`）。

## 次のステップ

- [リリース管理](./releases) -- バリアントへのビルドのアップロード
- [iOS配布](../distribution/ios) -- OTAとUDIDバインディングのためのiOS固有のバリアント設定
- [デスクトップ配布](../distribution/desktop) -- macOS、Windows、Linux配布の考慮事項
