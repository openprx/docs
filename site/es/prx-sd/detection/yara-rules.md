---
title: Reglas YARA
description: "PRX-SD usa YARA-X para escanear archivos contra más de 38.800 reglas de 8 fuentes incluyendo repositorios comunitarios, conjuntos de reglas de calidad comercial y 64 reglas integradas."
---

# Reglas YARA

Las reglas YARA son la segunda capa en el pipeline de detección de PRX-SD. Mientras que la coincidencia de hash detecta copias exactas de malware conocido, las reglas YARA detectan **familias**, **variantes** y **patrones de comportamiento** de malware haciendo coincidir secuencias de bytes, cadenas y condiciones estructurales dentro de los archivos.

PRX-SD incluye más de 38.800 reglas YARA agregadas de 8 fuentes y usa el motor **YARA-X** -- la reescritura en Rust de nueva generación de YARA que proporciona mayor rendimiento, seguridad y compatibilidad.

## Motor YARA-X

PRX-SD usa [YARA-X](https://github.com/VirusTotal/yara-x) en lugar de la biblioteca YARA tradicional basada en C. Ventajas clave:

| Característica | YARA (C) | YARA-X (Rust) |
|---------------|----------|---------------|
| Lenguaje | C | Rust (memoria segura) |
| Rendimiento | Bueno | 2-5x más rápido en conjuntos grandes de reglas |
| Compatibilidad de reglas | Línea base | Compatibilidad total con versiones anteriores + nuevas características |
| Seguridad de hilos | Requiere manejo cuidadoso | Seguro por diseño |
| Soporte de módulos | Módulos integrados | Modular, extensible |

## Fuentes de Reglas

PRX-SD agrega reglas de 8 fuentes:

| Fuente | Reglas | Contenido | Cobertura de Plataforma |
|--------|--------|-----------|------------------------|
| **Reglas integradas** | 64 | Ransomware, troyanos, puertas traseras, rootkits, mineros, webshells | Linux + macOS + Windows |
| **Yara-Rules/rules** (GitHub) | ~12.400 | Emotet, TrickBot, CobaltStrike, Mirai, LockBit | Multiplataforma |
| **Neo23x0/signature-base** | ~8.200 | APT29, Lazarus, minería de criptomonedas, webshells, ransomware | Multiplataforma |
| **ReversingLabs YARA** | ~9.500 | Troyanos, ransomware, puertas traseras, herramientas de hackeo | Windows + Linux |
| **ESET IOC** | ~3.800 | Turla, Interception, amenazas persistentes avanzadas | Multiplataforma |
| **InQuest** | ~4.836 | Documentos maliciosos OLE/DDE, cargas útiles de macros | Multiplataforma |
| **JPCERT/CC** | ~500+ | Amenazas dirigidas a Asia-Pacífico | Multiplataforma |
| **Personalizadas/importadas** | Variable | Reglas proporcionadas por el usuario | Cualquiera |

**Total: más de 38.800 reglas** (después de deduplicación)

## Reglas Integradas

Las 64 reglas integradas están compiladas en el binario de PRX-SD y siempre están disponibles, incluso sin descargar conjuntos de reglas externos. Cubren las categorías de amenazas más prevalentes:

| Categoría | Reglas | Ejemplos |
|-----------|--------|---------|
| Ransomware | 12 | WannaCry, LockBit, Conti, REvil, BlackCat, Ryuk |
| Troyanos | 10 | Emotet, TrickBot, Dridex, QakBot |
| Puertas traseras | 8 | Cobalt Strike Beacon, Metasploit Meterpreter, shells inversos |
| Rootkits | 6 | Reptile, Diamorphine, Jynx2 (Linux) |
| Criptomineros | 6 | XMRig, CGMiner, configuraciones de minería oculta |
| Webshells | 8 | China Chopper, WSO, B374K, shells PHP/ASP/JSP |
| RATs | 6 | njRAT, DarkComet, AsyncRAT, Quasar |
| Exploits | 4 | EternalBlue, PrintNightmare, cargas útiles de Log4Shell |
| Firmas de prueba | 4 | Variantes del archivo de prueba EICAR |

## Proceso de Coincidencia de Reglas

Cuando un archivo llega a la Capa 2, YARA-X lo procesa de la siguiente manera:

1. **Compilación de reglas** -- Al inicio, todas las reglas se compilan en una representación interna optimizada. Esto ocurre una vez y se almacena en caché en memoria.
2. **Extracción de átomos** -- YARA-X extrae secuencias cortas de bytes (átomos) de los patrones de reglas para construir un índice de búsqueda. Esto permite un prefiltrado rápido.
3. **Escaneo** -- El contenido del archivo se escanea contra el índice de átomos. Solo se evalúan completamente las reglas con átomos coincidentes.
4. **Evaluación de condiciones** -- Para cada regla candidata, se evalúa la condición completa (lógica booleana, recuentos de cadenas, verificaciones de estructura de archivos).
5. **Resultado** -- Las reglas coincidentes se recopilan y el archivo se marca como `MALICIOUS` con los nombres de las reglas incluidos en el informe.

### Rendimiento

| Métrica | Valor |
|---------|-------|
| Compilación de reglas (38.800 reglas) | ~2 segundos (una vez al inicio) |
| Tiempo de escaneo por archivo | ~0,3 milisegundos promedio |
| Uso de memoria (reglas compiladas) | ~150 MB |
| Rendimiento | ~3.000 archivos/segundo/hilo |

## Actualizar Reglas YARA

Las reglas se actualizan junto con las firmas de hash:

```bash
# Update everything (hashes + YARA rules)
sd update

# Update only YARA rules
sd update --source yara
```

El proceso de actualización:

1. Descarga archivos de reglas de cada fuente
2. Valida la sintaxis de reglas con YARA-X
3. Deduplica reglas por nombre y hash de contenido
4. Compila el conjunto combinado de reglas
5. Reemplaza atómicamente el conjunto de reglas activo

::: tip Actualizaciones Sin Tiempo de Inactividad
Las actualizaciones de reglas son atómicas. El nuevo conjunto de reglas se compila y valida antes de reemplazar el activo. Si la compilación falla (p. ej., por un error de sintaxis en una regla comunitaria), el conjunto de reglas existente permanece activo.
:::

## Reglas Personalizadas

Puedes agregar tus propias reglas YARA colocando archivos `.yar` o `.yara` en el directorio de reglas personalizadas:

```bash
# Default custom rules directory
~/.config/prx-sd/rules/
```

Ejemplo de regla personalizada:

```yara
rule custom_webshell_detector {
    meta:
        description = "Detects custom PHP webshell variant"
        author = "Security Team"
        severity = "high"

    strings:
        $eval = "eval(base64_decode(" ascii
        $system = "system($_" ascii
        $exec = "exec($_" ascii

    condition:
        filesize < 100KB and
        ($eval or $system or $exec)
}
```

Después de agregar reglas personalizadas, recarga el conjunto de reglas:

```bash
sd reload-rules
```

O reinicia el demonio monitor para recoger los cambios automáticamente.

## Directorios de Reglas

| Directorio | Fuente | Comportamiento de Actualización |
|------------|--------|-------------------------------|
| `~/.local/share/prx-sd/rules/builtin/` | Compilado en el binario | Actualizado con lanzamientos |
| `~/.local/share/prx-sd/rules/community/` | Descargado de fuentes | Actualizado por `sd update` |
| `~/.config/prx-sd/rules/` | Reglas personalizadas del usuario | Manual, nunca se sobrescriben |

## Verificar Reglas

Verifica el recuento de reglas actualmente cargadas y las fuentes:

```bash
sd info
```

```
YARA Rules
==========
Built-in:        64
Community:       38,736
Custom:          12
Total compiled:  38,812
Rule sources:    8
Last updated:    2026-03-21 10:00:00 UTC
```

Lista las reglas que coinciden con una palabra clave específica:

```bash
sd rules list --filter "ransomware"
```

## Próximos Pasos

- [Análisis Heurístico](./heuristics) -- Detección conductual para archivos que evaden firmas
- [Coincidencia de Hash](./hash-matching) -- La capa de detección más rápida
- [Descripción General del Motor de Detección](./index) -- Cómo funcionan todas las capas juntas
- [Tipos de Archivo Admitidos](./file-types) -- Qué formatos de archivo atacan las reglas YARA
