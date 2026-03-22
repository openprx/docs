---
title: Análisis Heurístico
description: "El motor heurístico de PRX-SD realiza análisis conductual consciente del tipo de archivo en archivos PE, ELF, Mach-O, Office y PDF para detectar amenazas desconocidas."
---

# Análisis Heurístico

El análisis heurístico es la tercera capa en el pipeline de detección de PRX-SD. Mientras que la coincidencia de hash y las reglas YARA dependen de firmas y patrones conocidos, las heurísticas analizan las **propiedades estructurales y conductuales** de un archivo para detectar amenazas que nunca se han visto antes -- incluyendo malware de día cero, implantes personalizados y muestras altamente ofuscadas.

## Cómo Funciona

PRX-SD primero identifica el tipo de archivo usando detección de número mágico, luego aplica un conjunto de verificaciones heurísticas específicas para ese formato de archivo. Cada verificación que se activa agrega puntos a una puntuación acumulativa. La puntuación final determina el veredicto.

### Mecanismo de Puntuación

| Rango de Puntuación | Veredicto | Significado |
|--------------------|-----------|-------------|
| 0 - 29 | **Limpio** | No se detectaron indicadores sospechosos significativos |
| 30 - 59 | **Sospechoso** | Se detectaron algunas anomalías; se recomienda revisión manual |
| 60 - 100 | **Malicioso** | Amenaza de alta confianza; múltiples indicadores fuertes |

Las puntuaciones son aditivas. Un archivo con una anomalía menor (p. ej., entropía ligeramente alta) puede puntuar 15, mientras que un archivo que combina alta entropía, importaciones de API sospechosas y firmas de empaquetador puntuaría 75+.

## Análisis PE (Ejecutable de Windows)

Las heurísticas PE apuntan a ejecutables de Windows (.exe, .dll, .scr, .sys):

| Verificación | Puntos | Descripción |
|-------------|--------|-------------|
| Alta entropía de sección | 10-25 | Secciones con entropía > 7,0 indican empaquetado o cifrado |
| Importaciones de API sospechosas | 5-20 | APIs como `VirtualAllocEx`, `WriteProcessMemory`, `CreateRemoteThread` |
| Firmas de empaquetador conocidas | 15-25 | Encabezados de UPX, Themida, VMProtect, ASPack, PECompact detectados |
| Anomalía de marca de tiempo | 5-10 | Marca de tiempo de compilación en el futuro o antes del año 2000 |
| Anomalía de nombre de sección | 5-10 | Nombres de sección no estándar (`.rsrc` reemplazado, cadenas aleatorias) |
| Anomalía de recursos | 5-15 | Archivos PE incrustados en recursos, secciones de recursos cifradas |
| Anomalía de tabla de importaciones | 10-15 | Muy pocas importaciones (empaquetado), o combinaciones de importaciones sospechosas |
| Firma digital | -10 | La firma Authenticode válida reduce la puntuación |
| Callbacks TLS | 10 | Entradas de callback TLS anti-depuración |
| Datos de superposición | 5-10 | Datos significativos añadidos después de la estructura PE |

### Ejemplo de Hallazgos PE

```
Heuristic Analysis: updater.exe
Score: 72/100 [MALICIOUS]

Findings:
  [+25] Section '.text' entropy: 7.91 (likely packed or encrypted)
  [+15] Packer detected: UPX 3.96
  [+12] Suspicious API imports: VirtualAllocEx, WriteProcessMemory,
        CreateRemoteThread, NtUnmapViewOfSection
  [+10] Section name anomaly: '.UPX0', '.UPX1' (non-standard)
  [+10] Compilation timestamp: 2089-01-01 (future date)
```

## Análisis ELF (Ejecutable de Linux)

Las heurísticas ELF apuntan a binarios Linux y objetos compartidos:

| Verificación | Puntos | Descripción |
|-------------|--------|-------------|
| Alta entropía de sección | 10-25 | Secciones con entropía > 7,0 |
| Referencias a LD_PRELOAD | 15-20 | Cadenas que referencian `LD_PRELOAD` o `/etc/ld.so.preload` |
| Persistencia en cron | 10-15 | Referencias a `/etc/crontab`, `/var/spool/cron`, directorios cron |
| Persistencia en systemd | 10-15 | Referencias a rutas de unidades systemd, `systemctl enable` |
| Indicadores de backdoor SSH | 15-20 | Rutas de `authorized_keys` modificadas, cadenas de configuración `sshd` |
| Anti-depuración | 10-15 | `ptrace(PTRACE_TRACEME)`, verificaciones de `/proc/self/status` |
| Operaciones de red | 5-10 | Creación de socket sin procesar, vinculaciones de puertos sospechosas |
| Auto-eliminación | 10 | `unlink` de la propia ruta del binario después de la ejecución |
| Binario sin símbolos + alta entropía | 10 | Binario sin símbolos con alta entropía sugiere malware empaquetado |
| Redirección a `/dev/null` | 5 | Redirigir salida a `/dev/null` (comportamiento de demonio) |

### Ejemplo de Hallazgos ELF

```
Heuristic Analysis: .cache/systemd-helper
Score: 65/100 [MALICIOUS]

Findings:
  [+20] LD_PRELOAD reference: /etc/ld.so.preload manipulation
  [+15] Cron persistence: writes to /var/spool/cron/root
  [+15] SSH backdoor: modifies /root/.ssh/authorized_keys
  [+10] Self-deletion: unlinks /tmp/.cache/systemd-helper
  [+5]  Network: creates raw socket
```

## Análisis Mach-O (Ejecutable de macOS)

Las heurísticas Mach-O apuntan a binarios macOS, bundles y binarios universales:

