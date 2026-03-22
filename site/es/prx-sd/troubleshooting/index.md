---
title: Resolución de Problemas
description: "Soluciones para los problemas más comunes de PRX-SD, incluyendo actualizaciones de firmas, rendimiento de escaneo, permisos, falsos positivos, problemas del demonio y uso de memoria."
---

# Resolución de Problemas

Esta página cubre los problemas más comunes al ejecutar PRX-SD, junto con sus causas y soluciones.

## Error en la Actualización de la Base de Datos de Firmas

**Síntomas:** `sd update` falla con un error de red, tiempo de espera o discrepancia SHA-256.

**Posibles Causas:**
- Sin conexión a internet o firewall bloqueando HTTPS de salida
- El servidor de actualizaciones está temporalmente no disponible
- Un proxy o firewall corporativo está modificando la respuesta

**Soluciones:**

1. **Verifica la conectividad** con el servidor de actualizaciones:

```bash
curl -fsSL https://update.prx-sd.dev/v1/manifest.json
```

2. **Usa el script de actualización sin conexión** si tienes restricciones de red:

```bash
# On a machine with internet access
./tools/update-signatures.sh

# Copy the signatures directory to the target machine
scp -r ~/.prx-sd/signatures user@target:~/.prx-sd/
```

3. **Fuerza la nueva descarga** para limpiar cualquier caché corrupto:

```bash
sd update --force
```

4. **Usa un servidor de actualizaciones personalizado** si alojas un espejo privado:

```bash
sd config set update_server_url "https://internal-mirror.example.com/prx-sd/v1"
sd update
```

5. **Verifica la discrepancia SHA-256** -- esto generalmente significa que la descarga se corrompió en tránsito. Inténtalo de nuevo, o descarga manualmente:

```bash
sd update --force
```

::: tip
Ejecuta `sd update --check-only` para verificar si hay una actualización disponible sin descargarla.
:::

## El Escaneo es Lento

**Síntomas:** Escanear un directorio tarda mucho más de lo esperado.

**Posibles Causas:**
- Escaneo de sistemas de archivos montados en red (NFS, CIFS, SSHFS)
- Las reglas YARA se compilan en cada escaneo (sin compilación en caché)
- Demasiados hilos compitiendo por I/O en discos giratorios
- Recursión de archivos en grandes archivos comprimidos anidados

**Soluciones:**

1. **Aumenta el número de hilos** para almacenamiento respaldado por SSD:

```bash
sd config set scan.threads 16
```

2. **Reduce el número de hilos** para discos giratorios (limitados por I/O):

```bash
sd config set scan.threads 2
```

3. **Excluye rutas lentas o irrelevantes**:

```bash
sd config set scan.exclude_paths '["/mnt/nfs", "/proc", "/sys", "/dev", "*.iso"]'
```

4. **Deshabilita el escaneo de archivos comprimidos** si no es necesario:

```bash
sd config set scan.scan_archives false
```

5. **Reduce la profundidad de archivos comprimidos** para evitar archivos profundamente anidados:

```bash
sd config set scan.max_archive_depth 1
```

6. **Usa el indicador `--exclude`** para escaneos individuales:

```bash
sd scan /home --exclude "*.iso" --exclude "node_modules"
```

7. **Habilita el registro de depuración** para encontrar cuellos de botella:

```bash
sd --log-level debug scan /path/to/dir 2>&1 | grep -i "slow\|timeout\|skip"
```

## Errores de Permiso de fanotify

**Síntomas:** `sd monitor --block` falla con "Permission denied" u "Operation not permitted".

**Posibles Causas:**
- No se ejecuta como root
- El kernel de Linux no tiene `CONFIG_FANOTIFY_ACCESS_PERMISSIONS` habilitado
- AppArmor o SELinux está bloqueando el acceso a fanotify

**Soluciones:**

1. **Ejecuta como root**:

```bash
sudo sd monitor /home /tmp --block
```

2. **Verifica la configuración del kernel**:

```bash
zgrep FANOTIFY /proc/config.gz
# Should show: CONFIG_FANOTIFY=y and CONFIG_FANOTIFY_ACCESS_PERMISSIONS=y
```

3. **Usa el modo sin bloqueo** como alternativa (aún detecta amenazas, pero no impide el acceso a archivos):

```bash
sd monitor /home /tmp
```

::: warning
El modo de bloqueo solo está disponible en Linux con soporte fanotify. En macOS (FSEvents) y Windows (ReadDirectoryChangesW), el monitoreo en tiempo real opera en modo solo detección.
:::

4. **Verifica SELinux/AppArmor**:

```bash
# SELinux: check for denials
ausearch -m AVC -ts recent | grep prx-sd

# AppArmor: check for denials
dmesg | grep apparmor | grep prx-sd
```

## Falso Positivo (Archivo Legítimo Detectado como Amenaza)

**Síntomas:** Un archivo conocido como seguro es marcado como Sospechoso o Malicioso.

**Soluciones:**

1. **Verifica qué activó la detección**:

```bash
sd scan /path/to/file --json
```

Observa los campos `detection_type` y `threat_name`:
- `HashMatch` -- el hash del archivo coincide con un hash de malware conocido (falso positivo improbable)
- `YaraRule` -- una regla YARA coincidió con patrones en el archivo
- `Heuristic` -- el motor heurístico puntuó el archivo por encima del umbral

2. **Para falsos positivos heurísticos**, aumenta el umbral:

```bash
# Default is 60; raise to 70 for fewer false positives
sd config set scan.heuristic_threshold 70
```

3. **Excluye el archivo o directorio del escaneo**:

```bash
sd config set scan.exclude_paths '["/path/to/safe-file", "/opt/known-good/"]'
```

4. **Para falsos positivos de YARA**, puedes excluir reglas específicas eliminándolas o comentándolas en el directorio `~/.prx-sd/yara/`.

5. **Lista blanca por hash** -- agrega el SHA-256 del archivo a una lista de permitidos local (función futura). Como solución temporal, excluye el archivo por ruta.

