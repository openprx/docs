---
title: 快速上手
description: 设置 PRX-Email、创建第一个账户、同步收件箱并在 5 分钟内发送第一封邮件。
---

# 快速上手

本指南将带你在 5 分钟内从零开始完成邮件配置。完成后你将拥有一个已配置的 PRX-Email 账户、已同步的收件箱和已发送的测试邮件。

::: tip 前置条件
需要安装 Rust 1.85+。构建依赖请参阅[安装指南](./installation)。
:::

## 第一步：添加 PRX-Email 到项目

创建新的 Rust 项目或添加到现有项目：

```bash
cargo new my-email-app
cd my-email-app
```

在 `Cargo.toml` 中添加依赖：

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

## 第二步：初始化数据库

PRX-Email 使用 SQLite 进行所有持久化。打开存储并运行迁移：

```rust
use prx_email::db::{EmailStore, EmailRepository, NewAccount};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 打开（或创建）SQLite 数据库文件
    let store = EmailStore::open("./email.db")?;

    // 运行迁移以创建所有表
    store.migrate()?;

    // 创建数据库操作的仓库
    let repo = EmailRepository::new(&store);

    println!("数据库初始化成功。");
    Ok(())
}
```

数据库默认启用 WAL 模式、外键约束和 5 秒忙等待超时。

## 第三步：创建邮件账户

```rust
let now = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)?
    .as_secs() as i64;

let account_id = repo.create_account(&NewAccount {
    email: "you@example.com".to_string(),
    display_name: Some("你的名字".to_string()),
    now_ts: now,
})?;

println!("创建账户 ID: {}", account_id);
```

## 第四步：配置传输并创建插件

```rust
use prx_email::plugin::{
    EmailPlugin, EmailTransportConfig, ImapConfig, SmtpConfig,
    AuthConfig, AttachmentPolicy,
};

let config = EmailTransportConfig {
    imap: ImapConfig {
        host: "imap.example.com".to_string(),
        port: 993,
        user: "you@example.com".to_string(),
        auth: AuthConfig {
            password: Some("your-app-password".to_string()),
            oauth_token: None,
        },
    },
    smtp: SmtpConfig {
        host: "smtp.example.com".to_string(),
        port: 465,
        user: "you@example.com".to_string(),
        auth: AuthConfig {
            password: Some("your-app-password".to_string()),
            oauth_token: None,
        },
    },
    attachment_store: None,
    attachment_policy: AttachmentPolicy::default(),
};

let plugin = EmailPlugin::new_with_config(repo, config);
```

## 第五步：同步收件箱

```rust
use prx_email::plugin::SyncRequest;

let result = plugin.sync(SyncRequest {
    account_id,
    folder: Some("INBOX".to_string()),
    cursor: None,
    now_ts: now,
    max_messages: 50,
});

match result {
    Ok(()) => println!("收件箱同步成功。"),
    Err(e) => eprintln!("同步失败: {:?}", e),
}
```

## 第六步：列出消息

```rust
use prx_email::plugin::ListMessagesRequest;

let messages = plugin.list(ListMessagesRequest {
    account_id,
    limit: 10,
})?;

for msg in &messages {
    println!(
        "[{}] {} - {}",
        msg.message_id,
        msg.sender.as_deref().unwrap_or("未知"),
        msg.subject.as_deref().unwrap_or("(无主题)"),
    );
}
```

## 第七步：发送邮件

```rust
use prx_email::plugin::SendEmailRequest;

let response = plugin.send(SendEmailRequest {
    account_id,
    to: "recipient@example.com".to_string(),
    subject: "来自 PRX-Email 的问候".to_string(),
    body_text: "这是通过 PRX-Email 发送的测试邮件。".to_string(),
    now_ts: now,
    attachment: None,
    failure_mode: None,
});

if response.ok {
    let result = response.data.as_ref().unwrap();
    println!("已发送！发件箱 ID: {}, 状态: {}", result.outbox_id, result.status);
} else {
    let error = response.error.as_ref().unwrap();
    eprintln!("发送失败: {:?} - {}", error.code, error.message);
}
```

## 第八步：检查指标

```rust
let metrics = plugin.metrics_snapshot();
println!("同步尝试: {}", metrics.sync_attempts);
println!("同步成功: {}", metrics.sync_success);
println!("同步失败: {}", metrics.sync_failures);
println!("发送失败: {}", metrics.send_failures);
println!("重试次数: {}", metrics.retry_count);
```

## 完成后的状态

完成以上步骤后，你的应用具备：

| 组件 | 状态 |
|------|------|
| SQLite 数据库 | 已初始化完整 schema |
| 邮件账户 | 已创建并配置 |
| IMAP 同步 | 已连接并拉取消息 |
| SMTP 发件箱 | 已就绪，带原子发送流水线 |
| 指标 | 追踪同步和发送操作 |

## 常见邮件提供商设置

| 提供商 | IMAP 主机 | IMAP 端口 | SMTP 主机 | SMTP 端口 | 认证方式 |
|--------|-----------|-----------|-----------|-----------|----------|
| Gmail | `imap.gmail.com` | 993 | `smtp.gmail.com` | 465 | 应用密码或 OAuth |
| Outlook | `outlook.office365.com` | 993 | `smtp.office365.com` | 587 | OAuth（推荐） |
| Yahoo | `imap.mail.yahoo.com` | 993 | `smtp.mail.yahoo.com` | 465 | 应用密码 |
| Fastmail | `imap.fastmail.com` | 993 | `smtp.fastmail.com` | 465 | 应用密码 |

::: warning Gmail
Gmail 要求使用**应用密码**（需开启两步验证）或 **OAuth 2.0**。普通密码无法用于 IMAP/SMTP。设置说明请参阅 [OAuth 指南](../accounts/oauth)。
:::

## 后续步骤

- [IMAP 配置](../accounts/imap) —— 高级 IMAP 设置和多文件夹同步
- [SMTP 配置](../accounts/smtp) —— 发件箱流水线、重试逻辑和附件处理
- [OAuth 认证](../accounts/oauth) —— 为 Gmail 和 Outlook 设置 OAuth
- [SQLite 存储](../storage/) —— 数据库调优和容量规划
