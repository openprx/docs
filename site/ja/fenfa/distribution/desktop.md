---
title: デスクトップ配布
description: "直接ダウンロードを通じてFenfaでmacOS、Windows、Linuxデスクトップアプリケーションを配布します。"
---

# デスクトップ配布

Fenfaは直接ファイルダウンロードを通じてデスクトップアプリケーション（macOS、Windows、Linux）を配布します。デスクトップユーザーは製品ページにアクセスし、ダウンロードボタンをクリックして、自分のプラットフォームのインストーラーファイルを受け取ります。

## サポートされるフォーマット

| プラットフォーム | 一般的なフォーマット | 注意事項 |
|----------|---------------|-------|
| macOS | `.dmg`、`.pkg`、`.zip` | ディスクイメージにはDMG、インストーラーにはPKG、アプリバンドルにはZIP |
| Windows | `.exe`、`.msi`、`.zip` | インストーラーにはEXE、Windows InstallerにはMSI、ポータブルにはZIP |
| Linux | `.deb`、`.rpm`、`.appimage`、`.tar.gz` | Debian/UbuntuにはDEB、Fedora/RHELにはRPM、ユニバーサルにはAppImage |

## デスクトップバリアントの設定

サポートする各プラットフォームとアーキテクチャの組み合わせのバリアントを作成します：

### macOS

```bash
# Apple Silicon
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "macos",
    "display_name": "macOS (Apple Silicon)",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "dmg",
    "min_os": "12.0"
  }'

# Intel
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "macos",
    "display_name": "macOS (Intel)",
    "identifier": "com.example.myapp",
    "arch": "x86_64",
    "installer_type": "dmg",
    "min_os": "12.0"
  }'
```

::: tip ユニバーサルバイナリ
macOSユニバーサルバイナリをビルドする場合は、arm64とx86_64の別々のバリアントではなく、`arch: "universal"`の単一バリアントを作成します。
:::

### Windows

```bash
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "windows",
    "display_name": "Windows",
    "identifier": "com.example.myapp",
    "arch": "x64",
    "installer_type": "exe",
    "min_os": "10"
  }'
```

### Linux

```bash
# Debian/Ubuntu向けDEB
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "linux",
    "display_name": "Linux (DEB)",
    "identifier": "com.example.myapp",
    "arch": "x86_64",
    "installer_type": "deb"
  }'

# AppImage（ユニバーサル）
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "linux",
    "display_name": "Linux (AppImage)",
    "identifier": "com.example.myapp",
    "arch": "x86_64",
    "installer_type": "appimage"
  }'
```

## プラットフォーム検出

FenfaのProduct PageはUser-Agentを通じて訪問者のOSを検出し、一致するダウンロードボタンをハイライトします。デスクトップユーザーにはプラットフォームのバリアントが先頭に表示され、その他のプラットフォームは下に表示されます。

## デスクトップビルドのアップロード

アップロードはモバイルプラットフォームと同様に機能します：

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_macos_arm64" \
  -F "app_file=@MyApp-arm64.dmg" \
  -F "version=2.0.0" \
  -F "build=200" \
  -F "changelog=Native Apple Silicon support"
```

::: info デスクトップは自動検出なし
iOS IPAやAndroid APKファイルとは異なり、デスクトップバイナリ（DMG、EXE、DEBなど）にはFenfaが自動抽出できる標準化されたメタデータが含まれていません。デスクトップビルドをアップロードするときは常に`version`と`build`を明示的に指定してください。
:::

## CI/CD統合例

すべてのデスクトッププラットフォームのビルドをアップロードするGitHub Actionsワークフロー：

```yaml
jobs:
  upload:
    strategy:
      matrix:
        include:
          - platform: macos
            variant_id: var_macos_arm64
            file: dist/MyApp-arm64.dmg
          - platform: windows
            variant_id: var_windows_x64
            file: dist/MyApp-Setup.exe
          - platform: linux
            variant_id: var_linux_x64
            file: dist/MyApp.AppImage
    steps:
      - name: Upload to Fenfa
        run: |
          curl -X POST ${{ secrets.FENFA_URL }}/upload \
            -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
            -F "variant_id=${{ matrix.variant_id }}" \
            -F "app_file=@${{ matrix.file }}" \
            -F "version=${{ github.ref_name }}" \
            -F "build=${{ github.run_number }}"
```

## 次のステップ

- [iOS配布](./ios) -- iOS OTAインストールとUDIDバインディング
- [Android配布](./android) -- Android APK配布
- [アップロードAPI](../api/upload) -- 完全なアップロードエンドポイントリファレンス
