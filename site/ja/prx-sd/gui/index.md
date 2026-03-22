---
title: デスクトップアプリケーション（GUI）
description: "PRX-SDはTauri 2とVue 3で構築されたクロスプラットフォームデスクトップアプリケーションを提供します。システムトレイ統合、ドラッグアンドドロップスキャン、リアルタイムダッシュボードを備えています。"
---

# デスクトップアプリケーション（GUI）

PRX-SDには**Tauri 2**（Rustバックエンド）と**Vue 3**（TypeScriptフロントエンド）で構築されたクロスプラットフォームデスクトップアプリケーションが含まれています。GUIはコマンドラインを必要とせず、すべてのコアエンジン機能へのビジュアルインターフェースを提供します。

## アーキテクチャ

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

TauriバックエンドはVueフロントエンドがスキャンエンジン、隔離ボールト、シグネチャデータベース、adblockフィルターエンジンと対話するために呼び出す18のIPCコマンドを公開します。すべての重い処理（スキャン、YARAマッチング、ハッシュルックアップ）はRustで実行され、フロントエンドはレンダリングのみを担当します。

## 機能

### リアルタイムダッシュボード

ダッシュボードはひと目でわかるセキュリティ状態を表示します：

- **総スキャン数**
- **見つかった脅威**の件数
- **隔離されたファイル**の件数
- **最終スキャン時刻**
- **監視ステータス**（アクティブ/非アクティブ）
- **スキャン履歴チャート**（過去7日間）
- **最近の脅威**リスト（パス、脅威名、重大度レベル）

<!-- Screenshot placeholder: dashboard.png -->

### ドラッグアンドドロップスキャン

アプリケーションウィンドウにファイルまたはフォルダーをドロップして即座にスキャンを開始できます。結果は、パス、脅威レベル、検出タイプ、脅威名、スキャン時刻の列を含むソート可能なテーブルに表示されます。

<!-- Screenshot placeholder: scan-results.png -->

### 隔離管理

ビジュアルインターフェースで隔離されたファイルを表示、復元、削除：

- ID、元のパス、脅威名、日付、ファイルサイズを含むソート可能なテーブル
- ワンクリックで元の場所に復元
- ワンクリックで完全削除
- ボールト統計（総ファイル数、総サイズ、最古/最新エントリ）

### 設定エディター

フォームベースのインターフェースですべてのエンジン設定を編集できます。変更は`~/.prx-sd/config.json`に書き込まれ、次のスキャンから有効になります。

### シグネチャの更新

GUIからシグネチャデータベースの更新をトリガーします。バックエンドは最新のマニフェストをダウンロードし、SHA-256整合性を確認して更新をインストールします。エンジンは新しいシグネチャで自動的に再初期化されます。

### adblockパネル

広告および悪意のあるドメインブロッキングを管理：

- adblock保護を有効/無効化
- フィルターリストを同期
- 個別ドメインをチェック
- ブロックログを表示（最新50エントリ）
- リスト設定と統計を表示

### システムトレイ

PRX-SDは永続的なアイコンでシステムトレイに常駐し、以下への素早いアクセスを提供します：

- メインウィンドウを開く
- リアルタイム監視の開始/停止
- デーモンのステータスを確認
- クイックスキャンをトリガー
- アプリケーションを終了

::: tip
システムトレイアイコンは32x32ピクセルで設定されています。高DPIディスプレイでは、Tauriが自動的に`128x128@2x.png`バリアントを使用します。
:::

## ソースからのビルド

### 前提条件

- **Rust** 1.85.0以降
- **Node.js** 18以降（npm付き）
- **システム依存関係**（Linux）：

```bash
# Debian/Ubuntu
sudo apt install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

# Fedora
sudo dnf install -y webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel
```

### 開発モード

ホットリロードでフロントエンド開発サーバーとTauriバックエンドを一緒に実行：

```bash
cd gui
npm install
npm run tauri dev
```

これにより以下が起動します：
- `http://localhost:1420`のVite開発サーバー
- 開発URLを読み込むTauriバックエンド

### 本番ビルド

配布可能なアプリケーションバンドルをビルド：

```bash
cd gui
npm install
npm run tauri build
```

ビルド出力はプラットフォームによって異なります：

| プラットフォーム | 出力 |
|----------|--------|
| Linux | `src-tauri/target/release/bundle/`内の`.deb`、`.AppImage`、`.rpm` |
| macOS | `src-tauri/target/release/bundle/`内の`.dmg`、`.app` |
| Windows | `src-tauri\target\release\bundle\`内の`.msi`、`.exe` |

## アプリケーション設定

Tauriアプリは`gui/src-tauri/tauri.conf.json`で設定されます：

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

## IPCコマンド

バックエンドはフロントエンドにこれらのTauriコマンドを公開します：

| コマンド | 説明 |
|---------|-------------|
| `scan_path` | ファイルまたはディレクトリをスキャンして結果を返す |
| `scan_directory` | ディレクトリを再帰的にスキャン |
| `start_monitor` | リアルタイム監視を検証して開始 |
| `stop_monitor` | 監視デーモンを停止 |
| `get_quarantine_list` | すべての隔離エントリを一覧表示 |
| `restore_quarantine` | IDで隔離されたファイルを復元 |
| `delete_quarantine` | IDで隔離エントリを削除 |
| `get_config` | 現在のスキャン設定を読み取る |
| `save_config` | スキャン設定をディスクに書き込む |
| `get_engine_info` | エンジンバージョン、シグネチャ数、YARAルール数を取得 |
| `update_signatures` | 最新のシグネチャをダウンロードしてインストール |
| `get_alert_history` | 監査ログからアラート履歴を読み取る |
| `get_dashboard_stats` | ダッシュボード統計を集計 |
| `get_adblock_stats` | adblockのステータスとルール数を取得 |
| `adblock_enable` | ホストファイルの広告ブロッキングを有効化 |
| `adblock_disable` | ホストファイルの広告ブロッキングを無効化 |
| `adblock_sync` | フィルターリストを再ダウンロード |
| `adblock_check` | ドメインがブロックされているか確認 |
| `get_adblock_log` | 最近のブロックログエントリを読み取る |

## データディレクトリ

GUIはCLIと同じ`~/.prx-sd/`データディレクトリを使用します。GUIで行った設定変更は`sd`コマンドからも見え、その逆も同様です。

::: warning
GUIとCLIは同じスキャンエンジン状態を共有します。`sd daemon`経由でデーモンが実行中の場合、GUIの「監視を開始」ボタンは準備状況を検証しますが、実際の監視はデーモンプロセスが処理します。同じファイルに対してGUIスキャナーとデーモンスキャナーを同時に実行しないようにしてください。
:::

## テックスタック

| コンポーネント | テクノロジー |
|-----------|-----------|
| バックエンド | Tauri 2、Rust |
| フロントエンド | Vue 3、TypeScript、Vite 6 |
| IPC | Tauriコマンドプロトコル |
| トレイ | Tauriトレイプラグイン |
| バンドラー | Tauriバンドラー（deb/AppImage/dmg/msi） |
| APIバインディング | `@tauri-apps/api` v2 |

## 次のステップ

- [インストールガイド](../getting-started/installation)に従ってPRX-SDをインストール
- スクリプトと自動化のための[CLI](../cli/)について学ぶ
- [設定リファレンス](../configuration/reference)経由でエンジンを設定
- [WASMプラグイン](../plugins/)で検出を拡張
