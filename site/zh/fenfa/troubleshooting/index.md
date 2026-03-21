---
title: 故障排除
description: 运行 Fenfa 时的常见问题和解决方案，包括 iOS 安装失败、上传错误和 Docker 问题。
---

# 故障排除

本页面涵盖运行 Fenfa 时常见的问题及其解决方案。

## iOS 安装

### "无法安装" / 安装失败

**症状：** 在 iOS 上点击安装按钮显示"无法安装"或没有任何反应。

**原因和解决方案：**

1. **未配置 HTTPS。** iOS 要求 OTA 安装使用带有效 TLS 证书的 HTTPS。自签名证书无法使用。
   - **修复：** 设置带有效 TLS 证书的反向代理。详见 [生产环境部署](../deployment/production)。
   - **测试时：** 使用 `ngrok` 创建 HTTPS 隧道：`ngrok http 8000`

2. **primary_domain 错误。** Manifest plist 包含基于 `primary_domain` 的下载 URL。如果设置错误，iOS 无法获取 IPA。
   - **修复：** 将 `FENFA_PRIMARY_DOMAIN` 设置为用户实际访问的 HTTPS URL（如 `https://dist.example.com`）。

3. **证书问题。** TLS 证书必须覆盖域名并被 iOS 信任。
   - **修复：** 使用 Let's Encrypt 获取免费、受信任的证书。

4. **IPA 签名过期。** 描述文件或签名证书可能已过期。
   - **修复：** 使用有效证书重新签名 IPA 并重新上传。

### UDID 绑定不工作

**症状：** mobileconfig 描述文件安装成功但设备未注册。

**原因和解决方案：**

1. **回调 URL 不可达。** UDID 回调 URL 必须从设备可访问。
   - **修复：** 确保 `primary_domain` 正确且从设备所在网络可访问。

2. **随机数过期。** 描述文件的随机数在超时后过期。
   - **修复：** 重新下载 mobileconfig 描述文件并重试。

## 上传问题

### 上传返回 401

**症状：** `{"ok": false, "error": {"code": "UNAUTHORIZED", ...}}`

**修复：** 检查 `X-Auth-Token` 请求头是否包含有效 Token。上传端点同时接受上传和管理 Token。

```bash
# 验证 Token 是否有效
curl -H "X-Auth-Token: YOUR_TOKEN" http://localhost:8000/admin/api/products
```

### 上传返回 413（请求实体过大）

**症状：** 大文件上传失败并返回 413 错误。

**修复：** 这通常是反向代理的限制，而非 Fenfa 本身。增加限制：

**Nginx：**
```nginx
client_max_body_size 2G;
```

**Caddy：**
Caddy 没有默认的请求体大小限制，但如果你设置了：
```
dist.example.com {
    request_body {
        max_size 2GB
    }
    reverse_proxy localhost:8000
}
```

### 智能上传未检测到元数据

**症状：** 智能上传后版本号和构建号为空。

**修复：** 智能上传的自动检测仅适用于 IPA 和 APK 文件。桌面端格式（DMG、EXE、DEB 等）请在上传请求中显式提供 `version` 和 `build`。

## Docker 问题

### 容器启动但管理面板为空

**症状：** 管理面板加载但没有数据或显示空白页。

**修复：** 检查容器是否运行中且端口映射正确：

```bash
docker ps
docker logs fenfa
```

### 容器重启后数据丢失

**症状：** 重启容器后所有产品、变体和发布消失。

**修复：** 挂载持久化卷：

```bash
docker run -d --name fenfa -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

### 挂载卷权限被拒绝

**症状：** Fenfa 无法写入 `/data` 或 `/app/uploads`。

**修复：** 确保宿主机目录存在且权限正确：

```bash
mkdir -p data uploads
chmod 777 data uploads  # 或设置适当的 UID/GID
```

## 数据库问题

### "database is locked" 错误

**症状：** 高并发下 SQLite 返回 "database is locked"。

**修复：** SQLite 处理并发读取很好，但写入是串行化的。此错误通常在写入负载非常高时出现。解决方案：
- 确保只有一个 Fenfa 实例写入同一数据库文件。
- 如果运行多个实例，使用 S3 存储和共享数据库（或在未来版本中切换到其他数据库后端）。

### 数据库损坏

**症状：** Fenfa 启动失败并显示 SQLite 错误。

**修复：** 从备份恢复：

```bash
# 停止 Fenfa
docker stop fenfa

# 恢复备份
cp /backups/fenfa-latest.db /path/to/data/fenfa.db

# 重启
docker start fenfa
```

::: tip 预防
设置自动每日备份。详见 [生产环境部署](../deployment/production) 的备份脚本。
:::

## 网络问题

### iOS Manifest 返回错误的 URL

**症状：** iOS manifest plist 包含 `http://localhost:8000` 而不是公开域名。

**修复：** 将 `FENFA_PRIMARY_DOMAIN` 设置为你的公开 HTTPS URL：

```bash
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

### 下载缓慢或超时

**症状：** 大文件下载缓慢或失败。

**可能的修复：**
- 增加反向代理超时：`proxy_read_timeout 600s;`（Nginx）
- 禁用请求缓冲：`proxy_request_buffering off;`（Nginx）
- 考虑使用带 CDN 的 S3 兼容存储来处理大文件

## 获取帮助

如果你的问题未在此处涵盖：

1. 查看 [GitHub Issues](https://github.com/openprx/fenfa/issues) 了解已知问题。
2. 查看容器日志：`docker logs fenfa`
3. 提交新 issue，附上：
   - Fenfa 版本（`docker inspect fenfa | grep Image`）
   - 相关日志输出
   - 问题复现步骤
