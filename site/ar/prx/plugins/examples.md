---
title: أمثلة الإضافات
description: أمثلة على إضافات PRX توضح الأنماط وحالات الاستخدام الشائعة.
---

# أمثلة الإضافات

توفّر هذه الصفحة إضافات مثال لمساعدتك على البدء في تطوير إضافات PRX.

## المثال 1: Tool Plugin بسيط

إضافة أداة تحول النص إلى أحرف كبيرة:

```rust
use prx_pdk::prelude::*;

#[prx_tool(
    name = "uppercase",
    description = "Convert text to uppercase"
)]
fn uppercase(text: String) -> Result<String, PluginError> {
    Ok(text.to_uppercase())
}
```

## المثال 2: أداة HTTP API

Tool plugin يجلب بيانات من API خارجي:

```rust
use prx_pdk::prelude::*;

#[prx_tool(
    name = "github_stars",
    description = "Get star count for a GitHub repository"
)]
fn github_stars(repo: String) -> Result<String, PluginError> {
    let url = format!("https://api.github.com/repos/{}", repo);
    let resp = http_get(&url)?;
    // Parse and return star count
    Ok(resp.body)
}
```

## المثال 3: مرشح محتوى

Filter plugin يحجب المعلومات الحساسة:

```rust
use prx_pdk::prelude::*;

#[prx_filter(stage = "post")]
fn redact_emails(message: &str) -> Result<FilterAction, PluginError> {
    let redacted = message.replace(
        |c: char| c == '@',
        "[REDACTED]"
    );
    Ok(FilterAction::Replace(redacted))
}
```

## المثال 4: إضافة بإعدادات

إضافة تقرأ من إعداداتها:

```rust
use prx_pdk::prelude::*;

#[prx_tool(name = "greet")]
fn greet(name: String) -> Result<String, PluginError> {
    let greeting = config_get("greeting").unwrap_or("Hello".to_string());
    Ok(format!("{}, {}!", greeting, name))
}
```

الإعداد في `config.toml`:

```toml
[[plugins.registry]]
name = "greet"
path = "greet.wasm"
enabled = true

[plugins.registry.config]
greeting = "Welcome"
```

## صفحات ذات صلة

- [دليل المطور](./developer-guide)
- [مرجع PDK](./pdk)
- [وظائف المضيف](./host-functions)
