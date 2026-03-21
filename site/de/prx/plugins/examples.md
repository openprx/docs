---
title: Plugin-Beispiele
description: Beispiel-PRX-Plugins, die gangige Muster und Anwendungsfalle demonstrieren.
---

# Plugin-Beispiele

Diese Seite bietet Beispiel-Plugins, um Ihnen den Einstieg in die PRX-Plugin-Entwicklung zu erleichtern.

## Beispiel 1: Einfaches Werkzeug-Plugin

Ein Werkzeug-Plugin, das Text in Grossbuchstaben umwandelt:

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

## Beispiel 2: HTTP-API-Werkzeug

Ein Werkzeug-Plugin, das Daten von einer externen API abruft:

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

## Beispiel 3: Inhaltsfilter

Ein Filter-Plugin, das sensible Informationen schwärzt:

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

## Beispiel 4: Plugin mit Konfiguration

Ein Plugin, das aus seiner Konfiguration liest:

```rust
use prx_pdk::prelude::*;

#[prx_tool(name = "greet")]
fn greet(name: String) -> Result<String, PluginError> {
    let greeting = config_get("greeting").unwrap_or("Hello".to_string());
    Ok(format!("{}, {}!", greeting, name))
}
```

Konfiguration in `config.toml`:

```toml
[[plugins.registry]]
name = "greet"
path = "greet.wasm"
enabled = true

[plugins.registry.config]
greeting = "Welcome"
```

## Verwandte Seiten

- [Entwicklerhandbuch](./developer-guide)
- [PDK-Referenz](./pdk)
- [Host-Funktionen](./host-functions)
