---
title: 安装
description: 从源码安装 PRX-Email、添加为 Cargo 依赖或编译 WASM 插件以集成 PRX 运行时。
---

# 安装

PRX-Email 可用作 Rust 库依赖、从源码构建独立使用，或编译为 WASM 插件用于 PRX 运行时。

::: tip 推荐方式
对大多数用户来说，将 PRX-Email 添加为 **Cargo 依赖** 是将邮件功能集成到 Rust 项目中最快的方式。
:::

## 前置条件

| 需求 | 最低版本 | 备注 |
|------|---------|------|
| Rust | 1.85.0（2024 edition） | 所有安装方式都需要 |
| Git | 2.30+ | 用于克隆仓库 |
| SQLite | 内置 | 通过 `rusqlite` bundled 特性包含，无需系统 SQLite |
| `wasm32-wasip1` 目标 | 最新 | 仅 WASM 插件编译时需要 |

## 方式一：Cargo 依赖（推荐）

在项目的 `Cargo.toml` 中添加 PRX-Email：

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

这会拉取库及所有依赖，包括 `rusqlite`（内置 SQLite）、`imap`、`lettre` 和 `mail-parser`。

::: warning 构建依赖
`rusqlite` 的 bundled 特性从 C 源码编译 SQLite。在 Debian/Ubuntu 上可能需要：
```bash
sudo apt install -y build-essential pkg-config
```
在 macOS 上需要 Xcode 命令行工具：
```bash
xcode-select --install
```
:::

## 方式二：从源码构建

克隆仓库并以 release 模式构建：

```bash
git clone https://github.com/openprx/prx_email.git
cd prx_email
cargo build --release
```

运行测试套件验证一切正常：

```bash
cargo test
```

运行 clippy 进行 lint 检查：

```bash
cargo clippy -- -D warnings
```

## 方式三：WASM 插件

WASM 插件允许 PRX-Email 作为沙箱化 WebAssembly 模块在 PRX 运行时中运行。插件使用 WIT（WebAssembly Interface Types）定义主机调用接口。

### 构建 WASM 插件

```bash
cd prx_email

# 添加 WASM 目标
rustup target add wasm32-wasip1

# 构建插件
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

编译后的插件位于 `wasm-plugin/target/wasm32-wasip1/release/prx_email_plugin.wasm`。

也可使用构建脚本：

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

### 网络安全开关

默认情况下，WASM 插件以**禁用真实网络操作**的方式运行。要从 WASM 上下文启用实际的 IMAP/SMTP 连接：

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

禁用时，网络相关操作（`email.sync`、`email.send`、`email.reply`）返回带防护提示的受控错误。这是防止沙箱插件意外网络访问的安全措施。

## 依赖项

PRX-Email 使用以下关键依赖：

| Crate | 版本 | 用途 |
|-------|------|------|
| `rusqlite` | 0.31 | 内置 C 编译的 SQLite 数据库 |
| `imap` | 2.4 | IMAP 客户端用于收件箱同步 |
| `lettre` | 0.11 | SMTP 客户端用于发送邮件 |
| `mail-parser` | 0.10 | MIME 消息解析 |
| `rustls` | 0.23 | IMAP 连接的 TLS |
| `rustls-connector` | 0.20 | TLS 流封装 |
| `serde` / `serde_json` | 1.0 | 模型和 API 响应的序列化 |
| `sha2` | 0.10 | 备用 Message-ID 的 SHA-256 |
| `base64` | 0.22 | 附件的 Base64 编码 |
| `thiserror` | 1.0 | 错误类型派生 |

所有 TLS 连接使用 `rustls`（纯 Rust）——没有 OpenSSL 依赖。

## 验证安装

构建后验证库能正确编译和通过测试：

```bash
cargo check
cargo test
```

预期输出：

```
running 7 tests
test plugin::email_plugin::tests::parse_mime_extracts_text_html_and_attachments ... ok
test plugin::email_plugin::tests::references_chain_appends_parent_message_id ... ok
test plugin::email_plugin::tests::reply_sets_in_reply_to_header_on_outbox ... ok
test plugin::email_plugin::tests::parse_mime_fallback_message_id_is_stable_and_unique ... ok
test plugin::email_plugin::tests::list_search_reject_out_of_range_limit ... ok
test plugin::email_plugin::tests::run_sync_runner_respects_max_concurrency_cap ... ok
test plugin::email_plugin::tests::reload_auth_from_env_updates_tokens ... ok

test result: ok. 7 passed; 0 failed; 0 ignored
```

## 后续步骤

- [快速上手](./quickstart) —— 设置第一个邮件账户并发送消息
- [账户管理](../accounts/) —— 配置 IMAP、SMTP 和 OAuth
- [WASM 插件](../plugins/) —— 了解 WASM 插件接口
