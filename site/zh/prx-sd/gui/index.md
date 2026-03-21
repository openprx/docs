---
title: 桌面应用（GUI）
description: PRX-SD 提供基于 Tauri 2 和 Vue 3 构建的跨平台桌面应用，具备系统托盘集成、拖放扫描和实时仪表盘功能。
---

# 桌面应用（GUI）

PRX-SD 包含一个跨平台桌面应用，使用 **Tauri 2**（Rust 后端）和 **Vue 3**（TypeScript 前端）构建。GUI 为所有核心引擎功能提供了可视化界面，无需使用命令行。

## 架构

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

Tauri 后端暴露 18 个 IPC 命令，Vue 前端通过这些命令与扫描引擎、隔离区、签名数据库和广告拦截过滤引擎交互。所有繁重计算（扫描、YARA 匹配、哈希查找）在 Rust 中运行；前端仅负责渲染。

## 功能特性

### 实时仪表盘

仪表盘提供安全状态的概览：

- **总扫描次数**
- **发现威胁数**
- **已隔离文件数**
- **上次扫描时间**
- **监控状态**（活跃/未活跃）
- **扫描历史图表**（最近 7 天）
- **最近威胁列表**（含路径、威胁名称和严重级别）

<!-- Screenshot placeholder: dashboard.png -->

### 拖放扫描

将文件或文件夹拖放到应用窗口即可立即开始扫描。结果显示在可排序的表格中，包含路径、威胁级别、检测类型、威胁名称和扫描时间等列。

<!-- Screenshot placeholder: scan-results.png -->

### 隔离区管理

通过可视化界面查看、恢复和删除已隔离的文件：

- 可排序表格，包含 ID、原始路径、威胁名称、日期和文件大小
- 一键恢复到原始位置
- 一键永久删除
- 隔离区统计（文件总数、总大小、最早/最新条目）

### 配置编辑器

通过表单界面编辑所有引擎设置。更改会写入 `~/.prx-sd/config.json`，在下次扫描时生效。

### 签名更新

在 GUI 中触发签名数据库更新。后端下载最新清单，验证 SHA-256 完整性并安装更新。引擎会自动使用新签名重新初始化。

### 广告拦截面板

管理广告和恶意域名拦截：

- 启用/禁用广告拦截
- 同步过滤列表
- 检查单个域名
- 查看拦截日志（最近 50 条）
- 查看列表配置和统计信息

### 系统托盘

PRX-SD 常驻系统托盘，提供快速访问：

- 打开主窗口
- 启动/停止实时监控
- 检查守护进程状态
- 触发快速扫描
- 退出应用

::: tip
系统托盘图标配置为 32x32 像素。在高 DPI 显示器上，Tauri 会自动使用 `128x128@2x.png` 变体。
:::

## 从源码构建

### 前置条件

- **Rust** 1.85.0 或更高版本
- **Node.js** 18+ 及 npm
- **系统依赖**（Linux）：

```bash
# Debian/Ubuntu
sudo apt install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

# Fedora
sudo dnf install -y webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel
```

### 开发模式

同时运行前端开发服务器和 Tauri 后端，支持热重载：

```bash
cd gui
npm install
npm run tauri dev
```

这将启动：
- Vite 开发服务器，地址为 `http://localhost:1420`
- Tauri 后端，加载开发 URL

### 生产构建

构建可分发的应用包：

```bash
cd gui
npm install
npm run tauri build
```

构建输出因平台而异：

| 平台 | 输出 |
|------|------|
| Linux | `.deb`、`.AppImage`、`.rpm`，位于 `src-tauri/target/release/bundle/` |
| macOS | `.dmg`、`.app`，位于 `src-tauri/target/release/bundle/` |
| Windows | `.msi`、`.exe`，位于 `src-tauri\target\release\bundle\` |

## 应用配置

Tauri 应用通过 `gui/src-tauri/tauri.conf.json` 配置：

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

## IPC 命令

后端向前端暴露以下 Tauri 命令：

| 命令 | 说明 |
|------|------|
| `scan_path` | 扫描文件或目录，返回结果 |
| `scan_directory` | 递归扫描目录 |
| `start_monitor` | 验证并启动实时监控 |
| `stop_monitor` | 停止监控守护进程 |
| `get_quarantine_list` | 列出所有隔离条目 |
| `restore_quarantine` | 按 ID 恢复隔离文件 |
| `delete_quarantine` | 按 ID 删除隔离条目 |
| `get_config` | 读取当前扫描配置 |
| `save_config` | 将扫描配置写入磁盘 |
| `get_engine_info` | 获取引擎版本、签名数量、YARA 规则 |
| `update_signatures` | 下载并安装最新签名 |
| `get_alert_history` | 从审计日志读取告警历史 |
| `get_dashboard_stats` | 聚合仪表盘统计数据 |
| `get_adblock_stats` | 获取广告拦截状态和规则数量 |
| `adblock_enable` | 启用 hosts 文件广告拦截 |
| `adblock_disable` | 禁用 hosts 文件广告拦截 |
| `adblock_sync` | 重新下载过滤列表 |
| `adblock_check` | 检查域名是否被拦截 |
| `get_adblock_log` | 读取最近的拦截日志条目 |

## 数据目录

GUI 使用与 CLI 相同的 `~/.prx-sd/` 数据目录。在 GUI 中所做的配置更改对 `sd` 命令可见，反之亦然。

::: warning
GUI 和 CLI 共享相同的扫描引擎状态。如果守护进程通过 `sd daemon` 运行，GUI 的"启动监控"按钮会验证就绪状态，但实际监控由守护进程处理。避免同时在相同文件上运行 GUI 扫描器和守护进程扫描器。
:::

## 技术栈

| 组件 | 技术 |
|------|------|
| 后端 | Tauri 2, Rust |
| 前端 | Vue 3, TypeScript, Vite 6 |
| IPC | Tauri 命令协议 |
| 托盘 | Tauri 托盘插件 |
| 打包器 | Tauri 打包器（deb/AppImage/dmg/msi） |
| API 绑定 | `@tauri-apps/api` v2 |

## 后续步骤

- 按照[安装指南](../getting-started/installation)安装 PRX-SD
- 了解 [CLI](../cli/) 以实现脚本化和自动化
- 通过[配置参考](../configuration/reference)配置引擎
- 使用 [WASM 插件](../plugins/)扩展检测能力
