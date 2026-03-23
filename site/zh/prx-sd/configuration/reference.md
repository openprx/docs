---
title: 配置参考
description: PRX-SD 所有配置键的完整参考，包括类型、默认值和详细说明。
---

# 配置参考

本页记录了 `~/.prx-sd/config.json` 中的每个配置键。使用 `sd config set <key> <value>` 修改任意设置，或直接编辑 JSON 文件。

## 扫描设置 (`scan.*`)

控制扫描引擎处理文件方式的设置。

| 键 | 类型 | 默认值 | 说明 |
|----|------|--------|------|
| `scan.max_file_size` | `integer` | `104857600`（100 MiB） | 最大文件大小（字节）。超过此值的文件在扫描时将被跳过。设为 `0` 可取消限制（不推荐）。 |
| `scan.threads` | `integer \| null` | `null`（自动） | 并行扫描线程数。为 `null` 时，PRX-SD 使用逻辑 CPU 核心数。设置特定数值可限制或增加并行度。 |
| `scan.timeout_per_file_ms` | `integer` | `30000`（30 秒） | 扫描单个文件允许的最大时间（毫秒）。超时后文件标记为错误，扫描继续处理下一个文件。 |
| `scan.scan_archives` | `boolean` | `true` | 是否递归进入压缩文件（ZIP、tar.gz、7z、RAR 等）扫描其内容。 |
| `scan.max_archive_depth` | `integer` | `3` | 递归压缩文件时的最大嵌套深度。例如，ZIP 中的 ZIP 中的 ZIP 需要深度 3。可防止 zip 炸弹攻击。 |
| `scan.heuristic_threshold` | `integer` | `60` | 将文件标记为**恶意**的最低启发式分数（0-100）。分数在 30 到此阈值之间的文件标记为**可疑**。降低此值会提高灵敏度，但可能产生更多误报。 |
| `scan.exclude_paths` | `string[]` | `[]` | 要从扫描中排除的 glob 模式或路径前缀列表。支持 `*`（任意字符）和 `?`（单个字符）通配符。 |

### 示例

```bash
# 将最大文件大小增加到 500 MiB
sd config set scan.max_file_size 524288000

# 使用 4 个线程
sd config set scan.threads 4

# 将单文件超时增加到 60 秒
sd config set scan.timeout_per_file_ms 60000

# 禁用压缩包扫描
sd config set scan.scan_archives false

# 设置压缩包嵌套深度为 5
sd config set scan.max_archive_depth 5

# 降低启发式阈值以提高灵敏度
sd config set scan.heuristic_threshold 40

# 排除路径
sd config set scan.exclude_paths '["/proc", "/sys", "/dev", "*.log", "*.tmp"]'
```

## 监控设置 (`monitor.*`)

控制实时文件系统监控（`sd monitor` 和 `sd daemon`）的设置。

| 键 | 类型 | 默认值 | 说明 |
|----|------|--------|------|
| `monitor.block_mode` | `boolean` | `false` | 为 `true` 时，使用 fanotify 权限事件（仅 Linux）在请求进程读取恶意文件之前**阻止**访问。需要 root 权限。为 `false` 时，文件在创建/修改后扫描，威胁会被报告但不会被阻止。 |
| `monitor.channel_capacity` | `integer` | `4096` | 文件系统监视器与扫描器之间内部事件通道缓冲区大小。如果在高文件系统活动下看到 "channel full" 警告，请增加此值。 |

### 示例

```bash
# 启用拦截模式（需要 root）
sd config set monitor.block_mode true

# 为繁忙服务器增加通道缓冲区
sd config set monitor.channel_capacity 16384
```

::: warning
拦截模式（`monitor.block_mode = true`）使用 Linux fanotify 权限事件。需要满足：
- root 权限
- Linux 内核启用了 `CONFIG_FANOTIFY_ACCESS_PERMISSIONS`
- PRX-SD 守护进程以 root 身份运行

在 macOS 和 Windows 上，拦截模式不可用，此设置将被忽略。
:::

## 更新设置

| 键 | 类型 | 默认值 | 说明 |
|----|------|--------|------|
| `update_server_url` | `string` | `null` | 签名更新服务器 URL。引擎通过 `<url>/manifest.json` 检查更新。可覆盖此值以使用私有镜像或离线更新服务器。 |

### 示例

```bash
# 使用私有镜像
sd config set update_server_url "https://internal-mirror.example.com/prx-sd/v1"

# 重置为官方服务器
sd config set update_server_url null
```

## 隔离区设置 (`quarantine.*`)

控制加密隔离区的设置。

| 键 | 类型 | 默认值 | 说明 |
|----|------|--------|------|
| `quarantine.auto_quarantine` | `boolean` | `false` | 为 `true` 时，扫描过程中自动将检测为**恶意**的文件移入隔离区。为 `false` 时，威胁会被报告但文件保留原位。 |
| `quarantine.max_vault_size_mb` | `integer` | `1024`（1 GiB） | 隔离区的最大总大小（MiB）。达到此限制后，无法隔离新文件，需先删除旧条目。 |

### 示例

```bash
# 启用自动隔离
sd config set quarantine.auto_quarantine true

# 将隔离区大小增加到 5 GiB
sd config set quarantine.max_vault_size_mb 5120

# 禁用自动隔离（仅报告）
sd config set quarantine.auto_quarantine false
```

## 完整默认配置

供参考，以下是完整的默认配置：

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

## 值解析规则

使用 `sd config set` 时，值按以下顺序自动解析：

1. **布尔值** -- `true` 或 `false`
2. **空值** -- `null`
3. **整数** -- 例如 `42`、`104857600`
4. **浮点数** -- 例如 `3.14`
5. **JSON 数组/对象** -- 例如 `'["/proc", "*.log"]'`、`'{"key": "value"}'`
6. **字符串** -- 其他所有内容，例如 `"https://example.com"`

::: tip
设置数组或对象时，请用单引号包裹值以防止 shell 展开：
```bash
sd config set scan.exclude_paths '["*.log", "/proc", "/sys"]'
```
:::

## 相关命令

| 命令 | 说明 |
|------|------|
| `sd config show` | 显示当前配置 |
| `sd config set <key> <value>` | 设置配置值 |
| `sd config reset` | 重置所有设置为默认值 |
| `sd policy show` | 显示修复策略 |
| `sd policy set <key> <value>` | 设置修复策略值 |
| `sd policy reset` | 重置修复策略为默认值 |

## 后续步骤

- 返回[配置概览](./index)查看总体介绍
- 了解 `scan.*` 设置如何影响[文件扫描](../scanning/file-scan)
- 使用 `monitor.*` 设置配置[实时监控](../realtime/)
- 使用自动隔离配置[隔离区](../quarantine/)
