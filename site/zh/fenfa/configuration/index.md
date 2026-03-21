---
title: 配置参考
description: Fenfa 完整配置参考。配置文件选项、环境变量、存储设置和 Apple Developer API 凭据。
---

# 配置参考

Fenfa 可通过 `config.json` 文件、环境变量或管理后台（用于存储和 Apple API 等运行时设置）进行配置。

## 配置优先级

1. **环境变量** -- 最高优先级，覆盖一切
2. **config.json 文件** -- 启动时加载
3. **默认值** -- 未指定时使用

## 配置文件

在工作目录创建 `config.json`（或在 Docker 中挂载）：

```json
{
  "server": {
    "port": "8000",
    "primary_domain": "https://dist.example.com",
    "secondary_domains": [
      "https://cdn1.example.com",
      "https://cdn2.example.com"
    ],
    "organization": "你的公司名称",
    "bundle_id_prefix": "com.yourcompany.fenfa",
    "data_dir": "data",
    "db_path": "data/fenfa.db",
    "dev_proxy_front": "",
    "dev_proxy_admin": ""
  },
  "auth": {
    "upload_tokens": ["your-upload-token"],
    "admin_tokens": ["your-admin-token"]
  }
}
```

## 服务器设置

| 键 | 类型 | 默认值 | 说明 |
|----|------|--------|------|
| `server.port` | string | `"8000"` | HTTP 监听端口 |
| `server.primary_domain` | string | `"http://localhost:8000"` | 用于 manifest、回调和下载链接的公开 URL |
| `server.secondary_domains` | string[] | `[]` | 附加域名（CDN、备用访问） |
| `server.organization` | string | `"Fenfa Distribution"` | iOS 移动配置描述文件中显示的组织名称 |
| `server.bundle_id_prefix` | string | `""` | 生成描述文件的 Bundle ID 前缀 |
| `server.data_dir` | string | `"data"` | SQLite 数据库目录 |
| `server.db_path` | string | `"data/fenfa.db"` | 数据库文件的明确路径 |
| `server.dev_proxy_front` | string | `""` | 公开页面的 Vite 开发服务器 URL（仅开发环境） |
| `server.dev_proxy_admin` | string | `""` | 管理后台的 Vite 开发服务器 URL（仅开发环境） |

::: warning 主域名
`primary_domain` 设置对 iOS OTA 分发至关重要。它必须是终端用户访问的 HTTPS URL。iOS manifest 文件使用此 URL 生成下载链接，UDID 回调也重定向到此域名。
:::

## 认证

| 键 | 类型 | 默认值 | 说明 |
|----|------|--------|------|
| `auth.upload_tokens` | string[] | `["dev-upload-token"]` | 上传 API 的 Token |
| `auth.admin_tokens` | string[] | `["dev-admin-token"]` | 管理 API 的 Token（包含上传权限） |

::: danger 更改默认 Token
默认 Token（`dev-upload-token` 和 `dev-admin-token`）仅用于开发环境。部署到生产环境前务必更改。
:::

每个权限范围支持多个 Token，允许为不同的 CI/CD 流水线或团队成员颁发不同的 Token，并可单独撤销。

## 环境变量

使用环境变量覆盖任何配置值：

| 变量 | 对应配置 | 说明 |
|------|----------|------|
| `FENFA_PORT` | `server.port` | HTTP 监听端口 |
| `FENFA_DATA_DIR` | `server.data_dir` | 数据库目录 |
| `FENFA_PRIMARY_DOMAIN` | `server.primary_domain` | 公开域名 URL |
| `FENFA_ADMIN_TOKEN` | `auth.admin_tokens[0]` | 管理 Token（替换第一个 Token） |
| `FENFA_UPLOAD_TOKEN` | `auth.upload_tokens[0]` | 上传 Token（替换第一个 Token） |

示例：

```bash
FENFA_PORT=9000 \
FENFA_PRIMARY_DOMAIN=https://dist.example.com \
FENFA_ADMIN_TOKEN=secure-random-token \
./fenfa
```

## 存储配置

### 本地存储（默认）

文件存储在工作目录下的 `uploads/{product_id}/{variant_id}/{release_id}/filename.ext`。无需额外配置。

### S3 兼容存储

在管理后台 **设置 > 存储** 中配置 S3 存储，或通过 API：

```bash
curl -X PUT http://localhost:8000/admin/api/settings \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storage_type": "s3",
    "s3_endpoint": "https://account-id.r2.cloudflarestorage.com",
    "s3_bucket": "fenfa-uploads",
    "s3_access_key": "your-access-key",
    "s3_secret_key": "your-secret-key",
    "s3_public_url": "https://cdn.example.com"
  }'
```

支持的提供商：
- **Cloudflare R2** -- 无出口流量费用，S3 兼容
- **AWS S3** -- 标准 S3
- **MinIO** -- 自托管 S3 兼容存储
- 任何 S3 兼容提供商

::: tip 上传域名
如果主域名有 CDN 文件大小限制，可配置 `upload_domain` 作为独立域名，绕过 CDN 限制进行大文件上传。
:::

## Apple Developer API

配置 Apple Developer API 凭据以实现自动设备注册。在管理后台 **设置 > Apple Developer API** 中设置，或通过 API：

| 字段 | 说明 |
|------|------|
| `apple_key_id` | App Store Connect 的 API 密钥 ID |
| `apple_issuer_id` | 发行者 ID（UUID 格式） |
| `apple_private_key` | PEM 格式的私钥内容 |
| `apple_team_id` | Apple Developer Team ID |

详见 [iOS 分发](../distribution/ios) 了解设置说明。

## 数据库

Fenfa 通过 GORM 使用 SQLite。数据库文件在配置的 `db_path` 路径自动创建。迁移在启动时自动执行。

::: info 备份
备份 Fenfa 只需复制 SQLite 数据库文件和 `uploads/` 目录。使用 S3 存储时，只需本地备份数据库文件。
:::

## 开发设置

本地开发热重载配置：

```json
{
  "server": {
    "dev_proxy_front": "http://localhost:5173",
    "dev_proxy_admin": "http://localhost:5174"
  }
}
```

设置 `dev_proxy_front` 或 `dev_proxy_admin` 后，Fenfa 将请求代理到 Vite 开发服务器，而不是提供内嵌的前端。这样在开发时可以使用热模块替换。

## 下一步

- [Docker 部署](../deployment/docker) -- Docker 配置和卷
- [生产环境部署](../deployment/production) -- 反向代理和安全加固
- [API 概述](../api/) -- API 认证详情
