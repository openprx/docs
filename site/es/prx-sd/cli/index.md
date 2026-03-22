---
title: Referencia de Comandos CLI
description: "Referencia completa de los 27 subcomandos CLI de sd, organizados por categoría, con opciones globales y ejemplos de uso rápido."
---

# Referencia de Comandos CLI

La interfaz de línea de comandos `sd` proporciona 27 subcomandos organizados en 10 categorías. Esta página sirve como índice de referencia rápida. Cada comando enlaza a su página de documentación detallada donde está disponible.

## Opciones Globales

Estos indicadores pueden pasarse a cualquier subcomando:

| Indicador | Predeterminado | Descripción |
|-----------|----------------|-------------|
| `--log-level <LEVEL>` | `warn` | Verbosidad de logging: `trace`, `debug`, `info`, `warn`, `error` |
| `--data-dir <PATH>` | `~/.prx-sd` | Directorio base de datos para firmas, cuarentena, configuración y plugins |
| `--help` | -- | Mostrar ayuda para cualquier comando o subcomando |
| `--version` | -- | Mostrar la versión del motor |

```bash
# Enable debug logging
sd --log-level debug scan /tmp

# Use a custom data directory
sd --data-dir /opt/prx-sd scan /home
```

## Escaneo

Comandos para escaneo de archivos y sistema bajo demanda.

| Comando | Descripción |
|---------|-------------|
| `sd scan <PATH>` | Escanear un archivo o directorio en busca de amenazas |
| `sd scan-memory` | Escanear la memoria de procesos en ejecución (solo Linux, requiere root) |
| `sd scan-usb [DEVICE]` | Escanear dispositivos USB/extraíbles |
| `sd check-rootkit` | Verificar indicadores de rootkits (solo Linux) |

```bash
# Scan a directory recursively with auto-quarantine
sd scan /home --auto-quarantine

# Scan with JSON output for automation
sd scan /tmp --json

# Scan with 4 threads and HTML report
sd scan /var --threads 4 --report /tmp/report.html

# Exclude patterns
sd scan /home --exclude "*.log" --exclude "/home/user/.cache"

# Scan and auto-remediate (kill process, quarantine, clean persistence)
sd scan /tmp --remediate

# Scan process memory
sudo sd scan-memory
sudo sd scan-memory --pid 1234

# Scan USB devices
sd scan-usb
sd scan-usb /dev/sdb1 --auto-quarantine

# Check for rootkits
sudo sd check-rootkit
sudo sd check-rootkit --json
```

## Monitoreo en Tiempo Real

Comandos para monitoreo continuo del sistema de archivos y operación del demonio en segundo plano.

| Comando | Descripción |
|---------|-------------|
| `sd monitor <PATHS...>` | Iniciar monitoreo del sistema de archivos en tiempo real |
| `sd daemon [PATHS...]` | Ejecutar como demonio en segundo plano con monitoreo y actualizaciones automáticas |

```bash
# Monitor /home and /tmp for changes
sd monitor /home /tmp

# Monitor with block mode (fanotify, requires root)
sudo sd monitor /home --block

# Run as daemon with default paths (/home, /tmp)
sd daemon

# Daemon with custom update interval (every 2 hours)
sd daemon /home /tmp /var --update-hours 2
```

## Gestión de Cuarentena

Comandos para gestionar el almacén de cuarentena cifrado con AES-256-GCM.

| Comando | Descripción |
|---------|-------------|
| `sd quarantine list` | Listar todos los archivos en cuarentena |
| `sd quarantine restore <ID>` | Restaurar un archivo en cuarentena a su ubicación original |
| `sd quarantine delete <ID>` | Eliminar permanentemente un archivo en cuarentena |
| `sd quarantine delete-all` | Eliminar permanentemente todos los archivos en cuarentena |
| `sd quarantine stats` | Mostrar estadísticas del almacén de cuarentena |

```bash
# List quarantined files
sd quarantine list

# Restore a file (use first 8 chars of ID)
sd quarantine restore a1b2c3d4

# Restore to an alternate path
sd quarantine restore a1b2c3d4 --to /tmp/recovered/

# Delete a specific entry
sd quarantine delete a1b2c3d4

# Delete all entries (with confirmation prompt)
sd quarantine delete-all

# Delete all without confirmation
sd quarantine delete-all --yes

# View quarantine statistics
sd quarantine stats
```

## Gestión de Firmas

Comandos para actualizar e importar firmas de amenazas.

| Comando | Descripción |
|---------|-------------|
| `sd update` | Verificar y aplicar actualizaciones de la base de datos de firmas |
| `sd import <FILE>` | Importar firmas de hash desde un archivo de lista de bloqueo |
| `sd import-clamav <FILES...>` | Importar archivos de firma ClamAV (.cvd, .hdb, .hsb) |
| `sd info` | Mostrar versión del motor, estado de firmas e información del sistema |

```bash
# Update signatures
sd update

# Check for updates without downloading
sd update --check-only

# Force re-download
sd update --force

# Import custom hash file
sd import /path/to/hashes.txt

# Import ClamAV signatures
sd import-clamav main.cvd daily.cvd

# Show engine info
sd info
```

## Configuración

Comandos para gestionar la configuración del motor y la política de remediación.

