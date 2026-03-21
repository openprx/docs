---
title: 上传 API
description: 通过 REST API 向 Fenfa 上传应用构建。标准上传和自动元数据提取的智能上传。
---

# 上传 API

Fenfa 提供两个上传端点：显式指定元数据的标准上传，以及自动从上传包中检测元数据的智能上传。

## 标准上传

```
POST /upload
Content-Type: multipart/form-data
X-Auth-Token: <upload_token 或 admin_token>
```

### 请求字段

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `variant_id` | 是 | string | 目标变体 ID（如 `var_def456`） |
| `app_file` | 是 | file | 二进制文件（IPA、APK、DMG、EXE 等） |
| `version` | 否 | string | 版本字符串（如 "1.2.0"） |
| `build` | 否 | integer | 构建号（如 120） |
| `channel` | 否 | string | 分发渠道（如 "internal"、"beta"） |
| `min_os` | 否 | string | 最低系统版本（如 "15.0"） |
| `changelog` | 否 | string | 发布说明 |

### 示例

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0" \
  -F "build=120" \
  -F "channel=beta" \
  -F "min_os=15.0" \
  -F "changelog=修复 bug 并提升性能"
```

### 响应（201 Created）

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

`urls` 对象提供可直接使用的链接：
- `page` -- 产品下载页面 URL
- `download` -- 直接二进制下载 URL
- `ios_manifest` -- iOS manifest plist URL（仅 iOS 变体）
- `ios_install` -- 完整 `itms-services://` 安装 URL（仅 iOS 变体）

## 智能上传

```
POST /admin/api/smart-upload
Content-Type: multipart/form-data
X-Auth-Token: <admin_token>
```

智能上传接受与标准上传相同的字段，但会自动从上传包中检测元数据。

::: tip 自动检测内容
**IPA 文件**：Bundle ID、版本号（CFBundleShortVersionString）、构建号（CFBundleVersion）、应用图标、最低 iOS 版本。

**APK 文件**：包名、版本名称、版本代码、应用图标、最低 SDK 版本。

桌面端格式（DMG、EXE、DEB 等）不支持自动检测。请显式提供版本号和构建号。
:::

### 示例

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

显式提供的字段会覆盖自动检测的值：

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0-rc1" \
  -F "changelog=候选版本 1"
```

## 错误响应

### 缺少 Variant ID（400）

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### Token 无效（401）

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "invalid or missing auth token"
  }
}
```

### 变体未找到（404）

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "variant not found"
  }
}
```

## CI/CD 示例

### GitHub Actions

```yaml
- name: 上传 iOS 构建到 Fenfa
  run: |
    RESPONSE=$(curl -s -X POST ${{ secrets.FENFA_URL }}/upload \
      -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
      -F "variant_id=${{ secrets.FENFA_IOS_VARIANT }}" \
      -F "app_file=@build/MyApp.ipa" \
      -F "version=${{ github.ref_name }}" \
      -F "build=${{ github.run_number }}" \
      -F "changelog=${{ github.event.head_commit.message }}")
    echo "上传响应: $RESPONSE"
    echo "下载 URL: $(echo $RESPONSE | jq -r '.data.urls.page')"
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

### Shell 脚本

```bash
#!/bin/bash
# upload.sh - 上传构建到 Fenfa
FENFA_URL="https://dist.example.com"
TOKEN="your-upload-token"
VARIANT="var_def456"
FILE="$1"
VERSION="$2"

if [ -z "$FILE" ] || [ -z "$VERSION" ]; then
  echo "用法: ./upload.sh <文件> <版本>"
  exit 1
fi

curl -X POST "${FENFA_URL}/upload" \
  -H "X-Auth-Token: ${TOKEN}" \
  -F "variant_id=${VARIANT}" \
  -F "app_file=@${FILE}" \
  -F "version=${VERSION}" \
  -F "build=$(date +%s)"
```

## 下一步

- [管理 API](./admin) -- 完整管理端点参考
- [发布管理](../products/releases) -- 管理已上传的发布
- [分发概述](../distribution/) -- 上传的构建如何到达终端用户
