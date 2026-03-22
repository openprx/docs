---
title: Escaneo de Memoria de Procesos
description: "Escanea la memoria de procesos en ejecución en busca de malware sin archivos, amenazas en memoria y código inyectado usando sd scan-memory."
---

# Escaneo de Memoria de Procesos

El comando `sd scan-memory` escanea la memoria de los procesos en ejecución para detectar malware sin archivos, shellcode inyectado y amenazas en memoria que nunca tocan el disco. Esto es esencial para detectar amenazas avanzadas que evaden el escaneo tradicional basado en archivos.

::: warning Requisitos
- **Se requieren privilegios de root** -- El escaneo de memoria lee `/proc/<pid>/mem`, lo que requiere root o `CAP_SYS_PTRACE`.
- **Solo Linux** -- El escaneo de memoria de procesos actualmente es compatible con Linux. El soporte para macOS está planificado.
:::

## Cómo Funciona

El escaneo de memoria de procesos lee las asignaciones de memoria virtual de un proceso en ejecución y aplica el mismo pipeline de detección usado para el escaneo de archivos:

1. **Enumerar regiones de memoria** -- Analiza `/proc/<pid>/maps` para encontrar segmentos de memoria legibles (heap, pila, asignaciones anónimas, archivos mapeados).
2. **Leer contenido de memoria** -- Lee cada región desde `/proc/<pid>/mem`.
3. **Escaneo de reglas YARA** -- Aplica reglas YARA en memoria optimizadas para detectar patrones de shellcode, DLLs inyectadas y firmas de malware conocidas en memoria.
4. **Análisis de patrones** -- Verifica patrones sospechosos como regiones de memoria RWX, encabezados PE en asignaciones sin respaldo de archivo y cargas útiles de exploits conocidas.

## Uso Básico

Escanea todos los procesos en ejecución:

```bash
sudo sd scan-memory
```

Escanea un proceso específico por PID:

```bash
sudo sd scan-memory --pid 1234
```

Escanea múltiples procesos específicos:

```bash
sudo sd scan-memory --pid 1234 --pid 5678 --pid 9012
```

## Opciones del Comando

| Opción | Corta | Predeterminado | Descripción |
|--------|-------|----------------|-------------|
| `--pid` | `-p` | todos | Escanear solo el ID de proceso especificado (repetible) |
| `--json` | `-j` | desactivado | Mostrar resultados en formato JSON |
| `--exclude-pid` | | ninguno | Excluir PIDs específicos del escaneo |
| `--exclude-user` | | ninguno | Excluir procesos propiedad de un usuario específico |
| `--min-region-size` | | 4096 | Tamaño mínimo de región de memoria a escanear (bytes) |
| `--skip-mapped-files` | | desactivado | Omitir regiones de memoria respaldadas por archivos |

## Ejemplo de Salida

```bash
sudo sd scan-memory
```

```
PRX-SD Memory Scan Report
=========================
Processes scanned: 142
Memory regions scanned: 8,451
Total memory scanned: 4.2 GB

  [MALICIOUS] PID 3847 (svchost)
    Region:  0x7f4a00000000-0x7f4a00040000 (anon, RWX)
    Match:   YARA rule: memory_cobalt_strike_beacon
    Details: CobaltStrike Beacon shellcode detected in anonymous RWX mapping

  [SUSPICIOUS] PID 12045 (python3)
    Region:  0x7f8b10000000-0x7f8b10010000 (anon, RWX)
    Match:   Pattern analysis
    Details: Executable code in anonymous RWX region, possible shellcode injection

Duration: 12.4s
```

### Salida JSON

```bash
sudo sd scan-memory --pid 3847 --json
```

```json
{
  "scan_type": "memory",
  "timestamp": "2026-03-21T15:00:00Z",
  "processes_scanned": 1,
  "regions_scanned": 64,
  "threats": [
    {
      "pid": 3847,
      "process_name": "svchost",
      "region_start": "0x7f4a00000000",
      "region_end": "0x7f4a00040000",
      "region_perms": "rwx",
      "region_type": "anonymous",
      "verdict": "malicious",
      "rule": "memory_cobalt_strike_beacon",
      "description": "CobaltStrike Beacon shellcode detected"
    }
  ]
}
```

## Casos de Uso

### Respuesta a Incidentes

Durante una investigación activa, escanea todos los procesos para encontrar servicios comprometidos:

```bash
sudo sd scan-memory --json > /evidence/memory-scan-$(date +%s).json
```

### Detección de Malware Sin Archivos

El malware moderno a menudo se ejecuta completamente en memoria sin escribir en el disco. Las técnicas comunes incluyen:

- **Inyección de procesos** -- El malware inyecta código en procesos legítimos usando `ptrace` o escrituras en `/proc/pid/mem`
- **Carga reflexiva de DLL** -- Una DLL se carga desde memoria sin tocar el sistema de archivos
- **Ejecución de shellcode** -- El shellcode sin procesar se asigna en memoria RWX y se ejecuta directamente

`sd scan-memory` detecta estos patrones buscando:

| Indicador | Descripción |
|-----------|-------------|
| Asignaciones anónimas RWX | Código ejecutable en memoria sin respaldo de archivo |
| Encabezados PE en memoria | Estructuras PE de Windows en memoria de procesos Linux (cargas útiles multiplataforma) |
| Firmas de shellcode conocidas | Patrones de beacon de Metasploit, CobaltStrike, Sliver |
| Stubs de syscall sospechosos | Puntos de entrada de syscall parcheados o interceptados |

### Verificación de Salud del Servidor

Ejecuta escaneos de memoria periódicos en servidores de producción:

```bash
# Add to cron: scan every 6 hours
0 */6 * * * root /usr/local/bin/sd scan-memory --json --exclude-user nobody >> /var/log/prx-sd/memory-scan.log 2>&1
```

::: tip Impacto en el Rendimiento
El escaneo de memoria lee la memoria de procesos y puede aumentar brevemente la I/O. En servidores de producción, considera escanear durante períodos de poco tráfico o excluir procesos no críticos.
:::

## Limitaciones

- El escaneo de memoria lee una instantánea de la memoria del proceso en el momento del escaneo. Las regiones de memoria que cambian rápidamente pueden dar resultados incompletos.
- El kernel de memoria no se escanea con `scan-memory`. Usa `sd check-rootkit` para la detección de amenazas a nivel de kernel.
- Las cargas útiles en memoria altamente ofuscadas o cifradas pueden evadir las reglas YARA. La capa de análisis de patrones proporciona un mecanismo de detección secundario.

## Próximos Pasos

- [Detección de Rootkits](./rootkit) -- Detectar rootkits en el kernel y en el espacio de usuario
- [Escaneo de Archivos y Directorios](./file-scan) -- Escaneo tradicional basado en archivos
- [Reglas YARA](../detection/yara-rules) -- Comprender el motor de reglas usado para el escaneo de memoria
- [Motor de Detección](../detection/) -- Cómo funcionan todas las capas de detección juntas
