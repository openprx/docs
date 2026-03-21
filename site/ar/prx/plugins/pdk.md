---
title: مجموعة تطوير الإضافات (PDK)
description: مرجع API لمجموعة تطوير إضافات PRX المستخدمة لبناء إضافات WASM.
---

# مجموعة تطوير الإضافات (PDK)

`PRX PDK` عبارة عن Rust crate يوفّر الأنواع والـ traits والـ macros اللازمة لبناء إضافات PRX. وهو يتولى التسلسل، وربط وظائف المضيف، ودورة حياة الإضافة.

## التثبيت

أضف إلى `Cargo.toml`:

```toml
[dependencies]
prx-pdk = "0.1"
```

## Traits الأساسية

### Tool

يُستخدم `Tool` trait لتسجيل أدوات جديدة يمكن للوكيل استدعاؤها:

```rust
use prx_pdk::prelude::*;

#[prx_tool(
    name = "weather",
    description = "Get current weather for a location"
)]
fn weather(location: String) -> Result<String, PluginError> {
    let resp = http_get(&format!("https://api.weather.com/{}", location))?;
    Ok(resp.body)
}
```

### Channel

يضيف `Channel` trait قنوات مراسلة جديدة:

```rust
use prx_pdk::prelude::*;

#[prx_channel(name = "my-chat")]
struct MyChatChannel;

impl Channel for MyChatChannel {
    fn send(&self, message: &str) -> Result<(), PluginError> { /* ... */ }
    fn receive(&self) -> Result<Option<String>, PluginError> { /* ... */ }
}
```

### Filter

يعالج `Filter` trait الرسائل قبل أو بعد LLM:

```rust
use prx_pdk::prelude::*;

#[prx_filter(stage = "pre")]
fn content_filter(message: &str) -> Result<FilterAction, PluginError> {
    // Return FilterAction::Pass or FilterAction::Block
}
```

## الأنواع

يُصدّر PDK الأنواع الشائعة التالية: `PluginError` و`FilterAction` و`ToolResult` و`ChannelMessage` و`PluginConfig`.

## صفحات ذات صلة

- [دليل المطور](./developer-guide)
- [وظائف المضيف](./host-functions)
- [أمثلة](./examples)
