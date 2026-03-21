---
title: 平台变体
description: 在 Fenfa 产品下配置 iOS、Android、macOS、Windows 和 Linux 的平台变体。
---

# 平台变体

变体代表产品下的平台构建目标。每个变体有自己的平台、标识符（Bundle ID 或包名）、架构和安装包类型。发布版本上传到特定的变体。

## 支持的平台

| 平台 | 标识符示例 | 安装包类型 | 架构 |
|------|-----------|-----------|------|
| `ios` | `com.example.myapp` | `ipa` | `arm64` |
| `android` | `com.example.myapp` | `apk` | `universal`、`arm64-v8a`、`armeabi-v7a` |
| `macos` | `com.example.myapp` | `dmg`、`pkg`、`zip` | `arm64`、`x86_64`、`universal` |
| `windows` | `com.example.myapp` | `exe`、`msi`、`zip` | `x64`、`arm64` |
| `linux` | `com.example.myapp` | `deb`、`rpm`、`appimage`、`tar.gz` | `x86_64`、`aarch64` |

## 创建变体

### 通过管理后台

1. 打开要添加变体的产品。
2. 点击 **添加变体**。
3. 填写字段：

| 字段 | 必填 | 说明 |
|------|------|------|
| 平台 | 是 | 目标平台（`ios`、`android`、`macos`、`windows`、`linux`） |
| 显示名称 | 是 | 易读名称（如 "iOS"、"Android ARM64"） |
| 标识符 | 是 | Bundle ID 或包名 |
| 架构 | 否 | CPU 架构 |
| 安装包类型 | 否 | 文件类型（`ipa`、`apk`、`dmg` 等） |
| 最低系统版本 | 否 | 最低操作系统版本要求 |
| 排序 | 否 | 下载页面上的显示顺序（数值越小越靠前） |

4. 点击 **保存**。

### 通过 API

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

返回：

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

## 典型产品配置

一个典型的多平台产品可能包含以下变体：

```
MyApp（产品）
├── iOS (com.example.myapp, ipa, arm64)
├── Android (com.example.myapp, apk, universal)
├── macOS Apple Silicon (com.example.myapp, dmg, arm64)
├── macOS Intel (com.example.myapp, dmg, x86_64)
├── Windows (com.example.myapp, exe, x64)
└── Linux (com.example.myapp, appimage, x86_64)
```

::: tip 单架构 vs 多架构
对于支持通用二进制的平台（如 Android 或 macOS），可以创建一个 `universal` 架构的变体。对于需要分别发布不同架构包的平台，每个架构创建一个变体。
:::

## 更新变体

```bash
curl -X PUT http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "iOS (Ad-Hoc)",
    "min_os": "16.0"
  }'
```

## 删除变体

::: danger 级联删除
删除变体会永久移除其所有发布版本和上传的文件。
:::

```bash
curl -X DELETE http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## 变体统计

获取特定变体的下载统计：

```bash
curl http://localhost:8000/admin/api/variants/var_def456/stats \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## ID 格式

变体 ID 使用 `var_` 前缀加随机字符串（如 `var_def456`）。

## 下一步

- [发布管理](./releases) -- 向变体上传构建
- [iOS 分发](../distribution/ios) -- iOS 变体的 OTA 和 UDID 绑定配置
- [桌面端分发](../distribution/desktop) -- macOS、Windows 和 Linux 分发注意事项
