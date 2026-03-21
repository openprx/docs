---
title: CLI 命令参考
description: 全部 27 个 sd CLI 子命令的完整参考，按类别组织，包含全局选项和快速使用示例。
---

# CLI 命令参考

`sd` 命令行界面提供 27 个子命令，分为 10 个类别。本页作为快速参考索引，每个命令都链接到其详细文档页面（如有）。

## 全局选项

以下参数可用于任意子命令：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--log-level <LEVEL>` | `warn` | 日志详细程度：`trace`、`debug`、`info`、`warn`、`error` |
| `--data-dir <PATH>` | `~/.prx-sd` | 签名、隔离区、配置和插件的基础数据目录 |
| `--help` | -- | 显示任意命令或子命令的帮助 |
| `--version` | -- | 显示引擎版本 |

```bash
# 启用调试日志
sd --log-level debug scan /tmp

# 使用自定义数据目录
sd --data-dir /opt/prx-sd scan /home
```

## 扫描

按需文件和系统扫描命令。

| 命令 | 说明 |
|------|------|
| `sd scan <PATH>` | 扫描文件或目录以检测威胁 |
| `sd scan-memory` | 扫描运行中的进程内存（仅 Linux，需要 root） |
| `sd scan-usb [DEVICE]` | 扫描 USB/可移动设备 |
| `sd check-rootkit` | 检查 rootkit 指标（仅 Linux） |

```bash
# 递归扫描目录并自动隔离
sd scan /home --auto-quarantine

# 以 JSON 格式输出，便于自动化处理
sd scan /tmp --json

# 使用 4 线程扫描并生成 HTML 报告
sd scan /var --threads 4 --report /tmp/report.html

# 排除特定模式
sd scan /home --exclude "*.log" --exclude "/home/user/.cache"

# 扫描并自动修复（终止进程、隔离、清理持久化）
sd scan /tmp --remediate

# 扫描进程内存
sudo sd scan-memory
sudo sd scan-memory --pid 1234

# 扫描 USB 设备
sd scan-usb
sd scan-usb /dev/sdb1 --auto-quarantine

# 检查 rootkit
sudo sd check-rootkit
sudo sd check-rootkit --json
```

## 实时监控

持续文件系统监控和后台守护进程运行命令。

| 命令 | 说明 |
|------|------|
| `sd monitor <PATHS...>` | 启动实时文件系统监控 |
| `sd daemon [PATHS...]` | 作为后台守护进程运行，包含监控和自动更新 |

```bash
# 监控 /home 和 /tmp 的变更
sd monitor /home /tmp

# 以拦截模式监控（fanotify，需要 root）
sudo sd monitor /home --block

# 作为守护进程运行，使用默认路径（/home, /tmp）
sd daemon

# 守护进程使用自定义更新间隔（每 2 小时）
sd daemon /home /tmp /var --update-hours 2
```

## 隔离区管理

管理 AES-256-GCM 加密隔离区的命令。

| 命令 | 说明 |
|------|------|
| `sd quarantine list` | 列出所有已隔离的文件 |
| `sd quarantine restore <ID>` | 将已隔离的文件恢复到原始位置 |
| `sd quarantine delete <ID>` | 永久删除已隔离的文件 |
| `sd quarantine delete-all` | 永久删除所有已隔离的文件 |
| `sd quarantine stats` | 显示隔离区统计信息 |

```bash
# 列出已隔离的文件
sd quarantine list

# 恢复文件（使用 ID 的前 8 个字符）
sd quarantine restore a1b2c3d4

# 恢复到其他路径
sd quarantine restore a1b2c3d4 --to /tmp/recovered/

# 删除特定条目
sd quarantine delete a1b2c3d4

# 删除所有条目（需确认）
sd quarantine delete-all

# 跳过确认删除所有条目
sd quarantine delete-all --yes

# 查看隔离区统计
sd quarantine stats
```

## 签名管理

更新和导入威胁签名的命令。

| 命令 | 说明 |
|------|------|
| `sd update` | 检查并应用签名数据库更新 |
| `sd import <FILE>` | 从黑名单文件导入哈希签名 |
| `sd import-clamav <FILES...>` | 导入 ClamAV 签名文件（.cvd、.hdb、.hsb） |
| `sd info` | 显示引擎版本、签名状态和系统信息 |

```bash
# 更新签名
sd update

# 仅检查更新但不下载
sd update --check-only

# 强制重新下载
sd update --force

# 导入自定义哈希文件
sd import /path/to/hashes.txt

# 导入 ClamAV 签名
sd import-clamav main.cvd daily.cvd

# 显示引擎信息
sd info
```

## 配置

管理引擎配置和修复策略的命令。

| 命令 | 说明 |
|------|------|
| `sd config show` | 显示当前配置 |
| `sd config set <KEY> <VALUE>` | 设置配置值 |
| `sd config reset` | 重置配置为默认值 |
| `sd policy show` | 显示修复策略 |
| `sd policy set <KEY> <VALUE>` | 设置修复策略值 |
| `sd policy reset` | 重置修复策略为默认值 |

```bash
# 显示配置
sd config show

