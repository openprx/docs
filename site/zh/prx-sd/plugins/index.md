---
title: WASM 插件开发
description: 使用 WebAssembly 插件扩展 PRX-SD 的自定义检测逻辑。支持用 Rust、Go、C 或任何可编译为 WASM 的语言编写插件。
---

# WASM 插件开发

PRX-SD 包含一个基于 [Wasmtime](https://wasmtime.dev/) 的插件系统，允许你使用任何可编译为 WebAssembly 的语言（Rust、Go、C、AssemblyScript 等）编写自定义扫描器来扩展检测引擎。插件在沙箱化的 WASM 环境中运行，具有可配置的资源限制。

## 架构

```
~/.prx-sd/plugins/
  my-scanner/
    plugin.json          # 插件清单
    my_scanner.wasm      # 编译后的 WASM 模块
  another-plugin/
    plugin.json
    another_plugin.wasm
```

扫描引擎启动时，`PluginRegistry` 会遍历插件目录，加载每个包含 `plugin.json` 的子目录，编译 WASM 模块，并调用插件的 `on_load` 导出函数。扫描过程中，每个 `file_types` 和 `platforms` 与当前文件匹配的插件会依次被调用。

### 执行流程

1. **发现** -- `PluginRegistry` 在 `~/.prx-sd/plugins/` 中查找 `plugin.json` 文件
2. **编译** -- Wasmtime 使用燃料计量和内存限制编译 `.wasm` 模块
3. **初始化** -- 调用 `on_load()`；读取 `plugin_name()` 和 `plugin_version()`
4. **扫描** -- 对每个文件，使用文件数据调用 `scan(ptr, len) -> score`
5. **报告** -- 插件调用 `report_finding()` 注册威胁，或返回非零分数

## 插件清单 (`plugin.json`)

每个插件目录必须包含一个 `plugin.json`，用于描述插件及其沙箱约束：

```json
{
  "name": "Example Scanner",
  "version": "0.1.0",
  "author": "prx-sd",
  "description": "Example plugin that detects MALICIOUS_MARKER string",
  "wasm_file": "example_plugin.wasm",
  "platforms": ["all"],
  "file_types": ["all"],
  "min_engine_version": "0.1.0",
  "permissions": {
    "network": false,
    "filesystem": false,
    "max_memory_mb": 64,
    "max_exec_ms": 5000
  }
}
```

### 清单字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | `string` | 是 | 插件的可读名称 |
| `version` | `string` | 是 | 插件的语义化版本 |
| `author` | `string` | 是 | 插件作者或组织 |
| `description` | `string` | 是 | 插件检测内容的简要描述 |
| `wasm_file` | `string` | 是 | 编译后的 WASM 模块文件名（相对于插件目录） |
| `platforms` | `string[]` | 是 | 目标平台：`"linux"`、`"macos"`、`"windows"` 或 `"all"` |
| `file_types` | `string[]` | 是 | 要检查的文件类型：`"pe"`、`"elf"`、`"macho"`、`"pdf"` 或 `"all"` |
| `min_engine_version` | `string` | 是 | 所需的最低 PRX-SD 引擎版本 |
| `permissions.network` | `boolean` | 否 | 插件是否可以访问网络（默认：`false`） |
| `permissions.filesystem` | `boolean` | 否 | 插件是否可以通过 WASI 访问宿主文件系统（默认：`false`） |
| `permissions.max_memory_mb` | `integer` | 否 | 最大线性内存（MiB）（默认：`64`） |
| `permissions.max_exec_ms` | `integer` | 否 | 最大执行时间（毫秒）（默认：`5000`） |

## 必需的 WASM 导出

你的 WASM 模块必须导出以下函数：

### `scan(ptr: i32, len: i32) -> i32`

主扫描入口点。接收指向客户内存中文件数据的指针和长度。返回 0 到 100 的威胁分数：

- `0` = 安全
- `1-29` = 信息性
- `30-59` = 可疑
- `60-100` = 恶意

### `memory`

模块必须将其线性内存导出为 `memory`，以便宿主可以写入文件数据和读取结果。

## 可选的 WASM 导出

| 导出 | 签名 | 说明 |
|------|------|------|
| `on_load() -> i32` | `() -> i32` | 编译后调用一次。返回 `0` 表示成功。 |
| `plugin_name(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | 将插件名称写入缓冲区。返回实际长度。 |
| `plugin_version(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | 将插件版本写入缓冲区。返回实际长度。 |
| `alloc(size: i32) -> i32` | `(i32) -> i32` | 分配 `size` 字节的客户内存。返回指针。 |

## 插件可用的宿主函数

宿主在 `"env"` 命名空间中提供以下函数：

### `report_finding(name_ptr, name_len, score, detail_ptr, detail_len)`

报告威胁发现。在单次扫描中可多次调用。

- `name_ptr` / `name_len` -- 威胁名称字符串的指针和长度（例如 `"Trojan.Marker"`）
- `score` -- 威胁分数（0-100，会被截断）
- `detail_ptr` / `detail_len` -- 详情字符串的指针和长度

### `log_message(level, msg_ptr, msg_len)`

将日志消息写入引擎的追踪系统。

- `level` -- `0`=trace、`1`=debug、`2`=info、`3`=warn、`4`=error
- `msg_ptr` / `msg_len` -- 消息字符串的指针和长度

### `get_file_path(buf_ptr, buf_len) -> actual_len`

将正在扫描的文件路径读入客户缓冲区。

### `get_file_type(buf_ptr, buf_len) -> actual_len`

将检测到的文件类型（例如 `"pe"`、`"elf"`、`"pdf"`）读入客户缓冲区。

## PluginFinding 结构体

当插件报告发现（通过 `report_finding()` 或返回非零分数）时，引擎会创建一个 `PluginFinding`：

```rust
pub struct PluginFinding {
    pub plugin_name: String,   // 插件名称
    pub threat_name: String,   // 例如 "Trojan.Marker"
    pub score: u32,            // 0-100
    pub detail: String,        // 自由格式的详情字符串
}
```

如果插件返回非零分数但没有调用 `report_finding()`，引擎会自动合成一个发现：

```
threat_name: "Plugin.<plugin_name>"
detail: "Plugin '<name>' returned threat score <score>"
```

## 开发流程

### 1. 创建插件目录

```bash
mkdir -p ~/.prx-sd/plugins/my-scanner
```

### 2. 编写清单

```bash
cat > ~/.prx-sd/plugins/my-scanner/plugin.json << 'EOF'
{
  "name": "My Custom Scanner",
  "version": "0.1.0",
  "author": "your-name",
  "description": "Detects custom threat patterns",
  "wasm_file": "my_scanner.wasm",
  "platforms": ["all"],
  "file_types": ["all"],
  "min_engine_version": "0.1.0",
  "permissions": {
    "network": false,
    "filesystem": false,
    "max_memory_mb": 64,
    "max_exec_ms": 5000
  }
}
EOF
```

### 3. 编写插件（Rust 示例）

创建新的 Rust 库项目：

```bash
cargo new --lib my-scanner
cd my-scanner
```

在 `Cargo.toml` 中添加：

```toml
[lib]
crate-type = ["cdylib"]

[profile.release]
opt-level = "s"
lto = true
```

编写 `src/lib.rs`：

```rust
// 宿主函数导入
extern "C" {
    fn report_finding(
        name_ptr: *const u8, name_len: u32,
        score: u32,
        detail_ptr: *const u8, detail_len: u32,
    );
    fn log_message(level: u32, msg_ptr: *const u8, msg_len: u32);
}

#[no_mangle]
pub extern "C" fn on_load() -> i32 {
    let msg = b"My Custom Scanner loaded";
    unsafe { log_message(2, msg.as_ptr(), msg.len() as u32) };
    0 // success
}

#[no_mangle]
pub extern "C" fn scan(ptr: *const u8, len: u32) -> i32 {
    let data = unsafe { core::slice::from_raw_parts(ptr, len as usize) };

    // 示例：查找已知的恶意标记
    let marker = b"MALICIOUS_MARKER";
    if data.windows(marker.len()).any(|w| w == marker) {
        let name = b"Custom.MaliciousMarker";
        let detail = b"Found MALICIOUS_MARKER string in file data";
        unsafe {
            report_finding(
                name.as_ptr(), name.len() as u32,
                85,
                detail.as_ptr(), detail.len() as u32,
            );
        }
        return 85;
    }

    0 // clean
}
```

### 4. 编译为 WASM

```bash
rustup target add wasm32-wasip1
cargo build --release --target wasm32-wasip1
cp target/wasm32-wasip1/release/my_scanner.wasm ~/.prx-sd/plugins/my-scanner/
```

### 5. 测试插件

```bash
# 创建包含标记的测试文件
echo "MALICIOUS_MARKER" > /tmp/test-marker.txt

# 使用调试日志扫描以查看插件活动
sd --log-level debug scan /tmp/test-marker.txt
```

::: tip
使用 `--log-level debug` 可查看详细的插件加载和执行信息，包括燃料消耗和内存使用情况。
:::

## 沙箱安全性

插件在 Wasmtime 沙箱中运行，受以下约束：

| 约束 | 执行方式 |
|------|----------|
| **内存限制** | 清单中的 `max_memory_mb`；Wasmtime 强制执行线性内存上限 |
| **CPU 限制** | `max_exec_ms` 转换为燃料单位；燃料耗尽时执行被终止 |
| **网络** | 默认禁用；需要 `permissions.network: true` |
| **文件系统** | 默认禁用；需要 `permissions.filesystem: true`（WASI 预开放） |
| **平台检查** | `platforms` 不匹配的插件在加载时跳过 |
| **文件类型过滤** | `file_types` 不匹配的插件在逐文件处理时跳过 |

::: warning
即使设置了 `network: true` 或 `filesystem: true`，WASI 沙箱也会将访问限制在特定目录和端点。这些权限是意图声明，而非无限制的访问授权。
:::

## 热重载

将新的插件目录放入 `~/.prx-sd/plugins/`，注册表会在下次扫描时自动加载。对于守护进程，可通过调用 `sd update` 或重启守护进程来触发重载。

## 后续步骤

- 查看仓库中的[示例插件](https://github.com/openprx/prx-sd/tree/main/crates/plugins/examples/example-plugin)
- 了解[检测引擎](../detection/)流程，理解插件发现如何被聚合
- 查阅 [CLI 参考](../cli/)获取所有可用命令
