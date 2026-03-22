---
title: WASM Plugin-ის შემუშავება
description: "PRX-SD-ის გამოვლენის ლოგიკის გაფართოება WebAssembly plugin-ებით. Plugin-ების დაწერა Rust, Go, C ან ნებისმიერ WASM-კომპილირებად ენაზე."
---

# WASM Plugin-ის შემუშავება

PRX-SD შეიცავს [Wasmtime](https://wasmtime.dev/)-ზე დაფუძნებულ plugin-ის სისტემას, რომელიც გამოვლენის ძრავის გაფართოების საშუალებას გვაძლევს WebAssembly-ში კომპილირებად ნებისმიერ ენაზე (Rust, Go, C, AssemblyScript და სხვ.) დაწერილი მომხმარებლის სკანერებით. Plugin-ები კონფიგურირებადი რესურს-ლიმიტებიანი WASM გარემოში იზოლირებულად სრულდება.

## არქიტექტურა

```
~/.prx-sd/plugins/
  my-scanner/
    plugin.json          # Plugin manifest
    my_scanner.wasm      # Compiled WASM module
  another-plugin/
    plugin.json
    another_plugin.wasm
```

სკანის ძრავის დაწყებისას `PluginRegistry` plugins დირექტორიას გადის, `plugin.json`-ის შემცველ ყველა ქვედირექტორიას ტვირთავს, WASM მოდულს კომპილირებს და plugin-ის `on_load` ექსპორტს იძახებს. სკანირების დროს ყოველი plugin, რომლის `file_types` და `platforms` მიმდინარე ფაილს შეესაბამება, თანმიმდევრობით გამოიძახება.

### შესრულების ნაკადი

1. **აღმოჩენა** -- `PluginRegistry` `~/.prx-sd/plugins/`-ში `plugin.json` ფაილებს პოულობს
2. **კომპილაცია** -- Wasmtime `.wasm` მოდულს fuel metering-ისა და მეხსიერების ლიმიტებით კომპილირებს
3. **ინიციალიზება** -- `on_load()` გამოიძახება; `plugin_name()` და `plugin_version()` იკითხება
4. **სკანირება** -- ყოველი ფაილისთვის `scan(ptr, len) -> score` ფაილის მონაცემებით გამოიძახება
5. **ანგარიში** -- Plugin-ები `report_finding()`-ს იძახებენ საფრთხეების სარეგისტრაციოდ, ან ნულოვანი-არარა სქოლს აბრუნებს

## Plugin Manifest (`plugin.json`)

ყოველი plugin-ის დირექტორია `plugin.json`-ს უნდა შეიცავდეს, რომელიც plugin-სა და მის sandbox შეზღუდვებს აღწერს:

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

### Manifest ველები

| ველი | ტიპი | საჭირო | აღწერა |
|-------|------|----------|-------------|
| `name` | `string` | კი | ადამიანისთვის-წასაკითხი plugin-ის სახელი |
| `version` | `string` | კი | Plugin-ის სემანტიკური ვერსია |
| `author` | `string` | კი | Plugin-ის ავტორი ან ორგანიზაცია |
| `description` | `string` | კი | Plugin-ის გამოვლენის მოკლე აღწერა |
| `wasm_file` | `string` | კი | კომპილირებული WASM მოდულის ფაილის სახელი (plugin-ის დირექტორიის მიმართ) |
| `platforms` | `string[]` | კი | სამიზნე პლატფორმები: `"linux"`, `"macos"`, `"windows"` ან `"all"` |
| `file_types` | `string[]` | კი | შესამოწმებელი ფაილის ტიპები: `"pe"`, `"elf"`, `"macho"`, `"pdf"` ან `"all"` |
| `min_engine_version` | `string` | კი | საჭირო PRX-SD ძრავის მინიმალური ვერსია |
| `permissions.network` | `boolean` | არა | plugin-ს შეუძლია თუ არა ქსელზე წვდომა (ნაგულისხმევი: `false`) |
| `permissions.filesystem` | `boolean` | არა | plugin-ს შეუძლია თუ არა WASI-ის გავლით ჰოსტ-ფაილ-სისტემაზე წვდომა (ნაგულისხმევი: `false`) |
| `permissions.max_memory_mb` | `integer` | არა | MiB-ში მაქსიმალური წრფივი მეხსიერება (ნაგულისხმევი: `64`) |
| `permissions.max_exec_ms` | `integer` | არა | ms-ში მაქსიმალური შესრულების დრო (ნაგულისხმევი: `5000`) |

## საჭირო WASM ექსპორტები

WASM მოდულმა შემდეგი ფუნქციები უნდა ექსპორტოს:

### `scan(ptr: i32, len: i32) -> i32`

სკანირების მთავარი შესასვლელი წერტილი. მიეწოდება მაჩვენებელი და სიგრძე სტუმრის მეხსიერებაში ფაილის მონაცემებისა. 0-დან 100-მდე საფრთხის სქოლს აბრუნებს:

- `0` = სუფთა
- `1-29` = ინფორმაციული
- `30-59` = საეჭვო
- `60-100` = მავნე

### `memory`

მოდულმა თავისი წრფივი მეხსიერება `memory`-ად უნდა ექსპორტოს, რათა ჰოსტმა ფაილის მონაცემები ჩაწეროს და შედეგები წაიკითხოს.

## სურვილისამებრ WASM ექსპორტები

| ექსპორტი | სიგნატურა | აღწერა |
|--------|-----------|-------------|
| `on_load() -> i32` | `() -> i32` | კომპილაციის შემდეგ ერთჯერ გამოიძახება. წარმატებისას `0` დაბრუნება. |
| `plugin_name(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | plugin-ის სახელის ბუფერში ჩაწერა. ფაქტობრივი სიგრძის დაბრუნება. |
| `plugin_version(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | plugin-ის ვერსიის ბუფერში ჩაწერა. ფაქტობრივი სიგრძის დაბრუნება. |
| `alloc(size: i32) -> i32` | `(i32) -> i32` | სტუმრის მეხსიერებაში `size` ბაიტის გამოყოფა. მაჩვენებლის დაბრუნება. |

## Plugin-ებისთვის ხელმისაწვდომი ჰოსტ-ფუნქციები

ჰოსტი ამ ფუნქციებს `"env"` სახელსივრცეში გვაძლევს:

### `report_finding(name_ptr, name_len, score, detail_ptr, detail_len)`

საფრთხის დაფიქსირება. შეიძლება ერთი სკანირების განმავლობაში რამდენჯერმე გამოიძახოს.

- `name_ptr` / `name_len` -- საფრთხის სახელ-სტრიქონის მაჩვენებელი და სიგრძე (მაგ. `"Trojan.Marker"`)
- `score` -- საფრთხის სქოლი (0-100, დამჭრელი)
- `detail_ptr` / `detail_len` -- დეტალ-სტრიქონის მაჩვენებელი და სიგრძე

### `log_message(level, msg_ptr, msg_len)`

ძრავის tracing სისტემაში ჟურნალ-შეტყობინების ჩაწერა.

- `level` -- `0`=trace, `1`=debug, `2`=info, `3`=warn, `4`=error
- `msg_ptr` / `msg_len` -- შეტყობინება-სტრიქონის მაჩვენებელი და სიგრძე

### `get_file_path(buf_ptr, buf_len) -> actual_len`

სკანირებული ფაილის გზის სტუმრის ბუფერში წაკითხვა.

### `get_file_type(buf_ptr, buf_len) -> actual_len`

გამოვლენილი ფაილის ტიპის (მაგ. `"pe"`, `"elf"`, `"pdf"`) სტუმრის ბუფერში წაკითხვა.

## PluginFinding სტრუქტურა

plugin-ის დაფიქსირების (`report_finding()`-ის გავლით ან ნულოვანი-არარა სქოლის დაბრუნებით) შემდეგ ძრავა `PluginFinding`-ს ქმნის:

```rust
pub struct PluginFinding {
    pub plugin_name: String,   // Name of the plugin
    pub threat_name: String,   // e.g. "Trojan.Marker"
    pub score: u32,            // 0-100
    pub detail: String,        // Free-form detail string
}
```

თუ plugin-ი ნულოვანი-არარა სქოლს აბრუნებს, მაგრამ `report_finding()`-ს არ იძახებს, ძრავა ავტომატურად ქმნის დაფიქსირებას:

```
threat_name: "Plugin.<plugin_name>"
detail: "Plugin '<name>' returned threat score <score>"
```

## შემუშავების სამუშაო ნაკადი

### 1. Plugin-ის დირექტორიის შექმნა

```bash
mkdir -p ~/.prx-sd/plugins/my-scanner
```

### 2. Manifest-ის დაწერა

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

### 3. Plugin-ის დაწერა (Rust-ის მაგალითი)

ახალი Rust ბიბლიოთეკის პროექტის შექმნა:

```bash
cargo new --lib my-scanner
cd my-scanner
```

`Cargo.toml`-ში დამატება:

```toml
[lib]
crate-type = ["cdylib"]

[profile.release]
opt-level = "s"
lto = true
```

`src/lib.rs`-ის დაწერა:

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

### 4. WASM-ად კომპილაცია

```bash
rustup target add wasm32-wasip1
cargo build --release --target wasm32-wasip1
cp target/wasm32-wasip1/release/my_scanner.wasm ~/.prx-sd/plugins/my-scanner/
```

### 5. Plugin-ის ტესტირება

```bash
# Create a test file with the marker
echo "MALICIOUS_MARKER" > /tmp/test-marker.txt

# Scan with debug logging to see plugin activity
sd --log-level debug scan /tmp/test-marker.txt
```

::: tip
Plugin-ის ჩატვირთვისა და შესრულების დეტალური შეტყობინებების, მათ შორის fuel-ის მოხმარებისა და მეხსიერების გამოყენების სანახავად `--log-level debug`-ის გამოყენება.
:::

## Sandbox-ის უსაფრთხოება

Plugin-ები Wasmtime sandbox-ში სრულდება შემდეგი შეზღუდვებით:

| შეზღუდვა | აღსრულება |
|-----------|-------------|
| **მეხსიერების ლიმიტი** | manifest-ის `max_memory_mb`; Wasmtime წრფივი მეხსიერების ზღვარს ახდენს |
| **CPU ლიმიტი** | `max_exec_ms` fuel ერთეულებად გარდაიქმნება; fuel ამოწურვისას შესრულება ჩერდება |
| **ქსელი** | ნაგულისხმევად გამორთული; `permissions.network: true` საჭიროებს |
| **ფაილ-სისტემა** | ნაგულისხმევად გამორთული; `permissions.filesystem: true` საჭიროებს (WASI preopens) |
| **პლატფორმის შემოწმება** | არა-შესაბამისი `platforms`-ის plugin-ები ჩატვირთვის დროს გამოტოვდება |
| **ფაილის ტიპის ფილტრი** | არა-შესაბამისი `file_types`-ის plugin-ები თითო-ფაილის საფუძველზე გამოტოვდება |

::: warning
`network: true` ან `filesystem: true`-ის შემთხვევაშიც კი WASI sandbox კონკრეტულ დირექტორიებსა და endpoint-ებზე წვდომას ზღუდავს. ეს ნებართვები განზრახვის დეკლარაციაა, არა ფართო წვდომის მინიჭება.
:::

## Hot Reload

ახალი plugin-ის დირექტორიის `~/.prx-sd/plugins/`-ში ჩაგდება registry-ს შემდეგ სკანზე პოვნის საშუალებას მისცემს. დემონისთვის `sd update`-ის გამოძახებით ან დემონის გადაშვებით reload-ის გამოწვევა.

## შემდეგი ნაბიჯები

- [მაგალითი plugin-ის](https://github.com/openprx/prx-sd/tree/main/crates/plugins/examples/example-plugin) განხილვა საცავში
- [გამოვლენის ძრავის](../detection/) პაიფლაინის შესწავლა plugin-ის დასკვნების აგრეგაციის გასაგებად
- ყველა ხელმისაწვდომი ბრძანების სანახავად [CLI ცნობარის](../cli/) შესწავლა
