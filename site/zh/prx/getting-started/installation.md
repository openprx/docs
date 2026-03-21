---
title: 安装指南
description: PRX 支持一键脚本、cargo install、源码编译和 Docker 四种安装方式，覆盖 Linux、macOS 和 Windows WSL2 平台。
---

# 安装指南

PRX 提供多种安装方式，选择最适合你环境的一种即可。

## 前置条件

### 必需

- **操作系统**: Linux (x86_64 / aarch64)、macOS (Apple Silicon / Intel) 或 Windows WSL2
- **内存**: 最低 512MB 可用内存（推荐 2GB+）
- **磁盘**: 约 200MB 安装空间

### 源码编译额外需要

- **Rust 工具链**: 1.85+ (2024 edition)
- **系统依赖**:
  - `pkg-config`
  - `libssl-dev`（Debian/Ubuntu）或 `openssl-devel`（Fedora/RHEL）
  - `libsqlite3-dev`（可选，用于 SQLite 记忆后端）
  - `protobuf-compiler`（可选，用于 gRPC 功能）

::: tip 提示
一键安装脚本和 cargo install 会自动处理大部分依赖，推荐优先使用。
:::

## 方式 1: 一键安装脚本（推荐）

最简单的安装方式，自动检测平台并下载预编译二进制：

```bash
curl -fsSL https://get.openprx.dev | bash
```

脚本会：

1. 检测你的操作系统和 CPU 架构
2. 下载对应的预编译二进制
3. 安装到 `~/.local/bin/prx`
4. 提示你将路径加入 `$PATH`（如果尚未添加）

指定版本安装：

```bash
curl -fsSL https://get.openprx.dev | bash -s -- --version 0.3.0
```

安装到自定义路径：

```bash
curl -fsSL https://get.openprx.dev | bash -s -- --prefix /usr/local
```

## 方式 2: cargo install

如果你已经安装了 Rust 工具链：

```bash
cargo install openprx
```

安装指定版本：

```bash
cargo install openprx --version 0.3.0
```

启用全部功能（包含所有渠道和提供商）：

```bash
cargo install openprx --all-features
```

仅安装核心功能（体积更小）：

```bash
cargo install openprx --no-default-features --features "core,cli"
```

::: info 编译时间
首次编译大约需要 5-15 分钟（取决于机器性能），后续增量编译会快很多。
:::

## 方式 3: 源码编译

适合需要修改源码或贡献代码的开发者：

```bash
# 克隆仓库
git clone https://github.com/openprx/prx.git
cd prx

# 编译 release 版本
cargo build --release

# 二进制位于 target/release/openprx
./target/release/openprx --version

# （可选）安装到系统路径
sudo install -m 755 target/release/openprx /usr/local/bin/prx
```

### 常用编译选项

```bash
# 仅编译核心（不含可选渠道）
cargo build --release --no-default-features --features "core,cli"

# 编译含 WASM 插件支持
cargo build --release --features "wasm-plugins"

# 编译远程节点 Agent
cargo build --release --bin prx-node
```

### 开发模式

```bash
# 开发编译（更快，但未优化）
cargo build

# 运行测试
cargo test

# 运行代码检查
cargo check
cargo clippy
```

## 方式 4: Docker

使用官方 Docker 镜像运行 PRX：

```bash
# 拉取最新镜像
docker pull ghcr.io/openprx/prx:latest

# 运行（挂载配置目录）
docker run -d \
  --name prx \
  -v ~/.config/openprx:/root/.config/openprx \
  -v prx-data:/data \
  ghcr.io/openprx/prx:latest \
  daemon

# 查看日志
docker logs -f prx
```

使用 Docker Compose：

```yaml
# docker-compose.yml
services:
  prx:
    image: ghcr.io/openprx/prx:latest
    restart: unless-stopped
    volumes:
      - ./config:/root/.config/openprx
      - prx-data:/data
    environment:
      - PRX_LOG=info
    command: daemon

volumes:
  prx-data:
```

```bash
docker compose up -d
```

## 验证安装

无论使用哪种方式安装，都可以通过以下命令验证：

```bash
# 查看版本
prx --version

# 运行诊断检查
prx doctor
```

`prx doctor` 会检查：

- 配置文件是否存在和有效
- LLM 提供商连接状态
- 渠道配置状态
- 系统依赖是否满足
- 数据目录权限

## 平台说明

### Linux

PRX 在 Linux 上有最完整的支持，所有功能均可用。

| 发行版 | 最低版本 | 备注 |
|--------|----------|------|
| Ubuntu | 20.04+ | 推荐，CI 测试覆盖 |
| Debian | 11+ | 完整支持 |
| Fedora | 38+ | 完整支持 |
| Arch Linux | Rolling | 完整支持 |
| Alpine | 3.18+ | 需要 musl 版本 |

::: tip 沙箱
Linux 上支持全部 4 种沙箱后端：Docker、Firejail、Bubblewrap、Landlock。推荐生产环境使用 Landlock（内核 5.13+）或 Bubblewrap。
:::

### macOS

```bash
# 安装系统依赖（源码编译时需要）
brew install pkg-config openssl sqlite protobuf
```

| 架构 | 状态 | 备注 |
|------|------|------|
| Apple Silicon (M1/M2/M3/M4) | 完整支持 | 推荐 |
| Intel | 完整支持 | |

::: warning 注意
macOS 上沙箱仅支持 Docker 后端。Firejail、Bubblewrap 和 Landlock 为 Linux 专有。
:::

### Windows WSL2

PRX 不原生支持 Windows，但可以在 WSL2 中完美运行：

```powershell
# 安装 WSL2（PowerShell 管理员模式）
wsl --install -d Ubuntu

# 进入 WSL2 后按 Linux 方式安装
curl -fsSL https://get.openprx.dev | bash
```

::: info 提示
WSL2 环境下的 PRX 可以访问 Windows 文件系统（通过 `/mnt/c/` 等路径），但建议将数据存放在 Linux 文件系统中以获得更好的 I/O 性能。
:::

## 更新

```bash
# 一键脚本安装的更新方式
curl -fsSL https://get.openprx.dev | bash

# cargo 安装的更新方式
cargo install openprx --force

# Docker 更新
docker pull ghcr.io/openprx/prx:latest
docker compose up -d
```

## 卸载

```bash
# 删除二进制
rm -f ~/.local/bin/prx
# 或
sudo rm -f /usr/local/bin/prx

# （可选）清除配置和数据
rm -rf ~/.config/openprx
rm -rf ~/.local/share/openprx
```

## 下一步

安装完成后，请继续阅读 [快速开始](./quickstart) 章节，5 分钟内完成首次配置和对话。
