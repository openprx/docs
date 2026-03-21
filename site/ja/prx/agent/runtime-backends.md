---
title: ランタイムバックエンド
description: PRX のプラガブル実行バックエンド -- Native、Docker、WASM ランタイムによるツールとコマンド実行
---

# ランタイムバックエンド

PRX はツール、コマンド、外部プロセスの実行に複数の実行バックエンドをサポートします。ランタイムサブシステムは `RuntimeAdapter` トレイトの背後に実行環境を抽象化し、エージェント設定を変更することなくローカルプロセス実行、Docker コンテナ、WebAssembly サンドボックスを切り替えることができます。

## 概要

エージェントが外部コマンドの実行を必要とするツール（シェルスクリプト、MCP サーバー、スキル統合）を実行する場合、ランタイムバックエンドがそのコマンドの実行方法を決定します:

| バックエンド | 分離レベル | オーバーヘッド | ユースケース |
|---------|-----------|----------|----------|
| **Native** | プロセスレベル | 最小 | 開発、信頼された環境 |
| **Docker** | コンテナレベル | 中程度 | 本番、信頼されていないツール、再現性 |
| **WASM** | サンドボックスレベル | 低 | ポータブルスキル、最大の分離、プラグインシステム |

```
Agent Loop
    │
    ├── Tool Call: "shell" with command "ls -la"
    │
    ▼
┌───────────────────────────────────┐
│         RuntimeAdapter            │
│  ┌─────────┬─────────┬─────────┐ │
│  │ Native  │ Docker  │  WASM   │ │
│  │ Runtime │ Runtime │ Runtime │ │
│  └────┬────┴────┬────┴────┬────┘ │
└───────┼─────────┼─────────┼──────┘
        │         │         │
   ┌────▼────┐ ┌──▼───┐ ┌──▼────┐
   │ Process │ │ ctr  │ │ wasmr │
   │ spawn   │ │ exec │ │ exec  │
   └─────────┘ └──────┘ └───────┘
```

## RuntimeAdapter トレイト

すべてのバックエンドは `RuntimeAdapter` トレイトを実装します:

```rust
#[async_trait]
pub trait RuntimeAdapter: Send + Sync {
    async fn execute(&self, command: &str, args: &[String],
        env: &HashMap<String, String>, working_dir: Option<&Path>,
        timeout: Duration) -> Result<ExecutionOutput>;
    async fn is_available(&self) -> bool;
    fn name(&self) -> &str;
}
```

`ExecutionOutput` には `stdout`、`stderr`、`exit_code`、`duration` が含まれます。

## 設定

`config.toml` でランタイムバックエンドを選択・設定します:

```toml
[runtime]
# Backend selection: "native" | "docker" | "wasm" | "auto"
backend = "auto"

# Global execution timeout (can be overridden per-tool).
default_timeout_secs = 60

# Maximum output size captured from stdout/stderr.
max_output_bytes = 1048576  # 1 MB

# Environment variable whitelist. Only these variables are
# passed to child processes (all backends).
env_whitelist = ["PATH", "HOME", "TERM", "LANG", "USER"]
```

### 自動検出

`backend = "auto"` の場合、PRX は利用可能性に基づいてランタイムを選択します:

1. Docker が実行中でアクセス可能な場合、Docker を使用
2. WASM ランタイムが利用可能な場合、互換ツールに WASM を使用
3. Native にフォールバック

自動検出は起動時に 1 回実行され、選択されたバックエンドがログに記録されます。

## Native ランタイム

Native ランタイムは `tokio::process::Command` を使用してローカル子プロセスとしてコマンドをスポーンします。最もシンプルで高速なバックエンドで、追加の依存関係はありません。

### 設定

```toml
[runtime]
backend = "native"

[runtime.native]
# Shell to use for command execution.
shell = "/bin/bash"

# Additional environment variables to set.
[runtime.native.env]
RUSTFLAGS = "-D warnings"
```

### 特性

| プロパティ | 値 |
|----------|-------|
| 分離 | プロセスレベルのみ（ユーザー権限を継承） |
| 起動時間 | < 10ms |
| ファイルシステムアクセス | フル（ユーザー権限とサンドボックスにより制限） |
| ネットワークアクセス | フル（サンドボックスにより制限） |
| 依存関係 | なし |
| プラットフォーム | すべて（Linux、macOS、Windows） |

### セキュリティの考慮事項

Native ランタイムは標準的な Unix プロセス境界を超える分離を提供しません。コマンドは PRX プロセスと同じ権限で実行されます。信頼されていないコマンドを実行する場合は、常に [サンドボックスサブシステム](/ja/prx/security/sandbox) と組み合わせてください:

```toml
[runtime]
backend = "native"

[security.sandbox]
backend = "bubblewrap"
allow_network = false
writable_paths = ["/tmp"]
```

## Docker ランタイム

Docker ランタイムはエフェメラルコンテナ内でコマンドを実行します。各実行で新しいコンテナを作成し、コマンドを実行し、出力をキャプチャし、コンテナを破棄します。

### 設定

