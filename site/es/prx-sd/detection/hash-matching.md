---
title: Coincidencia de Hash
description: "Cómo PRX-SD usa LMDB para búsquedas de hash O(1) contra bases de datos SHA-256 y MD5 de abuse.ch, VirusShare y listas de bloqueo integradas."
---

# Coincidencia de Hash

La coincidencia de hash es la primera y más rápida capa en el pipeline de detección de PRX-SD. Para cada archivo escaneado, PRX-SD calcula un hash criptográfico y lo busca en una base de datos local de hashes conocidos de malware. Una coincidencia significa que el archivo es una copia exacta, byte por byte, de una muestra de malware conocida.

## Cómo Funciona

1. **Cálculo del hash** -- PRX-SD calcula el hash SHA-256 del archivo. Para búsquedas en VirusShare, también se calcula el hash MD5.
2. **Búsqueda en LMDB** -- El hash se verifica contra la base de datos LMDB usando un árbol B+ mapeado en memoria. Esto proporciona tiempo de búsqueda promedio O(1).
3. **Recuperación de metadatos** -- Si se encuentra una coincidencia, se devuelven los metadatos asociados (fuente, familia de malware, fecha de primer avistamiento).
4. **Veredicto** -- Una coincidencia de hash produce inmediatamente un veredicto `MALICIOUS` y las capas de detección restantes se omiten.

### Rendimiento

| Operación | Tiempo |
|-----------|--------|
| Cálculo SHA-256 (archivo de 1 KB) | ~2 microsegundos |
| Cálculo SHA-256 (archivo de 10 MB) | ~15 milisegundos |
| Búsqueda en LMDB | ~0,5 microsegundos |
| Total por archivo (archivo pequeño, acierto de hash) | ~3 microsegundos |

LMDB usa archivos mapeados en memoria, por lo que la caché de páginas del sistema operativo mantiene las partes frecuentemente accedidas de la base de datos en RAM. En un sistema con suficiente memoria, las búsquedas son prácticamente gratuitas.

## Tipos de Hash Admitidos

| Tipo de Hash | Tamaño | Uso |
|-------------|--------|-----|
| **SHA-256** | 256 bits (64 caracteres hex) | Hash primario para todas las búsquedas. Usado por los feeds de abuse.ch y la lista de bloqueo integrada. |
| **MD5** | 128 bits (32 caracteres hex) | Usado para compatibilidad con la base de datos VirusShare. Se calcula solo cuando hay datos de VirusShare presentes. |

::: warning Limitaciones de MD5
MD5 está criptográficamente roto y es susceptible a ataques de colisión. PRX-SD usa MD5 solo por compatibilidad con versiones anteriores de la base de datos VirusShare. SHA-256 es el hash primario para todas las demás fuentes.
:::

## Fuentes de Datos

PRX-SD agrega firmas de hash de múltiples feeds de inteligencia de amenazas:

| Fuente | Tipo de Hash | Gratuito | Contenido | Frecuencia de Actualización |
|--------|-------------|----------|-----------|---------------------------|
| abuse.ch MalwareBazaar | SHA-256 | Sí | Muestras de malware recientes de 48h | Cada 5 minutos |
| abuse.ch URLhaus | SHA-256 | Sí | Archivos de malware de URLs maliciosas | Cada hora |
| abuse.ch Feodo Tracker | SHA-256 | Sí | Troyanos bancarios (Emotet, Dridex, TrickBot) | Cada 5 minutos |
| abuse.ch ThreatFox | SHA-256 | Sí | Plataforma de compartición de IOC comunitaria | Cada hora |
| VirusShare | MD5 | Sí | Más de 20M de hashes de malware (histórico) | Periódico |
| Lista de bloqueo integrada | SHA-256 | Incluido | EICAR, WannaCry, NotPetya, Emotet, etc. | Con lanzamientos |

### Cobertura Total de Hashes

