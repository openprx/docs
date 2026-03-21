---
title: 定时扫描
description: 使用 sd schedule 设置定期扫描任务，按固定间隔自动进行威胁检测。
---

# 定时扫描

`sd schedule` 命令管理按预定间隔运行的定期扫描任务。定时扫描是对实时监控的补充，通过对指定目录执行周期性全盘扫描，捕获可能被遗漏或在监控未启用期间引入的威胁。

## 用法

```bash
sd schedule <SUBCOMMAND> [OPTIONS]
```

### 子命令

| 子命令 | 说明 |
|--------|------|
| `add` | 创建新的定时扫描任务 |
| `remove` | 移除定时扫描任务 |
| `list` | 列出所有定时扫描任务 |
| `status` | 显示定时任务状态，包括上次运行和下次运行时间 |
| `run` | 手动立即触发指定的定时任务 |

## 添加定时扫描

```bash
sd schedule add <PATH> [OPTIONS]
```

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--frequency` | `-f` | `daily` | 扫描频率：`hourly`、`4h`、`12h`、`daily`、`weekly` |
| `--name` | `-n` | 自动生成 | 该任务的可读名称 |
| `--recursive` | `-r` | `true` | 递归扫描子目录 |
| `--auto-quarantine` | `-q` | `false` | 自动隔离检测到的威胁 |
| `--exclude` | `-e` | | 排除的 glob 模式（可重复指定） |
| `--notify` | | `true` | 检测到威胁时发送告警 |
| `--time` | `-t` | 随机 | 首选启动时间（HH:MM，24 小时制） |
| `--day` | `-d` | `monday` | 每周扫描的执行日 |

### 频率选项

| 频率 | 间隔 | 使用场景 |
|------|------|----------|
| `hourly` | 每 60 分钟 | 高风险目录（上传目录、临时目录） |
| `4h` | 每 4 小时 | 共享目录、Web 根目录 |
| `12h` | 每 12 小时 | 用户主目录 |
| `daily` | 每 24 小时 | 通用全盘扫描 |
| `weekly` | 每 7 天 | 低风险归档目录、备份验证 |

### 示例

```bash
# 每天扫描主目录
sd schedule add /home --frequency daily --name "home-daily"

# 每小时扫描上传目录并自动隔离
sd schedule add /var/www/uploads --frequency hourly --auto-quarantine \
  --name "uploads-hourly"

# 每周全盘扫描，排除大型媒体文件
sd schedule add / --frequency weekly --name "full-weekly" \
  --exclude "*.iso" --exclude "*.vmdk" --exclude "/proc/*" --exclude "/sys/*"

# 每 4 小时扫描临时目录
sd schedule add /tmp --frequency 4h --auto-quarantine --name "tmp-4h"

# 每天在指定时间扫描
sd schedule add /home --frequency daily --time 02:00 --name "home-nightly"

# 每周日扫描
sd schedule add /var/www --frequency weekly --day sunday --time 03:00 \
  --name "webroot-weekly"
```

## 列出定时扫描

```bash
sd schedule list
```

```
Scheduled Scan Jobs (4)

Name              Path              Frequency  Auto-Q  Next Run
home-daily        /home             daily      no      2026-03-22 02:00
uploads-hourly    /var/www/uploads  hourly     yes     2026-03-21 11:00
tmp-4h            /tmp              4h         yes     2026-03-21 14:00
full-weekly       /                 weekly     no      2026-03-23 03:00 (Sun)
```

## 查看任务状态

```bash
sd schedule status
```

```
Scheduled Scan Status

Name              Last Run              Duration  Files    Threats  Status
home-daily        2026-03-21 02:00:12   8m 32s    45,231   0        clean
uploads-hourly    2026-03-21 10:00:05   45s       1,247    1        threats found
tmp-4h            2026-03-21 10:00:08   2m 12s    3,891    0        clean
full-weekly       2026-03-16 03:00:00   1h 22m    892,451  3        threats found
```

查看指定任务的详细状态：

```bash
sd schedule status home-daily
```

```
Job: home-daily
  Path:           /home
  Frequency:      daily (every 24h)
  Preferred Time: 02:00
  Auto-Quarantine: no
  Recursive:      yes
  Excludes:       (none)

  Last Run:       2026-03-21 02:00:12 UTC
  Duration:       8 minutes 32 seconds
  Files Scanned:  45,231
  Threats Found:  0
  Result:         Clean

  Next Run:       2026-03-22 02:00 UTC
  Total Runs:     47
  Total Threats:  3 (across all runs)
```

## 移除定时扫描

```bash
# 按名称移除
sd schedule remove home-daily

# 移除所有定时扫描
sd schedule remove --all
```

## 手动触发扫描

无需等待下一个间隔，立即运行指定的定时任务：

```bash
sd schedule run home-daily
```

此操作会使用所有已配置的选项（隔离、排除、通知）执行扫描，并更新该任务的最近运行时间戳。

## 调度机制

PRX-SD 使用内部调度器，而非系统 cron。调度器作为守护进程的一部分运行：

```
sd daemon start
  └── 调度器线程
        ├── 每 60 秒检查任务间隔
        ├── 间隔到期时启动扫描任务
        ├── 将结果序列化到 ~/.prx-sd/schedule/
        └── 完成后发送通知
```

::: warning
定时扫描仅在守护进程运行时执行。如果守护进程停止，错过的扫描将在下次守护进程启动时运行。使用 `sd daemon start` 确保调度持续运行。
:::

## 配置文件

定时任务持久化存储在 `~/.prx-sd/schedule.json` 中，也可以在 `config.toml` 中定义：

```toml
[[schedule]]
name = "home-daily"
path = "/home"
frequency = "daily"
time = "02:00"
recursive = true
auto_quarantine = false
notify = true

[[schedule]]
name = "uploads-hourly"
path = "/var/www/uploads"
frequency = "hourly"
recursive = true
auto_quarantine = true
notify = true
exclude = ["*.tmp", "*.log"]

[[schedule]]
name = "full-weekly"
path = "/"
frequency = "weekly"
day = "sunday"
time = "03:00"
recursive = true
auto_quarantine = false
notify = true
exclude = ["*.iso", "*.vmdk", "/proc/*", "/sys/*", "/dev/*"]
```

## 扫描报告

每次定时扫描会生成报告，存储在 `~/.prx-sd/reports/`：

```bash
# 查看指定任务的最新报告
sd schedule report home-daily

# 导出报告为 JSON
sd schedule report home-daily --json > report.json

# 列出所有报告
sd schedule report --list
```

::: tip
将定时扫描与邮件告警结合使用，可自动接收扫描报告。在邮件事件中配置 `scan_completed` 即可在每次定时扫描后收到摘要。
:::

## 后续步骤

- [Webhook 告警](./webhook) -- 定时扫描发现威胁时获取通知
- [邮件告警](./email) -- 接收定时扫描的邮件报告
- [守护进程](/zh/prx-sd/realtime/daemon) -- 定时扫描执行的必要条件
- [威胁响应](/zh/prx-sd/remediation/) -- 配置发现威胁时的处理方式
