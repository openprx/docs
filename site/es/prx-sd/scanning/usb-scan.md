---
title: Escaneo de Dispositivos USB
description: "Detecta y escanea automáticamente dispositivos de almacenamiento USB extraíbles en busca de malware cuando se conectan usando sd scan-usb."
---

# Escaneo de Dispositivos USB

El comando `sd scan-usb` detecta los dispositivos de almacenamiento USB extraíbles conectados y escanea su contenido en busca de malware. Esto es crítico en entornos donde las unidades USB son un vector común para la entrega de malware, como redes aisladas, estaciones de trabajo compartidas y sistemas de control industrial.

## Cómo Funciona

Cuando se invoca, `sd scan-usb` realiza los siguientes pasos:

1. **Descubrimiento de dispositivos** -- Enumera los dispositivos de bloque vía `/sys/block/` e identifica los dispositivos extraíbles (almacenamiento masivo USB).
2. **Detección de montaje** -- Verifica si el dispositivo ya está montado. Si no, puede montarlo opcionalmente en modo de solo lectura en un directorio temporal.
3. **Escaneo completo** -- Ejecuta el pipeline de detección completo (coincidencia de hash, reglas YARA, análisis heurístico) en todos los archivos del dispositivo.
4. **Informe** -- Produce un informe de escaneo con veredictos por archivo.

::: tip Montaje Automático
Por defecto, `sd scan-usb` escanea los dispositivos que ya están montados. Usa `--auto-mount` para montar automáticamente los dispositivos USB no montados en modo de solo lectura para escanearlos.
:::

## Uso Básico

Escanea todos los dispositivos de almacenamiento USB conectados:

```bash
sd scan-usb
```

Ejemplo de salida:

```
PRX-SD USB Scan
===============
Detected USB devices:
  /dev/sdb1 → /media/user/USB_DRIVE (vfat, 16 GB)

Scanning /media/user/USB_DRIVE...
Scanned: 847 files (2.1 GB)
Threats: 1

  [MALICIOUS] /media/user/USB_DRIVE/autorun.exe
    Layer:   YARA rule
    Rule:    win_worm_usb_spreader
    Details: USB worm with autorun.inf exploitation

Duration: 4.2s
```

## Opciones del Comando

| Opción | Corta | Predeterminado | Descripción |
|--------|-------|----------------|-------------|
| `--auto-quarantine` | `-q` | desactivado | Poner en cuarentena automáticamente las amenazas detectadas |
| `--auto-mount` | | desactivado | Montar dispositivos USB no montados en modo de solo lectura |
| `--device` | `-d` | todos | Escanear solo un dispositivo específico (p. ej., `/dev/sdb1`) |
| `--json` | `-j` | desactivado | Mostrar resultados en formato JSON |
| `--eject-after` | | desactivado | Expulsar el dispositivo de forma segura después del escaneo |
| `--max-size-mb` | | 100 | Omitir archivos más grandes que este tamaño |

## Cuarentena Automática

Aisla automáticamente las amenazas encontradas en dispositivos USB:

```bash
sd scan-usb --auto-quarantine
```

```
Scanning /media/user/USB_DRIVE...
  [MALICIOUS] /media/user/USB_DRIVE/autorun.exe → Quarantined (QR-20260321-012)
  [MALICIOUS] /media/user/USB_DRIVE/.hidden/payload.bin → Quarantined (QR-20260321-013)

Threats quarantined: 2
Safe to use: Review remaining files before opening.
```

::: warning Importante
Cuando se usa `--auto-quarantine` con el escaneo USB, los archivos maliciosos se mueven al almacén de cuarentena local en la máquina anfitriona, no se eliminan del dispositivo USB. Los archivos originales en el USB permanecen a menos que también uses `--remediate`.
:::

## Escanear Dispositivos Específicos

Si hay múltiples dispositivos USB conectados, escanea uno específico:

```bash
sd scan-usb --device /dev/sdb1
```

Lista los dispositivos USB detectados sin escanear:

```bash
sd scan-usb --list
```

```
Detected USB storage devices:
  1. /dev/sdb1  Kingston DataTraveler  16 GB  vfat  Mounted: /media/user/USB_DRIVE
  2. /dev/sdc1  SanDisk Ultra          64 GB  exfat Not mounted
```

## Salida JSON

```bash
sd scan-usb --json
```

```json
{
  "scan_type": "usb",
  "timestamp": "2026-03-21T17:00:00Z",
  "devices": [
    {
      "device": "/dev/sdb1",
      "label": "USB_DRIVE",
      "filesystem": "vfat",
      "size_gb": 16,
      "mount_point": "/media/user/USB_DRIVE",
      "files_scanned": 847,
      "threats": [
        {
          "path": "/media/user/USB_DRIVE/autorun.exe",
          "verdict": "malicious",
          "layer": "yara",
          "rule": "win_worm_usb_spreader"
        }
      ]
    }
  ]
}
```

## Amenazas USB Comunes

Los dispositivos USB se usan frecuentemente para entregar los siguientes tipos de malware:

| Tipo de Amenaza | Descripción | Capa de Detección |
|----------------|-------------|------------------|
| Gusanos de ejecución automática | Explotan `autorun.inf` para ejecutarse en Windows | Reglas YARA |
| Droppers USB | Ejecutables disfrazados (p. ej., `document.pdf.exe`) | Heurístico + YARA |
| Cargas útiles BadUSB | Scripts dirigidos a ataques de emulación HID | Análisis de archivos |
| Portadores de ransomware | Cargas útiles cifradas que se activan al copiarse | Hash + YARA |
| Herramientas de exfiltración de datos | Utilidades diseñadas para recopilar y extraer datos | Análisis heurístico |

## Integración con el Monitoreo en Tiempo Real

Puedes combinar el escaneo USB con el demonio `sd monitor` para escanear automáticamente los dispositivos USB cuando se conectan:

```bash
sd monitor --watch-usb /home /tmp
```

Esto inicia el monitor de archivos en tiempo real y agrega capacidad de escaneo automático USB. Cuando se detecta un nuevo dispositivo USB vía udev, se escanea automáticamente.

::: tip Modo Kiosco
Para terminales públicas o estaciones de trabajo compartidas, combina `--watch-usb` con `--auto-quarantine` para neutralizar automáticamente las amenazas de dispositivos USB sin intervención del usuario.
:::

## Próximos Pasos

- [Escaneo de Archivos y Directorios](./file-scan) -- Referencia completa para `sd scan`
- [Escaneo de Memoria](./memory-scan) -- Escanear la memoria de procesos en ejecución
- [Detección de Rootkits](./rootkit) -- Verificar amenazas a nivel de sistema
- [Motor de Detección](../detection/) -- Cómo funciona el pipeline multicapa
