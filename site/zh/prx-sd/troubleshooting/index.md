---
title: 故障排除
description: PRX-SD 常见问题的解决方案，包括签名更新、扫描性能、权限、误报、守护进程问题和内存使用。
---

# 故障排除

本页涵盖运行 PRX-SD 时最常遇到的问题，以及其原因和解决方案。

## 签名数据库更新失败

**症状：** `sd update` 因网络错误、超时或 SHA-256 不匹配而失败。

**可能原因：**
- 无网络连接或防火墙阻止了出站 HTTPS
- 更新服务器暂时不可用
- 代理或企业防火墙修改了响应内容

**解决方案：**

1. **检查与更新服务器的连接**：

```bash
curl -fsSL https://api.github.com/repos/openprx/prx-sd-signatures/commits?per_page=1
```

2. 如果有网络限制，**使用离线更新脚本**：

```bash
# 在有网络的机器上
./tools/update-signatures.sh

# 将签名目录复制到目标机器
scp -r ~/.prx-sd/signatures user@target:~/.prx-sd/
```

3. **强制重新下载**以清除损坏的缓存：

```bash
sd update --force
```

4. 如果托管了私有镜像，**使用自定义更新服务器**：

```bash
sd config set update_server_url "https://internal-mirror.example.com/prx-sd/v1"
sd update
```

5. **检查 SHA-256 不匹配** -- 这通常意味着下载过程中数据损坏。请重试，或手动下载：

```bash
sd update --force
```

::: tip
运行 `sd update --check-only` 可以在不下载的情况下验证是否有可用更新。
:::

## 扫描速度慢

**症状：** 扫描目录耗时远超预期。

**可能原因：**
- 正在扫描网络挂载的文件系统（NFS、CIFS、SSHFS）
- YARA 规则在每次扫描时都重新编译（没有编译缓存）
- 过多线程在机械硬盘上竞争 I/O
- 大型嵌套压缩包的递归扫描

**解决方案：**

1. 对于 SSD 存储，**增加线程数**：

```bash
sd config set scan.threads 16
```

2. 对于机械硬盘（I/O 密集型），**减少线程数**：

```bash
sd config set scan.threads 2
```

3. **排除慢速或无关的路径**：

```bash
sd config set scan.exclude_paths '["/mnt/nfs", "/proc", "/sys", "/dev", "*.iso"]'
```

4. 如不需要，**禁用压缩包扫描**：

```bash
sd config set scan.scan_archives false
```

5. **减少压缩包深度**以避免深度嵌套的压缩包：

```bash
sd config set scan.max_archive_depth 1
```

6. 对单次扫描**使用 `--exclude` 参数**：

```bash
sd scan /home --exclude "*.iso" --exclude "node_modules"
```

7. **启用调试日志**查找瓶颈：

```bash
sd --log-level debug scan /path/to/dir 2>&1 | grep -i "slow\|timeout\|skip"
```

## fanotify 权限错误

**症状：** `sd monitor --block` 失败，提示 "Permission denied" 或 "Operation not permitted"。

**可能原因：**
- 未以 root 身份运行
- Linux 内核未启用 `CONFIG_FANOTIFY_ACCESS_PERMISSIONS`
- AppArmor 或 SELinux 阻止了 fanotify 访问

**解决方案：**

1. **以 root 身份运行**：

```bash
sudo sd monitor /home /tmp --block
```

2. **检查内核配置**：

```bash
zgrep FANOTIFY /proc/config.gz
# 应显示：CONFIG_FANOTIFY=y 和 CONFIG_FANOTIFY_ACCESS_PERMISSIONS=y
```

3. 作为备选方案，**使用非拦截模式**（仍能检测威胁，但不会阻止文件访问）：

```bash
sd monitor /home /tmp
```

::: warning
拦截模式仅在支持 fanotify 的 Linux 上可用。在 macOS（FSEvents）和 Windows（ReadDirectoryChangesW）上，实时监控以仅检测模式运行。
:::

4. **检查 SELinux/AppArmor**：

```bash
# SELinux：检查拒绝记录
ausearch -m AVC -ts recent | grep prx-sd

# AppArmor：检查拒绝记录
dmesg | grep apparmor | grep prx-sd
```

## 误报（合法文件被检测为威胁）

**症状：** 已知安全的文件被标记为可疑或恶意。

**解决方案：**

1. **检查触发检测的原因**：

```bash
sd scan /path/to/file --json
```

查看 `detection_type` 和 `threat_name` 字段：
- `HashMatch` -- 文件的哈希匹配已知恶意软件哈希（误报可能性低）
- `YaraRule` -- YARA 规则匹配了文件中的模式
- `Heuristic` -- 启发式引擎对文件的评分超过了阈值

2. 对于启发式误报，**提高阈值**：

```bash
# 默认为 60；提高到 70 以减少误报
sd config set scan.heuristic_threshold 70
```

3. **将文件或目录从扫描中排除**：

```bash
sd config set scan.exclude_paths '["/path/to/safe-file", "/opt/known-good/"]'
```

4. 对于 YARA 误报，可以在 `~/.prx-sd/yara/` 目录中移除或注释掉特定规则来**排除特定规则**。

5. **通过哈希加入白名单** -- 将文件的 SHA-256 添加到本地允许列表（未来功能）。目前的替代方案是通过路径排除文件。

