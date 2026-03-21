---
title: 安装
description: 通过 Docker Compose、Cargo 或源码编译安装 PRX-WAF。包括前置要求、平台说明和安装后验证。
---

# 安装

PRX-WAF 支持三种安装方式，请选择最适合你工作流程的方式。

::: tip 推荐
**Docker Compose** 是最快的入门方式。一条命令即可启动 PRX-WAF、PostgreSQL 和管理界面。
:::

## 前置要求

| 要求 | 最低版本 | 说明 |
|------|----------|------|
| 操作系统 | Linux（x86_64、aarch64）、macOS（12+） | Windows 可通过 WSL2 |
| PostgreSQL | 16+ | Docker Compose 中已包含 |
| Rust（仅源码编译） | 1.82.0 | Docker 安装无需 |
| Node.js（仅管理界面编译） | 18+ | Docker 安装无需 |
| Docker | 20.10+ | 或 Podman 3.0+ |
| 磁盘空间 | 500 MB | ~100 MB 二进制 + ~400 MB PostgreSQL 数据 |
| 内存 | 512 MB | 生产环境建议 2 GB+ |

## 方式一：Docker Compose（推荐）

克隆仓库并用 Docker Compose 启动所有服务：

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# 查看并编辑 docker-compose.yml 中的环境变量
# （数据库密码、管理员凭据、监听端口）
docker compose up -d
```

启动后包含三个容器：

| 容器 | 端口 | 说明 |
|------|------|------|
| `prx-waf` | `80`、`443` | 反向代理（HTTP + HTTPS） |
| `prx-waf` | `9527` | 管理 API + Vue 3 界面 |
| `postgres` | `5432` | PostgreSQL 16 数据库 |

验证部署：

```bash
# 检查容器状态
docker compose ps

# 检查健康端点
curl http://localhost:9527/health
```

打开管理界面 `http://localhost:9527`，使用默认凭据登录：`admin` / `admin`。

::: warning 修改默认密码
首次登录后请立即修改默认管理员密码。在管理界面中进入 **设置 > 账户** 或通过 API 修改。
:::

### 使用 Podman 的 Docker Compose

如果使用 Podman 而非 Docker：

```bash
podman-compose up -d --build
```

::: info Podman DNS
使用 Podman 时，容器间通信的 DNS 解析器地址为 `10.89.0.1`，而非 Docker 默认的 `127.0.0.11`。自带的 `docker-compose.yml` 已自动处理此差异。
:::

## 方式二：Cargo 安装

如果已安装 Rust，可以从仓库编译安装：

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
cargo build --release
```

二进制文件位于 `target/release/prx-waf`。将其复制到 PATH 中：

```bash
sudo cp target/release/prx-waf /usr/local/bin/prx-waf
```

::: warning 编译依赖
Cargo 编译需要原生依赖。在 Debian/Ubuntu 上可能需要：
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
在 macOS 上需要 Xcode 命令行工具：
```bash
xcode-select --install
```
:::

### 数据库设置

PRX-WAF 需要 PostgreSQL 16+ 数据库：

```bash
# 创建数据库和用户
createdb prx_waf
createuser prx_waf

# 运行迁移
./target/release/prx-waf -c configs/default.toml migrate

# 创建默认管理员用户（admin/admin）
./target/release/prx-waf -c configs/default.toml seed-admin
```

### 启动服务

```bash
./target/release/prx-waf -c configs/default.toml run
```

这将在 80/443 端口启动反向代理，在 9527 端口启动管理 API。

## 方式三：源码编译（开发）

用于开发环境，支持管理界面热重载：

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# 编译 Rust 后端
cargo build

# 编译管理界面
cd web/admin-ui
npm install
npm run build
cd ../..

# 启动开发服务器
cargo run -- -c configs/default.toml run
```

## systemd 服务

生产环境裸机部署时，创建 systemd 服务：

```ini
# /etc/systemd/system/prx-waf.service
[Unit]
Description=PRX-WAF Web 应用防火墙
After=network.target postgresql.service

[Service]
Type=simple
User=prx-waf
ExecStart=/usr/local/bin/prx-waf -c /etc/prx-waf/config.toml run
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-waf
sudo systemctl status prx-waf
```

## 验证安装

安装完成后，验证 PRX-WAF 是否正常运行：

```bash
# 检查健康端点
curl http://localhost:9527/health

# 检查管理界面
curl -s http://localhost:9527 | head -5
```

在浏览器中打开 `http://localhost:9527`，验证仪表板是否正常加载。

## 下一步

- [快速开始](./quickstart) —— 5 分钟内保护你的应用
- [配置](../configuration/) —— 自定义 PRX-WAF 设置
- [规则引擎](../rules/) —— 了解检测流水线
