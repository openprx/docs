---
title: USB 设备扫描
description: 使用 sd scan-usb 在可移动 USB 存储设备连接时自动检测并扫描其中的恶意软件。
---

# USB 设备扫描

`sd scan-usb` 命令检测已连接的可移动 USB 存储设备并扫描其内容中的恶意软件。这对于 USB 驱动器作为常见恶意软件传播媒介的环境至关重要，例如隔离网络、共享工作站和工业控制系统。

## 工作原理

`sd scan-usb` 调用时执行以下步骤：

1. **设备发现** —— 通过 `/sys/block/` 枚举块设备，识别可移动设备（USB 大容量存储）。
2. **挂载检测** —— 检查设备是否已挂载。如果未挂载，可选择以只读模式将其挂载到临时目录。
3. **全面扫描** —— 对设备上的所有文件运行完整的检测流水线（哈希匹配、YARA 规则、启发式分析）。
4. **输出报告** —— 生成包含每个文件检测结论的扫描报告。

::: tip 自动挂载
默认情况下，`sd scan-usb` 扫描已挂载的设备。使用 `--auto-mount` 可自动以只读模式挂载未挂载的 USB 设备进行扫描。
:::

## 基本用法

扫描所有已连接的 USB 存储设备：

```bash
sd scan-usb
```

输出示例：

```
PRX-SD USB Scan
===============
Detected USB devices:
  /dev/sdb1 → /media/user/USB_DRIVE (vfat, 16 GB)

Scanning /media/user/USB_DRIVE...
Scanned: 847 files (2.1 GB)
Threats: 1

  [MALICIOUS] /media/user/USB_DRIVE/autorun.exe
    Layer:   YARA rule
    Rule:    win_worm_usb_spreader
    Details: USB worm with autorun.inf exploitation

Duration: 4.2s
```

## 命令选项

| 选项 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--auto-quarantine` | `-q` | 关闭 | 自动隔离检测到的威胁 |
| `--auto-mount` | | 关闭 | 以只读模式挂载未挂载的 USB 设备 |
| `--device` | `-d` | 全部 | 仅扫描指定设备（如 `/dev/sdb1`） |
| `--json` | `-j` | 关闭 | 以 JSON 格式输出结果 |
| `--eject-after` | | 关闭 | 扫描后安全弹出设备 |
| `--max-size-mb` | | 100 | 跳过超过此大小的文件 |

## 自动隔离

自动隔离在 USB 设备上发现的威胁：

```bash
sd scan-usb --auto-quarantine
```

```
Scanning /media/user/USB_DRIVE...
  [MALICIOUS] /media/user/USB_DRIVE/autorun.exe → Quarantined (QR-20260321-012)
  [MALICIOUS] /media/user/USB_DRIVE/.hidden/payload.bin → Quarantined (QR-20260321-013)

Threats quarantined: 2
Safe to use: Review remaining files before opening.
```

::: warning 重要提示
使用 `--auto-quarantine` 进行 USB 扫描时，恶意文件会被移入宿主机上的本地隔离保管库，而非从 USB 设备上删除。USB 上的原始文件仍然存在，除非同时使用 `--remediate`。
:::

## 扫描指定设备

如果连接了多个 USB 设备，可以扫描指定的设备：

```bash
sd scan-usb --device /dev/sdb1
```

列出检测到的 USB 设备而不扫描：

```bash
sd scan-usb --list
```

```
Detected USB storage devices:
  1. /dev/sdb1  Kingston DataTraveler  16 GB  vfat  Mounted: /media/user/USB_DRIVE
  2. /dev/sdc1  SanDisk Ultra          64 GB  exfat Not mounted
```

## JSON 输出

```bash
sd scan-usb --json
```

```json
{
  "scan_type": "usb",
  "timestamp": "2026-03-21T17:00:00Z",
  "devices": [
    {
      "device": "/dev/sdb1",
      "label": "USB_DRIVE",
      "filesystem": "vfat",
      "size_gb": 16,
      "mount_point": "/media/user/USB_DRIVE",
      "files_scanned": 847,
      "threats": [
        {
          "path": "/media/user/USB_DRIVE/autorun.exe",
          "verdict": "malicious",
          "layer": "yara",
          "rule": "win_worm_usb_spreader"
        }
      ]
    }
  ]
}
```

## 常见 USB 威胁

USB 设备经常被用于传播以下类型的恶意软件：

| 威胁类型 | 说明 | 检测层 |
|----------|------|--------|
| 自动运行蠕虫 | 利用 `autorun.inf` 在 Windows 上自动执行 | YARA 规则 |
| USB 投放器 | 伪装的可执行文件（如 `document.pdf.exe`） | 启发式 + YARA |
| BadUSB 载荷 | 针对 HID 模拟攻击的脚本 | 文件分析 |
| 勒索软件载体 | 复制时激活的加密载荷 | 哈希 + YARA |
| 数据窃取工具 | 设计用于收集和提取数据的工具 | 启发式分析 |

## 与实时监控集成

你可以将 USB 扫描与 `sd monitor` 守护进程结合，在 USB 设备连接时自动扫描：

```bash
sd monitor --watch-usb /home /tmp
```

这会启动实时文件监控并添加 USB 自动扫描功能。当通过 udev 检测到新的 USB 设备时，会自动执行扫描。

::: tip 自助终端模式
对于公共终端或共享工作站，可以将 `--watch-usb` 与 `--auto-quarantine` 结合使用，无需用户干预即可自动消除 USB 设备带来的威胁。
:::

## 下一步

- [文件与目录扫描](./file-scan) —— `sd scan` 完整参考
- [内存扫描](./memory-scan) —— 扫描运行中进程的内存
- [Rootkit 检测](./rootkit) —— 检查系统级威胁
- [检测引擎](../detection/) —— 多层流水线的工作原理
