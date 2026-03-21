---
title: 账户管理
description: 在 PRX-Email 中创建、配置和管理邮件账户。支持多账户设置，每个账户独立的 IMAP/SMTP 配置。
---

# 账户管理

PRX-Email 支持多个邮件账户，每个账户拥有独立的 IMAP 和 SMTP 配置、认证凭据和功能标志。账户存储在 SQLite 数据库中，由唯一的 `account_id` 标识。

## 创建账户

使用 `EmailRepository` 创建新账户：

```rust
use prx_email::db::{EmailRepository, NewAccount};

let account_id = repo.create_account(&NewAccount {
    email: "alice@example.com".to_string(),
    display_name: Some("Alice".to_string()),
    now_ts: current_timestamp(),
})?;
```

### 账户字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `i64` | 自动生成的主键 |
| `email` | `String` | 邮件地址（用作 IMAP/SMTP 用户名） |
| `display_name` | `Option<String>` | 账户的显示名称 |
| `created_at` | `i64` | 创建时间（Unix 时间戳） |
| `updated_at` | `i64` | 最后更新时间（Unix 时间戳） |

## 获取账户

```rust
let account = repo.get_account(account_id)?;
if let Some(acct) = account {
    println!("邮箱: {}", acct.email);
    println!("名称: {}", acct.display_name.unwrap_or_default());
}
```

## 多账户设置

每个账户独立运作，拥有各自的：

- **IMAP 连接** —— 独立的服务器、端口和凭据
- **SMTP 连接** —— 独立的服务器、端口和凭据
- **文件夹** —— 每个账户同步的文件夹列表
- **同步状态** —— 每个账户/文件夹对的游标追踪
- **功能标志** —— 独立的功能启用控制
- **发件箱** —— 独立的发送队列，逐条消息追踪

```rust
// 账户 1：使用 OAuth 的 Gmail
let gmail_id = repo.create_account(&NewAccount {
    email: "alice@gmail.com".to_string(),
    display_name: Some("Alice (Gmail)".to_string()),
    now_ts: now,
})?;

// 账户 2：使用密码的工作邮箱
let work_id = repo.create_account(&NewAccount {
    email: "alice@company.com".to_string(),
    display_name: Some("Alice (工作)".to_string()),
    now_ts: now,
})?;
```

## 功能标志

PRX-Email 使用功能标志控制每个账户启用哪些功能。这支持新功能的分阶段灰度发布。

### 可用功能标志

| 标志 | 说明 |
|------|------|
| `inbox_read` | 允许列出和读取消息 |
| `inbox_search` | 允许搜索消息 |
| `email_send` | 允许发送新邮件 |
| `email_reply` | 允许回复邮件 |
| `outbox_retry` | 允许重试失败的发件箱消息 |

### 管理功能标志

```rust
// 为特定账户启用功能
plugin.set_account_feature(account_id, "email_send", true, now)?;

// 禁用功能
plugin.set_account_feature(account_id, "email_send", false, now)?;

// 设置所有账户的全局默认值
plugin.set_feature_default("inbox_read", true, now)?;

// 检查功能是否启用
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
```

### 百分比灰度发布

按百分比向账户灰度发布功能：

```rust
// 为 50% 的账户启用 email_send
let enabled = plugin.apply_percentage_rollout(
    account_id,
    "email_send",
    50,  // 百分比
    now,
)?;
println!("该账户是否启用: {}", enabled);
```

灰度使用 `account_id % 100` 确定性地将账户分配到桶中，确保跨重启的一致性行为。

## 文件夹管理

文件夹在 IMAP 同步期间自动创建，也可手动创建：

```rust
use prx_email::db::NewFolder;

let folder_id = repo.create_folder(&NewFolder {
    account_id,
    name: "INBOX".to_string(),
    path: "INBOX".to_string(),
    now_ts: now,
})?;
```

### 列出文件夹

```rust
let folders = repo.list_folders(account_id)?;
for folder in &folders {
    println!("{}: {} ({})", folder.id, folder.name, folder.path);
}
```

## 后续步骤

- [IMAP 配置](./imap) —— 设置 IMAP 服务器连接
- [SMTP 配置](./smtp) —— 配置 SMTP 发送流水线
- [OAuth 认证](./oauth) —— 为 Gmail 和 Outlook 设置 OAuth
