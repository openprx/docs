---
title: مكوّنات WASM
description: "نظام مكوّنات WASM في PRX-Email للتنفيذ في بيئة آمنة داخل وقت تشغيل PRX. استدعاءات مضيف WIT ومفتاح أمان الشبكة ودليل تطوير المكوّن."
---

# مكوّنات WASM

يتضمن PRX-Email مكوّن WASM يُترجم عميل البريد الإلكتروني إلى WebAssembly للتنفيذ في بيئة آمنة داخل وقت تشغيل PRX. يستخدم المكوّن WIT (أنواع واجهة WebAssembly) لتعريف واجهات استدعاء المضيف، مما يتيح للكود المستضاف بـ WASM استدعاء عمليات البريد الإلكتروني مثل sync وlist وget وsearch وsend وreply.

## الهندسة المعمارية

```
PRX Runtime (Host)
  |
  +-- WASM Plugin (prx-email-plugin)
        |
        +-- WIT Host-Calls
        |     email.sync    --> Host IMAP sync
        |     email.list    --> Host inbox list
        |     email.get     --> Host message get
        |     email.search  --> Host inbox search
        |     email.send    --> Host SMTP send
        |     email.reply   --> Host SMTP reply
        |
        +-- email.execute   --> Dispatcher
              (forwards to host-calls above)
```

### نموذج التنفيذ

عندما يستدعي مكوّن WASM `email.execute`، يوجّه المكوّن الاستدعاء إلى دالة استدعاء المضيف المناسبة. يتعامل وقت التشغيل المضيف مع عمليات IMAP/SMTP الفعلية، وتُعاد النتائج من خلال واجهة WIT.

## مفتاح أمان الشبكة

تنفيذ IMAP/SMTP الحقيقي من سياق WASM **معطّل بشكل افتراضي**. هذا يمنع المكوّنات في البيئة الآمنة من إجراء اتصالات شبكية غير مقصودة.

### تفعيل عمليات الشبكة

اضبط متغير البيئة قبل بدء وقت تشغيل PRX:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### السلوك عند التعطيل

| العملية | السلوك |
|---------|--------|
| `email.sync` | تعيد خطأ `EMAIL_NETWORK_GUARD` |
| `email.send` | تعيد خطأ `EMAIL_NETWORK_GUARD` |
| `email.reply` | تعيد خطأ `EMAIL_NETWORK_GUARD` |
| `email.list` | تعمل (تقرأ من SQLite المحلي) |
| `email.get` | تعمل (تقرأ من SQLite المحلي) |
| `email.search` | تعمل (تقرأ من SQLite المحلي) |

::: tip
العمليات للقراءة فقط (list وget وsearch) تعمل دائماً لأنها تستعلم من قاعدة بيانات SQLite المحلية دون الوصول إلى الشبكة. فقط العمليات التي تتطلب اتصالات IMAP/SMTP تخضع للحراسة.
:::

### قدرة المضيف غير متاحة

عندما لا يوفر وقت التشغيل المضيف قدرة البريد الإلكتروني على الإطلاق (مسار التنفيذ غير WASM)، تعيد العمليات `EMAIL_HOST_CAPABILITY_UNAVAILABLE`.

## هيكل المكوّن

```
wasm-plugin/
  Cargo.toml          # Plugin crate configuration
  plugin.toml         # Plugin manifest
  plugin.wasm         # Pre-compiled WASM binary
  src/
    lib.rs            # Plugin entry point and dispatcher
    bindings.rs       # WIT-generated bindings
  wit/                # WIT interface definitions
    deps/
      prx-host/       # Host-provided interfaces
```

### إعداد Cargo

```toml
[package]
name = "prx-email-plugin"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
wit-bindgen = { version = "0.51", features = ["macros"] }

[package.metadata.component]
package = "prx:plugin"

[package.metadata.component.target.dependencies]
"prx:host" = { path = "wit/deps/prx-host" }
```

## بناء المكوّن

### المتطلبات الأساسية

- سلسلة أدوات Rust
- هدف `wasm32-wasip1`

### خطوات البناء

```bash
# Add WASM target
rustup target add wasm32-wasip1

# Build the plugin
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### استخدام سكريبت البناء

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

## واجهة WIT

يتواصل المكوّن مع المضيف من خلال واجهات WIT المُعرَّفة. توفر حزمة `prx:host` دالات استدعاء المضيف التالية:

### استدعاءات المضيف المتاحة

| الدالة | الوصف | الشبكة مطلوبة |
|--------|-------|:-------------:|
| `email.sync` | مزامنة صندوق الوارد IMAP لحساب/مجلد | نعم |
| `email.list` | قائمة الرسائل من قاعدة البيانات المحلية | لا |
| `email.get` | الحصول على رسالة محددة بالمعرف | لا |
| `email.search` | البحث في الرسائل بالاستعلام | لا |
| `email.send` | إرسال بريد إلكتروني جديد عبر SMTP | نعم |
| `email.reply` | الرد على بريد إلكتروني موجود | نعم |

### تنسيق الطلب/الاستجابة

تستخدم استدعاءات المضيف تسلسل JSON لحمولات الطلب والاستجابة:

```rust
// Example: list messages
let request = serde_json::json!({
    "account_id": 1,
    "limit": 10
});

let response = host_call("email.list", &request)?;
```

## سير عمل التطوير

### 1. تعديل كود المكوّن

حرّر `wasm-plugin/src/lib.rs` لإضافة منطق مخصص:

```rust
// Add pre-processing before email operations
fn before_send(request: &SendRequest) -> Result<(), PluginError> {
    // Custom validation, logging, or transformation
    Ok(())
}
```

### 2. إعادة البناء

```bash
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### 3. الاختبار محلياً

الاختبار مع تعطيل مفتاح أمان الشبكة:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
# Run your PRX runtime with the updated plugin
```

### 4. النشر

انسخ ملف `.wasm` المُترجم إلى دليل مكوّنات وقت تشغيل PRX الخاص بك.

## نموذج الأمان

| القيد | الإنفاذ |
|-------|---------|
| الوصول إلى الشبكة | معطّل بشكل افتراضي؛ يتطلب `PRX_EMAIL_ENABLE_REAL_NETWORK=1` |
| الوصول إلى نظام الملفات | لا وصول مباشر لنظام الملفات من WASM |
| الذاكرة | محدودة بحدود الذاكرة الخطية لـ WASM |
| وقت التنفيذ | محدود بقياس الوقود |
| أمان الرمز | رموز OAuth تُدار من المضيف، غير مكشوفة لـ WASM |

::: warning
مكوّن WASM لا يملك وصولاً مباشراً لرموز OAuth أو بيانات الاعتماد. جميع المصادقة تُعالج من وقت التشغيل المضيف. يستقبل المكوّن نتائج العمليات فقط، وليس بيانات الاعتماد الخام.
:::

## الخطوات التالية

- [التثبيت](../getting-started/installation) -- تعليمات البناء لمكوّن WASM
- [مرجع الإعداد](../configuration/) -- مفتاح أمان الشبكة وإعدادات وقت التشغيل
- [استكشاف الأخطاء](../troubleshooting/) -- مشكلات متعلقة بالمكوّن
