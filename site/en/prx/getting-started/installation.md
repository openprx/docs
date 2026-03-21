---
title: Installation
description: Install PRX on Linux, macOS, or Windows WSL2 using the install script, Cargo, source build, or Docker.
---

# Installation

PRX ships as a single static binary called `prx`. Choose the installation method that fits your workflow.

## Prerequisites

Before installing PRX, ensure your system meets these requirements:

| Requirement | Details |
|-------------|---------|
| **OS** | Linux (x86_64, aarch64), macOS (Apple Silicon, Intel), or Windows via WSL2 |
| **Rust** | 1.92.0+ (2024 edition) -- only needed for Cargo install or source build |
| **System packages** | `pkg-config` (Linux, for source build only) |
| **Disk space** | ~50 MB for the binary, ~200 MB with WASM plugin runtime |
| **RAM** | 64 MB minimum for the daemon (without LLM inference) |

::: tip
If you use the install script or Docker, you do not need Rust installed on your system.
:::

## Method 1: Install Script (Recommended)

The fastest way to get started. The script detects your OS and architecture, downloads the latest release binary, and places it in your `PATH`.

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

The script installs `prx` to `~/.local/bin/` by default. Make sure this directory is in your `PATH`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

To install a specific version:

```bash
curl -fsSL https://openprx.dev/install.sh | bash -s -- --version 0.3.0
```

To install to a custom directory:

```bash
curl -fsSL https://openprx.dev/install.sh | bash -s -- --prefix /usr/local
```

## Method 2: Cargo Install

If you have the Rust toolchain installed, you can install PRX directly from crates.io:

```bash
cargo install openprx
```

This builds the release binary with default features and places it in `~/.cargo/bin/prx`.

To install with all optional features (Matrix E2EE, WhatsApp Web, etc.):

```bash
cargo install openprx --all-features
```

::: info Feature Flags
PRX uses Cargo feature flags for optional channel support:

| Feature | Description |
|---------|-------------|
| `channel-matrix` | Matrix channel with E2E encryption support |
| `whatsapp-web` | WhatsApp Web multi-device channel |
| **default** | All stable channels enabled |
:::

## Method 3: Build from Source

For development or to run the latest unreleased code:

```bash
# Clone the repository
git clone https://github.com/openprx/prx.git
cd prx

# Build the release binary
cargo build --release

# The binary is at target/release/prx
./target/release/prx --version
```

To build with all features:

```bash
cargo build --release --all-features
```

To install the locally built binary into your Cargo bin directory:

```bash
cargo install --path .
```

### Development Build

For faster iteration during development, use a debug build:

```bash
cargo build
./target/debug/prx --version
```

::: warning
Debug builds are significantly slower at runtime. Always use `--release` for production or benchmarking.
:::

## Method 4: Docker

Run PRX as a container with no local installation required:

```bash
docker pull ghcr.io/openprx/prx:latest
```

Run with a mounted config directory:

```bash
docker run -d \
  --name prx \
  -v ~/.config/openprx:/home/prx/.config/openprx \
  -p 3120:3120 \
  ghcr.io/openprx/prx:latest \
  daemon
```

Or use Docker Compose:

```yaml
# docker-compose.yml
services:
  prx:
    image: ghcr.io/openprx/prx:latest
    restart: unless-stopped
    ports:
      - "3120:3120"
    volumes:
      - ./config:/home/prx/.config/openprx
      - ./data:/home/prx/.local/share/openprx
    command: daemon
```

::: tip
When running in Docker, set your LLM API keys via environment variables or mount a config file. See [Configuration](../config/) for details.
:::

## Verify Installation

After installing, verify that PRX is working:

```bash
prx --version
```

Expected output:

```
prx 0.3.0
```

Run the health check:

```bash
prx doctor
```

This verifies your Rust toolchain (if installed), system dependencies, config file validity, and network connectivity to LLM providers.

## Platform Notes

### Linux

PRX works on any modern Linux distribution (kernel 4.18+). The binary is statically linked with `rustls` for TLS, so no OpenSSL installation is required.

For sandbox features, you may need additional packages:

```bash
# Firejail sandbox backend
sudo apt install firejail

# Bubblewrap sandbox backend
sudo apt install bubblewrap

# Docker sandbox backend (requires Docker daemon)
sudo apt install docker.io
```

### macOS

PRX runs natively on both Apple Silicon (aarch64) and Intel (x86_64) Macs. The iMessage channel is only available on macOS.

If building from source, ensure you have the Xcode Command Line Tools:

```bash
xcode-select --install
```

### Windows (WSL2)

PRX is supported on Windows through WSL2. Install a Linux distribution (Ubuntu recommended) and follow the Linux instructions inside your WSL2 environment.

```powershell
# From PowerShell (install WSL2 with Ubuntu)
wsl --install -d Ubuntu
```

Then inside WSL2:

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

::: warning
Native Windows support is not currently available. WSL2 provides near-native Linux performance and is the recommended approach.
:::

## Uninstalling

To remove PRX:

```bash
# If installed via install script
rm ~/.local/bin/prx

# If installed via Cargo
cargo uninstall openprx

# Remove configuration and data (optional)
rm -rf ~/.config/openprx
rm -rf ~/.local/share/openprx
```

## Next Steps

- [Quick Start](./quickstart) -- Get PRX running in 5 minutes
- [Onboarding Wizard](./onboarding) -- Configure your LLM provider
- [Configuration](../config/) -- Full configuration reference
