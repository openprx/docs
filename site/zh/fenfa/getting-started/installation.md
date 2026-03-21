---
title: 安装
description: 通过 Docker、Docker Compose 或源码构建安装 Fenfa。
---

# 安装

Fenfa 支持两种安装方式：Docker（推荐）和源码构建。

::: tip 推荐
**Docker** 是最快的上手方式。一条命令即可启动完整的 Fenfa 实例，无需构建工具。
:::

## 前提条件

| 要求 | 最低版本 | 说明 |
|------|----------|------|
| Docker | 20.10+ | 或 Podman 3.0+ |
| Go（仅源码构建） | 1.25+ | Docker 方式不需要 |
| Node.js（仅源码构建） | 20+ | 用于构建前端 |
| 磁盘空间 | 100 MB | 加上上传文件的存储空间 |

## 方式一：Docker（推荐）

拉取并运行官方镜像：

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  fenfa/fenfa:latest
```

访问 `http://localhost:8000/admin`，使用默认 Token `dev-admin-token` 登录。

::: warning 安全提示
默认 Token 仅用于开发环境。部署到生产环境前请参考 [生产环境部署](../deployment/production) 配置安全 Token。
:::

### 持久化存储

挂载卷以保存数据库和上传文件：

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

### 自定义配置

挂载 `config.json` 文件以完全控制所有设置：

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  -v ./config.json:/app/config.json:ro \
  fenfa/fenfa:latest
```

详见 [配置参考](../configuration/) 了解所有可用选项。

### 环境变量

无需配置文件即可覆盖配置值：

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  -e FENFA_ADMIN_TOKEN=your-secret-admin-token \
  -e FENFA_UPLOAD_TOKEN=your-secret-upload-token \
  -e FENFA_PRIMARY_DOMAIN=https://dist.example.com \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `FENFA_PORT` | HTTP 端口 | `8000` |
| `FENFA_DATA_DIR` | 数据库目录 | `data` |
| `FENFA_PRIMARY_DOMAIN` | 公开域名 URL | `http://localhost:8000` |
| `FENFA_ADMIN_TOKEN` | 管理 Token | `dev-admin-token` |
| `FENFA_UPLOAD_TOKEN` | 上传 Token | `dev-upload-token` |

## 方式二：Docker Compose

创建 `docker-compose.yml`：

```yaml
version: "3.8"
services:
  fenfa:
    image: fenfa/fenfa:latest
    container_name: fenfa
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      FENFA_ADMIN_TOKEN: your-secret-admin-token
      FENFA_UPLOAD_TOKEN: your-secret-upload-token
      FENFA_PRIMARY_DOMAIN: https://dist.example.com
    volumes:
      - ./data:/data
      - ./uploads:/app/uploads
```

启动服务：

```bash
docker compose up -d
```

## 方式三：源码构建

克隆仓库：

```bash
git clone https://github.com/openprx/fenfa.git
cd fenfa
```

### 使用 Make

Makefile 自动化完整构建流程：

```bash
make build   # 构建前端 + 后端
make run     # 启动服务器
```

### 手动构建

先构建前端应用，再构建 Go 后端：

```bash
# 构建公开下载页面
cd web/front && npm ci && npm run build && cd ../..

# 构建管理后台
cd web/admin && npm ci && npm run build && cd ../..

# 构建 Go 二进制文件
go build -o fenfa ./cmd/server
```

前端编译到 `internal/web/dist/`，通过 `go:embed` 嵌入 Go 二进制文件。生成的 `fenfa` 二进制文件完全自包含。

### 运行

```bash
./fenfa
```

Fenfa 默认监听 8000 端口。SQLite 数据库自动创建在 `data/` 目录。

## 验证安装

浏览器打开 `http://localhost:8000/admin`，使用管理 Token 登录，应该能看到管理面板。

检查健康检查端点：

```bash
curl http://localhost:8000/healthz
```

预期返回：

```json
{"ok": true}
```

## 下一步

- [快速上手](./quickstart) -- 5 分钟内上传第一个构建
- [配置参考](../configuration/) -- 所有配置选项
- [Docker 部署](../deployment/docker) -- Docker Compose 和多架构构建
