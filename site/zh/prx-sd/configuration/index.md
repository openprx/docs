---
title: 配置概览
description: 了解 PRX-SD 配置的工作方式，配置文件的存储位置，以及如何使用 sd config 命令查看、修改和重置设置。
---

# 配置概览

PRX-SD 将所有配置存储在单个 JSON 文件 `~/.prx-sd/config.json` 中。该文件在首次运行时自动创建，并使用合理的默认值。你可以通过 `sd config` 命令或直接编辑 JSON 文件来查看、修改和重置配置。

## 配置文件位置

| 平台 | 默认路径 |
|------|----------|
| Linux / macOS | `~/.prx-sd/config.json` |
| Windows | `%USERPROFILE%\.prx-sd\config.json` |
| 自定义 | `--data-dir /path/to/dir`（全局 CLI 参数） |

`--data-dir` 全局参数可以覆盖默认位置。设置后，配置文件从 `<data-dir>/config.json` 读取。

```bash
# 使用自定义数据目录
sd --data-dir /opt/prx-sd config show
```

## `sd config` 命令

### 查看当前配置

显示所有当前设置，包括配置文件路径：

```bash
sd config show
```

输出：

```
Current Configuration
  File: /home/user/.prx-sd/config.json

{
  "scan": {
    "max_file_size": 104857600,
    "threads": null,
    "timeout_per_file_ms": 30000,
    "scan_archives": true,
    "max_archive_depth": 3,
    "heuristic_threshold": 60,
    "exclude_paths": []
  },
  "monitor": {
    "block_mode": false,
    "channel_capacity": 4096
  },
  "update_server_url": null,
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

### 设置配置值

使用点分隔符号设置任意配置键。值会自动解析为适当的 JSON 类型（布尔值、整数、浮点数、数组、对象或字符串）。

```bash
sd config set <key> <value>
```

示例：

```bash
# 设置最大文件大小为 200 MiB
sd config set scan.max_file_size 209715200

# 设置扫描线程数为 8
sd config set scan.threads 8

# 启用自动隔离
sd config set quarantine.auto_quarantine true

# 设置启发式阈值为 50（更灵敏）
sd config set scan.heuristic_threshold 50

# 以 JSON 数组格式添加排除路径
sd config set scan.exclude_paths '["*.log", "/proc", "/sys"]'

# 更改更新服务器 URL
sd config set update_server_url "https://custom-update.example.com/v1"
```

输出：

```
OK Set scan.max_file_size = 209715200 (was 104857600)
```

::: tip
嵌套键使用点分隔符号。例如，`scan.max_file_size` 会导航到 `scan` 对象内并设置 `max_file_size` 字段。如果中间对象不存在，会自动创建。
:::

### 重置为默认值

将所有配置恢复为出厂默认值：

```bash
sd config reset
```

输出：

```
OK Configuration reset to defaults.
```

::: warning
重置配置不会删除签名数据库、YARA 规则或已隔离的文件。它只会将 `config.json` 文件重置为默认值。
:::

## 配置分类

配置分为四个主要部分：

| 部分 | 用途 |
|------|------|
| `scan.*` | 文件扫描行为：文件大小限制、线程数、超时、压缩包、启发式分析 |
| `monitor.*` | 实时监控：拦截模式、事件通道容量 |
| `quarantine.*` | 隔离区：自动隔离、最大存储空间 |
| `update_server_url` | 签名更新服务器地址 |

关于每个配置键的完整参考、类型、默认值和说明，请参阅[配置参考](./reference)。

## 默认配置

首次运行时，PRX-SD 会生成以下默认配置：

```json
{
  "scan": {
    "max_file_size": 104857600,
    "threads": null,
    "timeout_per_file_ms": 30000,
    "scan_archives": true,
    "max_archive_depth": 3,
    "heuristic_threshold": 60,
    "exclude_paths": []
  },
  "monitor": {
    "block_mode": false,
    "channel_capacity": 4096
  },
  "update_server_url": null,
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

关键默认值：

- **最大文件大小：** 100 MiB（超过此大小的文件将被跳过）
- **线程数：** `null`（根据 CPU 核心数自动检测）
- **超时：** 每个文件 30 秒
- **压缩包：** 扫描压缩包，最多 3 层嵌套
- **启发式阈值：** 60（60 分以上 = 恶意，30-59 分 = 可疑）
- **拦截模式：** 禁用（监控会报告但不会阻止文件访问）
- **自动隔离：** 禁用（威胁会被报告但文件不会被移动）
- **隔离区大小限制：** 1024 MiB

## 直接编辑配置文件

你也可以使用任何文本编辑器直接编辑 `~/.prx-sd/config.json`。PRX-SD 在每个命令开始时读取该文件，因此修改会立即生效。

```bash
# 使用编辑器打开
$EDITOR ~/.prx-sd/config.json
```

请确保文件是合法的 JSON。如果格式有误，PRX-SD 会回退到默认值并输出警告。

## 数据目录结构

```
~/.prx-sd/
  config.json       # 引擎配置
  signatures/       # LMDB 哈希签名数据库
  yara/             # 编译后的 YARA 规则文件
  quarantine/       # AES-256-GCM 加密隔离区
  adblock/          # 广告拦截过滤列表和日志
  plugins/          # WASM 插件目录
  audit/            # 扫描审计日志（JSONL）
  prx-sd.pid        # 守护进程 PID 文件（运行时存在）
```

## 后续步骤

- 查阅[配置参考](./reference)了解每个键的类型和默认值
- 了解[扫描功能](../scanning/file-scan)以理解配置如何影响扫描
- 设置[实时监控](../realtime/)并配置 `monitor.block_mode`
- 配置[隔离区](../quarantine/)的自动隔离行为
