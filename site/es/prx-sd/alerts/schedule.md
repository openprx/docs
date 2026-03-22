---
title: Escaneos Programados
description: "Configura trabajos de escaneo recurrentes con sd schedule para la detección automatizada de amenazas a intervalos regulares."
---

# Escaneos Programados

El comando `sd schedule` gestiona trabajos de escaneo recurrentes que se ejecutan a intervalos definidos. Los escaneos programados complementan el monitoreo en tiempo real al realizar escaneos completos periódicos de directorios especificados, detectando amenazas que pudieron haberse pasado por alto o introducido mientras el monitoreo estaba inactivo.

## Uso

```bash
sd schedule <SUBCOMMAND> [OPTIONS]
```

### Subcomandos

| Subcomando | Descripción |
|------------|-------------|
| `add` | Crear un nuevo trabajo de escaneo programado |
| `remove` | Eliminar un trabajo de escaneo programado |
| `list` | Listar todos los trabajos de escaneo programados |
| `status` | Mostrar el estado de los trabajos programados, incluida la última y próxima ejecución |
| `run` | Activar manualmente un trabajo programado de inmediato |

## Agregar un Escaneo Programado

```bash
sd schedule add <PATH> [OPTIONS]
```

| Indicador | Corto | Predeterminado | Descripción |
|-----------|-------|----------------|-------------|
| `--frequency` | `-f` | `daily` | Frecuencia de escaneo: `hourly`, `4h`, `12h`, `daily`, `weekly` |
| `--name` | `-n` | generado automáticamente | Nombre legible para este trabajo |
| `--recursive` | `-r` | `true` | Escanear directorios recursivamente |
| `--auto-quarantine` | `-q` | `false` | Poner en cuarentena las amenazas detectadas |
| `--exclude` | `-e` | | Patrones glob para excluir (repetible) |
| `--notify` | | `true` | Enviar alertas al detectar amenazas |
| `--time` | `-t` | aleatorio | Hora de inicio preferida (HH:MM, formato de 24 horas) |
| `--day` | `-d` | `monday` | Día de la semana para escaneos semanales |

### Opciones de Frecuencia

| Frecuencia | Intervalo | Caso de Uso |
|------------|-----------|-------------|
| `hourly` | Cada 60 minutos | Directorios de alto riesgo (subidas, temporales) |
| `4h` | Cada 4 horas | Directorios compartidos, raíces web |
| `12h` | Cada 12 horas | Directorios de inicio de usuario |
| `daily` | Cada 24 horas | Escaneos completos de propósito general |
| `weekly` | Cada 7 días | Archivos de bajo riesgo, verificación de copias de seguridad |

### Ejemplos

```bash
# Daily scan of home directories
sd schedule add /home --frequency daily --name "home-daily"

# Hourly scan of upload directory with auto-quarantine
sd schedule add /var/www/uploads --frequency hourly --auto-quarantine \
  --name "uploads-hourly"

# Weekly full scan excluding large media files
sd schedule add / --frequency weekly --name "full-weekly" \
  --exclude "*.iso" --exclude "*.vmdk" --exclude "/proc/*" --exclude "/sys/*"

# 4-hour scan of temp directories
sd schedule add /tmp --frequency 4h --auto-quarantine --name "tmp-4h"

# Daily scan at a specific time
sd schedule add /home --frequency daily --time 02:00 --name "home-nightly"

# Weekly scan on Sunday
sd schedule add /var/www --frequency weekly --day sunday --time 03:00 \
  --name "webroot-weekly"
```

## Listar Escaneos Programados

```bash
sd schedule list
```

```
Scheduled Scan Jobs (4)

Name              Path              Frequency  Auto-Q  Next Run
home-daily        /home             daily      no      2026-03-22 02:00
uploads-hourly    /var/www/uploads  hourly     yes     2026-03-21 11:00
tmp-4h            /tmp              4h         yes     2026-03-21 14:00
full-weekly       /                 weekly     no      2026-03-23 03:00 (Sun)
```

