---
title: Referencia de Configuración
description: "Referencia completa de cada clave de configuración de PRX-SD, incluyendo tipos, valores predeterminados y descripciones detalladas."
---

# Referencia de Configuración

Esta página documenta cada clave de configuración en `~/.prx-sd/config.json`. Usa `sd config set <key> <value>` para modificar cualquier ajuste, o edita el archivo JSON directamente.

## Ajustes de Escaneo (`scan.*`)

Ajustes que controlan cómo el motor de escaneo procesa los archivos.

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `scan.max_file_size` | `integer` | `104857600` (100 MiB) | Tamaño máximo de archivo en bytes. Los archivos más grandes que este valor se omiten durante el escaneo. Establece en `0` para deshabilitar el límite (no recomendado). |
| `scan.threads` | `integer \| null` | `null` (automático) | Número de hilos de escaneo paralelos. Cuando es `null`, PRX-SD usa el número de núcleos lógicos de CPU. Establece un número específico para limitar o aumentar el paralelismo. |
| `scan.timeout_per_file_ms` | `integer` | `30000` (30 s) | Tiempo máximo en milisegundos permitido para escanear un único archivo. Si se supera, el archivo se marca como error y el escaneo continúa con el siguiente archivo. |
| `scan.scan_archives` | `boolean` | `true` | Si se deben explorar archivos comprimidos (ZIP, tar.gz, 7z, RAR, etc.) y escanear su contenido. |
| `scan.max_archive_depth` | `integer` | `3` | Profundidad máxima de anidamiento al explorar archivos comprimidos. Por ejemplo, un ZIP dentro de un ZIP dentro de un ZIP requeriría profundidad 3. Previene ataques de zip-bomb. |
| `scan.heuristic_threshold` | `integer` | `60` | Puntuación heurística mínima (0-100) para marcar un archivo como **Malicioso**. Los archivos con puntuación entre 30 y este umbral se marcan como **Sospechosos**. Los valores más bajos aumentan la sensibilidad pero pueden producir más falsos positivos. |
| `scan.exclude_paths` | `string[]` | `[]` | Lista de patrones glob o prefijos de ruta para excluir del escaneo. Admite comodines `*` (cualquier carácter) y `?` (carácter único). |

### Ejemplos

```bash
# Increase max file size to 500 MiB
sd config set scan.max_file_size 524288000

# Use exactly 4 threads
sd config set scan.threads 4

# Increase per-file timeout to 60 seconds
sd config set scan.timeout_per_file_ms 60000

# Disable archive scanning
sd config set scan.scan_archives false

# Set archive nesting depth to 5
sd config set scan.max_archive_depth 5

# Lower heuristic threshold for higher sensitivity
sd config set scan.heuristic_threshold 40

# Exclude paths
sd config set scan.exclude_paths '["/proc", "/sys", "/dev", "*.log", "*.tmp"]'
```

## Ajustes del Monitor (`monitor.*`)

Ajustes que controlan el monitoreo del sistema de archivos en tiempo real (`sd monitor` y `sd daemon`).

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `monitor.block_mode` | `boolean` | `false` | Cuando es `true`, usa eventos de permiso fanotify (solo Linux) para **bloquear** el acceso a archivos maliciosos antes de que el proceso solicitante pueda leerlos. Requiere privilegios de root. Cuando es `false`, los archivos se escanean después de su creación/modificación y las amenazas se reportan pero no se bloquean. |
| `monitor.channel_capacity` | `integer` | `4096` | Tamaño del buffer del canal de eventos interno entre el vigilante del sistema de archivos y el escáner. Aumenta esto si ves advertencias de "channel full" bajo alta actividad del sistema de archivos. |

### Ejemplos

```bash
# Enable block mode (requires root)
sd config set monitor.block_mode true

# Increase channel buffer for busy servers
sd config set monitor.channel_capacity 16384
```

