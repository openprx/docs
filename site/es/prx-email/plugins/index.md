---
title: Plugins WASM
description: "Sistema de plugins WASM de PRX-Email para ejecución en sandbox en el runtime de PRX. Host-calls WIT, interruptor de seguridad de red y guía de desarrollo de plugins."
---

# Plugins WASM

PRX-Email incluye un plugin WASM que compila el cliente de email a WebAssembly para ejecución en sandbox dentro del runtime de PRX. El plugin usa WIT (WebAssembly Interface Types) para definir interfaces de host-call, permitiendo que el código alojado en WASM invoque operaciones de email como sync, list, get, search, send y reply.

## Arquitectura

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

### Modelo de Ejecución

Cuando un plugin WASM llama a `email.execute`, el plugin despacha la llamada a la función de host-call apropiada. El runtime del host maneja las operaciones IMAP/SMTP reales, y los resultados se devuelven a través de la interfaz WIT.

## Interruptor de Seguridad de Red

La ejecución real de IMAP/SMTP desde el contexto WASM está **deshabilitada por defecto**. Esto previene que los plugins en sandbox realicen conexiones de red no intencionadas.

### Habilitar Operaciones de Red

Establece la variable de entorno antes de iniciar el runtime de PRX:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### Comportamiento Cuando Está Deshabilitado

| Operación | Comportamiento |
|-----------|---------------|
| `email.sync` | Devuelve error `EMAIL_NETWORK_GUARD` |
| `email.send` | Devuelve error `EMAIL_NETWORK_GUARD` |
| `email.reply` | Devuelve error `EMAIL_NETWORK_GUARD` |
| `email.list` | Funciona (lee de SQLite local) |
| `email.get` | Funciona (lee de SQLite local) |
| `email.search` | Funciona (lee de SQLite local) |

::: tip
Las operaciones de solo lectura (list, get, search) siempre funcionan porque consultan la base de datos SQLite local sin acceso a red. Solo las operaciones que requieren conexiones IMAP/SMTP están restringidas.
:::

### Capacidad del Host No Disponible

Cuando el runtime del host no proporciona la capacidad de email en absoluto (ruta de ejecución no WASM), las operaciones devuelven `EMAIL_HOST_CAPABILITY_UNAVAILABLE`.

## Estructura del Plugin

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

### Configuración de Cargo

```toml
[package]
name = "prx-email-plugin"
version = "0.1.0"
edition = "2024"

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

## Compilar el Plugin

### Prerrequisitos

- Toolchain de Rust
- Objetivo `wasm32-wasip1`

### Pasos de Compilación

```bash
# Add WASM target
rustup target add wasm32-wasip1

# Build the plugin
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### Usar el Script de Compilación

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

## Interfaz WIT

El plugin se comunica con el host a través de interfaces definidas por WIT. El paquete `prx:host` proporciona las siguientes funciones de host-call:

### Host-Calls Disponibles

| Función | Descripción | Red Requerida |
|---------|-------------|:-------------:|
| `email.sync` | Sincronizar bandeja de entrada IMAP para una cuenta/carpeta | Sí |
| `email.list` | Listar mensajes de la base de datos local | No |
| `email.get` | Obtener un mensaje específico por ID | No |
| `email.search` | Buscar mensajes por consulta | No |
| `email.send` | Enviar un nuevo email via SMTP | Sí |
| `email.reply` | Responder a un email existente | Sí |

### Formato de Solicitud/Respuesta

Los host-calls usan serialización JSON para los payloads de solicitud y respuesta:

```rust
// Example: list messages
let request = serde_json::json!({
    "account_id": 1,
    "limit": 10
});

let response = host_call("email.list", &request)?;
```

## Flujo de Trabajo de Desarrollo

### 1. Modificar el Código del Plugin

Edita `wasm-plugin/src/lib.rs` para añadir lógica personalizada:

```rust
// Add pre-processing before email operations
fn before_send(request: &SendRequest) -> Result<(), PluginError> {
    // Custom validation, logging, or transformation
    Ok(())
}
```

### 2. Recompilar

```bash
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### 3. Probar Localmente

Prueba con el interruptor de seguridad de red deshabilitado:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
# Run your PRX runtime with the updated plugin
```

### 4. Desplegar

Copia el archivo `.wasm` compilado al directorio de plugins de tu runtime de PRX.

## Modelo de Seguridad

| Restricción | Aplicación |
|------------|------------|
| Acceso de red | Deshabilitado por defecto; requiere `PRX_EMAIL_ENABLE_REAL_NETWORK=1` |
| Acceso al sistema de archivos | Sin acceso directo al sistema de archivos desde WASM |
| Memoria | Acotada por los límites de memoria lineal de WASM |
| Tiempo de ejecución | Acotado por medición de combustible |
| Seguridad de tokens | Los tokens OAuth son gestionados por el host, no expuestos a WASM |

::: warning
El plugin WASM no tiene acceso directo a los tokens OAuth ni credenciales. Toda la autenticación es manejada por el runtime del host. El plugin solo recibe resultados de operaciones, nunca credenciales raw.
:::

## Siguientes Pasos

- [Instalación](../getting-started/installation) -- Instrucciones de compilación para el plugin WASM
- [Referencia de Configuración](../configuration/) -- Interruptor de seguridad de red y ajustes de runtime
- [Resolución de Problemas](../troubleshooting/) -- Problemas relacionados con el plugin
