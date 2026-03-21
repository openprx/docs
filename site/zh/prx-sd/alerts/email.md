---
title: 邮件告警
description: 为 PRX-SD 配置邮件通知，在检测到威胁和扫描完成时发送告警。
---

# 邮件告警

PRX-SD 可以在检测到威胁、扫描完成或发生关键事件时发送邮件通知。邮件告警是对 webhook 的补充，适用于以邮件为主要通信渠道的环境，或需要通知值班人员的场景。

## 用法

```bash
sd email-alert <SUBCOMMAND> [OPTIONS]
```

### 子命令

| 子命令 | 说明 |
|--------|------|
| `configure` | 设置 SMTP 服务器和收件人 |
| `test` | 发送测试邮件以验证配置 |
| `send` | 手动发送告警邮件 |
| `status` | 显示当前邮件配置状态 |

## 配置邮件

### 交互式设置

```bash
sd email-alert configure
```

交互式向导会提示输入：

```
SMTP Server: smtp.gmail.com
SMTP Port [587]: 587
Use TLS [yes]: yes
Username: alerts@example.com
Password: ********
From Address [alerts@example.com]: prx-sd@example.com
From Name [PRX-SD]: PRX-SD Scanner
Recipients (comma-separated): security@example.com, oncall@example.com
Min Severity [suspicious]: malicious
```

### 命令行配置

```bash
sd email-alert configure \
  --smtp-server smtp.gmail.com \
  --smtp-port 587 \
  --tls true \
  --username alerts@example.com \
  --password "app-password-here" \
  --from "prx-sd@example.com" \
  --from-name "PRX-SD Scanner" \
  --to "security@example.com,oncall@example.com" \
  --min-severity malicious
```

### 配置文件

邮件设置存储在 `~/.prx-sd/config.toml` 中：

```toml
[email]
enabled = true
min_severity = "malicious"    # suspicious | malicious
events = ["threat_detected", "ransomware_alert", "scan_completed"]

[email.smtp]
server = "smtp.gmail.com"
port = 587
tls = true
username = "alerts@example.com"
# 密码以加密形式存储 - 请使用 'sd email-alert configure' 设置

[email.message]
from_address = "prx-sd@example.com"
from_name = "PRX-SD Scanner"
recipients = ["security@example.com", "oncall@example.com"]
subject_prefix = "[PRX-SD]"
```

::: tip
对于 Gmail，请使用应用专用密码而非账户密码。前往 Google 账号 > 安全性 > 两步验证 > 应用专用密码生成。
:::

## 测试邮件

发送测试邮件以验证配置：

```bash
sd email-alert test
```

```
Sending test email to security@example.com, oncall@example.com...
  SMTP connection:  OK (smtp.gmail.com:587, TLS)
  Authentication:   OK
  Delivery:         OK (Message-ID: <prx-sd-test-a1b2c3@example.com>)

Test email sent successfully.
```

## 手动发送告警

手动触发告警邮件（适用于测试集成或转发检测结果）：

```bash
# 发送关于特定文件的告警
sd email-alert send --file /tmp/suspicious_file --severity malicious \
  --message "Found during incident response investigation"

# 发送扫描摘要
sd email-alert send --scan-report /tmp/scan-results.json
```

## 邮件内容

### 威胁检测邮件

```
Subject: [PRX-SD] MALICIOUS: Win_Trojan_AgentTesla detected on web-server-01

PRX-SD Threat Detection Alert
==============================

Host:       web-server-01
Timestamp:  2026-03-21 10:15:32 UTC
Severity:   MALICIOUS

File:       /tmp/payload.exe
SHA-256:    e3b0c44298fc1c149afbf4c8996fb924...
Size:       240 KB
Type:       PE32 executable (GUI) Intel 80386, for MS Windows

Detection:  Win_Trojan_AgentTesla
Engine:     YARA (neo23x0/signature-base)

Action Taken: Quarantined (ID: a1b2c3d4)

---
PRX-SD Antivirus Engine | https://openprx.dev/prx-sd
```

### 扫描摘要邮件

```
Subject: [PRX-SD] Scan Complete: 3 threats found in /home

PRX-SD Scan Report
===================

Host:           web-server-01
Scan Path:      /home
Started:        2026-03-21 10:00:00 UTC
Completed:      2026-03-21 10:12:45 UTC
Duration:       12 minutes 45 seconds

Files Scanned:  45,231
Threats Found:  3

Detections:
  1. /home/user/downloads/crack.exe
     Severity: MALICIOUS | Detection: Win_Trojan_Agent
     Action: Quarantined

  2. /home/user/.cache/tmp/loader.sh
     Severity: MALICIOUS | Detection: Linux_Backdoor_Generic
     Action: Quarantined

  3. /home/user/scripts/util.py
     Severity: SUSPICIOUS | Detection: Heuristic_HighEntropy
     Action: Reported

---
PRX-SD Antivirus Engine | https://openprx.dev/prx-sd
```

## 支持的事件

| 事件 | 默认包含 | 说明 |
|------|----------|------|
| `threat_detected` | 是 | 发现恶意或可疑文件 |
| `ransomware_alert` | 是 | 检测到勒索软件行为 |
| `scan_completed` | 否 | 扫描任务完成（仅在发现威胁时） |
| `update_completed` | 否 | 签名更新完成 |
| `update_failed` | 是 | 签名更新失败 |
| `daemon_error` | 是 | 守护进程遇到严重错误 |

配置触发邮件的事件：

```toml
[email]
events = ["threat_detected", "ransomware_alert", "daemon_error"]
```

## 频率限制

防止大规模爆发时邮件泛滥：

```toml
[email.rate_limit]
max_per_hour = 10            # 每小时最大邮件数
digest_mode = true           # 将多个告警合并为一封摘要邮件
digest_interval_mins = 15    # 摘要批处理窗口
```

启用 `digest_mode` 后，同一时间窗口内的告警会合并为一封摘要邮件，而非逐条发送单独通知。

## 查看状态

```bash
sd email-alert status
```

```
Email Alert Status
  Enabled:      true
  SMTP Server:  smtp.gmail.com:587 (TLS)
  From:         prx-sd@example.com
  Recipients:   security@example.com, oncall@example.com
  Min Severity: malicious
  Events:       threat_detected, ransomware_alert, daemon_error
  Last Sent:    2026-03-21 10:15:32 UTC
  Emails Today: 2
```

## 后续步骤

- [Webhook 告警](./webhook) -- 实时 webhook 通知
- [定时扫描](./schedule) -- 自动化定期扫描
- [威胁响应](/zh/prx-sd/remediation/) -- 自动修复策略
- [守护进程](/zh/prx-sd/realtime/daemon) -- 带告警功能的后台防护
