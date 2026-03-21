---
title: 管理 API
description: Fenfa 完整管理 API 参考，涵盖产品、变体、发布、设备、设置和导出管理。
---

# 管理 API

所有管理端点需要 `X-Auth-Token` 请求头携带管理权限的 Token。管理 Token 拥有所有 API 操作的完全访问权限，包括上传。

## 产品

### 列出产品

```
GET /admin/api/products
```

返回所有产品的基本信息。

```bash
curl http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

### 创建产品

```
POST /admin/api/products
Content-Type: application/json
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | 产品显示名称 |
| `slug` | 是 | URL 标识符（唯一） |
| `description` | 否 | 产品描述 |

```bash
curl -X POST http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "MyApp", "slug": "myapp", "description": "跨平台应用"}'
```

### 获取产品

```
GET /admin/api/products/:productID
```

返回产品及其所有变体。

### 更新产品

```
PUT /admin/api/products/:productID
Content-Type: application/json
```

### 删除产品

```
DELETE /admin/api/products/:productID
```

::: danger 级联删除
删除产品会永久移除其所有变体、发布和上传的文件。
:::

## 变体

### 创建变体

```
POST /admin/api/products/:productID/variants
Content-Type: application/json
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `platform` | 是 | `ios`、`android`、`macos`、`windows`、`linux` |
| `display_name` | 是 | 易读名称 |
| `identifier` | 是 | Bundle ID 或包名 |
| `arch` | 否 | CPU 架构 |
| `installer_type` | 否 | 文件类型（`ipa`、`apk`、`dmg` 等） |
| `min_os` | 否 | 最低系统版本 |
| `sort_order` | 否 | 显示顺序（数值越小越靠前） |

### 更新变体

```
PUT /admin/api/variants/:variantID
Content-Type: application/json
```

### 删除变体

```
DELETE /admin/api/variants/:variantID
```

::: danger 级联删除
删除变体会永久移除其所有发布和上传的文件。
:::

### 变体统计

```
GET /admin/api/variants/:variantID/stats
```

返回变体的下载统计和其他数据。

## 发布

### 删除发布

```
DELETE /admin/api/releases/:releaseID
```

移除发布及其上传的二进制文件。

## 发布控制

控制产品/应用在公开下载页面的可见性。

### 发布

```
PUT /admin/api/apps/:appID/publish
```

### 取消发布

```
PUT /admin/api/apps/:appID/unpublish
```

## 事件

### 查询事件

```
GET /admin/api/events
```

返回访问、点击和下载事件。支持查询参数过滤。

| 参数 | 说明 |
|------|------|
| `type` | 事件类型（`visit`、`click`、`download`） |
| `variant_id` | 按变体过滤 |
| `release_id` | 按发布过滤 |

## iOS 设备

### 列出设备

```
GET /admin/api/ios_devices
```

返回所有已完成 UDID 绑定的 iOS 设备。

### 向 Apple 注册设备

```
POST /admin/api/devices/:deviceID/register-apple
```

将单个设备注册到你的 Apple Developer 账号。

### 批量注册设备

```
POST /admin/api/devices/register-apple
```

将所有未注册的设备批量注册到 Apple。

## Apple Developer API

### 检查状态

```
GET /admin/api/apple/status
```

返回 Apple Developer API 凭据是否已配置且有效。

### 列出 Apple 设备

```
GET /admin/api/apple/devices
```

返回在你的 Apple Developer 账号中注册的设备。

## 设置

### 获取设置

```
GET /admin/api/settings
```

返回当前系统设置（域名、组织、存储类型）。

### 更新设置

```
PUT /admin/api/settings
Content-Type: application/json
```

可更新的字段包括：
- `primary_domain` -- 用于 manifest 和回调的公开 URL
- `secondary_domains` -- CDN 或备用域名
- `organization` -- iOS 描述文件中的组织名称
- `storage_type` -- `local` 或 `s3`
- S3 配置（端点、存储桶、密钥、公开 URL）
- Apple Developer API 凭据

### 获取上传配置

```
GET /admin/api/upload-config
```

返回当前上传配置，包括存储类型和限制。

## 导出

导出数据为 CSV 文件用于外部分析：

| 端点 | 数据 |
|------|------|
| `GET /admin/exports/releases.csv` | 所有发布及元数据 |
| `GET /admin/exports/events.csv` | 所有事件 |
| `GET /admin/exports/ios_devices.csv` | 所有 iOS 设备 |

```bash
# 示例：导出所有发布
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## 下一步

- [上传 API](./upload) -- 上传端点参考
- [配置参考](../configuration/) -- 服务器配置选项
- [生产环境部署](../deployment/production) -- 保护管理 API
