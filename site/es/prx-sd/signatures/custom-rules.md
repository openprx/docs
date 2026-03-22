---
title: Reglas YARA Personalizadas
description: "Escribe, prueba e implementa reglas YARA personalizadas para PRX-SD para detectar amenazas específicas de tu entorno."
---

# Reglas YARA Personalizadas

YARA es un lenguaje de coincidencia de patrones diseñado para la detección de malware. PRX-SD soporta la carga de reglas YARA personalizadas junto con sus reglas integradas y comunitarias, lo que te permite crear lógica de detección adaptada a tu panorama de amenazas específico.

## Ubicación del Archivo de Reglas

Coloca las reglas YARA personalizadas en el directorio `~/.prx-sd/yara/`:

```
~/.prx-sd/yara/
  custom_ransomware.yar
  internal_threats.yar
  compliance_checks.yar
```

PRX-SD carga todos los archivos `.yar` y `.yara` de este directorio al inicio y durante las actualizaciones de firmas. Las reglas se compilan en una caché optimizada (`compiled.yarc`) para un escaneo rápido.

::: tip
Los subdirectorios son compatibles. Organiza las reglas por categoría para una gestión más sencilla:
```
~/.prx-sd/yara/
  ransomware/
    lockbit_variant.yar
    custom_encryptor.yar
  webshells/
    internal_webshell.yar
  compliance/
    pii_detection.yar
```
:::

## Sintaxis de Reglas YARA

Una regla YARA consta de tres secciones: **meta**, **strings** y **condition**.

### Estructura Básica de Regla

```yara
rule Detect_CustomMalware : trojan
{
    meta:
        author = "Security Team"
        description = "Detects custom trojan used in targeted attack"
        severity = "high"
        date = "2026-03-21"
        reference = "https://internal.wiki/incident-2026-042"

    strings:
        $magic = { 4D 5A 90 00 }              // PE header (hex bytes)
        $str1 = "cmd.exe /c" ascii nocase      // ASCII string, case-insensitive
        $str2 = "powershell -enc" ascii nocase
        $str3 = "C:\\Users\\Public\\payload" wide  // UTF-16 string
        $mutex = "Global\\CustomMutex_12345"
        $regex = /https?:\/\/[a-z0-9]{8,12}\.onion/ // Regex pattern

    condition:
        $magic at 0 and
        (2 of ($str*)) and
        ($mutex or $regex)
}
```

### Elementos de Sintaxis Clave

| Elemento | Sintaxis | Descripción |
|----------|---------|-------------|
| Cadenas hex | `{ 4D 5A ?? 00 }` | Patrones de bytes con comodines (`??`) |
| Cadenas de texto | `"text" ascii` | Cadenas ASCII simples |
| Cadenas anchas | `"text" wide` | Cadenas codificadas en UTF-16LE |
| Sin distinción de mayúsculas | `"text" nocase` | Coincide independientemente del caso |
| Regex | `/pattern/` | Patrones de expresión regular |
| Etiquetas | `rule Name : tag1 tag2` | Etiquetas de categorización |
| Tamaño de archivo | `filesize < 1MB` | Condición sobre el tamaño del archivo |
| Punto de entrada | `entrypoint` | Offset del punto de entrada PE/ELF |
| En offset | `$str at 0x100` | Cadena en un offset específico |
| En rango | `$str in (0..1024)` | Cadena dentro de un rango de bytes |
| Conteo | `#str > 3` | Número de ocurrencias de cadena |

### Niveles de Severidad

PRX-SD lee el campo meta `severity` para determinar la clasificación de amenazas:

| Severidad | Veredicto PRX-SD |
|-----------|-----------------|
| `critical` | MALICIOUS |
| `high` | MALICIOUS |
| `medium` | SUSPICIOUS |
| `low` | SUSPICIOUS |
| (no establecido) | SUSPICIOUS |

## Reglas de Ejemplo

### Detectar un Script Sospechoso