::: tip
如果你认为某个检测是真正的误报，请在 [github.com/openprx/prx-sd/issues](https://github.com/openprx/prx-sd/issues) 提交报告，附上文件哈希（而非文件本身）和规则名称。
:::

## 守护进程无法启动

**症状：** `sd daemon` 立即退出，或 `sd status` 显示 "stopped"。

**可能原因：**
- 另一个实例已在运行（PID 文件存在）
- 数据目录不可访问或已损坏
- 签名数据库缺失

**解决方案：**

1. **检查是否存在过期的 PID 文件**：

```bash
cat ~/.prx-sd/prx-sd.pid
# 如果列出的 PID 没有在运行，删除该文件
rm ~/.prx-sd/prx-sd.pid
```

2. **检查守护进程状态**：

```bash
sd status
```

3. **以前台模式运行**并开启调试日志以查看启动错误：

```bash
sd --log-level debug daemon /home /tmp
```

4. **确保签名存在**：

```bash
sd info
# 如果 hash_count 为 0，运行：
sd update
```

5. **检查目录权限**：

```bash
ls -la ~/.prx-sd/
# 所有目录应由当前用户拥有且可写
```

6. 如果数据目录已损坏，**重新初始化**：

```bash
# 备份现有数据
mv ~/.prx-sd ~/.prx-sd.bak

# 运行任意命令触发首次运行设置
sd info

# 重新下载签名
sd update
```

## 日志级别调整

**问题：** 需要更多诊断信息来调试问题。

PRX-SD 支持五个日志级别，从最详细到最简略：

| 级别 | 说明 |
|------|------|
| `trace` | 所有信息，包括逐文件的 YARA 匹配细节 |
| `debug` | 详细的引擎操作、插件加载、哈希查找 |
| `info` | 扫描进度、签名更新、插件注册 |
| `warn` | 警告和非致命错误（默认） |
| `error` | 仅严重错误 |

```bash
# 最大详细程度
sd --log-level trace scan /tmp

# 调试级别用于故障排除
sd --log-level debug monitor /home

# 将日志重定向到文件以便分析
sd --log-level debug scan /home 2> /tmp/prx-sd-debug.log
```

::: tip
`--log-level` 参数是全局的，必须放在子命令**之前**：
```bash
# 正确
sd --log-level debug scan /tmp

# 错误（参数在子命令之后）
sd scan /tmp --log-level debug
```
:::

## 内存使用过高

**症状：** `sd` 进程消耗的内存超出预期，尤其是在扫描大型目录时。

**可能原因：**
- 使用大量线程扫描非常多的文件
- YARA 规则被编译到内存中（38,800+ 条规则会占用大量内存）
- 压缩包扫描将大型压缩文件解压到内存中
- WASM 插件的 `max_memory_mb` 限制设置过高

**解决方案：**

1. **减少线程数**（每个线程加载自己的 YARA 上下文）：

```bash
sd config set scan.threads 2
```

2. **限制最大文件大小**以跳过超大文件：

```bash
# 限制为 50 MiB
sd config set scan.max_file_size 52428800
```

3. 对于内存受限的系统，**禁用压缩包扫描**：

```bash
sd config set scan.scan_archives false
```

4. **减少压缩包深度**：

```bash
sd config set scan.max_archive_depth 1
```

5. **检查 WASM 插件内存限制** -- 查看 `~/.prx-sd/plugins/*/plugin.json` 中 `max_memory_mb` 值较高的插件并降低它们。

6. **监控扫描时的内存**：

```bash
# 在另一个终端
watch -n 1 'ps aux | grep sd | grep -v grep'
```

7. 对于守护进程，**长期监控内存**：

```bash
sd status
# 显示 PID；使用 top/htop 监控内存
```

## 其他常见问题

### "No YARA rules found" 警告

YARA 规则目录为空。重新运行首次设置或下载规则：

```bash
sd update
# 或通过删除 yara 目录手动触发设置：
rm -rf ~/.prx-sd/yara
sd info  # 触发首次运行设置，使用内置规则
```

### "Failed to open signature database" 错误

LMDB 签名数据库可能已损坏：

```bash
rm -rf ~/.prx-sd/signatures
sd update
```

### Adblock："insufficient privileges"

广告拦截启用/禁用命令修改系统 hosts 文件，需要 root 权限：

```bash
sudo sd adblock enable
sudo sd adblock disable
```

### 扫描跳过文件并提示 "timeout" 错误

单个文件超时默认为 30 秒。对于复杂文件可增加超时时间：

```bash
sd config set scan.timeout_per_file_ms 60000
```

## 获取帮助

如果以上方案均未解决你的问题：

1. **查看已有 issue：** [github.com/openprx/prx-sd/issues](https://github.com/openprx/prx-sd/issues)
2. **提交新 issue**，请包含：
   - PRX-SD 版本（`sd info`）
   - 操作系统和内核版本
   - 调试日志输出（`sd --log-level debug ...`）
   - 复现步骤

## 后续步骤

- 查阅[配置参考](../configuration/reference)以微调引擎行为
- 了解[检测引擎](../detection/)以理解威胁识别方式
- 设置[告警](../alerts/)以主动获取问题通知
