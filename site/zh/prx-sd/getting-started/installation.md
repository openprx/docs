---
title: 安装
description: 通过安装脚本、Cargo、源码构建或 Docker 在 Linux、macOS 或 Windows WSL2 上安装 PRX-SD。
---

# 安装

PRX-SD 支持四种安装方式，请选择最适合你工作流程的方法。

::: tip 推荐
**安装脚本**是最快的上手方式。它会自动检测平台、下载对应的二进制文件并放入 PATH。
:::

## 前置条件

| 要求 | 最低配置 | 说明 |
|------|----------|------|
| 操作系统 | Linux（x86_64、aarch64）、macOS（12+）、Windows（WSL2） | 不支持原生 Windows |
| 磁盘空间 | 200 MB | 二进制文件约 50 MB + 签名数据库约 150 MB |
| 内存 | 512 MB | 扫描大目录建议 2 GB 以上 |
| Rust（仅源码构建） | 1.85.0 | 脚本或 Docker 安装不需要 |
| Git（仅源码构建） | 2.30+ | 用于克隆仓库 |
| Docker（仅 Docker 安装） | 20.10+ | 或 Podman 3.0+ |

## 方式一：安装脚本（推荐）

安装脚本会下载适用于你平台的最新发行版二进制文件，并放入 `/usr/local/bin`。

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash
```

安装指定版本：

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash -s -- --version 0.5.0
```

脚本支持以下环境变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `INSTALL_DIR` | `/usr/local/bin` | 自定义安装目录 |
| `VERSION` | `latest` | 指定发行版本号 |
| `ARCH` | 自动检测 | 覆盖架构（`x86_64`、`aarch64`） |

## 方式二：Cargo 安装

如果你已安装 Rust，可以直接从 crates.io 安装：

```bash
cargo install prx-sd
```

这会从源码编译，并将 `sd` 二进制文件放入 `~/.cargo/bin/`。

::: warning 构建依赖
Cargo 安装需要编译原生依赖。在 Debian/Ubuntu 上可能需要：
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
在 macOS 上需要 Xcode Command Line Tools：
```bash
xcode-select --install
```
:::

## 方式三：源码构建

克隆仓库并以 release 模式构建：

```bash
git clone https://github.com/openprx/prx-sd.git
cd prx-sd
cargo build --release
```

二进制文件位于 `target/release/sd`。将其复制到 PATH：

```bash
sudo cp target/release/sd /usr/local/bin/sd
```

### 构建选项

| Feature 标志 | 默认 | 说明 |
|-------------|------|------|
| `yara` | 启用 | YARA-X 规则引擎 |
| `ml` | 禁用 | ONNX ML 推理引擎 |
| `gui` | 禁用 | Tauri + Vue 3 桌面 GUI |
| `virustotal` | 禁用 | VirusTotal API 集成 |

构建带 ML 推理支持的版本：

```bash
cargo build --release --features ml
```

构建桌面 GUI：

```bash
cargo build --release --features gui
```

## 方式四：Docker

拉取官方 Docker 镜像：

```bash
docker pull ghcr.io/openprx/prx-sd:latest
```

通过挂载目标目录进行扫描：

```bash
docker run --rm -v /path/to/scan:/scan ghcr.io/openprx/prx-sd:latest scan /scan --recursive
```

实时监控可以作为守护进程运行：

```bash
docker run -d \
  --name prx-sd \
  --restart unless-stopped \
  -v /home:/watch/home:ro \
  -v /tmp:/watch/tmp:ro \
  ghcr.io/openprx/prx-sd:latest \
  monitor /watch/home /watch/tmp
```

::: tip Docker Compose
仓库根目录提供了 `docker-compose.yml`，用于生产环境部署并支持自动签名更新。
:::

## 平台说明

### Linux

PRX-SD 可在任何现代 Linux 发行版上运行。实时监控使用 `inotify` 子系统。对于大型目录树，可能需要增加监控数量限制：

```bash
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

Rootkit 检测和内存扫描需要 root 权限。

### macOS

PRX-SD 在 macOS 上使用 FSEvents 进行实时监控。支持 Apple Silicon（aarch64）和 Intel（x86_64），安装脚本会自动检测你的架构。

::: warning macOS Gatekeeper
如果 macOS 阻止运行二进制文件，请移除隔离属性：
```bash
xattr -d com.apple.quarantine /usr/local/bin/sd
```
:::

### Windows (WSL2)

PRX-SD 使用 Linux 二进制文件在 WSL2 内运行。请先安装 WSL2 并选择一个 Linux 发行版，然后按照 Linux 安装步骤操作。原生 Windows 支持计划在后续版本中推出。

## 验证安装

安装完成后，验证 `sd` 是否正常工作：

```bash
sd --version
```

预期输出：

```
prx-sd 0.5.0
```

查看完整的系统状态，包括签名数据库信息：

```bash
sd info
```

该命令会显示已安装的版本、签名数量、YARA 规则数量和数据库路径。

## 卸载

### 脚本 / Cargo 安装

```bash
# 删除二进制文件
sudo rm /usr/local/bin/sd
# 或者如果通过 Cargo 安装
cargo uninstall prx-sd

# 删除签名数据库和配置
rm -rf ~/.config/prx-sd
rm -rf ~/.local/share/prx-sd
```

### Docker

```bash
docker stop prx-sd && docker rm prx-sd
docker rmi ghcr.io/openprx/prx-sd:latest
```

## 下一步

- [快速开始](./quickstart) —— 5 分钟内开始扫描
- [文件与目录扫描](../scanning/file-scan) —— `sd scan` 命令完整参考
- [检测引擎概览](../detection/) —— 了解多层检测流水线
