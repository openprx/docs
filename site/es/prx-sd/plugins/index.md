---
title: Desarrollo de Plugins WASM
description: "Extiende PRX-SD con lógica de detección personalizada usando plugins WebAssembly. Escribe plugins en Rust, Go, C o cualquier lenguaje que compile a WASM."
---

# Desarrollo de Plugins WASM

PRX-SD incluye un sistema de plugins basado en [Wasmtime](https://wasmtime.dev/) que te permite extender el motor de detección con escáneres personalizados escritos en cualquier lenguaje que compile a WebAssembly (Rust, Go, C, AssemblyScript, etc.). Los plugins se ejecutan en un entorno WASM con sandbox y límites de recursos configurables.

## Arquitectura

```
~/.prx-sd/plugins/
  my-scanner/
    plugin.json          # Plugin manifest
    my_scanner.wasm      # Compiled WASM module
  another-plugin/
    plugin.json
    another_plugin.wasm
```

Cuando el motor de escaneo se inicia, el `PluginRegistry` recorre el directorio de plugins, carga cada subdirectorio que contiene un `plugin.json`, compila el módulo WASM y llama a la exportación `on_load` del plugin. Durante un escaneo, cada plugin cuyos `file_types` y `platforms` coincidan con el archivo actual se invoca en secuencia.

### Flujo de Ejecución

1. **Descubrimiento** -- `PluginRegistry` encuentra archivos `plugin.json` en `~/.prx-sd/plugins/`
2. **Compilación** -- Wasmtime compila el módulo `.wasm` con medición de combustible y límites de memoria
3. **Inicialización** -- Se llama a `on_load()`; se leen `plugin_name()` y `plugin_version()`
4. **Escaneo** -- Para cada archivo, se llama a `scan(ptr, len) -> score` con los datos del archivo
5. **Reporte** -- Los plugins llaman a `report_finding()` para registrar amenazas, o devuelven una puntuación distinta de cero

## Manifiesto del Plugin (`plugin.json`)

Cada directorio de plugin debe contener un `plugin.json` que describe el plugin y sus restricciones de sandbox:

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

### Campos del Manifiesto

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | `string` | Sí | Nombre legible del plugin |
| `version` | `string` | Sí | Versión semántica del plugin |
| `author` | `string` | Sí | Autor u organización del plugin |
| `description` | `string` | Sí | Breve descripción de lo que detecta el plugin |
| `wasm_file` | `string` | Sí | Nombre del módulo WASM compilado (relativo al directorio del plugin) |
| `platforms` | `string[]` | Sí | Plataformas objetivo: `"linux"`, `"macos"`, `"windows"`, o `"all"` |
| `file_types` | `string[]` | Sí | Tipos de archivo a inspeccionar: `"pe"`, `"elf"`, `"macho"`, `"pdf"`, o `"all"` |
| `min_engine_version` | `string` | Sí | Versión mínima del motor PRX-SD requerida |
| `permissions.network` | `boolean` | No | Si el plugin puede acceder a la red (predeterminado: `false`) |
| `permissions.filesystem` | `boolean` | No | Si el plugin puede acceder al sistema de archivos del host mediante WASI (predeterminado: `false`) |
| `permissions.max_memory_mb` | `integer` | No | Memoria lineal máxima en MiB (predeterminado: `64`) |
| `permissions.max_exec_ms` | `integer` | No | Tiempo máximo de ejecución en ms (predeterminado: `5000`) |

## Exportaciones WASM Requeridas

Tu módulo WASM debe exportar las siguientes funciones:

### `scan(ptr: i32, len: i32) -> i32`

El punto de entrada principal del escaneo. Recibe un puntero y longitud de los datos del archivo en la memoria del guest. Devuelve una puntuación de amenaza de 0 a 100:

- `0` = limpio
- `1-29` = informativo
- `30-59` = sospechoso
- `60-100` = malicioso

### `memory`

El módulo debe exportar su memoria lineal como `memory` para que el host pueda escribir datos de archivos y leer resultados.

## Exportaciones WASM Opcionales

| Exportación | Firma | Descripción |
|------------|-------|-------------|
| `on_load() -> i32` | `() -> i32` | Se llama una vez después de la compilación. Devolver `0` para éxito. |
| `plugin_name(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | Escribir el nombre del plugin en el buffer. Devolver la longitud real. |
| `plugin_version(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | Escribir la versión del plugin en el buffer. Devolver la longitud real. |
| `alloc(size: i32) -> i32` | `(i32) -> i32` | Asignar `size` bytes de memoria del guest. Devolver el puntero. |

## Funciones del Host Disponibles para los Plugins

El host proporciona estas funciones en el espacio de nombres `"env"`:

### `report_finding(name_ptr, name_len, score, detail_ptr, detail_len)`

Reporta un hallazgo de amenaza. Puede llamarse múltiples veces durante un único escaneo.

- `name_ptr` / `name_len` -- puntero y longitud de la cadena con el nombre de la amenaza (p. ej. `"Trojan.Marker"`)
- `score` -- puntuación de amenaza (0-100, limitada)
- `detail_ptr` / `detail_len` -- puntero y longitud de una cadena de detalle

### `log_message(level, msg_ptr, msg_len)`

Escribe un mensaje de registro en el sistema de trazado del motor.

- `level` -- `0`=trace, `1`=debug, `2`=info, `3`=warn, `4`=error
- `msg_ptr` / `msg_len` -- puntero y longitud de la cadena del mensaje

### `get_file_path(buf_ptr, buf_len) -> actual_len`

Lee la ruta del archivo que se está escaneando en un buffer del guest.

### `get_file_type(buf_ptr, buf_len) -> actual_len`

Lee el tipo de archivo detectado (p. ej. `"pe"`, `"elf"`, `"pdf"`) en un buffer del guest.

## Estructura PluginFinding

Cuando un plugin reporta un hallazgo (ya sea mediante `report_finding()` o devolviendo una puntuación distinta de cero), el motor crea un `PluginFinding`:

```rust
pub struct PluginFinding {
    pub plugin_name: String,   // Name of the plugin
    pub threat_name: String,   // e.g. "Trojan.Marker"
    pub score: u32,            // 0-100
    pub detail: String,        // Free-form detail string
}
```

Si el plugin devuelve una puntuación distinta de cero pero no llama a `report_finding()`, el motor sintetiza automáticamente un hallazgo:

```
threat_name: "Plugin.<plugin_name>"
detail: "Plugin '<name>' returned threat score <score>"
```

## Flujo de Desarrollo

### 1. Crear el Directorio del Plugin

```bash
mkdir -p ~/.prx-sd/plugins/my-scanner
```

### 2. Escribir el Manifiesto

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

### 3. Escribir el Plugin (Ejemplo en Rust)

Crea un nuevo proyecto de biblioteca Rust:

```bash
cargo new --lib my-scanner
cd my-scanner
```

Agrega a `Cargo.toml`:

```toml
[lib]
crate-type = ["cdylib"]

[profile.release]
opt-level = "s"
lto = true
```

Escribe `src/lib.rs`:

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

### 4. Compilar a WASM

```bash
rustup target add wasm32-wasip1
cargo build --release --target wasm32-wasip1
cp target/wasm32-wasip1/release/my_scanner.wasm ~/.prx-sd/plugins/my-scanner/
```

### 5. Probar el Plugin

```bash
# Create a test file with the marker
echo "MALICIOUS_MARKER" > /tmp/test-marker.txt

# Scan with debug logging to see plugin activity
sd --log-level debug scan /tmp/test-marker.txt
```

::: tip
Usa `--log-level debug` para ver mensajes detallados de carga y ejecución de plugins, incluido el consumo de combustible y el uso de memoria.
:::

## Seguridad del Sandbox

Los plugins se ejecutan dentro de un sandbox de Wasmtime con las siguientes restricciones:

| Restricción | Aplicación |
|------------|------------|
| **Límite de memoria** | `max_memory_mb` en el manifiesto; Wasmtime aplica el límite de memoria lineal |
| **Límite de CPU** | `max_exec_ms` convertido a unidades de combustible; la ejecución se detiene cuando se agota el combustible |
| **Red** | Deshabilitada por defecto; requiere `permissions.network: true` |
| **Sistema de archivos** | Deshabilitado por defecto; requiere `permissions.filesystem: true` (preopens WASI) |
| **Verificación de plataforma** | Los plugins con `platforms` no coincidentes se omiten al cargar |
| **Filtro de tipo de archivo** | Los plugins con `file_types` no coincidentes se omiten por archivo |

::: warning
Incluso con `network: true` o `filesystem: true`, el sandbox WASI restringe el acceso a directorios y endpoints específicos. Estos permisos son una declaración de intención, no concesiones de acceso irrestricto.
:::

## Recarga en Caliente

Coloca un nuevo directorio de plugin en `~/.prx-sd/plugins/` y el registro lo detectará en el próximo escaneo. Para el demonio, activa una recarga llamando a `sd update` o reiniciando el demonio.

## Próximos Pasos

- Revisa el [plugin de ejemplo](https://github.com/openprx/prx-sd/tree/main/crates/plugins/examples/example-plugin) en el repositorio
- Aprende sobre el pipeline del [Motor de Detección](../detection/) para entender cómo se agregan los hallazgos de los plugins
- Consulta la [Referencia de CLI](../cli/) para todos los comandos disponibles
