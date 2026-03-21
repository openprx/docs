---
title: 故障排除
description: OpenPR 常见问题的解决方案，包括数据库连接、认证错误、Docker 问题和 MCP 服务器配置。
---

# 故障排除

本页涵盖运行 OpenPR 时的常见问题及其解决方案。

## 数据库连接

### API 启动失败，报 "connection refused"

API 服务器在 PostgreSQL 就绪前启动。

**解决方案**：Docker Compose 文件已包含健康检查和 `depends_on` 的 `condition: service_healthy`。如果问题持续，增加 PostgreSQL 的 `start_period`：

```yaml
postgres:
  healthcheck:
    start_period: 30s  # 从默认 10s 增加
```

### "role openpr does not exist"

PostgreSQL 用户未创建。

**解决方案**：检查 Docker Compose 环境中是否设置了 `POSTGRES_USER` 和 `POSTGRES_PASSWORD`。如果手动运行 PostgreSQL：

```bash
createuser -U postgres openpr
createdb -U postgres -O openpr openpr
```

### 迁移未执行

迁移仅在 PostgreSQL 容器首次启动时自动执行（通过 `docker-entrypoint-initdb.d`）。

**解决方案**：如果数据库已存在，手动执行迁移：

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr
# 然后按顺序运行每个迁移 SQL 文件
```

或重建卷：

```bash
docker-compose down -v
docker-compose up -d
```

::: warning 数据丢失
`docker-compose down -v` 会删除数据库卷。请先备份数据。
:::

## 认证

### 服务器重启后 "Invalid token"

JWT 令牌使用 `JWT_SECRET` 签名。如果该值在重启间变化，所有已有令牌失效。

**解决方案**：在 `.env` 中设置固定的 `JWT_SECRET`：

```bash
JWT_SECRET=your-fixed-random-secret-here
```

### 首个用户不是管理员

Admin 角色分配给第一个注册的用户。如果你看到 `role: "user"` 而非 `role: "admin"`，说明另一个账号先注册了。

**解决方案**：通过数据库更新角色：

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr \
  -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
```

## Docker / Podman

### Podman 构建失败，DNS 错误

Podman 的默认网络在构建期间没有 DNS 访问。

**解决方案**：使用 Podman 构建镜像时始终使用 `--network=host`：

```bash
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
```

### 前端显示 "502 Bad Gateway"

Nginx 容器无法连接到 API 服务器。

**解决方案**：检查：
1. API 容器正在运行：`docker-compose ps`
2. API 健康检查通过：`docker exec openpr-api curl -f http://localhost:8080/health`
3. 两个容器在同一网络上：`docker network inspect openpr_openpr-network`

### 端口冲突

另一个服务正在使用相同端口。

**解决方案**：在 `docker-compose.yml` 中更改外部端口映射：

```yaml
api:
  ports:
    - "8082:8080"  # 从 8081 修改
```

## MCP 服务器

### "tools/list 返回空"

MCP 服务器无法连接到 API。

**解决方案**：验证环境变量：

```bash
docker exec openpr-mcp-server env | grep OPENPR
```

检查：
- `OPENPR_API_URL` 指向正确的 API 端点
- `OPENPR_BOT_TOKEN` 是有效的 Bot Token（以 `opr_` 开头）
- `OPENPR_WORKSPACE_ID` 是有效的工作区 UUID

### stdio 传输不工作

MCP 二进制文件需要在 AI 客户端中配置为命令。

**解决方案**：确保二进制路径正确且环境变量已设置：

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/absolute/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_...",
        "OPENPR_WORKSPACE_ID": "..."
      }
    }
  }
}
```

### SSE 连接断开

代理服务器超时时间短可能关闭 SSE 连接。

**解决方案**：如果使用反向代理，增加 SSE 端点的超时：

```
# Caddy
reverse_proxy /sse localhost:8090 {
    flush_interval -1
}
```

## 前端

### 部署后显示空白页

前端构建可能使用了错误的 API URL。

**解决方案**：构建前设置 `VITE_API_URL`：

```bash
VITE_API_URL=https://your-domain.example.com/api npm run build
```

### 登录成功但页面为空

API 请求静默失败。检查浏览器控制台（F12）是否有 401 或 CORS 错误。

**解决方案**：确保 API 从浏览器可访问且 CORS 已配置。前端应通过 Nginx 代理 API 请求。

## 性能

### 搜索缓慢

没有适当索引的大数据集上，PostgreSQL 全文搜索可能较慢。

**解决方案**：确保 FTS 索引存在（由迁移创建）：

```sql
-- 检查现有索引
SELECT indexname FROM pg_indexes WHERE tablename = 'work_items';
```

### 内存使用过高

API 服务器在内存中处理文件上传。

**解决方案**：限制上传大小并监控 `uploads/` 目录。考虑设置定期清理旧上传文件。

## 获取帮助

如果你的问题未在此列出：

1. 查看 [GitHub Issues](https://github.com/openprx/openpr/issues) 了解已知问题。
2. 查看 API 和 MCP 服务器日志中的错误消息。
3. 提交新 Issue，附上错误日志、环境详情和复现步骤。