::: warning
El modo de bloqueo (`monitor.block_mode = true`) usa eventos de permiso fanotify de Linux. Esto requiere:
- Privilegios de root
- Un kernel Linux con `CONFIG_FANOTIFY_ACCESS_PERMISSIONS` habilitado
- El demonio PRX-SD ejecutándose como root

En macOS y Windows, el modo de bloqueo no está disponible y este ajuste se ignora.
:::

## Ajustes de Actualización

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `update_server_url` | `string` | `"https://update.prx-sd.dev/v1"` | URL del servidor de actualización de firmas. El motor obtiene `<url>/manifest.json` para verificar actualizaciones. Anula esto para usar un espejo privado o un servidor de actualización sin conexión a internet. |

### Ejemplos

```bash
# Use a private mirror
sd config set update_server_url "https://internal-mirror.example.com/prx-sd/v1"

# Reset to official server
sd config set update_server_url "https://update.prx-sd.dev/v1"
```

## Ajustes de Cuarentena (`quarantine.*`)

Ajustes que controlan el almacén de cuarentena cifrado.

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `quarantine.auto_quarantine` | `boolean` | `false` | Cuando es `true`, mueve automáticamente los archivos detectados como **Maliciosos** al almacén de cuarentena durante el escaneo. Cuando es `false`, las amenazas se reportan pero los archivos permanecen en su lugar. |
| `quarantine.max_vault_size_mb` | `integer` | `1024` (1 GiB) | Tamaño total máximo del almacén de cuarentena en MiB. Cuando se alcanza este límite, no se pueden poner nuevos archivos en cuarentena hasta que se eliminen entradas más antiguas. |

### Ejemplos

```bash
# Enable automatic quarantine
sd config set quarantine.auto_quarantine true

# Increase vault size to 5 GiB
sd config set quarantine.max_vault_size_mb 5120

# Disable auto-quarantine (report only)
sd config set quarantine.auto_quarantine false
```

## Configuración Predeterminada Completa

Como referencia, aquí está la configuración predeterminada completa:

```json
{
  "scan": {
    "max_file_size": 104857600,
    "threads": null,
    "timeout_per_file_ms": 30000,
    "scan_archives": true,
    "max_archive_depth": 3,
    "heuristic_threshold": 60,
    "exclude_paths": []
  },
  "monitor": {
    "block_mode": false,
    "channel_capacity": 4096
  },
  "update_server_url": "https://update.prx-sd.dev/v1",
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

## Reglas de Análisis de Valores

Al usar `sd config set`, los valores se analizan automáticamente en este orden:

1. **Booleano** -- `true` o `false`
2. **Nulo** -- `null`
3. **Entero** -- p. ej. `42`, `104857600`
4. **Flotante** -- p. ej. `3.14`
5. **Array/objeto JSON** -- p. ej. `'["/proc", "*.log"]'`, `'{"key": "value"}'`
6. **Cadena** -- cualquier otra cosa, p. ej. `"https://example.com"`

::: tip
Al establecer arrays u objetos, envuelve el valor entre comillas simples para evitar la expansión del shell:
```bash
sd config set scan.exclude_paths '["*.log", "/proc", "/sys"]'
```
:::

## Comandos Relacionados

| Comando | Descripción |
|---------|-------------|
| `sd config show` | Mostrar la configuración actual |
| `sd config set <key> <value>` | Establecer un valor de configuración |
| `sd config reset` | Restablecer todos los ajustes a los valores predeterminados |
| `sd policy show` | Mostrar la política de remediación |
| `sd policy set <key> <value>` | Establecer un valor de política de remediación |
| `sd policy reset` | Restablecer la política de remediación a los valores predeterminados |

## Próximos Pasos

- Vuelve a la [Descripción General de Configuración](./index) para una introducción general
- Aprende cómo los ajustes `scan.*` afectan el [Escaneo de Archivos](../scanning/file-scan)
- Configura el [Monitoreo en Tiempo Real](../realtime/) con los ajustes `monitor.*`
- Configura la [Cuarentena](../quarantine/) con cuarentena automática
