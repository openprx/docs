---
title: 快速开始
description: 5 分钟内开始使用 PRX-SD 进行恶意软件扫描。安装、更新签名、扫描文件、查看结果并启用实时监控。
---

# 快速开始

本指南将带你从零开始，在 5 分钟内完成首次恶意软件扫描。完成后，你将拥有已安装的 PRX-SD、最新的签名数据库以及运行中的实时监控。

::: tip 前置条件
你需要一台安装了 `curl` 的 Linux 或 macOS 系统。其他安装方式和平台详情请参阅[安装指南](./installation)。
:::

## 第 1 步：安装 PRX-SD

使用安装脚本下载并安装最新发行版：

```bash
curl -fsSL https://openprx.dev/install-sd.sh | bash
```

验证安装：

```bash
sd --version
```

你应该看到如下输出：

```
prx-sd 0.5.0
```

## 第 2 步：更新签名数据库

PRX-SD 自带内置黑名单，但你需要下载最新的威胁情报才能获得完整防护。`update` 命令会从所有已配置的来源获取哈希签名和 YARA 规则：

```bash
sd update
```

预期输出：

```
[INFO] Updating hash signatures...
[INFO]   MalwareBazaar: 12,847 hashes (last 48h)
[INFO]   URLhaus: 8,234 hashes
[INFO]   Feodo Tracker: 1,456 hashes
[INFO]   ThreatFox: 5,891 hashes
[INFO] Updating YARA rules...
[INFO]   Built-in rules: 64
[INFO]   Yara-Rules/rules: 12,400
[INFO]   Neo23x0/signature-base: 8,200
[INFO]   ReversingLabs: 9,500
[INFO]   ESET IOC: 3,800
[INFO]   InQuest: 4,836
[INFO] Signature database updated successfully.
[INFO] Total: 28,428 hashes, 38,800 YARA rules
```

::: tip 完整更新
如需包含完整的 VirusShare 数据库（20M+ MD5 哈希），请运行：
```bash
sd update --full
```
耗时较长，但提供最大的哈希覆盖范围。
:::

## 第 3 步：扫描文件或目录

扫描单个可疑文件：

```bash
sd scan /path/to/suspicious_file
```

递归扫描整个目录：

```bash
sd scan /home --recursive
```

目录无威胁时的输出示例：

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 0
Status:  CLEAN

Duration: 2.3s
```

发现威胁时的输出示例：

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 2

  [MALICIOUS] /home/user/downloads/invoice.exe
    Match: SHA-256 hash (MalwareBazaar)
    Family: Emotet
    Action: None (use --auto-quarantine to isolate)

  [SUSPICIOUS] /home/user/downloads/tool.bin
    Match: Heuristic analysis
    Score: 45/100
    Findings: High entropy (7.8), UPX packed
    Action: None

Duration: 3.1s
```

## 第 4 步：查看结果并采取措施

生成详细的 JSON 报告，适用于自动化处理或日志采集：

```bash
sd scan /home --recursive --json
```

```json
{
  "scan_id": "a1b2c3d4",
  "timestamp": "2026-03-21T10:00:00Z",
  "files_scanned": 1847,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "detection_layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924..."
    }
  ],
  "duration_ms": 3100
}
```

在扫描时自动隔离检测到的威胁：

```bash
sd scan /home --recursive --auto-quarantine
```

被隔离的文件会被移动到一个安全的加密目录中。你可以查看和恢复它们：

```bash
# 列出隔离区文件
sd quarantine list

# 通过隔离 ID 恢复文件
sd quarantine restore QR-20260321-001
```

::: warning 隔离区
隔离区中的文件经过加密，无法被意外执行。仅在确认文件为误报时才使用 `sd quarantine restore` 恢复。
:::

## 第 5 步：启用实时监控

启动实时监控以监视目录中新增或修改的文件：

```bash
sd monitor /home /tmp /var/www
```

监控在前台运行，当文件被创建或修改时立即扫描：

```
[INFO] Monitoring 3 directories...
[INFO] Press Ctrl+C to stop.
[2026-03-21 10:05:32] SCAN /home/user/downloads/update.bin → CLEAN
[2026-03-21 10:07:15] SCAN /tmp/payload.sh → [MALICIOUS] YARA: linux_backdoor_reverse_shell
```

将监控作为后台服务运行：

```bash
# 安装并启动 systemd 服务
sd service install
sd service start

# 检查服务状态
sd service status
```

## 当前状态一览

完成以上步骤后，你的系统具备了以下能力：

| 组件 | 状态 |
|------|------|
| `sd` 二进制文件 | 已安装到 PATH |
| 哈希数据库 | 28,000+ SHA-256/MD5 哈希存储于 LMDB |
| YARA 规则 | 来自 8 个来源的 38,800+ 规则 |
| 实时监控 | 正在监视指定目录 |

## 下一步

- [文件与目录扫描](../scanning/file-scan) —— 了解 `sd scan` 的所有选项，包括线程数、排除规则和大小限制
- [内存扫描](../scanning/memory-scan) —— 扫描运行中进程的内存以发现内存威胁
- [Rootkit 检测](../scanning/rootkit) —— 检查内核级和用户空间 Rootkit
- [检测引擎](../detection/) —— 了解多层流水线的工作原理
- [YARA 规则](../detection/yara-rules) —— 了解规则来源和自定义规则
