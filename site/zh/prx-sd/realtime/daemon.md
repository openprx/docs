---
title: 守护进程
description: 将 PRX-SD 作为后台守护进程运行，实现自动签名更新和持续文件监控。
---

# 守护进程

`sd daemon` 命令将 PRX-SD 作为长期运行的后台进程启动，同时提供实时文件监控和自动签名更新功能。对于需要持续防护的服务器和工作站，这是推荐的运行方式。

## 用法

```bash
sd daemon [SUBCOMMAND] [OPTIONS]
```

### 子命令

| 子命令 | 说明 |
|--------|------|
| `start` | 启动守护进程（未指定子命令时的默认行为） |
| `stop` | 停止运行中的守护进程 |
| `restart` | 先停止再重新启动守护进程 |
| `status` | 显示守护进程状态和统计信息 |

## 选项（start）

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--watch` | `-w` | `/home,/tmp` | 逗号分隔的监控路径 |
| `--update-hours` | `-u` | `6` | 自动签名更新间隔（小时） |
| `--no-update` | | `false` | 禁用自动签名更新 |
| `--block` | `-b` | `false` | 启用阻止模式（Linux fanotify） |
| `--auto-quarantine` | `-q` | `false` | 自动隔离检测到的威胁 |
| `--pid-file` | | `~/.prx-sd/sd.pid` | PID 文件位置 |
| `--log-file` | | `~/.prx-sd/daemon.log` | 日志文件位置 |
| `--log-level` | `-l` | `info` | 日志详细级别：`trace`、`debug`、`info`、`warn`、`error` |
| `--config` | `-c` | `~/.prx-sd/config.toml` | 配置文件路径 |

## 守护进程管理的子系统

启动后，`sd daemon` 会运行两个子系统：

1. **文件监控器** -- 监视配置的路径中的文件系统事件，并扫描新建或修改的文件。等效于使用相同路径运行 `sd monitor`。
2. **更新调度器** -- 定期检查并下载新的威胁签名（哈希数据库、YARA 规则、IOC 数据源）。等效于按配置的间隔运行 `sd update`。

## 默认监控路径

未指定 `--watch` 时，守护进程监控以下路径：

| 平台 | 默认路径 |
|------|----------|
| Linux | `/home`、`/tmp` |
| macOS | `/Users`、`/tmp`、`/private/tmp` |
| Windows | `C:\Users`、`C:\Windows\Temp` |

可通过配置文件或 `--watch` 覆盖默认值：

```bash
sd daemon start --watch /home,/tmp,/var/www,/opt
```

## 查看状态

使用 `sd daemon status`（或简写 `sd status`）查看守护进程状态：

```bash
sd status
```

```
PRX-SD Daemon Status
  State:          running (PID 48231)
  Uptime:         3 days, 14 hours, 22 minutes
  Watched paths:  /home, /tmp
  Files scanned:  12,847
  Threats found:  3 (2 quarantined, 1 reported)
  Last update:    2026-03-21 08:00:12 UTC (signatures v2026.0321.1)
  Next update:    2026-03-21 14:00:12 UTC
  Memory usage:   42 MB
```

## systemd 集成（Linux）

创建 systemd 服务实现开机自启：

```ini
[Unit]
Description=PRX-SD Antivirus Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
ExecStart=/usr/local/bin/sd daemon start
ExecStop=/usr/local/bin/sd daemon stop
ExecReload=/bin/kill -HUP $MAINPID
PIDFile=/var/lib/prx-sd/sd.pid
Restart=on-failure
RestartSec=10
User=root

# 安全加固
NoNewPrivileges=yes
ProtectSystem=strict
ReadWritePaths=/var/lib/prx-sd /home /tmp

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-sd
sudo systemctl status prx-sd
sudo journalctl -u prx-sd -f
```

::: tip
守护进程需要 root 权限才能使用 fanotify 阻止模式。对于非阻止监控，可以使用有监控路径读取权限的普通用户运行。
:::

## launchd 集成（macOS）

在 `/Library/LaunchDaemons/com.openprx.sd.plist` 创建启动守护进程配置：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.openprx.sd</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/sd</string>
        <string>daemon</string>
        <string>start</string>
        <string>--watch</string>
        <string>/Users,/tmp</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/prx-sd.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/prx-sd.log</string>
</dict>
</plist>
```

```bash
sudo launchctl load /Library/LaunchDaemons/com.openprx.sd.plist
sudo launchctl list | grep openprx
```

## 信号处理

| 信号 | 行为 |
|------|------|
| `SIGHUP` | 重新加载配置并重启监控，无需完全重启 |
| `SIGTERM` | 优雅关闭 -- 完成当前扫描，刷新日志 |
| `SIGINT` | 同 `SIGTERM` |
| `SIGUSR1` | 立即触发签名更新 |

```bash
# 强制立即更新
kill -USR1 $(cat ~/.prx-sd/sd.pid)
```

## 示例

```bash
# 使用默认配置启动守护进程
sd daemon start

# 自定义监控路径和 4 小时更新周期
sd daemon start --watch /home,/tmp,/var/www --update-hours 4

# 启用阻止模式和自动隔离
sudo sd daemon start --block --auto-quarantine

# 查看守护进程状态
sd status

# 重启守护进程
sd daemon restart

# 停止守护进程
sd daemon stop
```

::: warning
停止守护进程将禁用所有实时防护。守护进程停止期间发生的文件系统事件不会被追溯扫描。
:::

## 后续步骤

- [文件监控](./monitor) -- 详细的监控配置
- [勒索软件防护](./ransomware) -- 行为级勒索软件检测
- [更新签名](/zh/prx-sd/signatures/update) -- 手动更新签名
- [Webhook 告警](/zh/prx-sd/alerts/webhook) -- 检测到威胁时获取通知
