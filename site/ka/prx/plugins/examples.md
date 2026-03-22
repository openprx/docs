---
title: დანამატის მაგალითები
description: PRX დანამატების მაგალითები გავრცელებული შაბლონებისა და გამოყენების შემთხვევების დემონსტრაციით.
---

# დანამატის მაგალითები

ეს გვერდი მაგალითი დანამატებს წარმოადგენს PRX დანამატის შექმნის დასაწყებად.

## მაგალითი 1: მარტივი ინსტრუმენტის დანამატი

ინსტრუმენტის დანამატი, რომელიც ტექსტს ზედა რეგისტრში გარდაქმნის:

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

## მაგალითი 2: HTTP API ინსტრუმენტი

ინსტრუმენტის დანამატი, რომელიც გარე API-დან მონაცემებს იღებს:

```rust
use prx_pdk::prelude::*;

#[prx_tool(
    name = "github_stars",
    description = "Get star count for a GitHub repository"
)]
fn github_stars(repo: String) -> Result<String, PluginError> {
    let url = format!("https://api.github.com/repos/{}", repo);
    let resp = http_get(&url)?;
    // ვარსკვლავების რაოდენობის გარჩევა და დაბრუნება
    Ok(resp.body)
}
```

## მაგალითი 3: შინაარსის ფილტრი

ფილტრის დანამატი, რომელიც მგრძნობიარე ინფორმაციას რედაქტირებს:

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

## მაგალითი 4: დანამატი კონფიგურაციით

დანამატი, რომელიც თავის კონფიგურაციას კითხულობს:

```rust
use prx_pdk::prelude::*;

#[prx_tool(name = "greet")]
fn greet(name: String) -> Result<String, PluginError> {
    let greeting = config_get("greeting").unwrap_or("Hello".to_string());
    Ok(format!("{}, {}!", greeting, name))
}
```

კონფიგურაცია `config.toml`-ში:

```toml
[[plugins.registry]]
name = "greet"
path = "greet.wasm"
enabled = true

[plugins.registry.config]
greeting = "Welcome"
```

## დაკავშირებული გვერდები

- [დეველოპერის სახელმძღვანელო](./developer-guide)
- [PDK მითითება](./pdk)
- [ჰოსტ ფუნქციები](./host-functions)
