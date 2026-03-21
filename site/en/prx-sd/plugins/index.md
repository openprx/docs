---
title: WASM Plugin Development
description: Extend PRX-SD with custom detection logic using WebAssembly plugins. Write plugins in Rust, Go, C, or any language that compiles to WASM.
---

# WASM Plugin Development

PRX-SD includes a plugin system powered by [Wasmtime](https://wasmtime.dev/) that lets you extend the detection engine with custom scanners written in any language that compiles to WebAssembly (Rust, Go, C, AssemblyScript, etc.). Plugins run in a sandboxed WASM environment with configurable resource limits.

## Architecture

```
~/.prx-sd/plugins/
  my-scanner/
    plugin.json          # Plugin manifest
    my_scanner.wasm      # Compiled WASM module
  another-plugin/
    plugin.json
    another_plugin.wasm
```

When the scan engine starts, the `PluginRegistry` walks the plugins directory, loads every subdirectory containing a `plugin.json`, compiles the WASM module, and calls the plugin's `on_load` export. During a scan, each plugin whose `file_types` and `platforms` match the current file is invoked in sequence.

### Execution Flow

1. **Discovery** -- `PluginRegistry` finds `plugin.json` files in `~/.prx-sd/plugins/`
2. **Compilation** -- Wasmtime compiles the `.wasm` module with fuel metering and memory limits
3. **Initialization** -- `on_load()` is called; `plugin_name()` and `plugin_version()` are read
4. **Scanning** -- For each file, `scan(ptr, len) -> score` is called with the file data
5. **Reporting** -- Plugins call `report_finding()` to register threats, or return a non-zero score

## Plugin Manifest (`plugin.json`)

Every plugin directory must contain a `plugin.json` that describes the plugin and its sandbox constraints:

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

### Manifest Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Human-readable plugin name |
| `version` | `string` | Yes | Semantic version of the plugin |
| `author` | `string` | Yes | Plugin author or organization |
| `description` | `string` | Yes | Brief description of what the plugin detects |
| `wasm_file` | `string` | Yes | Filename of the compiled WASM module (relative to plugin directory) |
| `platforms` | `string[]` | Yes | Target platforms: `"linux"`, `"macos"`, `"windows"`, or `"all"` |
| `file_types` | `string[]` | Yes | File types to inspect: `"pe"`, `"elf"`, `"macho"`, `"pdf"`, or `"all"` |
| `min_engine_version` | `string` | Yes | Minimum PRX-SD engine version required |
| `permissions.network` | `boolean` | No | Whether the plugin may access the network (default: `false`) |
| `permissions.filesystem` | `boolean` | No | Whether the plugin may access the host filesystem via WASI (default: `false`) |
| `permissions.max_memory_mb` | `integer` | No | Maximum linear memory in MiB (default: `64`) |
| `permissions.max_exec_ms` | `integer` | No | Maximum wall-clock execution time in ms (default: `5000`) |

## Required WASM Exports

Your WASM module must export the following functions:

### `scan(ptr: i32, len: i32) -> i32`

The main scan entry point. Receives a pointer and length to the file data in guest memory. Returns a threat score from 0 to 100:

- `0` = clean
- `1-29` = informational
- `30-59` = suspicious
- `60-100` = malicious

### `memory`

The module must export its linear memory as `memory` so the host can write file data and read results.

## Optional WASM Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `on_load() -> i32` | `() -> i32` | Called once after compilation. Return `0` for success. |
| `plugin_name(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | Write the plugin name into the buffer. Return actual length. |
| `plugin_version(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | Write the plugin version into the buffer. Return actual length. |
| `alloc(size: i32) -> i32` | `(i32) -> i32` | Allocate `size` bytes of guest memory. Return the pointer. |

## Host Functions Available to Plugins

The host provides these functions in the `"env"` namespace:

### `report_finding(name_ptr, name_len, score, detail_ptr, detail_len)`

Report a threat finding. Can be called multiple times during a single scan.

- `name_ptr` / `name_len` -- pointer and length of the threat name string (e.g. `"Trojan.Marker"`)
- `score` -- threat score (0-100, clamped)
- `detail_ptr` / `detail_len` -- pointer and length of a detail string

### `log_message(level, msg_ptr, msg_len)`

Write a log message to the engine's tracing system.

- `level` -- `0`=trace, `1`=debug, `2`=info, `3`=warn, `4`=error
- `msg_ptr` / `msg_len` -- pointer and length of the message string

### `get_file_path(buf_ptr, buf_len) -> actual_len`

Read the path of the file being scanned into a guest buffer.

### `get_file_type(buf_ptr, buf_len) -> actual_len`

Read the detected file type (e.g. `"pe"`, `"elf"`, `"pdf"`) into a guest buffer.

## PluginFinding Structure

When a plugin reports a finding (either via `report_finding()` or by returning a non-zero score), the engine creates a `PluginFinding`:

```rust
pub struct PluginFinding {
    pub plugin_name: String,   // Name of the plugin
    pub threat_name: String,   // e.g. "Trojan.Marker"
    pub score: u32,            // 0-100
    pub detail: String,        // Free-form detail string
}
```

If the plugin returns a non-zero score but does not call `report_finding()`, the engine synthesizes a finding automatically:

```
threat_name: "Plugin.<plugin_name>"
detail: "Plugin '<name>' returned threat score <score>"
```

## Development Workflow

### 1. Create the Plugin Directory

```bash
mkdir -p ~/.prx-sd/plugins/my-scanner
```

### 2. Write the Manifest

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

### 3. Write the Plugin (Rust Example)

Create a new Rust library project:

```bash
cargo new --lib my-scanner
cd my-scanner
```

Add to `Cargo.toml`:

```toml
[lib]
crate-type = ["cdylib"]

[profile.release]
opt-level = "s"
lto = true
```

Write `src/lib.rs`:

```rust
// Host function imports
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

    // Example: look for a known malicious marker
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

### 4. Compile to WASM

```bash
rustup target add wasm32-wasip1
cargo build --release --target wasm32-wasip1
cp target/wasm32-wasip1/release/my_scanner.wasm ~/.prx-sd/plugins/my-scanner/
```

### 5. Test the Plugin

```bash
# Create a test file with the marker
echo "MALICIOUS_MARKER" > /tmp/test-marker.txt

# Scan with debug logging to see plugin activity
sd --log-level debug scan /tmp/test-marker.txt
```

::: tip
Use `--log-level debug` to see detailed plugin loading and execution messages, including fuel consumption and memory usage.
:::

## Sandbox Security

Plugins run inside a Wasmtime sandbox with the following constraints:

| Constraint | Enforcement |
|-----------|-------------|
| **Memory limit** | `max_memory_mb` in manifest; Wasmtime enforces linear memory cap |
| **CPU limit** | `max_exec_ms` converted to fuel units; execution is halted when fuel runs out |
| **Network** | Disabled by default; requires `permissions.network: true` |
| **Filesystem** | Disabled by default; requires `permissions.filesystem: true` (WASI preopens) |
| **Platform check** | Plugins with non-matching `platforms` are skipped at load time |
| **File type filter** | Plugins with non-matching `file_types` are skipped per-file |

::: warning
Even with `network: true` or `filesystem: true`, the WASI sandbox restricts access to specific directories and endpoints. These permissions are a declaration of intent, not blanket access grants.
:::

## Hot Reload

Drop a new plugin directory into `~/.prx-sd/plugins/` and the registry will pick it up on next scan. For the daemon, trigger a reload by calling `sd update` or restarting the daemon.

## Next Steps

- Review the [example plugin](https://github.com/openprx/prx-sd/tree/main/crates/plugins/examples/example-plugin) in the repository
- Learn about the [Detection Engine](../detection/) pipeline to understand how plugin findings are aggregated
- See the [CLI Reference](../cli/) for all available commands
