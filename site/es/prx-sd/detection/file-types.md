---
title: Tipos de Archivo Admitidos
description: "Matriz de tipos de archivo admitidos por PRX-SD. Detección de número mágico para PE, ELF, Mach-O, PDF, Office, archivos comprimidos y scripts con escaneo recursivo de archivos comprimidos."
---

# Tipos de Archivo Admitidos

PRX-SD identifica los tipos de archivo usando detección de número mágico (examinando los primeros bytes de un archivo) en lugar de depender de las extensiones de archivo. Esto garantiza una identificación precisa incluso cuando los archivos son renombrados o tienen extensiones faltantes.

## Matriz de Tipos de Archivo

La siguiente tabla muestra todos los tipos de archivo admitidos y qué capas de detección se aplican a cada uno:

| Tipo de Archivo | Extensiones | Bytes Mágicos | Hash | YARA | Heurísticas | Recursión en Archivos Comprimidos |
|----------------|-------------|---------------|------|------|-------------|----------------------------------|
| **PE (Windows)** | .exe, .dll, .sys, .scr, .ocx | `4D 5A` (MZ) | Sí | Sí | Sí | -- |
| **ELF (Linux)** | .so, .o, (sin ext) | `7F 45 4C 46` | Sí | Sí | Sí | -- |
| **Mach-O (macOS)** | .dylib, .bundle, (sin ext) | `FE ED FA CE/CF` o `CE FA ED FE/CF` | Sí | Sí | Sí | -- |
| **Binario Universal** | (sin ext) | `CA FE BA BE` | Sí | Sí | Sí | -- |
| **PDF** | .pdf | `25 50 44 46` (%PDF) | Sí | Sí | Sí | -- |
| **Office (OLE)** | .doc, .xls, .ppt | `D0 CF 11 E0` | Sí | Sí | Sí | -- |
| **Office (OOXML)** | .docx, .xlsx, .pptx | `50 4B 03 04` (ZIP) + `[Content_Types].xml` | Sí | Sí | Sí | Extraído |
| **ZIP** | .zip | `50 4B 03 04` | Sí | Sí | Limitado | Recursivo |
| **7-Zip** | .7z | `37 7A BC AF 27 1C` | Sí | Sí | Limitado | Recursivo |
| **tar** | .tar | `75 73 74 61 72` en offset 257 | Sí | Sí | Limitado | Recursivo |
| **gzip** | .gz, .tgz | `1F 8B` | Sí | Sí | Limitado | Recursivo |
| **bzip2** | .bz2 | `42 5A 68` (BZh) | Sí | Sí | Limitado | Recursivo |
| **xz** | .xz | `FD 37 7A 58 5A 00` | Sí | Sí | Limitado | Recursivo |
| **RAR** | .rar | `52 61 72 21` (Rar!) | Sí | Sí | Limitado | Recursivo |
| **CAB** | .cab | `4D 53 43 46` (MSCF) | Sí | Sí | Limitado | Recursivo |
| **ISO** | .iso | `43 44 30 30 31` en offset 32769 | Sí | Sí | Limitado | Recursivo |
| **Script shell** | .sh, .bash | `23 21` (#!) | Sí | Sí | Patrón | -- |
| **Python** | .py, .pyc | Texto / `42 0D 0D 0A` | Sí | Sí | Patrón | -- |
| **JavaScript** | .js, .mjs | Detección de texto | Sí | Sí | Patrón | -- |
| **PowerShell** | .ps1, .psm1 | Detección de texto | Sí | Sí | Patrón | -- |
| **VBScript** | .vbs, .vbe | Detección de texto | Sí | Sí | Patrón | -- |
| **Batch** | .bat, .cmd | Detección de texto | Sí | Sí | Patrón | -- |
| **Java** | .class, .jar | `CA FE BA BE` / ZIP | Sí | Sí | Limitado | .jar recursivo |
| **WebAssembly** | .wasm | `00 61 73 6D` | Sí | Sí | Limitado | -- |
| **DEX (Android)** | .dex | `64 65 78 0A` (dex\n) | Sí | Sí | Limitado | -- |
| **APK (Android)** | .apk | ZIP + `AndroidManifest.xml` | Sí | Sí | Limitado | Recursivo |

### Leyenda de Capas de Detección

| Capa | Significado |
|------|-------------|
| **Hash** | Hash SHA-256/MD5 verificado contra la base de datos de firmas |
| **YARA** | Conjunto completo de reglas YARA aplicado al contenido del archivo |
| **Heurísticas: Sí** | Análisis heurístico completo específico por tipo de archivo (ver [Heurísticas](./heuristics)) |
| **Heurísticas: Limitado** | Solo verificaciones básicas de entropía y estructura |
| **Heurísticas: Patrón** | Coincidencia de patrones basada en texto para comandos sospechosos y ofuscación |
| **Recursión en Archivos Comprimidos** | Los contenidos se extraen y cada archivo se escanea individualmente |

## Detección de Número Mágico

PRX-SD lee los primeros 8192 bytes de cada archivo para determinar su tipo. Este enfoque es más confiable que la detección basada en extensiones:

```
File: invoice.pdf.exe
Extension suggests: PDF
Magic bytes: 4D 5A → PE executable
PRX-SD identifies: PE (correct)
```

::: warning Discrepancia de Extensión
Cuando la extensión de archivo no coincide con el número mágico detectado, PRX-SD agrega una nota al informe de escaneo. Las discrepancias de extensión son una técnica común de ingeniería social (p. ej., `photo.jpg.exe`).
:::

### Prioridad de Detección Mágica

Cuando múltiples firmas podrían coincidir (p. ej., magia ZIP para .zip y .docx), PRX-SD usa inspección más profunda:

1. Leer bytes mágicos en offset 0
2. Si es ambiguo (p. ej., ZIP), inspeccionar la estructura interna
3. Para formatos basados en ZIP, verificar `[Content_Types].xml` (OOXML), `META-INF/MANIFEST.MF` (JAR), `AndroidManifest.xml` (APK)
4. Volver al tipo de contenedor genérico

## Escaneo Recursivo de Archivos Comprimidos

Cuando PRX-SD encuentra un archivo comprimido (ZIP, 7z, tar, gzip, RAR, etc.), extrae los contenidos a un directorio temporal y escanea cada archivo individualmente a través del pipeline de detección completo.

### Profundidad de Recursión

| Ajuste | Predeterminado | Descripción |
|--------|----------------|-------------|
| `max_archive_depth` | 5 | Niveles máximos de anidamiento para archivos comprimidos dentro de archivos comprimidos |
| `max_archive_files` | 10.000 | Archivos máximos a extraer de un único archivo comprimido |
| `max_archive_size_mb` | 500 | Tamaño total máximo extraído antes de detenerse |

Estos límites previenen el agotamiento de recursos por zip bombs y archivos comprimidos profundamente anidados.

```toml
# ~/.config/prx-sd/config.toml
[scanning]
max_archive_depth = 5
max_archive_files = 10000
max_archive_size_mb = 500
```

::: warning Zip Bombs
PRX-SD detecta zip bombs (archivos comprimidos con índices de compresión extremos) y detiene la extracción antes de consumir espacio en disco o memoria excesivos. La detección de una zip bomb se reporta como `SUSPICIOUS` en los resultados del escaneo.
:::

### Archivos Comprimidos Protegidos con Contraseña

PRX-SD no puede extraer archivos comprimidos protegidos con contraseña. Estos se reportan como `skipped` en los resultados del escaneo con una nota sobre el cifrado. El archivo comprimido en sí todavía se verifica contra las bases de datos de hash y YARA.

## Detección de Scripts

Para archivos de script basados en texto (shell, Python, JavaScript, PowerShell, VBScript, batch), PRX-SD aplica heurísticas basadas en patrones:

| Patrón | Puntos | Descripción |
|--------|--------|-------------|
| Cadenas ofuscadas | 10-20 | Comandos codificados en base64, concatenación de cadenas excesiva |
| Descarga + ejecución | 15-25 | `curl/wget` canalizado a `bash/sh`, `Invoke-WebRequest` + `Invoke-Expression` |
| Shell inverso | 20-30 | Patrones de shell inverso conocidos (`/dev/tcp`, `nc -e`, `bash -i`) |
| Acceso a credenciales | 10-15 | Lectura de `/etc/shadow`, almacenes de credenciales del navegador, keychain |
| Mecanismos de persistencia | 10-15 | Agregar trabajos cron, servicios systemd, claves de registro |

## Archivos No Admitidos

Los archivos que no coinciden con ningún número mágico conocido aún se verifican contra las bases de datos de hash y YARA. El análisis heurístico no se aplica a tipos de archivo desconocidos. Ejemplos comunes:

- Datos binarios sin procesar
- Formatos propietarios sin números mágicos públicos
- Archivos cifrados (a menos que se reconozca el formato contenedor)

Estos archivos aparecen como `type: unknown` en los informes de escaneo y reciben solo escaneo de hash + YARA.

## Próximos Pasos

- [Análisis Heurístico](./heuristics) -- Verificaciones heurísticas detalladas por tipo de archivo
- [Reglas YARA](./yara-rules) -- Reglas que apuntan a estructuras específicas de formato de archivo
- [Escaneo de Archivos y Directorios](../scanning/file-scan) -- Escanear archivos en la práctica
- [Descripción General del Motor de Detección](./index) -- Cómo funcionan todas las capas juntas
