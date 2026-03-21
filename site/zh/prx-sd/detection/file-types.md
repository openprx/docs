---
title: 支持的文件类型
description: PRX-SD 支持的文件类型矩阵。通过魔数检测识别 PE、ELF、Mach-O、PDF、Office、压缩包和脚本文件，支持递归解压扫描。
---

# 支持的文件类型

PRX-SD 使用魔数检测（检查文件开头字节）而非依赖文件扩展名来识别文件类型。这确保了即使文件被重命名或扩展名缺失，也能准确识别。

## 文件类型矩阵

下表展示了所有支持的文件类型及各检测层的适用情况：

| 文件类型 | 扩展名 | 魔数字节 | 哈希 | YARA | 启发式 | 压缩包递归 |
|----------|--------|----------|------|------|--------|-----------|
| **PE（Windows）** | .exe, .dll, .sys, .scr, .ocx | `4D 5A` (MZ) | 是 | 是 | 是 | -- |
| **ELF（Linux）** | .so, .o, （无扩展名） | `7F 45 4C 46` | 是 | 是 | 是 | -- |
| **Mach-O（macOS）** | .dylib, .bundle, （无扩展名） | `FE ED FA CE/CF` 或 `CE FA ED FE/CF` | 是 | 是 | 是 | -- |
| **Universal Binary** | （无扩展名） | `CA FE BA BE` | 是 | 是 | 是 | -- |
| **PDF** | .pdf | `25 50 44 46` (%PDF) | 是 | 是 | 是 | -- |
| **Office (OLE)** | .doc, .xls, .ppt | `D0 CF 11 E0` | 是 | 是 | 是 | -- |
| **Office (OOXML)** | .docx, .xlsx, .pptx | `50 4B 03 04` (ZIP) + `[Content_Types].xml` | 是 | 是 | 是 | 解压 |
| **ZIP** | .zip | `50 4B 03 04` | 是 | 是 | 有限 | 递归 |
| **7-Zip** | .7z | `37 7A BC AF 27 1C` | 是 | 是 | 有限 | 递归 |
| **tar** | .tar | `75 73 74 61 72`（偏移 257 处） | 是 | 是 | 有限 | 递归 |
| **gzip** | .gz, .tgz | `1F 8B` | 是 | 是 | 有限 | 递归 |
| **bzip2** | .bz2 | `42 5A 68` (BZh) | 是 | 是 | 有限 | 递归 |
| **xz** | .xz | `FD 37 7A 58 5A 00` | 是 | 是 | 有限 | 递归 |
| **RAR** | .rar | `52 61 72 21` (Rar!) | 是 | 是 | 有限 | 递归 |
| **CAB** | .cab | `4D 53 43 46` (MSCF) | 是 | 是 | 有限 | 递归 |
| **ISO** | .iso | `43 44 30 30 31`（偏移 32769 处） | 是 | 是 | 有限 | 递归 |
| **Shell 脚本** | .sh, .bash | `23 21` (#!) | 是 | 是 | 模式 | -- |
| **Python** | .py, .pyc | 文本 / `42 0D 0D 0A` | 是 | 是 | 模式 | -- |
| **JavaScript** | .js, .mjs | 文本检测 | 是 | 是 | 模式 | -- |
| **PowerShell** | .ps1, .psm1 | 文本检测 | 是 | 是 | 模式 | -- |
| **VBScript** | .vbs, .vbe | 文本检测 | 是 | 是 | 模式 | -- |
| **Batch** | .bat, .cmd | 文本检测 | 是 | 是 | 模式 | -- |
| **Java** | .class, .jar | `CA FE BA BE` / ZIP | 是 | 是 | 有限 | .jar 递归 |
| **WebAssembly** | .wasm | `00 61 73 6D` | 是 | 是 | 有限 | -- |
| **DEX（Android）** | .dex | `64 65 78 0A` (dex\n) | 是 | 是 | 有限 | -- |
| **APK（Android）** | .apk | ZIP + `AndroidManifest.xml` | 是 | 是 | 有限 | 递归 |

### 检测层说明

| 层 | 含义 |
|----|------|
| **哈希** | 对照签名数据库检查 SHA-256/MD5 哈希值 |
| **YARA** | 对文件内容应用完整 YARA 规则集 |
| **启发式：是** | 完整的文件类型特定启发式分析（参见[启发式分析](./heuristics)） |
| **启发式：有限** | 仅进行基本的熵值和结构检查 |
| **启发式：模式** | 基于文本的模式匹配，检查可疑命令和混淆 |
| **压缩包递归** | 解压内容并单独扫描每个文件 |

## 魔数检测

PRX-SD 读取每个文件的前 8192 个字节来确定其类型。这种方式比基于扩展名的检测更可靠：

```
File: invoice.pdf.exe
Extension suggests: PDF
Magic bytes: 4D 5A → PE executable
PRX-SD identifies: PE (correct)
```

::: warning 扩展名不匹配
当文件扩展名与检测到的魔数不一致时，PRX-SD 会在扫描报告中添加备注。扩展名不匹配是常见的社会工程手法（如 `photo.jpg.exe`）。
:::

### 魔数检测优先级

当多个签名可能匹配时（如 ZIP 魔数同时适用于 .zip 和 .docx），PRX-SD 会进行更深层的检查：

1. 读取偏移 0 处的魔数字节
2. 如果不确定（如 ZIP），检查内部结构
3. 对于基于 ZIP 的格式，检查 `[Content_Types].xml`（OOXML）、`META-INF/MANIFEST.MF`（JAR）、`AndroidManifest.xml`（APK）
4. 回退到通用容器类型

## 压缩包递归扫描

当 PRX-SD 遇到压缩包（ZIP、7z、tar、gzip、RAR 等）时，会将内容解压到临时目录，并对每个文件单独通过完整检测流水线进行扫描。

### 递归深度

| 设置 | 默认值 | 说明 |
|------|--------|------|
| `max_archive_depth` | 5 | 压缩包嵌套的最大层数 |
| `max_archive_files` | 10,000 | 从单个压缩包中提取的最大文件数 |
| `max_archive_size_mb` | 500 | 停止提取前的最大总解压大小 |

这些限制防止 Zip 炸弹和深度嵌套压缩包导致资源耗尽。

```toml
# ~/.config/prx-sd/config.toml
[scanning]
max_archive_depth = 5
max_archive_files = 10000
max_archive_size_mb = 500
```

::: warning Zip 炸弹
PRX-SD 能够检测 Zip 炸弹（压缩比极端的压缩包），并在消耗过多磁盘空间或内存之前停止解压。Zip 炸弹检测在扫描结果中报告为 `SUSPICIOUS`。
:::

### 加密压缩包

PRX-SD 无法解压加密的压缩包。这些文件在扫描结果中报告为 `skipped`，并注明加密信息。压缩包文件本身仍会检查哈希和 YARA 数据库。

## 脚本检测

对于文本类脚本文件（Shell、Python、JavaScript、PowerShell、VBScript、Batch），PRX-SD 应用基于模式的启发式分析：

| 模式 | 分值 | 说明 |
|------|------|------|
| 混淆字符串 | 10-20 | Base64 编码的命令、过度的字符串拼接 |
| 下载并执行 | 15-25 | `curl/wget` 管道到 `bash/sh`、`Invoke-WebRequest` + `Invoke-Expression` |
| 反向 Shell | 20-30 | 已知的反向 Shell 模式（`/dev/tcp`、`nc -e`、`bash -i`） |
| 凭据访问 | 10-15 | 读取 `/etc/shadow`、浏览器凭据存储、Keychain |
| 持久化机制 | 10-15 | 添加 cron 任务、systemd 服务、注册表键 |

## 不支持的文件

不匹配任何已知魔数的文件仍然会检查哈希和 YARA 数据库。启发式分析不适用于未知文件类型。常见的例子包括：

- 原始二进制数据
- 没有公开魔数的专有格式
- 加密文件（除非容器格式可被识别）

这些文件在扫描报告中显示为 `type: unknown`，仅接受哈希和 YARA 扫描。

## 下一步

- [启发式分析](./heuristics) —— 各文件类型的详细启发式检查
- [YARA 规则](./yara-rules) —— 针对特定文件格式结构的规则
- [文件与目录扫描](../scanning/file-scan) —— 实际文件扫描操作
- [检测引擎概览](./index) —— 所有检测层如何协同工作
