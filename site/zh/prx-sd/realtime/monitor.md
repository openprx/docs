---
title: 文件监控
description: 使用 sd monitor 进行实时文件系统监控，在威胁落盘的第一时间检测并拦截。
---

# 文件监控

`sd monitor` 命令监视目录中的文件系统活动，并实时扫描新建或修改的文件。这是在恶意软件落盘后、执行前将其捕获的最主要方式。

## 用法

```bash
sd monitor [OPTIONS] [PATHS...]
```

如果未指定路径，`sd monitor` 将监视当前工作目录。

## 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--recursive` | `-r` | `true` | 递归监视子目录 |
| `--block` | `-b` | `false` | 在扫描完成前阻止文件执行（仅限 Linux） |
| `--daemon` | `-d` | `false` | 以守护进程方式在后台运行 |
| `--pid-file` | | | 将 PID 写入指定文件（隐含 `--daemon`） |
| `--exclude` | `-e` | | 排除的 glob 模式（可重复指定） |
| `--log-file` | | | 将日志输出写入文件而非 stderr |
| `--auto-quarantine` | `-q` | `false` | 自动隔离检测到的威胁 |
| `--events` | | all | 监听的事件类型，逗号分隔 |
| `--json` | | `false` | 以 JSON Lines 格式输出事件 |

## 平台机制

PRX-SD 在每个平台上使用最强大的文件系统 API：

| 平台 | API | 能力 |
|------|-----|------|
| **Linux** | fanotify（内核 5.1+） | 全系统监控、执行权限控制、文件描述符透传 |
| **Linux（回退）** | inotify | 逐目录监视，不支持阻止模式 |
| **macOS** | FSEvents | 低延迟递归监控、历史事件回放 |
| **Windows** | ReadDirectoryChangesW | 基于完成端口的逐目录异步监控 |

::: tip
在 Linux 上，`sd monitor` 需要 `CAP_SYS_ADMIN` 能力（或 root 权限）才能使用 fanotify。如果不可用，会自动回退到 inotify 并输出警告。
:::

## 监控事件

以下文件系统事件会触发扫描：

| 事件 | 说明 | 支持平台 |
|------|------|----------|
| `Create` | 新建文件 | 全平台 |
| `Modify` | 文件内容被写入 | 全平台 |
| `CloseWrite` | 文件写入后关闭（避免扫描不完整的文件） | Linux |
| `Delete` | 文件被删除 | 全平台 |
| `Rename` | 文件被重命名或移动 | 全平台 |
| `Open` | 文件被打开读取 | Linux (fanotify) |
| `Execute` | 文件即将被执行 | Linux (fanotify) |

使用 `--events` 过滤触发扫描的事件：

```bash
# 仅在新建文件和写入完成时扫描
sd monitor --events Create,CloseWrite /home
```

## 阻止模式

在支持 fanotify 的 Linux 系统上，`--block` 启用 `FAN_OPEN_EXEC_PERM` 模式。在此模式下，内核会暂停进程执行，直到 PRX-SD 返回判定结果：

```bash
sudo sd monitor --block /usr/local/bin /tmp
```

::: warning
阻止模式会为监控路径下的每次程序启动增加延迟。建议仅对高风险目录（如 `/tmp` 或下载文件夹）使用，不要对 `/usr` 或 `/lib` 等系统级路径使用。
:::

当阻止模式下检测到威胁时：

1. 文件的打开/执行请求被内核**拒绝**
2. 事件以 `BLOCKED` 判定结果记录到日志
3. 如果设置了 `--auto-quarantine`，文件将被移入隔离区

## 守护进程模式

使用 `--daemon` 将监控进程从终端分离：

```bash
sd monitor --daemon --pid-file /var/run/sd-monitor.pid /home /tmp /var/www
```

发送 `SIGTERM` 停止守护进程：

```bash
kill $(cat /var/run/sd-monitor.pid)
```

如果通过守护进程管理器运行，也可以使用 `sd daemon stop`。详见[守护进程](./daemon)。

## 示例

```bash
# 监视 home 和 tmp 目录
sd monitor /home /tmp

# 监视并自动隔离威胁
sd monitor --auto-quarantine /home/downloads

# Linux 下对敏感目录启用阻止模式
sudo sd monitor --block --auto-quarantine /tmp

# 排除构建产物和 node_modules
sd monitor -e "*.o" -e "node_modules/**" /home/dev/projects

# 以守护进程方式运行，JSON 格式日志
sd monitor --daemon --json --log-file /var/log/sd-monitor.json /home

# 仅监控特定事件
sd monitor --events Create,Modify,Rename /var/www
```

## JSON 输出

启用 `--json` 后，每个事件输出一行 JSON：

```json
{
  "timestamp": "2026-03-21T10:15:32.456Z",
  "event": "CloseWrite",
  "path": "/tmp/payload.exe",
  "verdict": "malicious",
  "threat": "Win.Trojan.Agent-123456",
  "action": "quarantined",
  "scan_ms": 12
}
```

## 后续步骤

- [守护进程](./daemon) -- 以托管后台服务方式运行监控
- [勒索软件防护](./ransomware) -- 专项勒索软件行为检测
- [隔离区管理](/zh/prx-sd/quarantine/) -- 管理已隔离的文件
- [威胁响应](/zh/prx-sd/remediation/) -- 配置自动响应策略
