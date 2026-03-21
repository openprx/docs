---
title: 安装
description: 使用 Docker Compose、Podman 或从源码编译安装 OpenPR。
---

# 安装

OpenPR 支持三种安装方式。Docker Compose 是获取完整运行实例的最快方式。

::: tip 推荐
**Docker Compose** 使用一条命令即可启动所有服务（API、前端、Worker、MCP 服务器、PostgreSQL），无需 Rust 工具链或 Node.js。
:::

## 前置要求

| 要求 | 最低版本 | 说明 |
|------|----------|------|
| Docker | 20.10+ | 或 Podman 3.0+ 配合 podman-compose |
| Docker Compose | 2.0+ | Docker Desktop 已包含 |
| Rust（源码编译） | 1.75.0 | Docker 安装不需要 |
| Node.js（源码编译） | 20+ | 用于编译 SvelteKit 前端 |
| PostgreSQL（源码编译） | 15+ | Docker 方式已包含 PostgreSQL |
| 磁盘空间 | 500 MB | 镜像 + 数据库 |
| 内存 | 1 GB | 生产环境建议 2 GB+ |

## 方式一：Docker Compose（推荐）

克隆仓库并启动所有服务：

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
docker-compose up -d
```

将启动五个服务：

| 服务 | 容器名 | 端口 | 说明 |
|------|--------|------|------|
| PostgreSQL | `openpr-postgres` | 5432 | 数据库（自动迁移） |
| API | `openpr-api` | 8081 (映射 8080) | REST API 服务器 |
| Worker | `openpr-worker` | -- | 后台任务处理器 |
| MCP 服务器 | `openpr-mcp-server` | 8090 | MCP 工具服务器 |
| 前端 | `openpr-frontend` | 3000 | SvelteKit 网页 UI |

验证所有服务正在运行：

```bash
docker-compose ps
```

::: warning 首个用户
第一个注册的用户自动成为 **管理员**。请在向他人分享 URL 之前先注册管理员账号。
:::

### 环境变量

编辑 `.env` 自定义部署：

```bash
# 数据库
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT（生产环境务必修改！）
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# 前端
VITE_API_URL=http://localhost:8080

# MCP 服务器
MCP_SERVER_PORT=8090
```

::: danger 安全
部署到生产环境前，务必修改 `JWT_SECRET` 和数据库密码。使用强随机值。
:::

## 方式二：Podman

OpenPR 支持使用 Podman 作为 Docker 替代方案。关键区别在于 Podman 构建时需要 `--network=host` 以解决 DNS 问题：

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env

# 使用网络访问构建镜像
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
sudo podman build --network=host --build-arg APP_BIN=worker -f Dockerfile.prebuilt -t openpr_worker .
sudo podman build --network=host --build-arg APP_BIN=mcp-server -f Dockerfile.prebuilt -t openpr_mcp-server .
sudo podman build --network=host -f frontend/Dockerfile -t openpr_frontend frontend/

# 启动服务
sudo podman-compose up -d
```

::: tip Podman DNS
前端 Nginx 容器使用 `10.89.0.1` 作为 DNS 解析器（Podman 默认网络 DNS），而非 `127.0.0.11`（Docker 默认）。这在 Nginx 配置中已经设置好。
:::

## 方式三：源码编译

### 后端

```bash
# 前置要求：Rust 1.75+、PostgreSQL 15+
git clone https://github.com/openprx/openpr.git
cd openpr

# 配置
cp .env.example .env
# 编辑 .env 设置 PostgreSQL 连接字符串

# 编译所有二进制文件
cargo build --release -p api -p worker -p mcp-server
```

二进制文件位于：
- `target/release/api` -- REST API 服务器
- `target/release/worker` -- 后台 Worker
- `target/release/mcp-server` -- MCP 工具服务器

### 前端

```bash
cd frontend
npm install    # 或：bun install
npm run build  # 或：bun run build
```

编译输出在 `frontend/build/`。使用 Nginx 或其他静态文件服务器提供服务。

### 数据库设置

创建数据库并运行迁移：

```bash
# 创建数据库
createdb -U postgres openpr

# 迁移在 API 服务器首次启动时自动执行
# 或手动执行：
psql -U openpr -d openpr -f migrations/0001_initial.sql
# ... 按顺序执行剩余迁移
```

### 启动服务

```bash
# 终端 1：API 服务器
./target/release/api

# 终端 2：Worker
./target/release/worker

# 终端 3：MCP 服务器
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090
```

## 验证安装

所有服务启动后，验证各端点：

```bash
# API 健康检查
curl http://localhost:8080/health

# MCP 服务器健康检查
curl http://localhost:8090/health

# 前端
curl -s http://localhost:3000 | head -5
```

打开浏览器访问 http://localhost:3000 进入网页 UI。

## 卸载

### Docker Compose

```bash
cd openpr
docker-compose down -v  # -v 删除卷（数据库数据）
docker rmi $(docker images 'openpr*' -q)
```

### 源码编译

```bash
# 停止运行中的服务（在每个终端 Ctrl+C）
# 删除二进制文件
rm -f target/release/api target/release/worker target/release/mcp-server

# 删除数据库（可选）
dropdb -U postgres openpr
```

## 下一步

- [快速上手](./quickstart) -- 5 分钟创建首个工作区和项目
- [Docker 部署](../deployment/docker) -- 生产 Docker 配置
- [生产环境部署](../deployment/production) -- Caddy、PostgreSQL 和安全加固
