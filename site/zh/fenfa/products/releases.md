---
title: 发布管理
description: 在 Fenfa 中上传、版本控制和管理应用发布。每个发布是上传到平台变体的特定构建。
---

# 发布管理

发布代表变体下的特定上传构建。每个发布包含版本字符串、构建号、更新日志和二进制文件。发布在产品下载页面上按时间倒序显示。

## 发布字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 自动生成的 ID（如 `rel_b1cqa`） |
| `variant_id` | string | 父变体 ID |
| `version` | string | 版本字符串（如 "1.2.0"） |
| `build` | integer | 构建号（如 120） |
| `changelog` | text | 发布说明（显示在下载页面） |
| `min_os` | string | 最低操作系统版本 |
| `channel` | string | 分发渠道（如 "internal"、"beta"、"production"） |
| `size_bytes` | integer | 文件大小（字节） |
| `sha256` | string | 上传文件的 SHA-256 哈希 |
| `download_count` | integer | 下载次数 |
| `file_name` | string | 原始文件名 |
| `file_ext` | string | 文件扩展名（如 "ipa"、"apk"） |
| `created_at` | datetime | 上传时间 |

## 上传发布

### 标准上传

上传构建文件到特定变体：

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0" \
  -F "build=120" \
  -F "channel=beta" \
  -F "changelog=修复 bug 并提升性能"
```

返回：

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

### 智能上传

智能上传端点自动从上传包中检测元数据：

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

::: tip 自动检测
智能上传从 IPA 和 APK 文件中提取以下信息：
- **Bundle ID / 包名**
- **版本字符串**（CFBundleShortVersionString / versionName）
- **构建号**（CFBundleVersion / versionCode）
- **应用图标**（提取并存储为产品图标）
- **最低系统版本**

你仍然可以通过在上传请求中显式提供来覆盖自动检测的值。
:::

### 上传字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `variant_id` | 是 | 目标变体 ID |
| `app_file` | 是 | 二进制文件（IPA、APK、DMG 等） |
| `version` | 否 | 版本字符串（IPA/APK 可自动检测） |
| `build` | 否 | 构建号（IPA/APK 可自动检测） |
| `channel` | 否 | 分发渠道 |
| `min_os` | 否 | 最低系统版本 |
| `changelog` | 否 | 发布说明 |

## 文件存储

上传文件存储在：

```
uploads/{product_id}/{variant_id}/{release_id}/filename.ext
```

每个发布还有一个 `meta.json` 快照（仅本地存储），用于恢复。

::: info S3 存储
配置 S3 兼容存储后，文件上传到配置的存储桶。存储路径结构保持不变。详见 [配置参考](../configuration/) 了解 S3 设置。
:::

## 下载 URL

每个发布提供多个 URL：

| URL | 说明 |
|-----|------|
| `/d/:releaseID` | 直接二进制下载（支持 HTTP Range 请求） |
| `/ios/:releaseID/manifest.plist` | iOS OTA manifest（用于 `itms-services://` 链接） |
| `/products/:slug` | 产品下载页面 |
| `/products/:slug?r=:releaseID` | 产品页面高亮特定发布 |

## 删除发布

```bash
curl -X DELETE http://localhost:8000/admin/api/releases/rel_b1cqa \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

::: warning
删除发布会永久移除上传的二进制文件和所有关联元数据。
:::

## 导出发布数据

导出所有发布为 CSV 用于报告：

```bash
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## CI/CD 集成

Fenfa 设计为可从 CI/CD 流水线调用。典型的 GitHub Actions 步骤：

```yaml
- name: 上传到 Fenfa
  run: |
    curl -X POST ${{ secrets.FENFA_URL }}/upload \
      -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
      -F "variant_id=${{ secrets.FENFA_VARIANT_ID }}" \
      -F "app_file=@build/output/MyApp.ipa" \
      -F "version=${{ github.ref_name }}" \
      -F "build=${{ github.run_number }}" \
      -F "changelog=${{ github.event.head_commit.message }}"
```

## 下一步

- [上传 API 参考](../api/upload) -- 完整上传端点文档
- [iOS 分发](../distribution/ios) -- iOS OTA manifest 和安装
- [分发概述](../distribution/) -- 发布如何到达终端用户