| Comando | Descripción |
|---------|-------------|
| `sd config show` | Mostrar la configuración actual |
| `sd config set <KEY> <VALUE>` | Establecer un valor de configuración |
| `sd config reset` | Restablecer la configuración a los valores predeterminados |
| `sd policy show` | Mostrar la política de remediación |
| `sd policy set <KEY> <VALUE>` | Establecer un valor de política de remediación |
| `sd policy reset` | Restablecer la política de remediación a los valores predeterminados |

```bash
# Show config
sd config show

# Set scan threads
sd config set scan.threads 8

# Reset to defaults
sd config reset

# Show remediation policy
sd policy show
```

Consulta la [Descripción General de Configuración](../configuration/) y la [Referencia de Configuración](../configuration/reference) para más detalles.

## Escaneos Programados

Comandos para gestionar escaneos programados recurrentes mediante temporizadores de systemd o cron.

| Comando | Descripción |
|---------|-------------|
| `sd schedule add <PATH>` | Registrar un escaneo programado recurrente |
| `sd schedule remove` | Eliminar el escaneo programado |
| `sd schedule status` | Mostrar el estado del programa actual |

```bash
# Schedule a weekly scan of /home
sd schedule add /home --frequency weekly

# Schedule a daily scan
sd schedule add /var --frequency daily

# Available frequencies: hourly, 4h, 12h, daily, weekly
sd schedule add /tmp --frequency 4h

# Remove the schedule
sd schedule remove

# Check schedule status
sd schedule status
```

## Alertas y Webhooks

Comandos para configurar notificaciones de alerta mediante webhooks y correo electrónico.

| Comando | Descripción |
|---------|-------------|
| `sd webhook list` | Listar los endpoints de webhook configurados |
| `sd webhook add <NAME> <URL>` | Agregar un endpoint de webhook |
| `sd webhook remove <NAME>` | Eliminar un endpoint de webhook |
| `sd webhook test` | Enviar una alerta de prueba a todos los webhooks |
| `sd email-alert configure` | Configurar alertas de correo electrónico SMTP |
| `sd email-alert test` | Enviar un correo electrónico de alerta de prueba |
| `sd email-alert send <NAME> <LEVEL> <PATH>` | Enviar un correo electrónico de alerta personalizado |

```bash
# Add a Slack webhook
sd webhook add my-slack https://hooks.slack.com/services/... --format slack

# Add a Discord webhook
sd webhook add my-discord https://discord.com/api/webhooks/... --format discord

# Add a generic webhook
sd webhook add my-webhook https://example.com/webhook

# List all webhooks
sd webhook list

# Test all webhooks
sd webhook test

# Configure email alerts
sd email-alert configure

# Test email alerts
sd email-alert test
```

## Protección de Red

Comandos para bloqueo de anuncios y dominios maliciosos a nivel DNS.

| Comando | Descripción |
|---------|-------------|
| `sd adblock enable` | Habilitar la protección de adblock mediante el archivo hosts |
| `sd adblock disable` | Deshabilitar la protección de adblock |
| `sd adblock sync` | Volver a descargar todas las listas de filtros |
| `sd adblock stats` | Mostrar estadísticas del motor de adblock |
| `sd adblock check <URL>` | Verificar si una URL/dominio está bloqueado |
| `sd adblock log` | Mostrar entradas bloqueadas recientes |
| `sd adblock add <NAME> <URL>` | Agregar una lista de filtros personalizada |
| `sd adblock remove <NAME>` | Eliminar una lista de filtros |
| `sd dns-proxy` | Iniciar proxy DNS local con filtrado |

```bash
# Enable adblock
sudo sd adblock enable

# Start DNS proxy
sudo sd dns-proxy --listen 127.0.0.1:53 --upstream 1.1.1.1:53
```

Consulta [Adblock](../network/adblock) y [Proxy DNS](../network/dns-proxy) para más detalles.

## Informes

| Comando | Descripción |
|---------|-------------|
| `sd report <OUTPUT>` | Generar un informe HTML a partir de resultados de escaneo JSON |

```bash
# Scan with JSON output, then generate HTML report
sd scan /home --json > results.json
sd report report.html --input results.json

# Or use the --report flag directly
sd scan /home --report /tmp/scan-report.html
```

## Sistema

Comandos para mantenimiento del motor, integración y auto-actualización.

| Comando | Descripción |
|---------|-------------|
| `sd status` | Mostrar estado del demonio (en ejecución/detenido, PID, amenazas bloqueadas) |
| `sd install-integration` | Instalar integración de escaneo con clic derecho en el gestor de archivos |
| `sd self-update` | Verificar y aplicar actualizaciones del binario del motor |

```bash
# Check daemon status
sd status

# Install desktop integration
sd install-integration

# Check for engine updates
sd self-update --check-only

# Apply engine update
sd self-update
```

## Comunidad

Comandos para compartir inteligencia de amenazas comunitaria.

| Comando | Descripción |
|---------|-------------|
| `sd community status` | Mostrar la configuración de compartición comunitaria |
| `sd community enroll` | Registrar esta máquina con la API de la comunidad |
| `sd community disable` | Deshabilitar la compartición comunitaria |

```bash
# Check enrollment status
sd community status

# Enroll in community sharing
sd community enroll

# Disable sharing (preserves credentials)
sd community disable
```

## Próximos Pasos

- Comienza con la [Guía de Inicio Rápido](../getting-started/quickstart) para empezar a escanear en 5 minutos
- Explora la [Configuración](../configuration/) para personalizar el comportamiento del motor
- Configura el [Monitoreo en Tiempo Real](../realtime/) para protección continua
- Aprende sobre el pipeline del [Motor de Detección](../detection/)