```yara
rule Suspicious_PowerShell_Download : script
{
    meta:
        author = "Security Team"
        description = "PowerShell script downloading and executing remote content"
        severity = "high"

    strings:
        $dl1 = "Invoke-WebRequest" ascii nocase
        $dl2 = "Net.WebClient" ascii nocase
        $dl3 = "DownloadString" ascii nocase
        $dl4 = "DownloadFile" ascii nocase
        $exec1 = "Invoke-Expression" ascii nocase
        $exec2 = "iex(" ascii nocase
        $exec3 = "Start-Process" ascii nocase
        $enc = "-EncodedCommand" ascii nocase
        $bypass = "-ExecutionPolicy Bypass" ascii nocase

    condition:
        filesize < 5MB and
        (any of ($dl*)) and
        (any of ($exec*) or $enc or $bypass)
}
```

### Detectar Mineros de Criptomonedas

```yara
rule Crypto_Miner_Strings : miner
{
    meta:
        author = "Security Team"
        description = "Detects cryptocurrency mining software"
        severity = "medium"

    strings:
        $pool1 = "stratum+tcp://" ascii
        $pool2 = "stratum+ssl://" ascii
        $pool3 = "pool.minexmr.com" ascii
        $pool4 = "xmrpool.eu" ascii
        $algo1 = "cryptonight" ascii nocase
        $algo2 = "randomx" ascii nocase
        $algo3 = "ethash" ascii nocase
        $wallet = /[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}/ ascii  // Monero address

    condition:
        (any of ($pool*)) or
        ((any of ($algo*)) and $wallet)
}
```

### Detectar Webshells

```yara
rule PHP_Webshell_Generic : webshell
{
    meta:
        author = "Security Team"
        description = "Generic PHP webshell detection"
        severity = "critical"

    strings:
        $php = "<?php" ascii nocase
        $eval1 = "eval(" ascii nocase
        $eval2 = "assert(" ascii nocase
        $eval3 = "preg_replace" ascii nocase
        $input1 = "$_GET[" ascii
        $input2 = "$_POST[" ascii
        $input3 = "$_REQUEST[" ascii
        $input4 = "$_COOKIE[" ascii
        $cmd1 = "system(" ascii nocase
        $cmd2 = "passthru(" ascii nocase
        $cmd3 = "shell_exec(" ascii nocase
        $cmd4 = "exec(" ascii nocase
        $obf1 = "base64_decode" ascii nocase
        $obf2 = "str_rot13" ascii nocase
        $obf3 = "gzinflate" ascii nocase

    condition:
        $php and
        (any of ($eval*)) and
        (any of ($input*)) and
        (any of ($cmd*) or any of ($obf*))
}
```

## Probar Reglas

Valida tus reglas antes de implementarlas:

```bash
# Compile-check a rule file (syntax validation)
sd yara validate ~/.prx-sd/yara/custom_ransomware.yar

# Test a rule against a specific file
sd yara test ~/.prx-sd/yara/custom_ransomware.yar /path/to/sample

# Test all custom rules against a directory of samples
sd yara test ~/.prx-sd/yara/ /path/to/samples/ --recursive

# Dry-run scan using only custom rules
sd scan --yara-only --yara-path ~/.prx-sd/yara/ /path/to/test
```

::: warning
Siempre prueba las nuevas reglas contra un conjunto de archivos conocidos como limpios para verificar falsos positivos antes de implementarlas en el monitoreo de producción.
:::

## Recargar Reglas

Después de agregar o modificar reglas, recarga sin reiniciar el demonio:

```bash
# Recompile and reload rules
sd yara reload

# If running as daemon, send SIGHUP
kill -HUP $(cat ~/.prx-sd/sd.pid)
```

## Contribuir Reglas

Comparte tus reglas con la comunidad de PRX-SD:

1. Haz un fork del repositorio [prx-sd-signatures](https://github.com/OpenPRX/prx-sd-signatures)
2. Agrega tu regla al directorio de categoría apropiado
3. Incluye campos `meta` completos (author, description, severity, reference)
4. Prueba tanto con muestras maliciosas como con archivos limpios
5. Envía un pull request con hashes de muestra para validación

## Próximos Pasos

- [Fuentes de Firmas](./sources) -- fuentes de reglas YARA comunitarias y de terceros
- [Importar Hashes](./import) -- agregar listas de bloqueo basadas en hash
- [Actualizar Firmas](./update) -- mantener todas las reglas al día
- [Descripción General de la Inteligencia de Amenazas](./index) -- arquitectura completa de firmas
