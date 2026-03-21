---
title: 配置参考
description: PRX-Email 完整配置参考，包括传输设置、存储选项、附件策略、环境变量和运行时调优。
---

# 配置参考

本页是 PRX-Email 所有配置选项、环境变量和运行时设置的完整参考。

## 传输配置

`EmailTransportConfig` 结构体配置 IMAP 和 SMTP 连接：

```rust
use prx_email::plugin::{
    EmailTransportConfig, ImapConfig, SmtpConfig, AuthConfig,
    AttachmentPolicy, AttachmentStoreConfig,
};

let config = EmailTransportConfig {
    imap: ImapConfig { /* ... */ },
    smtp: SmtpConfig { /* ... */ },
    attachment_store: Some(AttachmentStoreConfig { /* ... */ }),
    attachment_policy: AttachmentPolicy::default(),
};
```

### IMAP 设置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `imap.host` | `String` | （必填） | IMAP 服务器主机名 |
| `imap.port` | `u16` | （必填） | IMAP 服务器端口（通常 993） |
| `imap.user` | `String` | （必填） | IMAP 用户名 |
| `imap.auth.password` | `Option<String>` | `None` | LOGIN 认证的密码 |
| `imap.auth.oauth_token` | `Option<String>` | `None` | XOAUTH2 的 OAuth 令牌 |

### SMTP 设置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `smtp.host` | `String` | （必填） | SMTP 服务器主机名 |
| `smtp.port` | `u16` | （必填） | SMTP 服务器端口（465 或 587） |
| `smtp.user` | `String` | （必填） | SMTP 用户名 |
| `smtp.auth.password` | `Option<String>` | `None` | PLAIN/LOGIN 的密码 |
| `smtp.auth.oauth_token` | `Option<String>` | `None` | XOAUTH2 的 OAuth 令牌 |

### 验证规则

- `imap.host` 和 `smtp.host` 不可为空
- `imap.user` 和 `smtp.user` 不可为空
- 每个协议必须且只能设置 `password` 或 `oauth_token` 之一
- `attachment_policy.max_size_bytes` 必须大于 0
- `attachment_policy.allowed_content_types` 不可为空

## 存储配置

### StoreConfig

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enable_wal` | `bool` | `true` | 启用 WAL 日志模式 |
| `busy_timeout_ms` | `u64` | `5000` | SQLite 忙等待超时（毫秒） |
| `wal_autocheckpoint_pages` | `i64` | `1000` | 自动检查点间隔页数 |
| `synchronous` | `SynchronousMode` | `Normal` | 同步模式：`Full`、`Normal` 或 `Off` |

## 附件策略

### AttachmentPolicy

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `max_size_bytes` | `usize` | `26,214,400`（25 MiB） | 最大附件大小 |
| `allowed_content_types` | `HashSet<String>` | 见下方 | 允许的 MIME 类型 |

### 默认允许的 MIME 类型

| MIME 类型 | 说明 |
|-----------|------|
| `application/pdf` | PDF 文档 |
| `image/jpeg` | JPEG 图片 |
| `image/png` | PNG 图片 |
| `text/plain` | 纯文本文件 |
| `application/zip` | ZIP 压缩包 |

### AttachmentStoreConfig

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `bool` | （必填） | 启用附件持久化 |
| `dir` | `String` | （必填） | 附件存储根目录 |

::: warning 路径安全
附件路径经过目录遍历攻击验证。任何解析到配置 `dir` 根目录外的路径都会被拒绝，包括基于符号链接的逃逸。
:::

## 同步调度器配置

### SyncRunnerConfig

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `max_concurrency` | `usize` | `4` | 每个调度周期最大作业数 |
| `base_backoff_seconds` | `i64` | `10` | 失败时初始退避 |
| `max_backoff_seconds` | `i64` | `300` | 最大退避（5 分钟） |

## 环境变量

### OAuth 令牌管理

| 变量 | 说明 |
|------|------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | IMAP OAuth 访问令牌 |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | SMTP OAuth 访问令牌 |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | IMAP 令牌过期时间（Unix 秒） |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | SMTP 令牌过期时间（Unix 秒） |

默认前缀为 `PRX_EMAIL`。使用 `reload_auth_from_env("PRX_EMAIL")` 在运行时加载。

### WASM 插件

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PRX_EMAIL_ENABLE_REAL_NETWORK` | 未设置（禁用） | 设置为 `1` 启用 WASM 上下文中的真实 IMAP/SMTP |

## API 限制

| 限制 | 值 | 说明 |
|------|-----|------|
| 列表/搜索最小 limit | 1 | `limit` 参数最小值 |
| 列表/搜索最大 limit | 500 | `limit` 参数最大值 |
| 调试消息截断 | 160 字符 | 提供商调试消息被截断 |
| 消息摘要长度 | 120 字符 | 自动生成的消息摘要 |

## 错误码

| 码 | 说明 |
|----|------|
| `Validation` | 输入验证失败（空字段、超范围限制、未知功能） |
| `FeatureDisabled` | 操作被功能标志阻止 |
| `Network` | IMAP/SMTP 连接或协议错误 |
| `Provider` | 邮件提供商拒绝操作 |
| `Storage` | SQLite 数据库错误 |

## 发件箱常量

| 常量 | 值 | 说明 |
|------|-----|------|
| 退避基数 | 5 秒 | 初始重试退避 |
| 退避公式 | `5 * 2^retries` | 指数增长 |
| 最大重试次数 | 无上限 | 受退避增长限制 |
| 幂等键 | `outbox-{id}-{retries}` | 确定性 Message-ID |

## 功能标志

| 标志 | 说明 | 风险级别 |
|------|------|----------|
| `inbox_read` | 列出和获取消息 | 低 |
| `inbox_search` | 按查询搜索消息 | 低 |
| `email_send` | 发送新邮件 | 中 |
| `email_reply` | 回复现有邮件 | 中 |
| `outbox_retry` | 重试失败的发件箱消息 | 低 |

## 日志

PRX-Email 以以下格式输出结构化日志到 stderr：

```
[prx_email][structured] {"event":"...","account":...,"folder":...,"message_id":...,"run_id":...,"error_code":...}
[prx_email][debug] context | details
```

### 安全性

- OAuth 令牌、密码和 API 密钥**永不记录**
- 邮件地址在调试日志中被脱敏（如 `a***@example.com`）
- 提供商调试消息被清理：授权头部被编辑，输出截断到 160 字符

## 后续步骤

- [安装](../getting-started/installation) —— 设置 PRX-Email
- [账户管理](../accounts/) —— 配置账户和功能
- [故障排除](../troubleshooting/) —— 解决配置问题