## Verificar el Estado de los Trabajos

```bash
sd schedule status
```

```
Scheduled Scan Status

Name              Last Run              Duration  Files    Threats  Status
home-daily        2026-03-21 02:00:12   8m 32s    45,231   0        clean
uploads-hourly    2026-03-21 10:00:05   45s       1,247    1        threats found
tmp-4h            2026-03-21 10:00:08   2m 12s    3,891    0        clean
full-weekly       2026-03-16 03:00:00   1h 22m    892,451  3        threats found
```

Obtener el estado detallado de un trabajo específico:

```bash
sd schedule status home-daily
```

```
Job: home-daily
  Path:           /home
  Frequency:      daily (every 24h)
  Preferred Time: 02:00
  Auto-Quarantine: no
  Recursive:      yes
  Excludes:       (none)

  Last Run:       2026-03-21 02:00:12 UTC
  Duration:       8 minutes 32 seconds
  Files Scanned:  45,231
  Threats Found:  0
  Result:         Clean

  Next Run:       2026-03-22 02:00 UTC
  Total Runs:     47
  Total Threats:  3 (across all runs)
```

## Eliminar Escaneos Programados

```bash
# Remove by name
sd schedule remove home-daily

# Remove all scheduled scans
sd schedule remove --all
```

## Activar un Escaneo Manualmente

Ejecuta un trabajo programado de inmediato sin esperar al próximo intervalo:

```bash
sd schedule run home-daily
```

Esto ejecuta el escaneo con todas las opciones configuradas (cuarentena, exclusiones, notificaciones) y actualiza la marca de tiempo de última ejecución del trabajo.

## Cómo Funciona la Programación

PRX-SD usa un planificador interno, no cron del sistema. El planificador se ejecuta como parte del proceso demonio:

```
sd daemon start
  └── Scheduler thread
        ├── Check job intervals every 60 seconds
        ├── Launch scan jobs when interval elapsed
        ├── Serialize results to ~/.prx-sd/schedule/
        └── Send notifications on completion
```

::: warning
Los escaneos programados solo se ejecutan cuando el demonio está activo. Si el demonio se detiene, los escaneos perdidos se ejecutarán al próximo inicio del demonio. Usa `sd daemon start` para garantizar la programación continua.
:::

## Archivo de Configuración

Los trabajos programados se persisten en `~/.prx-sd/schedule.json` y también pueden definirse en `config.toml`:

```toml
[[schedule]]
name = "home-daily"
path = "/home"
frequency = "daily"
time = "02:00"
recursive = true
auto_quarantine = false
notify = true

[[schedule]]
name = "uploads-hourly"
path = "/var/www/uploads"
frequency = "hourly"
recursive = true
auto_quarantine = true
notify = true
exclude = ["*.tmp", "*.log"]

[[schedule]]
name = "full-weekly"
path = "/"
frequency = "weekly"
day = "sunday"
time = "03:00"
recursive = true
auto_quarantine = false
notify = true
exclude = ["*.iso", "*.vmdk", "/proc/*", "/sys/*", "/dev/*"]
```

## Informes de Escaneo

Cada escaneo programado genera un informe almacenado en `~/.prx-sd/reports/`:

```bash
# View the latest report for a job
sd schedule report home-daily

# Export report as JSON
sd schedule report home-daily --json > report.json

# List all reports
sd schedule report --list
```

::: tip
Combina los escaneos programados con alertas por correo electrónico para recibir informes automáticos. Configura `scan_completed` en los eventos de correo electrónico para obtener un resumen después de cada escaneo programado.
:::

## Próximos Pasos

- [Alertas por Webhook](./webhook) -- recibir notificaciones cuando los escaneos programados detecten amenazas
- [Alertas por Correo Electrónico](./email) -- informes por correo de escaneos programados
- [Demonio](/es/prx-sd/realtime/daemon) -- requerido para la ejecución de escaneos programados
- [Respuesta a Amenazas](/es/prx-sd/remediation/) -- configurar qué ocurre cuando se detectan amenazas
