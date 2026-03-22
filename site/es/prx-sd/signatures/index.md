---
title: Descripción General de la Inteligencia de Amenazas
description: "Arquitectura de la base de datos de firmas de PRX-SD incluyendo firmas de hash, reglas YARA, feeds de IOC e integración con ClamAV."
---

# Descripción General de la Inteligencia de Amenazas

PRX-SD agrega inteligencia de amenazas de múltiples fuentes de código abierto y comunitarias en una base de datos local unificada. Este enfoque multicapa garantiza una cobertura amplia -- desde hashes de malware conocido hasta reglas de patrones conductuales e indicadores de compromiso de red.

## Categorías de Firmas

PRX-SD organiza la inteligencia de amenazas en cuatro categorías:

| Categoría | Fuentes | Cantidad | Velocidad de Búsqueda | Almacenamiento |
|-----------|---------|----------|----------------------|----------------|
| **Firmas de Hash** | 7 fuentes | Millones de SHA-256/MD5 | O(1) vía LMDB | ~500 MB |
| **Reglas YARA** | 8 fuentes | Más de 38.800 reglas | Coincidencia de patrones | ~15 MB |
| **Feeds de IOC** | 5 fuentes | Más de 585.000 indicadores | Trie / mapa hash | ~25 MB |
| **Base de Datos ClamAV** | 1 fuente | Más de 11.000.000 firmas | Motor ClamAV | ~300 MB |

### Firmas de Hash

La capa de detección más rápida. Cada archivo se hashea al escanear y se verifica contra una base de datos LMDB local que contiene hashes de archivos maliciosos conocidos:

- **abuse.ch MalwareBazaar** -- Hashes SHA-256 de muestras de malware recientes (ventana de 48h)
- **abuse.ch URLhaus** -- Hashes SHA-256 de archivos distribuidos vía URLs maliciosas
- **abuse.ch Feodo Tracker** -- Hashes SHA-256 de troyanos bancarios (Emotet, Dridex, TrickBot)
- **abuse.ch ThreatFox** -- IOCs SHA-256 de contribuciones comunitarias
- **abuse.ch SSL Blacklist** -- Huellas SHA-1 de certificados SSL maliciosos
- **VirusShare** -- Más de 20.000.000 de hashes MD5 (disponible con actualización `--full`)
- **Lista de bloqueo integrada** -- Hashes codificados para el archivo de prueba EICAR, WannaCry, NotPetya, Emotet

### Reglas YARA

Reglas de coincidencia de patrones que identifican malware por patrones de código, cadenas y estructura en lugar de hashes exactos. Esto detecta variantes y familias de malware:

- **Reglas integradas** -- 64 reglas seleccionadas para ransomware, troyanos, puertas traseras, rootkits, mineros, webshells
- **Yara-Rules/rules** -- Reglas mantenidas por la comunidad para Emotet, TrickBot, CobaltStrike, Mirai, LockBit
- **Neo23x0/signature-base** -- Reglas de alta calidad para APT29, Lazarus, minería de criptomonedas, webshells
- **ReversingLabs YARA** -- Reglas de código abierto de calidad comercial para troyanos, ransomware, puertas traseras
- **ESET IOC** -- Reglas de seguimiento de APT para Turla, Interception y otras amenazas avanzadas
- **InQuest** -- Reglas especializadas para documentos maliciosos (OLE, exploits DDE)
- **Elastic Security** -- Reglas de detección del equipo de investigación de amenazas de Elastic
- **Google GCTI** -- Reglas YARA de Google Cloud Threat Intelligence

### Feeds de IOC

Indicadores de compromiso de red para detectar conexiones a infraestructura maliciosa conocida:

- **IPsum** -- Lista de reputación de IPs maliciosas agregada (puntuación de múltiples fuentes)
- **FireHOL** -- Listas de bloqueo de IP seleccionadas en múltiples niveles de amenaza
- **Emerging Threats** -- Reglas Suricata/Snort convertidas a IOCs de IP/dominio
- **SANS ISC** -- Feeds diarios de IPs sospechosas del Internet Storm Center
- **URLhaus** -- URLs maliciosas activas para phishing y distribución de malware

### Base de Datos ClamAV

Integración opcional con la base de datos de virus ClamAV, que proporciona el conjunto de firmas de código abierto más grande:

- **main.cvd** -- Firmas de virus principales
- **daily.cvd** -- Firmas actualizadas diariamente
- **bytecode.cvd** -- Firmas de detección de bytecode

## Estructura del Directorio de Datos

Todos los datos de firmas se almacenan bajo `~/.prx-sd/signatures/`:

```
~/.prx-sd/signatures/
  hashes/
    malware_bazaar.lmdb       # MalwareBazaar SHA-256
    urlhaus.lmdb              # URLhaus SHA-256
    feodo.lmdb                # Feodo Tracker SHA-256
    threatfox.lmdb            # ThreatFox IOCs
    virusshare.lmdb           # VirusShare MD5 (--full only)
    custom.lmdb               # User-imported hashes
  yara/
    builtin/                  # Built-in rules (shipped with binary)
    community/                # Downloaded community rules
    custom/                   # User-written custom rules
    compiled.yarc             # Pre-compiled rule cache
  ioc/
    ipsum.dat                 # IPsum IP reputation
    firehol.dat               # FireHOL blocklists
    et_compromised.dat        # Emerging Threats IPs
    sans_isc.dat              # SANS ISC suspicious IPs
    urlhaus_urls.dat          # URLhaus malicious URLs
  clamav/
    main.cvd                  # ClamAV main signatures
    daily.cvd                 # ClamAV daily updates
    bytecode.cvd              # ClamAV bytecode sigs
  metadata.json               # Update timestamps and version info
```

::: tip
Usa `sd info` para ver el estado actual de todas las bases de datos de firmas, incluyendo recuentos de fuentes, tiempos de última actualización y uso de disco.
:::

## Consultar el Estado de Firmas

```bash
sd info
```

```
PRX-SD Signature Database
  Hash signatures:    1,247,832 entries (7 sources)
  YARA rules:         38,847 rules (8 sources, 64 built-in)
  IOC indicators:     585,221 entries (5 sources)
  ClamAV signatures:  not installed
  Last updated:       2026-03-21 08:00:12 UTC
  Database version:   2026.0321.1
  Disk usage:         542 MB
```

## Próximos Pasos

- [Actualizar Firmas](./update) -- mantener tus bases de datos al día
- [Fuentes de Firmas](./sources) -- información detallada sobre cada fuente
- [Importar Hashes](./import) -- agregar tus propias listas de bloqueo de hashes
- [Reglas YARA Personalizadas](./custom-rules) -- escribir e implementar reglas personalizadas
