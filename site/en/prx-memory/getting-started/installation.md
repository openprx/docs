---
title: Installation
description: Install PRX-Memory from source using Cargo, or build the daemon binary for stdio and HTTP transports.
---

# Installation

PRX-Memory is distributed as a Rust workspace. The primary artifact is the `prx-memoryd` daemon binary from the `prx-memory-mcp` crate.

::: tip Recommended
Building from source gives you the latest features and allows you to enable optional backends like LanceDB.
:::

## Prerequisites

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| Rust | stable toolchain | Install via [rustup](https://rustup.rs/) |
| Operating System | Linux, macOS, Windows (WSL2) | Any platform supported by Rust |
| Git | 2.30+ | For cloning the repository |
| Disk Space | 100 MB | Binary + dependencies |
| RAM | 256 MB | More recommended for large memory databases |

## Method 1: Build from Source (Recommended)

Clone the repository and build in release mode:

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build --release -p prx-memory-mcp --bin prx-memoryd
```

The binary is located at `target/release/prx-memoryd`. Copy it to your PATH:

```bash
sudo cp target/release/prx-memoryd /usr/local/bin/prx-memoryd
```

### Build Options

| Feature Flag | Default | Description |
|-------------|---------|-------------|
| `lancedb-backend` | disabled | LanceDB vector storage backend |

To build with LanceDB support:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

::: warning Build Dependencies
On Debian/Ubuntu you may need:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
On macOS, Xcode Command Line Tools are required:
```bash
xcode-select --install
```
:::

## Method 2: Cargo Install

If you have Rust installed, you can install directly:

```bash
cargo install prx-memory-mcp
```

This compiles from source and places the `prx-memoryd` binary in `~/.cargo/bin/`.

## Method 3: Use as Library

To use PRX-Memory crates as dependencies in your own Rust project, add them to your `Cargo.toml`:

```toml
[dependencies]
prx-memory-core = "0.1"
prx-memory-embed = "0.1"
prx-memory-rerank = "0.1"
prx-memory-storage = "0.1"
```

## Verify Installation

After building, verify the binary runs:

```bash
prx-memoryd --help
```

Test a basic stdio session:

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

Test an HTTP session:

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

Check the health endpoint:

```bash
curl -sS http://127.0.0.1:8787/health
```

## Development Setup

For development and testing, use the standard Rust workflow:

```bash
# Format
cargo fmt --all

# Lint
cargo clippy --all-targets --all-features -- -D warnings

# Test
cargo test --all-targets --all-features

# Check (fast feedback)
cargo check --all-targets --all-features
```

## Uninstalling

```bash
# Remove the binary
sudo rm /usr/local/bin/prx-memoryd
# Or if installed via Cargo
cargo uninstall prx-memory-mcp

# Remove data files
rm -rf ./data/memory-db.json
```

## Next Steps

- [Quick Start](./quickstart) -- Get PRX-Memory running in 5 minutes
- [Configuration](../configuration/) -- All environment variables and profiles
- [MCP Integration](../mcp/) -- Connect to your MCP client
