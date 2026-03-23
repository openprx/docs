---
title: Descripción General de la Configuración
description: "Comprende cómo funciona la configuración de PRX-SD, dónde se almacenan los archivos de configuración y cómo ver, modificar y restablecer ajustes usando el comando sd config."
---

# Descripción General de la Configuración

PRX-SD almacena toda la configuración en un único archivo JSON en `~/.prx-sd/config.json`. Este archivo se crea automáticamente en el primer inicio con valores predeterminados razonables. Puedes ver, modificar y restablecer la configuración usando el comando `sd config` o editando el archivo JSON directamente.

## Ubicación del Archivo de Configuración

| Plataforma | Ruta Predeterminada |
|------------|---------------------|
| Linux / macOS | `~/.prx-sd/config.json` |
| Windows | `%USERPROFILE%\.prx-sd\config.json` |
| Personalizado | `--data-dir /path/to/dir` (indicador CLI global) |

El indicador global `--data-dir` anula la ubicación predeterminada. Cuando se establece, el archivo de configuración se lee desde `<data-dir>/config.json`.

```bash
# Use a custom data directory
sd --data-dir /opt/prx-sd config show
```

## El Comando `sd config`

### Mostrar la Configuración Actual

Muestra todos los ajustes actuales, incluyendo la ruta del archivo de configuración:

```bash
sd config show
```

Salida:

```
Current Configuration
  File: /home/user/.prx-sd/config.json

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
  "update_server_url": null,
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

### Establecer un Valor de Configuración

Establece cualquier clave de configuración usando notación con puntos. Los valores se analizan automáticamente como el tipo JSON apropiado (booleano, entero, flotante, array, objeto o cadena).

```bash
sd config set <key> <value>
```

Ejemplos:

```bash
# Set maximum file size to 200 MiB
sd config set scan.max_file_size 209715200

# Set scan threads to 8
sd config set scan.threads 8

# Enable auto-quarantine
sd config set quarantine.auto_quarantine true

# Set heuristic threshold to 50 (more sensitive)
sd config set scan.heuristic_threshold 50

# Add exclude paths as a JSON array
sd config set scan.exclude_paths '["*.log", "/proc", "/sys"]'

# Change the update server URL
sd config set update_server_url "https://custom-update.example.com/v1"
```

Salida:

```
OK Set scan.max_file_size = 209715200 (was 104857600)
```

::: tip
Las claves anidadas usan notación con puntos. Por ejemplo, `scan.max_file_size` navega dentro del objeto `scan` y establece el campo `max_file_size`. Los objetos intermedios se crean automáticamente si no existen.
:::

### Restablecer a Valores Predeterminados

Restaura toda la configuración a los valores de fábrica:

```bash
sd config reset
```

Salida:

```
OK Configuration reset to defaults.
```

::: warning
Restablecer la configuración no elimina las bases de datos de firmas, las reglas YARA ni los archivos en cuarentena. Solo restablece el archivo `config.json` a los valores predeterminados.
:::

## Categorías de Configuración

La configuración está organizada en cuatro secciones principales:

| Sección | Propósito |
|---------|-----------|
| `scan.*` | Comportamiento del escaneo de archivos: límites de tamaño de archivo, hilos, tiempos de espera, archivos comprimidos, heurísticas |
| `monitor.*` | Monitoreo en tiempo real: modo de bloqueo, capacidad del canal de eventos |
| `quarantine.*` | Almacén de cuarentena: cuarentena automática, tamaño máximo del almacén |
| `update_server_url` | Endpoint del servidor de actualización de firmas |

Para una referencia completa de cada clave de configuración, su tipo, valor predeterminado y descripción, consulta la [Referencia de Configuración](./reference).

## Configuración Predeterminada

En el primer inicio, PRX-SD genera la siguiente configuración predeterminada:

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
  "update_server_url": null,
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

Valores predeterminados clave:

- **Tamaño máximo de archivo:** 100 MiB (los archivos más grandes se omiten)
- **Hilos:** `null` (detección automática según el número de CPUs)
- **Tiempo de espera:** 30 segundos por archivo
- **Archivos comprimidos:** Escaneados, hasta 3 niveles de anidamiento
- **Umbral heurístico:** 60 (puntuación 60+ = malicioso, 30-59 = sospechoso)
- **Modo de bloqueo:** Deshabilitado (el monitor reporta pero no bloquea el acceso a archivos)
- **Cuarentena automática:** Deshabilitada (las amenazas se reportan pero no se mueven)
- **Límite de tamaño del almacén:** 1024 MiB

## Editar el Archivo de Configuración Directamente

También puedes editar `~/.prx-sd/config.json` con cualquier editor de texto. PRX-SD lee el archivo al inicio de cada comando, por lo que los cambios surten efecto inmediatamente.

```bash
# Open in your editor
$EDITOR ~/.prx-sd/config.json
```

Asegúrate de que el archivo sea JSON válido. Si está malformado, PRX-SD vuelve a los valores predeterminados y muestra una advertencia.

## Estructura del Directorio de Datos

```
~/.prx-sd/
  config.json       # Engine configuration
  signatures/       # LMDB hash signature database
  yara/             # Compiled YARA rule files
  quarantine/       # AES-256-GCM encrypted quarantine vault
  adblock/          # Adblock filter lists and logs
  plugins/          # WASM plugin directories
  audit/            # Scan audit logs (JSONL)
  prx-sd.pid        # Daemon PID file (when running)
```

## Próximos Pasos

- Consulta la [Referencia de Configuración](./reference) para cada clave, tipo y valor predeterminado
- Aprende sobre el [Escaneo](../scanning/file-scan) para entender cómo la configuración afecta los escaneos
- Configura el [Monitoreo en Tiempo Real](../realtime/) y ajusta `monitor.block_mode`
- Configura el comportamiento de cuarentena automática en [Cuarentena](../quarantine/)
