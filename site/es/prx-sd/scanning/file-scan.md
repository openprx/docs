---
title: Escaneo de Archivos y Directorios
description: "Referencia completa del comando sd scan. Escanea archivos y directorios en busca de malware con coincidencia de hash, reglas YARA y análisis heurístico."
---

# Escaneo de Archivos y Directorios

El comando `sd scan` es la forma principal de verificar archivos y directorios en busca de malware. Ejecuta cada archivo a través del pipeline de detección multicapa -- coincidencia de hash, reglas YARA y análisis heurístico -- y reporta un veredicto para cada archivo.

## Uso Básico

Escanea un único archivo:

```bash
sd scan /path/to/file
```

Escanea un directorio (no recursivo por defecto):

```bash
sd scan /home/user/downloads
```

Escanea un directorio y todos los subdirectorios:

```bash
sd scan /home --recursive
```

## Opciones del Comando

| Opción | Corta | Predeterminado | Descripción |
|--------|-------|----------------|-------------|
| `--recursive` | `-r` | desactivado | Recursar en subdirectorios |
| `--json` | `-j` | desactivado | Mostrar resultados en formato JSON |
| `--threads` | `-t` | núcleos de CPU | Número de hilos de escaneo paralelos |
| `--auto-quarantine` | `-q` | desactivado | Poner en cuarentena automáticamente las amenazas detectadas |
| `--remediate` | | desactivado | Intentar remediación automática (eliminar/cuarentena según política) |
| `--exclude` | `-e` | ninguno | Patrón glob para excluir archivos o directorios |
| `--report` | | ninguno | Escribir informe de escaneo en una ruta de archivo |
| `--max-size-mb` | | 100 | Omitir archivos más grandes que este tamaño en megabytes |
| `--no-yara` | | desactivado | Omitir el escaneo de reglas YARA |
| `--no-heuristics` | | desactivado | Omitir el análisis heurístico |
| `--min-severity` | | `suspicious` | Severidad mínima a reportar (`suspicious` o `malicious`) |

## Flujo de Detección

Cuando `sd scan` procesa un archivo, pasa por el pipeline de detección en orden:

```
File → Magic Number Detection → Determine File Type
  │
  ├─ Layer 1: SHA-256 Hash Lookup (LMDB)
  │   Hit → MALICIOUS (instant, ~1μs per file)
  │
  ├─ Layer 2: YARA-X Rule Scan (38,800+ rules)
  │   Hit → MALICIOUS with rule name
  │
  ├─ Layer 3: Heuristic Analysis (file-type-aware)
  │   Score ≥ 60 → MALICIOUS
  │   Score 30-59 → SUSPICIOUS
  │   Score < 30 → CLEAN
  │
  └─ Result Aggregation → highest severity wins
```

El pipeline aplica un cortocircuito: si se encuentra una coincidencia de hash, el análisis YARA y heurístico se omiten para ese archivo. Esto hace que escanear directorios grandes sea rápido -- la mayoría de los archivos limpios se resuelven en la capa de hash en microsegundos.

## Formatos de Salida

### Legible por Humanos (predeterminado)

```bash
sd scan /home/user/downloads --recursive
```

```
PRX-SD Scan Report
==================
Scanned: 3,421 files (1.2 GB)
Skipped: 14 files (exceeded max size)
Threats: 3 (2 malicious, 1 suspicious)

  [MALICIOUS] /home/user/downloads/invoice.exe
    Layer:   Hash match (SHA-256)
    Source:  MalwareBazaar
    Family:  Emotet
    SHA-256: e3b0c44298fc1c149afbf4c8996fb924...

  [MALICIOUS] /home/user/downloads/patch.scr
    Layer:   YARA rule
    Rule:    win_ransomware_lockbit3
    Source:  ReversingLabs

  [SUSPICIOUS] /home/user/downloads/updater.bin
    Layer:   Heuristic analysis
    Score:   42/100
    Findings:
      - High section entropy: 7.91 (packed)
      - Suspicious API imports: VirtualAllocEx, WriteProcessMemory
      - Non-standard PE timestamp

Duration: 5.8s (589 files/s)
```

### Salida JSON

```bash
sd scan /path --recursive --json
```

