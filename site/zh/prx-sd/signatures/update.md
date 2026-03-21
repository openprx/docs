---
title: 更新签名
description: 使用 sd update 保持威胁情报数据库为最新状态，支持增量更新和 Ed25519 签名验证。
---

# 更新签名

`sd update` 命令从所有已配置的来源下载最新的威胁签名。定期更新至关重要 -- 每隔几分钟就有新的恶意软件样本出现，过时的签名数据库会在防护中留下空白。

## 用法

```bash
sd update [OPTIONS]
```

## 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--check-only` | | `false` | 仅检查可用更新，不下载 |
| `--force` | `-f` | `false` | 强制重新下载所有签名，忽略缓存 |
| `--source` | `-s` | all | 仅更新指定来源类别：`hashes`、`yara`、`ioc`、`clamav` |
| `--full` | | `false` | 包含大型数据集（VirusShare 2000 万+ MD5 哈希） |
| `--server-url` | | 官方 | 自定义更新服务器 URL |
| `--no-verify` | | `false` | 跳过 Ed25519 签名验证（不推荐） |
| `--timeout` | `-t` | `300` | 每个来源的下载超时时间（秒） |
| `--parallel` | `-p` | `4` | 并行下载数 |
| `--quiet` | `-q` | `false` | 抑制进度输出 |

## 更新流程

### 更新步骤

```
sd update
  1. 从更新服务器获取 metadata.json
  2. 比较本地版本与远程版本
  3. 对每个过期的来源：
     a. 下载增量差异包（如无差异包则下载完整文件）
     b. 验证 Ed25519 签名
     c. 应用到本地数据库
  4. 重新编译 YARA 规则
  5. 更新本地 metadata.json
```

### 增量更新

PRX-SD 使用增量更新以最小化带宽消耗：

| 来源类型 | 更新方式 | 典型大小 |
|----------|----------|----------|
| 哈希数据库 | 差异包（新增 + 删除） | 50-200 KB |
| YARA 规则 | Git 风格补丁 | 10-50 KB |
| IOC 数据源 | 全量替换（文件较小） | 1-5 MB |
| ClamAV | cdiff 增量更新 | 100-500 KB |

当增量更新不可用时（首次安装、数据损坏或使用 `--force`），会下载完整数据库。

### Ed25519 签名验证

每个下载的文件在应用前都会进行 Ed25519 签名验证，以防范：

- **篡改** -- 被修改的文件会被拒绝
- **损坏** -- 不完整的下载会被检测到
- **重放攻击** -- 旧签名无法被重放（时间戳校验）

签名公钥在编译时嵌入 `sd` 二进制文件中。

::: warning
切勿在生产环境中使用 `--no-verify`。签名验证的存在是为了防止通过被入侵的更新服务器或中间人攻击实施的供应链攻击。
:::

## 检查更新

查看可用更新而不下载：

```bash
sd update --check-only
```

```
Checking for updates...
  MalwareBazaar:    update available (v2026.0321.2, +847 hashes)
  URLhaus:          up to date (v2026.0321.1)
  Feodo Tracker:    update available (v2026.0321.3, +12 hashes)
  ThreatFox:        up to date (v2026.0321.1)
  YARA Community:   update available (v2026.0320.1, +3 rules)
  IOC Feeds:        update available (v2026.0321.1, +1,204 indicators)
  ClamAV:           not configured

3 sources have updates available.
Run 'sd update' to download.
```

## 自定义更新服务器

适用于隔离网络环境或运行私有镜像的组织：

```bash
sd update --server-url https://signatures.internal.corp/prx-sd
```

在 `config.toml` 中永久设置服务器：

```toml
[update]
server_url = "https://signatures.internal.corp/prx-sd"
interval_hours = 6
auto_update = true
```

::: tip
使用 `prx-sd-mirror` 工具搭建本地签名镜像。详见[自托管指南](https://github.com/OpenPRX/prx-sd-signatures)。
:::

## Shell 脚本替代方案

对于未安装 `sd` 的系统，可使用随附的 shell 脚本：

```bash
# 标准更新（哈希 + YARA）
./tools/update-signatures.sh

# 完整更新（含 VirusShare）
./tools/update-signatures.sh --full

# 仅更新哈希
./tools/update-signatures.sh --source hashes

# 仅更新 YARA 规则
./tools/update-signatures.sh --source yara
```

## 示例

```bash
# 标准更新
sd update

# 强制全量重新下载
sd update --force

# 仅更新 YARA 规则
sd update --source yara

# 完整更新（含 VirusShare，下载量较大）
sd update --full

# 静默模式，适合 cron 任务
sd update --quiet

# 先查看可用更新
sd update --check-only

# 使用自定义服务器并增大并行数
sd update --server-url https://mirror.example.com --parallel 8
```

## 自动更新

### 通过 sd daemon

守护进程自动处理更新。配置更新间隔：

```bash
sd daemon start --update-hours 4
```

### 通过 cron

```bash
# 每 6 小时更新一次签名
0 */6 * * * /usr/local/bin/sd update --quiet 2>&1 | logger -t prx-sd
```

### 通过 systemd 定时器

```ini
# /etc/systemd/system/prx-sd-update.timer
[Unit]
Description=PRX-SD Signature Update Timer

[Timer]
OnCalendar=*-*-* 00/6:00:00
RandomizedDelaySec=900
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now prx-sd-update.timer
```

## 后续步骤

- [签名来源](./sources) -- 每个威胁情报来源的详细信息
- [导入哈希](./import) -- 添加自定义哈希黑名单
- [守护进程](../realtime/daemon) -- 自动后台更新
- [威胁情报概览](./index) -- 数据库架构概览
