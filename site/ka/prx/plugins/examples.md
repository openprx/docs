---
title: დანამატის მაგალითები
description: Example PRX plugins demonstrating common patterns and use cases.
---

# Plugin Examples

This page provides example plugins to help you get started with PRX plugin development.

## Example 1: Simple Tool Plugin

A tool plugin that converts text to uppercase:

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

## Example 2: HTTP API Tool

A tool plugin that fetches data from an external API:

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

## Example 3: Content Filter

A filter plugin that redacts sensitive information:

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

## Example 4: Plugin with Configuration

A plugin that reads from its configuration:

```rust
use prx_pdk::prelude::*;

#[prx_tool(name = "greet")]
fn greet(name: String) -> Result<String, PluginError> {
    let greeting = config_get("greeting").unwrap_or("Hello".to_string());
    Ok(format!("{}, {}!", greeting, name))
}
```

Configuration in `config.toml`:

```toml
[[plugins.registry]]
name = "greet"
path = "greet.wasm"
enabled = true

[plugins.registry.config]
greeting = "Welcome"
```

## Related Pages

- [Developer Guide](./developer-guide)
- [PDK Reference](./pdk)
- [Host Functions](./host-functions)
