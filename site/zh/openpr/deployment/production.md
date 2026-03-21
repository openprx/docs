---
title: 生产环境部署
description: 使用 Caddy 反向代理、自动 HTTPS、PostgreSQL 加固和安全最佳实践在生产环境中部署 OpenPR。
---

# 生产环境部署

本指南涵盖在生产环境中部署 OpenPR，包括 HTTPS、反向代理、数据库加固和安全最佳实践。

## 架构

```mermaid
graph LR
    INTERNET["互联网<br/>:443"] --> CADDY["Caddy<br/>自动 HTTPS"]
    CADDY --> FE["前端<br/>Nginx :3000"]
    FE --> API["API :8080"]
    FE --> MCP["MCP :8090"]
    API --> PG["PostgreSQL :5432"]
    WORKER["Worker"] --> PG
```

## 前置要求

- 至少 2 CPU 核心和 2 GB 内存的服务器
- 指向服务器 IP 地址的域名
- Docker 和 Docker Compose（或 Podman）

## 第一步：配置环境

创建生产 `.env` 文件：

```bash
# 数据库（使用强密码）
DATABASE_URL=postgres://openpr:强密码@postgres:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=强密码

# JWT（生成随机密钥）
JWT_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_TTL_SECONDS=86400
JWT_REFRESH_TTL_SECONDS=604800

# 日志
RUST_LOG=info
```

::: danger 密钥安全
永远不要将 `.env` 文件提交到版本控制。使用 `chmod 600 .env` 限制文件权限。
:::

## 第二步：设置 Caddy

在宿主系统上安装 Caddy：

```bash
sudo apt install -y caddy
```

配置 Caddyfile：

```
# /etc/caddy/Caddyfile
your-domain.example.com {
    reverse_proxy localhost:3000
}
```

Caddy 自动获取和续签 Let's Encrypt TLS 证书。

启动 Caddy：

```bash
sudo systemctl enable --now caddy
```

::: tip 替代方案：Nginx
如果你偏好 Nginx，配置反向代理到 3000 端口并使用 certbot 获取 TLS 证书。
:::

## 第三步：使用 Docker Compose 部署

```bash
cd /opt/openpr
docker-compose up -d
```

验证所有服务健康：

```bash
docker-compose ps
curl -k https://your-domain.example.com/health
```

## 第四步：创建管理员账号

在浏览器中打开 `https://your-domain.example.com` 并注册管理员账号。

::: warning 首个用户
第一个注册的用户成为管理员。在分享 URL 之前先注册管理员账号。
:::

## 安全检查清单

### 认证

- [ ] 将 `JWT_SECRET` 改为 32+ 字符的随机值
- [ ] 设置合适的令牌 TTL 值（访问令牌短，刷新令牌长）
- [ ] 部署后立即创建管理员账号

### 数据库

- [ ] 为 PostgreSQL 使用强密码
- [ ] 不要将 PostgreSQL 端口（5432）暴露到互联网
- [ ] 启用 PostgreSQL SSL 连接（如果数据库在远程）
- [ ] 设置定期数据库备份

### 网络

- [ ] 使用 Caddy 或 Nginx 启用 HTTPS（TLS 1.3）
- [ ] 仅将 443（HTTPS）和可选的 8090（MCP）端口暴露到互联网
- [ ] 使用防火墙（ufw、iptables）限制访问
- [ ] 考虑将 MCP 服务器访问限制在已知 IP 范围

### 应用

- [ ] 设置 `RUST_LOG=info`（生产环境不用 debug 或 trace）
- [ ] 监控上传目录磁盘使用
- [ ] 设置容器日志轮转

## 数据库备份

设置自动 PostgreSQL 备份：

```bash
#!/bin/bash
# /opt/openpr/backup.sh
BACKUP_DIR="/opt/openpr/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

docker exec openpr-postgres pg_dump -U openpr openpr | gzip > "$BACKUP_DIR/openpr_$DATE.sql.gz"

# 仅保留最近 30 天
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
```

添加到 cron：

```bash
# 每天凌晨 2 点备份
0 2 * * * /opt/openpr/backup.sh
```

## 监控

### 健康检查

监控服务健康端点：

```bash
# API
curl -f http://localhost:8080/health

# MCP 服务器
curl -f http://localhost:8090/health
```

### 日志监控

```bash
# 查看所有日志
docker-compose logs -f

# 查看特定服务
docker-compose logs -f api --tail=100
```

## 扩展考虑

- **API 服务器**：可在负载均衡器后运行多个副本。所有实例连接同一个 PostgreSQL 数据库。
- **Worker**：运行单个实例以避免重复处理任务。
- **MCP 服务器**：可运行多个副本。每个实例无状态。
- **PostgreSQL**：对于高可用性，考虑 PostgreSQL 复制或托管数据库服务。

## 更新

更新 OpenPR：

```bash
cd /opt/openpr
git pull origin main
docker-compose down
docker-compose up -d --build
```

数据库迁移在 API 服务器启动时自动执行。

## 下一步

- [Docker 部署](./docker) -- Docker Compose 参考
- [配置](../configuration/) -- 环境变量参考
- [故障排除](../troubleshooting/) -- 常见生产环境问题
