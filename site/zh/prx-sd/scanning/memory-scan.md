---
title: 进程内存扫描
description: 使用 sd scan-memory 扫描运行中进程的内存，检测内存恶意软件、无文件威胁和注入代码。
---

# 进程内存扫描

`sd scan-memory` 命令扫描运行中进程的内存，以检测无文件恶意软件、注入的 Shellcode 以及从不落盘的内存威胁。这对于捕获那些能够绕过传统文件扫描的高级威胁至关重要。

::: warning 运行要求
- **需要 root 权限** —— 内存扫描需要读取 `/proc/<pid>/mem`，这需要 root 或 `CAP_SYS_PTRACE` 权限。
- **仅支持 Linux** —— 进程内存扫描目前仅在 Linux 上支持。macOS 支持已在计划中。
:::

## 工作原理

进程内存扫描读取运行中进程的虚拟内存映射，并应用与文件扫描相同的检测流水线：

1. **枚举内存区域** —— 解析 `/proc/<pid>/maps` 以查找可读内存段（堆、栈、匿名映射、映射文件）。
2. **读取内存内容** —— 从 `/proc/<pid>/mem` 读取各个区域。
3. **YARA 规则扫描** —— 应用针对内存优化的 YARA 规则，检测 Shellcode 模式、注入的 DLL 以及已知的内存恶意软件签名。
4. **模式分析** —— 检查可疑模式，例如 RWX 内存区域、非文件支持映射中的 PE 头、已知的漏洞利用载荷等。

## 基本用法

扫描所有运行中的进程：

```bash
sudo sd scan-memory
```

按 PID 扫描指定进程：

```bash
sudo sd scan-memory --pid 1234
```

扫描多个指定进程：

```bash
sudo sd scan-memory --pid 1234 --pid 5678 --pid 9012
```

## 命令选项

| 选项 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--pid` | `-p` | 全部 | 仅扫描指定的进程 ID（可重复使用） |
| `--json` | `-j` | 关闭 | 以 JSON 格式输出结果 |
| `--exclude-pid` | | 无 | 排除指定 PID 的进程 |
| `--exclude-user` | | 无 | 排除指定用户的进程 |
| `--min-region-size` | | 4096 | 扫描的最小内存区域大小（字节） |
| `--skip-mapped-files` | | 关闭 | 跳过有文件支持的内存区域 |

## 输出示例

```bash
sudo sd scan-memory
```

```
PRX-SD Memory Scan Report
=========================
Processes scanned: 142
Memory regions scanned: 8,451
Total memory scanned: 4.2 GB

  [MALICIOUS] PID 3847 (svchost)
    Region:  0x7f4a00000000-0x7f4a00040000 (anon, RWX)
    Match:   YARA rule: memory_cobalt_strike_beacon
    Details: CobaltStrike Beacon shellcode detected in anonymous RWX mapping

  [SUSPICIOUS] PID 12045 (python3)
    Region:  0x7f8b10000000-0x7f8b10010000 (anon, RWX)
    Match:   Pattern analysis
    Details: Executable code in anonymous RWX region, possible shellcode injection

Duration: 12.4s
```

### JSON 输出

```bash
sudo sd scan-memory --pid 3847 --json
```

```json
{
  "scan_type": "memory",
  "timestamp": "2026-03-21T15:00:00Z",
  "processes_scanned": 1,
  "regions_scanned": 64,
  "threats": [
    {
      "pid": 3847,
      "process_name": "svchost",
      "region_start": "0x7f4a00000000",
      "region_end": "0x7f4a00040000",
      "region_perms": "rwx",
      "region_type": "anonymous",
      "verdict": "malicious",
      "rule": "memory_cobalt_strike_beacon",
      "description": "CobaltStrike Beacon shellcode detected"
    }
  ]
}
```

## 使用场景

### 应急响应

在活跃的安全事件调查中，扫描所有进程以定位被入侵的服务：

```bash
sudo sd scan-memory --json > /evidence/memory-scan-$(date +%s).json
```

### 无文件恶意软件检测

现代恶意软件经常完全在内存中执行，不会写入磁盘。常见手法包括：

- **进程注入** —— 恶意软件通过 `ptrace` 或 `/proc/pid/mem` 写入将代码注入合法进程
- **反射式 DLL 加载** —— 直接从内存加载 DLL 而不接触文件系统
- **Shellcode 执行** —— 在 RWX 内存中分配并直接执行原始 Shellcode

`sd scan-memory` 通过以下指标检测这些模式：

| 指标 | 说明 |
|------|------|
| RWX 匿名映射 | 非文件支持内存中的可执行代码 |
| 内存中的 PE 头 | Linux 进程内存中出现 Windows PE 结构（跨平台载荷） |
| 已知 Shellcode 签名 | Metasploit、CobaltStrike、Sliver Beacon 模式 |
| 可疑系统调用桩 | 被 Hook 或修改的系统调用入口点 |

### 服务器健康检查

在生产服务器上定期执行内存扫描：

```bash
# 添加到 cron：每 6 小时扫描一次
0 */6 * * * root /usr/local/bin/sd scan-memory --json --exclude-user nobody >> /var/log/prx-sd/memory-scan.log 2>&1
```

::: tip 性能影响
内存扫描会读取进程内存，可能会短暂增加 I/O 负载。在生产服务器上，建议在低流量时段执行扫描，或排除非关键进程。
:::

## 局限性

- 内存扫描读取的是扫描时刻的进程内存快照。快速变化的内存区域可能产生不完整的结果。
- `scan-memory` 不扫描内核内存。如需内核级威胁检测，请使用 `sd check-rootkit`。
- 高度混淆或加密的内存载荷可能绕过 YARA 规则。模式分析层提供了辅助检测机制。

## 下一步

- [Rootkit 检测](./rootkit) —— 检测内核和用户空间 Rootkit
- [文件与目录扫描](./file-scan) —— 传统的文件扫描方式
- [YARA 规则](../detection/yara-rules) —— 了解用于内存扫描的规则引擎
- [检测引擎](../detection/) —— 所有检测层如何协同工作
