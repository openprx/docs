---
title: 导入哈希
description: 将自定义哈希黑名单和 ClamAV 签名数据库导入 PRX-SD。
---

# 导入哈希

PRX-SD 允许导入自定义哈希黑名单和 ClamAV 签名数据库，以便通过自有威胁情报或组织级黑名单扩展检测覆盖范围。

## 导入自定义哈希

### 用法

```bash
sd import [OPTIONS] <FILE>
```

### 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--format` | `-f` | 自动检测 | 哈希格式：`sha256`、`sha1`、`md5`、`auto` |
| `--label` | `-l` | 文件名 | 导入集的标签名称 |
| `--replace` | | `false` | 替换具有相同标签的现有条目 |
| `--dry-run` | | `false` | 仅验证文件而不导入 |
| `--quiet` | `-q` | `false` | 抑制进度输出 |

### 支持的哈希文件格式

PRX-SD 接受多种常见格式：

**纯列表** -- 每行一个哈希值：

```
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

**哈希加标签** -- 哈希值后跟空格和可选描述：

```
e3b0c44298fc1c149afbf4c8996fb924  empty_file
d7a8fbb307d7809469ca9abcb0082e4f  known_malware_sample
```

**CSV 格式** -- 带表头的逗号分隔格式：

```csv
hash,family,source
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855,Emotet,internal
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592,TrickBot,partner
```

**注释行** -- 以 `#` 开头的行会被忽略：

```
# 自定义黑名单 - 更新于 2026-03-21
# 来源：内部威胁狩猎团队
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

::: tip
哈希格式根据长度自动检测：32 字符 = MD5，40 字符 = SHA-1，64 字符 = SHA-256。如果自动检测失败，可使用 `--format` 手动指定。
:::

### 导入示例

```bash
# 导入 SHA-256 黑名单
sd import threat_hashes.txt

# 指定格式和标签导入
sd import --format md5 --label "partner-feed-2026Q1" partner_hashes.txt

# 试运行以验证文件
sd import --dry-run suspicious_hashes.csv

# 替换现有的导入集
sd import --replace --label "daily-feed" today_hashes.txt
```

### 导入输出

```
Importing hashes from threat_hashes.txt...
  Format:    SHA-256 (auto-detected)
  Label:     threat_hashes
  Total:     1,247 lines
  Valid:     1,203 hashes
  Skipped:   44 (duplicates: 38, invalid: 6)
  Imported:  1,203 new entries
  Database:  ~/.prx-sd/signatures/hashes/custom.lmdb
```

## 导入 ClamAV 数据库

### 用法

```bash
sd import-clamav [OPTIONS] <FILE>
```

### 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--type` | `-t` | 自动检测 | 数据库类型：`cvd`、`cld`、`hdb`、`hsb`、`auto` |
| `--quiet` | `-q` | `false` | 抑制进度输出 |

### 支持的 ClamAV 格式

| 格式 | 扩展名 | 说明 |
|------|--------|------|
| **CVD** | `.cvd` | ClamAV 病毒数据库（压缩、已签名） |
| **CLD** | `.cld` | ClamAV 本地数据库（增量更新） |
| **HDB** | `.hdb` | MD5 哈希数据库（纯文本） |
| **HSB** | `.hsb` | SHA-256 哈希数据库（纯文本） |
| **NDB** | `.ndb` | 扩展签名格式（基于内容体） |

::: warning
CVD/CLD 文件可能非常大。仅 `main.cvd` 就包含超过 600 万条签名，导入后需要约 300 MB 磁盘空间。
:::

### ClamAV 导入示例

```bash
# 导入 ClamAV 主数据库
sd import-clamav /var/lib/clamav/main.cvd

# 导入每日更新数据库
sd import-clamav /var/lib/clamav/daily.cvd

# 导入纯文本哈希数据库
sd import-clamav custom_sigs.hdb

# 导入 SHA-256 哈希数据库
sd import-clamav my_hashes.hsb
```

### 配置 ClamAV 集成

要在 PRX-SD 中使用 ClamAV 签名：

1. 安装 freshclam（ClamAV 更新器）：

```bash
# Debian/Ubuntu
sudo apt install clamav

# macOS
brew install clamav

# Fedora/RHEL
sudo dnf install clamav-update
```

2. 下载数据库：

```bash
sudo freshclam
```

3. 导入到 PRX-SD：

```bash
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

4. 在配置中启用 ClamAV：

```toml
[signatures.sources]
clamav = true
```

## 管理已导入的哈希

查看已导入的哈希集：

```bash
sd info --imports
```

```
Custom Hash Imports:
  threat_hashes       1,203 SHA-256  imported 2026-03-21
  partner-feed-2026Q1   847 MD5      imported 2026-03-15
  daily-feed          2,401 SHA-256  imported 2026-03-21

ClamAV Imports:
  main.cvd            6,234,109 sigs  imported 2026-03-20
  daily.cvd           1,847,322 sigs  imported 2026-03-21
```

删除已导入的集：

```bash
sd import --remove --label "partner-feed-2026Q1"
```

## 后续步骤

- [自定义 YARA 规则](./custom-rules) -- 编写基于模式的检测规则
- [签名来源](./sources) -- 所有可用的威胁情报来源
- [更新签名](./update) -- 保持数据库为最新状态
- [威胁情报概览](./index) -- 数据库架构
