---
title: Instalación
description: "Compilar e instalar PRX-Memory desde el código fuente o vía cargo install."
---

# Instalación

## Prerrequisitos

| Prerrequisito | Versión Mínima | Notas |
|---------------|----------------|-------|
| Rust | 1.75 | Usa `rustup` para instalación |
| Cargo | Incluido con Rust | -- |
| Git | Cualquier versión reciente | Para clonar el repositorio |
| OpenSSL headers | -- | Requerido en Linux para enlazar |

## Compilar desde el Código Fuente

```bash
git clone https://github.com/openprx/prx-memory
cd prx-memory
cargo build --release -p prx-memory-mcp --bin prx-memoryd
```

El binario compilado estará en `./target/release/prx-memoryd`.

### Con Soporte LanceDB (Opcional)

Para habilitar el backend LanceDB para búsqueda vectorial ANN a gran escala:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

::: warning Dependencias Nativas
LanceDB requiere dependencias nativas adicionales. En Linux, puede necesitar:
```bash
sudo apt install -y build-essential cmake
```
:::

## Via cargo install

```bash
cargo install --path crates/prx-memory-mcp --bin prx-memoryd
```

Esto instala `prx-memoryd` en tu directorio `~/.cargo/bin/`.

## Uso como Biblioteca

Para integrar PRX-Memory en tu aplicación Rust, añade los crates relevantes a tu `Cargo.toml`:

```toml
[dependencies]
prx-memory-core = "0.1"
prx-memory-embed = "0.1"
prx-memory-rerank = "0.1"
prx-memory-storage = "0.1"

# With LanceDB support
# prx-memory-storage = { version = "0.1", features = ["lancedb-backend"] }
```

## Verificar la Instalación

```bash
prx-memoryd --help
```

Deberías ver la información de uso con las opciones disponibles de transporte y configuración.

## Siguientes Pasos

- [Inicio Rápido](./quickstart) -- Primeras operaciones de almacenamiento y recuperación
- [Referencia de Configuración](../configuration/) -- Todas las variables de entorno
