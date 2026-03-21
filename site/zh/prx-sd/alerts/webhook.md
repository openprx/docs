---
title: Webhook 告警
description: 为 PRX-SD 配置 webhook 通知，在检测到威胁、文件隔离和扫描完成时发送告警。
---

# Webhook 告警

PRX-SD 可以在检测到威胁、文件被隔离或扫描完成时向 webhook 端点发送实时通知。Webhook 支持与 Slack、Discord、Microsoft Teams、PagerDuty 或任何自定义 HTTP 端点集成。

## 用法

```bash
sd webhook <SUBCOMMAND> [OPTIONS]
```

### 子命令

| 子命令 | 说明 |
|--------|------|
| `add` | 注册新的 webhook 端点 |
| `remove` | 移除已注册的 webhook |
| `list` | 列出所有已注册的 webhook |
| `test` | 向 webhook 发送测试通知 |

## 添加 Webhook

```bash
sd webhook add [OPTIONS] <URL>
```

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--format` | `-f` | `generic` | 载荷格式：`slack`、`discord`、`teams`、`generic` |
| `--name` | `-n` | 自动 | 该 webhook 的可读名称 |
| `--events` | `-e` | all | 触发通知的事件，逗号分隔 |
| `--secret` | `-s` | | 用于载荷验证的 HMAC-SHA256 签名密钥 |
| `--min-severity` | | `suspicious` | 触发通知的最低严重级别：`suspicious`、`malicious` |

### 支持的事件

| 事件 | 说明 |
|------|------|
| `threat_detected` | 发现恶意或可疑文件 |
| `file_quarantined` | 文件已被移入隔离区 |
| `scan_completed` | 扫描任务完成 |
| `update_completed` | 签名更新完成 |
| `ransomware_alert` | 检测到勒索软件行为 |
| `daemon_status` | 守护进程启动、停止或遇到错误 |

### 示例

```bash
# 添加 Slack webhook
sd webhook add --format slack --name "security-alerts" \
  "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"

# 添加 Discord webhook
sd webhook add --format discord --name "av-alerts" \
  "https://discord.com/api/webhooks/1234567890/abcdefg"

# 添加带 HMAC 签名的通用 webhook
sd webhook add --format generic --secret "my-signing-secret" \
  --name "siem-ingest" "https://siem.example.com/api/v1/alerts"

# 添加仅针对恶意告警的 webhook
sd webhook add --format slack --min-severity malicious \
  --events threat_detected,ransomware_alert \
  "https://hooks.slack.com/services/T00000/B00000/CRITICAL"
```

## 列出 Webhook

```bash
sd webhook list
```

```
Registered Webhooks (3)

Name              Format    Events              Min Severity  URL
security-alerts   slack     all                 suspicious    https://hooks.slack.com/...XXXX
av-alerts         discord   all                 suspicious    https://discord.com/...defg
siem-ingest       generic   all                 suspicious    https://siem.example.com/...
```

## 移除 Webhook

```bash
# 按名称移除
sd webhook remove security-alerts

# 按 URL 移除
sd webhook remove "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
```

## 测试 Webhook

发送测试通知以验证连接性：

```bash
# 测试指定 webhook
sd webhook test security-alerts

# 测试所有 webhook
sd webhook test --all
```

测试会发送一个示例威胁检测载荷，便于你验证格式和投递是否正常。

## 载荷格式

### 通用格式

默认的 `generic` 格式通过 HTTP POST 发送 JSON 载荷：

```json
{
  "event": "threat_detected",
  "timestamp": "2026-03-21T10:15:32Z",
  "hostname": "web-server-01",
  "threat": {
    "file": "/tmp/payload.exe",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
    "size": 245760,
    "severity": "malicious",
    "detection": {
      "engine": "yara",
      "rule": "Win_Trojan_AgentTesla",
      "source": "neo23x0/signature-base"
    }
  },
  "action_taken": "quarantined",
  "quarantine_id": "a1b2c3d4"
}
```

通用载荷包含的 HTTP 头：

```
Content-Type: application/json
User-Agent: PRX-SD/1.0
X-PRX-SD-Event: threat_detected
X-PRX-SD-Signature: sha256=<HMAC signature>  (如配置了密钥)
```

### Slack 格式

Slack webhook 接收带有按严重级别着色的格式化消息：

```json
{
  "attachments": [{
    "color": "#ff0000",
    "title": "Threat Detected: Win_Trojan_AgentTesla",
    "fields": [
      {"title": "File", "value": "/tmp/payload.exe", "short": false},
      {"title": "Severity", "value": "MALICIOUS", "short": true},
      {"title": "Action", "value": "Quarantined", "short": true},
      {"title": "Host", "value": "web-server-01", "short": true},
      {"title": "SHA-256", "value": "`e3b0c44298fc...`", "short": false}
    ],
    "ts": 1742554532
  }]
}
```

### Discord 格式

Discord webhook 使用 embeds 格式：

```json
{
  "embeds": [{
    "title": "Threat Detected",
    "description": "**Win_Trojan_AgentTesla** found in `/tmp/payload.exe`",
    "color": 16711680,
    "fields": [
      {"name": "Severity", "value": "MALICIOUS", "inline": true},
      {"name": "Action", "value": "Quarantined", "inline": true},
      {"name": "Host", "value": "web-server-01", "inline": true}
    ],
    "timestamp": "2026-03-21T10:15:32Z"
  }]
}
```

## 配置文件

也可以在 `~/.prx-sd/config.toml` 中配置 webhook：

```toml
[[webhook]]
name = "security-alerts"
url = "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
format = "slack"
events = ["threat_detected", "ransomware_alert", "file_quarantined"]
min_severity = "suspicious"

[[webhook]]
name = "siem-ingest"
url = "https://siem.example.com/api/v1/alerts"
format = "generic"
secret = "my-hmac-secret"
events = ["threat_detected"]
min_severity = "malicious"
```

::: tip
Webhook 密钥在配置文件中以加密形式存储。建议使用 `sd webhook add --secret` 安全设置密钥，而非直接编辑配置文件。
:::

## 重试机制

webhook 投递失败时采用指数退避重试：

| 重试次数 | 延迟 |
|----------|------|
| 第 1 次重试 | 5 秒 |
| 第 2 次重试 | 30 秒 |
| 第 3 次重试 | 5 分钟 |
| 第 4 次重试 | 30 分钟 |
| （放弃） | 事件记录为不可投递 |

## 后续步骤

- [邮件告警](./email) -- 邮件通知配置
- [定时扫描](./schedule) -- 设置定期扫描任务
- [威胁响应](/zh/prx-sd/remediation/) -- 配置自动修复策略
- [守护进程](/zh/prx-sd/realtime/daemon) -- 带告警功能的后台监控
