---
title: Instalación
description: Compilar OpenPR-Webhook desde fuente con Rust y configurarlo para recibir webhooks de OpenPR.
---

# Instalación

## Requisitos Previos

- Toolchain de Rust (edición 2024 o posterior)
- Una instancia de OpenPR en ejecución que pueda enviar eventos webhook

## Compilar desde Fuente

Clona el repositorio y compila en modo release:

```bash
git clone https://github.com/openprx/openpr-webhook.git
cd openpr-webhook
cargo build --release
```

El binario se produce en `target/release/openpr-webhook`.

## Dependencias

OpenPR-Webhook está construido sobre las siguientes librerías principales:

| Crate | Propósito |
|-------|---------|
| `axum` 0.8 | Framework de servidor HTTP |
| `tokio` 1 | Runtime async |
| `reqwest` 0.12 | Cliente HTTP para reenvío de webhooks y callbacks |
| `hmac` + `sha2` | Verificación de firma HMAC-SHA256 |
| `toml` 0.8 | Análisis de configuración |
| `tokio-tungstenite` 0.28 | Cliente WebSocket para modo túnel |
| `tracing` | Registro estructurado |

## Archivo de Configuración

Crea un archivo `config.toml`. El servicio carga este archivo al iniciarse. Ver [Referencia de Configuración](../configuration/index.md) para el esquema completo.

Ejemplo mínimo:

```toml
[server]
listen = "0.0.0.0:9000"

[security]
webhook_secrets = ["your-hmac-secret"]

[[agents]]
id = "notify"
name = "Notification Bot"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/..."
```

## Ejecutar

```bash
# Default: loads config.toml from the current directory
./target/release/openpr-webhook

# Specify a custom config path
./target/release/openpr-webhook /etc/openpr-webhook/config.toml
```

## Registro

El registro se controla mediante la variable de entorno `RUST_LOG`. El nivel predeterminado es `openpr_webhook=info`.

```bash
# Debug logging
RUST_LOG=openpr_webhook=debug ./target/release/openpr-webhook

# Trace-level logging (very verbose)
RUST_LOG=openpr_webhook=trace ./target/release/openpr-webhook
```

## Verificación de Estado

El servicio expone un endpoint `GET /health` que devuelve `ok` cuando el servidor está en ejecución:

```bash
curl http://localhost:9000/health
# ok
```

## Servicio Systemd (Opcional)

Para despliegues de producción en Linux:

```ini
[Unit]
Description=OpenPR Webhook Dispatcher
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/openpr-webhook /etc/openpr-webhook/config.toml
Restart=always
RestartSec=5
Environment=RUST_LOG=openpr_webhook=info

[Install]
WantedBy=multi-user.target
```

## Próximos Pasos

- [Inicio Rápido](quickstart.md) -- configura tu primer agente y pruébalo de extremo a extremo
- [Referencia de Configuración](../configuration/index.md) -- documentación completa del esquema TOML
