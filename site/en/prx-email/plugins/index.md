---
title: WASM Plugins
description: PRX-Email WASM plugin system for sandboxed execution in the PRX runtime. WIT host-calls, network safety switch, and plugin development guide.
---

# WASM Plugins

PRX-Email includes a WASM plugin that compiles the email client to WebAssembly for sandboxed execution inside the PRX runtime. The plugin uses WIT (WebAssembly Interface Types) to define host-call interfaces, allowing WASM-hosted code to invoke email operations like sync, list, get, search, send, and reply.

## Architecture

```
PRX Runtime (Host)
  |
  +-- WASM Plugin (prx-email-plugin)
        |
        +-- WIT Host-Calls
        |     email.sync    --> Host IMAP sync
        |     email.list    --> Host inbox list
        |     email.get     --> Host message get
        |     email.search  --> Host inbox search
        |     email.send    --> Host SMTP send
        |     email.reply   --> Host SMTP reply
        |
        +-- email.execute   --> Dispatcher
              (forwards to host-calls above)
```

### Execution Model

When a WASM plugin calls `email.execute`, the plugin dispatches the call to the appropriate host-call function. The host runtime handles the actual IMAP/SMTP operations, and results are returned back through the WIT interface.

## Network Safety Switch

Real IMAP/SMTP execution from the WASM context is **disabled by default**. This prevents sandboxed plugins from making unintended network connections.

### Enabling Network Operations

Set the environment variable before starting the PRX runtime:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### Behavior When Disabled

| Operation | Behavior |
|-----------|----------|
| `email.sync` | Returns `EMAIL_NETWORK_GUARD` error |
| `email.send` | Returns `EMAIL_NETWORK_GUARD` error |
| `email.reply` | Returns `EMAIL_NETWORK_GUARD` error |
| `email.list` | Works (reads from local SQLite) |
| `email.get` | Works (reads from local SQLite) |
| `email.search` | Works (reads from local SQLite) |

::: tip
Read-only operations (list, get, search) always work because they query the local SQLite database without network access. Only operations that require IMAP/SMTP connections are gated.
:::

### Host Capability Unavailable

When the host runtime does not provide the email capability at all (non-WASM execution path), operations return `EMAIL_HOST_CAPABILITY_UNAVAILABLE`.

## Plugin Structure

```
wasm-plugin/
  Cargo.toml          # Plugin crate configuration
  plugin.toml         # Plugin manifest
  plugin.wasm         # Pre-compiled WASM binary
  src/
    lib.rs            # Plugin entry point and dispatcher
    bindings.rs       # WIT-generated bindings
  wit/                # WIT interface definitions
    deps/
      prx-host/       # Host-provided interfaces
```

### Cargo Configuration

```toml
[package]
name = "prx-email-plugin"
version = "0.1.0"
edition = "2024"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
wit-bindgen = { version = "0.51", features = ["macros"] }

[package.metadata.component]
package = "prx:plugin"

[package.metadata.component.target.dependencies]
"prx:host" = { path = "wit/deps/prx-host" }
```

## Building the Plugin

### Prerequisites

- Rust toolchain
- `wasm32-wasip1` target

### Build Steps

```bash
# Add WASM target
rustup target add wasm32-wasip1

# Build the plugin
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### Using the Build Script

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

## WIT Interface

The plugin communicates with the host through WIT-defined interfaces. The `prx:host` package provides the following host-call functions:

### Available Host-Calls

| Function | Description | Network Required |
|----------|-------------|:----------------:|
| `email.sync` | Sync IMAP inbox for an account/folder | Yes |
| `email.list` | List messages from local database | No |
| `email.get` | Get a specific message by ID | No |
| `email.search` | Search messages by query | No |
| `email.send` | Send a new email via SMTP | Yes |
| `email.reply` | Reply to an existing email | Yes |

### Request/Response Format

Host-calls use JSON serialization for request and response payloads:

```rust
// Example: list messages
let request = serde_json::json!({
    "account_id": 1,
    "limit": 10
});

let response = host_call("email.list", &request)?;
```

## Development Workflow

### 1. Modify Plugin Code

Edit `wasm-plugin/src/lib.rs` to add custom logic:

```rust
// Add pre-processing before email operations
fn before_send(request: &SendRequest) -> Result<(), PluginError> {
    // Custom validation, logging, or transformation
    Ok(())
}
```

### 2. Rebuild

```bash
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### 3. Test Locally

Test with the network safety switch disabled:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
# Run your PRX runtime with the updated plugin
```

### 4. Deploy

Copy the compiled `.wasm` file to your PRX runtime's plugin directory.

## Security Model

| Constraint | Enforcement |
|-----------|-------------|
| Network access | Disabled by default; requires `PRX_EMAIL_ENABLE_REAL_NETWORK=1` |
| Filesystem access | No direct filesystem access from WASM |
| Memory | Bounded by WASM linear memory limits |
| Execution time | Bounded by fuel metering |
| Token safety | OAuth tokens are managed by the host, not exposed to WASM |

::: warning
The WASM plugin has no direct access to OAuth tokens or credentials. All authentication is handled by the host runtime. The plugin only receives operation results, never raw credentials.
:::

## Next Steps

- [Installation](../getting-started/installation) -- Build instructions for the WASM plugin
- [Configuration Reference](../configuration/) -- Network safety switch and runtime settings
- [Troubleshooting](../troubleshooting/) -- Plugin-related issues
