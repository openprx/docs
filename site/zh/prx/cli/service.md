---
title: prx service — 系统服务管理
description: 将 OpenPRX 守护进程注册为 OS 系统服务，实现开机自启和崩溃自动重启。
---

# prx service

管理 OS 系统服务的生命周期。将 OpenPRX 守护进程注册为 systemd（Linux）、launchd（macOS）或 OpenRC（Alpine/Gentoo）用户服务，实现开机自启动和崩溃自动重启。

## 用法

```bash
prx service [OPTIONS] <COMMAND>
```

## 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--service-init <TYPE>` | — | `auto` | 初始化系统类型：`auto`（自动检测）、`systemd`、`openrc` |

## 子命令

| 子命令 | 说明 |
|--------|------|
| `install` | 安装服务单元文件，注册开机自启和自动重启 |
| `start` | 启动守护进程服务 |
| `stop` | 停止守护进程服务 |
| `restart` | 重启守护进程服务以应用最新配置 |
| `status` | 查看守护进程服务状态 |
| `uninstall` | 卸载服务单元文件 |

## prx service install

安装系统服务单元文件。安装后守护进程会在系统启动时自动运行。

```bash
prx service install
```

### 各平台行为

**Linux (systemd)**：
- 生成 `~/.config/systemd/user/openprx.service` 用户服务文件
- 启用 `loginctl enable-linger` 确保用户登出后服务继续运行
- 配置 `Restart=always` 实现崩溃自动重启

**Linux (OpenRC)**：
- 生成适用于 OpenRC 的 init 脚本

**macOS (launchd)**：
- 生成 `~/Library/LaunchAgents/dev.openprx.daemon.plist` 文件
- 配置 `KeepAlive` 实现自动重启

## prx service start

启动守护进程服务。

```bash
prx service start
```

## prx service stop

停止守护进程服务。

```bash
prx service stop
```

## prx service restart

重启守护进程服务。修改配置后使用此命令使变更生效。

```bash
prx service restart
```

虽然 `prx daemon` 支持配置热重载，但某些底层变更（如网关绑定地址变更）仍需要完整重启。

## prx service status

查看当前守护进程服务的运行状态。

```bash
prx service status
```

## prx service uninstall

卸载服务单元文件，取消开机自启。

```bash
prx service uninstall
```

## 示例工作流

```bash
# 1. 完成初始配置
prx onboard --api-key sk-xxxx --provider openrouter

# 2. 安装为系统服务
prx service install

# 3. 启动服务
prx service start

# 4. 检查状态
prx service status

# 5. 修改配置后重启
prx service restart

# 6. 不再需要时卸载
prx service stop
prx service uninstall
```

## 强制指定初始化系统

自动检测通常能正确识别当前系统，但在容器或特殊环境中可能需要手动指定：

```bash
# 强制使用 systemd
prx service --service-init systemd install

# 强制使用 OpenRC
prx service --service-init openrc install
```

## 相关链接

- [prx daemon](./daemon) — 守护进程详解
- [安装指南](../getting-started/installation) — 安装 PRX
- [配置参考](../config/) — 配置文件说明
