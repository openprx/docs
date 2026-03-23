---
title: WASM 插件
description: PRX-Email WASM 插件系统，用于在 PRX 运行时中沙箱执行。WIT 主机调用、网络安全开关和插件开发指南。
---

# WASM 插件

PRX-Email 包含一个 WASM 插件，将邮件客户端编译为 WebAssembly，在 PRX 运行时中沙箱执行。插件使用 WIT（WebAssembly Interface Types）定义主机调用接口，允许 WASM 托管代码调用邮件操作：sync、list、get、search、send 和 reply。

## 架构

```
PRX 运行时（宿主）
  |
  +-- WASM 插件 (prx-email-plugin)
        |
        +-- WIT 主机调用
        |     email.sync    --> 宿主 IMAP 同步
        |     email.list    --> 宿主收件箱列表
        |     email.get     --> 宿主消息获取
        |     email.search  --> 宿主收件箱搜索
        |     email.send    --> 宿主 SMTP 发送
        |     email.reply   --> 宿主 SMTP 回复
        |
        +-- email.execute   --> 分发器
              (转发到上述主机调用)
```

### 执行模型

当 WASM 插件调用 `email.execute` 时，插件将调用分发到对应的主机调用函数。宿主运行时处理实际的 IMAP/SMTP 操作，结果通过 WIT 接口返回。

## 网络安全开关

从 WASM 上下文执行的真实 IMAP/SMTP 操作**默认禁用**。这防止沙箱插件进行意外的网络连接。

### 启用网络操作

在启动 PRX 运行时前设置环境变量：

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### 禁用时的行为

| 操作 | 行为 |
|------|------|
| `email.sync` | 返回 `EMAIL_NETWORK_GUARD` 错误 |
| `email.send` | 返回 `EMAIL_NETWORK_GUARD` 错误 |
| `email.reply` | 返回 `EMAIL_NETWORK_GUARD` 错误 |
| `email.list` | 正常工作（从本地 SQLite 读取） |
| `email.get` | 正常工作（从本地 SQLite 读取） |
| `email.search` | 正常工作（从本地 SQLite 读取） |

::: tip
只读操作（list、get、search）始终可用，因为它们查询本地 SQLite 数据库，无需网络访问。只有需要 IMAP/SMTP 连接的操作才被控制。
:::

### 宿主能力不可用

当宿主运行时完全不提供邮件能力（非 WASM 执行路径）时，操作返回 `EMAIL_HOST_CAPABILITY_UNAVAILABLE`。

## 插件结构

```
wasm-plugin/
  Cargo.toml          # 插件 crate 配置
  plugin.toml         # 插件清单
  plugin.wasm         # 预编译的 WASM 二进制
  src/
    lib.rs            # 插件入口点和分发器
    bindings.rs       # WIT 生成的绑定
  wit/                # WIT 接口定义
    deps/
      prx-host/       # 宿主提供的接口
```

### Cargo 配置

```toml
[package]
name = "prx-email-plugin"
version = "0.1.0"
edition = "2024"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
wit-bindgen = { version = "0.51", features = ["macros"] }

[package.metadata.component]
package = "prx:plugin"

[package.metadata.component.target.dependencies]
"prx:host" = { path = "wit/deps/prx-host" }
```

## 构建插件

### 前置条件

- Rust 工具链
- `wasm32-wasip1` 目标

### 构建步骤

```bash
# 添加 WASM 目标
rustup target add wasm32-wasip1

# 构建插件
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### 使用构建脚本

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

## WIT 接口

插件通过 WIT 定义的接口与宿主通信。`prx:host` 包提供以下主机调用函数：

### 可用的主机调用

| 函数 | 说明 | 需要网络 |
|------|------|:--------:|
| `email.sync` | 同步账户/文件夹的 IMAP 收件箱 | 是 |
| `email.list` | 从本地数据库列出消息 | 否 |
| `email.get` | 按 ID 获取特定消息 | 否 |
| `email.search` | 按查询搜索消息 | 否 |
| `email.send` | 通过 SMTP 发送新邮件 | 是 |
| `email.reply` | 回复现有邮件 | 是 |

## 安全模型

| 约束 | 执行方式 |
|------|----------|
| 网络访问 | 默认禁用；需要 `PRX_EMAIL_ENABLE_REAL_NETWORK=1` |
| 文件系统访问 | WASM 无直接文件系统访问 |
| 内存 | 受 WASM 线性内存限制约束 |
| 执行时间 | 受燃料计量约束 |
| 令牌安全 | OAuth 令牌由宿主管理，不暴露给 WASM |

::: warning
WASM 插件无法直接访问 OAuth 令牌或凭据。所有认证由宿主运行时处理。插件只接收操作结果，永不接触原始凭据。
:::

## 后续步骤

- [安装](../getting-started/installation) —— WASM 插件的构建说明
- [配置参考](../configuration/) —— 网络安全开关和运行时设置
- [故障排除](../troubleshooting/) —— 插件相关问题
