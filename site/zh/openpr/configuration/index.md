---
title: 配置参考
description: OpenPR 所有环境变量和配置选项的完整参考，涵盖 API、Worker、MCP 服务器、前端和数据库。
---

# 配置参考

OpenPR 通过环境变量配置。使用 Docker Compose 时所有服务从同一个 `.env` 文件读取，直接运行时使用各自的环境变量。

## API 服务器

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `APP_NAME` | `api` | 日志中的应用标识 |
| `BIND_ADDR` | `0.0.0.0:8080` | API 监听的地址和端口 |
| `DATABASE_URL` | -- | PostgreSQL 连接字符串 |
| `JWT_SECRET` | `change-me-in-production` | JWT 令牌签名密钥 |
| `JWT_ACCESS_TTL_SECONDS` | `2592000`（30 天） | 访问令牌生命周期（秒） |
| `JWT_REFRESH_TTL_SECONDS` | `604800`（7 天） | 刷新令牌生命周期（秒） |
| `RUST_LOG` | `info` | 日志级别（trace、debug、info、warn、error） |
| `UPLOAD_DIR` | `/app/uploads` | 文件上传目录 |

::: danger 安全
在生产环境中务必将 `JWT_SECRET` 设为强随机值。至少使用 32 字符的随机数据：
```bash
openssl rand -hex 32
```
:::

## 数据库

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | -- | 完整的 PostgreSQL 连接字符串 |
| `POSTGRES_DB` | `openpr` | 数据库名 |
| `POSTGRES_USER` | `openpr` | 数据库用户 |
| `POSTGRES_PASSWORD` | `openpr` | 数据库密码 |

连接字符串格式：

```
postgres://用户:密码@主机:端口/数据库
```

::: tip Docker Compose
使用 Docker Compose 时，数据库服务名为 `postgres`，连接字符串为：
```
postgres://openpr:openpr@postgres:5432/openpr
```
:::

## Worker

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `APP_NAME` | `worker` | 应用标识 |
| `DATABASE_URL` | -- | PostgreSQL 连接字符串 |
| `JWT_SECRET` | -- | 必须与 API 服务器一致 |
| `RUST_LOG` | `info` | 日志级别 |

Worker 处理 `job_queue` 和 `scheduled_jobs` 表中的后台任务。

## MCP 服务器

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `APP_NAME` | `mcp-server` | 应用标识 |
| `OPENPR_API_URL` | -- | API 服务器 URL（含代理路径） |
| `OPENPR_BOT_TOKEN` | -- | `opr_` 前缀的 Bot Token |
| `OPENPR_WORKSPACE_ID` | -- | 默认工作区 UUID |
| `DATABASE_URL` | -- | PostgreSQL 连接字符串 |
| `JWT_SECRET` | -- | 必须与 API 服务器一致 |
| `DEFAULT_AUTHOR_ID` | -- | MCP 操作的默认作者 UUID |
| `RUST_LOG` | `info` | 日志级别 |

### MCP 传输选项

MCP 服务器二进制文件接受命令行参数：

```bash
# HTTP 模式（默认）
mcp-server --transport http --bind-addr 0.0.0.0:8090

# stdio 模式（用于 Claude Desktop、Codex）
mcp-server --transport stdio

# 子命令形式
mcp-server serve --transport http --bind-addr 0.0.0.0:8090
```

## 前端

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_API_URL` | `http://localhost:8080` | 前端连接的 API 服务器 URL |

::: tip 反向代理
使用反向代理（Caddy/Nginx）的生产环境中，`VITE_API_URL` 应指向路由到 API 服务器的代理 URL。
:::

## Docker Compose 端口

| 服务 | 内部端口 | 外部端口 | 用途 |
|------|----------|----------|------|
| PostgreSQL | 5432 | 5432 | 数据库 |
| API | 8080 | 8081 | REST API |
| Worker | -- | -- | 后台任务（无端口） |
| MCP 服务器 | 8090 | 8090 | MCP 工具 |
| 前端 | 80 | 3000 | 网页 UI |

## 示例 .env 文件

```bash
# 数据库
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT（生产环境务必修改）
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# API 服务器
APP_NAME=api
BIND_ADDR=0.0.0.0:8080
RUST_LOG=info

# 前端
VITE_API_URL=http://localhost:8080

# MCP 服务器
MCP_SERVER_PORT=8090
```

## 日志级别

OpenPR 使用 `tracing` crate 进行结构化日志。通过 `RUST_LOG` 控制详细度：

| 级别 | 说明 |
|------|------|
| `error` | 仅错误 |
| `warn` | 错误和警告 |
| `info` | 正常运行消息（默认） |
| `debug` | 详细调试信息 |
| `trace` | 非常详细，包含所有内部操作 |

支持按模块筛选：

```bash
RUST_LOG=info,api=debug,mcp_server=trace
```

## 下一步

- [Docker 部署](../deployment/docker) -- Docker Compose 配置
- [生产环境部署](../deployment/production) -- Caddy、安全和扩展
- [安装](../getting-started/installation) -- 入门指南
