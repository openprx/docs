---
title: 插件开发指南
description: 使用插件开发工具包开发 PRX 插件的分步指南。
---

# 插件开发指南

本指南将引导你从零开始创建一个 PRX 插件。完成后，你将拥有一个可加载到 PRX 中的工作插件。

## 前提条件

- 安装了 `wasm32-wasi` 目标的 Rust 工具链
- 已安装 PRX CLI
- 对 WASM 概念有基本了解

## 项目配置

```bash
# 安装 WASM 目标
rustup target add wasm32-wasi

# 创建新的插件项目
cargo new --lib my-plugin
cd my-plugin
```

在 `Cargo.toml` 中添加 PRX PDK：

```toml
[dependencies]
prx-pdk = "0.1"

[lib]
crate-type = ["cdylib"]
```

## 编写工具插件

最简单的工具插件实现 `Tool` trait：

```rust
use prx_pdk::prelude::*;

#[prx_tool]
fn hello(name: String) -> Result<String, PluginError> {
    Ok(format!("Hello, {}!", name))
}
```

## 构建

```bash
cargo build --target wasm32-wasi --release
```

编译后的插件位于 `target/wasm32-wasi/release/my_plugin.wasm`。

## 本地测试

```bash
prx plugin install ./target/wasm32-wasi/release/my_plugin.wasm
prx plugin test my-plugin
```

## 发布

插件可以作为 `.wasm` 文件共享或发布到插件注册中心（即将推出）。

## 相关页面

- [插件系统概览](./)
- [PDK 参考](./pdk)
- [宿主函数](./host-functions)
- [示例](./examples)
