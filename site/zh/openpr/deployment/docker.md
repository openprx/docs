---
title: Docker 部署
description: 使用 Docker Compose 或 Podman 部署 OpenPR。包括服务配置、网络、卷和健康检查。
---

# Docker 部署

OpenPR 提供 `docker-compose.yml`，一条命令即可启动所有所需服务。

## 快速开始

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
# 编辑 .env 设置生产环境值
docker-compose up -d
```

## 服务架构

```mermaid
graph LR
    subgraph Docker["Docker 网络 (openpr-network)"]
        PG["PostgreSQL<br/>:5432"]
        API["API 服务器<br/>:8080"]
        WORKER["Worker"]
        MCP["MCP 服务器<br/>:8090"]
        FE["前端<br/>:80"]
    end

    PG --> API
    PG --> WORKER
    API --> MCP
    API --> FE

    USER["用户<br/>浏览器"] -->|":3000"| FE
    AIBOT["AI 助手"] -->|":8090"| MCP
```

## 服务

### PostgreSQL

```yaml
postgres:
  image: postgres:16
  container_name: openpr-postgres
  environment:
    POSTGRES_DB: openpr
    POSTGRES_USER: openpr
    POSTGRES_PASSWORD: openpr
  ports:
    - "5432:5432"
  volumes:
    - pgdata:/var/lib/postgresql/data
    - ./migrations:/docker-entrypoint-initdb.d
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U openpr -d openpr"]
    interval: 5s
    timeout: 3s
    retries: 20
```

`migrations/` 目录中的迁移脚本在首次启动时通过 PostgreSQL 的 `docker-entrypoint-initdb.d` 机制自动执行。

### API 服务器

```yaml
api:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: api
  container_name: openpr-api
  environment:
    BIND_ADDR: 0.0.0.0:8080
    DATABASE_URL: postgres://openpr:openpr@postgres:5432/openpr
    JWT_SECRET: ${JWT_SECRET:-change-me-in-production}
    UPLOAD_DIR: /app/uploads
  ports:
    - "8081:8080"
  volumes:
    - ./uploads:/app/uploads
  depends_on:
    postgres:
      condition: service_healthy
```

### Worker

```yaml
worker:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: worker
  container_name: openpr-worker
  environment:
    DATABASE_URL: postgres://openpr:openpr@postgres:5432/openpr
  depends_on:
    postgres:
      condition: service_healthy
```

Worker 没有暴露端口——它直接连接 PostgreSQL 处理后台任务。

### MCP 服务器

```yaml
mcp-server:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: mcp-server
  container_name: openpr-mcp-server
  environment:
    OPENPR_API_URL: http://api:8080
    OPENPR_BOT_TOKEN: opr_your_token
    OPENPR_WORKSPACE_ID: your-workspace-uuid
  command: ["./mcp-server", "serve", "--transport", "http", "--bind-addr", "0.0.0.0:8090"]
  ports:
    - "8090:8090"
  depends_on:
    api:
      condition: service_healthy
```

### 前端

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: openpr-frontend
  ports:
    - "3000:80"
  depends_on:
    api:
      condition: service_healthy
```

## 卷

| 卷 | 用途 |
|----|------|
| `pgdata` | PostgreSQL 数据持久化 |
| `./uploads` | 文件上传存储 |
| `./migrations` | 数据库迁移脚本 |

## 健康检查

所有服务包含健康检查：

| 服务 | 检查方式 | 间隔 |
|------|----------|------|
| PostgreSQL | `pg_isready` | 5 秒 |
| API | `curl /health` | 10 秒 |
| MCP 服务器 | `curl /health` | 10 秒 |
| 前端 | `wget /health` | 30 秒 |

## 常用操作

```bash
# 查看日志
docker-compose logs -f api
docker-compose logs -f mcp-server

# 重启服务
docker-compose restart api

# 重建并重启
docker-compose up -d --build api

# 停止所有服务
docker-compose down

# 停止并删除卷（警告：删除数据库）
docker-compose down -v

# 连接数据库
docker exec -it openpr-postgres psql -U openpr -d openpr
```

## Podman

对于 Podman 用户，主要区别是：

1. 构建时使用 `--network=host` 以访问 DNS：
   ```bash
   sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
   ```

2. 前端 Nginx 使用 `10.89.0.1` 作为 DNS 解析器（Podman 默认），而非 `127.0.0.11`（Docker 默认）。

3. 使用 `sudo podman-compose` 替代 `docker-compose`。

## 下一步

- [生产环境部署](./production) -- Caddy 反向代理、HTTPS 和安全
- [配置](../configuration/) -- 环境变量参考
- [故障排除](../troubleshooting/) -- 常见 Docker 问题
