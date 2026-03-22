---
title: Detección de Rootkits
description: "Detecta rootkits en el kernel y en el espacio de usuario en Linux usando sd check-rootkit. Verifica procesos ocultos, módulos del kernel, hooks de llamadas al sistema y más."
---

# Detección de Rootkits

El comando `sd check-rootkit` realiza verificaciones profundas de integridad del sistema para detectar rootkits tanto a nivel del kernel como en el espacio de usuario. Los rootkits son uno de los tipos de malware más peligrosos porque ocultan su presencia de las herramientas estándar del sistema, haciéndolos invisibles para los escáneres de archivos convencionales.

::: warning Requisitos
- **Se requieren privilegios de root** -- La detección de rootkits lee estructuras de datos del kernel e internos del sistema.
- **Solo Linux** -- Esta característica depende de `/proc`, `/sys` e interfaces de kernel específicas de Linux.
:::

## Qué Detecta

PRX-SD verifica la presencia de rootkits a través de múltiples vectores:

### Verificaciones a Nivel del Kernel

| Verificación | Descripción |
|-------------|-------------|
| Módulos del kernel ocultos | Compara los módulos cargados desde `/proc/modules` con las entradas de `sysfs` para encontrar discrepancias |
| Hooks en la tabla de llamadas al sistema | Verifica las entradas de la tabla de syscall contra los símbolos del kernel conocidos |
| Inconsistencias en `/proc` | Detecta procesos ocultos de `/proc` pero visibles a través de otras interfaces |
| Manipulación de símbolos del kernel | Verifica punteros de función modificados en estructuras clave del kernel |
| Tabla de descriptores de interrupción | Verifica las entradas de la IDT para modificaciones inesperadas |

### Verificaciones en el Espacio de Usuario

| Verificación | Descripción |
|-------------|-------------|
| Procesos ocultos | Compara los resultados de `readdir(/proc)` con la enumeración de PIDs por fuerza bruta |
| Inyección de LD_PRELOAD | Verifica bibliotecas compartidas maliciosas cargadas vía `LD_PRELOAD` o `/etc/ld.so.preload` |
| Reemplazo de binarios | Verifica la integridad de los binarios críticos del sistema (`ls`, `ps`, `netstat`, `ss`, `lsof`) |
| Archivos ocultos | Detecta archivos ocultos interceptando la syscall `getdents` |
| Entradas sospechosas en cron | Escanea los crontabs en busca de comandos ofuscados o codificados |
| Manipulación de servicios systemd | Verifica unidades systemd no autorizadas o modificadas |
| Backdoors SSH | Busca claves SSH no autorizadas, `sshd_config` modificado o binarios `sshd` con backdoor |
| Oyentes de red | Identifica sockets de red ocultos que no muestra `ss`/`netstat` |

## Uso Básico

Ejecuta una verificación completa de rootkits:

```bash
sudo sd check-rootkit
```

Ejemplo de salida:

```
PRX-SD Rootkit Check
====================
System: Linux 6.12.48 x86_64
Checks: 14 performed

Kernel Checks:
  [PASS] Kernel module list consistency
  [PASS] System call table integrity
  [PASS] /proc filesystem consistency
  [PASS] Kernel symbol verification
  [PASS] Interrupt descriptor table

Userspace Checks:
  [PASS] Hidden process detection
  [WARN] LD_PRELOAD check
    /etc/ld.so.preload exists with entry: /usr/lib/libfakeroot.so
  [PASS] Critical binary integrity
  [PASS] Hidden file detection
  [PASS] Cron entry audit
  [PASS] Systemd service audit
  [PASS] SSH configuration check
  [PASS] Network listener verification
  [PASS] /dev suspicious entries

Summary: 13 passed, 1 warning, 0 critical
```

## Opciones del Comando

| Opción | Corta | Predeterminado | Descripción |
|--------|-------|----------------|-------------|
| `--json` | `-j` | desactivado | Mostrar resultados en formato JSON |
| `--kernel-only` | | desactivado | Solo ejecutar verificaciones a nivel del kernel |
| `--userspace-only` | | desactivado | Solo ejecutar verificaciones en el espacio de usuario |
| `--baseline` | | ninguno | Ruta a un archivo base para comparación |
| `--save-baseline` | | ninguno | Guardar el estado actual como base |

## Comparación con Línea Base

Para monitoreo continuo, crea una línea base del estado conocido limpio de tu sistema y compárala en futuras verificaciones:

```bash
# Create baseline on a known-clean system
sudo sd check-rootkit --save-baseline /etc/prx-sd/rootkit-baseline.json

# Future checks compare against baseline
sudo sd check-rootkit --baseline /etc/prx-sd/rootkit-baseline.json
```

La línea base registra listas de módulos del kernel, hashes de la tabla de syscall, sumas de verificación de binarios críticos y estados de oyentes de red. Cualquier desviación activa una alerta.

## Salida JSON

```bash
sudo sd check-rootkit --json
```

```json
{
  "timestamp": "2026-03-21T16:00:00Z",
  "system": {
    "kernel": "6.12.48",
    "arch": "x86_64",
    "hostname": "web-server-01"
  },
  "checks": [
    {
      "name": "kernel_modules",
      "category": "kernel",
      "status": "pass",
      "details": "142 modules, all consistent"
    },
    {
      "name": "ld_preload",
      "category": "userspace",
      "status": "warning",
      "details": "/etc/ld.so.preload contains: /usr/lib/libfakeroot.so",
      "recommendation": "Verify this entry is expected. Remove if unauthorized."
    }
  ],
  "summary": {
    "total": 14,
    "passed": 13,
    "warnings": 1,
    "critical": 0
  }
}
```

## Ejemplo: Detectar un Rootkit de Módulo del Kernel

Cuando un rootkit oculta un módulo del kernel, `sd check-rootkit` detecta la inconsistencia:

```
Kernel Checks:
  [CRITICAL] Kernel module list consistency
    Module found in /sys/module/ but missing from /proc/modules:
      - syskit (size: 45056, loaded at: 0xffffffffc0a00000)
    This is a strong indicator of a hidden kernel module rootkit.
    Recommendation: Boot from trusted media and investigate.
```

::: warning Hallazgos Críticos
Un hallazgo `CRITICAL` del verificador de rootkits debe tratarse como un incidente de seguridad grave. No intentes la remediación en un sistema potencialmente comprometido. En su lugar, aísla la máquina e investiga desde medios de confianza.
:::

## Programar Verificaciones Regulares

Agrega verificaciones de rootkits a tu rutina de monitoreo:

```bash
# Cron: check every 4 hours
0 */4 * * * root /usr/local/bin/sd check-rootkit --json >> /var/log/prx-sd/rootkit-check.log 2>&1
```

## Próximos Pasos

- [Escaneo de Memoria](./memory-scan) -- Detectar amenazas en memoria en procesos en ejecución
- [Escaneo de Archivos y Directorios](./file-scan) -- Escaneo tradicional basado en archivos
- [Escaneo USB](./usb-scan) -- Escanear medios extraíbles al conectarse
- [Motor de Detección](../detection/) -- Descripción general de todas las capas de detección
