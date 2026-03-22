---
title: تطوير إضافات WASM
description: توسيع PRX-SD بمنطق كشف مخصص باستخدام إضافات WebAssembly. اكتب الإضافات بـ Rust أو Go أو C أو أي لغة تُترجَم إلى WASM.
---

# تطوير إضافات WASM

يتضمن PRX-SD نظام إضافات مدعوم بـ [Wasmtime](https://wasmtime.dev/) يتيح لك توسيع محرك الكشف بماسحات مخصصة مكتوبة بأي لغة تُترجَم إلى WebAssembly (Rust وGo وC وAssemblyScript وغيرها). تعمل الإضافات في بيئة WASM آمنة بحدود موارد قابلة للتهيئة.

## البنية المعمارية

```
~/.prx-sd/plugins/
  my-scanner/
    plugin.json          # Plugin manifest
    my_scanner.wasm      # Compiled WASM module
  another-plugin/
    plugin.json
    another_plugin.wasm
```

عند بدء تشغيل محرك الفحص، يمشي `PluginRegistry` عبر دليل الإضافات، ويُحمِّل كل دليل فرعي يحتوي على `plugin.json`، ويُجمِّع وحدة WASM، ويستدعي تصدير `on_load` للإضافة. أثناء الفحص، يُستدعى كل إضافة تتطابق `file_types` و`platforms` الخاصة بها مع الملف الحالي بالتسلسل.

### تدفق التنفيذ

1. **الاكتشاف** -- يجد `PluginRegistry` ملفات `plugin.json` في `~/.prx-sd/plugins/`
2. **التجميع** -- يُجمِّع Wasmtime وحدة `.wasm` مع قياس الوقود وحدود الذاكرة
3. **التهيئة** -- يُستدعى `on_load()`؛ تُقرأ `plugin_name()` و`plugin_version()`
4. **الفحص** -- لكل ملف، يُستدعى `scan(ptr, len) -> score` مع بيانات الملف
5. **التقرير** -- تستدعي الإضافات `report_finding()` لتسجيل التهديدات، أو تُعيد درجة غير صفرية

## بيان الإضافة (`plugin.json`)

يجب أن يحتوي كل دليل إضافة على `plugin.json` يصف الإضافة وقيود بيئتها الآمنة:

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

### حقول البيان

| الحقل | النوع | مطلوب | الوصف |
|-------|------|----------|-------------|
| `name` | `string` | نعم | اسم الإضافة القابل للقراءة |
| `version` | `string` | نعم | الإصدار الدلالي للإضافة |
| `author` | `string` | نعم | مؤلف الإضافة أو المنظمة |
| `description` | `string` | نعم | وصف موجز لما تكتشفه الإضافة |
| `wasm_file` | `string` | نعم | اسم ملف وحدة WASM المُجمَّعة (نسبي لدليل الإضافة) |
| `platforms` | `string[]` | نعم | المنصات المستهدفة: `"linux"`، `"macos"`، `"windows"`، أو `"all"` |
| `file_types` | `string[]` | نعم | أنواع الملفات للفحص: `"pe"`، `"elf"`، `"macho"`، `"pdf"`، أو `"all"` |
| `min_engine_version` | `string` | نعم | الحد الأدنى لإصدار محرك PRX-SD المطلوب |
| `permissions.network` | `boolean` | لا | هل يمكن للإضافة الوصول إلى الشبكة (الافتراضي: `false`) |
| `permissions.filesystem` | `boolean` | لا | هل يمكن للإضافة الوصول إلى نظام الملفات المضيف عبر WASI (الافتراضي: `false`) |
| `permissions.max_memory_mb` | `integer` | لا | الحد الأقصى للذاكرة الخطية بالميجابايت (الافتراضي: `64`) |
| `permissions.max_exec_ms` | `integer` | لا | الحد الأقصى لوقت التنفيذ الجداري بالملليثانية (الافتراضي: `5000`) |

## صادرات WASM المطلوبة

يجب أن تُصدِّر وحدة WASM الوظائف التالية:

### `scan(ptr: i32, len: i32) -> i32`

نقطة دخول الفحص الرئيسية. تستقبل مؤشراً وطولاً لبيانات الملف في ذاكرة الضيف. تُعيد درجة تهديد من 0 إلى 100:

- `0` = نظيف
- `1-29` = معلوماتي
- `30-59` = مشبوه
- `60-100` = ضار

### `memory`

يجب أن تُصدِّر الوحدة ذاكرتها الخطية كـ `memory` حتى يتمكن المضيف من كتابة بيانات الملف وقراءة النتائج.

## صادرات WASM الاختيارية

| الصادر | التوقيع | الوصف |
|--------|-----------|-------------|
| `on_load() -> i32` | `() -> i32` | يُستدعى مرة واحدة بعد التجميع. أعِد `0` للنجاح. |
| `plugin_name(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | اكتب اسم الإضافة في المخزن المؤقت. أعِد الطول الفعلي. |
| `plugin_version(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | اكتب إصدار الإضافة في المخزن المؤقت. أعِد الطول الفعلي. |
| `alloc(size: i32) -> i32` | `(i32) -> i32` | خصِّص `size` بايت من ذاكرة الضيف. أعِد المؤشر. |

## وظائف المضيف المتاحة للإضافات

يوفر المضيف هذه الوظائف في مساحة الاسم `"env"`:

### `report_finding(name_ptr, name_len, score, detail_ptr, detail_len)`

الإبلاغ عن نتيجة تهديد. يمكن استدعاؤها عدة مرات أثناء فحص واحد.

- `name_ptr` / `name_len` -- مؤشر وطول سلسلة اسم التهديد (مثل `"Trojan.Marker"`)
- `score` -- درجة التهديد (0-100، مقيَّدة)
- `detail_ptr` / `detail_len` -- مؤشر وطول سلسلة تفاصيل

### `log_message(level, msg_ptr, msg_len)`

كتابة رسالة سجل إلى نظام التتبع الخاص بالمحرك.

- `level` -- `0`=trace، `1`=debug، `2`=info، `3`=warn، `4`=error
- `msg_ptr` / `msg_len` -- مؤشر وطول سلسلة الرسالة

### `get_file_path(buf_ptr, buf_len) -> actual_len`

قراءة مسار الملف الجاري فحصه في مخزن مؤقت للضيف.

### `get_file_type(buf_ptr, buf_len) -> actual_len`

قراءة نوع الملف المكتشف (مثل `"pe"`، `"elf"`، `"pdf"`) في مخزن مؤقت للضيف.

## هيكل PluginFinding

عندما تُبلِّغ إضافة عن نتيجة (إما عبر `report_finding()` أو بإعادة درجة غير صفرية)، يُنشئ المحرك `PluginFinding`:

```rust
pub struct PluginFinding {
    pub plugin_name: String,   // Name of the plugin
    pub threat_name: String,   // e.g. "Trojan.Marker"
    pub score: u32,            // 0-100
    pub detail: String,        // Free-form detail string
}
```

إذا أعادت الإضافة درجة غير صفرية ولم تستدعِ `report_finding()`، يُنشئ المحرك نتيجة تلقائياً:

```
threat_name: "Plugin.<plugin_name>"
detail: "Plugin '<name>' returned threat score <score>"
```

## سير عمل التطوير

### 1. إنشاء دليل الإضافة

```bash
mkdir -p ~/.prx-sd/plugins/my-scanner
```

### 2. كتابة البيان

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

### 3. كتابة الإضافة (مثال بـ Rust)

إنشاء مشروع مكتبة Rust جديد:

```bash
cargo new --lib my-scanner
cd my-scanner
```

إضافة إلى `Cargo.toml`:

```toml
[lib]
crate-type = ["cdylib"]

[profile.release]
opt-level = "s"
lto = true
```

كتابة `src/lib.rs`:

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

### 4. التجميع إلى WASM

```bash
rustup target add wasm32-wasip1
cargo build --release --target wasm32-wasip1
cp target/wasm32-wasip1/release/my_scanner.wasm ~/.prx-sd/plugins/my-scanner/
```

### 5. اختبار الإضافة

```bash
# إنشاء ملف اختبار مع العلامة
echo "MALICIOUS_MARKER" > /tmp/test-marker.txt

# الفحص مع تسجيل debug لرؤية نشاط الإضافة
sd --log-level debug scan /tmp/test-marker.txt
```

::: tip
استخدم `--log-level debug` لرؤية رسائل تحميل وتنفيذ تفصيلية للإضافة، بما فيها استهلاك الوقود واستخدام الذاكرة.
:::

## أمان البيئة الآمنة

تعمل الإضافات داخل بيئة Wasmtime الآمنة مع القيود التالية:

| القيد | التطبيق |
|-----------|-------------|
| **حد الذاكرة** | `max_memory_mb` في البيان؛ يُطبِّق Wasmtime حد الذاكرة الخطية |
| **حد CPU** | `max_exec_ms` مُحوَّل إلى وحدات وقود؛ يتوقف التنفيذ عند نفاد الوقود |
| **الشبكة** | مُعطَّلة افتراضياً؛ تتطلب `permissions.network: true` |
| **نظام الملفات** | مُعطَّل افتراضياً؛ يتطلب `permissions.filesystem: true` (WASI preopens) |
| **فحص المنصة** | تُتخطى الإضافات ذات `platforms` غير المتطابقة عند وقت التحميل |
| **مرشح نوع الملف** | تُتخطى الإضافات ذات `file_types` غير المتطابقة لكل ملف |

::: warning
حتى مع `network: true` أو `filesystem: true`، تقيِّد بيئة WASI الوصول إلى دلائل ونقاط نهاية محددة. هذه الأذونات إعلان عن نية، وليست منح وصول شاملة.
:::

## إعادة التحميل الساخن

أفلِت دليل إضافة جديدة في `~/.prx-sd/plugins/` وسيلتقطه السجل في الفحص التالي. بالنسبة للـ daemon، شغِّل إعادة تحميل باستدعاء `sd update` أو إعادة تشغيل الـ daemon.

## الخطوات التالية

- راجع [إضافة المثال](https://github.com/openprx/prx-sd/tree/main/crates/plugins/examples/example-plugin) في المستودع
- تعرف على خط أنابيب [محرك الكشف](../detection/) لفهم كيفية تجميع نتائج الإضافة
- راجع [مرجع CLI](../cli/) لجميع الأوامر المتاحة