```json
{
  "scan_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2026-03-21T14:30:00Z",
  "files_scanned": 3421,
  "files_skipped": 14,
  "total_bytes": 1288490188,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
      "md5": "d41d8cd98f00b204e9800998ecf8427e"
    }
  ],
  "duration_ms": 5800,
  "throughput_files_per_sec": 589
}
```

### Archivo de Informe

Escribe los resultados en un archivo para archivarlos:

```bash
sd scan /srv/web --recursive --report /var/log/prx-sd/scan-report.json
```

## Patrones de Exclusión

Usa `--exclude` para omitir archivos o directorios que coincidan con patrones glob. Se pueden especificar múltiples patrones:

```bash
sd scan /home --recursive \
  --exclude "*.log" \
  --exclude "node_modules/**" \
  --exclude ".git/**" \
  --exclude "/home/user/VMs/**"
```

::: tip Rendimiento
Excluir directorios grandes como `node_modules`, `.git` e imágenes de máquinas virtuales mejora significativamente la velocidad de escaneo.
:::

## Cuarentena Automática

El indicador `--auto-quarantine` mueve las amenazas detectadas al almacén de cuarentena durante el escaneo:

```bash
sd scan /tmp --recursive --auto-quarantine
```

```
[MALICIOUS] /tmp/dropper.exe → Quarantined (QR-20260321-007)
```

Los archivos en cuarentena se cifran con AES-256 y se almacenan en `~/.local/share/prx-sd/quarantine/`. No pueden ejecutarse accidentalmente. Consulta la [documentación de Cuarentena](../quarantine/) para más detalles.

## Escenarios de Ejemplo

### Escaneo en Pipeline CI/CD

Escanea artefactos de compilación antes del despliegue:

```bash
sd scan ./dist --recursive --json --min-severity suspicious
```

Usa el código de salida para automatización: `0` = limpio, `1` = amenazas encontradas, `2` = error de escaneo.

### Escaneo Diario del Servidor Web

Programa un escaneo nocturno de los directorios accesibles desde la web:

```bash
sd scan /var/www /srv/uploads --recursive \
  --auto-quarantine \
  --report /var/log/prx-sd/daily-$(date +%Y%m%d).json \
  --exclude "*.log"
```

### Investigación Forense

Escanea una imagen de disco montada en modo de solo lectura:

```bash
sudo mount -o ro /dev/sdb1 /mnt/evidence
sd scan /mnt/evidence --recursive --json --threads 1 --max-size-mb 500
```

::: warning Escaneos Grandes
Al escanear millones de archivos, usa `--threads` para controlar el uso de recursos y `--max-size-mb` para omitir archivos de gran tamaño que puedan ralentizar el escaneo.
:::

### Verificación Rápida del Directorio de Inicio

Escaneo rápido de las ubicaciones comunes de amenazas:

```bash
sd scan ~/Downloads ~/Desktop /tmp --recursive
```

## Ajuste de Rendimiento

| Archivos | Tiempo Aproximado | Notas |
|---------|-------------------|-------|
| 1.000 | < 1 segundo | La capa de hash resuelve la mayoría de los archivos |
| 10.000 | 2-5 segundos | Las reglas YARA añaden ~0,3 ms por archivo |
| 100.000 | 20-60 segundos | Depende del tamaño y tipo de archivos |
| 1.000.000+ | 5-15 minutos | Usa `--threads` y `--exclude` |

Factores que afectan la velocidad de escaneo:

- **I/O de disco** -- SSD es 5-10x más rápido que HDD para lecturas aleatorias
- **Distribución del tamaño de archivos** -- Muchos archivos pequeños son más rápidos que pocos archivos grandes
- **Capas de detección** -- Los escaneos solo de hash (`--no-yara --no-heuristics`) son los más rápidos
- **Número de hilos** -- Más hilos ayudan en sistemas multinúcleo con almacenamiento rápido

## Próximos Pasos

- [Escaneo de Memoria](./memory-scan) -- Escanear la memoria de procesos en ejecución
- [Detección de Rootkits](./rootkit) -- Verificar amenazas a nivel de kernel
- [Escaneo USB](./usb-scan) -- Escanear medios extraíbles
- [Motor de Detección](../detection/) -- Cómo funciona cada capa de detección
