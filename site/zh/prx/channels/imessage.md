---
title: iMessage (仅 macOS)
description: 将 PRX 连接到 Apple iMessage
---

# iMessage (仅 macOS)

> 通过 macOS 原生消息框架将 PRX 接入 iMessage，仅在 macOS 系统上可用。

## 前置条件

- macOS 系统（不支持 Linux 和 Windows）
- 已在系统设置中登录 Apple ID 并启用 iMessage
- PRX 守护进程已运行
- 需要授予 PRX 完全磁盘访问权限（用于读取消息数据库）

## 快速配置

### 1. 授予权限

在 **系统设置 > 隐私与安全性 > 完全磁盘访问权限** 中添加 PRX。

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中添加：

```toml
[channels_config.imessage]
allowed_contacts = ["+1234567890", "user@icloud.com"]
mention_only = false
```

### 3. 验证

```bash
prx channel doctor imessage
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `allowed_contacts` | Vec\<String\> | `[]`（拒绝全部） | 允许的联系人（电话号码或 email 地址） |
| `mention_only` | bool | `false` | 在群聊中是否只响应 @提及 |

## 功能特性

- **原生集成** — 直接使用 macOS Messages 框架，无需第三方工具
- **iMessage 和 SMS** — 支持 iMessage 和 SMS 消息
- **联系人过滤** — 通过电话号码或 email 地址控制访问

## 限制

- **仅 macOS** — 不支持其他操作系统
- 需要完全磁盘访问权限
- 群聊功能有限
- macOS 系统更新可能影响消息数据库格式

## 故障排除

**无法读取消息**

1. 确认 PRX 已获得完全磁盘访问权限
2. 检查 iMessage 是否已登录并能正常收发消息
3. 重启 PRX 守护进程

**联系人不在白名单中**

- 确认 `allowed_contacts` 中的格式正确（电话号码需要国际格式 `+1234567890`）