| Verificación | Puntos | Descripción |
|-------------|--------|-------------|
| Alta entropía de sección | 10-25 | Secciones con entropía > 7,0 |
| Inyección de dylib | 15-20 | Referencias a `DYLD_INSERT_LIBRARIES`, carga sospechosa de dylib |
| Persistencia en LaunchAgent/Daemon | 10-15 | Referencias a `~/Library/LaunchAgents`, `/Library/LaunchDaemons` |
| Acceso a Keychain | 10-15 | Llamadas a la API de Keychain, uso del comando `security` |
| Evasión de Gatekeeper | 10-15 | Cadenas `xattr -d com.apple.quarantine` |
| Evasión de privacidad TCC | 10-15 | Referencias a la base de datos TCC, abuso de la API de accesibilidad |
| Anti-análisis | 10 | Verificaciones `sysctl` para depuradores, cadenas de detección de VM |
| Anomalía de firma de código | 5-10 | Binario firmado de forma ad-hoc o sin firmar |

### Ejemplo de Hallazgos Mach-O

```
Heuristic Analysis: com.apple.helper
Score: 55/100 [SUSPICIOUS]

Findings:
  [+20] Dylib injection: DYLD_INSERT_LIBRARIES manipulation
  [+15] LaunchAgent persistence: writes to ~/Library/LaunchAgents/
  [+10] Keychain access: SecKeychainFindGenericPassword calls
  [+10] Unsigned binary: no code signature present
```

## Análisis de Documentos Office

Las heurísticas de Office apuntan a formatos de Microsoft Office (.doc, .docx, .xls, .xlsx, .ppt):

| Verificación | Puntos | Descripción |
|-------------|--------|-------------|
| Macros VBA presentes | 10-15 | Macros de ejecución automática (`AutoOpen`, `Document_Open`, `Workbook_Open`) |
| Macro con ejecución de shell | 20-30 | `Shell()`, `WScript.Shell`, invocación de `PowerShell` en macros |
| Campos DDE | 15-20 | Campos de Intercambio Dinámico de Datos que ejecutan comandos |
| Enlace de plantilla externa | 10-15 | Inyección de plantilla remota vía `attachedTemplate` |
| VBA ofuscado | 10-20 | Código de macro altamente ofuscado (Chr(), abuso de concatenación de cadenas) |
| Objetos OLE incrustados | 5-10 | Ejecutables o scripts incrustados como objetos OLE |
| Metadatos sospechosos | 5 | Campos de autor con cadenas en base64 o patrones inusuales |

### Ejemplo de Hallazgos Office

```
Heuristic Analysis: Q3_Report.xlsm
Score: 60/100 [MALICIOUS]

Findings:
  [+15] VBA macro with AutoOpen trigger
  [+25] Macro executes: Shell("powershell -enc JABjAGwA...")
  [+10] Obfuscated VBA: 47 Chr() calls, string concatenation abuse
  [+10] External template: https://evil.example.com/template.dotm
```

## Análisis de PDF

Las heurísticas PDF apuntan a documentos PDF:

| Verificación | Puntos | Descripción |
|-------------|--------|-------------|
| JavaScript incrustado | 15-25 | JavaScript en acciones `/JS` o `/JavaScript` |
| Acción Launch | 20-25 | Acción `/Launch` que ejecuta comandos del sistema |
| Acción URI | 5-10 | Acciones URI sospechosas que apuntan a patrones maliciosos conocidos |
| Flujos ofuscados | 10-15 | Múltiples capas de codificación (FlateDecode + ASCII85 + hex) |
| Archivos incrustados | 5-10 | Archivos ejecutables incrustados como adjuntos |
| Envío de formularios | 5-10 | Formularios que envían datos a URLs externas |
| AcroForm con JavaScript | 15 | Formularios interactivos con JavaScript incrustado |

### Ejemplo de Hallazgos PDF

```
Heuristic Analysis: shipping_label.pdf
Score: 45/100 [SUSPICIOUS]

Findings:
  [+20] Embedded JavaScript: 3 /JS actions found
  [+15] Obfuscated stream: triple-encoded FlateDecode chain
  [+10] Embedded file: invoice.exe (PE executable)
```

## Referencia de Hallazgos Comunes

La siguiente tabla lista los hallazgos heurísticos más frecuentemente activados en todos los tipos de archivo:

| Hallazgo | Severidad | Tipos de Archivo | Tasa de Falsos Positivos |
|---------|-----------|-----------------|--------------------------|
| Sección de alta entropía | Media | PE, ELF, Mach-O | Baja-Media (recursos de juegos, datos comprimidos) |
| Detección de empaquetador | Alta | PE | Muy baja |
| Macro de ejecución automática | Alta | Office | Baja (algunas macros legítimas) |
| Manipulación LD_PRELOAD | Alta | ELF | Muy baja |
| JavaScript incrustado | Media-Alta | PDF | Baja |
| Importaciones de API sospechosas | Media | PE | Media (las herramientas de seguridad activan esto) |
| Auto-eliminación | Alta | ELF | Muy baja |

::: tip Reducir Falsos Positivos
Si un archivo legítimo activa alertas heurísticas, puedes agregarlo a la lista de permitidos por hash SHA-256:
```bash
sd allowlist add /path/to/legitimate/file
```
Los archivos en la lista de permitidos omiten el análisis heurístico pero aún se verifican contra las bases de datos de hashes y YARA.
:::

## Próximos Pasos

- [Tipos de Archivo Admitidos](./file-types) -- Matriz de tipos de archivo completa y detalles de detección mágica
- [Reglas YARA](./yara-rules) -- Detección basada en patrones que complementa las heurísticas
- [Coincidencia de Hash](./hash-matching) -- La capa de detección más rápida
- [Descripción General del Motor de Detección](./index) -- Cómo funcionan todas las capas juntas
