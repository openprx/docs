---
title: Gestión de Cuarentena
description: "Gestiona las amenazas en cuarentena con almacén cifrado AES-256-GCM, restaura archivos y revisa las estadísticas de cuarentena."
---

# Gestión de Cuarentena

Cuando PRX-SD detecta una amenaza, puede aislar el archivo en un almacén de cuarentena cifrado. Los archivos en cuarentena se cifran con AES-256-GCM, se renombran y se mueven a un directorio seguro donde no pueden ejecutarse accidentalmente. Se preservan todos los metadatos originales para análisis forense.

## Cómo Funciona la Cuarentena

```
Threat detected
  1. Generate random AES-256-GCM key
  2. Encrypt file contents
  3. Store encrypted blob in vault.bin
  4. Save metadata (original path, hash, detection info) as JSON
  5. Delete original file from disk
  6. Log quarantine event
```

El almacén de cuarentena se almacena en `~/.prx-sd/quarantine/`:

```
~/.prx-sd/quarantine/
  vault.bin                    # Encrypted file store (append-only)
  index.json                   # Quarantine index with metadata
  entries/
    a1b2c3d4.json             # Per-entry metadata
    e5f6g7h8.json
```

Cada entrada de cuarentena contiene:

```json
{
  "id": "a1b2c3d4",
  "original_path": "/tmp/payload.exe",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
  "file_size": 245760,
  "detection": {
    "engine": "yara",
    "rule": "Win_Trojan_AgentTesla",
    "severity": "malicious"
  },
  "quarantined_at": "2026-03-21T10:15:32Z",
  "vault_offset": 1048576,
  "vault_length": 245792
}
```

::: tip
El almacén de cuarentena usa cifrado autenticado (AES-256-GCM). Esto previene tanto la ejecución accidental del malware en cuarentena como la manipulación de evidencias.
:::

## Listar Archivos en Cuarentena

```bash
sd quarantine list [OPTIONS]
```

| Indicador | Corto | Predeterminado | Descripción |
|-----------|-------|----------------|-------------|
| `--json` | | `false` | Mostrar como JSON |
| `--sort` | `-s` | `date` | Ordenar por: `date`, `name`, `size`, `severity` |
| `--filter` | `-f` | | Filtrar por severidad: `malicious`, `suspicious` |
| `--limit` | `-n` | todos | Número máximo de entradas a mostrar |

### Ejemplo

```bash
sd quarantine list
```

```
Quarantine Vault (4 entries, 1.2 MB)

ID        Date                 Size     Severity   Detection              Original Path
a1b2c3d4  2026-03-21 10:15:32  240 KB   malicious  Win_Trojan_AgentTesla  /tmp/payload.exe
e5f6g7h8  2026-03-20 14:22:01  512 KB   malicious  Ransom_LockBit3       /home/user/doc.pdf.lockbit
c9d0e1f2  2026-03-19 09:45:18  32 KB    suspicious  Suspicious_Script     /var/www/upload/shell.php
b3a4c5d6  2026-03-18 16:30:55  384 KB   malicious  SHA256_Match          /tmp/dropper.bin
```

## Restaurar Archivos

Restaura un archivo en cuarentena a su ubicación original o a una ruta especificada:

```bash
sd quarantine restore <ID> [OPTIONS]
```

| Indicador | Corto | Predeterminado | Descripción |
|-----------|-------|----------------|-------------|
| `--to` | `-t` | ruta original | Restaurar a una ubicación diferente |
| `--force` | `-f` | `false` | Sobrescribir si el destino existe |

::: warning
Restaurar un archivo en cuarentena coloca un archivo conocido como malicioso o sospechoso de vuelta en el disco. Solo restaura archivos si los has confirmado como falsos positivos o los necesitas para análisis en un entorno aislado.
:::

### Ejemplos

```bash
# Restore to original location
sd quarantine restore a1b2c3d4

# Restore to a specific directory for analysis
sd quarantine restore a1b2c3d4 --to /tmp/analysis/

# Force overwrite if file exists at destination
sd quarantine restore a1b2c3d4 --to /tmp/analysis/ --force
```

## Eliminar Archivos en Cuarentena

Elimina permanentemente las entradas de cuarentena:

```bash
# Delete a single entry
sd quarantine delete <ID>

# Delete all entries
sd quarantine delete-all

# Delete entries older than 30 days
sd quarantine delete --older-than 30d

# Delete all entries with a specific severity
sd quarantine delete --filter malicious
```

Al eliminar, los datos cifrados se sobrescriben con ceros antes de ser eliminados del almacén.

::: warning
La eliminación es permanente. Los datos del archivo cifrado y los metadatos son irrecuperables después de la eliminación. Considera exportar las entradas para archivarlas antes de eliminar.
:::

## Estadísticas de Cuarentena

Ver estadísticas agregadas sobre el almacén de cuarentena:

```bash
sd quarantine stats
```

```
Quarantine Statistics
  Total entries:       47
  Total size:          28.4 MB (encrypted)
  Oldest entry:        2026-02-15
  Newest entry:        2026-03-21

  By severity:
    Malicious:         31 (65.9%)
    Suspicious:        16 (34.1%)

  By detection engine:
    YARA rules:        22 (46.8%)
    Hash match:        15 (31.9%)
    Heuristic:          7 (14.9%)
    Ransomware:         3 (6.4%)

  Top detections:
    Win_Trojan_Agent    8 entries
    Ransom_LockBit3     5 entries
    SHA256_Match        5 entries
    Suspicious_Script   4 entries
```

## Cuarentena Automática

Habilita la cuarentena automática durante escaneos o monitoreo:

```bash
# Scan with auto-quarantine
sd scan /tmp --auto-quarantine

# Monitor with auto-quarantine
sd monitor --auto-quarantine /home /tmp

# Daemon with auto-quarantine
sd daemon start --auto-quarantine
```

O establécelo como política predeterminada:

```toml
[policy]
on_malicious = "quarantine"
on_suspicious = "report"
```

## Exportar Datos de Cuarentena

Exporta metadatos de cuarentena para informes o integración con SIEM:

```bash
# Export all metadata as JSON
sd quarantine list --json > quarantine_report.json

# Export statistics as JSON
sd quarantine stats --json > quarantine_stats.json
```

## Próximos Pasos

- [Respuesta a Amenazas](../remediation/) -- configurar políticas de respuesta más allá de la cuarentena
- [Monitoreo de Archivos](../realtime/monitor) -- protección en tiempo real con cuarentena automática
- [Alertas por Webhook](../alerts/webhook) -- recibir notificaciones cuando los archivos se ponen en cuarentena
- [Inteligencia de Amenazas](../signatures/) -- descripción general de la base de datos de firmas
