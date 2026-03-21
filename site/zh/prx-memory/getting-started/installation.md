---
title: 安装
description: 通过 Cargo 从源码安装 PRX-Memory，或构建用于 stdio 和 HTTP 传输的守护进程二进制文件。
---

# 安装

PRX-Memory 以 Rust 工作区形式分发。主要产出物是来自 `prx-memory-mcp` crate 的 `prx-memoryd` 守护进程二进制文件。

::: tip 推荐方式
从源码构建可以获得最新功能，并允许你启用 LanceDB 等可选后端。
:::

## 前置条件

| 需求 | 最低版本 | 备注 |
|------|---------|------|
| Rust | stable 工具链 | 通过 [rustup](https://rustup.rs/) 安装 |
| 操作系统 | Linux、macOS、Windows（WSL2） | 任何 Rust 支持的平台 |
| Git | 2.30+ | 用于克隆仓库 |
| 磁盘空间 | 100 MB | 二进制文件 + 依赖 |
| 内存 | 256 MB | 大型记忆数据库建议更多内存 |

## 方式一：从源码构建（推荐）

克隆仓库并以 release 模式构建：

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build --release -p prx-memory-mcp --bin prx-memoryd
```

二进制文件位于 `target/release/prx-memoryd`。将其复制到 PATH 中：

```bash
sudo cp target/release/prx-memoryd /usr/local/bin/prx-memoryd
```

### 构建选项

| 特性标志 | 默认值 | 说明 |
|---------|-------|------|
| `lancedb-backend` | 禁用 | LanceDB 向量存储后端 |

启用 LanceDB 支持的构建：

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

::: warning 构建依赖
在 Debian/Ubuntu 上可能需要：
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
在 macOS 上需要 Xcode 命令行工具：
```bash
xcode-select --install
```
:::

## 方式二：Cargo 安装

如果已安装 Rust，可以直接安装：

```bash
cargo install prx-memory-mcp
```

这将从源码编译并将 `prx-memoryd` 二进制文件放入 `~/.cargo/bin/`。

## 方式三：作为库使用

要在你自己的 Rust 项目中将 PRX-Memory crate 作为依赖使用，在 `Cargo.toml` 中添加：

```toml
[dependencies]
prx-memory-core = "0.1"
prx-memory-embed = "0.1"
prx-memory-rerank = "0.1"
prx-memory-storage = "0.1"
```

## 验证安装

构建完成后，验证二进制文件可以运行：

```bash
prx-memoryd --help
```

测试基本的 stdio 会话：

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

测试 HTTP 会话：

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

检查健康端点：

```bash
curl -sS http://127.0.0.1:8787/health
```

## 开发环境设置

开发和测试使用标准 Rust 工作流：

```bash
# 格式化
cargo fmt --all

# 代码检查
cargo clippy --all-targets --all-features -- -D warnings

# 测试
cargo test --all-targets --all-features

# 快速检查
cargo check --all-targets --all-features
```

## 卸载

```bash
# 删除二进制文件
sudo rm /usr/local/bin/prx-memoryd
# 或如果通过 Cargo 安装
cargo uninstall prx-memory-mcp

# 删除数据文件
rm -rf ./data/memory-db.json
```

## 下一步

- [快速上手](./quickstart) -- 5 分钟内运行 PRX-Memory
- [配置参考](../configuration/) -- 所有环境变量和配置文件
- [MCP 集成](../mcp/) -- 连接到你的 MCP 客户端
