---
title: Desktop Application (GUI)
description: PRX-SD ships a cross-platform desktop application built with Tauri 2 and Vue 3, featuring system tray integration, drag-and-drop scanning, and a real-time dashboard.
---

# Desktop Application (GUI)

PRX-SD includes a cross-platform desktop application built with **Tauri 2** (Rust backend) and **Vue 3** (TypeScript frontend). The GUI provides a visual interface to all core engine features without requiring the command line.

## Architecture

```
+----------------------------------------------+
|              PRX-SD Desktop App               |
|                                               |
|   Vue 3 Frontend          Tauri 2 Backend     |
|   (Vite + TypeScript)     (Rust + IPC)        |
|                                               |
|   +------------------+   +-----------------+  |
|   | Dashboard        |<->| scan_path()     |  |
|   | File Scanner     |   | scan_directory()|  |
|   | Quarantine Mgmt  |   | get_config()    |  |
|   | Config Editor    |   | save_config()   |  |
|   | Signature Update |   | update_sigs()   |  |
|   | Alert History    |   | get_alerts()    |  |
|   | Adblock Panel    |   | adblock_*()     |  |
|   | Monitor Control  |   | start/stop()    |  |
|   +------------------+   +-----------------+  |
|                                               |
|   System Tray Icon (32x32)                    |
+----------------------------------------------+
```

The Tauri backend exposes 18 IPC commands that the Vue frontend calls to interact with the scan engine, quarantine vault, signature database, and adblock filter engine. All heavy lifting (scanning, YARA matching, hash lookups) runs in Rust; the frontend only handles rendering.

## Features

### Real-Time Dashboard

The dashboard displays at-a-glance security status:

- **Total scans** performed
- **Threats found** count
- **Files quarantined** count
- **Last scan time**
- **Monitoring status** (active/inactive)
- **Scan history chart** (last 7 days)
- **Recent threats** list with paths, threat names, and severity levels

<!-- Screenshot placeholder: dashboard.png -->

### Drag-and-Drop Scanning

Drop files or folders onto the application window to immediately start a scan. Results appear in a sortable table with columns for path, threat level, detection type, threat name, and scan time.

<!-- Screenshot placeholder: scan-results.png -->

### Quarantine Management

View, restore, and delete quarantined files through a visual interface:

- Sortable table with ID, original path, threat name, date, and file size
- One-click restore to original location
- One-click permanent deletion
- Vault statistics (total files, total size, oldest/newest entry)

### Configuration Editor

Edit all engine settings through a form-based interface. Changes are written to `~/.prx-sd/config.json` and take effect on the next scan.

### Signature Updates

Trigger signature database updates from the GUI. The backend downloads the latest manifest, verifies SHA-256 integrity, and installs the update. The engine is automatically reinitialized with the new signatures.

### Adblock Panel

Manage ad and malicious domain blocking:

- Enable/disable adblock protection
- Sync filter lists
- Check individual domains
- View block log (last 50 entries)
- View list configuration and statistics

### System Tray

PRX-SD sits in the system tray with a persistent icon, providing quick access to:

- Open the main window
- Start/stop real-time monitoring
- Check daemon status
- Trigger a quick scan
- Quit the application

::: tip
The system tray icon is configured at 32x32 pixels. On high-DPI displays, Tauri automatically uses the `128x128@2x.png` variant.
:::

## Building from Source

### Prerequisites

- **Rust** 1.85.0 or later
- **Node.js** 18+ with npm
- **System dependencies** (Linux):

```bash
# Debian/Ubuntu
sudo apt install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

# Fedora
sudo dnf install -y webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel
```

### Development Mode

Run the frontend dev server and Tauri backend together with hot reload:

```bash
cd gui
npm install
npm run tauri dev
```

This starts:
- Vite dev server at `http://localhost:1420`
- Tauri backend that loads the dev URL

### Production Build

Build the distributable application bundle:

```bash
cd gui
npm install
npm run tauri build
```

The build output varies by platform:

| Platform | Output |
|----------|--------|
| Linux | `.deb`, `.AppImage`, `.rpm` in `src-tauri/target/release/bundle/` |
| macOS | `.dmg`, `.app` in `src-tauri/target/release/bundle/` |
| Windows | `.msi`, `.exe` in `src-tauri\target\release\bundle\` |

## Application Configuration

The Tauri app is configured via `gui/src-tauri/tauri.conf.json`:

```json
{
  "productName": "PRX-SD",
  "version": "0.1.0",
  "identifier": "com.prxsd.app",
  "app": {
    "windows": [
      {
        "title": "PRX-SD Antivirus",
        "width": 1200,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600,
        "center": true,
        "resizable": true
      }
    ],
    "trayIcon": {
      "id": "main-tray",
      "iconPath": "icons/32x32.png",
      "tooltip": "PRX-SD Antivirus"
    }
  }
}
```

## IPC Commands

The backend exposes these Tauri commands to the frontend:

| Command | Description |
|---------|-------------|
| `scan_path` | Scan a file or directory, return results |
| `scan_directory` | Scan a directory recursively |
| `start_monitor` | Validate and start real-time monitoring |
| `stop_monitor` | Stop the monitoring daemon |
| `get_quarantine_list` | List all quarantined entries |
| `restore_quarantine` | Restore a quarantined file by ID |
| `delete_quarantine` | Delete a quarantine entry by ID |
| `get_config` | Read current scan configuration |
| `save_config` | Write scan configuration to disk |
| `get_engine_info` | Get engine version, signature count, YARA rules |
| `update_signatures` | Download and install latest signatures |
| `get_alert_history` | Read alert history from audit logs |
| `get_dashboard_stats` | Aggregate dashboard statistics |
| `get_adblock_stats` | Get adblock status and rule counts |
| `adblock_enable` | Enable hosts-file ad blocking |
| `adblock_disable` | Disable hosts-file ad blocking |
| `adblock_sync` | Re-download filter lists |
| `adblock_check` | Check if a domain is blocked |
| `get_adblock_log` | Read recent block log entries |

## Data Directory

The GUI uses the same `~/.prx-sd/` data directory as the CLI. Configuration changes made in the GUI are visible to `sd` commands and vice versa.

::: warning
The GUI and CLI share the same scan engine state. If the daemon is running via `sd daemon`, the GUI's "Start Monitor" button validates readiness but the actual monitoring is handled by the daemon process. Avoid running the GUI scanner and daemon scanner simultaneously on the same files.
:::

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Tauri 2, Rust |
| Frontend | Vue 3, TypeScript, Vite 6 |
| IPC | Tauri command protocol |
| Tray | Tauri tray plugin |
| Bundler | Tauri bundler (deb/AppImage/dmg/msi) |
| API bindings | `@tauri-apps/api` v2 |

## Next Steps

- Install PRX-SD following the [Installation Guide](../getting-started/installation)
- Learn about the [CLI](../cli/) for scripting and automation
- Configure the engine via the [Configuration Reference](../configuration/reference)
- Extend detection with [WASM Plugins](../plugins/)
