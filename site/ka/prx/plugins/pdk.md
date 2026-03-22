---
title: დანამატის განვითარების ნაკრები (PDK)
description: API მითითება PRX დანამატის განვითარების ნაკრებისთვის, რომელიც WASM დანამატების შესაქმნელად გამოიყენება.
---

# დანამატის განვითარების ნაკრები (PDK)

PRX PDK არის Rust crate, რომელიც PRX დანამატების შესაქმნელად საჭირო ტიპებს, თვისებებსა და მაკროებს უზრუნველყოფს. იგი სერიალიზაციას, ჰოსტ ფუნქციების ბაინდინგებსა და დანამატის სიცოცხლის ციკლს ამუშავებს.

## ინსტალაცია

დაამატეთ თქვენს `Cargo.toml`-ში:

```toml
[dependencies]
prx-pdk = "0.1"
```

## ძირითადი თვისებები

### Tool

`Tool` თვისება ახალი ინსტრუმენტების რეგისტრაციისთვის გამოიყენება, რომლებსაც აგენტი გამოიძახებს:

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

`Channel` თვისება ახალ შეტყობინებების არხებს ამატებს:

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

`Filter` თვისება შეტყობინებებს LLM-მდე ან მის შემდეგ ამუშავებს:

```rust
use prx_pdk::prelude::*;

#[prx_filter(stage = "pre")]
fn content_filter(message: &str) -> Result<FilterAction, PluginError> {
    // დააბრუნეთ FilterAction::Pass ან FilterAction::Block
}
```

## ტიპები

PDK საერთო ტიპებს ექსპორტირებს: `PluginError`, `FilterAction`, `ToolResult`, `ChannelMessage` და `PluginConfig`.

## დაკავშირებული გვერდები

- [დეველოპერის სახელმძღვანელო](./developer-guide)
- [ჰოსტ ფუნქციები](./host-functions)
- [მაგალითები](./examples)
