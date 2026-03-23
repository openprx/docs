---
title: Inicio Rápido
description: "Pon PRX-SD a escanear en busca de malware en 5 minutos. Instala, actualiza firmas, escanea archivos, revisa resultados y habilita el monitoreo en tiempo real."
---

# Inicio Rápido

Esta guía te lleva de cero a tu primer escaneo de malware en menos de 5 minutos. Al final, tendrás PRX-SD instalado, las firmas actualizadas y el monitoreo en tiempo real funcionando.

::: tip Requisitos Previos
Necesitas un sistema Linux o macOS con `curl` instalado. Consulta la [Guía de Instalación](./installation) para otros métodos y detalles de plataforma.
:::

## Paso 1: Instalar PRX-SD

Descarga e instala la última versión con el script de instalación:

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash
```

Verifica la instalación:

```bash
sd --version
```

Deberías ver una salida como:

```
prx-sd 0.5.0
```

## Paso 2: Actualizar la Base de Datos de Firmas

PRX-SD incluye una lista de bloqueo integrada, pero necesitas descargar la última inteligencia de amenazas para protección completa. El comando `update` obtiene firmas de hash y reglas YARA de todas las fuentes configuradas:

```bash
sd update
```

Salida esperada:

```
[INFO] Updating hash signatures...
[INFO]   MalwareBazaar: 12,847 hashes (last 48h)
[INFO]   URLhaus: 8,234 hashes
[INFO]   Feodo Tracker: 1,456 hashes
[INFO]   ThreatFox: 5,891 hashes
[INFO] Updating YARA rules...
[INFO]   Built-in rules: 64
[INFO]   Yara-Rules/rules: 12,400
[INFO]   Neo23x0/signature-base: 8,200
[INFO]   ReversingLabs: 9,500
[INFO]   ESET IOC: 3,800
[INFO]   InQuest: 4,836
[INFO] Signature database updated successfully.
[INFO] Total: 28,428 hashes, 38,800 YARA rules
```

::: tip Actualización Completa
Para incluir la base de datos completa de VirusShare (más de 20M de hashes MD5), ejecuta:
```bash
sd update --full
```
Esto tarda más pero proporciona la máxima cobertura de hashes.
:::

## Paso 3: Escanear un Archivo o Directorio

Escanea un único archivo sospechoso:

```bash
sd scan /path/to/suspicious_file
```

Escanea un directorio completo de forma recursiva:

```bash
sd scan /home --recursive
```

Ejemplo de salida para un directorio limpio:

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 0
Status:  CLEAN

Duration: 2.3s
```

Ejemplo de salida cuando se encuentran amenazas:

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 2

  [MALICIOUS] /home/user/downloads/invoice.exe
    Match: SHA-256 hash (MalwareBazaar)
    Family: Emotet
    Action: None (use --auto-quarantine to isolate)

  [SUSPICIOUS] /home/user/downloads/tool.bin
    Match: Heuristic analysis
    Score: 45/100
    Findings: High entropy (7.8), UPX packed
    Action: None

Duration: 3.1s
```

## Paso 4: Revisar Resultados y Tomar Acción

Para un informe JSON detallado adecuado para automatización o ingesta de logs:

```bash
sd scan /home --recursive --json
```

```json
{
  "scan_id": "a1b2c3d4",
  "timestamp": "2026-03-21T10:00:00Z",
  "files_scanned": 1847,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "detection_layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924..."
    }
  ],
  "duration_ms": 3100
}
```

Para poner en cuarentena automáticamente las amenazas detectadas durante un escaneo:

```bash
sd scan /home --recursive --auto-quarantine
```

Los archivos en cuarentena se mueven a un directorio seguro y cifrado. Puedes listarlos y restaurarlos:

```bash
# List quarantined files
sd quarantine list

# Restore a file by its quarantine ID
sd quarantine restore QR-20260321-001
```

::: warning Cuarentena
Los archivos en cuarentena están cifrados y no pueden ejecutarse accidentalmente. Usa `sd quarantine restore` solo si estás seguro de que el archivo es un falso positivo.
:::

## Paso 5: Habilitar el Monitoreo en Tiempo Real

Inicia el monitor en tiempo real para vigilar directorios en busca de archivos nuevos o modificados:

```bash
sd monitor /home /tmp /var/www
```

El monitor se ejecuta en primer plano y escanea los archivos a medida que se crean o cambian:

```
[INFO] Monitoring 3 directories...
[INFO] Press Ctrl+C to stop.
[2026-03-21 10:05:32] SCAN /home/user/downloads/update.bin → CLEAN
[2026-03-21 10:07:15] SCAN /tmp/payload.sh → [MALICIOUS] YARA: linux_backdoor_reverse_shell
```

Para ejecutar el monitor como un servicio en segundo plano:

```bash
# Install and start the systemd service
sd service install
sd service start

# Check service status
sd service status
```

## Lo Que Tienes Ahora

Después de completar estos pasos, tu sistema tiene:

| Componente | Estado |
|------------|--------|
| Binario `sd` | Instalado en PATH |
| Base de datos de hashes | Más de 28.000 hashes SHA-256/MD5 en LMDB |
| Reglas YARA | Más de 38.800 reglas de 8 fuentes |
| Monitor en tiempo real | Vigilando los directorios especificados |

## Próximos Pasos

- [Escaneo de Archivos y Directorios](../scanning/file-scan) -- Explora todas las opciones de `sd scan` incluyendo hilos, exclusiones y límites de tamaño
- [Escaneo de Memoria](../scanning/memory-scan) -- Escanea la memoria de procesos en ejecución en busca de amenazas en memoria
- [Detección de Rootkits](../scanning/rootkit) -- Verifica si hay rootkits en el kernel y en el espacio de usuario
- [Motor de Detección](../detection/) -- Comprende cómo funciona el pipeline multicapa
- [Reglas YARA](../detection/yara-rules) -- Aprende sobre fuentes de reglas y reglas personalizadas
