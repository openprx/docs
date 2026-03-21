---
title: 认证
description: OpenPR 使用 JWT 令牌进行用户认证，使用 Bot Token 进行 AI/MCP 访问。了解注册、登录、令牌刷新和 Bot Token。
---

# 认证

OpenPR 使用 **JWT (JSON Web Token)** 进行用户认证，使用 **Bot Token** 进行 AI 助手和 MCP 服务器访问。

## 用户认证（JWT）

### 注册

创建新账号：

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "张三",
    "password": "SecurePassword123"
  }'
```

响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "张三",
      "role": "user"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

::: tip 首个用户
第一个注册的用户自动获得 `admin` 角色。之后的用户默认为 `user`。
:::

### 登录

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

响应包含 `access_token`、`refresh_token` 和带 `role` 的用户信息。

### 使用访问令牌

在所有需要认证的请求中，通过 `Authorization` 头部携带访问令牌：

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/workspaces
```

### 令牌刷新

当访问令牌过期时，使用刷新令牌获取新的令牌对：

```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJ..."}'
```

### 获取当前用户

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/auth/me
```

返回当前用户的资料，包含 `role`（admin/user）。

## 令牌配置

JWT 令牌生命周期通过环境变量配置：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `JWT_SECRET` | `change-me-in-production` | 签名令牌的密钥 |
| `JWT_ACCESS_TTL_SECONDS` | `2592000`（30 天） | 访问令牌生命周期 |
| `JWT_REFRESH_TTL_SECONDS` | `604800`（7 天） | 刷新令牌生命周期 |

::: danger 生产安全
在生产环境中务必将 `JWT_SECRET` 设为强随机值。默认值是不安全的。
:::

## Bot Token 认证

Bot Token 为 AI 助手和自动化工具提供认证。它们以工作区为范围，使用 `opr_` 前缀。

### 创建 Bot Token

Bot Token 通过工作区设置 UI 或 API 管理：

```bash
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/bots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"name": "Claude 助手"}'
```

### 使用 Bot Token

Bot Token 的使用方式与 JWT 令牌相同：

```bash
curl -H "Authorization: Bearer opr_abc123..." \
  http://localhost:8080/api/workspaces/<workspace_id>/projects
```

### Bot Token 属性

| 属性 | 说明 |
|------|------|
| 前缀 | `opr_` |
| 范围 | 单个工作区 |
| 实体类型 | 创建 `bot_mcp` 用户实体 |
| 权限 | 与工作区成员相同 |
| 审计追踪 | 所有操作记录在 Bot 用户下 |

## 认证端点汇总

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 创建账号 |
| `/api/auth/login` | POST | 登录获取令牌 |
| `/api/auth/refresh` | POST | 刷新令牌对 |
| `/api/auth/me` | GET | 获取当前用户信息 |

## 下一步

- [端点参考](./endpoints) -- 完整 API 文档
- [MCP 服务器](../mcp-server/) -- Bot Token 在 MCP 中的使用
- [成员与权限](../workspace/members) -- 基于角色的访问控制
