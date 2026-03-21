---
title: Rootkit 检测
description: 使用 sd check-rootkit 在 Linux 上检测内核级和用户空间 Rootkit。检查隐藏进程、内核模块、系统调用 Hook 等。
---

# Rootkit 检测

`sd check-rootkit` 命令执行深度系统完整性检查，以检测内核级和用户空间 Rootkit。Rootkit 是最危险的恶意软件类型之一，因为它们能够对标准系统工具隐藏自身存在，使得传统文件扫描器无法发现。

::: warning 运行要求
- **需要 root 权限** —— Rootkit 检测需要读取内核数据结构和系统内部信息。
- **仅支持 Linux** —— 此功能依赖 `/proc`、`/sys` 和 Linux 特有的内核接口。
:::

## 检测内容

PRX-SD 从多个维度检查 Rootkit 的存在：

### 内核级检查

| 检查项 | 说明 |
|--------|------|
| 隐藏内核模块 | 对比 `/proc/modules` 中加载的模块与 `sysfs` 条目，查找不一致 |
| 系统调用表 Hook | 验证系统调用表条目是否与已知正常的内核符号一致 |
| `/proc` 不一致 | 检测对 `/proc` 隐藏但通过其他接口可见的进程 |
| 内核符号篡改 | 检查关键内核结构中的函数指针是否被修改 |
| 中断描述符表 | 验证 IDT 条目是否有异常修改 |

### 用户空间检查

| 检查项 | 说明 |
|--------|------|
| 隐藏进程 | 将 `readdir(/proc)` 结果与暴力 PID 枚举进行交叉比对 |
| LD_PRELOAD 注入 | 检查通过 `LD_PRELOAD` 或 `/etc/ld.so.preload` 加载的恶意共享库 |
| 系统命令替换 | 验证关键系统二进制文件（`ls`、`ps`、`netstat`、`ss`、`lsof`）的完整性 |
| 隐藏文件 | 检测通过拦截 `getdents` 系统调用而隐藏的文件 |
| 可疑 cron 条目 | 扫描 crontab 中是否存在混淆或编码的命令 |
| Systemd 服务篡改 | 检查是否存在未授权或被修改的 systemd 单元 |
| SSH 后门 | 查找未授权的 SSH 密钥、被修改的 `sshd_config` 或被篡改的 `sshd` 二进制文件 |
| 网络监听 | 识别 `ss`/`netstat` 未显示的隐藏网络套接字 |

## 基本用法

执行完整的 Rootkit 检查：

```bash
sudo sd check-rootkit
```

输出示例：

```
PRX-SD Rootkit Check
====================
System: Linux 6.12.48 x86_64
Checks: 14 performed

Kernel Checks:
  [PASS] Kernel module list consistency
  [PASS] System call table integrity
  [PASS] /proc filesystem consistency
  [PASS] Kernel symbol verification
  [PASS] Interrupt descriptor table

Userspace Checks:
  [PASS] Hidden process detection
  [WARN] LD_PRELOAD check
    /etc/ld.so.preload exists with entry: /usr/lib/libfakeroot.so
  [PASS] Critical binary integrity
  [PASS] Hidden file detection
  [PASS] Cron entry audit
  [PASS] Systemd service audit
  [PASS] SSH configuration check
  [PASS] Network listener verification
  [PASS] /dev suspicious entries

Summary: 13 passed, 1 warning, 0 critical
```

## 命令选项

| 选项 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--json` | `-j` | 关闭 | 以 JSON 格式输出结果 |
| `--kernel-only` | | 关闭 | 仅执行内核级检查 |
| `--userspace-only` | | 关闭 | 仅执行用户空间检查 |
| `--baseline` | | 无 | 用于比对的基线文件路径 |
| `--save-baseline` | | 无 | 将当前状态保存为基线 |

## 基线对比

为了持续监控，可以创建已知正常系统状态的基线，并在后续检查中与之对比：

```bash
# 在已知干净的系统上创建基线
sudo sd check-rootkit --save-baseline /etc/prx-sd/rootkit-baseline.json

# 后续检查与基线对比
sudo sd check-rootkit --baseline /etc/prx-sd/rootkit-baseline.json
```

基线记录了内核模块列表、系统调用表哈希、关键二进制文件校验和以及网络监听状态。任何偏差都会触发告警。

## JSON 输出

```bash
sudo sd check-rootkit --json
```

```json
{
  "timestamp": "2026-03-21T16:00:00Z",
  "system": {
    "kernel": "6.12.48",
    "arch": "x86_64",
    "hostname": "web-server-01"
  },
  "checks": [
    {
      "name": "kernel_modules",
      "category": "kernel",
      "status": "pass",
      "details": "142 modules, all consistent"
    },
    {
      "name": "ld_preload",
      "category": "userspace",
      "status": "warning",
      "details": "/etc/ld.so.preload contains: /usr/lib/libfakeroot.so",
      "recommendation": "Verify this entry is expected. Remove if unauthorized."
    }
  ],
  "summary": {
    "total": 14,
    "passed": 13,
    "warnings": 1,
    "critical": 0
  }
}
```

## 示例：检测内核模块 Rootkit

当 Rootkit 隐藏了一个内核模块时，`sd check-rootkit` 会检测到不一致：

```
Kernel Checks:
  [CRITICAL] Kernel module list consistency
    Module found in /sys/module/ but missing from /proc/modules:
      - syskit (size: 45056, loaded at: 0xffffffffc0a00000)
    This is a strong indicator of a hidden kernel module rootkit.
    Recommendation: Boot from trusted media and investigate.
```

::: warning 严重发现
Rootkit 检查中的 `CRITICAL` 发现应视为严重安全事件。不要在可能已被入侵的系统上尝试修复。应立即隔离机器，并从可信介质启动进行调查。
:::

## 定期检查调度

将 Rootkit 检查添加到日常监控流程中：

```bash
# Cron：每 4 小时检查一次
0 */4 * * * root /usr/local/bin/sd check-rootkit --json >> /var/log/prx-sd/rootkit-check.log 2>&1
```

## 下一步

- [内存扫描](./memory-scan) —— 检测运行中进程的内存威胁
- [文件与目录扫描](./file-scan) —— 传统的文件扫描方式
- [USB 扫描](./usb-scan) —— 可移动存储设备连接时自动扫描
- [检测引擎](../detection/) —— 所有检测层概览
