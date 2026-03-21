---
title: 文件与目录扫描
description: sd scan 命令完整参考。使用哈希匹配、YARA 规则和启发式分析对文件和目录进行恶意软件扫描。
---

# 文件与目录扫描

`sd scan` 命令是检查文件和目录中恶意软件的主要方式。它会将每个文件送入多层检测流水线——哈希匹配、YARA 规则和启发式分析——并为每个文件给出检测结论。

## 基本用法

扫描单个文件：

```bash
sd scan /path/to/file
```

扫描目录（默认不递归）：

```bash
sd scan /home/user/downloads
```

递归扫描目录及其所有子目录：

```bash
sd scan /home --recursive
```

## 命令选项

| 选项 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--recursive` | `-r` | 关闭 | 递归扫描子目录 |
| `--json` | `-j` | 关闭 | 以 JSON 格式输出结果 |
| `--threads` | `-t` | CPU 核心数 | 并行扫描线程数 |
| `--auto-quarantine` | `-q` | 关闭 | 自动隔离检测到的威胁 |
| `--remediate` | | 关闭 | 尝试自动修复（根据策略删除/隔离） |
| `--exclude` | `-e` | 无 | 排除文件或目录的 Glob 模式 |
| `--report` | | 无 | 将扫描报告写入指定路径 |
| `--max-size-mb` | | 100 | 跳过超过此大小（MB）的文件 |
| `--no-yara` | | 关闭 | 跳过 YARA 规则扫描 |
| `--no-heuristics` | | 关闭 | 跳过启发式分析 |
| `--min-severity` | | `suspicious` | 最低报告级别（`suspicious` 或 `malicious`） |

## 检测流程

`sd scan` 处理文件时，按顺序通过检测流水线：

```
文件 → 魔数检测 → 判定文件类型
  │
  ├─ 第 1 层：SHA-256 哈希查找（LMDB）
  │   命中 → MALICIOUS（即时完成，每文件约 1μs）
  │
  ├─ 第 2 层：YARA-X 规则扫描（38,800+ 规则）
  │   命中 → MALICIOUS 并附带规则名
  │
  ├─ 第 3 层：启发式分析（按文件类型区分）
  │   评分 ≥ 60 → MALICIOUS
  │   评分 30-59 → SUSPICIOUS
  │   评分 < 30 → CLEAN
  │
  └─ 结果聚合 → 取最高威胁等级
```

流水线支持短路：如果哈希匹配命中，该文件将跳过 YARA 和启发式分析。这使得扫描大目录非常快——大多数干净文件在哈希层就能在微秒内完成判定。

## 输出格式

### 人类可读（默认）

```bash
sd scan /home/user/downloads --recursive
```

```
PRX-SD Scan Report
==================
Scanned: 3,421 files (1.2 GB)
Skipped: 14 files (exceeded max size)
Threats: 3 (2 malicious, 1 suspicious)

  [MALICIOUS] /home/user/downloads/invoice.exe
    Layer:   Hash match (SHA-256)
    Source:  MalwareBazaar
    Family:  Emotet
    SHA-256: e3b0c44298fc1c149afbf4c8996fb924...

  [MALICIOUS] /home/user/downloads/patch.scr
    Layer:   YARA rule
    Rule:    win_ransomware_lockbit3
    Source:  ReversingLabs

  [SUSPICIOUS] /home/user/downloads/updater.bin
    Layer:   Heuristic analysis
    Score:   42/100
    Findings:
      - High section entropy: 7.91 (packed)
      - Suspicious API imports: VirtualAllocEx, WriteProcessMemory
      - Non-standard PE timestamp

Duration: 5.8s (589 files/s)
```

### JSON 输出

```bash
sd scan /path --recursive --json
```

```json
{
  "scan_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2026-03-21T14:30:00Z",
  "files_scanned": 3421,
  "files_skipped": 14,
  "total_bytes": 1288490188,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
      "md5": "d41d8cd98f00b204e9800998ecf8427e"
    }
  ],
  "duration_ms": 5800,
  "throughput_files_per_sec": 589
}
```

### 报告文件

将结果写入文件以供存档：

```bash
sd scan /srv/web --recursive --report /var/log/prx-sd/scan-report.json
```

## 排除模式

使用 `--exclude` 跳过匹配 Glob 模式的文件或目录。可指定多个模式：

```bash
sd scan /home --recursive \
  --exclude "*.log" \
  --exclude "node_modules/**" \
  --exclude ".git/**" \
  --exclude "/home/user/VMs/**"
```

::: tip 性能优化
排除 `node_modules`、`.git` 和虚拟机镜像等大型目录可以显著提升扫描速度。
:::

## 自动隔离

`--auto-quarantine` 标志会在扫描过程中将检测到的威胁移入隔离保管库：

```bash
sd scan /tmp --recursive --auto-quarantine
```

```
[MALICIOUS] /tmp/dropper.exe → Quarantined (QR-20260321-007)
```

被隔离的文件使用 AES-256 加密，存储在 `~/.local/share/prx-sd/quarantine/` 中，无法被意外执行。详情请参阅[隔离区文档](../quarantine/)。

## 应用场景

### CI/CD 流水线扫描

在部署前扫描构建产物：

```bash
sd scan ./dist --recursive --json --min-severity suspicious
```

使用退出码进行自动化：`0` = 无威胁，`1` = 发现威胁，`2` = 扫描出错。

### Web 服务器每日扫描

定时对 Web 可访问目录进行夜间扫描：

```bash
sd scan /var/www /srv/uploads --recursive \
  --auto-quarantine \
  --report /var/log/prx-sd/daily-$(date +%Y%m%d).json \
  --exclude "*.log"
```

### 取证调查

以只读方式挂载磁盘镜像并扫描：

```bash
sudo mount -o ro /dev/sdb1 /mnt/evidence
sd scan /mnt/evidence --recursive --json --threads 1 --max-size-mb 500
```

::: warning 大规模扫描
扫描数百万文件时，请使用 `--threads` 控制资源占用，使用 `--max-size-mb` 跳过过大的文件以避免拖慢扫描。
:::

### 家目录快速检查

快速扫描常见威胁位置：

```bash
sd scan ~/Downloads ~/Desktop /tmp --recursive
```

## 性能调优

| 文件数 | 大致耗时 | 说明 |
|--------|----------|------|
| 1,000 | < 1 秒 | 哈希层解决大部分文件 |
| 10,000 | 2-5 秒 | YARA 规则每文件增加约 0.3ms |
| 100,000 | 20-60 秒 | 取决于文件大小和类型 |
| 1,000,000+ | 5-15 分钟 | 建议使用 `--threads` 和 `--exclude` |

影响扫描速度的因素：

- **磁盘 I/O** —— SSD 的随机读取速度比 HDD 快 5-10 倍
- **文件大小分布** —— 大量小文件比少量大文件扫描更快
- **检测层** —— 仅哈希扫描（`--no-yara --no-heuristics`）速度最快
- **线程数** —— 在多核系统和高速存储上，更多线程能带来更好的性能

## 下一步

- [内存扫描](./memory-scan) —— 扫描运行中进程的内存
- [Rootkit 检测](./rootkit) —— 检查内核级威胁
- [USB 扫描](./usb-scan) —— 扫描可移动存储设备
- [检测引擎](../detection/) —— 各检测层的工作原理
