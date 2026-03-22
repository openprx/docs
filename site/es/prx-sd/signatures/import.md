---
title: Importar Hashes
description: "Importa listas de bloqueo de hashes personalizadas y bases de datos de firmas ClamAV en PRX-SD."
---

# Importar Hashes

PRX-SD te permite importar listas de bloqueo de hashes personalizadas y bases de datos de firmas ClamAV para extender la cobertura de detección con tu propia inteligencia de amenazas o listas de bloqueo organizacionales.

## Importar Hashes Personalizados

### Uso

```bash
sd import [OPTIONS] <FILE>
```

### Opciones

| Indicador | Corto | Predeterminado | Descripción |
|-----------|-------|----------------|-------------|
| `--format` | `-f` | detección automática | Formato de hash: `sha256`, `sha1`, `md5`, `auto` |
| `--label` | `-l` | nombre de archivo | Etiqueta para el conjunto importado |
| `--replace` | | `false` | Reemplazar entradas existentes con la misma etiqueta |
| `--dry-run` | | `false` | Validar archivo sin importar |
| `--quiet` | `-q` | `false` | Suprimir salida de progreso |

### Formatos de Archivo de Hash Admitidos

PRX-SD acepta varios formatos comunes:

**Lista simple** -- un hash por línea:

```
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

**Hash con etiqueta** -- hash seguido de un espacio y descripción opcional:

```
e3b0c44298fc1c149afbf4c8996fb924  empty_file
d7a8fbb307d7809469ca9abcb0082e4f  known_malware_sample
```

**Formato CSV** -- separado por comas con encabezados:

```csv
hash,family,source
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855,Emotet,internal
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592,TrickBot,partner
```

**Líneas de comentario** -- las líneas que comienzan con `#` se ignoran:

```
# Custom blocklist - updated 2026-03-21
# Source: internal threat hunting team
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

::: tip
El formato de hash se detecta automáticamente según la longitud: 32 caracteres = MD5, 40 caracteres = SHA-1, 64 caracteres = SHA-256. Usa `--format` para anular si la detección falla.
:::

### Ejemplos de Importación

```bash
# Import a SHA-256 blocklist
sd import threat_hashes.txt

# Import with explicit format and label
sd import --format md5 --label "partner-feed-2026Q1" partner_hashes.txt

# Dry run to validate file
sd import --dry-run suspicious_hashes.csv

# Replace an existing import set
sd import --replace --label "daily-feed" today_hashes.txt
```

### Salida de Importación

```
Importing hashes from threat_hashes.txt...
  Format:    SHA-256 (auto-detected)
  Label:     threat_hashes
  Total:     1,247 lines
  Valid:     1,203 hashes
  Skipped:   44 (duplicates: 38, invalid: 6)
  Imported:  1,203 new entries
  Database:  ~/.prx-sd/signatures/hashes/custom.lmdb
```

## Importar Bases de Datos ClamAV

### Uso

```bash
sd import-clamav [OPTIONS] <FILE>
```

### Opciones

| Indicador | Corto | Predeterminado | Descripción |
|-----------|-------|----------------|-------------|
| `--type` | `-t` | detección automática | Tipo de base de datos: `cvd`, `cld`, `hdb`, `hsb`, `auto` |
| `--quiet` | `-q` | `false` | Suprimir salida de progreso |

### Formatos ClamAV Admitidos

| Formato | Extensión | Descripción |
|---------|-----------|-------------|
| **CVD** | `.cvd` | Base de Datos de Virus ClamAV (comprimida, firmada) |
| **CLD** | `.cld` | Base de Datos Local ClamAV (actualizaciones incrementales) |
| **HDB** | `.hdb` | Base de datos de hashes MD5 (texto plano) |
| **HSB** | `.hsb` | Base de datos de hashes SHA-256 (texto plano) |
| **NDB** | `.ndb` | Formato de firma extendido (basado en cuerpo) |

::: warning
Los archivos CVD/CLD pueden ser muy grandes. El archivo `main.cvd` solo contiene más de 6 millones de firmas y requiere aproximadamente 300 MB de espacio en disco después de la importación.
:::

### Ejemplos de Importación de ClamAV

```bash
# Import the main ClamAV database
sd import-clamav /var/lib/clamav/main.cvd

# Import the daily update database
sd import-clamav /var/lib/clamav/daily.cvd

# Import a plain-text hash database
sd import-clamav custom_sigs.hdb

# Import an SHA-256 hash database
sd import-clamav my_hashes.hsb
```

### Configurar la Integración con ClamAV

Para usar firmas ClamAV con PRX-SD:

1. Instala freshclam (actualizador de ClamAV):

```bash
# Debian/Ubuntu
sudo apt install clamav

# macOS
brew install clamav

# Fedora/RHEL
sudo dnf install clamav-update
```

2. Descarga las bases de datos:

```bash
sudo freshclam
```

3. Importa en PRX-SD:

```bash
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

4. Habilita ClamAV en la configuración:

```toml
[signatures.sources]
clamav = true
```

## Gestionar Hashes Importados

Ver los conjuntos de hashes importados:

```bash
sd info --imports
```

```
Custom Hash Imports:
  threat_hashes       1,203 SHA-256  imported 2026-03-21
  partner-feed-2026Q1   847 MD5      imported 2026-03-15
  daily-feed          2,401 SHA-256  imported 2026-03-21

ClamAV Imports:
  main.cvd            6,234,109 sigs  imported 2026-03-20
  daily.cvd           1,847,322 sigs  imported 2026-03-21
```

Eliminar un conjunto importado:

```bash
sd import --remove --label "partner-feed-2026Q1"
```

## Próximos Pasos

- [Reglas YARA Personalizadas](./custom-rules) -- escribir reglas de detección basadas en patrones
- [Fuentes de Firmas](./sources) -- todas las fuentes de inteligencia de amenazas disponibles
- [Actualizar Firmas](./update) -- mantener las bases de datos al día
- [Descripción General de la Inteligencia de Amenazas](./index) -- arquitectura de la base de datos
