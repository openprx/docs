---
title: 桌面端分发
description: 通过 Fenfa 分发 macOS、Windows 和 Linux 桌面应用，支持直接下载。
---

# 桌面端分发

Fenfa 通过直接文件下载分发桌面应用（macOS、Windows、Linux）。桌面用户访问产品页面，点击下载按钮，即可获得对应平台的安装文件。

## 支持的格式

| 平台 | 常用格式 | 说明 |
|------|----------|------|
| macOS | `.dmg`、`.pkg`、`.zip` | DMG 磁盘镜像、PKG 安装器、ZIP 应用包 |
| Windows | `.exe`、`.msi`、`.zip` | EXE 安装器、MSI Windows Installer、ZIP 便携版 |
| Linux | `.deb`、`.rpm`、`.appimage`、`.tar.gz` | DEB 适用 Debian/Ubuntu、RPM 适用 Fedora/RHEL、AppImage 通用格式 |

## 设置桌面端变体

为每个支持的平台和架构组合创建变体：

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

::: tip 通用二进制
如果你构建的是 macOS 通用二进制，创建一个 `arch: "universal"` 的变体即可，无需分别创建 arm64 和 x86_64 变体。
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
# DEB 适用 Debian/Ubuntu
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

# AppImage（通用）
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

## 平台检测

Fenfa 的产品页面通过 User-Agent 检测访问者的操作系统，并高亮匹配的下载按钮。桌面用户会看到自己平台的变体在最上方，其他平台在下方可选。

## 上传桌面端构建

上传方式与移动平台相同：

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_macos_arm64" \
  -F "app_file=@MyApp-arm64.dmg" \
  -F "version=2.0.0" \
  -F "build=200" \
  -F "changelog=原生 Apple Silicon 支持"
```

::: info 桌面端无自动检测
与 iOS IPA 和 Android APK 文件不同，桌面端二进制文件（DMG、EXE、DEB 等）不包含 Fenfa 可自动提取的标准化元数据。上传桌面端构建时请始终显式提供 `version` 和 `build`。
:::

## CI/CD 集成示例

一个上传所有桌面平台构建的 GitHub Actions 工作流：

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
      - name: 上传到 Fenfa
        run: |
          curl -X POST ${{ secrets.FENFA_URL }}/upload \
            -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
            -F "variant_id=${{ matrix.variant_id }}" \
            -F "app_file=@${{ matrix.file }}" \
            -F "version=${{ github.ref_name }}" \
            -F "build=${{ github.run_number }}"
```

## 下一步

- [iOS 分发](./ios) -- iOS OTA 安装和 UDID 绑定
- [Android 分发](./android) -- Android APK 分发
- [上传 API](../api/upload) -- 完整上传端点参考
