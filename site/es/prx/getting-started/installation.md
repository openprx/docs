---
title: Instalacion
description: Instala PRX en Linux, macOS o Windows WSL2 usando el script de instalacion, Cargo, compilacion desde el codigo fuente o Docker.
---

# Instalacion

PRX se distribuye como un unico binario estatico llamado `prx`. Elige el metodo de instalacion que mejor se adapte a tu flujo de trabajo.

## Requisitos previos

Antes de instalar PRX, asegurate de que tu sistema cumple con estos requisitos:

| Requisito | Detalles |
|-----------|----------|
| **SO** | Linux (x86_64, aarch64), macOS (Apple Silicon, Intel) o Windows via WSL2 |
| **Rust** | 1.92.0+ (edicion 2024) -- solo necesario para instalacion via Cargo o compilacion desde el codigo fuente |
| **Paquetes del sistema** | `pkg-config` (Linux, solo para compilacion desde el codigo fuente) |
| **Espacio en disco** | ~50 MB para el binario, ~200 MB con el runtime de plugins WASM |
| **RAM** | 64 MB minimo para el demonio (sin inferencia LLM) |

::: tip
Si usas el script de instalacion o Docker, no necesitas tener Rust instalado en tu sistema.
:::

## Metodo 1: Script de instalacion (Recomendado)

La forma mas rapida de comenzar. El script detecta tu sistema operativo y arquitectura, descarga el binario de la ultima version y lo coloca en tu `PATH`.

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

El script instala `prx` en `~/.local/bin/` por defecto. Asegurate de que este directorio este en tu `PATH`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Para instalar una version especifica:

```bash
curl -fsSL https://openprx.dev/install.sh | bash -s -- --version 0.3.0
```

Para instalar en un directorio personalizado:

```bash
curl -fsSL https://openprx.dev/install.sh | bash -s -- --prefix /usr/local
```

## Metodo 2: Cargo Install

Si tienes la cadena de herramientas de Rust instalada, puedes instalar PRX directamente desde crates.io:

```bash
cargo install openprx
```

Esto compila el binario en modo release con las caracteristicas por defecto y lo coloca en `~/.cargo/bin/prx`.

Para instalar con todas las caracteristicas opcionales (cifrado E2EE de Matrix, WhatsApp Web, etc.):

```bash
cargo install openprx --all-features
```

::: info Feature Flags
PRX usa feature flags de Cargo para el soporte opcional de canales:

| Feature | Descripcion |
|---------|-------------|
| `channel-matrix` | Canal Matrix con soporte de cifrado E2E |
| `whatsapp-web` | Canal WhatsApp Web multi-dispositivo |
| **default** | Todos los canales estables habilitados |
:::

## Metodo 3: Compilar desde el codigo fuente

Para desarrollo o para ejecutar el codigo mas reciente no publicado:

```bash
# Clonar el repositorio
git clone https://github.com/openprx/prx.git
cd prx

# Compilar el binario en modo release
cargo build --release

# El binario esta en target/release/prx
./target/release/prx --version
```

Para compilar con todas las caracteristicas:

```bash
cargo build --release --all-features
```

Para instalar el binario compilado localmente en tu directorio de binarios de Cargo:

```bash
cargo install --path .
```

### Compilacion de desarrollo

Para iteraciones mas rapidas durante el desarrollo, usa una compilacion en modo debug:

```bash
cargo build
./target/debug/prx --version
```

::: warning
Las compilaciones en modo debug son significativamente mas lentas en tiempo de ejecucion. Usa siempre `--release` para produccion o benchmarking.
:::

## Metodo 4: Docker

Ejecuta PRX como un contenedor sin necesidad de instalacion local:

```bash
docker pull ghcr.io/openprx/prx:latest
```

Ejecutar con un directorio de configuracion montado:

```bash
docker run -d \
  --name prx \
  -v ~/.config/openprx:/home/prx/.config/openprx \
  -p 3120:3120 \
  ghcr.io/openprx/prx:latest \
  daemon
```

O usa Docker Compose:

```yaml
# docker-compose.yml
services:
  prx:
    image: ghcr.io/openprx/prx:latest
    restart: unless-stopped
    ports:
      - "3120:3120"
    volumes:
      - ./config:/home/prx/.config/openprx
      - ./data:/home/prx/.local/share/openprx
    command: daemon
```

::: tip
Al ejecutar en Docker, configura tus claves API de LLM mediante variables de entorno o monta un archivo de configuracion. Consulta [Configuracion](../config/) para mas detalles.
:::

## Verificar la instalacion

Despues de instalar, verifica que PRX funciona correctamente:

```bash
prx --version
```

Salida esperada:

```
prx 0.3.0
```

Ejecuta la comprobacion de salud:

```bash
prx doctor
```

Esto verifica tu cadena de herramientas de Rust (si esta instalada), dependencias del sistema, validez del archivo de configuracion y conectividad de red con los proveedores de LLM.

## Notas por plataforma

### Linux

PRX funciona en cualquier distribucion moderna de Linux (kernel 4.18+). El binario esta enlazado estaticamente con `rustls` para TLS, por lo que no se requiere instalacion de OpenSSL.

Para las funcionalidades de sandbox, puede que necesites paquetes adicionales:

```bash
# Backend de sandbox Firejail
sudo apt install firejail

# Backend de sandbox Bubblewrap
sudo apt install bubblewrap

# Backend de sandbox Docker (requiere el demonio Docker)
sudo apt install docker.io
```

### macOS

PRX se ejecuta nativamente tanto en Macs con Apple Silicon (aarch64) como en Intel (x86_64). El canal iMessage solo esta disponible en macOS.

Si compilas desde el codigo fuente, asegurate de tener las herramientas de linea de comandos de Xcode:

```bash
xcode-select --install
```

### Windows (WSL2)

PRX es compatible con Windows a traves de WSL2. Instala una distribucion de Linux (se recomienda Ubuntu) y sigue las instrucciones de Linux dentro de tu entorno WSL2.

```powershell
# Desde PowerShell (instalar WSL2 con Ubuntu)
wsl --install -d Ubuntu
```

Luego dentro de WSL2:

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

::: warning
El soporte nativo de Windows no esta disponible actualmente. WSL2 proporciona rendimiento casi nativo de Linux y es el enfoque recomendado.
:::

## Desinstalacion

Para eliminar PRX:

```bash
# Si se instalo via script de instalacion
rm ~/.local/bin/prx

# Si se instalo via Cargo
cargo uninstall openprx

# Eliminar configuracion y datos (opcional)
rm -rf ~/.config/openprx
rm -rf ~/.local/share/openprx
```

## Siguientes pasos

- [Inicio rapido](./quickstart) -- Pon PRX en funcionamiento en 5 minutos
- [Asistente de configuracion inicial](./onboarding) -- Configura tu proveedor de LLM
- [Configuracion](../config/) -- Referencia completa de configuracion
