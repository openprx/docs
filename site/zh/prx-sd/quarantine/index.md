---
title: 隔离区管理
description: 管理隔离的威胁文件，使用 AES-256-GCM 加密保险库，恢复文件并查看隔离统计信息。
---

# 隔离区管理

当 PRX-SD 检测到威胁时，可以将文件隔离到加密的隔离保险库中。被隔离的文件使用 AES-256-GCM 加密、重命名，并移动到一个安全目录中，防止被意外执行。所有原始元数据均被保留，用于取证分析。

## 隔离工作原理

```
检测到威胁
  1. 生成随机 AES-256-GCM 密钥
  2. 加密文件内容
  3. 将加密数据存入 vault.bin
  4. 以 JSON 格式保存元数据（原始路径、哈希、检测信息）
  5. 从磁盘删除原始文件
  6. 记录隔离事件日志
```

隔离保险库存储在 `~/.prx-sd/quarantine/`：

```
~/.prx-sd/quarantine/
  vault.bin                    # 加密文件存储（仅追加）
  index.json                   # 隔离索引及元数据
  entries/
    a1b2c3d4.json             # 单条隔离记录元数据
    e5f6g7h8.json
```

每条隔离记录包含：

```json
{
  "id": "a1b2c3d4",
  "original_path": "/tmp/payload.exe",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
  "file_size": 245760,
  "detection": {
    "engine": "yara",
    "rule": "Win_Trojan_AgentTesla",
    "severity": "malicious"
  },
  "quarantined_at": "2026-03-21T10:15:32Z",
  "vault_offset": 1048576,
  "vault_length": 245792
}
```

::: tip
隔离保险库使用认证加密（AES-256-GCM），既能防止被隔离的恶意软件被意外执行，也能防止证据被篡改。
:::

## 列出隔离文件

```bash
sd quarantine list [OPTIONS]
```

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--json` | | `false` | 以 JSON 格式输出 |
| `--sort` | `-s` | `date` | 排序方式：`date`、`name`、`size`、`severity` |
| `--filter` | `-f` | | 按严重级别过滤：`malicious`、`suspicious` |
| `--limit` | `-n` | all | 最大显示条目数 |

### 示例

```bash
sd quarantine list
```

```
Quarantine Vault (4 entries, 1.2 MB)

ID        Date                 Size     Severity   Detection              Original Path
a1b2c3d4  2026-03-21 10:15:32  240 KB   malicious  Win_Trojan_AgentTesla  /tmp/payload.exe
e5f6g7h8  2026-03-20 14:22:01  512 KB   malicious  Ransom_LockBit3       /home/user/doc.pdf.lockbit
c9d0e1f2  2026-03-19 09:45:18  32 KB    suspicious  Suspicious_Script     /var/www/upload/shell.php
b3a4c5d6  2026-03-18 16:30:55  384 KB   malicious  SHA256_Match          /tmp/dropper.bin
```

## 恢复文件

将隔离的文件恢复到原始位置或指定路径：

```bash
sd quarantine restore <ID> [OPTIONS]
```

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--to` | `-t` | 原始路径 | 恢复到其他位置 |
| `--force` | `-f` | `false` | 如果目标文件存在则覆盖 |

::: warning
恢复隔离文件会将已知的恶意或可疑文件重新放回磁盘。仅在确认为误报或需要在隔离环境中进行分析时才恢复文件。
:::

### 示例

```bash
# 恢复到原始位置
sd quarantine restore a1b2c3d4

# 恢复到指定目录进行分析
sd quarantine restore a1b2c3d4 --to /tmp/analysis/

# 如果目标文件存在则强制覆盖
sd quarantine restore a1b2c3d4 --to /tmp/analysis/ --force
```

## 删除隔离文件

永久删除隔离条目：

```bash
# 删除单条记录
sd quarantine delete <ID>

# 删除所有记录
sd quarantine delete-all

# 删除 30 天前的记录
sd quarantine delete --older-than 30d

# 删除指定严重级别的所有记录
sd quarantine delete --filter malicious
```

删除时，加密数据会先被全零覆盖，然后从保险库中移除。

::: warning
删除操作不可逆。加密文件数据和元数据在删除后无法恢复。建议在删除前导出存档。
:::

## 隔离统计

查看隔离保险库的汇总统计信息：

```bash
sd quarantine stats
```

```
Quarantine Statistics
  Total entries:       47
  Total size:          28.4 MB (encrypted)
  Oldest entry:        2026-02-15
  Newest entry:        2026-03-21

  By severity:
    Malicious:         31 (65.9%)
    Suspicious:        16 (34.1%)

  By detection engine:
    YARA rules:        22 (46.8%)
    Hash match:        15 (31.9%)
    Heuristic:          7 (14.9%)
    Ransomware:         3 (6.4%)

  Top detections:
    Win_Trojan_Agent    8 entries
    Ransom_LockBit3     5 entries
    SHA256_Match        5 entries
    Suspicious_Script   4 entries
```

## 自动隔离

在扫描或监控期间启用自动隔离：

```bash
# 扫描时自动隔离
sd scan /tmp --auto-quarantine

# 监控时自动隔离
sd monitor --auto-quarantine /home /tmp

# 守护进程自动隔离
sd daemon start --auto-quarantine
```

或在配置中设为默认策略：

```toml
[policy]
on_malicious = "quarantine"
on_suspicious = "report"
```

## 导出隔离数据

导出隔离元数据用于报告或 SIEM 集成：

```bash
# 导出所有元数据为 JSON
sd quarantine list --json > quarantine_report.json

# 导出统计信息为 JSON
sd quarantine stats --json > quarantine_stats.json
```

## 后续步骤

- [威胁响应](/zh/prx-sd/remediation/) -- 配置隔离之外的响应策略
- [文件监控](/zh/prx-sd/realtime/monitor) -- 带自动隔离的实时防护
- [Webhook 告警](/zh/prx-sd/alerts/webhook) -- 文件隔离时获取通知
- [威胁情报](/zh/prx-sd/signatures/) -- 签名数据库概览
