---
title: 威胁响应
description: 配置自动威胁修复，包括响应策略、持久化清理和网络隔离。
---

# 威胁响应

PRX-SD 的修复引擎提供超越简单检测的自动化威胁响应能力。当识别到威胁时，引擎可以根据配置的策略采取从日志记录到完全网络隔离的逐级响应措施。

## 响应类型

| 动作 | 说明 | 可逆 | 需要 Root |
|------|------|------|-----------|
| **Report** | 记录检测结果并继续，不对文件采取任何操作。 | 不适用 | 否 |
| **Quarantine** | 加密文件并移入隔离保险库。 | 是 | 否 |
| **Block** | 通过 fanotify 拒绝文件访问/执行（仅限 Linux 实时监控）。 | 是 | 是 |
| **Kill** | 终止创建或正在使用恶意文件的进程。 | 否 | 是 |
| **Clean** | 从文件中移除恶意内容但保留原文件（如从 Office 文档中移除宏）。 | 部分 | 否 |
| **Delete** | 从磁盘永久删除恶意文件。 | 否 | 否 |
| **Isolate** | 使用防火墙规则阻断该机器的所有网络访问。 | 是 | 是 |
| **Blocklist** | 将文件哈希添加到本地黑名单供后续扫描使用。 | 是 | 否 |

## 策略配置

### 使用 sd policy 命令

```bash
# 查看当前策略
sd policy show

# 设置恶意检测的响应策略
sd policy set on_malicious quarantine

# 设置可疑检测的响应策略
sd policy set on_suspicious report

# 重置为默认值
sd policy reset
```

### 输出示例

```bash
sd policy show
```

```
Threat Response Policy
  on_malicious:    quarantine
  on_suspicious:   report
  blocklist_auto:  true
  notify_webhook:  true
  notify_email:    false
  clean_persistence: true
  network_isolate:   false
```

### 配置文件

在 `~/.prx-sd/config.toml` 中设置策略：

```toml
[policy]
on_malicious = "quarantine"     # report | quarantine | block | kill | clean | delete
on_suspicious = "report"        # report | quarantine | block
blocklist_auto = true           # 自动将恶意哈希添加到本地黑名单
clean_persistence = true        # 检测到恶意软件时清理持久化机制
network_isolate = false         # 对严重威胁启用网络隔离

[policy.notify]
webhook = true
email = false

[policy.escalation]
# 同一威胁再次出现时升级为更强的响应措施
enabled = true
max_reappearances = 3
escalate_to = "delete"
```

::: tip
`on_malicious` 和 `on_suspicious` 策略接受不同的动作集。`kill` 和 `delete` 等破坏性动作仅适用于 `on_malicious`。
:::

## 持久化清理

启用 `clean_persistence` 后，PRX-SD 会扫描并移除恶意软件可能安装的持久化机制。此操作在隔离或删除威胁后自动执行。

### Linux 持久化点

| 位置 | 技术手段 | 清理操作 |
|------|----------|----------|
| `/etc/cron.d/`、`/var/spool/cron/` | Cron 任务 | 移除恶意 cron 条目 |
| `/etc/systemd/system/` | systemd 服务 | 禁用并移除恶意单元 |
| `~/.config/systemd/user/` | 用户 systemd 服务 | 禁用并移除 |
| `~/.bashrc`、`~/.profile` | Shell RC 注入 | 移除注入的行 |
| `~/.ssh/authorized_keys` | SSH 后门密钥 | 移除未授权的密钥 |
| `/etc/ld.so.preload` | LD_PRELOAD 劫持 | 移除恶意预加载条目 |
| `/etc/init.d/` | SysV 初始化脚本 | 移除恶意脚本 |

### macOS 持久化点

| 位置 | 技术手段 | 清理操作 |
|------|----------|----------|
| `~/Library/LaunchAgents/` | LaunchAgent plist | 卸载并移除 |
| `/Library/LaunchDaemons/` | LaunchDaemon plist | 卸载并移除 |
| `~/Library/Application Support/` | 登录项 | 移除恶意项目 |
| `/Library/StartupItems/` | 启动项 | 移除 |
| `~/.zshrc`、`~/.bash_profile` | Shell RC 注入 | 移除注入的行 |
| Keychain | Keychain 滥用 | 告警（不自动清理） |

### Windows 持久化点

| 位置 | 技术手段 | 清理操作 |
|------|----------|----------|
| `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` | 注册表 Run 键 | 移除恶意值 |
| `HKLM\SYSTEM\CurrentControlSet\Services` | 恶意服务 | 停止、禁用并移除 |
| `Startup` 文件夹 | 启动快捷方式 | 移除恶意快捷方式 |
| Task Scheduler | 计划任务 | 删除恶意任务 |
| WMI Subscriptions | WMI 事件消费者 | 移除恶意订阅 |

::: warning
持久化清理会修改系统配置文件和注册表项。每次操作后请检查 `~/.prx-sd/remediation.log` 中的清理日志，确认仅移除了恶意条目。
:::

## 网络隔离

对于严重威胁（活跃勒索软件、数据外泄），PRX-SD 可以将机器从网络中隔离：

### Linux (iptables)

```bash
# PRX-SD 在隔离时自动添加这些规则
iptables -I OUTPUT -j DROP
iptables -I INPUT -j DROP
iptables -I OUTPUT -d 127.0.0.1 -j ACCEPT
iptables -I INPUT -s 127.0.0.1 -j ACCEPT
```

### macOS (pf)

```bash
# PRX-SD 配置 pf 规则
echo "block all" | pfctl -f -
echo "pass on lo0" | pfctl -f -
pfctl -e
```

解除隔离：

```bash
sd isolate lift
```

::: warning
网络隔离会阻断所有网络流量，包括 SSH。在启用自动网络隔离前，请确保有物理或带外控制台访问方式。
:::

## 修复日志

所有修复操作都记录在 `~/.prx-sd/remediation.log` 中：

```json
{
  "timestamp": "2026-03-21T10:15:32Z",
  "threat_id": "a1b2c3d4",
  "file": "/tmp/payload.exe",
  "detection": "Win_Trojan_AgentTesla",
  "severity": "malicious",
  "actions_taken": [
    {"action": "quarantine", "status": "success"},
    {"action": "blocklist", "status": "success"},
    {"action": "clean_persistence", "status": "success", "items_removed": 2}
  ]
}
```

## 示例

```bash
# 为服务器设置激进策略
sd policy set on_malicious kill
sd policy set on_suspicious quarantine

# 为工作站设置保守策略
sd policy set on_malicious quarantine
sd policy set on_suspicious report

# 扫描时指定修复方式
sd scan /tmp --on-malicious delete --on-suspicious quarantine

# 检查并解除网络隔离
sd isolate status
sd isolate lift

# 查看修复历史
sd remediation log --last 50
sd remediation log --json > remediation_export.json
```

## 后续步骤

- [隔离区管理](/zh/prx-sd/quarantine/) -- 管理隔离文件
- [勒索软件防护](/zh/prx-sd/realtime/ransomware) -- 专项勒索软件响应
- [Webhook 告警](/zh/prx-sd/alerts/webhook) -- 修复操作通知
- [邮件告警](/zh/prx-sd/alerts/email) -- 威胁邮件通知
