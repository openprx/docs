---
title: Instalación
description: "Instala PRX-WAF usando Docker Compose, Cargo o compilando desde el código fuente. Incluye requisitos previos, notas de plataforma y verificación post-instalación."
---

# Instalación

PRX-WAF admite tres métodos de instalación. Elige el que mejor se adapte a tu flujo de trabajo.

::: tip Recomendado
**Docker Compose** es la forma más rápida de comenzar. Levanta PRX-WAF, PostgreSQL y la interfaz de administración con un solo comando.
:::

## Requisitos Previos

| Requisito | Mínimo | Notas |
|-----------|--------|-------|
| Sistema Operativo | Linux (x86_64, aarch64), macOS (12+) | Windows vía WSL2 |
| PostgreSQL | 16+ | Incluido en Docker Compose |
| Rust (solo compilación desde código fuente) | 1.82.0 | No necesario para instalación Docker |
| Node.js (solo compilación de interfaz de administración) | 18+ | No necesario para instalación Docker |
| Docker | 20.10+ | O Podman 3.0+ |
| Espacio en Disco | 500 MB | ~100 MB binario + ~400 MB datos PostgreSQL |
| RAM | 512 MB | 2 GB+ recomendado para producción |

## Método 1: Docker Compose (Recomendado)

Clona el repositorio e inicia todos los servicios con Docker Compose:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# Review and edit environment variables in docker-compose.yml
# (database password, admin credentials, listen ports)
docker compose up -d
```

Esto inicia tres contenedores:

| Contenedor | Puerto | Descripción |
|------------|--------|-------------|
| `prx-waf` | `80`, `443` | Proxy inverso (HTTP + HTTPS) |
| `prx-waf` | `9527` | API de administración + interfaz Vue 3 |
| `postgres` | `5432` | Base de datos PostgreSQL 16 |

Verifica la implementación:

```bash
# Check container status
docker compose ps

# Check health endpoint
curl http://localhost:9527/health
```

Abre la interfaz de administración en `http://localhost:9527` e inicia sesión con las credenciales predeterminadas: `admin` / `admin`.

::: warning Cambiar Contraseña Predeterminada
Cambia la contraseña de administrador predeterminada inmediatamente después del primer inicio de sesión. Ve a **Configuración > Cuenta** en la interfaz de administración o usa la API.
:::

### Docker Compose con Podman

Si usas Podman en lugar de Docker:

```bash
podman-compose up -d --build
```

::: info DNS de Podman
Al usar Podman, la dirección del resolvedor DNS para la comunicación entre contenedores es `10.89.0.1` en lugar del `127.0.0.11` de Docker. El archivo `docker-compose.yml` incluido maneja esto automáticamente.
:::

## Método 2: Instalación con Cargo

Si tienes Rust instalado, puedes instalar PRX-WAF desde el repositorio:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
cargo build --release
```

El binario se encuentra en `target/release/prx-waf`. Cópialo a tu PATH:

```bash
sudo cp target/release/prx-waf /usr/local/bin/prx-waf
```

::: warning Dependencias de Compilación
La compilación con Cargo compila dependencias nativas. En Debian/Ubuntu puede ser necesario:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
En macOS, se requieren las Xcode Command Line Tools:
```bash
xcode-select --install
```
:::

### Configuración de la Base de Datos

PRX-WAF requiere una base de datos PostgreSQL 16+:

```bash
# Create database and user
createdb prx_waf
createuser prx_waf

# Run migrations
./target/release/prx-waf -c configs/default.toml migrate

# Create default admin user (admin/admin)
./target/release/prx-waf -c configs/default.toml seed-admin
```

### Iniciar el Servidor

```bash
./target/release/prx-waf -c configs/default.toml run
```

Esto inicia el proxy inverso en los puertos 80/443 y la API de administración en el puerto 9527.

## Método 3: Compilar desde el Código Fuente (Desarrollo)

Para desarrollo con recarga en vivo de la interfaz de administración:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# Build the Rust backend
cargo build

# Build the admin UI
cd web/admin-ui
npm install
npm run build
cd ../..

# Start the development server
cargo run -- -c configs/default.toml run
```

### Compilar la Interfaz de Administración para Producción

```bash
cd web/admin-ui
npm install
npm run build
```

Los archivos compilados se incrustan en el binario Rust en tiempo de compilación y son servidos por el servidor de API.

## Servicio systemd

Para implementaciones en producción en bare metal, crea un servicio systemd:

```ini
# /etc/systemd/system/prx-waf.service
[Unit]
Description=PRX-WAF Web Application Firewall
After=network.target postgresql.service

[Service]
Type=simple
User=prx-waf
ExecStart=/usr/local/bin/prx-waf -c /etc/prx-waf/config.toml run
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-waf
sudo systemctl status prx-waf
```

## Verificar la Instalación

Después de la instalación, verifica que PRX-WAF esté en ejecución:

```bash
# Check health endpoint
curl http://localhost:9527/health

# Check admin UI
curl -s http://localhost:9527 | head -5
```

Inicia sesión en la interfaz de administración en `http://localhost:9527` para verificar que el panel carga correctamente.

## Próximos Pasos

- [Inicio Rápido](./quickstart) -- Protege tu primera aplicación en 5 minutos
- [Configuración](../configuration/) -- Personaliza los ajustes de PRX-WAF
- [Motor de Reglas](../rules/) -- Comprende el pipeline de detección