::: tip
Si crees que una detección es un falso positivo genuino, repórtalo en [github.com/openprx/prx-sd/issues](https://github.com/openprx/prx-sd/issues) con el hash del archivo (no el archivo en sí) y el nombre de la regla.
:::

## El Demonio No Puede Iniciarse

**Síntomas:** `sd daemon` se cierra inmediatamente, o `sd status` muestra "stopped".

**Posibles Causas:**
- Otra instancia ya está en ejecución (existe el archivo PID)
- El directorio de datos es inaccesible o está corrupto
- Falta la base de datos de firmas

**Soluciones:**

1. **Verifica si hay un archivo PID obsoleto**:

```bash
cat ~/.prx-sd/prx-sd.pid
# If the listed PID is not running, remove the file
rm ~/.prx-sd/prx-sd.pid
```

2. **Verifica el estado del demonio**:

```bash
sd status
```

3. **Ejecuta en primer plano** con registro de depuración para ver los errores de inicio:

```bash
sd --log-level debug daemon /home /tmp
```

4. **Asegúrate de que existen las firmas**:

```bash
sd info
# If hash_count is 0, run:
sd update
```

5. **Verifica los permisos del directorio**:

```bash
ls -la ~/.prx-sd/
# All directories should be owned by your user and writable
```

6. **Reinicializa** si el directorio de datos está corrupto:

```bash
# Back up existing data
mv ~/.prx-sd ~/.prx-sd.bak

# Re-run any command to trigger first-run setup
sd info

# Re-download signatures
sd update
```

## Ajuste del Nivel de Registro

**Problema:** Necesitas más información de diagnóstico para depurar un problema.

PRX-SD admite cinco niveles de registro, de más a menos detallado:

| Nivel | Descripción |
|-------|-------------|
| `trace` | Todo, incluyendo detalles de coincidencia YARA por archivo |
| `debug` | Operaciones detalladas del motor, carga de plugins, búsquedas de hash |
| `info` | Progreso de escaneo, actualizaciones de firmas, registro de plugins |
| `warn` | Advertencias y errores no fatales (predeterminado) |
| `error` | Solo errores críticos |

```bash
# Maximum verbosity
sd --log-level trace scan /tmp

# Debug-level for troubleshooting
sd --log-level debug monitor /home

# Redirect logs to a file for analysis
sd --log-level debug scan /home 2> /tmp/prx-sd-debug.log
```

::: tip
El indicador `--log-level` es global y debe ir **antes** del subcomando:
```bash
# Correct
sd --log-level debug scan /tmp

# Incorrect (flag after subcommand)
sd scan /tmp --log-level debug
```
:::

## Uso Elevado de Memoria

**Síntomas:** El proceso `sd` consume más memoria de la esperada, especialmente durante escaneos de directorios grandes.

**Posibles Causas:**
- Escaneo de un número muy grande de archivos con muchos hilos
- Las reglas YARA se compilan en memoria (38.800+ reglas usan memoria significativa)
- El escaneo de archivos comprimidos descomprime en memoria archivos grandes
- Plugins WASM con límites `max_memory_mb` elevados

**Soluciones:**

1. **Reduce el número de hilos** (cada hilo carga su propio contexto YARA):

```bash
sd config set scan.threads 2
```

2. **Limita el tamaño máximo de archivo** para omitir archivos muy grandes:

```bash
# Limit to 50 MiB
sd config set scan.max_file_size 52428800
```

3. **Deshabilita el escaneo de archivos comprimidos** en sistemas con memoria limitada:

```bash
sd config set scan.scan_archives false
```

4. **Reduce la profundidad de archivos comprimidos**:

```bash
sd config set scan.max_archive_depth 1
```

5. **Verifica los límites de memoria de los plugins WASM** -- revisa `~/.prx-sd/plugins/*/plugin.json` en busca de plugins con valores `max_memory_mb` elevados y redúcelos.

6. **Monitorea la memoria durante los escaneos**:

```bash
# In another terminal
watch -n 1 'ps aux | grep sd | grep -v grep'
```

7. **Para el demonio**, monitorea la memoria a lo largo del tiempo:

```bash
sd status
# Shows PID; use top/htop to watch memory
```

## Otros Problemas Comunes

### Advertencia "No YARA rules found"

El directorio de reglas YARA está vacío. Vuelve a ejecutar la configuración inicial o descarga las reglas:

```bash
sd update
# Or manually trigger setup by removing the yara directory:
rm -rf ~/.prx-sd/yara
sd info  # triggers first-run setup with embedded rules
```

### Error "Failed to open signature database"

La base de datos de firmas LMDB puede estar corrupta:

```bash
rm -rf ~/.prx-sd/signatures
sd update
```

### Adblock: "insufficient privileges"

Los comandos de habilitar/deshabilitar adblock modifican el archivo hosts del sistema y requieren root:

```bash
sudo sd adblock enable
sudo sd adblock disable
```

### El Escaneo Omite Archivos con Error "timeout"

Los tiempos de espera individuales de archivos tienen un predeterminado de 30 segundos. Auméntalos para archivos complejos:

```bash
sd config set scan.timeout_per_file_ms 60000
```

## Obtener Ayuda

Si ninguna de las soluciones anteriores resuelve tu problema:

1. **Revisa los problemas existentes:** [github.com/openprx/prx-sd/issues](https://github.com/openprx/prx-sd/issues)
2. **Crea un nuevo problema** con:
   - Versión de PRX-SD (`sd info`)
   - Sistema operativo y versión del kernel
   - Salida del registro de depuración (`sd --log-level debug ...`)
   - Pasos para reproducir

## Próximos Pasos

- Revisa la [Referencia de Configuración](../configuration/reference) para ajustar el comportamiento del motor
- Aprende sobre el [Motor de Detección](../detection/) para entender cómo se identifican las amenazas
- Configura las [Alertas](../alerts/) para recibir notificaciones proactivas de problemas
