---
title: دليل مطور الإضافات
description: دليل خطوة بخطوة لتطوير إضافات PRX باستخدام Plugin Development Kit.
---

# دليل مطور الإضافات

يرشدك هذا الدليل لإنشاء إضافة PRX من الصفر. في النهاية سيكون لديك Tool plugin عامل يمكن تحميله داخل PRX.

## المتطلبات المسبقة

- Rust toolchain مع الهدف `wasm32-wasi`
- تثبيت PRX CLI
- معرفة أساسية بمفاهيم WASM

## إعداد المشروع

```bash
# Install the WASM target
rustup target add wasm32-wasi

# Create a new plugin project
cargo new --lib my-plugin
cd my-plugin
```

أضف PRX PDK إلى ملف `Cargo.toml`:

```toml
[dependencies]
prx-pdk = "0.1"

[lib]
crate-type = ["cdylib"]
```

## كتابة Tool Plugin

أبسط Tool plugin يطبّق trait باسم `Tool`:

```rust
use prx_pdk::prelude::*;

#[prx_tool]
fn hello(name: String) -> Result<String, PluginError> {
    Ok(format!("Hello, {}!", name))
}
```

## البناء

```bash
cargo build --target wasm32-wasi --release
```

سيكون ملف الإضافة المترجم في `target/wasm32-wasi/release/my_plugin.wasm`.

## الاختبار محليًا

```bash
prx plugin install ./target/wasm32-wasi/release/my_plugin.wasm
prx plugin test my-plugin
```

## النشر

يمكن مشاركة الإضافات كملفات `.wasm` أو نشرها في plugin registry (قريبًا).

## صفحات ذات صلة

- [نظرة عامة على نظام الإضافات](./)
- [مرجع PDK](./pdk)
- [وظائف المضيف](./host-functions)
- [أمثلة](./examples)