# 设置扫描线程数
sd config set scan.threads 8

# 重置为默认值
sd config reset

# 显示修复策略
sd policy show
```

详情请参阅[配置概览](../configuration/)和[配置参考](../configuration/reference)。

## 定时扫描

通过 systemd 定时器或 cron 管理定期扫描的命令。

| 命令 | 说明 |
|------|------|
| `sd schedule add <PATH>` | 注册定期扫描任务 |
| `sd schedule remove` | 移除定时扫描任务 |
| `sd schedule status` | 显示当前定时扫描状态 |

```bash
# 安排每周扫描 /home
sd schedule add /home --frequency weekly

# 安排每日扫描
sd schedule add /var --frequency daily

# 可用频率：hourly, 4h, 12h, daily, weekly
sd schedule add /tmp --frequency 4h

# 移除定时任务
sd schedule remove

# 查看定时任务状态
sd schedule status
```

## 告警与 Webhook

配置 Webhook 和邮件告警通知的命令。

| 命令 | 说明 |
|------|------|
| `sd webhook list` | 列出已配置的 Webhook 端点 |
| `sd webhook add <NAME> <URL>` | 添加 Webhook 端点 |
| `sd webhook remove <NAME>` | 移除 Webhook 端点 |
| `sd webhook test` | 向所有 Webhook 发送测试告警 |
| `sd email-alert configure` | 配置 SMTP 邮件告警 |
| `sd email-alert test` | 发送测试告警邮件 |
| `sd email-alert send <NAME> <LEVEL> <PATH>` | 发送自定义告警邮件 |

```bash
# 添加 Slack webhook
sd webhook add my-slack https://hooks.slack.com/services/... --format slack

# 添加 Discord webhook
sd webhook add my-discord https://discord.com/api/webhooks/... --format discord

# 添加通用 webhook
sd webhook add my-webhook https://example.com/webhook

# 列出所有 webhook
sd webhook list

# 测试所有 webhook
sd webhook test

# 配置邮件告警
sd email-alert configure

# 测试邮件告警
sd email-alert test
```

## 网络防护

DNS 级广告和恶意域名拦截命令。

| 命令 | 说明 |
|------|------|
| `sd adblock enable` | 通过 hosts 文件启用广告拦截 |
| `sd adblock disable` | 禁用广告拦截 |
| `sd adblock sync` | 重新下载所有过滤列表 |
| `sd adblock stats` | 显示广告拦截引擎统计 |
| `sd adblock check <URL>` | 检查 URL/域名是否被拦截 |
| `sd adblock log` | 显示最近的拦截记录 |
| `sd adblock add <NAME> <URL>` | 添加自定义过滤列表 |
| `sd adblock remove <NAME>` | 移除过滤列表 |
| `sd dns-proxy` | 启动带过滤功能的本地 DNS 代理 |

```bash
# 启用广告拦截
sudo sd adblock enable

# 启动 DNS 代理
sudo sd dns-proxy --listen 127.0.0.1:53 --upstream 1.1.1.1:53
```

详情请参阅[广告拦截](../network/adblock)和 [DNS 代理](../network/dns-proxy)。

## 报告

| 命令 | 说明 |
|------|------|
| `sd report <OUTPUT>` | 从 JSON 扫描结果生成 HTML 报告 |

```bash
# 以 JSON 输出扫描，然后生成 HTML 报告
sd scan /home --json > results.json
sd report report.html --input results.json

# 或直接使用 --report 参数
sd scan /home --report /tmp/scan-report.html
```

## 系统

引擎维护、集成和自更新命令。

| 命令 | 说明 |
|------|------|
| `sd status` | 显示守护进程状态（运行中/已停止、PID、已拦截威胁） |
| `sd install-integration` | 安装文件管理器右键扫描集成 |
| `sd self-update` | 检查并应用引擎二进制更新 |

```bash
# 检查守护进程状态
sd status

# 安装桌面集成
sd install-integration

# 检查引擎更新
sd self-update --check-only

# 应用引擎更新
sd self-update
```

## 社区

社区威胁情报共享命令。

| 命令 | 说明 |
|------|------|
| `sd community status` | 显示社区共享配置 |
| `sd community enroll` | 将此设备注册到社区 API |
| `sd community disable` | 禁用社区共享 |

```bash
# 检查注册状态
sd community status

# 加入社区共享
sd community enroll

# 禁用共享（保留凭据）
sd community disable
```

## 后续步骤

- 从[快速入门指南](../getting-started/quickstart)开始，5 分钟即可开始扫描
- 查阅[配置](../configuration/)自定义引擎行为
- 设置[实时监控](../realtime/)获得持续防护
- 了解[检测引擎](../detection/)流程
