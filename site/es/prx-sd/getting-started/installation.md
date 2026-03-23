---
title: Instalación
description: Instalar PRX-SD en Linux, macOS o Windows WSL2 usando el script de instalación, Cargo, compilando desde el código fuente o Docker.
---

# Instalación

PRX-SD admite cuatro métodos de instalación. Elige el que mejor se adapte a tu flujo de trabajo.

::: tip Recomendado
El **script de instalación** es la forma más rápida de comenzar. Detecta tu plataforma, descarga el binario correcto y lo coloca en tu PATH.
:::

## Requisitos Previos

| Requisito | Mínimo | Notas |
|-----------|--------|-------|
| Sistema Operativo | Linux (x86_64, aarch64), macOS (12+), Windows (WSL2) | Windows nativo no es compatible |
| Espacio en Disco | 200 MB | ~50 MB binario + ~150 MB base de datos de firmas |
| RAM | 512 MB | 2 GB+ recomendado para escaneos de directorios grandes |
| Rust (solo compilación desde fuente) | 1.85.0 | No necesario para instalación por script o Docker |
| Git (solo compilación desde fuente) | 2.30+ | Para clonar el repositorio |
| Docker (solo Docker) | 20.10+ | O Podman 3.0+ |

## Método 1: Script de Instalación (Recomendado)

El script de instalación descarga el último binario de la versión para tu plataforma y lo coloca en `/usr/local/bin`.

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash
```

Para instalar una versión específica:

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash -s -- --version 0.5.0
```

El script admite las siguientes variables de entorno:

| Variable | Predeterminado | Descripción |
|----------|----------------|-------------|
| `INSTALL_DIR` | `/usr/local/bin` | Directorio de instalación personalizado |
| `VERSION` | `latest` | Versión de lanzamiento específica |
| `ARCH` | auto-detectado | Anular arquitectura (`x86_64`, `aarch64`) |

## Método 2: Cargo Install

Si tienes Rust instalado, puedes instalar directamente desde crates.io:

```bash
cargo install prx-sd
```

Esto compila desde el código fuente y coloca el binario `sd` en `~/.cargo/bin/`.

::: warning Dependencias de Compilación
Cargo install compila dependencias nativas. En Debian/Ubuntu puede ser necesario:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
En macOS, se requieren las Herramientas de Línea de Comandos de Xcode:
```bash
xcode-select --install
```
:::

## Método 3: Compilar desde el Código Fuente

Clona el repositorio y compila en modo release:

```bash
git clone https://github.com/openprx/prx-sd.git
cd prx-sd
cargo build --release
```

El binario se encuentra en `target/release/sd`. Cópialo a tu PATH:

```bash
sudo cp target/release/sd /usr/local/bin/sd
```

### Opciones de Compilación

| Indicador de Característica | Predeterminado | Descripción |
|----------------------------|----------------|-------------|
| `yara` | habilitado | Motor de reglas YARA-X |
| `ml` | deshabilitado | Motor de inferencia ML ONNX |
| `gui` | deshabilitado | GUI de escritorio Tauri + Vue 3 |
| `virustotal` | deshabilitado | Integración con la API de VirusTotal |

Para compilar con soporte de inferencia ML:

```bash
cargo build --release --features ml
```

Para compilar la GUI de escritorio:

```bash
cargo build --release --features gui
```

## Método 4: Docker

Descarga la imagen oficial de Docker:

```bash
docker pull ghcr.io/openprx/prx-sd:latest
```

Ejecuta un escaneo montando un directorio objetivo:

```bash
docker run --rm -v /path/to/scan:/scan ghcr.io/openprx/prx-sd:latest scan /scan --recursive
```

Para monitoreo en tiempo real, ejecuta como demonio:

```bash
docker run -d \
  --name prx-sd \
  --restart unless-stopped \
  -v /home:/watch/home:ro \
  -v /tmp:/watch/tmp:ro \
  ghcr.io/openprx/prx-sd:latest \
  monitor /watch/home /watch/tmp
```

::: tip Docker Compose
En el directorio raíz del repositorio se encuentra un `docker-compose.yml` para despliegues en producción con actualizaciones automáticas de firmas.
:::

## Notas de Plataforma

### Linux

PRX-SD funciona en cualquier distribución Linux moderna. Para monitoreo en tiempo real se usa el subsistema `inotify`. Es posible que necesites aumentar el límite de vigilancia para árboles de directorios grandes:

```bash
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

La detección de rootkits y el escaneo de memoria requieren privilegios de root.

### macOS

PRX-SD usa FSEvents para monitoreo en tiempo real en macOS. Tanto Apple Silicon (aarch64) como Intel (x86_64) son compatibles. El script de instalación detecta automáticamente tu arquitectura.

::: warning Gatekeeper de macOS
Si macOS bloquea el binario, elimina el atributo de cuarentena:
```bash
xattr -d com.apple.quarantine /usr/local/bin/sd
```
:::

### Windows (WSL2)

PRX-SD se ejecuta dentro de WSL2 usando el binario Linux. Instala primero WSL2 con una distribución Linux y luego sigue los pasos de instalación para Linux. El soporte nativo de Windows está planificado para una versión futura.

## Verificar la Instalación

Después de la instalación, verifica que `sd` funcione:

```bash
sd --version
```

Salida esperada:

```
prx-sd 0.5.0
```

Comprueba el estado completo del sistema incluyendo la base de datos de firmas:

```bash
sd info
```

Esto muestra la versión instalada, recuentos de firmas, recuentos de reglas YARA y rutas de la base de datos.

## Desinstalación

### Script / Cargo Install

```bash
# Eliminar el binario
sudo rm /usr/local/bin/sd
# O si se instaló mediante Cargo
cargo uninstall prx-sd

# Eliminar base de datos de firmas y configuración
rm -rf ~/.config/prx-sd
rm -rf ~/.local/share/prx-sd
```

### Docker

```bash
docker stop prx-sd && docker rm prx-sd
docker rmi ghcr.io/openprx/prx-sd:latest
```

## Próximos Pasos

- [Inicio Rápido](./quickstart) -- Empieza a escanear en 5 minutos
- [Escaneo de Archivos y Directorios](../scanning/file-scan) -- Referencia completa del comando `sd scan`
- [Descripción General del Motor de Detección](../detection/) -- Comprende el pipeline multicapa
