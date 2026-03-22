---
title: Protección contra Ransomware
description: "Detección conductual de ransomware usando análisis de entropía, monitoreo de extensiones y detección de cifrado en lote."
---

# Protección contra Ransomware

PRX-SD incluye un motor `RansomwareDetector` dedicado que identifica el comportamiento de ransomware en tiempo real. A diferencia de la detección basada en firmas que requiere muestras conocidas, el detector de ransomware usa heurísticas conductuales para detectar ransomware de día cero antes de que termine de cifrar tus archivos.

## Cómo Funciona

El detector de ransomware se ejecuta como parte del monitor en tiempo real y analiza los eventos del sistema de archivos en busca de patrones que indican un cifrado activo. Opera en tres ejes de detección:

### 1. Detección de Cifrado en Lote

El detector rastrea las tasas de modificación de archivos por proceso y por directorio. Cuando un único proceso modifica un número anormalmente alto de archivos en una ventana de tiempo corta, activa una alerta.

| Parámetro | Predeterminado | Descripción |
|-----------|----------------|-------------|
| `batch_threshold` | `20` | Número de modificaciones de archivos para activar la detección |
| `batch_window_secs` | `10` | Ventana de tiempo en segundos para el conteo en lote |
| `min_files_affected` | `5` | Archivos distintos mínimos antes de alertar |

```toml
[ransomware]
enabled = true
batch_threshold = 20
batch_window_secs = 10
min_files_affected = 5
```

### 2. Monitoreo de Cambios de Extensión

El ransomware normalmente renombra los archivos con una nueva extensión después del cifrado. El detector vigila los cambios masivos de extensión, especialmente a extensiones de ransomware conocidas:

```
.encrypted, .enc, .locked, .crypto, .crypt, .crypted,
.ransomware, .ransom, .rans, .pay, .pay2key,
.locky, .zepto, .cerber, .cerber3, .dharma, .wallet,
.onion, .wncry, .wcry, .wannacry, .petya, .notpetya,
.ryuk, .conti, .lockbit, .revil, .sodinokibi,
.maze, .egregor, .darkside, .blackmatter, .hive,
.deadbolt, .akira, .alphv, .blackcat, .royal,
.rhysida, .medusa, .bianlian, .clop, .8base
```

::: warning
El monitoreo de extensiones solo no es suficiente -- el ransomware sofisticado puede usar extensiones aleatorias o de aspecto legítimo. PRX-SD combina los cambios de extensión con el análisis de entropía para una detección confiable.
:::

### 3. Detección de Alta Entropía

Los archivos cifrados tienen una entropía de Shannon casi máxima (cercana a 8,0 para el análisis a nivel de bytes). El detector compara la entropía del archivo antes y después de la modificación:

| Métrica | Umbral | Significado |
|---------|--------|-------------|
| Entropía del archivo | > 7,8 | El contenido del archivo probablemente está cifrado o comprimido |
| Delta de entropía | > 3,0 | El archivo cambió de baja a alta entropía (cifrado) |
| Entropía del encabezado | > 7,5 | Los primeros 4 KB tienen alta entropía (bytes mágicos originales destruidos) |

Cuando la entropía de un archivo sube significativamente después de la modificación, y el archivo era previamente un tipo de documento conocido (PDF, DOCX, imagen), esto es un fuerte indicador de cifrado.

## Puntuación de Detección

Cada eje de detección contribuye a una puntuación compuesta de ransomware:

| Señal | Peso | Descripción |
|-------|------|-------------|
| Modificación de archivos en lote | 40 | Muchos archivos modificados rápidamente por un proceso |
| Cambio de extensión a extensión de ransomware conocida | 30 | Archivo renombrado con extensión de ransomware |
| Cambio de extensión a extensión desconocida | 15 | Archivo renombrado con nueva extensión inusual |
| Alto delta de entropía | 25 | La entropía del archivo aumentó dramáticamente |
| Alta entropía absoluta | 10 | El archivo tiene entropía casi máxima |
| Creación de nota de rescate | 35 | Se detectaron archivos que coinciden con patrones de notas de rescate |
| Eliminación de copias de sombra | 50 | Intento de eliminar las instantáneas de volumen |

Una puntuación compuesta superior a **60** activa un veredicto `MALICIOUS`. Las puntuaciones entre **30-59** producen una alerta `SUSPICIOUS`.

## Detección de Notas de Rescate

El detector vigila la creación de archivos que coinciden con patrones comunes de notas de rescate:

```
README_RESTORE_FILES.txt, HOW_TO_DECRYPT.txt,
DECRYPT_INSTRUCTIONS.html, YOUR_FILES_ARE_ENCRYPTED.txt,
RECOVER_YOUR_FILES.txt, !README!.txt, _readme.txt,
HELP_DECRYPT.html, RANSOM_NOTE.txt, #DECRYPT#.txt
```

::: tip
La detección de notas de rescate está basada en patrones y no requiere que el archivo de nota sea malicioso en sí mismo. La mera creación de un archivo que coincida con estos patrones, combinada con otras señales, contribuye a la puntuación de ransomware.
:::

## Respuesta Automática

Cuando se detecta ransomware, la respuesta depende de la política configurada:

| Acción | Descripción |
|--------|-------------|
| **Alerta** | Registrar el evento y enviar notificaciones (webhook, correo electrónico) |
| **Bloquear** | Denegar la operación del archivo (solo modo de bloqueo fanotify de Linux) |
| **Matar** | Terminar el proceso infractor |
| **Cuarentena** | Mover los archivos afectados al almacén de cuarentena cifrado |
| **Aislar** | Bloquear todo el acceso a la red para la máquina (emergencia) |

Configura la respuesta en `config.toml`:

```toml
[ransomware.response]
on_detection = "kill"           # alert | block | kill | quarantine | isolate
quarantine_affected = true      # quarantine modified files as evidence
notify_webhook = true           # send webhook notification
notify_email = true             # send email alert
snapshot_process_tree = true    # capture process tree for forensics
```

## Configuración

Configuración completa del detector de ransomware:

```toml
[ransomware]
enabled = true
batch_threshold = 20
batch_window_secs = 10
min_files_affected = 5
entropy_threshold = 7.8
entropy_delta_threshold = 3.0
score_threshold_malicious = 60
score_threshold_suspicious = 30

# Directories to protect with higher sensitivity
protected_dirs = [
    "~/Documents",
    "~/Pictures",
    "~/Desktop",
    "/var/www",
]

# Processes exempt from monitoring (e.g., backup software)
exempt_processes = [
    "borgbackup",
    "restic",
    "rsync",
]

[ransomware.response]
on_detection = "kill"
quarantine_affected = true
notify_webhook = true
notify_email = false
```

## Ejemplos

```bash
# Start monitoring with ransomware protection
sd monitor --auto-quarantine /home

# The ransomware detector is enabled by default in daemon mode
sd daemon start

# Check ransomware detector status
sd status --verbose
```

## Próximos Pasos

- [Monitoreo de Archivos](./monitor) -- configurar el monitoreo en tiempo real
- [Demonio](./daemon) -- ejecutar como servicio en segundo plano
- [Respuesta a Amenazas](../remediation/) -- configuración completa de la política de remediación
- [Alertas por Webhook](../alerts/webhook) -- recibir notificaciones instantáneas