```toml
[runtime]
backend = "docker"

[runtime.docker]
image = "debian:bookworm-slim"
socket = "/var/run/docker.sock"
memory_limit = "256m"
cpu_limit = "1.0"
pids_limit = 100
network = "none"          # "none" | "bridge" | "host"
mount_workspace = true
workspace_mount_path = "/workspace"
auto_pull = true
auto_remove = true
```

起動時間はイメージによって 500ms-2s です。ファイルシステムアクセスはコンテナと明示的にマウントされたボリュームに制限されます。

### セキュリティ

Docker ランタイムはデフォルトで強力な分離を提供します: ネットワーク分離（`network = "none"`）、リソース制限（メモリ/CPU/PID）、読み取り専用ルートファイルシステム、特権モードなし、実行後の自動コンテナ削除。`[runtime.docker.tool_images]` でツールごとのイメージオーバーライドがサポートされています。

## WASM ランタイム

WASM（WebAssembly）ランタイムは `.wasm` モジュールにコンパイルされたツールを実行します。WASM は WASI（WebAssembly System Interface）による細かい粒度のケーパビリティ制御で、ポータブルかつサンドボックス化された実行を提供します。

### 設定

```toml
[runtime]
backend = "wasm"

[runtime.wasm]
# WASM runtime engine: "wasmtime" | "wasmer"
engine = "wasmtime"

# Directory containing .wasm modules.
module_path = "~/.local/share/openprx/wasm/"

# WASI capabilities granted to WASM modules.
[runtime.wasm.capabilities]
filesystem_read = ["/workspace"]
filesystem_write = ["/tmp"]
network = false
env_vars = ["HOME", "USER"]

# Maximum execution time for a single WASM call.
timeout_secs = 30

# Maximum memory allocation for WASM modules.
max_memory_mb = 128
```

### 特性

| プロパティ | 値 |
|----------|-------|
| 分離 | WASM サンドボックス（ケーパビリティベース） |
| 起動時間 | 10-50ms |
| ファイルシステムアクセス | WASI プレオープンディレクトリのみ |
| ネットワークアクセス | WASI 経由で設定可能 |
| 依存関係 | `wasmtime` または `wasmer` ランタイム（条件付きコンパイル） |
| プラットフォーム | すべて（WASM はプラットフォーム非依存） |

### 条件付きコンパイル

WASM ランタイムはフィーチャーフラグの背後で条件付きコンパイルされます:

```bash
# WASM サポート付きで PRX をビルド
cargo build --release --features wasm-runtime
```

フィーチャーフラグなしでは WASM バックエンドは利用できず、`backend = "auto"` はこれをスキップします。

### プラグインシステム

WASM ランタイムは PRX のプラグインシステムを支えています。`.wasm` モジュールとして配布されるスキルは、ネイティブコードを信頼することなく動的にロードできます。`config.toml` の `[tools.custom.<name>]` に `type = "wasm"` と `module` パスで WASM ツールを登録します。

## ファクトリ関数

PRX はファクトリ関数（`create_runtime`）を使用して起動時にバックエンドを選択します。設定された `backend` 文字列を適切な `RuntimeAdapter` 実装にマッチさせ、バックエンドが利用可能であることを検証します（例: Docker デーモンの実行、WASM エンジンのコンパイル）。

## 比較マトリックス

| 機能 | Native | Docker | WASM |
|---------|--------|--------|------|
| セットアップ複雑度 | なし | Docker デーモン | フィーチャーフラグ + モジュール |
| 起動レイテンシ | < 10ms | 500ms - 2s | 10-50ms |
| 分離強度 | 低 | 高 | 高 |
| リソース制御 | OS 制限 | cgroups | WASM メモリ制限 |
| ネットワーク分離 | サンドボックス経由 | 組み込み | WASI ケーパビリティ |
| ファイルシステム分離 | サンドボックス経由 | 組み込み | WASI プレオープン |
| ポータビリティ | プラットフォームネイティブ | OCI イメージ | プラットフォーム非依存 |
| ツール互換性 | すべて | すべて（イメージあり） | WASM コンパイル済みのみ |

## セキュリティノート

- ランタイムバックエンドは防御レイヤーであり、[サンドボックス](/ja/prx/security/sandbox)の代替ではありません。両方のシステムが連携して動作します -- ランタイムは実行環境を提供し、サンドボックスは OS レベルの制限を追加します。
- Docker ランタイムは Docker ソケットへのアクセスが必要で、これ自体が特権リソースです。PRX は専用のサービスアカウントで実行してください。
- WASM モジュールにはアンビエント権限がありません。すべてのケーパビリティ（ファイルシステム、ネットワーク、環境）は明示的に付与する必要があります。
- `env_whitelist` 設定はすべてのバックエンドに適用されます。API キーとシークレットはツール実行環境に渡されません。

## 関連ページ

- [エージェントランタイムアーキテクチャ](/ja/prx/agent/runtime)
- [サンドボックス](/ja/prx/security/sandbox)
- [SkillForge](/ja/prx/tools/skillforge)
- [セッションワーカー](/ja/prx/agent/session-worker)
- [ツール概要](/ja/prx/tools/)
