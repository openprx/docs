---
title: Installation
description: Install PRX-SD on Linux, macOS, or Windows WSL2 using the install script, Cargo, building from source, or Docker.
---

# Installation

PRX-SD supports four installation methods. Choose the one that best fits your workflow.

::: tip Recommended
The **install script** is the fastest way to get started. It detects your platform, downloads the correct binary, and places it in your PATH.
:::

## Prerequisites

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| Operating System | Linux (x86_64, aarch64), macOS (12+), Windows (WSL2) | Native Windows is not supported |
| Disk Space | 200 MB | ~50 MB binary + ~150 MB signature database |
| RAM | 512 MB | 2 GB+ recommended for large directory scans |
| Rust (source build only) | 1.85.0 | Not needed for script or Docker install |
| Git (source build only) | 2.30+ | For cloning the repository |
| Docker (Docker only) | 20.10+ | Or Podman 3.0+ |

## Method 1: Install Script (Recommended)

The install script downloads the latest release binary for your platform and places it in `/usr/local/bin`.

```bash
curl -fsSL https://openprx.dev/install-sd.sh | bash
```

To install a specific version:

```bash
curl -fsSL https://openprx.dev/install-sd.sh | bash -s -- --version 0.5.0
```

The script supports the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `INSTALL_DIR` | `/usr/local/bin` | Custom installation directory |
| `VERSION` | `latest` | Specific release version |
| `ARCH` | auto-detected | Override architecture (`x86_64`, `aarch64`) |

## Method 2: Cargo Install

If you have Rust installed, you can install directly from crates.io:

```bash
cargo install prx-sd
```

This compiles from source and places the `sd` binary in `~/.cargo/bin/`.

::: warning Build Dependencies
Cargo install compiles native dependencies. On Debian/Ubuntu you may need:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
On macOS, Xcode Command Line Tools are required:
```bash
xcode-select --install
```
:::

## Method 3: Build from Source

Clone the repository and build in release mode:

```bash
git clone https://github.com/openprx/prx-sd.git
cd prx-sd
cargo build --release
```

The binary is located at `target/release/sd`. Copy it to your PATH:

```bash
sudo cp target/release/sd /usr/local/bin/sd
```

### Build Options

| Feature Flag | Default | Description |
|-------------|---------|-------------|
| `yara` | enabled | YARA-X rule engine |
| `ml` | disabled | ONNX ML inference engine |
| `gui` | disabled | Tauri + Vue 3 desktop GUI |
| `virustotal` | disabled | VirusTotal API integration |

To build with ML inference support:

```bash
cargo build --release --features ml
```

To build the desktop GUI:

```bash
cargo build --release --features gui
```

## Method 4: Docker

Pull the official Docker image:

```bash
docker pull ghcr.io/openprx/prx-sd:latest
```

Run a scan by mounting a target directory:

```bash
docker run --rm -v /path/to/scan:/scan ghcr.io/openprx/prx-sd:latest scan /scan --recursive
```

For real-time monitoring, run as a daemon:

```bash
docker run -d \
  --name prx-sd \
  --restart unless-stopped \
  -v /home:/watch/home:ro \
  -v /tmp:/watch/tmp:ro \
  ghcr.io/openprx/prx-sd:latest \
  monitor /watch/home /watch/tmp
```

::: tip Docker Compose
A `docker-compose.yml` is available in the repository root for production deployments with automatic signature updates.
:::

## Platform Notes

### Linux

PRX-SD works on any modern Linux distribution. For real-time monitoring, the `inotify` subsystem is used. You may need to increase the watch limit for large directory trees:

```bash
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

Rootkit detection and memory scanning require root privileges.

### macOS

PRX-SD uses FSEvents for real-time monitoring on macOS. Both Apple Silicon (aarch64) and Intel (x86_64) are supported. The install script automatically detects your architecture.

::: warning macOS Gatekeeper
If macOS blocks the binary, remove the quarantine attribute:
```bash
xattr -d com.apple.quarantine /usr/local/bin/sd
```
:::

### Windows (WSL2)

PRX-SD runs inside WSL2 using the Linux binary. Install WSL2 with a Linux distribution first, then follow the Linux installation steps. Native Windows support is planned for a future release.

## Verify Installation

After installation, verify that `sd` is working:

```bash
sd --version
```

Expected output:

```
prx-sd 0.5.0
```

Check the full system status including signature database:

```bash
sd info
```

This displays the installed version, signature counts, YARA rule counts, and database paths.

## Uninstalling

### Script / Cargo Install

```bash
# Remove the binary
sudo rm /usr/local/bin/sd
# Or if installed via Cargo
cargo uninstall prx-sd

# Remove signature database and configuration
rm -rf ~/.config/prx-sd
rm -rf ~/.local/share/prx-sd
```

### Docker

```bash
docker stop prx-sd && docker rm prx-sd
docker rmi ghcr.io/openprx/prx-sd:latest
```

## Next Steps

- [Quick Start](./quickstart) -- Get scanning in 5 minutes
- [File & Directory Scanning](../scanning/file-scan) -- Full `sd scan` command reference
- [Detection Engine Overview](../detection/) -- Understand the multi-layer pipeline
