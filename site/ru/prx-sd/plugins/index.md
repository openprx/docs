---
title: "Разработка WASM-плагинов"
description: "Расширение PRX-SD пользовательской логикой обнаружения с помощью WebAssembly-плагинов. Создавайте плагины на Rust, Go, C или любом языке, компилируемом в WASM."
---

# Разработка WASM-плагинов

PRX-SD включает систему плагинов на базе [Wasmtime](https://wasmtime.dev/), позволяющую расширять движок обнаружения пользовательскими сканерами, написанными на любом языке, компилируемом в WebAssembly (Rust, Go, C, AssemblyScript и т.д.). Плагины работают в изолированной среде WASM с настраиваемыми ограничениями ресурсов.

## Архитектура

```
~/.prx-sd/plugins/
  my-scanner/
    plugin.json          # Манифест плагина
    my_scanner.wasm      # Скомпилированный WASM-модуль
  another-plugin/
    plugin.json
    another_plugin.wasm
```

При запуске движка сканирования `PluginRegistry` обходит каталог плагинов, загружает каждый подкаталог, содержащий `plugin.json`, компилирует WASM-модуль и вызывает экспорт `on_load` плагина. Во время сканирования каждый плагин, чьи `file_types` и `platforms` соответствуют текущему файлу, вызывается последовательно.

### Процесс выполнения

1. **Обнаружение** — `PluginRegistry` находит файлы `plugin.json` в `~/.prx-sd/plugins/`
2. **Компиляция** — Wasmtime компилирует `.wasm`-модуль с измерением топлива и ограничениями памяти
3. **Инициализация** — вызывается `on_load()`; считываются `plugin_name()` и `plugin_version()`
4. **Сканирование** — для каждого файла вызывается `scan(ptr, len) -> score` с данными файла
5. **Отчётность** — плагины вызывают `report_finding()` для регистрации угроз или возвращают ненулевой балл

## Манифест плагина (`plugin.json`)

Каждый каталог плагина должен содержать `plugin.json`, описывающий плагин и его ограничения песочницы:

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

### Поля манифеста

| Поле | Тип | Обязательно | Описание |
|------|-----|------------|----------|
| `name` | `string` | Да | Читаемое название плагина |
| `version` | `string` | Да | Семантическая версия плагина |
| `author` | `string` | Да | Автор или организация плагина |
| `description` | `string` | Да | Краткое описание того, что обнаруживает плагин |
| `wasm_file` | `string` | Да | Имя файла скомпилированного WASM-модуля (относительно каталога плагина) |
| `platforms` | `string[]` | Да | Целевые платформы: `"linux"`, `"macos"`, `"windows"` или `"all"` |
| `file_types` | `string[]` | Да | Типы файлов для проверки: `"pe"`, `"elf"`, `"macho"`, `"pdf"` или `"all"` |
| `min_engine_version` | `string` | Да | Минимальная требуемая версия движка PRX-SD |
| `permissions.network` | `boolean` | Нет | Может ли плагин обращаться к сети (по умолчанию: `false`) |
| `permissions.filesystem` | `boolean` | Нет | Может ли плагин обращаться к файловой системе хоста через WASI (по умолчанию: `false`) |
| `permissions.max_memory_mb` | `integer` | Нет | Максимальная линейная память в МиБ (по умолчанию: `64`) |
| `permissions.max_exec_ms` | `integer` | Нет | Максимальное время настенных часов выполнения в мс (по умолчанию: `5000`) |

## Обязательные экспорты WASM

Ваш WASM-модуль должен экспортировать следующие функции:

### `scan(ptr: i32, len: i32) -> i32`

Главная точка входа сканирования. Получает указатель и длину данных файла в гостевой памяти. Возвращает оценку угрозы от 0 до 100:

- `0` = чисто
- `1-29` = информационный
- `30-59` = подозрительный
- `60-100` = вредоносный

### `memory`

Модуль должен экспортировать свою линейную память как `memory`, чтобы хост мог записывать данные файла и читать результаты.

## Необязательные экспорты WASM

| Экспорт | Сигнатура | Описание |
|---------|----------|----------|
| `on_load() -> i32` | `() -> i32` | Вызывается один раз после компиляции. Вернуть `0` для успеха. |
| `plugin_name(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | Записать название плагина в буфер. Вернуть реальную длину. |
| `plugin_version(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | Записать версию плагина в буфер. Вернуть реальную длину. |
| `alloc(size: i32) -> i32` | `(i32) -> i32` | Выделить `size` байт гостевой памяти. Вернуть указатель. |

## Хост-функции, доступные плагинам

Хост предоставляет эти функции в пространстве имён `"env"`:

### `report_finding(name_ptr, name_len, score, detail_ptr, detail_len)`

Сообщить о найденной угрозе. Может вызываться несколько раз в ходе одного сканирования.

- `name_ptr` / `name_len` — указатель и длина строки с названием угрозы (например, `"Trojan.Marker"`)
- `score` — оценка угрозы (0-100, с ограничением)
- `detail_ptr` / `detail_len` — указатель и длина строки с деталями

### `log_message(level, msg_ptr, msg_len)`

Записать сообщение в систему трассировки движка.

- `level` — `0`=trace, `1`=debug, `2`=info, `3`=warn, `4`=error
- `msg_ptr` / `msg_len` — указатель и длина строки сообщения

### `get_file_path(buf_ptr, buf_len) -> actual_len`

Прочитать путь сканируемого файла в гостевой буфер.

### `get_file_type(buf_ptr, buf_len) -> actual_len`

Прочитать обнаруженный тип файла (например, `"pe"`, `"elf"`, `"pdf"`) в гостевой буфер.

## Структура PluginFinding

Когда плагин сообщает об обнаружении (через `report_finding()` или возвращая ненулевой балл), движок создаёт `PluginFinding`:

```rust
pub struct PluginFinding {
    pub plugin_name: String,   // Name of the plugin
    pub threat_name: String,   // e.g. "Trojan.Marker"
    pub score: u32,            // 0-100
    pub detail: String,        // Free-form detail string
}
```

Если плагин возвращает ненулевой балл, но не вызывает `report_finding()`, движок автоматически синтезирует обнаружение:

```
threat_name: "Plugin.<plugin_name>"
detail: "Plugin '<name>' returned threat score <score>"
```

## Рабочий процесс разработки

### 1. Создайте каталог плагина

```bash
mkdir -p ~/.prx-sd/plugins/my-scanner
```

### 2. Создайте манифест

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

### 3. Напишите плагин (пример на Rust)

Создайте новый проект библиотеки Rust:

```bash
cargo new --lib my-scanner
cd my-scanner
```

Добавьте в `Cargo.toml`:

```toml
[lib]
crate-type = ["cdylib"]

[profile.release]
opt-level = "s"
lto = true
```

Напишите `src/lib.rs`:

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

### 4. Скомпилируйте в WASM

```bash
rustup target add wasm32-wasip1
cargo build --release --target wasm32-wasip1
cp target/wasm32-wasip1/release/my_scanner.wasm ~/.prx-sd/plugins/my-scanner/
```

### 5. Протестируйте плагин

```bash
# Создать тестовый файл с маркером
echo "MALICIOUS_MARKER" > /tmp/test-marker.txt

# Сканировать с debug-логированием для отслеживания активности плагина
sd --log-level debug scan /tmp/test-marker.txt
```

::: tip
Используйте `--log-level debug` для просмотра подробных сообщений о загрузке и выполнении плагинов, включая потребление топлива и использование памяти.
:::

## Безопасность песочницы

Плагины работают внутри песочницы Wasmtime со следующими ограничениями:

| Ограничение | Применение |
|-----------|-----------|
| **Лимит памяти** | `max_memory_mb` в манифесте; Wasmtime ограничивает линейную память |
| **Лимит CPU** | `max_exec_ms` преобразуется в единицы топлива; выполнение прерывается при исчерпании топлива |
| **Сеть** | Отключена по умолчанию; требует `permissions.network: true` |
| **Файловая система** | Отключена по умолчанию; требует `permissions.filesystem: true` (WASI preopens) |
| **Проверка платформы** | Плагины с несовпадающими `platforms` пропускаются при загрузке |
| **Фильтр типов файлов** | Плагины с несовпадающими `file_types` пропускаются для каждого файла |

::: warning
Даже при `network: true` или `filesystem: true`, песочница WASI ограничивает доступ к конкретным каталогам и конечным точкам. Эти разрешения являются декларацией намерений, а не предоставлением неограниченного доступа.
:::

## Горячая перезагрузка

Поместите новый каталог плагина в `~/.prx-sd/plugins/` и реестр подхватит его при следующем сканировании. Для демона инициируйте перезагрузку, вызвав `sd update` или перезапустив демон.

## Следующие шаги

- Просмотрите [пример плагина](https://github.com/openprx/prx-sd/tree/main/crates/plugins/examples/example-plugin) в репозитории
- Изучите конвейер [движка обнаружения](../detection/), чтобы понять как агрегируются результаты плагинов
- Обратитесь к [справочнику CLI](../cli/) для всех доступных команд
