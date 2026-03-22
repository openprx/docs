---
title: Actualizar Firmas
description: "Mantén las bases de datos de inteligencia de amenazas al día con sd update, incluyendo actualizaciones incrementales y verificación Ed25519."
---

# Actualizar Firmas

El comando `sd update` descarga las últimas firmas de amenazas de todas las fuentes configuradas. Las actualizaciones regulares son críticas -- aparecen nuevas muestras de malware cada pocos minutos, y una base de datos de firmas desactualizada deja brechas en la protección.

## Uso

```bash
sd update [OPTIONS]
```

## Opciones

| Indicador | Corto | Predeterminado | Descripción |
|-----------|-------|----------------|-------------|
| `--check-only` | | `false` | Verificar actualizaciones disponibles sin descargar |
| `--force` | `-f` | `false` | Forzar la re-descarga de todas las firmas, ignorando la caché |
| `--source` | `-s` | todos | Actualizar solo una categoría de fuente específica: `hashes`, `yara`, `ioc`, `clamav` |
| `--full` | | `false` | Incluir conjuntos de datos grandes (más de 20M de hashes MD5 de VirusShare) |
| `--server-url` | | oficial | URL del servidor de actualización personalizado |
| `--no-verify` | | `false` | Omitir la verificación de firmas Ed25519 (no recomendado) |
| `--timeout` | `-t` | `300` | Tiempo de espera de descarga por fuente en segundos |
| `--parallel` | `-p` | `4` | Número de descargas paralelas |
| `--quiet` | `-q` | `false` | Suprimir la salida de progreso |

## Cómo Funcionan las Actualizaciones

### Flujo de Actualización

```
sd update
  1. Fetch metadata.json from update server
  2. Compare local versions with remote versions
  3. For each outdated source:
     a. Download incremental diff (or full file if no diff available)
     b. Verify Ed25519 signature
     c. Apply to local database
  4. Recompile YARA rules
  5. Update local metadata.json
```

### Actualizaciones Incrementales

PRX-SD usa actualizaciones incrementales para minimizar el ancho de banda:

| Tipo de Fuente | Método de Actualización | Tamaño Típico |
|---------------|------------------------|---------------|
| Bases de datos de hash | Delta diff (adiciones + eliminaciones) | 50-200 KB |
| Reglas YARA | Parches estilo Git | 10-50 KB |
| Feeds de IOC | Reemplazo completo (archivos pequeños) | 1-5 MB |
| ClamAV | Actualizaciones incrementales cdiff | 100-500 KB |

Cuando las actualizaciones incrementales no están disponibles (primera instalación, corrupción o `--force`), se descargan las bases de datos completas.

### Verificación de Firma Ed25519

Cada archivo descargado se verifica contra una firma Ed25519 antes de ser aplicado. Esto protege contra:

- **Manipulación** -- los archivos modificados son rechazados
- **Corrupción** -- las descargas incompletas se detectan
- **Ataques de reproducción** -- las firmas antiguas no pueden reproducirse (validación de marca de tiempo)

La clave pública de firma está integrada en el binario `sd` en tiempo de compilación.

::: warning
Nunca uses `--no-verify` en producción. La verificación de firmas existe para prevenir ataques a la cadena de suministro a través de servidores de actualización comprometidos o ataques de intermediario.
:::

## Verificar Actualizaciones

Para ver qué actualizaciones están disponibles sin descargar:

```bash
sd update --check-only
```

```
Checking for updates...
  MalwareBazaar:    update available (v2026.0321.2, +847 hashes)
  URLhaus:          up to date (v2026.0321.1)
  Feodo Tracker:    update available (v2026.0321.3, +12 hashes)
  ThreatFox:        up to date (v2026.0321.1)
  YARA Community:   update available (v2026.0320.1, +3 rules)
  IOC Feeds:        update available (v2026.0321.1, +1,204 indicators)
  ClamAV:           not configured

3 sources have updates available.
Run 'sd update' to download.
```

## Servidor de Actualización Personalizado

Para entornos sin conexión a internet o organizaciones que ejecutan un espejo privado:

```bash
sd update --server-url https://signatures.internal.corp/prx-sd
```

Establece el servidor permanentemente en `config.toml`:

```toml
[update]
server_url = "https://signatures.internal.corp/prx-sd"
interval_hours = 6
auto_update = true
```

::: tip
Usa la herramienta `prx-sd-mirror` para configurar un espejo de firmas local. Consulta la [guía de autoalojamiento](https://github.com/OpenPRX/prx-sd-signatures) para más detalles.
:::

## Alternativa con Script de Shell

Para sistemas donde `sd` no está instalado, usa el script de shell incluido:

```bash
# Standard update (hashes + YARA)
./tools/update-signatures.sh

# Full update including VirusShare
./tools/update-signatures.sh --full

# Update only hashes
./tools/update-signatures.sh --source hashes

# Update only YARA rules
./tools/update-signatures.sh --source yara
```

## Ejemplos

```bash
# Standard update
sd update

# Force full re-download of everything
sd update --force

# Update only YARA rules
sd update --source yara

# Full update with VirusShare (large download)
sd update --full

# Quiet mode for cron jobs
sd update --quiet

# Check what's available first
sd update --check-only

# Use a custom server with increased parallelism
sd update --server-url https://mirror.example.com --parallel 8
```

## Automatizar Actualizaciones

### Con sd daemon

El demonio gestiona las actualizaciones automáticamente. Configura el intervalo:

```bash
sd daemon start --update-hours 4
```

### Con cron

```bash
# Update signatures every 6 hours
0 */6 * * * /usr/local/bin/sd update --quiet 2>&1 | logger -t prx-sd
```

### Con temporizador systemd

```ini
# /etc/systemd/system/prx-sd-update.timer
[Unit]
Description=PRX-SD Signature Update Timer

[Timer]
OnCalendar=*-*-* 00/6:00:00
RandomizedDelaySec=900
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now prx-sd-update.timer
```

## Próximos Pasos

- [Fuentes de Firmas](./sources) -- detalles sobre cada fuente de inteligencia de amenazas
- [Importar Hashes](./import) -- agregar listas de bloqueo de hashes personalizadas
- [Demonio](../realtime/daemon) -- actualizaciones automáticas en segundo plano
- [Descripción General de la Inteligencia de Amenazas](./index) -- descripción general de la arquitectura de la base de datos
