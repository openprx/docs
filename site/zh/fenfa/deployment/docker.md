---
title: Docker 部署
description: 使用 Docker 和 Docker Compose 部署 Fenfa。容器配置、卷挂载、多架构构建和健康检查。
---

# Docker 部署

Fenfa 以单个 Docker 镜像发布，包含内嵌前端的 Go 二进制文件。无需额外容器 -- 只需挂载卷实现数据持久化。

## 快速启动

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

## Docker Compose

创建 `docker-compose.yml`：

```yaml
version: "3.8"

services:
  fenfa:
    image: fenfa/fenfa:latest
    container_name: fenfa
    restart: unless-stopped
    ports:
      - "127.0.0.1:8000:8000"
    environment:
      FENFA_ADMIN_TOKEN: ${FENFA_ADMIN_TOKEN}
      FENFA_UPLOAD_TOKEN: ${FENFA_UPLOAD_TOKEN}
      FENFA_PRIMARY_DOMAIN: ${FENFA_PRIMARY_DOMAIN:-http://localhost:8000}
    volumes:
      - fenfa-data:/data
      - fenfa-uploads:/app/uploads
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8000/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

volumes:
  fenfa-data:
  fenfa-uploads:
```

在 compose 文件旁创建 `.env` 文件：

```bash
FENFA_ADMIN_TOKEN=your-secure-admin-token
FENFA_UPLOAD_TOKEN=your-secure-upload-token
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

启动服务：

```bash
docker compose up -d
```

## 卷挂载

| 挂载点 | 用途 | 需要备份 |
|--------|------|----------|
| `/data` | SQLite 数据库 | 是 |
| `/app/uploads` | 上传的二进制文件 | 是（使用 S3 时除外） |
| `/app/config.json` | 配置文件（可选） | 是 |

::: warning 数据持久化
不挂载卷时，容器重建后所有数据都会丢失。生产环境务必挂载 `/data` 和 `/app/uploads`。
:::

## 使用配置文件

挂载配置文件实现完全控制：

```yaml
services:
  fenfa:
    image: fenfa/fenfa:latest
    volumes:
      - fenfa-data:/data
      - fenfa-uploads:/app/uploads
      - ./config.json:/app/config.json:ro
```

## 健康检查

Fenfa 在 `/healthz` 暴露健康检查端点：

```bash
curl http://localhost:8000/healthz
# {"ok": true}
```

上面的 Docker Compose 示例已包含健康检查配置。对于 Kubernetes 或 Nomad 等编排器，使用此端点作为存活和就绪探针。

## 多架构

Fenfa 的 Docker 镜像同时支持 `linux/amd64` 和 `linux/arm64`。Docker 自动拉取与宿主机匹配的架构。

自行构建多架构镜像：

```bash
./scripts/docker-build.sh
```

使用 Docker Buildx 为两种架构创建镜像。

## 资源需求

Fenfa 非常轻量：

| 资源 | 最低 | 推荐 |
|------|------|------|
| CPU | 1 核 | 2 核 |
| 内存 | 64 MB | 256 MB |
| 磁盘 | 100 MB（应用） | 取决于上传文件 |

SQLite 数据库和 Go 二进制文件开销极小。资源使用主要随上传存储和并发连接数增长。

## 日志

查看容器日志：

```bash
docker logs -f fenfa
```

Fenfa 输出到 stdout，使用结构化格式，兼容日志聚合工具。

## 更新

```bash
docker compose pull
docker compose up -d
```

::: tip 零停机更新
Fenfa 启动极快（< 1 秒）。要实现接近零停机的更新，使用反向代理健康检查，在新容器通过健康检查后自动路由流量到新容器。
:::

## 下一步

- [生产环境部署](./production) -- 反向代理、TLS 和安全配置
- [配置参考](../configuration/) -- 所有配置选项
- [故障排除](../troubleshooting/) -- 常见 Docker 问题
