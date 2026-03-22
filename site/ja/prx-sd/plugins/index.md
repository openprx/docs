---
title: WASMプラグイン開発
description: "WebAssemblyプラグインを使用してPRX-SDをカスタム検出ロジックで拡張。Rust、Go、C、またはWASMにコンパイルされる任意の言語でプラグインを作成。"
---

# WASMプラグイン開発

PRX-SDには[Wasmtime](https://wasmtime.dev/)を搭載したプラグインシステムが含まれており、WebAssembly（Rust、Go、C、AssemblyScriptなど）にコンパイルされる任意の言語で書かれたカスタムスキャナーで検出エンジンを拡張できます。プラグインは設定可能なリソース制限を持つサンドボックス化されたWASM環境で実行されます。

## アーキテクチャ

```
~/.prx-sd/plugins/
  my-scanner/
    plugin.json          # Plugin manifest
    my_scanner.wasm      # Compiled WASM module
  another-plugin/
    plugin.json
    another_plugin.wasm
```

スキャンエンジンが起動すると、`PluginRegistry`はプラグインディレクトリを走査し、`plugin.json`を含むすべてのサブディレクトリを読み込み、WASMモジュールをコンパイルして、プラグインの`on_load`エクスポートを呼び出します。スキャン中、現在のファイルに`file_types`と`platforms`が一致する各プラグインが順次呼び出されます。

### 実行フロー

1. **探索** -- `PluginRegistry`が`~/.prx-sd/plugins/`内の`plugin.json`ファイルを検索
2. **コンパイル** -- Wasmtimeがfuelメータリングとメモリ制限付きで`.wasm`モジュールをコンパイル
3. **初期化** -- `on_load()`が呼び出され、`plugin_name()`と`plugin_version()`が読み取られる
4. **スキャン** -- 各ファイルに対して、`scan(ptr, len) -> score`がファイルデータと共に呼び出される
5. **レポート** -- プラグインは`report_finding()`を呼び出して脅威を登録するか、非ゼロスコアを返す

## プラグインマニフェスト（plugin.json）

すべてのプラグインディレクトリには、プラグインとそのサンドボックス制約を説明する`plugin.json`が必要です：

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

### マニフェストフィールド

| フィールド | タイプ | 必須 | 説明 |
|-------|------|----------|-------------|
| `name` | `string` | はい | 人間が読めるプラグイン名 |
| `version` | `string` | はい | プラグインのセマンティックバージョン |
| `author` | `string` | はい | プラグインの作者または組織 |
| `description` | `string` | はい | プラグインが検出するものの簡単な説明 |
| `wasm_file` | `string` | はい | コンパイルされたWASMモジュールのファイル名（プラグインディレクトリからの相対パス） |
| `platforms` | `string[]` | はい | ターゲットプラットフォーム：`"linux"`、`"macos"`、`"windows"`、または`"all"` |
| `file_types` | `string[]` | はい | 検査するファイルタイプ：`"pe"`、`"elf"`、`"macho"`、`"pdf"`、または`"all"` |
| `min_engine_version` | `string` | はい | 必要なPRX-SDエンジンの最小バージョン |
| `permissions.network` | `boolean` | いいえ | プラグインがネットワークにアクセスできるか（デフォルト：`false`） |
| `permissions.filesystem` | `boolean` | いいえ | プラグインがWASI経由でホストファイルシステムにアクセスできるか（デフォルト：`false`） |
| `permissions.max_memory_mb` | `integer` | いいえ | MiB単位の最大リニアメモリ（デフォルト：`64`） |
| `permissions.max_exec_ms` | `integer` | いいえ | ms単位の最大ウォールクロック実行時間（デフォルト：`5000`） |

## 必須WASMエクスポート

WASMモジュールは以下の関数をエクスポートする必要があります：

### `scan(ptr: i32, len: i32) -> i32`

メインスキャンエントリポイント。ゲストメモリ内のファイルデータへのポインタと長さを受け取ります。0から100の脅威スコアを返します：

- `0` = クリーン
- `1-29` = 情報提供
- `30-59` = 疑わしい
- `60-100` = 悪意のある

### `memory`

モジュールはホストがファイルデータを書き込み、結果を読み取れるように`memory`としてリニアメモリをエクスポートする必要があります。

## オプションWASMエクスポート

| エクスポート | シグネチャ | 説明 |
|--------|-----------|-------------|
| `on_load() -> i32` | `() -> i32` | コンパイル後に1回呼び出される。成功時は`0`を返す。 |
| `plugin_name(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | プラグイン名をバッファに書き込む。実際の長さを返す。 |
| `plugin_version(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | プラグインバージョンをバッファに書き込む。実際の長さを返す。 |
| `alloc(size: i32) -> i32` | `(i32) -> i32` | `size`バイトのゲストメモリを割り当てる。ポインタを返す。 |

## プラグインが使用できるホスト関数

ホストは`"env"`名前空間でこれらの関数を提供します：

### `report_finding(name_ptr, name_len, score, detail_ptr, detail_len)`

脅威の検出を報告します。1回のスキャン中に複数回呼び出すことができます。

- `name_ptr` / `name_len` -- 脅威名文字列のポインタと長さ（例：`"Trojan.Marker"`）
- `score` -- 脅威スコア（0-100、クランプされる）
- `detail_ptr` / `detail_len` -- 詳細文字列のポインタと長さ

### `log_message(level, msg_ptr, msg_len)`

エンジンのトレーシングシステムにログメッセージを書き込みます。

- `level` -- `0`=trace、`1`=debug、`2`=info、`3`=warn、`4`=error
- `msg_ptr` / `msg_len` -- メッセージ文字列のポインタと長さ

### `get_file_path(buf_ptr, buf_len) -> actual_len`

スキャンされているファイルのパスをゲストバッファに読み込みます。

### `get_file_type(buf_ptr, buf_len) -> actual_len`

検出されたファイルタイプ（例：`"pe"`、`"elf"`、`"pdf"`）をゲストバッファに読み込みます。

## PluginFinding構造体

プラグインが検出を報告すると（`report_finding()`経由または非ゼロスコアを返すことで）、エンジンは`PluginFinding`を作成します：

```rust
pub struct PluginFinding {
    pub plugin_name: String,   // Name of the plugin
    pub threat_name: String,   // e.g. "Trojan.Marker"
    pub score: u32,            // 0-100
    pub detail: String,        // Free-form detail string
}
```

プラグインが非ゼロスコアを返しても`report_finding()`を呼び出さない場合、エンジンは自動的に検出を合成します：

```
threat_name: "Plugin.<plugin_name>"
detail: "Plugin '<name>' returned threat score <score>"
```

## 開発ワークフロー

### 1. プラグインディレクトリの作成

```bash
mkdir -p ~/.prx-sd/plugins/my-scanner
```

### 2. マニフェストの作成

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

### 3. プラグインの作成（Rust例）

新しいRustライブラリプロジェクトを作成：

```bash
cargo new --lib my-scanner
cd my-scanner
```

`Cargo.toml`に追加：

```toml
[lib]
crate-type = ["cdylib"]

[profile.release]
opt-level = "s"
lto = true
```

`src/lib.rs`を作成：

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

### 4. WASMへのコンパイル

```bash
rustup target add wasm32-wasip1
cargo build --release --target wasm32-wasip1
cp target/wasm32-wasip1/release/my_scanner.wasm ~/.prx-sd/plugins/my-scanner/
```

### 5. プラグインのテスト

```bash
# Create a test file with the marker
echo "MALICIOUS_MARKER" > /tmp/test-marker.txt

# Scan with debug logging to see plugin activity
sd --log-level debug scan /tmp/test-marker.txt
```

::: tip
プラグインの読み込みと実行の詳細なメッセージ（fuelの消費量やメモリ使用量を含む）を確認するには`--log-level debug`を使用してください。
:::

## サンドボックスセキュリティ

プラグインは以下の制約を持つWasmtimeサンドボックス内で実行されます：

| 制約 | 実施方法 |
|-----------|-------------|
| **メモリ制限** | マニフェストの`max_memory_mb`；WasmtimeがリニアメモリのキャップをEnforce |
| **CPU制限** | `max_exec_ms`をfuelユニットに変換；fuelが切れたら実行を停止 |
| **ネットワーク** | デフォルトで無効；`permissions.network: true`が必要 |
| **ファイルシステム** | デフォルトで無効；`permissions.filesystem: true`が必要（WASIプリオープン） |
| **プラットフォームチェック** | `platforms`が一致しないプラグインはロード時にスキップ |
| **ファイルタイプフィルター** | `file_types`が一致しないプラグインはファイルごとにスキップ |

::: warning
`network: true`または`filesystem: true`の場合でも、WASIサンドボックスは特定のディレクトリやエンドポイントへのアクセスを制限します。これらの権限は意図の宣言であり、無制限のアクセス付与ではありません。
:::

## ホットリロード

新しいプラグインディレクトリを`~/.prx-sd/plugins/`にドロップすると、次のスキャンでレジストリがそれを検出します。デーモンの場合は`sd update`を呼び出すかデーモンを再起動することでリロードをトリガーできます。

## 次のステップ

- リポジトリの[サンプルプラグイン](https://github.com/openprx/prx-sd/tree/main/crates/plugins/examples/example-plugin)を確認
- プラグインの検出がどのように集約されるかを理解するために[検出エンジン](../detection/)パイプラインについて学ぶ
- 利用可能なすべてのコマンドについては[CLIリファレンス](../cli/)を参照
