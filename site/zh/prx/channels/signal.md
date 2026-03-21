---
title: Signal 加密通讯
description: 将 PRX 连接到 Signal 消息平台
---

# Signal 加密通讯

> 通过 signal-cli 将 PRX 接入 Signal，支持原生模式（本地守护进程）和 REST 模式（外部 HTTP 服务）。

## 前置条件

- 一个已注册的 Signal 账号（需要手机号）
- [signal-cli](https://github.com/AsamK/signal-cli) 已安装并注册
- PRX 守护进程已运行

## 快速配置

### 1. 安装和注册 signal-cli

```bash
# 安装 signal-cli
# macOS
brew install signal-cli

# Linux (手动下载)
wget https://github.com/AsamK/signal-cli/releases/latest/download/signal-cli-linux-x86_64.tar.gz
tar xf signal-cli-linux-x86_64.tar.gz

# 注册账号
signal-cli -u +1234567890 register
signal-cli -u +1234567890 verify 123456
```

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中添加：

```toml
[channels_config.signal]
http_url = "http://127.0.0.1:16866"
account = "+1234567890"
mode = "native"
allowed_from = ["+0987654321"]
ignore_attachments = false
ignore_stories = true
```

### 3. 验证

```bash
prx channel doctor signal
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `http_url` | String | `"http://127.0.0.1:16866"` | signal-cli HTTP 守护进程 URL |
| `account` | String | 必填 | Signal 账号的 E.164 电话号码 |
| `mode` | String? | `"rest"` | 运行模式：`"native"`（本地启动）或 `"rest"`（外部服务） |
| `cli_path` | String? | `null` | signal-cli 二进制路径（仅 native 模式） |
| `data_dir` | String? | `null` | signal-cli 数据目录（仅 native 模式） |
| `daemon_http_port` | u16? | `16866` | signal-cli 守护进程 HTTP 端口（仅 native 模式） |
| `group_id` | String? | `null` | 群组 ID 过滤：`null` 接受全部，`"dm"` 仅私聊 |
| `allowed_from` | Vec\<String\> | `[]` | 允许的发送者电话号码（E.164）或 `"*"` 允许全部 |
| `ignore_attachments` | bool | `false` | 跳过仅含附件的消息 |
| `ignore_stories` | bool | `false` | 跳过 Story 消息 |

## 功能特性

- **端到端加密** — Signal 协议提供最高级别的消息加密
- **双模式运行** — 支持本地守护进程（native）和外部 REST API 两种模式
- **风暴防护** — 内置消息去重、速率限制和熔断机制，防止消息风暴
- **群聊支持** — 支持群组消息过滤

## 限制

- Signal 账号同一时间只能被一个 signal-cli 实例使用
- signal-cli 的 Java 运行时占用内存较大（约 200-500MB）
- 群组消息处理有延迟
- 附件大小受 Signal 服务端限制

## 故障排除

**signal-cli 无法连接**

1. 确认 signal-cli 正在运行：`curl http://127.0.0.1:16866/v1/about`
2. 检查 `account` 是否与注册的电话号码匹配
3. 如果使用 native 模式，检查 `cli_path` 是否正确

**收不到消息**

- 确认 `allowed_from` 中包含发送者的电话号码
- 检查是否 `group_id = "dm"` 导致群组消息被过滤
- 查看风暴防护是否触发了熔断