| Modo de Actualización | Hashes | Tamaño de la Base de Datos |
|----------------------|--------|--------------------------|
| Estándar (`sd update`) | ~28.000 SHA-256 | ~5 MB |
| Completo (`sd update --full`) | ~28.000 SHA-256 + más de 20M MD5 | ~800 MB |

## Actualizar la Base de Datos de Hashes

### Actualización Estándar

Obtiene los últimos hashes SHA-256 de todos los feeds de abuse.ch:

```bash
sd update
```

Esto se ejecuta automáticamente cuando PRX-SD se instala por primera vez y puede programarse con cron o `sd service` para actualizaciones continuas.

### Actualización Completa

Incluye la base de datos completa de MD5 de VirusShare:

```bash
sd update --full
```

::: tip Cuándo Usar el Modo Completo
La base de datos de VirusShare contiene más de 20M de hashes MD5 históricos de años anteriores. Es útil para investigaciones forenses y escaneos exhaustivos, pero agrega ~800 MB a la base de datos. Para protección diaria, la actualización estándar es suficiente.
:::

### Importación Manual de Hashes

Importa listas de hashes personalizadas desde archivos de texto (un hash por línea):

```bash
sd import my_hashes.txt
```

El comando de importación detecta automáticamente el tipo de hash (SHA-256 o MD5) según la longitud de la cadena. También puedes especificar metadatos:

```bash
sd import my_hashes.txt --source "internal-ir" --family "custom-trojan"
```

## Base de Datos LMDB

PRX-SD almacena los hashes en [LMDB](http://www.lmdb.tech/doc/) (Lightning Memory-Mapped Database), elegida por sus propiedades:

| Propiedad | Beneficio |
|-----------|-----------|
| I/O mapeado en memoria | Lecturas sin copia, sin sobrecarga de serialización |
| Estructura de árbol B+ | Búsquedas amortizadas O(1) |
| Transacciones ACID | Lecturas concurrentes seguras durante actualizaciones |
| Resistente a fallos | Copia en escritura previene corrupción |
| Tamaño compacto | Almacenamiento eficiente de claves de hash |

La base de datos se almacena en `~/.local/share/prx-sd/signatures.lmdb` de forma predeterminada. La ruta puede personalizarse:

```toml
# ~/.config/prx-sd/config.toml
[database]
path = "/opt/prx-sd/signatures.lmdb"
```

## Verificar el Estado de la Base de Datos

Ver las estadísticas actuales de la base de datos de hashes:

```bash
sd info
```

```
PRX-SD Signature Database
=========================
SHA-256 hashes:  28,428
MD5 hashes:      0 (run 'sd update --full' for VirusShare)
YARA rules:      38,800
Database path:   /home/user/.local/share/prx-sd/signatures.lmdb
Database size:   4.8 MB
Last updated:    2026-03-21 10:00:00 UTC
```

## Cómo la Coincidencia de Hash Encaja en el Pipeline

La coincidencia de hash está diseñada como la primera línea de defensa porque:

- **Velocidad** -- A ~3 microsegundos por archivo, añade una sobrecarga insignificante. Se pueden verificar un millón de archivos limpios en menos de 3 segundos.
- **Cero falsos positivos** -- Una coincidencia SHA-256 es una garantía criptográfica de que el archivo es idéntico a una muestra de malware conocida.
- **Cortocircuito** -- Cuando se encuentra una coincidencia de hash, el análisis YARA y heurístico se omiten por completo, ahorrando tiempo de procesamiento significativo.

La limitación de la coincidencia de hash es que solo detecta **copias exactas** de muestras conocidas. Una modificación de un solo byte produce un hash diferente y evade esta capa. Por eso existen las capas YARA y heurísticas como defensas posteriores.

## Próximos Pasos

- [Reglas YARA](./yara-rules) -- Detección basada en patrones para variantes y familias
- [Análisis Heurístico](./heuristics) -- Detección conductual para amenazas desconocidas
- [Descripción General del Motor de Detección](./index) -- Cómo funcionan todas las capas juntas
- [Escaneo de Archivos y Directorios](../scanning/file-scan) -- Usando la coincidencia de hash en la práctica
