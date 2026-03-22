---
title: WASM 플러그인 개발
description: "WebAssembly 플러그인을 사용하여 PRX-SD를 사용자 정의 탐지 로직으로 확장합니다. Rust, Go, C 또는 WASM으로 컴파일되는 모든 언어로 플러그인을 작성합니다."
---

# WASM 플러그인 개발

PRX-SD에는 Rust, Go, C, AssemblyScript 등 WebAssembly로 컴파일되는 모든 언어로 작성된 사용자 정의 스캐너로 탐지 엔진을 확장할 수 있는 [Wasmtime](https://wasmtime.dev/) 기반의 플러그인 시스템이 포함되어 있습니다. 플러그인은 설정 가능한 리소스 제한이 있는 샌드박스된 WASM 환경에서 실행됩니다.

## 아키텍처

```
~/.prx-sd/plugins/
  my-scanner/
    plugin.json          # 플러그인 매니페스트
    my_scanner.wasm      # 컴파일된 WASM 모듈
  another-plugin/
    plugin.json
    another_plugin.wasm
```

스캔 엔진이 시작될 때 `PluginRegistry`는 플러그인 디렉토리를 탐색하고, `plugin.json`이 포함된 모든 하위 디렉토리를 로드하고, WASM 모듈을 컴파일하고, 플러그인의 `on_load` 내보내기를 호출합니다. 스캔 중에 현재 파일과 `file_types` 및 `platforms`가 일치하는 각 플러그인이 순서대로 호출됩니다.

### 실행 흐름

1. **발견** -- `PluginRegistry`가 `~/.prx-sd/plugins/`에서 `plugin.json` 파일을 찾습니다
2. **컴파일** -- Wasmtime이 연료 미터링과 메모리 제한으로 `.wasm` 모듈을 컴파일합니다
3. **초기화** -- `on_load()`가 호출되며, `plugin_name()`과 `plugin_version()`이 읽힙니다
4. **스캔** -- 각 파일에 대해 `scan(ptr, len) -> score`가 파일 데이터와 함께 호출됩니다
5. **보고** -- 플러그인은 `report_finding()`을 호출하여 위협을 등록하거나 0이 아닌 점수를 반환합니다

## 플러그인 매니페스트 (`plugin.json`)

모든 플러그인 디렉토리에는 플러그인과 샌드박스 제약 조건을 설명하는 `plugin.json`이 있어야 합니다:

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

### 매니페스트 필드

| 필드 | 유형 | 필수 | 설명 |
|-------|------|----------|-------------|
| `name` | `string` | 예 | 사람이 읽을 수 있는 플러그인 이름 |
| `version` | `string` | 예 | 플러그인의 시맨틱 버전 |
| `author` | `string` | 예 | 플러그인 작성자 또는 조직 |
| `description` | `string` | 예 | 플러그인이 탐지하는 내용의 간단한 설명 |
| `wasm_file` | `string` | 예 | 컴파일된 WASM 모듈의 파일명 (플러그인 디렉토리 기준) |
| `platforms` | `string[]` | 예 | 대상 플랫폼: `"linux"`, `"macos"`, `"windows"` 또는 `"all"` |
| `file_types` | `string[]` | 예 | 검사할 파일 유형: `"pe"`, `"elf"`, `"macho"`, `"pdf"` 또는 `"all"` |
| `min_engine_version` | `string` | 예 | 필요한 최소 PRX-SD 엔진 버전 |
| `permissions.network` | `boolean` | 아니오 | 플러그인이 네트워크에 접근할 수 있는지 여부 (기본값: `false`) |
| `permissions.filesystem` | `boolean` | 아니오 | 플러그인이 WASI를 통해 호스트 파일 시스템에 접근할 수 있는지 여부 (기본값: `false`) |
| `permissions.max_memory_mb` | `integer` | 아니오 | MiB 단위의 최대 선형 메모리 (기본값: `64`) |
| `permissions.max_exec_ms` | `integer` | 아니오 | ms 단위의 최대 벽시계 실행 시간 (기본값: `5000`) |

## 필수 WASM 내보내기

WASM 모듈은 다음 함수를 내보내야 합니다:

### `scan(ptr: i32, len: i32) -> i32`

주요 스캔 진입점입니다. 게스트 메모리의 파일 데이터에 대한 포인터와 길이를 받습니다. 0에서 100까지의 위협 점수를 반환합니다:

- `0` = 깨끗함
- `1-29` = 정보성
- `30-59` = 의심스러움
- `60-100` = 악성

### `memory`

호스트가 파일 데이터를 쓰고 결과를 읽을 수 있도록 모듈은 선형 메모리를 `memory`로 내보내야 합니다.

## 선택적 WASM 내보내기

| 내보내기 | 서명 | 설명 |
|--------|-----------|-------------|
| `on_load() -> i32` | `() -> i32` | 컴파일 후 한 번 호출됩니다. 성공 시 `0`을 반환합니다. |
| `plugin_name(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | 버퍼에 플러그인 이름을 씁니다. 실제 길이를 반환합니다. |
| `plugin_version(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | 버퍼에 플러그인 버전을 씁니다. 실제 길이를 반환합니다. |
| `alloc(size: i32) -> i32` | `(i32) -> i32` | `size` 바이트의 게스트 메모리를 할당합니다. 포인터를 반환합니다. |

## 플러그인에서 사용 가능한 호스트 함수

호스트는 `"env"` 네임스페이스에서 다음 함수를 제공합니다:

### `report_finding(name_ptr, name_len, score, detail_ptr, detail_len)`

위협 발견을 보고합니다. 단일 스캔 중에 여러 번 호출할 수 있습니다.

- `name_ptr` / `name_len` -- 위협 이름 문자열의 포인터와 길이 (예: `"Trojan.Marker"`)
- `score` -- 위협 점수 (0-100, 클램핑)
- `detail_ptr` / `detail_len` -- 세부 문자열의 포인터와 길이

### `log_message(level, msg_ptr, msg_len)`

엔진의 추적 시스템에 로그 메시지를 씁니다.

- `level` -- `0`=trace, `1`=debug, `2`=info, `3`=warn, `4`=error
- `msg_ptr` / `msg_len` -- 메시지 문자열의 포인터와 길이

### `get_file_path(buf_ptr, buf_len) -> actual_len`

스캔 중인 파일의 경로를 게스트 버퍼로 읽습니다.

### `get_file_type(buf_ptr, buf_len) -> actual_len`

탐지된 파일 유형(예: `"pe"`, `"elf"`, `"pdf"`)을 게스트 버퍼로 읽습니다.

## PluginFinding 구조

플러그인이 발견을 보고하면(either via `report_finding()` 또는 0이 아닌 점수를 반환하여) 엔진이 `PluginFinding`을 생성합니다:

```rust
pub struct PluginFinding {
    pub plugin_name: String,   // 플러그인 이름
    pub threat_name: String,   // 예: "Trojan.Marker"
    pub score: u32,            // 0-100
    pub detail: String,        // 자유 형식 세부 문자열
}
```

플러그인이 0이 아닌 점수를 반환하지만 `report_finding()`을 호출하지 않은 경우 엔진이 자동으로 발견을 합성합니다:

```
threat_name: "Plugin.<plugin_name>"
detail: "Plugin '<name>' returned threat score <score>"
```

## 개발 워크플로우

### 1. 플러그인 디렉토리 생성

```bash
mkdir -p ~/.prx-sd/plugins/my-scanner
```

### 2. 매니페스트 작성

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

### 3. 플러그인 작성 (Rust 예제)

새 Rust 라이브러리 프로젝트 생성:

```bash
cargo new --lib my-scanner
cd my-scanner
```

`Cargo.toml`에 추가:

```toml
[lib]
crate-type = ["cdylib"]

[profile.release]
opt-level = "s"
lto = true
```

`src/lib.rs` 작성:

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

### 4. WASM으로 컴파일

```bash
rustup target add wasm32-wasip1
cargo build --release --target wasm32-wasip1
cp target/wasm32-wasip1/release/my_scanner.wasm ~/.prx-sd/plugins/my-scanner/
```

### 5. 플러그인 테스트

```bash
# 마커가 있는 테스트 파일 생성
echo "MALICIOUS_MARKER" > /tmp/test-marker.txt

# 플러그인 활동을 보기 위해 디버그 로깅으로 스캔
sd --log-level debug scan /tmp/test-marker.txt
```

::: tip
`--log-level debug`를 사용하여 연료 소비 및 메모리 사용량을 포함하여 상세한 플러그인 로딩 및 실행 메시지를 확인합니다.
:::

## 샌드박스 보안

플러그인은 다음 제약 조건이 있는 Wasmtime 샌드박스 내에서 실행됩니다:

| 제약 조건 | 적용 방법 |
|-----------|-------------|
| **메모리 제한** | 매니페스트의 `max_memory_mb`; Wasmtime이 선형 메모리 상한 적용 |
| **CPU 제한** | `max_exec_ms`가 연료 단위로 변환됨; 연료가 소진되면 실행 중단 |
| **네트워크** | 기본적으로 비활성화; `permissions.network: true` 필요 |
| **파일 시스템** | 기본적으로 비활성화; `permissions.filesystem: true` 필요 (WASI preopens) |
| **플랫폼 확인** | 일치하지 않는 `platforms`를 가진 플러그인은 로드 시 건너뜀 |
| **파일 유형 필터** | 일치하지 않는 `file_types`를 가진 플러그인은 파일별로 건너뜀 |

::: warning
`network: true` 또는 `filesystem: true`가 있더라도 WASI 샌드박스는 특정 디렉토리 및 엔드포인트에 대한 접근을 제한합니다. 이러한 권한은 포괄적인 접근 권한이 아니라 의도 선언입니다.
:::

## 핫 리로드

`~/.prx-sd/plugins/`에 새 플러그인 디렉토리를 추가하면 레지스트리가 다음 스캔 시 이를 가져옵니다. 데몬의 경우 `sd update`를 호출하거나 데몬을 재시작하여 리로드를 트리거합니다.

## 다음 단계

- 저장소에서 [예제 플러그인](https://github.com/openprx/prx-sd/tree/main/crates/plugins/examples/example-plugin) 검토
- 플러그인 발견이 어떻게 집계되는지 이해하기 위해 [탐지 엔진](../detection/) 파이프라인에 대해 알아보기
- 모든 사용 가능한 명령어는 [CLI 레퍼런스](../cli/) 참조
