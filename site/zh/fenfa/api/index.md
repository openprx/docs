---
title: API 概述
description: Fenfa REST API 参考。基于 Token 的认证、JSON 响应格式，以及上传构建、管理产品和查询分析的端点。
---

# API 概述

Fenfa 提供 REST API 用于上传构建、管理产品和查询分析数据。所有程序化交互 -- 从 CI/CD 上传到管理后台操作 -- 都通过此 API 进行。

## 基础 URL

所有 API 端点相对于 Fenfa 服务器 URL：

```
https://your-domain.com
```

## 认证

受保护的端点需要 `X-Auth-Token` 请求头。Fenfa 使用两种 Token 权限范围：

| 范围 | 可执行操作 | 请求头 |
|------|-----------|--------|
| `upload` | 上传构建 | `X-Auth-Token: YOUR_UPLOAD_TOKEN` |
| `admin` | 完全管理权限（包含上传） | `X-Auth-Token: YOUR_ADMIN_TOKEN` |

Token 在 `config.json` 或环境变量中配置。详见 [配置参考](../configuration/)。

::: warning
未携带有效 Token 访问受保护端点将收到 `401 Unauthorized` 响应。
:::

## 响应格式

所有 JSON 响应遵循统一结构：

**成功：**

```json
{
  "ok": true,
  "data": { ... }
}
```

**错误：**

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| `BAD_REQUEST` | 400 | 请求参数无效 |
| `UNAUTHORIZED` | 401 | 缺少或无效的认证 Token |
| `FORBIDDEN` | 403 | Token 缺少所需权限 |
| `NOT_FOUND` | 404 | 资源未找到 |
| `INTERNAL_ERROR` | 500 | 服务器错误 |

## 端点总览

### 公开端点（无需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/products/:slug` | 产品下载页面（HTML） |
| GET | `/d/:releaseID` | 直接文件下载 |
| GET | `/ios/:releaseID/manifest.plist` | iOS OTA manifest |
| GET | `/udid/profile.mobileconfig?variant=:id` | UDID 绑定描述文件 |
| POST | `/udid/callback` | UDID 回调（来自 iOS） |
| GET | `/udid/status?variant=:id` | UDID 绑定状态 |
| GET | `/healthz` | 健康检查 |

### 上传端点（Upload Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/upload` | 上传构建文件 |

### 管理端点（Admin Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/admin/api/smart-upload` | 智能上传（自动检测） |
| GET | `/admin/api/products` | 列出产品 |
| POST | `/admin/api/products` | 创建产品 |
| GET | `/admin/api/products/:id` | 获取产品及变体 |
| PUT | `/admin/api/products/:id` | 更新产品 |
| DELETE | `/admin/api/products/:id` | 删除产品 |
| POST | `/admin/api/products/:id/variants` | 创建变体 |
| PUT | `/admin/api/variants/:id` | 更新变体 |
| DELETE | `/admin/api/variants/:id` | 删除变体 |
| GET | `/admin/api/variants/:id/stats` | 变体统计 |
| DELETE | `/admin/api/releases/:id` | 删除发布 |
| PUT | `/admin/api/apps/:id/publish` | 发布应用 |
| PUT | `/admin/api/apps/:id/unpublish` | 取消发布 |
| GET | `/admin/api/events` | 查询事件 |
| GET | `/admin/api/ios_devices` | 列出 iOS 设备 |
| POST | `/admin/api/devices/:id/register-apple` | 向 Apple 注册设备 |
| POST | `/admin/api/devices/register-apple` | 批量注册设备 |
| GET | `/admin/api/settings` | 获取设置 |
| PUT | `/admin/api/settings` | 更新设置 |
| GET | `/admin/api/upload-config` | 获取上传配置 |
| GET | `/admin/api/apple/status` | Apple API 状态 |
| GET | `/admin/api/apple/devices` | Apple 已注册设备 |

### 导出端点（Admin Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/exports/releases.csv` | 导出发布 |
| GET | `/admin/exports/events.csv` | 导出事件 |
| GET | `/admin/exports/ios_devices.csv` | 导出 iOS 设备 |

## ID 格式

所有资源 ID 使用前缀 + 随机字符串格式：

| 前缀 | 资源 |
|------|------|
| `prd_` | 产品 |
| `var_` | 变体 |
| `rel_` | 发布 |
| `app_` | 应用（旧版） |

## 详细参考

- [上传 API](./upload) -- 上传端点字段参考和示例
- [管理 API](./admin) -- 完整管理端点文档
