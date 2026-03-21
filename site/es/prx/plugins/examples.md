---
title: Ejemplos de plugins
description: Plugins de ejemplo de PRX que demuestran patrones comunes y casos de uso.
---

# Ejemplos de plugins

Esta pagina proporciona plugins de ejemplo para ayudarte a comenzar con el desarrollo de plugins de PRX.

## Ejemplo 1: Plugin de herramienta simple

Un plugin de herramienta que convierte texto a mayusculas:

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

## Ejemplo 2: Herramienta de API HTTP

Un plugin de herramienta que obtiene datos de una API externa:

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

## Ejemplo 3: Filtro de contenido

Un plugin de filtro que redacta informacion sensible:

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

## Ejemplo 4: Plugin con configuracion

Un plugin que lee de su configuracion:

```rust
use prx_pdk::prelude::*;

#[prx_tool(name = "greet")]
fn greet(name: String) -> Result<String, PluginError> {
    let greeting = config_get("greeting").unwrap_or("Hello".to_string());
    Ok(format!("{}, {}!", greeting, name))
}
```

Configuracion en `config.toml`:

```toml
[[plugins.registry]]
name = "greet"
path = "greet.wasm"
enabled = true

[plugins.registry.config]
greeting = "Welcome"
```

## Paginas relacionadas

- [Guia del desarrollador](./developer-guide)
- [Referencia del PDK](./pdk)
- [Funciones del host](./host-functions)
