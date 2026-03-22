---
title: Monitoreo de Archivos
description: "Monitoreo del sistema de archivos en tiempo real con sd monitor para detectar amenazas a medida que aparecen en el disco."
---

# Monitoreo de Archivos

El comando `sd monitor` vigila directorios en busca de actividad del sistema de archivos y escanea archivos nuevos o modificados en tiempo real. Esta es la forma principal de detectar malware en el momento en que aterriza en el disco, antes de que tenga la oportunidad de ejecutarse.

## Uso

```bash
sd monitor [OPTIONS] [PATHS...]
```

Si no se especifican rutas, `sd monitor` vigila el directorio de trabajo actual.

## Opciones

| Indicador | Corto | Predeterminado | Descripción |
|-----------|-------|----------------|-------------|
| `--recursive` | `-r` | `true` | Vigilar directorios de forma recursiva |
| `--block` | `-b` | `false` | Bloquear la ejecución de archivos hasta que se complete el escaneo (solo Linux) |
| `--daemon` | `-d` | `false` | Ejecutar en segundo plano como proceso demonio |
| `--pid-file` | | | Escribir PID en el archivo especificado (implica `--daemon`) |
| `--exclude` | `-e` | | Patrones glob para excluir (repetible) |
| `--log-file` | | | Escribir salida del log en archivo en lugar de stderr |
| `--auto-quarantine` | `-q` | `false` | Poner en cuarentena automáticamente las amenazas detectadas |
| `--events` | | todos | Lista de eventos a vigilar separada por comas |
| `--json` | | `false` | Mostrar eventos como líneas JSON |

## Mecanismos por Plataforma

PRX-SD usa la API de sistema de archivos más capaz disponible en cada plataforma:

| Plataforma | API | Capacidades |
|------------|-----|-------------|
| **Linux** | fanotify (kernel 5.1+) | Monitoreo a nivel del sistema, control de permisos de ejecución, transferencia de descriptor de archivo |
| **Linux (respaldo)** | inotify | Vigilantes por directorio, sin soporte de bloqueo |
| **macOS** | FSEvents | Monitoreo recursivo de baja latencia, repetición de eventos históricos |
| **Windows** | ReadDirectoryChangesW | Monitoreo asíncrono por directorio con puertos de completación |

::: tip
En Linux, `sd monitor` requiere la capacidad `CAP_SYS_ADMIN` (o root) para usar fanotify. Si no está disponible, automáticamente vuelve a inotify con una advertencia.
:::

## Eventos Monitoreados

Los siguientes eventos del sistema de archivos activan un escaneo:

| Evento | Descripción | Plataformas |
|--------|-------------|-------------|
| `Create` | Se crea un nuevo archivo | Todas |
| `Modify` | Se escriben los contenidos del archivo | Todas |
| `CloseWrite` | Archivo cerrado después de escribir (evita escaneos parciales) | Linux |
| `Delete` | Se elimina un archivo | Todas |
| `Rename` | Se renombra o mueve un archivo | Todas |
| `Open` | Se abre un archivo para lectura | Linux (fanotify) |
| `Execute` | Un archivo está a punto de ejecutarse | Linux (fanotify) |

Filtra qué eventos activan escaneos con `--events`:

```bash
# Only scan on new files and modifications
sd monitor --events Create,CloseWrite /home
```

## Modo de Bloqueo

En Linux con fanotify, `--block` habilita el modo `FAN_OPEN_EXEC_PERM`. En este modo el kernel pausa la ejecución del proceso hasta que PRX-SD devuelve un veredicto:

```bash
sudo sd monitor --block /usr/local/bin /tmp
```

::: warning
El modo de bloqueo añade latencia al inicio de cada programa en las rutas monitoreadas. Úsalo solo en directorios de alto riesgo como `/tmp` o carpetas de descarga, no en rutas de todo el sistema como `/usr` o `/lib`.
:::

Cuando se detecta una amenaza en modo de bloqueo:

1. El proceso de apertura/ejecución del archivo es **denegado** por el kernel
2. El evento se registra con veredicto `BLOCKED`
3. Si se establece `--auto-quarantine`, el archivo se mueve al almacén de cuarentena

## Modo Demonio

Usa `--daemon` para separar el monitor de la terminal:

```bash
sd monitor --daemon --pid-file /var/run/sd-monitor.pid /home /tmp /var/www
```

Detén el demonio enviando `SIGTERM`:

```bash
kill $(cat /var/run/sd-monitor.pid)
```

O usa `sd daemon stop` si se ejecuta a través del gestor de demonios. Consulta [Demonio](./daemon) para más detalles.

## Ejemplos

```bash
# Watch home and tmp directories
sd monitor /home /tmp

# Watch with automatic quarantine
sd monitor --auto-quarantine /home/downloads

# Block-mode on Linux for a sensitive directory
sudo sd monitor --block --auto-quarantine /tmp

# Exclude build artifacts and node_modules
sd monitor -e "*.o" -e "node_modules/**" /home/dev/projects

# Run as daemon with JSON logging
sd monitor --daemon --json --log-file /var/log/sd-monitor.json /home

# Monitor with specific events only
sd monitor --events Create,Modify,Rename /var/www
```

## Salida JSON

Cuando se habilita `--json`, cada evento produce una única línea JSON:

```json
{
  "timestamp": "2026-03-21T10:15:32.456Z",
  "event": "CloseWrite",
  "path": "/tmp/payload.exe",
  "verdict": "malicious",
  "threat": "Win.Trojan.Agent-123456",
  "action": "quarantined",
  "scan_ms": 12
}
```

## Próximos Pasos

- [Demonio](./daemon) -- ejecutar el monitoreo como un servicio en segundo plano gestionado
- [Protección contra Ransomware](./ransomware) -- detección especializada del comportamiento de ransomware
- [Gestión de Cuarentena](../quarantine/) -- gestionar archivos en cuarentena
- [Respuesta a Amenazas](../remediation/) -- configurar políticas de respuesta automática
